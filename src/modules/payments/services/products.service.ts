import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service.js';
import { CreateProductDto } from '../dto/create-product.dto.js';
import { UpdateProductDto } from '../dto/update-product.dto.js';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: string, dto: CreateProductDto, userId?: string) {
    const product = await this.prisma.product.create({
      data: {
        orgId,
        name: dto.name,
        description: dto.description ?? null,
        type: dto.type,
        priceInr: dto.priceInr ?? null,
        priceUsd: dto.priceUsd ?? null,
        currency: dto.currency,
        razorpayPlanId: dto.razorpayPlanId ?? null,
        stripePriceId: dto.stripePriceId ?? null,
        createdBy: userId ?? null,
      },
    });

    this.logger.log(`Product created: ${product.id} for org ${orgId}`);
    return product;
  }

  async findAll(orgId: string, dto: PaginationDto) {
    const where: Prisma.ProductWhereInput = {
      orgId,
      deletedAt: null,
    };

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { description: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [dto.sortBy ?? 'createdAt']: dto.sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
      }),
      this.prisma.product.count({ where }),
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
    const product = await this.prisma.product.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return product;
  }

  async update(orgId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(orgId, id);

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description ?? null }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.priceInr !== undefined && { priceInr: dto.priceInr ?? null }),
        ...(dto.priceUsd !== undefined && { priceUsd: dto.priceUsd ?? null }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.razorpayPlanId !== undefined && { razorpayPlanId: dto.razorpayPlanId ?? null }),
        ...(dto.stripePriceId !== undefined && { stripePriceId: dto.stripePriceId ?? null }),
      },
    });

    this.logger.log(`Product updated: ${id}`);
    return product;
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    this.logger.log(`Product soft-deleted: ${id}`);
    return { message: 'Product deleted successfully' };
  }
}
