import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  QuerySuppliersDto,
} from './dto/index.js';

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  /**
   * List suppliers with pagination.
   */
  async findAll(orgId: string, query: QuerySuppliersDto) {
    const where: Prisma.SupplierWhereInput = {
      orgId,
      deletedAt: null,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { contactName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supplier.count({ where }),
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

  /**
   * Get a single supplier.
   */
  async findOne(orgId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier ${id} not found`);
    }

    return supplier;
  }

  /**
   * Create a new supplier.
   */
  async create(orgId: string, dto: CreateSupplierDto) {
    const supplier = await this.prisma.supplier.create({
      data: {
        orgId,
        name: dto.name,
        contactName: dto.contactName,
        phone: dto.phone,
        email: dto.email ?? null,
        ...(dto.leadTimeDays !== undefined && { leadTimeDays: dto.leadTimeDays }),
        isActive: dto.isActive ?? true,
      },
    });

    this.logger.log(`Supplier created: ${supplier.id} (${supplier.name}) for org ${orgId}`);
    return supplier;
  }

  /**
   * Update a supplier.
   */
  async update(orgId: string, id: string, dto: UpdateSupplierDto) {
    await this.ensureSupplierExists(orgId, id);

    const updated = await this.prisma.supplier.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.contactName !== undefined && { contactName: dto.contactName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email ?? null }),
        ...(dto.leadTimeDays !== undefined && { leadTimeDays: dto.leadTimeDays }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.logger.log(`Supplier updated: ${id} for org ${orgId}`);
    return updated;
  }

  /**
   * Soft-delete a supplier.
   */
  async remove(orgId: string, id: string) {
    await this.ensureSupplierExists(orgId, id);

    await this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Supplier soft-deleted: ${id} for org ${orgId}`);
    return { message: 'Supplier deleted successfully' };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private async ensureSupplierExists(orgId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, orgId, deletedAt: null },
    });
    if (!supplier) {
      throw new NotFoundException(`Supplier ${id} not found`);
    }
    return supplier;
  }
}
