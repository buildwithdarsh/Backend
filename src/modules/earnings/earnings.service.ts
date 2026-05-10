import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class EarningsService {

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get earnings summary for a host: totals, pending, paid, room count.
   */
  async getSummary(orgId: string, hostId: string) {
    const [aggregates, totalRooms] = await Promise.all([
      this.prisma.hostEarning.groupBy({
        by: ['status'],
        where: { orgId, hostId },
        _sum: { hostSharePaise: true },
      }),
      this.prisma.hostEarning.count({
        where: { orgId, hostId },
      }),
    ]);

    let totalPaise = 0;
    let pendingPaise = 0;
    let paidPaise = 0;

    for (const row of aggregates) {
      const sum = row._sum.hostSharePaise ?? 0;
      totalPaise += sum;
      if (row.status === 'pending') pendingPaise = sum;
      if (row.status === 'paid') paidPaise = sum;
    }

    return { totalPaise, pendingPaise, paidPaise, totalRooms };
  }

  /**
   * Get paginated earnings history for a host, joined with PlayFlixRoom for movie info.
   */
  async getHistory(
    orgId: string,
    hostId: string,
    page: number,
    limit: number,
  ) {
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    const [records, total] = await Promise.all([
      this.prisma.hostEarning.findMany({
        where: { orgId, hostId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          room: {
            select: {
              id: true,
              movieTitle: true,
              posterUrl: true,
              startedAt: true,
              endedAt: true,
            },
          },
        },
      }),
      this.prisma.hostEarning.count({
        where: { orgId, hostId },
      }),
    ]);

    return {
      records,
      pagination: {
        page,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }
}
