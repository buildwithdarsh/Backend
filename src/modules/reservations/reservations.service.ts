import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { OrgSettingsService } from '../org-settings/org-settings.service.js';
import {
  CreateReservationDto,
  CreateResourceDto,
  UpdateResourceDto,
  QueryReservationsDto,
} from './dto/index.js';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orgSettings: OrgSettingsService,
  ) {}

  /**
   * Ensure reservations feature is enabled for this org.
   */
  private async ensureReservationsEnabled(orgId: string): Promise<void> {
    const enabled = await this.orgSettings.getTyped<boolean>(
      orgId, 'features', 'reservations_enabled', true,
    );
    if (!enabled) {
      throw new BadRequestException('Reservations are disabled for this store');
    }
  }

  // ─── Reservations ────────────────────────────────────────────────────────

  /**
   * Create a new reservation.
   */
  async create(orgId: string, endUserId: string, dto: CreateReservationDto) {
    await this.ensureReservationsEnabled(orgId);

    // If a slot is specified, check availability
    if (dto.slotId) {
      const slot = await this.prisma.reservationSlot.findFirst({
        where: { id: dto.slotId, orgId, isActive: true },
      });

      if (!slot) {
        throw new NotFoundException('Reservation slot not found');
      }

      if (slot.currentBookings >= slot.maxBookings) {
        throw new BadRequestException('This time slot is fully booked');
      }

      // Increment booking count
      await this.prisma.reservationSlot.update({
        where: { id: dto.slotId },
        data: { currentBookings: { increment: 1 } },
      });
    }

    const reservation = await this.prisma.reservation.create({
      data: {
        orgId,
        endUserId,
        resourceId: dto.resourceId ?? null,
        slotId: dto.slotId ?? null,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime ?? null,
        partySize: dto.partySize ?? 2,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        notes: dto.notes ?? null,
      },
    });

    this.logger.log(`Reservation created: ${reservation.id} for org ${orgId}`);
    return reservation;
  }

  /**
   * List all reservations (admin).
   */
  async findAll(orgId: string, query: QueryReservationsDto) {
    const where: Prisma.ReservationWhereInput = { orgId };

    if (query.date) {
      where.date = new Date(query.date);
    }

    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        include: {
          endUser: { select: { id: true, name: true } },
          resource: { select: { id: true, name: true, type: true } },
        },
      }),
      this.prisma.reservation.count({ where }),
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
   * Find reservations by end user.
   */
  async findByEndUser(orgId: string, endUserId: string, query: QueryReservationsDto) {
    const where: Prisma.ReservationWhereInput = { orgId, endUserId };

    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
        include: {
          resource: { select: { id: true, name: true, type: true } },
        },
      }),
      this.prisma.reservation.count({ where }),
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
   * Check availability for a given date.
   */
  async checkAvailability(orgId: string, date: string, partySize?: number) {
    await this.ensureReservationsEnabled(orgId);

    const slots = await this.prisma.reservationSlot.findMany({
      where: {
        orgId,
        date: new Date(date),
        isActive: true,
      },
      orderBy: { startTime: 'asc' },
    });

    // Filter slots that still have capacity
    const availableSlots = slots.filter(
      (slot) => slot.currentBookings < slot.maxBookings,
    );

    // If party size filter, also return matching resources
    let resources: any[] = [];
    if (partySize) {
      resources = await this.prisma.bookableResource.findMany({
        where: {
          orgId,
          isActive: true,
          capacity: { gte: partySize },
        },
        orderBy: { capacity: 'asc' },
      });
    }

    return { slots: availableSlots, resources };
  }

  /**
   * Update reservation status.
   */
  async updateStatus(orgId: string, id: string, status: string, endUserId?: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, orgId, ...(endUserId ? { endUserId } : {}) },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation ${id} not found`);
    }

    // If cancelling a slotted reservation, decrement the slot count
    if (status === 'cancelled' && reservation.slotId && reservation.status !== 'cancelled') {
      await this.prisma.reservationSlot.update({
        where: { id: reservation.slotId },
        data: { currentBookings: { decrement: 1 } },
      });
    }

    await this.prisma.reservation.updateMany({
      where: { id, orgId },
      data: { status },
    });

    this.logger.log(`Reservation ${id} status updated to ${status} for org ${orgId}`);
    return this.prisma.reservation.findFirst({ where: { id, orgId } });
  }

  /**
   * Get slots for a date.
   */
  async getSlots(orgId: string, date: string) {
    return this.prisma.reservationSlot.findMany({
      where: { orgId, date: new Date(date), isActive: true },
      orderBy: { startTime: 'asc' },
    });
  }

  // ─── Resources ──────────────────────────────────────────────────────────

  /**
   * Create a bookable resource.
   */
  async createResource(orgId: string, dto: CreateResourceDto) {
    const resource = await this.prisma.bookableResource.create({
      data: {
        orgId,
        locationId: dto.locationId ?? null,
        name: dto.name,
        type: dto.type ?? 'table',
        capacity: dto.capacity ?? 2,
        isActive: dto.isActive ?? true,
        metadata: (dto.metadata as Prisma.InputJsonValue) ?? {},
      },
    });

    this.logger.log(`Resource created: ${resource.id} (${resource.name}) for org ${orgId}`);
    return resource;
  }

  /**
   * List all resources.
   */
  async findAllResources(orgId: string) {
    return this.prisma.bookableResource.findMany({
      where: { orgId },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Update a resource.
   */
  async updateResource(orgId: string, id: string, dto: UpdateResourceDto) {
    const resource = await this.prisma.bookableResource.findFirst({
      where: { id, orgId },
    });

    if (!resource) {
      throw new NotFoundException(`Resource ${id} not found`);
    }

    return this.prisma.bookableResource.update({
      where: { id },
      data: {
        ...(dto.locationId !== undefined && { locationId: dto.locationId ?? null }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.metadata != null && { metadata: dto.metadata as Prisma.InputJsonValue }),
      },
    });
  }

  /**
   * Delete a resource.
   */
  async removeResource(orgId: string, id: string) {
    const resource = await this.prisma.bookableResource.findFirst({
      where: { id, orgId },
    });

    if (!resource) {
      throw new NotFoundException(`Resource ${id} not found`);
    }

    await this.prisma.bookableResource.delete({ where: { id } });

    this.logger.log(`Resource deleted: ${id} for org ${orgId}`);
    return { message: 'Resource deleted successfully' };
  }
}
