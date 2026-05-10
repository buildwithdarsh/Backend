import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import {
  QueryPurchaseOrdersDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from './dto/index.js';

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string, query: QueryPurchaseOrdersDto) {
    const where: any = { orgId, deletedAt: null };
    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(orgId: string, id: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, orgId, deletedAt: null },
      include: { items: true },
    });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    return po;
  }

  async create(orgId: string, dto: CreatePurchaseOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findFirstOrThrow({
        where: { id: dto.supplierId, orgId },
      });

      const ingredientIds = dto.items.map((item) => item.ingredientId);
      const ingredients = await tx.ingredient.findMany({
        where: { id: { in: ingredientIds }, orgId },
      });

      const ingredientMap = new Map(
        ingredients.map((ing) => [ing.id, ing.name]),
      );

      let totalAmount = 0;
      const items = dto.items.map((item) => {
        const itemTotal = item.quantity * item.unitPrice;
        totalAmount += itemTotal;
        return {
          orgId,
          ingredientId: item.ingredientId,
          ingredientName: ingredientMap.get(item.ingredientId) ?? '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: itemTotal,
        };
      });

      const timestamp = new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '');
      const randomChars = Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase();
      const poNumber = `PO-${timestamp}-${randomChars}`;

      return tx.purchaseOrder.create({
        data: {
          orgId,
          poNumber,
          supplierId: dto.supplierId,
          supplierName: supplier.name,
          status: 'draft',
          totalAmount,
          items: {
            create: items,
          },
        },
        include: { items: true },
      });
    });
  }

  async update(orgId: string, id: string, dto: UpdatePurchaseOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findFirst({
        where: { id, orgId, deletedAt: null },
        include: { items: true },
      });

      if (!po) {
        throw new NotFoundException('Purchase order not found');
      }

      if (dto.status === 'received' && po.status !== 'received') {
        for (const item of po.items) {
          await tx.ingredient.update({
            where: { id: item.ingredientId },
            data: {
              currentStock: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      return tx.purchaseOrder.update({
        where: { id },
        data: { status: dto.status },
        include: { items: true },
      });
    });
  }

  async remove(orgId: string, id: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
