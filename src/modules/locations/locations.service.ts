import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CreateLocationDto,
  UpdateLocationDto,
  SetHoursDto,
  CreateDeliveryZoneDto,
  UpdateDeliveryZoneDto,
} from './dto/index.js';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Locations ──────────────────────────────────────────────────────────────

  /**
   * List all active locations for an org.
   */
  async findAll(orgId: string) {
    return this.prisma.storeLocation.findMany({
      where: { orgId, deletedAt: null, isActive: true },
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
      include: { hours: { orderBy: { dayOfWeek: 'asc' } } },
    });
  }

  /**
   * Get a single location with hours and delivery zones.
   */
  async findOne(orgId: string, id: string) {
    const location = await this.prisma.storeLocation.findFirst({
      where: { id, orgId, deletedAt: null },
      include: {
        hours: { orderBy: { dayOfWeek: 'asc' } },
        deliveryZones: { where: { isActive: true }, orderBy: { name: 'asc' } },
      },
    });

    if (!location) {
      throw new NotFoundException(`Store location ${id} not found`);
    }

    return location;
  }

  /**
   * Create a new store location.
   */
  async create(orgId: string, dto: CreateLocationDto) {
    const location = await this.prisma.storeLocation.create({
      data: {
        orgId,
        name: dto.name,
        slug: dto.slug,
        address: dto.address ?? null,
        city: dto.city ?? null,
        state: dto.state ?? null,
        pincode: dto.pincode ?? null,
        lat: dto.lat ?? null,
        lng: dto.lng ?? null,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        isActive: dto.isActive ?? true,
        isPrimary: dto.isPrimary ?? false,
        timezone: dto.timezone ?? null,
        ...(dto.metadata != null && { metadata: dto.metadata as Prisma.InputJsonValue }),
      },
    });

    this.logger.log(`Location created: ${location.id} (${location.slug}) for org ${orgId}`);
    return location;
  }

  /**
   * Update a store location.
   */
  async update(orgId: string, id: string, dto: UpdateLocationDto) {
    await this.ensureLocationExists(orgId, id);

    const updated = await this.prisma.storeLocation.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.address !== undefined && { address: dto.address ?? null }),
        ...(dto.city !== undefined && { city: dto.city ?? null }),
        ...(dto.state !== undefined && { state: dto.state ?? null }),
        ...(dto.pincode !== undefined && { pincode: dto.pincode ?? null }),
        ...(dto.lat !== undefined && { lat: dto.lat ?? null }),
        ...(dto.lng !== undefined && { lng: dto.lng ?? null }),
        ...(dto.phone !== undefined && { phone: dto.phone ?? null }),
        ...(dto.email !== undefined && { email: dto.email ?? null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.isPrimary !== undefined && { isPrimary: dto.isPrimary }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone ?? null }),
        ...(dto.metadata != null && { metadata: dto.metadata as Prisma.InputJsonValue }),
      },
    });

    this.logger.log(`Location updated: ${id} for org ${orgId}`);
    return updated;
  }

  /**
   * Soft-delete a store location.
   */
  async remove(orgId: string, id: string) {
    await this.ensureLocationExists(orgId, id);

    await this.prisma.storeLocation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Location soft-deleted: ${id} for org ${orgId}`);
    return { message: 'Location deleted successfully' };
  }

  // ─── Store Hours ────────────────────────────────────────────────────────────

  /**
   * Upsert store hours for a location (replaces all hours for that location).
   */
  async setHours(orgId: string, locationId: string, dto: SetHoursDto) {
    await this.ensureLocationExists(orgId, locationId);

    const operations = dto.hours.map((entry) =>
      this.prisma.storeHours.upsert({
        where: {
          orgId_locationId_dayOfWeek: {
            orgId,
            locationId,
            dayOfWeek: entry.dayOfWeek,
          },
        },
        update: {
          openTime: entry.openTime,
          closeTime: entry.closeTime,
          isClosed: entry.isClosed ?? false,
        },
        create: {
          orgId,
          locationId,
          dayOfWeek: entry.dayOfWeek,
          openTime: entry.openTime,
          closeTime: entry.closeTime,
          isClosed: entry.isClosed ?? false,
        },
      }),
    );

    const results = await this.prisma.$transaction(operations);

    this.logger.log(`Store hours set for location ${locationId}: ${results.length} entries`);
    return results;
  }

  // ─── Delivery Zones ─────────────────────────────────────────────────────────

  /**
   * List delivery zones for a location.
   */
  async findAllDeliveryZones(orgId: string, locationId: string) {
    await this.ensureLocationExists(orgId, locationId);

    return this.prisma.deliveryZone.findMany({
      where: { orgId, locationId },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create a delivery zone for a location.
   */
  async createDeliveryZone(orgId: string, locationId: string, dto: CreateDeliveryZoneDto) {
    await this.ensureLocationExists(orgId, locationId);

    const zone = await this.prisma.deliveryZone.create({
      data: {
        orgId,
        locationId,
        name: dto.name,
        pincodes: (dto.pincodes ?? []) as Prisma.InputJsonValue,
        radiusKm: dto.radiusKm ?? null,
        centerLat: dto.centerLat ?? null,
        centerLng: dto.centerLng ?? null,
        fee: dto.fee ?? 0,
        minOrder: dto.minOrder ?? null,
        isActive: dto.isActive ?? true,
      },
    });

    this.logger.log(`Delivery zone created: ${zone.id} for location ${locationId}`);
    return zone;
  }

  /**
   * Update a delivery zone.
   */
  async updateDeliveryZone(orgId: string, zoneId: string, dto: UpdateDeliveryZoneDto) {
    await this.ensureDeliveryZoneExists(orgId, zoneId);

    const updated = await this.prisma.deliveryZone.update({
      where: { id: zoneId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.pincodes !== undefined && { pincodes: dto.pincodes as Prisma.InputJsonValue }),
        ...(dto.radiusKm !== undefined && { radiusKm: dto.radiusKm ?? null }),
        ...(dto.centerLat !== undefined && { centerLat: dto.centerLat ?? null }),
        ...(dto.centerLng !== undefined && { centerLng: dto.centerLng ?? null }),
        ...(dto.fee !== undefined && { fee: dto.fee }),
        ...(dto.minOrder !== undefined && { minOrder: dto.minOrder ?? null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.logger.log(`Delivery zone updated: ${zoneId}`);
    return updated;
  }

  /**
   * Delete a delivery zone.
   */
  async removeDeliveryZone(orgId: string, zoneId: string) {
    await this.ensureDeliveryZoneExists(orgId, zoneId);

    await this.prisma.deliveryZone.delete({ where: { id: zoneId } });

    this.logger.log(`Delivery zone deleted: ${zoneId}`);
    return { message: 'Delivery zone deleted successfully' };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private async ensureLocationExists(orgId: string, id: string) {
    const location = await this.prisma.storeLocation.findFirst({
      where: { id, orgId, deletedAt: null },
    });
    if (!location) {
      throw new NotFoundException(`Store location ${id} not found`);
    }
    return location;
  }

  private async ensureDeliveryZoneExists(orgId: string, id: string) {
    const zone = await this.prisma.deliveryZone.findFirst({
      where: { id, orgId },
    });
    if (!zone) {
      throw new NotFoundException(`Delivery zone ${id} not found`);
    }
    return zone;
  }
}
