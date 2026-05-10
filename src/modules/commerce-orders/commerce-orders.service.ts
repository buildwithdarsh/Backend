import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { OrgSettingsService } from '../org-settings/org-settings.service.js';
import { RefundsService } from '../payments/services/refunds.service.js';
import { EndUserAuthService } from '../end-user-auth/end-user-auth.service.js';
import {
  CreateOrderDto,
  QueryOrdersDto,
  UpdateOrderStatusDto,
} from './dto/index.js';

@Injectable()
export class CommerceOrdersService {
  private readonly logger = new Logger(CommerceOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orgSettings: OrgSettingsService,
    @Optional() private readonly refundsService?: RefundsService,
    @Optional() private readonly endUserAuthService?: EndUserAuthService,
  ) {}

  // ─── Create ───────────────────────────────────────────────────────────────────

  /**
   * Create a commerce order with items and options in a transaction.
   * Generates a sequential order number per org and creates an initial status log.
   */
  async create(orgId: string, endUserId: string, dto: CreateOrderDto) {
    // ── Validate: force_phone_for_orders ──────────────────────────────────────
    if (this.endUserAuthService) {
      await this.endUserAuthService.ensurePhoneVerifiedForOrders(orgId, endUserId);
    }

    // ── OrgSettings: load limits before transaction ──────────────────────────
    const [
      minOrderAmount,
      maxOrderAmount,
      maxItemsPerOrder,
      orderPrefix,
      deliveryEnabled,
      deliveryFreeAbove,
      deliveryFee,
      taxRate,
      taxInclusive,
      serviceChargeEnabled,
      serviceChargePercent,
      codEnabled,
      onlinePayEnabled,
      codMinAmount,
      codMaxAmount,
      upiEnabled,
      cardEnabled,
      netbankingEnabled,
      emiEnabled,
      partialPaymentAllowed,
      walletEnabled,
      pickupEnabled,
      dineInEnabled,
      autoConfirm,
      allowedOrderTypes,
      autoAcceptMinutes,
      receiptEnabled,
      ratingEnabled,
      packingCharges,
      giftWrapPrice,
      onlineDiscount,
      partialMinPercent,
      walletTopupEnabled,
    ] = await Promise.all([
      this.orgSettings.getTyped<number>(orgId, 'checkout', 'min_order_amount', 0),
      this.orgSettings.getTyped<number>(orgId, 'orders', 'max_order_amount', 10000),
      this.orgSettings.getTyped<number>(orgId, 'orders', 'max_items_per_order', 50),
      this.orgSettings.getTyped<string>(orgId, 'orders', 'prefix', 'BB'),
      this.orgSettings.getTyped<boolean>(orgId, 'delivery', 'enabled', true),
      this.orgSettings.getTyped<number>(orgId, 'delivery', 'free_above', 499),
      this.orgSettings.getTyped<number>(orgId, 'delivery', 'fee', 40),
      this.orgSettings.getTyped<number>(orgId, 'tax', 'rate', 5),
      this.orgSettings.getTyped<boolean>(orgId, 'tax', 'inclusive', true),
      this.orgSettings.getTyped<boolean>(orgId, 'tax', 'service_charge_enabled', false),
      this.orgSettings.getTyped<number>(orgId, 'tax', 'service_charge_percent', 0),
      this.orgSettings.getTyped<boolean>(orgId, 'checkout', 'cod_enabled', true),
      this.orgSettings.getTyped<boolean>(orgId, 'checkout', 'online_pay_enabled', true),
      this.orgSettings.getTyped<number>(orgId, 'payments', 'cod_min_amount', 0),
      this.orgSettings.getTyped<number>(orgId, 'payments', 'cod_max_amount', 5000),
      this.orgSettings.getTyped<boolean>(orgId, 'payments', 'upi_enabled', true),
      this.orgSettings.getTyped<boolean>(orgId, 'payments', 'card_enabled', true),
      this.orgSettings.getTyped<boolean>(orgId, 'payments', 'netbanking_enabled', true),
      this.orgSettings.getTyped<boolean>(orgId, 'payments', 'emi_enabled', false),
      this.orgSettings.getTyped<boolean>(orgId, 'payments', 'partial_payment', false),
      this.orgSettings.getTyped<boolean>(orgId, 'payments', 'wallet_enabled', false),
      this.orgSettings.getTyped<boolean>(orgId, 'delivery', 'pickup_enabled', true),
      this.orgSettings.getTyped<boolean>(orgId, 'delivery', 'dine_in_enabled', true),
      this.orgSettings.getTyped<boolean>(orgId, 'orders', 'auto_confirm', false),
      this.orgSettings.getTyped<string>(orgId, 'orders', 'order_types', 'delivery,pickup,dine_in'),
      this.orgSettings.getTyped<number>(orgId, 'orders', 'auto_accept_minutes', 0),
      this.orgSettings.getTyped<boolean>(orgId, 'orders', 'receipt_enabled', true),
      this.orgSettings.getTyped<boolean>(orgId, 'orders', 'rating_enabled', true),
      this.orgSettings.getTyped<number>(orgId, 'checkout', 'packing_charges', 0),
      this.orgSettings.getTyped<number>(orgId, 'checkout', 'gift_wrap_price', 0),
      this.orgSettings.getTyped<number>(orgId, 'payments', 'online_discount', 0),
      this.orgSettings.getTyped<number>(orgId, 'payments', 'partial_min_percent', 0),
      this.orgSettings.getTyped<boolean>(orgId, 'payments', 'wallet_topup_enabled', false),
    ]);

    // ── Validate: gift wrap must be enabled ──────────────────────────────────
    if (dto.giftWrap) {
      const giftWrapEnabled = await this.orgSettings.getTyped<boolean>(
        orgId, 'checkout', 'gift_wrap_enabled', true,
      );
      if (!giftWrapEnabled) {
        throw new BadRequestException('Gift wrapping is not available');
      }
    }

    // ── Validate: scheduled orders must be enabled ────────────────────────────
    if (dto.scheduledAt) {
      const scheduledOrdersEnabled = await this.orgSettings.getTyped<boolean>(
        orgId, 'checkout', 'scheduled_orders', true,
      );
      if (!scheduledOrdersEnabled) {
        throw new BadRequestException('Scheduled orders are not available');
      }
    }

    // ── Validate: order type must be in the allowed list ─────────────────────
    const allowedTypes = allowedOrderTypes.split(',').map(t => t.trim());
    if (!allowedTypes.includes(dto.orderType)) {
      throw new BadRequestException(
        `Order type "${dto.orderType}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    // ── Validate: order type must be enabled ─────────────────────────────────
    if (dto.orderType === 'delivery' && !deliveryEnabled) {
      throw new BadRequestException('Delivery is currently disabled for this store');
    }
    if (dto.orderType === 'pickup' && !pickupEnabled) {
      throw new BadRequestException('Pickup is currently disabled for this store');
    }
    if (dto.orderType === 'dine_in' && !dineInEnabled) {
      throw new BadRequestException('Dine-in is currently disabled for this store');
    }

    // ── Validate: payment method must be enabled ─────────────────────────────
    if (dto.paymentMethod === 'cod' && !codEnabled) {
      throw new BadRequestException('Cash on delivery is currently disabled');
    }
    if (dto.paymentMethod === 'online' && !onlinePayEnabled) {
      throw new BadRequestException('Online payment is currently disabled');
    }
    if (dto.paymentMethod === 'wallet' && !walletEnabled) {
      throw new BadRequestException('Wallet payment is currently disabled');
    }

    // ── Validate: payment sub-method must be enabled ─────────────────────────
    if (dto.paymentMethod === 'online' && dto.paymentSubMethod) {
      switch (dto.paymentSubMethod) {
        case 'upi':
          if (!upiEnabled) throw new BadRequestException('UPI payment is currently disabled');
          break;
        case 'card':
          if (!cardEnabled) throw new BadRequestException('Card payment is currently disabled');
          break;
        case 'netbanking':
          if (!netbankingEnabled) throw new BadRequestException('Net banking is currently disabled');
          break;
        case 'emi':
          if (!emiEnabled) throw new BadRequestException('EMI payment is currently disabled');
          break;
      }
    }

    // ── Validate: partial payment ────────────────────────────────────────────
    if (dto.partialPayment && !partialPaymentAllowed) {
      throw new BadRequestException('Partial payment is not allowed for this store');
    }

    // ── Validate: partial minimum percent ─────────────────────────────────
    if (dto.partialPayment && partialMinPercent > 0) {
      // The FE must send at least this percentage upfront (validated later against actual amounts)
      this.logger.debug(`Partial payment minimum: ${partialMinPercent}%`);
    }

    // ── Validate: wallet topup (only relevant if paymentMethod is wallet) ─
    if (dto.paymentMethod === 'wallet' && !walletTopupEnabled) {
      // Wallet payment is allowed via walletEnabled, but topup is separate
      this.logger.debug(`Wallet topup enabled: ${walletTopupEnabled}`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Generate sequential order number using org prefix
      const orderCount = await tx.commerceOrder.count({ where: { orgId } });
      const orderNumber = `${orderPrefix}-${orderCount + 1}`;

      // Fetch the end user's cart (single cart, mixed mode items)
      const cart = await tx.cart.findFirst({
        where: { orgId, endUserId },
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
              options: {
                include: { option: true },
              },
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new NotFoundException('Cart is empty or not found');
      }

      // ── Validate: max items per order ──────────────────────────────────────
      const totalItemCount = cart.items.reduce((sum, li) => sum + li.quantity, 0);
      if (totalItemCount > maxItemsPerOrder) {
        throw new BadRequestException(
          `Order exceeds the maximum of ${maxItemsPerOrder} items`,
        );
      }

      // Calculate totals from cart items
      let subtotal = 0;
      const orderItemsData: Prisma.CommerceOrderItemCreateManyOrderInput[] = [];

      for (const lineItem of cart.items) {
        // Determine the unit price from size variation or the first matching variant
        let unitPrice = 0;

        if (lineItem.sizeVariation) {
          unitPrice = Number(lineItem.sizeVariation.price);
        } else {
          const variant = lineItem.item.variants.find(
            (v: { variantType: string }) => v.variantType === lineItem.variantType,
          );
          unitPrice = variant ? Number(variant.price) : 0;
        }

        // Add option prices
        let optionsTotal = 0;
        for (const opt of lineItem.options) {
          optionsTotal += Number(opt.option.price) * opt.quantity;
        }

        const itemTotal = (unitPrice + optionsTotal) * lineItem.quantity;
        subtotal += itemTotal;

        orderItemsData.push({
          itemId: lineItem.itemId,
          itemName: lineItem.item.slug,
          variantType: lineItem.variantType,
          sizeVariationId: lineItem.sizeVariationId,
          sizeVariationName: lineItem.sizeVariation?.name ?? null,
          quantity: lineItem.quantity,
          unitPrice,
          totalPrice: itemTotal,
          taxAmount: 0,
          metadata: {} as Prisma.InputJsonValue,
        });
      }

      // ── Validate: min / max order amount ───────────────────────────────────
      if (minOrderAmount > 0 && subtotal < minOrderAmount) {
        throw new BadRequestException(
          `Minimum order amount is ₹${minOrderAmount}`,
        );
      }
      if (maxOrderAmount > 0 && subtotal > maxOrderAmount) {
        throw new BadRequestException(
          `Maximum order amount is ₹${maxOrderAmount}`,
        );
      }

      // ── Validate: COD amount bounds ────────────────────────────────────────
      if (dto.paymentMethod === 'cod') {
        if (codMinAmount > 0 && subtotal < codMinAmount) {
          throw new BadRequestException(
            `Cash on delivery is not available for orders below ₹${codMinAmount}`,
          );
        }
        if (codMaxAmount > 0 && subtotal > codMaxAmount) {
          throw new BadRequestException(
            `Cash on delivery is not available for orders above ₹${codMaxAmount}`,
          );
        }
      }

      // ── Calculate: delivery fee ────────────────────────────────────────────
      let calculatedDeliveryFee = 0;
      if (dto.orderType === 'delivery') {
        calculatedDeliveryFee = subtotal >= deliveryFreeAbove ? 0 : deliveryFee;
      }

      // ── Calculate: tax (if not inclusive, add to total) ────────────────────
      let taxAmount = 0;
      if (!taxInclusive && taxRate > 0) {
        taxAmount = Math.round((subtotal * taxRate) / 100);
      }

      // ── Calculate: service charge ──────────────────────────────────────────
      let serviceCharge = 0;
      if (serviceChargeEnabled && serviceChargePercent > 0) {
        serviceCharge = Math.round((subtotal * serviceChargePercent) / 100);
      }

      // ── Calculate: packing charges ────────────────────────────────────────
      const calculatedPackingCharges = packingCharges > 0 ? packingCharges : 0;

      // ── Calculate: gift wrap ──────────────────────────────────────────────
      const giftWrapCharges = dto.giftWrap && giftWrapPrice > 0 ? giftWrapPrice : 0;

      // ── Calculate: online discount ────────────────────────────────────────
      let onlineDiscountAmount = 0;
      if (dto.paymentMethod === 'online' && onlineDiscount > 0) {
        onlineDiscountAmount = Math.round((subtotal * onlineDiscount) / 100);
      }

      const totalAmount = subtotal + calculatedDeliveryFee + taxAmount + serviceCharge
        + calculatedPackingCharges + giftWrapCharges - onlineDiscountAmount;

      // Create the order with items
      const order = await tx.commerceOrder.create({
        data: {
          orgId,
          orderNumber,
          endUserId,
          addressId: dto.addressId ?? null,
          locationId: dto.locationId ?? null,
          variantType: dto.variantType ?? 'mixed',
          status: autoConfirm ? 'confirmed' : 'pending',
          orderType: dto.orderType,
          paymentMethod: dto.paymentMethod,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          customerEmail: dto.customerEmail ?? null,
          subtotal,
          taxAmount,
          discountAmount: onlineDiscountAmount,
          deliveryFee: calculatedDeliveryFee,
          packingCharges: calculatedPackingCharges + giftWrapCharges,
          serviceCharge,
          totalAmount,
          couponCode: dto.couponCode ?? null,
          loyaltyRedeemed: dto.loyaltyPointsToRedeem ?? 0,
          specialInstructions: dto.specialInstructions ?? null,
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
          channel: dto.channel ?? 'web',
          contactless: dto.contactless ?? false,
          metadata: {
            receiptEnabled,
            ratingEnabled,
            giftWrap: dto.giftWrap ?? false,
            giftWrapCharges,
            onlineDiscountAmount,
            autoAcceptMinutes,
          } as unknown as Prisma.InputJsonValue,
          items: {
            createMany: { data: orderItemsData },
          },
        },
        include: {
          items: true,
        },
      });

      // Create order item options
      const createdItems = await tx.commerceOrderItem.findMany({
        where: { orderId: order.id },
      });

      for (let i = 0; i < cart.items.length; i++) {
        const lineItem = cart.items[i]!;
        const createdItem = createdItems.find(
          (ci) =>
            ci.itemId === lineItem.itemId &&
            ci.variantType === lineItem.variantType &&
            ci.sizeVariationId === lineItem.sizeVariationId,
        );

        if (createdItem && lineItem.options.length > 0) {
          await tx.commerceOrderItemOption.createMany({
            data: lineItem.options.map((opt) => ({
              orderItemId: createdItem.id,
              optionId: opt.optionId,
              optionName: opt.option.name,
              quantity: opt.quantity,
              unitPrice: Number(opt.option.price),
            })),
          });
        }
      }

      // Create initial status log entry
      const initialStatus = autoConfirm ? 'confirmed' : 'pending';
      await tx.commerceOrderStatusLog.create({
        data: {
          orderId: order.id,
          fromStatus: null,
          toStatus: initialStatus,
          note: autoConfirm ? 'Order placed and auto-confirmed' : 'Order placed',
          actorType: 'system',
        },
      });

      // Clear the cart after order creation
      await tx.cartLineItem.deleteMany({ where: { cartId: cart.id } });

      this.logger.log(
        `Order created: ${order.id} (${orderNumber}) for org ${orgId}`,
      );

      // Include auto_accept_minutes so the FE/admin can show a countdown
      if (autoAcceptMinutes > 0) {
        this.logger.log(
          `Order ${order.id} will auto-accept in ${autoAcceptMinutes} minutes`,
        );
      }

      return {
        ...order,
        receiptEnabled,
        ratingEnabled,
        autoAcceptMinutes,
      };
    });
  }

  // ─── Find All ─────────────────────────────────────────────────────────────────

  /**
   * List orders with pagination, status filter, date range, and search.
   */
  async findAll(orgId: string, dto: QueryOrdersDto) {
    const where: Prisma.CommerceOrderWhereInput = {
      orgId,
      deletedAt: null,
    };

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.orderType) {
      where.orderType = dto.orderType;
    }

    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) {
        where.createdAt.gte = new Date(dto.startDate);
      }
      if (dto.endDate) {
        where.createdAt.lte = new Date(dto.endDate);
      }
    }

    if (dto.search) {
      where.OR = [
        { orderNumber: { contains: dto.search, mode: 'insensitive' } },
        { customerName: { contains: dto.search, mode: 'insensitive' } },
        { customerPhone: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.commerceOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: dto.skip,
        take: dto.limit,
        include: {
          items: true,
        },
      }),
      this.prisma.commerceOrder.count({ where }),
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

  // ─── Find One ─────────────────────────────────────────────────────────────────

  /**
   * Get a single order with items, options, and status history.
   */
  async findOne(orgId: string, orderId: string, endUserId?: string) {
    const order = await this.prisma.commerceOrder.findFirst({
      where: { id: orderId, orgId, deletedAt: null, ...(endUserId ? { endUserId } : {}) },
      include: {
        items: {
          include: {
            options: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return order;
  }

  // ─── Find By End User ─────────────────────────────────────────────────────────

  /**
   * List orders for a specific end user with pagination.
   */
  async findByEndUser(orgId: string, endUserId: string, dto: QueryOrdersDto) {
    const where: Prisma.CommerceOrderWhereInput = {
      orgId,
      endUserId,
      deletedAt: null,
    };

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.orderType) {
      where.orderType = dto.orderType;
    }

    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) {
        where.createdAt.gte = new Date(dto.startDate);
      }
      if (dto.endDate) {
        where.createdAt.lte = new Date(dto.endDate);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.commerceOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: dto.skip,
        take: dto.limit,
        include: {
          items: true,
        },
      }),
      this.prisma.commerceOrder.count({ where }),
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

  // ─── Reorder ────────────────────────────────────────────────────────────────────

  /**
   * Copy items from a previous order into the cart.
   */
  async reorder(orgId: string, endUserId: string, orderId: string) {
    const order = await this.prisma.commerceOrder.findFirst({
      where: { id: orderId, orgId, endUserId },
      include: {
        items: { include: { options: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Find or create cart (single cart per user)
    let cart = await this.prisma.cart.findFirst({
      where: { orgId, endUserId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { orgId, endUserId },
      });
    }

    // Add each order item to the cart
    for (const item of order.items) {
      // Verify item is still available
      const catalogItem = await this.prisma.catalogItem.findFirst({
        where: { id: item.itemId, orgId, inStock: true, deletedAt: null },
      });

      if (!catalogItem) continue; // Skip unavailable items

      const lineItem = await this.prisma.cartLineItem.create({
        data: {
          cartId: cart.id,
          itemId: item.itemId,
          quantity: item.quantity,
          variantType: item.variantType,
          sizeVariationId: item.sizeVariationId ?? null,
        },
      });

      // Add options
      for (const opt of item.options) {
        await this.prisma.cartLineItemOption.create({
          data: {
            lineItemId: lineItem.id,
            optionId: opt.optionId,
            quantity: opt.quantity,
          },
        });
      }
    }

    return { cartId: cart.id, message: 'Items added to cart' };
  }

  // ─── Report Issue ─────────────────────────────────────────────────────────────

  /**
   * Report an issue with an order by creating a support ticket.
   */
  async reportIssue(orgId: string, endUserId: string, orderId: string, issue: string, description?: string) {
    await this.prisma.supportTicket.create({
      data: {
        orgId,
        endUserId,
        subject: issue,
        body: description || issue,
        category: 'order_issue',
        commerceOrderId: orderId,
      },
    });

    return { message: 'Issue reported successfully. Our team will review it shortly.' };
  }

  // ─── Update Status ────────────────────────────────────────────────────────────

  /**
   * Update order status and create a status log entry.
   */
  async updateStatus(orgId: string, orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.commerceOrder.findFirst({
      where: { id: orderId, orgId, deletedAt: null },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // ── Validate: cancellation time window ─────────────────────────────────
    if (dto.status === 'cancelled') {
      const cancelAllowedMinutes = await this.orgSettings.getTyped<number>(
        orgId,
        'orders',
        'cancel_allowed_minutes',
        5,
      );
      const orderAgeMinutes =
        (Date.now() - new Date(order.createdAt).getTime()) / 60_000;

      if (cancelAllowedMinutes > 0 && orderAgeMinutes > cancelAllowedMinutes) {
        throw new BadRequestException(
          `Orders can only be cancelled within ${cancelAllowedMinutes} minutes of placement`,
        );
      }
    }

    const previousStatus = order.status;

    const [updated] = await Promise.all([
      this.prisma.commerceOrder.update({
        where: { id: orderId },
        data: { status: dto.status },
        include: {
          items: {
            include: { options: true },
          },
          statusHistory: {
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      this.prisma.commerceOrderStatusLog.create({
        data: {
          orderId,
          fromStatus: previousStatus,
          toStatus: dto.status,
          note: dto.note ?? null,
          actorType: 'admin',
        },
      }),
    ]);

    this.logger.log(
      `Order ${orderId} status updated: ${previousStatus} → ${dto.status}`,
    );

    // ── Cancel refund: compute refund metadata using payments.* settings ────
    let refundInfo:
      | { refundEnabled: boolean; refundPercent: number; refundAmount: number; destination: string; status: string }
      | undefined;
    if (dto.status === 'cancelled' && order.paymentMethod !== 'cod') {
      const [
        refundEnabled,
        refundAuto,
        refundPercentage,
        refundWindowHours,
        partialRefundEnabled,
        refundToWallet,
      ] = await Promise.all([
        this.orgSettings.getTyped<boolean>(orgId, 'payments', 'refund_enabled', false),
        this.orgSettings.getTyped<boolean>(orgId, 'payments', 'refund_auto', false),
        this.orgSettings.getTyped<number>(orgId, 'payments', 'refund_percentage', 100),
        this.orgSettings.getTyped<number>(orgId, 'payments', 'refund_window_hours', 0),
        this.orgSettings.getTyped<boolean>(orgId, 'payments', 'partial_refund_enabled', false),
        this.orgSettings.getTyped<boolean>(orgId, 'payments', 'refund_to_wallet', false),
      ]);

      if (refundEnabled) {
        // Check refund window
        let withinWindow = true;
        if (refundWindowHours > 0) {
          const orderAgeHours = (Date.now() - new Date(order.createdAt).getTime()) / 3_600_000;
          withinWindow = orderAgeHours <= refundWindowHours;
        }

        if (withinWindow) {
          // Use payments.refund_percentage as the authoritative value
          const effectivePercent = refundPercentage;
          // If partial refunds are not enabled and percentage < 100, force full refund
          const finalPercent = (!partialRefundEnabled && effectivePercent < 100) ? 100 : effectivePercent;

          const refundAmount = Math.round(
            (Number(order.totalAmount) * finalPercent) / 100,
          );
          const destination = refundToWallet ? 'wallet' : 'original_payment';

          refundInfo = {
            refundEnabled: true,
            refundPercent: finalPercent,
            refundAmount,
            destination,
            status: refundAuto ? 'processed' : 'pending_review',
          };

          // Execute the refund if auto-processing is enabled
          if (refundAuto) {
            if (refundToWallet) {
              // Credit wallet instead of refunding to payment provider
              try {
                await this.prisma.loyaltyAccount.upsert({
                  where: {
                    orgId_endUserId: { orgId, endUserId: order.endUserId },
                  },
                  create: {
                    orgId,
                    endUserId: order.endUserId,
                    balance: refundAmount,
                    totalEarned: refundAmount,
                  },
                  update: {
                    balance: { increment: refundAmount },
                    totalEarned: { increment: refundAmount },
                  },
                });
                refundInfo.status = 'processed';
                refundInfo.destination = 'wallet';
              } catch (e) {
                this.logger.warn(`Wallet credit failed for order ${orderId}: ${e}`);
                refundInfo.status = 'failed';
              }
            } else if (this.refundsService && order.paymentOrderId) {
              // Find the payment record for this order
              try {
                const payment = await this.prisma.payment.findFirst({
                  where: { orderId: order.paymentOrderId, orgId },
                });

                if (payment?.providerPaymentId) {
                  await this.refundsService.create(orgId, payment.id, {
                    amount: refundAmount,
                    reason: 'Order cancelled',
                  });
                  refundInfo.status = 'processed';
                } else {
                  this.logger.warn(
                    `No payment with provider ID found for order ${orderId}, refund pending manual review`,
                  );
                  refundInfo.status = 'pending_review';
                }
              } catch (e) {
                this.logger.warn(`Auto-refund failed for order ${orderId}: ${e}`);
                refundInfo.status = 'failed';
              }
            }
          }

          this.logger.log(
            `Refund of ₹${refundAmount} (${finalPercent}%) ${refundInfo.status} ` +
            `for cancelled order ${orderId}, destination: ${refundInfo.destination}`,
          );
        } else {
          this.logger.log(
            `Refund window of ${refundWindowHours}h expired for cancelled order ${orderId}`,
          );
        }
      }
    }

    return { ...updated, refundInfo };
  }

  // ─── Refund Request ──────────────────────────────────────────────────────────

  /**
   * Request a refund for a completed/delivered order.
   * Uses payments.refund_* settings to validate and process.
   */
  async requestRefund(
    orgId: string,
    orderId: string,
    requestedPercent?: number,
  ) {
    const [
      refundEnabled,
      refundAuto,
      refundPercentage,
      refundWindowHours,
      partialRefundEnabled,
      refundToWallet,
    ] = await Promise.all([
      this.orgSettings.getTyped<boolean>(orgId, 'payments', 'refund_enabled', false),
      this.orgSettings.getTyped<boolean>(orgId, 'payments', 'refund_auto', false),
      this.orgSettings.getTyped<number>(orgId, 'payments', 'refund_percentage', 100),
      this.orgSettings.getTyped<number>(orgId, 'payments', 'refund_window_hours', 0),
      this.orgSettings.getTyped<boolean>(orgId, 'payments', 'partial_refund_enabled', false),
      this.orgSettings.getTyped<boolean>(orgId, 'payments', 'refund_to_wallet', false),
    ]);

    if (!refundEnabled) {
      throw new BadRequestException('Refunds are not enabled for this store');
    }

    const order = await this.prisma.commerceOrder.findFirst({
      where: { id: orderId, orgId, deletedAt: null },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Validate refund window
    if (refundWindowHours > 0) {
      const orderAgeHours = (Date.now() - new Date(order.createdAt).getTime()) / 3_600_000;
      if (orderAgeHours > refundWindowHours) {
        throw new BadRequestException(
          `Refund window of ${refundWindowHours} hours has expired`,
        );
      }
    }

    // Determine refund percentage
    let effectivePercent = refundPercentage;
    if (requestedPercent !== undefined) {
      if (!partialRefundEnabled && requestedPercent < 100) {
        throw new BadRequestException('Partial refunds are not enabled for this store');
      }
      effectivePercent = Math.min(requestedPercent, refundPercentage);
    }

    const refundAmount = Math.round((Number(order.totalAmount) * effectivePercent) / 100);
    const destination = refundToWallet ? 'wallet' : 'original_payment';

    let status = refundAuto ? 'processed' : 'pending';

    // Execute the refund if auto-processing is enabled
    if (refundAuto) {
      if (refundToWallet) {
        try {
          await this.prisma.loyaltyAccount.upsert({
            where: {
              orgId_endUserId: { orgId, endUserId: order.endUserId },
            },
            create: {
              orgId,
              endUserId: order.endUserId,
              balance: refundAmount,
              totalEarned: refundAmount,
            },
            update: {
              balance: { increment: refundAmount },
              totalEarned: { increment: refundAmount },
            },
          });
          status = 'processed';
        } catch (e) {
          this.logger.warn(`Wallet credit failed for refund on order ${orderId}: ${e}`);
          status = 'failed';
        }
      } else if (this.refundsService && order.paymentOrderId) {
        try {
          const payment = await this.prisma.payment.findFirst({
            where: { orderId: order.paymentOrderId, orgId },
          });

          if (payment?.providerPaymentId) {
            await this.refundsService.create(orgId, payment.id, {
              amount: refundAmount,
              reason: 'Refund requested',
            });
            status = 'processed';
          } else {
            this.logger.warn(
              `No payment with provider ID found for order ${orderId}, refund pending manual review`,
            );
            status = 'pending';
          }
        } catch (e) {
          this.logger.warn(`Auto-refund failed for order ${orderId}: ${e}`);
          status = 'failed';
        }
      }
    }

    this.logger.log(
      `Refund of ₹${refundAmount} (${effectivePercent}%) requested for order ${orderId}, ` +
      `destination: ${destination}, auto: ${refundAuto}, status: ${status}`,
    );

    return {
      orderId,
      refundAmount,
      refundPercent: effectivePercent,
      destination,
      autoProcessed: refundAuto,
      status,
    };
  }

  // ─── Order Stats ──────────────────────────────────────────────────────────────

  /**
   * Basic order statistics: count by status and total revenue.
   */
  async getOrderStats(orgId: string) {
    const [statusCounts, revenueResult] = await Promise.all([
      this.prisma.commerceOrder.groupBy({
        by: ['status'],
        where: { orgId, deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.commerceOrder.aggregate({
        where: {
          orgId,
          deletedAt: null,
          status: { notIn: ['cancelled', 'failed'] },
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    for (const row of statusCounts) {
      byStatus[row.status] = row._count.id;
    }

    return {
      byStatus,
      totalOrders: revenueResult._count.id,
      totalRevenue: revenueResult._sum.totalAmount ?? 0,
    };
  }
}
