import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { OrgSettingsService } from '../org-settings/org-settings.service.js';

export interface DeliveryCalculation {
  fee: number;
  minOrder: number | null;
  zoneName: string | null;
  estimatedMinutes: number;
}

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orgSettings: OrgSettingsService,
  ) {}

  /**
   * Validate that the given order type is allowed for this org.
   * Checks delivery, pickup, and dine-in enablement settings.
   */
  async validateOrderTypeAllowed(orgId: string, orderType: string): Promise<void> {
    switch (orderType) {
      case 'delivery': {
        const deliveryEnabled = await this.orgSettings.getTyped<boolean>(
          orgId, 'delivery', 'enabled', true,
        );
        if (!deliveryEnabled) {
          throw new BadRequestException('Delivery is currently disabled for this store');
        }
        break;
      }
      case 'pickup': {
        const pickupEnabled = await this.orgSettings.getTyped<boolean>(
          orgId, 'delivery', 'pickup_enabled', true,
        );
        if (!pickupEnabled) {
          throw new BadRequestException('Pickup is currently disabled for this store');
        }
        break;
      }
      case 'dine_in': {
        const dineInEnabled = await this.orgSettings.getTyped<boolean>(
          orgId, 'delivery', 'dine_in_enabled', true,
        );
        if (!dineInEnabled) {
          throw new BadRequestException('Dine-in is currently disabled for this store');
        }
        break;
      }
    }
  }

  /**
   * Validate that the delivery distance does not exceed the configured maximum.
   * If lat/lng are not provided or no max is configured, validation is skipped.
   */
  async validateDeliveryDistance(
    orgId: string,
    locationId: string,
    lat?: number,
    lng?: number,
  ): Promise<void> {
    if (lat === undefined || lng === undefined) return;

    const maxDistanceKm = await this.orgSettings.getTyped<number>(
      orgId, 'delivery', 'max_distance_km', 0,
    );

    if (maxDistanceKm <= 0) return; // 0 means no limit

    // Try to find the closest zone center or use the location itself
    const zones = await this.prisma.deliveryZone.findMany({
      where: { orgId, locationId, isActive: true },
    });

    // Check distance against each zone center
    for (const zone of zones) {
      if (zone.centerLat !== null && zone.centerLng !== null) {
        const distance = this.haversineKm(lat, lng, zone.centerLat, zone.centerLng);
        if (distance <= maxDistanceKm) {
          return; // Within an acceptable zone
        }
      }
    }

    // If no zones have centers, skip the check
    const zonesWithCenters = zones.filter(z => z.centerLat !== null && z.centerLng !== null);
    if (zonesWithCenters.length === 0) return;

    throw new BadRequestException(
      `Delivery address is beyond the maximum delivery distance of ${maxDistanceKm} km`,
    );
  }

  /**
   * Calculate delivery fee by finding the matching delivery zone.
   * Applies free delivery when order subtotal exceeds the configured threshold.
   */
  async calculateFee(
    orgId: string,
    locationId: string,
    pincode?: string,
    lat?: number,
    lng?: number,
    orderSubtotal?: number,
  ): Promise<DeliveryCalculation> {
    const zone = await this.findZone(orgId, locationId, pincode, lat, lng);
    const eta = await this.calculateEta(orgId, locationId, 'delivery');

    // Check free delivery threshold from OrgSettings
    const freeAbove = await this.orgSettings.getTyped<number>(orgId, 'delivery', 'free_above', 499);
    const isFreeDelivery = orderSubtotal !== undefined && freeAbove > 0 && orderSubtotal >= freeAbove;

    if (!zone) {
      // Fall back to org-level delivery settings
      const defaultFee = await this.orgSettings.getTyped<number>(orgId, 'delivery', 'fee', 40);
      return {
        fee: isFreeDelivery ? 0 : defaultFee,
        minOrder: null,
        zoneName: null,
        estimatedMinutes: eta,
      };
    }

    return {
      fee: isFreeDelivery ? 0 : Number(zone.fee),
      minOrder: zone.minOrder ? Number(zone.minOrder) : null,
      zoneName: zone.name,
      estimatedMinutes: eta,
    };
  }

  /**
   * Calculate estimated delivery/pickup time in minutes.
   * Uses OrgSettings for configurable values.
   */
  async calculateEta(
    orgId: string,
    _locationId: string,
    orderType: string,
  ): Promise<number> {
    // Prep time is added to both pickup and delivery ETAs
    const prepTime = await this.orgSettings.getTyped<number>(
      orgId,
      'delivery',
      'prep_time_minutes',
      20,
    );

    if (orderType === 'pickup') {
      const pickupEta = await this.orgSettings.getTyped<number>(
        orgId,
        'delivery',
        'pickup_eta_minutes',
        15,
      );
      return prepTime + pickupEta;
    }

    const deliveryEta = await this.orgSettings.getTyped<number>(
      orgId,
      'delivery',
      'delivery_eta_minutes',
      30,
    );
    return prepTime + deliveryEta;
  }

  /**
   * Find the matching delivery zone for a given pincode or lat/lng.
   * Pincode matching takes priority; falls back to radius-based matching.
   */
  async findZone(
    orgId: string,
    locationId: string,
    pincode?: string,
    lat?: number,
    lng?: number,
  ) {
    const zones = await this.prisma.deliveryZone.findMany({
      where: { orgId, locationId, isActive: true },
    });

    if (zones.length === 0) {
      return null;
    }

    // 1. Try pincode match
    if (pincode) {
      for (const zone of zones) {
        const pincodes = zone.pincodes as string[];
        if (Array.isArray(pincodes) && pincodes.includes(pincode)) {
          this.logger.debug(`Pincode ${pincode} matched zone ${zone.id} (${zone.name})`);
          return zone;
        }
      }
    }

    // 2. Try radius match (Haversine distance)
    if (lat !== undefined && lng !== undefined) {
      for (const zone of zones) {
        if (
          zone.radiusKm !== null &&
          zone.centerLat !== null &&
          zone.centerLng !== null
        ) {
          const distance = this.haversineKm(
            lat,
            lng,
            zone.centerLat,
            zone.centerLng,
          );
          if (distance <= zone.radiusKm) {
            this.logger.debug(
              `Coordinates (${lat}, ${lng}) within ${distance.toFixed(1)}km of zone ${zone.id} (${zone.name})`,
            );
            return zone;
          }
        }
      }
    }

    return null;
  }

  /**
   * Haversine formula to calculate the distance between two lat/lng points in km.
   */
  private haversineKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  // ─── Order Tracking ──────────────────────────────────────────────────────

  /**
   * Get delivery tracking info for an order.
   * Returns the order's current delivery status from CommerceOrder.
   */
  async getOrderTracking(orgId: string, endUserId: string, orderId: string) {
    const order = await this.prisma.commerceOrder.findFirst({
      where: { id: orderId, orgId, endUserId },
      select: {
        id: true,
        status: true,
        orderType: true,
        scheduledAt: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Extract courier info from metadata if available
    const meta = (order.metadata as Record<string, any>) ?? {};

    return {
      orderId: order.id,
      status: order.status,
      estimatedDelivery: order.scheduledAt ?? meta['estimatedDelivery'] ?? null,
      courierName: meta['courierName'] ?? null,
      courierPhone: meta['courierPhone'] ?? null,
    };
  }
}
