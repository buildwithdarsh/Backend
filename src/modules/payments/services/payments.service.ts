import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service.js';
import { QueryPaymentsDto } from '../dto/query-payments.dto.js';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string, dto: QueryPaymentsDto) {
    const where: Prisma.PaymentWhereInput = {
      orgId,
    };

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.currency) {
      where.currency = dto.currency;
    }

    if (dto.search) {
      where.OR = [
        { providerPaymentId: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.PaymentOrderByWithRelationInput = {
      [dto.sortBy ?? 'createdAt']: dto.sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
        include: {
          orders: true,
          subscription: true,
          refunds: true,
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: dto.page,
        limit: dto.limit,
        total,
        totalPages: Math.ceil(total / dto.limit),
      },
    };
  }

  async findOne(orgId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, orgId },
      include: {
        orders: true,
        subscription: true,
        refunds: true,
        endUser: true,
        user: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }

    return payment;
  }
}
