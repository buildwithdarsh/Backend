import { type ScopedClient, toQs } from '../client';
import type {
  KycVerification,
  KycStatusResponse,
  BankAccount,
  BankAccountBalance,
  BankTransaction,
  Beneficiary,
  BankCard,
  FixedDeposit,
  FixedDepositClosure,
  ScheduledTransfer,
  BillPayment,
  SpendingBreakdown,
  MonthlyTrends,
  CashFlowSummary,
  BudgetItem,
  AnomalyAlert,
  NetWorthSnapshot,
  SpendingCategory,
} from '../types';
import type {
  SubmitKycDto,
  UpdateAccountNicknameDto,
  SetAutoSweepDto,
  GetStatementQuery,
  CreateFixedDepositDto,
  InitiateTransferDto,
  AddBeneficiaryDto,
  CreateScheduledTransferDto,
  PayBillDto,
  ListBillPaymentsQuery,
  GenerateVirtualCardDto,
  UpdateCardLimitsDto,
  ToggleInternationalDto,
  ToggleCardFeatureDto,
  SetBudgetDto,
  GetAnomalyAlertsQuery,
  PaginatedQuery,
} from '../dto';

export function createStorefrontBanking(c: ScopedClient) {
  return {
    // ─── KYC ────────────────────────────────────────────────────────
    kyc: {
      submit(data: SubmitKycDto) {
        return c.post<KycVerification>('/banking/kyc', data, 'enduser');
      },
      getStatus() {
        return c.get<KycStatusResponse>('/banking/kyc/status', 'enduser');
      },
    },

    // ─── Accounts ───────────────────────────────────────────────────
    accounts: {
      list() {
        return c.get<BankAccount[]>('/banking/accounts', 'enduser');
      },
      get(id: string) {
        return c.get<BankAccount>(`/banking/accounts/${id}`, 'enduser');
      },
      getBalance(id: string) {
        return c.get<BankAccountBalance>(`/banking/accounts/${id}/balance`, 'enduser');
      },
      updateNickname(id: string, data: UpdateAccountNicknameDto) {
        return c.patch<BankAccount>(`/banking/accounts/${id}/nickname`, data, 'enduser');
      },
      setAutoSweep(id: string, data: SetAutoSweepDto) {
        return c.patch<BankAccount>(`/banking/accounts/${id}/auto-sweep`, data, 'enduser');
      },
      getStatement(id: string, params?: GetStatementQuery) {
        return c.paginated<BankTransaction>(`/banking/accounts/${id}/statement`, params, 'enduser');
      },
    },

    // ─── Fixed Deposits ─────────────────────────────────────────────
    fixedDeposits: {
      list() {
        return c.get<FixedDeposit[]>('/banking/accounts/fixed-deposits/list', 'enduser');
      },
      create(data: CreateFixedDepositDto) {
        return c.post<FixedDeposit>('/banking/accounts/fixed-deposits', data, 'enduser');
      },
      close(fdId: string) {
        return c.del<FixedDepositClosure>(`/banking/accounts/fixed-deposits/${fdId}`, 'enduser');
      },
    },

    // ─── Transfers ──────────────────────────────────────────────────
    transfers: {
      initiate(data: InitiateTransferDto) {
        return c.post<BankTransaction>('/banking/transfers', data, 'enduser');
      },
    },

    // ─── Beneficiaries ──────────────────────────────────────────────
    beneficiaries: {
      list() {
        return c.get<Beneficiary[]>('/banking/transfers/beneficiaries', 'enduser');
      },
      add(data: AddBeneficiaryDto) {
        return c.post<Beneficiary>('/banking/transfers/beneficiaries', data, 'enduser');
      },
      remove(id: string) {
        return c.del<Beneficiary>(`/banking/transfers/beneficiaries/${id}`, 'enduser');
      },
      toggleFavorite(id: string) {
        return c.patch<Beneficiary>(`/banking/transfers/beneficiaries/${id}/favorite`, {}, 'enduser');
      },
    },

    // ─── Scheduled Transfers ────────────────────────────────────────
    scheduledTransfers: {
      list() {
        return c.get<ScheduledTransfer[]>('/banking/transfers/scheduled', 'enduser');
      },
      create(data: CreateScheduledTransferDto) {
        return c.post<ScheduledTransfer>('/banking/transfers/scheduled', data, 'enduser');
      },
      cancel(id: string) {
        return c.del<ScheduledTransfer>(`/banking/transfers/scheduled/${id}`, 'enduser');
      },
    },

    // ─── Bill Payments ──────────────────────────────────────────────
    bills: {
      pay(data: PayBillDto) {
        return c.post<BillPayment>('/banking/transfers/bills', data, 'enduser');
      },
      list(params?: ListBillPaymentsQuery) {
        return c.paginated<BillPayment>('/banking/transfers/bills', params, 'enduser');
      },
    },

    // ─── Cards ──────────────────────────────────────────────────────
    cards: {
      list() {
        return c.get<BankCard[]>('/banking/cards', 'enduser');
      },
      get(id: string) {
        return c.get<BankCard>(`/banking/cards/${id}`, 'enduser');
      },
      generateVirtual(data: GenerateVirtualCardDto) {
        return c.post<BankCard>('/banking/cards', data, 'enduser');
      },
      block(id: string) {
        return c.post<BankCard>(`/banking/cards/${id}/block`, {}, 'enduser');
      },
      unblock(id: string) {
        return c.post<BankCard>(`/banking/cards/${id}/unblock`, {}, 'enduser');
      },
      updateLimits(id: string, data: UpdateCardLimitsDto) {
        return c.patch<BankCard>(`/banking/cards/${id}/limits`, data, 'enduser');
      },
      toggleInternational(id: string, data: ToggleInternationalDto) {
        return c.patch<BankCard>(`/banking/cards/${id}/international`, data, 'enduser');
      },
      toggleContactless(id: string, data: ToggleCardFeatureDto) {
        return c.patch<BankCard>(`/banking/cards/${id}/contactless`, data, 'enduser');
      },
      toggleOnline(id: string, data: ToggleCardFeatureDto) {
        return c.patch<BankCard>(`/banking/cards/${id}/online`, data, 'enduser');
      },
    },

    // ─── Analytics ──────────────────────────────────────────────────
    analytics: {
      getSpendingBreakdown(months?: number) {
        return c.get<SpendingBreakdown>(`/banking/analytics/spending${toQs({ months })}`, 'enduser');
      },
      getMonthlyTrends(months?: number) {
        return c.get<MonthlyTrends>(`/banking/analytics/trends${toQs({ months })}`, 'enduser');
      },
      getCashFlow(startDate?: string, endDate?: string) {
        return c.get<CashFlowSummary>(`/banking/analytics/cash-flow${toQs({ startDate, endDate })}`, 'enduser');
      },
      getNetWorth() {
        return c.get<NetWorthSnapshot>('/banking/analytics/net-worth', 'enduser');
      },
      getCategories() {
        return c.get<SpendingCategory[]>('/banking/analytics/categories');
      },
    },

    // ─── Budgets ────────────────────────────────────────────────────
    budgets: {
      list() {
        return c.get<BudgetItem[]>('/banking/analytics/budgets', 'enduser');
      },
      set(data: SetBudgetDto) {
        return c.post<BudgetItem>('/banking/analytics/budgets', data, 'enduser');
      },
      remove(category: string) {
        return c.del<BudgetItem>(`/banking/analytics/budgets/${category}`, 'enduser');
      },
    },

    // ─── Anomaly Alerts ─────────────────────────────────────────────
    alerts: {
      list(params?: GetAnomalyAlertsQuery) {
        return c.paginated<AnomalyAlert>('/banking/analytics/alerts', params, 'enduser');
      },
      markRead(id: string) {
        return c.post<AnomalyAlert>(`/banking/analytics/alerts/${id}/read`, {}, 'enduser');
      },
      dismiss(id: string) {
        return c.post<AnomalyAlert>(`/banking/analytics/alerts/${id}/dismiss`, {}, 'enduser');
      },
    },
  };
}
