import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class PropertyInventoryService {
  private readonly logger = new Logger(PropertyInventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate an array of dates between start and end (exclusive of end).
   */
  private getDateRange(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(start);
    while (current < end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  /**
   * Ensure inventory records exist for the given property type and dates.
   * Creates missing records with totalUnits derived from unit count.
   */
  async ensureInventory(orgId: string, propertyTypeId: string, dates: Date[]) {
    // Count total units for this property type
    const unitCount = await this.prisma.propertyUnit.count({
      where: { orgId, propertyTypeId, status: { not: 'blocked' } },
    });

    const existing = await this.prisma.propertyInventory.findMany({
      where: { orgId, propertyTypeId, date: { in: dates } },
      select: { date: true },
    });

    const existingDates = new Set(
      existing.map((r) => r.date.toISOString().slice(0, 10)),
    );

    const missing = dates.filter(
      (d) => !existingDates.has(d.toISOString().slice(0, 10)),
    );

    if (missing.length > 0) {
      await this.prisma.propertyInventory.createMany({
        data: missing.map((date) => ({
          orgId,
          propertyTypeId,
          date,
          totalUnits: unitCount,
        })),
        skipDuplicates: true,
      });
    }
  }

  /**
   * Get availability for a property type over a date range.
   */
  async getAvailability(
    orgId: string,
    propertyTypeId: string,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = this.getDateRange(start, end);

    await this.ensureInventory(orgId, propertyTypeId, dates);

    const records = await this.prisma.propertyInventory.findMany({
      where: {
        orgId,
        propertyTypeId,
        date: { gte: start, lt: end },
      },
      orderBy: { date: 'asc' },
    });

    return records.map((r) => ({
      date: r.date,
      totalUnits: r.totalUnits,
      bookedUnits: r.bookedUnits,
      heldUnits: r.heldUnits,
      blockedUnits: r.blockedUnits,
      availableUnits: r.totalUnits - r.bookedUnits - r.heldUnits - r.blockedUnits,
      isBlocked: r.isBlocked,
    }));
  }

  /**
   * Get calendar view across all property types.
   */
  async getCalendar(orgId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get all active property types
    const types = await this.prisma.propertyType.findMany({
      where: { orgId, status: 'active', deletedAt: null },
      select: { id: true, name: true, slug: true },
    });

    const dates = this.getDateRange(start, end);

    // Ensure inventory for all types
    for (const type of types) {
      await this.ensureInventory(orgId, type.id, dates);
    }

    const records = await this.prisma.propertyInventory.findMany({
      where: {
        orgId,
        date: { gte: start, lt: end },
      },
      orderBy: [{ propertyTypeId: 'asc' }, { date: 'asc' }],
      include: {
        propertyType: { select: { id: true, name: true, slug: true } },
      },
    });

    // Group by property type
    const calendar: Record<
      string,
      {
        propertyType: { id: string; name: string; slug: string };
        dates: Array<{
          date: Date;
          totalUnits: number;
          bookedUnits: number;
          heldUnits: number;
          blockedUnits: number;
          availableUnits: number;
          isBlocked: boolean;
        }>;
      }
    > = {};

    for (const record of records) {
      const typeId = record.propertyTypeId;
      if (!calendar[typeId]) {
        calendar[typeId] = {
          propertyType: record.propertyType,
          dates: [],
        };
      }
      calendar[typeId].dates.push({
        date: record.date,
        totalUnits: record.totalUnits,
        bookedUnits: record.bookedUnits,
        heldUnits: record.heldUnits,
        blockedUnits: record.blockedUnits,
        availableUnits:
          record.totalUnits -
          record.bookedUnits -
          record.heldUnits -
          record.blockedUnits,
        isBlocked: record.isBlocked,
      });
    }

    return Object.values(calendar);
  }

  /**
   * Block dates for a property type.
   */
  async blockDates(
    orgId: string,
    propertyTypeId: string,
    dates: string[],
    reason?: string,
  ) {
    const parsedDates = dates.map((d) => new Date(d));

    await this.ensureInventory(orgId, propertyTypeId, parsedDates);

    await this.prisma.propertyInventory.updateMany({
      where: {
        orgId,
        propertyTypeId,
        date: { in: parsedDates },
      },
      data: {
        isBlocked: true,
        blockReason: reason ?? null,
      },
    });

    this.logger.log(
      `Blocked ${dates.length} dates for type ${propertyTypeId} in org ${orgId}`,
    );

    return { message: `${dates.length} dates blocked successfully` };
  }

  /**
   * Create a temporary inventory hold.
   */
  async createHold(
    orgId: string,
    propertyTypeId: string,
    startDate: string,
    endDate: string,
    units = 1,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = this.getDateRange(start, end);

    await this.ensureInventory(orgId, propertyTypeId, dates);

    // Check availability for each date
    const records = await this.prisma.propertyInventory.findMany({
      where: {
        orgId,
        propertyTypeId,
        date: { in: dates },
      },
    });

    for (const record of records) {
      const available =
        record.totalUnits -
        record.bookedUnits -
        record.heldUnits -
        record.blockedUnits;
      if (available < units || record.isBlocked) {
        throw new BadRequestException(
          `Insufficient availability on ${record.date.toISOString().slice(0, 10)}`,
        );
      }
    }

    // Create hold
    const hold = await this.prisma.propertyInventoryHold.create({
      data: {
        orgId,
        propertyTypeId,
        startDate: start,
        endDate: end,
        units,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // Increment held counts
    await this.prisma.propertyInventory.updateMany({
      where: {
        orgId,
        propertyTypeId,
        date: { in: dates },
      },
      data: { heldUnits: { increment: units } },
    });

    this.logger.log(`Hold created: ${hold.id} for type ${propertyTypeId} in org ${orgId}`);
    return hold;
  }

  /**
   * Release a hold.
   */
  async releaseHold(orgId: string, holdId: string) {
    const hold = await this.prisma.propertyInventoryHold.findFirst({
      where: { id: holdId, orgId, isReleased: false },
    });

    if (!hold) {
      throw new NotFoundException('Hold not found or already released');
    }

    const dates = this.getDateRange(hold.startDate, hold.endDate);

    await this.prisma.$transaction([
      this.prisma.propertyInventoryHold.update({
        where: { id: holdId },
        data: { isReleased: true },
      }),
      this.prisma.propertyInventory.updateMany({
        where: {
          orgId,
          propertyTypeId: hold.propertyTypeId,
          date: { in: dates },
          heldUnits: { gt: 0 },
        },
        data: { heldUnits: { decrement: hold.units } },
      }),
    ]);

    this.logger.log(`Hold ${holdId} released for org ${orgId}`);
    return { message: 'Hold released successfully' };
  }

  /**
   * Confirm a hold (convert held to booked).
   */
  async confirmHold(orgId: string, holdId: string) {
    const hold = await this.prisma.propertyInventoryHold.findFirst({
      where: { id: holdId, orgId, isReleased: false },
    });

    if (!hold) {
      throw new NotFoundException('Hold not found or already released');
    }

    const dates = this.getDateRange(hold.startDate, hold.endDate);

    await this.prisma.$transaction([
      this.prisma.propertyInventory.updateMany({
        where: {
          orgId,
          propertyTypeId: hold.propertyTypeId,
          date: { in: dates },
          heldUnits: { gt: 0 },
        },
        data: {
          heldUnits: { decrement: hold.units },
          bookedUnits: { increment: hold.units },
        },
      }),
    ]);

    this.logger.log(`Hold ${holdId} confirmed for org ${orgId}`);
    return { message: 'Hold confirmed and converted to booking' };
  }
}
