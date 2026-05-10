/**
 * ViCity → TechZunction Central Backend Data Migration
 *
 * Migrates all ViCity (hotel/property management) data from the source
 * PostgreSQL database into the Central Backend's multi-tenant PostgreSQL
 * database under a single `vicity` organization.
 *
 * Usage: npx tsx scripts/migrate-vicity.ts
 *
 * Environment variables:
 *   SOURCE_DATABASE_URL - ViCity database connection string
 *   DATABASE_URL        - Central Backend database connection string
 */

import { PrismaClient as SourcePrisma } from './generated/source-client/index.js';
import { PrismaClient as TargetPrisma } from '@prisma/client';

const source = new SourcePrisma({
  datasourceUrl: process.env.SOURCE_DATABASE_URL,
});
const target = new TargetPrisma();

// ID mapping: source UUID → target UUID
const idMap = new Map<string, string>();

function mapId(sourceId: string): string | undefined {
  return idMap.get(sourceId);
}

function requireId(sourceId: string, context: string): string {
  const id = idMap.get(sourceId);
  if (!id) throw new Error(`Missing ID mapping for ${sourceId} in ${context}`);
  return id;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function mapBookingStatus(status: string): string {
  // ViCity enum: pending, payment_pending, confirmed, checked_in, checked_out, cancelled, refunded
  // Target: pending, payment_pending, confirmed, checked_in, checked_out, cancelled, refunded
  return status;
}

function mapPaymentStatus(status: string): string {
  // ViCity enum: pending, partially_paid, paid, failed, refunded
  // Target: pending, partially_paid, paid, failed, refunded
  return status;
}

function mapPaymentRecordStatus(status: string): string {
  // ViCity Payment.status: pending, paid, failed, refunded
  // Target PropertyPayment.status: pending, captured, failed, refunded
  if (status === 'paid') return 'captured';
  return status;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Starting ViCity → Central Backend migration...\n');
  console.log(`Source DB: ${process.env.SOURCE_DATABASE_URL?.replace(/\/\/.*@/, '//***@')}`);
  console.log(`Target DB: ${process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***@')}\n`);

  // Step 1: Create or find organization
  const org = await findOrCreateOrg();
  console.log(`Organization: ${org.id} (${org.slug})\n`);

  // Step 2: Migrate SystemSettings → OrgSettings
  await migrateSettings(org.id);

  // Step 3: Migrate Users (admin/super_admin → User, guest/user → EndUser)
  await migrateUsers(org.id);

  // Step 4: Migrate RoomType → PropertyType
  await migrateRoomTypes(org.id);

  // Step 5: Migrate RoomUnit → PropertyUnit
  await migrateRoomUnits(org.id);

  // Step 6: Migrate Amenity → PropertyAmenity
  await migrateAmenities(org.id);

  // Step 7: Migrate RoomTypeAmenity → PropertyTypeAmenity
  await migrateRoomTypeAmenities(org.id);

  // Step 8: Migrate Inventory → PropertyInventory
  await migrateInventory(org.id);

  // Step 9: Migrate PricingRule → PropertyPricingRule
  await migratePricingRules(org.id);

  // Step 10: Migrate Booking → PropertyBooking
  await migrateBookings(org.id);

  // Step 11: Migrate BookingRoom → PropertyBookingUnit
  await migrateBookingRooms(org.id);

  // Step 12: Migrate Payment → PropertyPayment
  await migratePayments(org.id);

  // Step 13: Migrate Coupon → DiscountCoupon + CouponUsage → DiscountCouponUsage
  await migrateCoupons(org.id);

  // Step 14: Migrate Review → Review
  await migrateReviews(org.id);

  // Step 15: Migrate Notification → Notification
  await migrateNotifications(org.id);

  // Step 16: Migrate AuditLog → AuditLog
  await migrateAuditLogs(org.id);

  console.log('\n=== Migration Complete ===');
  console.log(`Total ID mappings: ${idMap.size}`);
}

// ─── Step 1: Organization ─────────────────────────────────────────────────────

async function findOrCreateOrg() {
  let org = await target.organization.findUnique({
    where: { slug: 'vicity' },
  });
  if (!org) {
    org = await target.organization.create({
      data: {
        name: 'ViCity',
        slug: 'vicity',
        status: 'active',
      },
    });
    console.log('  Created new organization');

    // Create default OrgConfig
    await target.orgConfig.create({ data: { orgId: org.id } });
    console.log('  Created OrgConfig');
  } else {
    console.log('  Found existing organization');
  }
  return org;
}

// ─── Step 2: Settings ─────────────────────────────────────────────────────────

async function migrateSettings(orgId: string) {
  console.log('Migrating settings...');
  try {
    const settings = await source.systemSettings.findFirst({
      where: { id: 'default' },
    });

    if (!settings) {
      console.log('  Settings: no SystemSettings record found — skipped');
      return;
    }

    // Map each SystemSettings field → OrgSettings group/key pair
    const settingsMap: Array<{ group: string; key: string; value: string; type: string; label: string }> = [
      { group: 'general', key: 'business_name', value: settings.hotelName, type: 'string', label: 'Business Name' },
      { group: 'general', key: 'business_address', value: settings.hotelAddress, type: 'string', label: 'Business Address' },
      { group: 'general', key: 'business_phone', value: settings.hotelPhone, type: 'string', label: 'Business Phone' },
      { group: 'general', key: 'business_email', value: settings.hotelEmail, type: 'string', label: 'Business Email' },
      { group: 'booking', key: 'check_in_time', value: settings.checkInTime, type: 'string', label: 'Check-in Time' },
      { group: 'booking', key: 'check_out_time', value: settings.checkOutTime, type: 'string', label: 'Check-out Time' },
      { group: 'booking', key: 'hold_minutes', value: String(settings.bookingHoldMinutes), type: 'number', label: 'Booking Hold Minutes' },
      { group: 'booking', key: 'advance_payment_percent', value: String(settings.advancePaymentPercent), type: 'number', label: 'Advance Payment Percent' },
      { group: 'booking', key: 'min_nights', value: String(settings.minNights), type: 'number', label: 'Minimum Nights' },
      { group: 'booking', key: 'max_nights', value: String(settings.maxNights), type: 'number', label: 'Maximum Nights' },
      { group: 'booking', key: 'max_guests_included', value: String(settings.maxGuestsIncluded), type: 'number', label: 'Max Guests Included' },
      { group: 'booking', key: 'extra_guest_charge', value: String(settings.extraGuestCharge), type: 'number', label: 'Extra Guest Charge (paise)' },
      { group: 'tax', key: 'rate', value: String(settings.taxRate), type: 'number', label: 'Tax Rate (%)' },
      { group: 'tax', key: 'label', value: settings.taxLabel, type: 'string', label: 'Tax Label' },
      { group: 'general', key: 'currency', value: settings.currency, type: 'string', label: 'Currency' },
      { group: 'general', key: 'currency_symbol', value: settings.currencySymbol, type: 'string', label: 'Currency Symbol' },
      { group: 'general', key: 'timezone', value: settings.timezone, type: 'string', label: 'Timezone' },
    ];

    // Include villaRoomTypeId if set
    if (settings.villaRoomTypeId) {
      settingsMap.push({
        group: 'property',
        key: 'default_property_type_id',
        value: settings.villaRoomTypeId,
        type: 'string',
        label: 'Default Property Type ID (source)',
      });
    }

    let count = 0;
    for (const s of settingsMap) {
      await target.orgSettings.upsert({
        where: {
          orgId_group_key: { orgId, group: s.group, key: s.key },
        },
        update: { value: s.value, type: s.type },
        create: {
          orgId,
          group: s.group,
          key: s.key,
          value: s.value,
          type: s.type,
          label: s.label,
        },
      });
      count++;
    }
    console.log(`  Settings: ${count} migrated`);
  } catch (e) {
    console.error('  Settings migration error:', (e as Error).message);
  }
}

// ─── Step 3: Users ────────────────────────────────────────────────────────────

async function migrateUsers(orgId: string) {
  console.log('Migrating users...');
  try {
    const users = await source.user.findMany();
    let admins = 0;
    let customers = 0;
    let skipped = 0;

    for (const u of users) {
      try {
        if (u.role === 'admin' || u.role === 'super_admin') {
          // Migrate to Backend User (admin/staff)
          const created = await target.user.create({
            data: {
              orgId,
              name: u.name || 'Admin',
              email: u.email || `admin-${u.id}@vicity.in`,
              phone: u.phone,
              passwordHash: u.password,
              isEmailVerified: u.isEmailVerified,
              isPhoneVerified: u.isPhoneVerified,
              status: u.isBlocked ? 'blocked' : 'active',
              metadata: {
                sourceRole: u.role,
                sourceId: u.id,
              },
            },
          });
          idMap.set(u.id, created.id);
          admins++;
        } else {
          // Migrate guest/user → EndUser (customer)
          const created = await target.endUser.create({
            data: {
              orgId,
              externalId: u.id,
              name: u.name,
              email: u.email,
              phone: u.phone,
              passwordHash: u.password,
              isGuest: u.role === 'guest',
              isPhoneVerified: u.isPhoneVerified,
              isEmailVerified: u.isEmailVerified,
              status: u.isBlocked ? 'blocked' : 'active',
              attributes: {
                address: u.address,
                country: u.country,
                profileImage: u.profileImage,
              },
            },
          });
          idMap.set(u.id, created.id);
          customers++;
        }
      } catch (e) {
        console.warn(
          `  Skipped user ${u.id} (${u.email || u.phone}): ${(e as Error).message.slice(0, 80)}`,
        );
        skipped++;
      }
    }
    console.log(
      `  Users: ${admins} admins, ${customers} customers migrated${skipped ? `, ${skipped} skipped` : ''}`,
    );
  } catch (e) {
    console.error('  Users migration error:', (e as Error).message);
  }
}

// ─── Step 4: RoomType → PropertyType ──────────────────────────────────────────

async function migrateRoomTypes(orgId: string) {
  console.log('Migrating room types → property types...');
  try {
    const roomTypes = await source.roomType.findMany();
    let count = 0;

    for (const rt of roomTypes) {
      const slug = slugify(rt.name) || `property-type-${rt.id.slice(0, 8)}`;

      try {
        const created = await target.propertyType.create({
          data: {
            orgId,
            name: rt.name,
            slug,
            description: rt.description,
            basePrice: rt.basePrice,
            maxGuests: rt.maxGuests,
            bedType: rt.bedType,
            unitSize: rt.roomSize ? `${rt.roomSize} sq ft` : null,
            images: rt.images,
            status: rt.status,
            metadata: { sourceId: rt.id },
          },
        });
        idMap.set(rt.id, created.id);
        count++;
      } catch (e) {
        console.warn(
          `  Skipped room type ${rt.id} (${rt.name}): ${(e as Error).message.slice(0, 80)}`,
        );
      }
    }
    console.log(`  Room types → Property types: ${count} migrated`);
  } catch (e) {
    console.error('  Room types migration error:', (e as Error).message);
  }
}

// ─── Step 5: RoomUnit → PropertyUnit ──────────────────────────────────────────

async function migrateRoomUnits(orgId: string) {
  console.log('Migrating room units → property units...');
  try {
    const roomUnits = await source.roomUnit.findMany();
    let count = 0;
    let skipped = 0;

    for (const ru of roomUnits) {
      const propertyTypeId = mapId(ru.roomTypeId);
      if (!propertyTypeId) {
        skipped++;
        continue;
      }

      try {
        const created = await target.propertyUnit.create({
          data: {
            orgId,
            propertyTypeId,
            unitNumber: ru.roomNumber,
            floor: ru.floor,
            status: ru.status,
            housekeepingStatus: ru.housekeepingStatus,
            notes: ru.notes,
          },
        });
        idMap.set(ru.id, created.id);
        count++;
      } catch (e) {
        console.warn(
          `  Skipped room unit ${ru.id} (${ru.roomNumber}): ${(e as Error).message.slice(0, 80)}`,
        );
        skipped++;
      }
    }
    console.log(`  Room units → Property units: ${count} migrated${skipped ? `, ${skipped} skipped` : ''}`);
  } catch (e) {
    console.error('  Room units migration error:', (e as Error).message);
  }
}

// ─── Step 6: Amenity → PropertyAmenity ────────────────────────────────────────

async function migrateAmenities(orgId: string) {
  console.log('Migrating amenities → property amenities...');
  try {
    const amenities = await source.amenity.findMany();
    let count = 0;

    for (const a of amenities) {
      try {
        const created = await target.propertyAmenity.create({
          data: {
            orgId,
            name: a.name,
            icon: a.icon,
            category: a.category,
            isActive: a.isActive,
          },
        });
        idMap.set(a.id, created.id);
        count++;
      } catch (e) {
        console.warn(
          `  Skipped amenity ${a.id} (${a.name}): ${(e as Error).message.slice(0, 80)}`,
        );
      }
    }
    console.log(`  Amenities → Property amenities: ${count} migrated`);
  } catch (e) {
    console.error('  Amenities migration error:', (e as Error).message);
  }
}

// ─── Step 7: RoomTypeAmenity → PropertyTypeAmenity ────────────────────────────

async function migrateRoomTypeAmenities(orgId: string) {
  console.log('Migrating room type amenities → property type amenities...');
  try {
    const rtas = await source.roomTypeAmenity.findMany();
    let count = 0;
    let skipped = 0;

    for (const rta of rtas) {
      const propertyTypeId = mapId(rta.roomTypeId);
      const amenityId = mapId(rta.amenityId);

      if (!propertyTypeId || !amenityId) {
        skipped++;
        continue;
      }

      try {
        await target.propertyTypeAmenity.create({
          data: {
            orgId,
            propertyTypeId,
            amenityId,
          },
        });
        count++;
      } catch (e) {
        console.warn(
          `  Skipped room type amenity ${rta.id}: ${(e as Error).message.slice(0, 80)}`,
        );
        skipped++;
      }
    }
    console.log(
      `  Room type amenities → Property type amenities: ${count} migrated${skipped ? `, ${skipped} skipped` : ''}`,
    );
  } catch (e) {
    console.error('  Room type amenities migration error:', (e as Error).message);
  }
}

// ─── Step 8: Inventory → PropertyInventory ────────────────────────────────────

async function migrateInventory(orgId: string) {
  console.log('Migrating inventory → property inventory...');
  try {
    const records = await source.inventory.findMany();
    let count = 0;
    let skipped = 0;

    for (const inv of records) {
      const propertyTypeId = mapId(inv.roomTypeId);
      if (!propertyTypeId) {
        skipped++;
        continue;
      }

      try {
        await target.propertyInventory.create({
          data: {
            orgId,
            propertyTypeId,
            date: inv.date,
            totalUnits: inv.totalUnits,
            bookedUnits: inv.bookedUnits,
            heldUnits: inv.heldUnits,
            blockedUnits: 0,
            isBlocked: inv.isBlocked,
          },
        });
        count++;
      } catch (e) {
        console.warn(
          `  Skipped inventory ${inv.id}: ${(e as Error).message.slice(0, 80)}`,
        );
        skipped++;
      }
    }
    console.log(
      `  Inventory → Property inventory: ${count} migrated${skipped ? `, ${skipped} skipped` : ''}`,
    );
  } catch (e) {
    console.error('  Inventory migration error:', (e as Error).message);
  }
}

// ─── Step 9: PricingRule → PropertyPricingRule ────────────────────────────────

async function migratePricingRules(orgId: string) {
  console.log('Migrating pricing rules → property pricing rules...');
  try {
    const rules = await source.pricingRule.findMany();
    let count = 0;
    let skipped = 0;

    for (const pr of rules) {
      const propertyTypeId = mapId(pr.roomTypeId);
      if (!propertyTypeId) {
        skipped++;
        continue;
      }

      try {
        const created = await target.propertyPricingRule.create({
          data: {
            orgId,
            propertyTypeId,
            name: `${pr.type} rule`,
            type: pr.type,
            price: pr.price,
            multiplier: pr.multiplier,
            startDate: pr.startDate,
            endDate: pr.endDate,
            daysOfWeek: pr.daysOfWeek,
            minStay: pr.minStay,
            maxStay: pr.maxStay,
            priority: pr.priority,
            isActive: pr.isActive,
          },
        });
        idMap.set(pr.id, created.id);
        count++;
      } catch (e) {
        console.warn(
          `  Skipped pricing rule ${pr.id}: ${(e as Error).message.slice(0, 80)}`,
        );
        skipped++;
      }
    }
    console.log(
      `  Pricing rules → Property pricing rules: ${count} migrated${skipped ? `, ${skipped} skipped` : ''}`,
    );
  } catch (e) {
    console.error('  Pricing rules migration error:', (e as Error).message);
  }
}

// ─── Step 10: Booking → PropertyBooking ───────────────────────────────────────

async function migrateBookings(orgId: string) {
  console.log('Migrating bookings → property bookings...');
  try {
    const bookings = await source.booking.findMany({
      orderBy: { createdAt: 'asc' },
    });
    let count = 0;
    let skipped = 0;

    for (const b of bookings) {
      const propertyTypeId = mapId(b.roomTypeId);
      if (!propertyTypeId) {
        console.warn(`  Skipped booking ${b.id}: missing property type mapping for ${b.roomTypeId}`);
        skipped++;
        continue;
      }

      // Booking requires an endUserId — resolve from userId or create a placeholder
      let endUserId = b.userId ? mapId(b.userId) : undefined;
      if (!endUserId) {
        // Guest booking without user — create or find an EndUser by phone
        try {
          const existing = await target.endUser.findUnique({
            where: {
              orgId_phone: { orgId, phone: b.guestPhone },
            },
          });
          if (existing) {
            endUserId = existing.id;
          } else {
            const guestUser = await target.endUser.create({
              data: {
                orgId,
                externalId: b.guestSessionId || `guest-${b.id}`,
                name: b.guestName,
                email: b.guestEmail,
                phone: b.guestPhone,
                isGuest: true,
                status: 'active',
                attributes: {
                  address: b.guestAddress,
                  country: b.guestCountry,
                },
              },
            });
            endUserId = guestUser.id;
            if (b.guestSessionId) {
              idMap.set(b.guestSessionId, guestUser.id);
            }
          }
        } catch (e) {
          console.warn(
            `  Skipped booking ${b.id}: could not resolve end user: ${(e as Error).message.slice(0, 80)}`,
          );
          skipped++;
          continue;
        }
      }

      try {
        const created = await target.propertyBooking.create({
          data: {
            orgId,
            bookingReference: b.bookingReference,
            endUserId,
            propertyTypeId,
            checkInDate: b.checkInDate,
            checkOutDate: b.checkOutDate,
            nights: b.nights,
            guestCount: b.guestCount,
            guestName: b.guestName,
            guestPhone: b.guestPhone,
            guestEmail: b.guestEmail,
            baseAmount: b.baseAmount,
            taxAmount: b.taxAmount,
            discountAmount: b.discountAmount,
            extraGuestCharge: b.extraGuestCharge,
            totalAmount: b.totalAmount,
            status: mapBookingStatus(b.status),
            paymentStatus: mapPaymentStatus(b.paymentStatus),
            paymentType: b.paymentType,
            couponCode: b.couponCode,
            specialRequests: b.specialRequests,
            notes: b.notes,
            cancellationReason: b.cancellationReason,
            checkedInAt: b.checkedInAt,
            checkedOutAt: b.checkedOutAt,
            cancelledAt: b.cancelledAt,
            metadata: {
              sourceId: b.id,
              guestAddress: b.guestAddress,
              guestCountry: b.guestCountry,
              guestSessionId: b.guestSessionId,
              paidAmount: b.paidAmount,
              refundAmount: b.refundAmount,
            },
            createdAt: b.createdAt,
          },
        });
        idMap.set(b.id, created.id);
        count++;
      } catch (e) {
        console.warn(
          `  Skipped booking ${b.id} (${b.bookingReference}): ${(e as Error).message.slice(0, 80)}`,
        );
        skipped++;
      }
    }
    console.log(
      `  Bookings → Property bookings: ${count} migrated${skipped ? `, ${skipped} skipped` : ''}`,
    );
  } catch (e) {
    console.error('  Bookings migration error:', (e as Error).message);
  }
}

// ─── Step 11: BookingRoom → PropertyBookingUnit ───────────────────────────────

async function migrateBookingRooms(orgId: string) {
  console.log('Migrating booking rooms → property booking units...');
  try {
    const bookingRooms = await source.bookingRoom.findMany();
    let count = 0;
    let skipped = 0;

    for (const br of bookingRooms) {
      const bookingId = mapId(br.bookingId);
      const unitId = br.roomUnitId ? mapId(br.roomUnitId) : undefined;

      if (!bookingId) {
        skipped++;
        continue;
      }

      // PropertyBookingUnit requires a unitId — skip if no room unit was assigned
      if (!unitId) {
        console.warn(
          `  Skipped booking room ${br.id}: no unit assignment (roomUnitId=${br.roomUnitId || 'null'})`,
        );
        skipped++;
        continue;
      }

      try {
        await target.propertyBookingUnit.create({
          data: {
            orgId,
            bookingId,
            unitId,
          },
        });
        count++;
      } catch (e) {
        console.warn(
          `  Skipped booking room ${br.id}: ${(e as Error).message.slice(0, 80)}`,
        );
        skipped++;
      }
    }
    console.log(
      `  Booking rooms → Property booking units: ${count} migrated${skipped ? `, ${skipped} skipped` : ''}`,
    );
  } catch (e) {
    console.error('  Booking rooms migration error:', (e as Error).message);
  }
}

// ─── Step 12: Payment → PropertyPayment ───────────────────────────────────────

async function migratePayments(orgId: string) {
  console.log('Migrating payments → property payments...');
  try {
    const payments = await source.payment.findMany();
    let count = 0;
    let skipped = 0;

    for (const p of payments) {
      const bookingId = mapId(p.bookingId);
      if (!bookingId) {
        skipped++;
        continue;
      }

      try {
        const created = await target.propertyPayment.create({
          data: {
            orgId,
            bookingId,
            providerOrderId: p.razorpayOrderId,
            providerPaymentId: p.razorpayPaymentId,
            providerSignature: p.razorpaySignature,
            amount: p.amount,
            type: p.type,
            status: mapPaymentRecordStatus(p.status),
            refundId: p.refundId,
            refundAmount: p.refundAmount,
            failureReason: p.failureReason,
            metadata: {
              sourceId: p.id,
              currency: p.currency,
              method: p.method,
              refundReason: p.refundReason,
              refundedAt: p.refundedAt?.toISOString(),
            },
            createdAt: p.createdAt,
          },
        });
        idMap.set(p.id, created.id);
        count++;
      } catch (e) {
        console.warn(
          `  Skipped payment ${p.id}: ${(e as Error).message.slice(0, 80)}`,
        );
        skipped++;
      }
    }
    console.log(
      `  Payments → Property payments: ${count} migrated${skipped ? `, ${skipped} skipped` : ''}`,
    );
  } catch (e) {
    console.error('  Payments migration error:', (e as Error).message);
  }
}

// ─── Step 13: Coupon → DiscountCoupon + CouponUsage → DiscountCouponUsage ────

async function migrateCoupons(orgId: string) {
  console.log('Migrating coupons...');
  try {
    const coupons = await source.coupon.findMany({
      include: { usages: true },
    });
    let couponCount = 0;
    let usageCount = 0;

    for (const c of coupons) {
      try {
        const created = await target.discountCoupon.create({
          data: {
            orgId,
            code: c.code,
            name: c.code,
            discountType: c.discountType,
            discountValue: c.discountValue,
            minOrderAmount: c.minBookingValue,
            maxDiscountAmount: c.maxDiscountAmount,
            maxUsageTotal: c.usageLimit,
            maxUsagePerUser: c.perUserLimit,
            usageCount: c.usageCount,
            applicableVariantTypes: [],
            applicableOrderTypes: [],
            expiresAt: c.expiryDate,
            isActive: c.isActive,
          },
        });
        idMap.set(c.id, created.id);
        couponCount++;

        // Migrate usages
        for (const u of c.usages) {
          const endUserId = u.userId ? mapId(u.userId) : undefined;
          if (!endUserId) continue;

          try {
            await target.discountCouponUsage.create({
              data: {
                orgId,
                couponId: created.id,
                endUserId,
                commerceOrderId: null, // ViCity bookings are not CommerceOrders
                discountAmount: 0, // ViCity CouponUsage doesn't store discount amount
                createdAt: u.createdAt,
              },
            });
            usageCount++;
          } catch (e) {
            console.warn(
              `  Skipped coupon usage ${u.id}: ${(e as Error).message.slice(0, 80)}`,
            );
          }
        }
      } catch (e) {
        console.warn(
          `  Skipped coupon ${c.id} (${c.code}): ${(e as Error).message.slice(0, 80)}`,
        );
      }
    }
    console.log(`  Coupons: ${couponCount} migrated, usages: ${usageCount} migrated`);
  } catch (e) {
    console.error('  Coupons migration error:', (e as Error).message);
  }
}

// ─── Step 14: Review → Review ─────────────────────────────────────────────────

async function migrateReviews(orgId: string) {
  console.log('Migrating reviews...');
  try {
    const reviews = await source.review.findMany();
    let count = 0;
    let skipped = 0;

    for (const r of reviews) {
      const endUserId = mapId(r.userId);
      if (!endUserId) {
        skipped++;
        continue;
      }

      try {
        const created = await target.review.create({
          data: {
            orgId,
            endUserId,
            catalogItemId: null,
            commerceOrderId: null,
            rating: r.rating,
            title: r.title,
            body: r.body,
            status: r.status === 'hidden' ? 'rejected' : r.status,
            isVerified: true,
            helpfulCount: 0,
          },
        });
        idMap.set(r.id, created.id);
        count++;
      } catch (e) {
        console.warn(
          `  Skipped review ${r.id}: ${(e as Error).message.slice(0, 80)}`,
        );
        skipped++;
      }
    }
    console.log(`  Reviews: ${count} migrated${skipped ? `, ${skipped} skipped` : ''}`);
  } catch (e) {
    console.error('  Reviews migration error:', (e as Error).message);
  }
}

// ─── Step 15: Notification → Notification ─────────────────────────────────────

async function migrateNotifications(orgId: string) {
  console.log('Migrating notifications...');
  try {
    const notifications = await source.notification.findMany();
    let count = 0;
    let skipped = 0;

    for (const n of notifications) {
      const endUserId = mapId(n.userId);
      if (!endUserId) {
        skipped++;
        continue;
      }

      try {
        await target.notification.create({
          data: {
            orgId,
            endUserId,
            type: 'in_app',
            title: n.title,
            body: n.body,
            data: n.metadata,
            status: n.isRead ? 'read' : 'sent',
            readAt: n.isRead ? n.createdAt : null,
            sentAt: n.createdAt,
            createdAt: n.createdAt,
          },
        });
        count++;
      } catch (e) {
        console.warn(
          `  Skipped notification ${n.id}: ${(e as Error).message.slice(0, 80)}`,
        );
        skipped++;
      }
    }
    console.log(`  Notifications: ${count} migrated${skipped ? `, ${skipped} skipped` : ''}`);
  } catch (e) {
    console.error('  Notifications migration error:', (e as Error).message);
  }
}

// ─── Step 16: AuditLog → AuditLog ────────────────────────────────────────────

async function migrateAuditLogs(orgId: string) {
  console.log('Migrating audit logs...');
  try {
    const logs = await source.auditLog.findMany({
      orderBy: { createdAt: 'asc' },
    });
    let count = 0;
    let skipped = 0;

    for (const log of logs) {
      // actorId maps to either a User or EndUser — try to resolve
      const actorId = mapId(log.actorId);

      try {
        await target.auditLog.create({
          data: {
            orgId,
            actorId: actorId || null,
            actorType: log.actorRole === 'admin' || log.actorRole === 'super_admin' ? 'user' : 'end_user',
            action: log.action,
            resourceType: log.resourceType,
            resourceId: null, // Source resourceId is a string, not guaranteed to be UUID
            changes: {
              previousValue: log.previousValue,
              newValue: log.newValue,
              sourceResourceId: log.resourceId,
            },
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            createdAt: log.createdAt,
          },
        });
        count++;
      } catch (e) {
        console.warn(
          `  Skipped audit log ${log.id}: ${(e as Error).message.slice(0, 80)}`,
        );
        skipped++;
      }
    }
    console.log(`  Audit logs: ${count} migrated${skipped ? `, ${skipped} skipped` : ''}`);
  } catch (e) {
    console.error('  Audit logs migration error:', (e as Error).message);
  }
}

// ─── Run ──────────────────────────────────────────────────────────────────────

main()
  .then(async () => {
    await source.$disconnect();
    await target.$disconnect();
  })
  .catch(async (e) => {
    console.error('Fatal migration error:', e);
    await source.$disconnect();
    await target.$disconnect();
    process.exit(1);
  });
