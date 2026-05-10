import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CreatePropertyTypeDto,
  UpdatePropertyTypeDto,
  CreatePropertyUnitDto,
  UpdatePropertyUnitDto,
  CreateAmenityDto,
} from './dto/index.js';

@Injectable()
export class PropertyService {
  private readonly logger = new Logger(PropertyService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Property Types ────────────────────────────────────────────────────────

  /**
   * Create a new property type.
   */
  async createType(orgId: string, dto: CreatePropertyTypeDto) {
    const propertyType = await this.prisma.propertyType.create({
      data: {
        orgId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description ?? null,
        basePrice: dto.basePrice ?? 0,
        maxGuests: dto.maxGuests ?? 2,
        bedType: dto.bedType ?? null,
        unitSize: dto.unitSize ?? null,
        images: dto.images ?? [],
        status: dto.status ?? 'active',
        metadata: (dto.metadata as Prisma.InputJsonValue) ?? {},
      },
    });

    this.logger.log(`Property type created: ${propertyType.id} for org ${orgId}`);
    return propertyType;
  }

  /**
   * List all property types for an org.
   */
  async findAllTypes(orgId: string, activeOnly = false) {
    const where: Prisma.PropertyTypeWhereInput = {
      orgId,
      deletedAt: null,
    };

    if (activeOnly) {
      where.status = 'active';
    }

    return this.prisma.propertyType.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        amenities: {
          include: {
            amenity: true,
          },
        },
        _count: { select: { units: true } },
      },
    });
  }

  /**
   * Get a single property type with full details.
   */
  async findOneType(orgId: string, id: string) {
    const propertyType = await this.prisma.propertyType.findFirst({
      where: { id, orgId, deletedAt: null },
      include: {
        amenities: {
          include: {
            amenity: true,
          },
        },
        units: true,
        _count: { select: { units: true, bookings: true } },
      },
    });

    if (!propertyType) {
      throw new NotFoundException(`Property type ${id} not found`);
    }

    return propertyType;
  }

  /**
   * Update a property type.
   */
  async updateType(orgId: string, id: string, dto: UpdatePropertyTypeDto) {
    const existing = await this.prisma.propertyType.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Property type ${id} not found`);
    }

    const updated = await this.prisma.propertyType.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description ?? null }),
        ...(dto.basePrice !== undefined && { basePrice: dto.basePrice }),
        ...(dto.maxGuests !== undefined && { maxGuests: dto.maxGuests }),
        ...(dto.bedType !== undefined && { bedType: dto.bedType ?? null }),
        ...(dto.unitSize !== undefined && { unitSize: dto.unitSize ?? null }),
        ...(dto.images !== undefined && { images: dto.images }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.metadata != null && { metadata: dto.metadata as Prisma.InputJsonValue }),
      },
    });

    this.logger.log(`Property type updated: ${id} for org ${orgId}`);
    return updated;
  }

  /**
   * Soft-delete a property type.
   */
  async removeType(orgId: string, id: string) {
    const existing = await this.prisma.propertyType.findFirst({
      where: { id, orgId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Property type ${id} not found`);
    }

    await this.prisma.propertyType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Property type deleted: ${id} for org ${orgId}`);
    return { message: 'Property type deleted successfully' };
  }

  // ─── Property Units ────────────────────────────────────────────────────────

  /**
   * Create a property unit.
   */
  async createUnit(orgId: string, dto: CreatePropertyUnitDto) {
    const unit = await this.prisma.propertyUnit.create({
      data: {
        orgId,
        propertyTypeId: dto.propertyTypeId,
        unitNumber: dto.unitNumber,
        floor: dto.floor ?? null,
        status: dto.status ?? 'available',
        notes: dto.notes ?? null,
      },
    });

    this.logger.log(`Property unit created: ${unit.id} (${unit.unitNumber}) for org ${orgId}`);
    return unit;
  }

  /**
   * List all units, optionally filtered by property type.
   */
  async findAllUnits(orgId: string, propertyTypeId?: string) {
    const where: Prisma.PropertyUnitWhereInput = { orgId };
    if (propertyTypeId) {
      where.propertyTypeId = propertyTypeId;
    }

    return this.prisma.propertyUnit.findMany({
      where,
      orderBy: { unitNumber: 'asc' },
      include: {
        propertyType: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  /**
   * Update a property unit.
   */
  async updateUnit(orgId: string, id: string, dto: UpdatePropertyUnitDto) {
    const existing = await this.prisma.propertyUnit.findFirst({
      where: { id, orgId },
    });

    if (!existing) {
      throw new NotFoundException(`Property unit ${id} not found`);
    }

    return this.prisma.propertyUnit.update({
      where: { id },
      data: {
        ...(dto.propertyTypeId !== undefined && { propertyTypeId: dto.propertyTypeId }),
        ...(dto.unitNumber !== undefined && { unitNumber: dto.unitNumber }),
        ...(dto.floor !== undefined && { floor: dto.floor ?? null }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes ?? null }),
      },
    });
  }

  /**
   * Update housekeeping status of a unit.
   */
  async updateHousekeeping(orgId: string, id: string, status: string) {
    const existing = await this.prisma.propertyUnit.findFirst({
      where: { id, orgId },
    });

    if (!existing) {
      throw new NotFoundException(`Property unit ${id} not found`);
    }

    const updated = await this.prisma.propertyUnit.update({
      where: { id },
      data: { housekeepingStatus: status },
    });

    this.logger.log(`Unit ${id} housekeeping updated to ${status} for org ${orgId}`);
    return updated;
  }

  // ─── Amenities ─────────────────────────────────────────────────────────────

  /**
   * Create an amenity.
   */
  async createAmenity(orgId: string, dto: CreateAmenityDto) {
    const amenity = await this.prisma.propertyAmenity.create({
      data: {
        orgId,
        name: dto.name,
        icon: dto.icon ?? null,
        category: dto.category ?? null,
        isActive: dto.isActive ?? true,
      },
    });

    this.logger.log(`Amenity created: ${amenity.id} (${amenity.name}) for org ${orgId}`);
    return amenity;
  }

  /**
   * List all amenities for an org.
   */
  async findAllAmenities(orgId: string) {
    return this.prisma.propertyAmenity.findMany({
      where: { orgId },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Link an amenity to a property type.
   */
  async linkAmenity(orgId: string, typeId: string, amenityId: string) {
    const link = await this.prisma.propertyTypeAmenity.create({
      data: {
        orgId,
        propertyTypeId: typeId,
        amenityId,
      },
    });

    this.logger.log(`Amenity ${amenityId} linked to type ${typeId} for org ${orgId}`);
    return link;
  }

  /**
   * Unlink an amenity from a property type.
   */
  async unlinkAmenity(orgId: string, typeId: string, amenityId: string) {
    const link = await this.prisma.propertyTypeAmenity.findFirst({
      where: { orgId, propertyTypeId: typeId, amenityId },
    });

    if (!link) {
      throw new NotFoundException('Amenity link not found');
    }

    await this.prisma.propertyTypeAmenity.delete({ where: { id: link.id } });

    this.logger.log(`Amenity ${amenityId} unlinked from type ${typeId} for org ${orgId}`);
    return { message: 'Amenity unlinked successfully' };
  }

  /**
   * Set amenities for a property type (replace all existing links).
   */
  async setAmenities(orgId: string, typeId: string, amenityIds: string[]) {
    await this.prisma.$transaction(async (tx) => {
      // Remove all existing links
      await tx.propertyTypeAmenity.deleteMany({
        where: { orgId, propertyTypeId: typeId },
      });

      // Create new links
      if (amenityIds.length > 0) {
        await tx.propertyTypeAmenity.createMany({
          data: amenityIds.map((amenityId) => ({
            orgId,
            propertyTypeId: typeId,
            amenityId,
          })),
        });
      }
    });

    this.logger.log(`Amenities set for type ${typeId} for org ${orgId}: [${amenityIds.join(', ')}]`);
    return { message: 'Amenities updated successfully' };
  }
}
