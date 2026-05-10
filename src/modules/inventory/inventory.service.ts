import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { OrgSettingsService } from '../org-settings/org-settings.service.js';
import {
  CreateIngredientDto,
  UpdateIngredientDto,
  CreateWasteLogDto,
  QueryInventoryDto,
} from './dto/index.js';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    _orgSettings: OrgSettingsService,
  ) {}

  // ─── Ingredients CRUD ─────────────────────────────────────────────────────

  /**
   * List ingredients with pagination.
   */
  async findAll(orgId: string, query: QueryInventoryDto) {
    const where: Prisma.IngredientWhereInput = { orgId };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.ingredient.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { supplier: { select: { name: true } } },
      }),
      this.prisma.ingredient.count({ where }),
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
   * Get a single ingredient.
   */
  async findOne(orgId: string, id: string) {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id, orgId },
      include: { supplier: { select: { name: true } } },
    });

    if (!ingredient) {
      throw new NotFoundException(`Ingredient ${id} not found`);
    }

    return ingredient;
  }

  /**
   * Create an ingredient.
   */
  async create(orgId: string, dto: CreateIngredientDto) {
    const ingredient = await this.prisma.ingredient.create({
      data: {
        orgId,
        name: dto.name,
        unit: dto.unit,
        ...(dto.currentStock !== undefined && { currentStock: dto.currentStock }),
        ...(dto.minStock !== undefined && { minStock: dto.minStock }),
        ...(dto.costPerUnit !== undefined && { costPerUnit: dto.costPerUnit }),
        supplierId: dto.supplierId ?? null,
      },
    });

    // Auto-create stock alert if below minimum
    if (
      ingredient.currentStock != null &&
      ingredient.minStock != null &&
      Number(ingredient.currentStock) < Number(ingredient.minStock)
    ) {
      await this.prisma.stockAlert.create({
        data: {
          orgId,
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          type: 'low_stock',
          message: `${ingredient.name} stock (${Number(ingredient.currentStock)}) is below minimum (${Number(ingredient.minStock)})`,
        },
      });
      this.logger.warn(`Stock alert created for ingredient ${ingredient.name} (${ingredient.id})`);
    }

    this.logger.log(`Ingredient created: ${ingredient.id} (${ingredient.name}) for org ${orgId}`);
    return ingredient;
  }

  /**
   * Update an ingredient.
   */
  async update(orgId: string, id: string, dto: UpdateIngredientDto) {
    const existing = await this.prisma.ingredient.findFirst({
      where: { id, orgId },
    });

    if (!existing) {
      throw new NotFoundException(`Ingredient ${id} not found`);
    }

    const ingredient = await this.prisma.ingredient.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.currentStock !== undefined && { currentStock: dto.currentStock }),
        ...(dto.minStock !== undefined && { minStock: dto.minStock }),
        ...(dto.costPerUnit !== undefined && { costPerUnit: dto.costPerUnit }),
        ...(dto.supplierId !== undefined && { supplierId: dto.supplierId ?? null }),
      },
    });

    // Check stock levels and auto-create alert if needed
    if (
      ingredient.currentStock != null &&
      ingredient.minStock != null &&
      Number(ingredient.currentStock) < Number(ingredient.minStock)
    ) {
      const unresolvedAlert = await this.prisma.stockAlert.findFirst({
        where: { ingredientId: id, orgId, isResolved: false },
      });

      if (!unresolvedAlert) {
        await this.prisma.stockAlert.create({
          data: {
            orgId,
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            type: 'low_stock',
            message: `${ingredient.name} stock (${Number(ingredient.currentStock)}) is below minimum (${Number(ingredient.minStock)})`,
          },
        });
        this.logger.warn(`Stock alert created for ingredient ${ingredient.name} (${ingredient.id})`);
      }
    }

    this.logger.log(`Ingredient updated: ${ingredient.id} for org ${orgId}`);
    return ingredient;
  }

  /**
   * Delete an ingredient.
   */
  async remove(orgId: string, id: string) {
    const existing = await this.prisma.ingredient.findFirst({
      where: { id, orgId },
    });

    if (!existing) {
      throw new NotFoundException(`Ingredient ${id} not found`);
    }

    await this.prisma.ingredient.delete({ where: { id } });

    this.logger.log(`Ingredient deleted: ${id} for org ${orgId}`);
    return { deleted: true };
  }

  // ─── Stock Alerts ─────────────────────────────────────────────────────────

  /**
   * List all stock alerts for the org.
   */
  async findAlerts(orgId: string) {
    return this.prisma.stockAlert.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mark a stock alert as resolved.
   */
  async resolveAlert(orgId: string, id: string) {
    const alert = await this.prisma.stockAlert.findFirst({
      where: { id, orgId },
    });

    if (!alert) {
      throw new NotFoundException(`Stock alert ${id} not found`);
    }

    return this.prisma.stockAlert.update({
      where: { id },
      data: { isResolved: true },
    });
  }

  // ─── Waste Logs ───────────────────────────────────────────────────────────

  /**
   * List all waste logs for the org.
   */
  async findWasteLogs(orgId: string) {
    return this.prisma.wasteLog.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a waste log entry and deduct stock.
   */
  async createWasteLog(orgId: string, dto: CreateWasteLogDto) {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id: dto.ingredientId, orgId },
    });

    if (!ingredient) {
      throw new NotFoundException(`Ingredient ${dto.ingredientId} not found`);
    }

    const costImpact = dto.quantity * Number(ingredient.costPerUnit ?? 0);

    // Deduct stock from ingredient
    const newStock = Math.max(0, Number(ingredient.currentStock ?? 0) - dto.quantity);
    await this.prisma.ingredient.update({
      where: { id: ingredient.id },
      data: { currentStock: newStock },
    });

    // Create the waste log
    const wasteLog = await this.prisma.wasteLog.create({
      data: {
        orgId,
        ingredientId: dto.ingredientId,
        ingredientName: ingredient.name,
        quantity: dto.quantity,
        reason: dto.reason,
        costImpact,
      },
    });

    // Create stock alert if stock drops below minimum
    if (
      ingredient.minStock != null &&
      newStock < Number(ingredient.minStock)
    ) {
      const unresolvedAlert = await this.prisma.stockAlert.findFirst({
        where: { ingredientId: ingredient.id, orgId, isResolved: false },
      });

      if (!unresolvedAlert) {
        await this.prisma.stockAlert.create({
          data: {
            orgId,
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            type: 'low_stock',
            message: `${ingredient.name} stock (${newStock}) is below minimum (${Number(ingredient.minStock)})`,
          },
        });
        this.logger.warn(`Stock alert created after waste log for ingredient ${ingredient.name}`);
      }
    }

    this.logger.log(`Waste log created: ${wasteLog.id} for ingredient ${ingredient.name}`);
    return wasteLog;
  }
}
