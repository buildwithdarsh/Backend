import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class BankingAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Spending Breakdown (FR-023) ────────────────────────────────────

  async getSpendingBreakdown(
    orgId: string,
    endUserId: string,
    months: number = 1,
  ) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const transactions = await this.prisma.bankTransaction.findMany({
      where: {
        orgId,
        endUserId,
        type: 'debit',
        createdAt: { gte: since },
      },
      select: {
        category: true,
        amount: true,
        createdAt: true,
      },
    });

    const categoryTotals: Record<string, number> = {};
    let totalSpent = 0;

    for (const txn of transactions) {
      const cat = txn.category ?? 'uncategorized';
      const amount = Number(txn.amount);
      categoryTotals[cat] = (categoryTotals[cat] ?? 0) + amount;
      totalSpent += amount;
    }

    const breakdown = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { breakdown, totalSpent, period: { months, since: since.toISOString() } };
  }

  // ─── Monthly Trends (FR-023) ────────────────────────────────────────

  async getMonthlyTrends(
    orgId: string,
    endUserId: string,
    months: number = 6,
  ) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const transactions = await this.prisma.bankTransaction.findMany({
      where: {
        orgId,
        endUserId,
        createdAt: { gte: since },
      },
      select: {
        type: true,
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const monthlyData: Record<string, { income: number; expenditure: number }> = {};

    for (const txn of transactions) {
      const key = `${txn.createdAt.getFullYear()}-${String(txn.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { income: 0, expenditure: 0 };
      }
      const amount = Number(txn.amount);
      if (txn.type === 'credit') {
        monthlyData[key].income += amount;
      } else {
        monthlyData[key].expenditure += amount;
      }
    }

    const trends = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      income: data.income,
      expenditure: data.expenditure,
      net: data.income - data.expenditure,
    }));

    return { trends };
  }

  // ─── Cash Flow Summary (FR-025) ────────────────────────────────────

  async getCashFlowSummary(
    orgId: string,
    endUserId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate) : now;

    const transactions = await this.prisma.bankTransaction.findMany({
      where: {
        orgId,
        endUserId,
        createdAt: { gte: start, lte: end },
      },
      select: {
        type: true,
        amount: true,
      },
    });

    let totalIncome = 0;
    let totalExpenditure = 0;

    for (const txn of transactions) {
      const amount = Number(txn.amount);
      if (txn.type === 'credit') {
        totalIncome += amount;
      } else {
        totalExpenditure += amount;
      }
    }

    return {
      totalIncome,
      totalExpenditure,
      netCashFlow: totalIncome - totalExpenditure,
      period: { start: start.toISOString(), end: end.toISOString() },
    };
  }

  // ─── Budgets (FR-024) ──────────────────────────────────────────────

  async listBudgets(orgId: string, endUserId: string) {
    const budgets = await this.prisma.budget.findMany({
      where: { orgId, endUserId, isActive: true },
      orderBy: { category: 'asc' },
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const spending = await this.prisma.bankTransaction.groupBy({
      by: ['category'],
      where: {
        orgId,
        endUserId,
        type: 'debit',
        createdAt: { gte: monthStart },
        category: { in: budgets.map((b) => b.category) },
      },
      _sum: { amount: true },
    });

    const spendingMap: Record<string, number> = {};
    for (const s of spending) {
      if (s.category) {
        spendingMap[s.category] = Number(s._sum.amount ?? 0);
      }
    }

    return budgets.map((budget) => {
      const spent = spendingMap[budget.category] ?? 0;
      const limit = Number(budget.monthlyLimit);
      const utilization = limit > 0 ? Math.round((spent / limit) * 10000) / 100 : 0;
      return {
        ...budget,
        spent,
        utilization,
        isOverBudget: utilization > 100,
        isNearLimit: utilization >= budget.alertAt,
      };
    });
  }

  async setBudget(
    orgId: string,
    endUserId: string,
    data: {
      category: string;
      monthlyLimit: number;
      alertAt?: number;
    },
  ) {
    return this.prisma.budget.upsert({
      where: {
        orgId_endUserId_category: {
          orgId,
          endUserId,
          category: data.category,
        },
      },
      create: {
        orgId,
        endUserId,
        category: data.category,
        monthlyLimit: data.monthlyLimit,
        alertAt: data.alertAt ?? 80,
      },
      update: {
        monthlyLimit: data.monthlyLimit,
        alertAt: data.alertAt ?? 80,
        isActive: true,
      },
    });
  }

  async deleteBudget(orgId: string, endUserId: string, category: string) {
    const budget = await this.prisma.budget.findUnique({
      where: {
        orgId_endUserId_category: { orgId, endUserId, category },
      },
    });
    if (!budget) throw new NotFoundException('Budget not found');

    return this.prisma.budget.update({
      where: { id: budget.id },
      data: { isActive: false },
    });
  }

  // ─── Anomaly Alerts (FR-026) ───────────────────────────────────────

  async getAnomalyAlerts(
    orgId: string,
    endUserId: string,
    page: number,
    limit: number,
    unreadOnly: boolean = false,
  ) {
    const where = {
      orgId,
      endUserId,
      ...(unreadOnly ? { isRead: false, isDismissed: false } : {}),
    };
    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      this.prisma.anomalyAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.anomalyAlert.count({ where }),
    ]);

    return {
      alerts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async markAlertRead(orgId: string, endUserId: string, alertId: string) {
    const alert = await this.prisma.anomalyAlert.findFirst({
      where: { id: alertId, orgId, endUserId },
    });
    if (!alert) throw new NotFoundException('Alert not found');

    return this.prisma.anomalyAlert.update({
      where: { id: alertId },
      data: { isRead: true },
    });
  }

  async dismissAlert(orgId: string, endUserId: string, alertId: string) {
    const alert = await this.prisma.anomalyAlert.findFirst({
      where: { id: alertId, orgId, endUserId },
    });
    if (!alert) throw new NotFoundException('Alert not found');

    return this.prisma.anomalyAlert.update({
      where: { id: alertId },
      data: { isDismissed: true },
    });
  }

  // ─── Net Worth Snapshot (FR-027) ───────────────────────────────────

  async getNetWorthSnapshot(orgId: string, endUserId: string) {
    const [accounts, fixedDeposits] = await Promise.all([
      this.prisma.bankAccount.findMany({
        where: { orgId, endUserId, deletedAt: null, status: 'active' },
        select: { id: true, accountNumber: true, accountType: true, balance: true, nickname: true },
      }),
      this.prisma.fixedDeposit.findMany({
        where: { orgId, endUserId, status: 'active' },
        select: { id: true, fdNumber: true, principalAmount: true, maturityAmount: true, maturityDate: true },
      }),
    ]);

    const accountsTotal = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
    const fdsTotal = fixedDeposits.reduce((sum, fd) => sum + Number(fd.principalAmount), 0);

    return {
      accounts,
      fixedDeposits,
      summary: {
        accountsTotal,
        fixedDepositsTotal: fdsTotal,
        netWorth: accountsTotal + fdsTotal,
      },
    };
  }

  // ─── Spending Categories ───────────────────────────────────────────

  async getSpendingCategories(orgId: string) {
    return this.prisma.spendingCategory.findMany({
      where: { orgId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }
}
