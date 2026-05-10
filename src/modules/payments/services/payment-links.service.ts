import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service.js';
import { PaymentProviderFactory } from '../providers/payment-provider.factory.js';
import { CreatePaymentLinkDto } from '../dto/create-payment-link.dto.js';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

@Injectable()
export class PaymentLinksService {
  private readonly logger = new Logger(PaymentLinksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: PaymentProviderFactory,
  ) {}

  async create(orgId: string, dto: CreatePaymentLinkDto, userId?: string) {
    const provider = await this.providerFactory.getProvider(orgId);

    const providerLink = await provider.createPaymentLink({
      name: dto.name,
      ...(dto.description !== undefined && { description: dto.description }),
      amount: dto.amount,
      currency: dto.currency,
      type: dto.type,
      ...(dto.successUrl && { successUrl: dto.successUrl }),
      ...(dto.cancelUrl && { cancelUrl: dto.cancelUrl }),
      ...(dto.expiresAt && { expiresAt: new Date(dto.expiresAt) }),
      ...(dto.maxUses !== undefined && { maxUses: dto.maxUses }),
    });

    const linkData: Record<string, unknown> = {
      orgId,
      productId: dto.productId,
      name: dto.name,
      description: dto.description ?? null,
      provider: provider.providerName,
      providerPaymentLinkId: providerLink.id,
      url: providerLink.url,
      ...(dto.currency === 'INR'
        ? { amountInr: dto.amount, currency: 'INR' }
        : { amountUsd: dto.amount, currency: 'USD' }),
      type: dto.type,
    };
    if (dto.expiresAt) linkData['expiresAt'] = new Date(dto.expiresAt);
    if (dto.maxUses !== undefined) linkData['maxUses'] = dto.maxUses;
    if (dto.successUrl !== undefined) linkData['successUrl'] = dto.successUrl;
    if (dto.cancelUrl !== undefined) linkData['cancelUrl'] = dto.cancelUrl;
    if (userId !== undefined) linkData['createdBy'] = userId;

    const paymentLink = await this.prisma.paymentLink.create({
      data: linkData as any,
    });

    this.logger.log(`Payment link created: ${paymentLink.id}`);
    return paymentLink;
  }

  async findAll(orgId: string, dto: PaginationDto) {
    const where: Prisma.PaymentLinkWhereInput = {
      orgId,
      deletedAt: null,
    };

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { description: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.PaymentLinkOrderByWithRelationInput = {
      [dto.sortBy ?? 'createdAt']: dto.sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.paymentLink.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
        include: { product: true },
      }),
      this.prisma.paymentLink.count({ where }),
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
    const link = await this.prisma.paymentLink.findFirst({
      where: { id, orgId, deletedAt: null },
      include: { product: true },
    });

    if (!link) {
      throw new NotFoundException(`Payment link ${id} not found`);
    }

    return link;
  }

  async deactivate(orgId: string, id: string) {
    await this.findOne(orgId, id);

    const link = await this.prisma.paymentLink.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`Payment link deactivated: ${id}`);
    return link;
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);

    await this.prisma.paymentLink.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    this.logger.log(`Payment link soft-deleted: ${id}`);
    return { message: 'Payment link deleted successfully' };
  }
}
