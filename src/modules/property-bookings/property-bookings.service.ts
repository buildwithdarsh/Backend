import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CreateBookingDto,
  QueryBookingsDto,
  UpdateBookingDto,
  VerifyPaymentDto,
} from './dto/index.js';

@Injectable()
export class PropertyBookingsService {
  private readonly logger = new Logger(PropertyBookingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a booking reference: BKG-YYYYMMDD-XXXX
   */
  private generateBookingReference(): string {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BKG-${datePart}-${randomPart}`;
  }

  /**
   * Calculate number of nights between two dates.
   */
  private calculateNights(checkIn: Date, checkOut: Date): number {
    const diffMs = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Create a new property booking.
   */
  async createBooking(orgId: string, endUserId: string, dto: CreateBookingDto) {
    const checkIn = new Date(dto.checkInDate);
    const checkOut = new Date(dto.checkOutDate);

    if (checkOut <= checkIn) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    const nights = this.calculateNights(checkIn, checkOut);

    // Validate property type exists and is active
    const propertyType = await this.prisma.propertyType.findFirst({
      where: { id: dto.propertyTypeId, orgId, status: 'active', deletedAt: null },
    });

    if (!propertyType) {
      throw new NotFoundException('Property type not found or inactive');
    }

    // Check inventory availability for each night
    const dates: Date[] = [];
    for (let i = 0; i < nights; i++) {
      const d = new Date(checkIn);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }

    const inventoryRecords = await this.prisma.propertyInventory.findMany({
      where: {
        orgId,
        propertyTypeId: dto.propertyTypeId,
        date: { in: dates },
      },
    });

    for (const record of inventoryRecords) {
      const available = record.totalUnits - record.bookedUnits - record.heldUnits - record.blockedUnits;
      if (available <= 0 || record.isBlocked) {
        throw new BadRequestException(
          `No availability for ${record.date.toISOString().slice(0, 10)}`,
        );
      }
    }

    // Calculate pricing (base price * nights as default)
    const guestCount = dto.guestCount ?? 1;
    const baseAmount = propertyType.basePrice * nights;
    const extraGuestCharge = guestCount > propertyType.maxGuests
      ? (guestCount - propertyType.maxGuests) * Math.round(propertyType.basePrice * 0.3) * nights
      : 0;
    const taxAmount = Math.round((baseAmount + extraGuestCharge) * 0.18); // 18% GST default
    const totalAmount = baseAmount + extraGuestCharge + taxAmount;

    const bookingReference = this.generateBookingReference();

    // Create hold for inventory
    const hold = await this.prisma.propertyInventoryHold.create({
      data: {
        orgId,
        propertyTypeId: dto.propertyTypeId,
        startDate: checkIn,
        endDate: checkOut,
        units: 1,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // Update inventory held counts
    if (inventoryRecords.length > 0) {
      await this.prisma.propertyInventory.updateMany({
        where: {
          orgId,
          propertyTypeId: dto.propertyTypeId,
          date: { in: dates },
        },
        data: { heldUnits: { increment: 1 } },
      });
    }

    // Create booking
    const booking = await this.prisma.propertyBooking.create({
      data: {
        orgId,
        bookingReference,
        endUserId,
        propertyTypeId: dto.propertyTypeId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        nights,
        guestCount,
        guestName: dto.guestName,
        guestPhone: dto.guestPhone ?? null,
        guestEmail: dto.guestEmail ?? null,
        baseAmount,
        taxAmount,
        extraGuestCharge,
        totalAmount,
        status: 'pending',
        paymentStatus: 'pending',
        paymentType: dto.paymentType ?? 'full',
        couponCode: dto.couponCode ?? null,
        specialRequests: dto.specialRequests ?? null,
        holdId: hold.id,
      },
    });

    this.logger.log(
      `Booking created: ${booking.id} (${bookingReference}) for org ${orgId}`,
    );

    return booking;
  }

  /**
   * List all bookings (admin) with filters and pagination.
   */
  async findAll(orgId: string, query: QueryBookingsDto) {
    const where: Prisma.PropertyBookingWhereInput = {
      orgId,
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.fromDate || query.toDate) {
      where.checkInDate = {};
      if (query.fromDate) {
        where.checkInDate.gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        where.checkInDate.lte = new Date(query.toDate);
      }
    }

    if (query.search) {
      where.OR = [
        { guestName: { contains: query.search, mode: 'insensitive' } },
        { guestPhone: { contains: query.search } },
        { bookingReference: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.propertyBooking.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          propertyType: { select: { id: true, name: true, slug: true } },
          endUser: { select: { id: true, name: true, phone: true } },
          assignedUnits: {
            include: {
              unit: { select: { id: true, unitNumber: true } },
            },
          },
          _count: { select: { payments: true } },
        },
      }),
      this.prisma.propertyBooking.count({ where }),
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
   * Get a booking by ID with full details.
   */
  async findOne(orgId: string, id: string, endUserId?: string) {
    const booking = await this.prisma.propertyBooking.findFirst({
      where: { id, orgId, deletedAt: null, ...(endUserId ? { endUserId } : {}) },
      include: {
        propertyType: true,
        endUser: { select: { id: true, name: true, phone: true, email: true } },
        assignedUnits: {
          include: {
            unit: true,
          },
        },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${id} not found`);
    }

    return booking;
  }

  /**
   * Find bookings by end user.
   */
  async findByEndUser(orgId: string, endUserId: string, query: QueryBookingsDto) {
    const where: Prisma.PropertyBookingWhereInput = {
      orgId,
      endUserId,
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.propertyBooking.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          propertyType: { select: { id: true, name: true, slug: true, images: true } },
          assignedUnits: {
            include: {
              unit: { select: { id: true, unitNumber: true } },
            },
          },
        },
      }),
      this.prisma.propertyBooking.count({ where }),
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
   * Update booking status.
   */
  async updateStatus(orgId: string, id: string, status: string) {
    const booking = await this.prisma.propertyBooking.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${id} not found`);
    }

    await this.prisma.propertyBooking.updateMany({
      where: { id, orgId },
      data: { status },
    });

    this.logger.log(`Booking ${id} status updated to ${status} for org ${orgId}`);
    return this.prisma.propertyBooking.findFirst({ where: { id, orgId } });
  }

  /**
   * Update booking notes/guest details (admin).
   */
  async updateBooking(orgId: string, id: string, dto: UpdateBookingDto) {
    const booking = await this.prisma.propertyBooking.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${id} not found`);
    }

    await this.prisma.propertyBooking.updateMany({
      where: { id, orgId },
      data: {
        ...(dto.guestName !== undefined && { guestName: dto.guestName }),
        ...(dto.guestPhone !== undefined && { guestPhone: dto.guestPhone }),
        ...(dto.guestEmail !== undefined && { guestEmail: dto.guestEmail }),
        ...(dto.specialRequests !== undefined && { specialRequests: dto.specialRequests ?? null }),
        ...(dto.notes !== undefined && { notes: dto.notes ?? null }),
      },
    });

    return this.prisma.propertyBooking.findFirst({ where: { id, orgId } });
  }

  /**
   * Check in a booking.
   */
  async checkIn(orgId: string, id: string) {
    const booking = await this.prisma.propertyBooking.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${id} not found`);
    }

    if (booking.status !== 'confirmed') {
      throw new BadRequestException('Only confirmed bookings can be checked in');
    }

    await this.prisma.propertyBooking.updateMany({
      where: { id, orgId },
      data: {
        status: 'checked_in',
        checkedInAt: new Date(),
      },
    });

    this.logger.log(`Booking ${id} checked in for org ${orgId}`);
    return this.prisma.propertyBooking.findFirst({ where: { id, orgId } });
  }

  /**
   * Check out a booking.
   */
  async checkOut(orgId: string, id: string) {
    const booking = await this.prisma.propertyBooking.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${id} not found`);
    }

    if (booking.status !== 'checked_in') {
      throw new BadRequestException('Only checked-in bookings can be checked out');
    }

    // Release hold if any
    if (booking.holdId) {
      await this.prisma.propertyInventoryHold.update({
        where: { id: booking.holdId },
        data: { isReleased: true },
      });
    }

    await this.prisma.propertyBooking.updateMany({
      where: { id, orgId },
      data: {
        status: 'checked_out',
        checkedOutAt: new Date(),
      },
    });

    this.logger.log(`Booking ${id} checked out for org ${orgId}`);
    return this.prisma.propertyBooking.findFirst({ where: { id, orgId } });
  }

  /**
   * Cancel a booking.
   */
  async cancelBooking(orgId: string, id: string, reason?: string, endUserId?: string) {
    const booking = await this.prisma.propertyBooking.findFirst({
      where: { id, orgId, deletedAt: null, ...(endUserId ? { endUserId } : {}) },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${id} not found`);
    }

    if (['checked_out', 'cancelled', 'refunded'].includes(booking.status)) {
      throw new BadRequestException(`Cannot cancel a booking with status: ${booking.status}`);
    }

    // Release hold and decrement booked/held inventory
    if (booking.holdId) {
      await this.prisma.propertyInventoryHold.update({
        where: { id: booking.holdId },
        data: { isReleased: true },
      });
    }

    // Decrement booked counts for each night
    const nights = booking.nights;
    const dates: Date[] = [];
    for (let i = 0; i < nights; i++) {
      const d = new Date(booking.checkInDate);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }

    await this.prisma.propertyInventory.updateMany({
      where: {
        orgId,
        propertyTypeId: booking.propertyTypeId,
        date: { in: dates },
        bookedUnits: { gt: 0 },
      },
      data: { bookedUnits: { decrement: 1 } },
    });

    await this.prisma.propertyBooking.updateMany({
      where: { id, orgId },
      data: {
        status: 'cancelled',
        cancellationReason: reason ?? null,
        cancelledAt: new Date(),
      },
    });

    this.logger.log(`Booking ${id} cancelled for org ${orgId}`);
    return this.prisma.propertyBooking.findFirst({ where: { id, orgId } });
  }

  /**
   * Assign specific units to a booking.
   */
  async assignUnits(orgId: string, bookingId: string, unitIds: string[]) {
    const booking = await this.prisma.propertyBooking.findFirst({
      where: { id: bookingId, orgId, deletedAt: null },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      // Remove existing assignments
      await tx.propertyBookingUnit.deleteMany({
        where: { orgId, bookingId },
      });

      // Create new assignments
      if (unitIds.length > 0) {
        await tx.propertyBookingUnit.createMany({
          data: unitIds.map((unitId) => ({
            orgId,
            bookingId,
            unitId,
          })),
        });
      }
    });

    this.logger.log(
      `Units assigned to booking ${bookingId}: [${unitIds.join(', ')}] for org ${orgId}`,
    );

    return { message: 'Units assigned successfully' };
  }

  /**
   * Lookup booking by reference (guest-facing).
   */
  async lookupByReference(orgId: string, reference: string) {
    const booking = await this.prisma.propertyBooking.findFirst({
      where: {
        orgId,
        bookingReference: reference,
        deletedAt: null,
      },
      include: {
        propertyType: { select: { id: true, name: true, slug: true, images: true } },
        assignedUnits: {
          include: {
            unit: { select: { id: true, unitNumber: true } },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  /**
   * Create a payment order for a booking.
   */
  async createPaymentOrder(orgId: string, bookingId: string, paymentType = 'full', endUserId?: string) {
    const booking = await this.prisma.propertyBooking.findFirst({
      where: { id: bookingId, orgId, deletedAt: null, ...(endUserId ? { endUserId } : {}) },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    // Determine amount based on payment type
    let amount = booking.totalAmount;
    if (paymentType === 'advance') {
      amount = Math.round(booking.totalAmount * 0.5); // 50% advance
    }

    const payment = await this.prisma.propertyPayment.create({
      data: {
        orgId,
        bookingId,
        amount,
        type: paymentType,
        status: 'pending',
      },
    });

    // Update booking status
    await this.prisma.propertyBooking.updateMany({
      where: { id: bookingId, orgId },
      data: {
        status: 'payment_pending',
        paymentType,
      },
    });

    this.logger.log(
      `Payment order created: ${payment.id} for booking ${bookingId}, amount: ${amount}`,
    );

    return payment;
  }

  /**
   * Verify and confirm a payment.
   */
  async verifyPayment(orgId: string, dto: VerifyPaymentDto) {
    const payment = await this.prisma.propertyPayment.findFirst({
      where: {
        orgId,
        bookingId: dto.bookingId,
        providerOrderId: dto.providerOrderId,
        status: 'pending',
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found or already processed');
    }

    // Update payment
    const updatedPayment = await this.prisma.propertyPayment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId: dto.providerPaymentId,
        providerSignature: dto.providerSignature ?? null,
        status: 'captured',
      },
    });

    // Update booking payment status
    const allPayments = await this.prisma.propertyPayment.findMany({
      where: { orgId, bookingId: dto.bookingId, status: 'captured' },
    });

    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const booking = await this.prisma.propertyBooking.findFirst({
      where: { id: dto.bookingId, orgId },
    });

    if (booking) {
      const paymentStatus = totalPaid >= booking.totalAmount ? 'paid' : 'partially_paid';

      await this.prisma.propertyBooking.updateMany({
        where: { id: dto.bookingId, orgId },
        data: {
          paymentStatus,
          status: paymentStatus === 'paid' ? 'confirmed' : booking.status,
        },
      });

      // Convert held units to booked if fully paid
      if (paymentStatus === 'paid') {
        const nights = booking.nights;
        const dates: Date[] = [];
        for (let i = 0; i < nights; i++) {
          const d = new Date(booking.checkInDate);
          d.setDate(d.getDate() + i);
          dates.push(d);
        }

        await this.prisma.propertyInventory.updateMany({
          where: {
            orgId,
            propertyTypeId: booking.propertyTypeId,
            date: { in: dates },
            heldUnits: { gt: 0 },
          },
          data: {
            heldUnits: { decrement: 1 },
            bookedUnits: { increment: 1 },
          },
        });

        // Mark hold as confirmed
        if (booking.holdId) {
          await this.prisma.propertyInventoryHold.update({
            where: { id: booking.holdId },
            data: { bookingId: booking.id },
          });
        }
      }
    }

    this.logger.log(`Payment ${payment.id} verified for booking ${dto.bookingId}`);
    return updatedPayment;
  }
}
