import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateItemDto,
  UpdateItemDto,
  CreateItemVariantDto,
  CreateOptionGroupDto,
  CreateOptionDto,
  QueryItemsDto,
} from './dto/index.js';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Categories ──────────────────────────────────────────────────────────────

  /**
   * List all categories for an org (optionally only active ones).
   */
  async findAllCategories(orgId: string, activeOnly = false) {
    const where: Prisma.CatalogCategoryWhereInput = {
      orgId,
      deletedAt: null,
    };

    if (activeOnly) {
      where.isActive = true;
    }

    return this.prisma.catalogCategory.findMany({
      where,
      orderBy: { rank: 'asc' },
      include: { children: activeOnly ? { where: { isActive: true, deletedAt: null } } : true },
    });
  }

  /**
   * Create a new category.
   */
  async createCategory(orgId: string, dto: CreateCategoryDto) {
    const category = await this.prisma.catalogCategory.create({
      data: {
        orgId,
        name: dto.name,
        slug: dto.slug,
        imageUrl: dto.imageUrl ?? null,
        rank: dto.rank ?? 0,
        parentId: dto.parentId ?? null,
        isActive: dto.isActive ?? true,
      },
    });

    this.logger.log(`Category created: ${category.id} (${category.slug}) for org ${orgId}`);
    return category;
  }

  /**
   * Update a category.
   */
  async updateCategory(orgId: string, id: string, dto: UpdateCategoryDto) {
    await this.ensureCategoryExists(orgId, id);

    const updated = await this.prisma.catalogCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl ?? null }),
        ...(dto.rank !== undefined && { rank: dto.rank }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId ?? null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.logger.log(`Category updated: ${id} for org ${orgId}`);
    return updated;
  }

  /**
   * Soft-delete a category.
   */
  async deleteCategory(orgId: string, id: string) {
    await this.ensureCategoryExists(orgId, id);

    await this.prisma.catalogCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Category soft-deleted: ${id} for org ${orgId}`);
    return { message: 'Category deleted successfully' };
  }

  // ─── Items ───────────────────────────────────────────────────────────────────

  /**
   * List items with pagination, filtering, and eager-loading.
   */
  async findAllItems(orgId: string, query: QueryItemsDto) {
    const where: Prisma.CatalogItemWhereInput = {
      orgId,
      deletedAt: null,
    };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.search) {
      where.OR = [
        { slug: { contains: query.search, mode: 'insensitive' } },
        { variants: { some: { name: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    if (query.dietType) {
      where.dietType = query.dietType;
    }

    if (query.inStock !== undefined) {
      where.inStock = query.inStock;
    }

    if (query.isFeatured !== undefined) {
      where.isFeatured = query.isFeatured;
    }

    if (query.variantType) {
      where.variants = {
        some: { variantType: query.variantType },
      };
    }

    const orderBy: Prisma.CatalogItemOrderByWithRelationInput = {
      sortOrder: 'asc',
    };

    const [data, total] = await Promise.all([
      this.prisma.catalogItem.findMany({
        where,
        orderBy,
        skip: query.skip,
        take: query.limit,
        include: {
          variants: true,
          sizeVariations: { orderBy: { sortOrder: 'asc' } },
          optionGroups: {
            orderBy: { rank: 'asc' },
            include: {
              options: { orderBy: { rank: 'asc' } },
            },
          },
          category: true,
        },
      }),
      this.prisma.catalogItem.count({ where }),
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
   * Get a single item with full includes.
   */
  async findOneItem(orgId: string, id: string) {
    const item = await this.prisma.catalogItem.findFirst({
      where: { id, orgId, deletedAt: null },
      include: {
        category: true,
        variants: true,
        sizeVariations: { orderBy: { sortOrder: 'asc' } },
        optionGroups: {
          orderBy: { rank: 'asc' },
          include: {
            options: { orderBy: { rank: 'asc' } },
          },
        },
        taxes: true,
        locationOverrides: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Catalog item ${id} not found`);
    }

    return item;
  }

  /**
   * Create a new catalog item.
   */
  async createItem(orgId: string, dto: CreateItemDto) {
    const item = await this.prisma.catalogItem.create({
      data: {
        orgId,
        categoryId: dto.categoryId,
        slug: dto.slug,
        dietType: dto.dietType ?? null,
        inStock: dto.inStock ?? true,
        sortOrder: dto.sortOrder ?? 0,
        isFeatured: dto.isFeatured ?? false,
        isNew: dto.isNew ?? false,
        allergens: dto.allergens ?? [],
        tags: dto.tags ?? [],
        taxConfig: (dto.taxConfig as Prisma.InputJsonValue) ?? null,
        metadata: (dto.metadata as Prisma.InputJsonValue) ?? null,
      },
      include: {
        category: true,
        variants: true,
      },
    });

    this.logger.log(`Item created: ${item.id} (${item.slug}) for org ${orgId}`);
    return item;
  }

  /**
   * Update a catalog item.
   */
  async updateItem(orgId: string, id: string, dto: UpdateItemDto) {
    await this.ensureItemExists(orgId, id);

    const updated = await this.prisma.catalogItem.update({
      where: { id },
      data: {
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.dietType !== undefined && { dietType: dto.dietType ?? null }),
        ...(dto.inStock !== undefined && { inStock: dto.inStock }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
        ...(dto.isNew !== undefined && { isNew: dto.isNew }),
        ...(dto.allergens !== undefined && { allergens: dto.allergens }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.taxConfig !== undefined && { taxConfig: (dto.taxConfig as Prisma.InputJsonValue) ?? null }),
        ...(dto.metadata !== undefined && { metadata: (dto.metadata as Prisma.InputJsonValue) ?? null }),
      },
      include: {
        category: true,
        variants: true,
        optionGroups: {
          include: { options: true },
        },
      },
    });

    this.logger.log(`Item updated: ${id} for org ${orgId}`);
    return updated;
  }

  /**
   * Soft-delete a catalog item.
   */
  async deleteItem(orgId: string, id: string) {
    await this.ensureItemExists(orgId, id);

    await this.prisma.catalogItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Item soft-deleted: ${id} for org ${orgId}`);
    return { message: 'Item deleted successfully' };
  }

  // ─── Variants ────────────────────────────────────────────────────────────────

  /**
   * Create a variant for a catalog item.
   */
  async createItemVariant(orgId: string, itemId: string, dto: CreateItemVariantDto) {
    await this.ensureItemExists(orgId, itemId);

    const variant = await this.prisma.catalogItemVariant.create({
      data: {
        orgId,
        itemId,
        variantType: dto.variantType,
        name: dto.name,
        price: dto.price,
        description: dto.description ?? null,
        imageUrl: dto.imageUrl ?? null,
        nutritionData: (dto.nutritionData as Prisma.InputJsonValue) ?? null,
        isActive: dto.isActive ?? true,
      },
    });

    this.logger.log(`Variant created: ${variant.id} for item ${itemId}`);
    return variant;
  }

  /**
   * Update an item variant.
   */
  async updateItemVariant(orgId: string, id: string, dto: Partial<CreateItemVariantDto>) {
    await this.ensureVariantExists(orgId, id);

    const updated = await this.prisma.catalogItemVariant.update({
      where: { id },
      data: {
        ...(dto.variantType !== undefined && { variantType: dto.variantType }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.description !== undefined && { description: dto.description ?? null }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl ?? null }),
        ...(dto.nutritionData !== undefined && { nutritionData: (dto.nutritionData as Prisma.InputJsonValue) ?? null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.logger.log(`Variant updated: ${id}`);
    return updated;
  }

  /**
   * Delete an item variant.
   */
  async deleteItemVariant(orgId: string, id: string) {
    await this.ensureVariantExists(orgId, id);

    await this.prisma.catalogItemVariant.delete({ where: { id } });

    this.logger.log(`Variant deleted: ${id}`);
    return { message: 'Variant deleted successfully' };
  }

  // ─── Option Groups & Options ─────────────────────────────────────────────────

  /**
   * Create an option group for a catalog item.
   */
  async createOptionGroup(orgId: string, itemId: string, dto: CreateOptionGroupDto) {
    await this.ensureItemExists(orgId, itemId);

    const group = await this.prisma.catalogOptionGroup.create({
      data: {
        orgId,
        itemId,
        name: dto.name,
        minSelection: dto.minSelection ?? 0,
        maxSelection: dto.maxSelection ?? 10,
        rank: dto.rank ?? 0,
      },
      include: { options: true },
    });

    this.logger.log(`Option group created: ${group.id} for item ${itemId}`);
    return group;
  }

  /**
   * Update an option group.
   */
  async updateOptionGroup(orgId: string, id: string, dto: Partial<CreateOptionGroupDto>) {
    await this.ensureOptionGroupExists(orgId, id);

    const updated = await this.prisma.catalogOptionGroup.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.minSelection !== undefined && { minSelection: dto.minSelection }),
        ...(dto.maxSelection !== undefined && { maxSelection: dto.maxSelection }),
        ...(dto.rank !== undefined && { rank: dto.rank }),
      },
      include: { options: true },
    });

    this.logger.log(`Option group updated: ${id}`);
    return updated;
  }

  /**
   * Delete an option group (cascades options via Prisma onDelete: Cascade).
   */
  async deleteOptionGroup(orgId: string, id: string) {
    await this.ensureOptionGroupExists(orgId, id);

    await this.prisma.catalogOptionGroup.delete({ where: { id } });

    this.logger.log(`Option group deleted: ${id}`);
    return { message: 'Option group deleted successfully' };
  }

  /**
   * Create an option within an option group.
   */
  async createOption(orgId: string, groupId: string, dto: CreateOptionDto) {
    await this.ensureOptionGroupExists(orgId, groupId);

    const option = await this.prisma.catalogOption.create({
      data: {
        orgId,
        groupId,
        name: dto.name,
        price: dto.price,
        inStock: dto.inStock ?? true,
        rank: dto.rank ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    this.logger.log(`Option created: ${option.id} for group ${groupId}`);
    return option;
  }

  /**
   * Update an option.
   */
  async updateOption(orgId: string, id: string, dto: Partial<CreateOptionDto>) {
    await this.ensureOptionExists(orgId, id);

    const updated = await this.prisma.catalogOption.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.inStock !== undefined && { inStock: dto.inStock }),
        ...(dto.rank !== undefined && { rank: dto.rank }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.logger.log(`Option updated: ${id}`);
    return updated;
  }

  /**
   * Delete an option.
   */
  async deleteOption(orgId: string, id: string) {
    await this.ensureOptionExists(orgId, id);

    await this.prisma.catalogOption.delete({ where: { id } });

    this.logger.log(`Option deleted: ${id}`);
    return { message: 'Option deleted successfully' };
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  private async ensureCategoryExists(orgId: string, id: string) {
    const category = await this.prisma.catalogCategory.findFirst({
      where: { id, orgId, deletedAt: null },
    });
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  private async ensureItemExists(orgId: string, id: string) {
    const item = await this.prisma.catalogItem.findFirst({
      where: { id, orgId, deletedAt: null },
    });
    if (!item) {
      throw new NotFoundException(`Catalog item ${id} not found`);
    }
    return item;
  }

  private async ensureVariantExists(orgId: string, id: string) {
    const variant = await this.prisma.catalogItemVariant.findFirst({
      where: { id, orgId },
    });
    if (!variant) {
      throw new NotFoundException(`Variant ${id} not found`);
    }
    return variant;
  }

  private async ensureOptionGroupExists(orgId: string, id: string) {
    const group = await this.prisma.catalogOptionGroup.findFirst({
      where: { id, orgId },
    });
    if (!group) {
      throw new NotFoundException(`Option group ${id} not found`);
    }
    return group;
  }

  private async ensureOptionExists(orgId: string, id: string) {
    const option = await this.prisma.catalogOption.findFirst({
      where: { id, orgId },
    });
    if (!option) {
      throw new NotFoundException(`Option ${id} not found`);
    }
    return option;
  }
}
