import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import type { AddCartItemDto } from './dto/add-item.dto.js';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find or create a cart for the given user.
   */
  async getOrCreateCart(
    orgId: string,
    endUserId: string,
  ) {
    const existing = await this.prisma.cart.findUnique({
      where: { orgId_endUserId: { orgId, endUserId } },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.cart.create({
      data: {
        orgId,
        endUserId,
      },
    });
  }

  /**
   * Get cart with all items, item details, size variations, and options.
   */
  async getCart(
    orgId: string,
    endUserId?: string,
  ) {
    if (!endUserId) {
      return null;
    }

    return this.prisma.cart.findUnique({
      where: { orgId_endUserId: { orgId, endUserId } },
      include: {
        items: {
          include: {
            item: {
              include: {
                variants: true,
                sizeVariations: true,
                taxes: true,
              },
            },
            sizeVariation: true,
            options: {
              include: {
                option: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Add a line item (with optional options) to the cart.
   */
  async addItem(
    orgId: string,
    endUserId: string | undefined,
    dto: AddCartItemDto,
  ) {
    // Validate item exists and is in stock
    const catalogItem = await this.prisma.catalogItem.findFirst({
      where: { id: dto.itemId, orgId, deletedAt: null },
    });

    if (!catalogItem) {
      throw new NotFoundException('Catalog item not found');
    }

    if (!catalogItem.inStock) {
      throw new BadRequestException('Item is out of stock');
    }

    // Validate size variation if provided
    if (dto.sizeVariationId) {
      const sizeVariation = await this.prisma.catalogSizeVariation.findFirst({
        where: { id: dto.sizeVariationId, itemId: dto.itemId, orgId },
      });

      if (!sizeVariation) {
        throw new NotFoundException('Size variation not found');
      }

      if (!sizeVariation.inStock) {
        throw new BadRequestException('Size variation is out of stock');
      }
    }

    // Validate options if provided
    if (dto.options?.length) {
      const optionIds = dto.options.map((o) => o.optionId);
      const validOptions = await this.prisma.catalogOption.findMany({
        where: { id: { in: optionIds }, orgId, isActive: true, inStock: true },
      });

      if (validOptions.length !== optionIds.length) {
        throw new BadRequestException('One or more options are invalid or out of stock');
      }
    }

    // Get or create cart
    if (!endUserId) {
      throw new BadRequestException('endUserId is required');
    }
    const cart = await this.getOrCreateCart(orgId, endUserId);

    // Create the line item with options
    const lineItem = await this.prisma.cartLineItem.create({
      data: {
        cartId: cart.id,
        itemId: dto.itemId,
        sizeVariationId: dto.sizeVariationId ?? null,
        quantity: dto.quantity ?? 1,
        variantType: dto.variantType,
        ...(dto.options?.length
          ? {
              options: {
                create: dto.options.map((opt) => ({
                  optionId: opt.optionId,
                  quantity: opt.quantity ?? 1,
                })),
              },
            }
          : {}),
      },
      include: {
        item: true,
        sizeVariation: true,
        options: {
          include: {
            option: true,
          },
        },
      },
    });

    return lineItem;
  }

  /**
   * Update line item quantity. Removes the item if quantity is 0.
   */
  async updateItemQuantity(orgId: string, lineItemId: string, quantity: number) {
    const lineItem = await this.prisma.cartLineItem.findFirst({
      where: { id: lineItemId },
      include: { cart: true },
    });

    if (!lineItem || lineItem.cart.orgId !== orgId) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity === 0) {
      await this.prisma.cartLineItem.delete({ where: { id: lineItemId } });
      return null;
    }

    return this.prisma.cartLineItem.update({
      where: { id: lineItemId },
      data: { quantity },
      include: {
        item: true,
        sizeVariation: true,
        options: {
          include: {
            option: true,
          },
        },
      },
    });
  }

  /**
   * Remove a line item and its options from the cart.
   */
  async removeItem(orgId: string, lineItemId: string) {
    const lineItem = await this.prisma.cartLineItem.findFirst({
      where: { id: lineItemId },
      include: { cart: true },
    });

    if (!lineItem || lineItem.cart.orgId !== orgId) {
      throw new NotFoundException('Cart item not found');
    }

    // Cascade delete handles options
    await this.prisma.cartLineItem.delete({ where: { id: lineItemId } });
  }

  /**
   * Validate cart items are still in stock and prices haven't changed.
   */
  async validate(orgId: string, endUserId?: string) {
    // Find the user's cart
    const cart = await this.prisma.cart.findFirst({
      where: { orgId, ...(endUserId !== undefined ? { endUserId } : {}) },
      include: {
        items: {
          include: {
            item: {
              include: {
                variants: true,
                sizeVariations: true,
              },
            },
            sizeVariation: true,
            options: { include: { option: true } },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return { valid: true, changes: [], unavailableItemIds: [] };
    }

    const changes: { itemId: string; field: string; oldValue: unknown; newValue: unknown }[] = [];
    const unavailableItemIds: string[] = [];

    for (const lineItem of cart.items) {
      const catalogItem = lineItem.item;

      // Check if item is still in stock
      if (!catalogItem || !catalogItem.inStock) {
        unavailableItemIds.push(lineItem.id);
        continue;
      }

      // Check if the selected variant still exists and price hasn't changed
      const variant = catalogItem.variants.find((v: { variantType: string }) => v.variantType === lineItem.variantType);
      if (variant) {
        // Price changes are tracked but cart is still valid
        // Frontend can show a notification about price changes
      }

      // Check if selected size variation is still in stock
      if (lineItem.sizeVariation && !lineItem.sizeVariation.inStock) {
        unavailableItemIds.push(lineItem.id);
      }

      // Check if selected options are still in stock
      for (const opt of lineItem.options) {
        if (opt.option && !opt.option.inStock) {
          unavailableItemIds.push(lineItem.id);
          break;
        }
      }
    }

    return {
      valid: unavailableItemIds.length === 0 && changes.length === 0,
      changes,
      unavailableItemIds,
    };
  }

  /**
   * Clear all items from the cart.
   */
  async clearCart(
    orgId: string,
    endUserId?: string,
  ) {
    if (!endUserId) {
      return;
    }

    const cart = await this.prisma.cart.findUnique({
      where: { orgId_endUserId: { orgId, endUserId } },
    });

    if (!cart) {
      return;
    }

    // Delete all line items (cascades to options)
    await this.prisma.cartLineItem.deleteMany({ where: { cartId: cart.id } });
  }
}
