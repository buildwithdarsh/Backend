/**
 * BurgerEmpire → TechZunction Central Backend Data Migration
 *
 * Migrates all BurgerEmpire data from the source PostgreSQL database into
 * the Central Backend's multi-tenant PostgreSQL database under a single
 * `burgerempire` organization.
 *
 * Usage: npx tsx scripts/migrate-burgerempire.ts
 *
 * Environment variables:
 *   SOURCE_DATABASE_URL - BurgerEmpire database connection string
 *   DATABASE_URL        - Central Backend database connection string
 */

import { PrismaClient as SourcePrisma } from './generated/source-client/index.js';
import { PrismaClient as TargetPrisma } from '@prisma/client';

const source = new SourcePrisma({
  datasourceUrl: process.env.SOURCE_DATABASE_URL,
});
const target = new TargetPrisma();

// ID mapping: source cuid → target UUID
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

function parseJsonString(val: string | null | undefined): any {
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
}

function mapTaxType(numericType: number): string {
  // BurgerEmpire uses 1=percentage, 2=fixed
  return numericType === 2 ? 'fixed' : 'percentage';
}

function mapOrderType(numericType: number): string {
  // BurgerEmpire uses 1=delivery, 2=pickup, 3=dinein
  switch (numericType) {
    case 1:
      return 'delivery';
    case 2:
      return 'pickup';
    case 3:
      return 'dine_in';
    default:
      return 'all';
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Starting BurgerEmpire → Central Backend migration...\n');
  console.log(`Source DB: ${process.env.SOURCE_DATABASE_URL?.replace(/\/\/.*@/, '//***@')}`);
  console.log(`Target DB: ${process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***@')}\n`);

  // Step 1: Create or find organization
  const org = await findOrCreateOrg();
  console.log(`Organization: ${org.id} (${org.slug})\n`);

  // Step 2: Migrate SystemSettings → OrgSettings
  await migrateSettings(org.id);

  // Step 3: Migrate Users (admin → User, customer → EndUser)
  await migrateUsers(org.id);

  // Step 4: Migrate Addresses → EndUserAddress
  await migrateAddresses(org.id);

  // Step 5: Migrate Categories → CatalogCategory
  await migrateCategories(org.id);

  // Step 6: Migrate MenuItems → CatalogItem + CatalogItemVariant
  await migrateMenuItems(org.id);

  // Step 7: Migrate Variations → CatalogSizeVariation
  await migrateVariations(org.id);

  // Step 8: Migrate AddonGroups → CatalogOptionGroup + Addons → CatalogOption
  await migrateAddonGroups(org.id);

  // Step 9: Migrate ItemTaxes → CatalogItemTax
  await migrateItemTaxes(org.id);

  // Step 10: Migrate LoyaltyAccounts + LoyaltyTransactions
  await migrateLoyalty(org.id);

  // Step 11: Migrate Coupons → DiscountCoupon
  await migrateCoupons(org.id);

  // Step 12: Migrate Orders + OrderItems + OrderItemAddons
  await migrateOrders(org.id);

  // Step 13: Migrate Promotions
  await migratePromotions(org.id);

  // Step 14: Migrate Referrals
  await migrateReferrals(org.id);

  // Step 15: Migrate Reviews
  await migrateReviews(org.id);

  // Step 16: Migrate GiftCards + GiftCardTransactions
  await migrateGiftCards(org.id);

  // Step 17: Migrate Reservations
  await migrateReservations(org.id);

  // Step 18: Migrate Notifications
  await migrateNotifications(org.id);

  // Step 19: Migrate Locations + StoreHours
  await migrateLocations(org.id);

  // Step 20: Migrate Blog → ContentPost
  await migrateBlogPosts(org.id);

  // Step 21: Migrate WhatsApp Sessions → ConversationSession
  await migrateWhatsAppSessions(org.id);

  // Step 22: Migrate SupportTickets
  await migrateSupportTickets(org.id);

  console.log('\n=== Migration Complete ===');
  console.log(`Total ID mappings: ${idMap.size}`);
}

// ─── Step 1: Organization ─────────────────────────────────────────────────────

async function findOrCreateOrg() {
  let org = await target.organization.findUnique({
    where: { slug: 'burgerempire' },
  });
  if (!org) {
    org = await target.organization.create({
      data: {
        name: 'BurgerEmpire',
        slug: 'burgerempire',
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
    const settings = await source.systemSetting.findMany();
    let count = 0;

    for (const s of settings) {
      // BurgerEmpire SystemSetting has key (PK), value, label, group
      // Target OrgSettings has orgId, group, key, value, type, label
      // We need to split the BB key if it contains a dot, or use group field
      const group = s.group || 'general';
      const key = s.key;

      await target.orgSettings.upsert({
        where: {
          orgId_group_key: { orgId, group, key },
        },
        update: { value: s.value, type: 'string' },
        create: {
          orgId,
          group,
          key,
          value: s.value,
          type: 'string',
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
        if (u.role === 'admin') {
          // Migrate to Backend User (admin/staff)
          const created = await target.user.create({
            data: {
              orgId,
              name: u.name || 'Admin',
              email: u.email || `admin-${u.id}@burgerempire.in`,
              phone: u.phone,
              passwordHash: u.passwordHash,
              isEmailVerified: true,
              isPhoneVerified: !!u.phone,
              status: 'active',
            },
          });
          idMap.set(u.id, created.id);
          admins++;
        } else {
          // Migrate to EndUser (customer)
          const created = await target.endUser.create({
            data: {
              orgId,
              externalId: u.id,
              name: u.name,
              email: u.email,
              phone: u.phone,
              passwordHash: u.passwordHash,
              isGuest: u.isGuest,
              isPhoneVerified: !!u.phone,
              isEmailVerified: !!u.email,
              referralCode: u.referralCode,
              status: 'active',
            },
          });
          idMap.set(u.id, created.id);
          customers++;
        }
      } catch (e) {
        // Unique constraint violations (duplicate email/phone) — skip
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

// ─── Step 4: Addresses ────────────────────────────────────────────────────────

async function migrateAddresses(orgId: string) {
  console.log('Migrating addresses...');
  try {
    const addresses = await source.address.findMany();
    let count = 0;
    let skipped = 0;

    for (const a of addresses) {
      const endUserId = mapId(a.userId);
      if (!endUserId) {
        skipped++;
        continue;
      }

      try {
        const created = await target.endUserAddress.create({
          data: {
            orgId,
            endUserId,
            label: a.label || 'Home',
            line1: a.line1 || '',
            line2: a.line2,
            city: a.city || '',
            pincode: a.pincode || '',
            lat: a.lat,
            lng: a.lng,
            isDefault: a.isDefault,
          },
        });
        idMap.set(a.id, created.id);
        count++;
      } catch (e) {
        console.warn(`  Skipped address ${a.id}: ${(e as Error).message.slice(0, 80)}`);
        skipped++;
      }
    }
    console.log(`  Addresses: ${count} migrated${skipped ? `, ${skipped} skipped` : ''}`);
  } catch (e) {
    console.error('  Addresses migration error:', (e as Error).message);
  }
}

// ─── Step 5: Categories ───────────────────────────────────────────────────────

async function migrateCategories(orgId: string) {
  console.log('Migrating categories...');
  try {
    const categories = await source.category.findMany({
      orderBy: { rank: 'asc' },
    });
    let count = 0;

    for (const c of categories) {
      const slug = slugify(c.name) || `category-${c.id}`;

      try {
        const created = await target.catalogCategory.create({
          data: {
            orgId,
            externalId: c.id,
            name: c.name,
            slug,
            imageUrl: c.imageUrl,
            rank: c.rank,
            isActive: c.isActive,
            parentId: c.parentId ? mapId(c.parentId) : null,
          },
        });
        idMap.set(c.id, created.id);
        count++;
      } catch (e) {
        console.warn(`  Skipped category ${c.id} (${c.name}): ${(e as Error).message.slice(0, 80)}`);
      }
    }
    console.log(`  Categories: ${count} migrated`);
  } catch (e) {
    console.error('  Categories migration error:', (e as Error).message);
  }
}

// ─── Step 6: Menu Items ───────────────────────────────────────────────────────

async function migrateMenuItems(orgId: string) {
  console.log('Migrating menu items...');
  try {
    const items = await source.menuItemDB.findMany();
    let count = 0;
    let skipped = 0;

    for (const item of items) {
      const categoryId = mapId(item.categoryId);
      if (!categoryId) {
        skipped++;
        continue;
      }

      const slug = slugify(item.classicName) || `item-${item.id}`;

      try {
        // Parse allergens — stored as JSON string in BB
        let allergens: any = [];
        try {
          allergens = typeof item.allergens === 'string' ? JSON.parse(item.allergens) : item.allergens;
        } catch {
          allergens = [];
        }

        const created = await target.catalogItem.create({
          data: {
            orgId,
            categoryId,
            externalId: item.posItemId || item.id,
            slug,
            dietType: item.diet,
            inStock: item.inStock,
            sortOrder: item.sortOrder || 0,
            isFeatured: item.isBestseller,
            isNew: item.isNew,
            avgRating: item.avgRating,
            reviewCount: item.reviewCount,
            allergens,
            tags: [],
            taxConfig: {
              taxInclusive: item.taxInclusive,
              ignoreTaxes: item.ignoreTaxes,
              ignoreDiscounts: item.ignoreDiscounts,
            },
          },
        });
        idMap.set(item.id, created.id);

        // Create classic variant
        await target.catalogItemVariant.create({
          data: {
            orgId,
            itemId: created.id,
            variantType: 'classic',
            name: item.classicName,
            description: item.classicDescription,
            price: item.classicPrice,
            imageUrl: item.classicImage,
            nutritionData: item.classicCalories
              ? { calories: item.classicCalories }
              : null,
            isActive: true,
          },
        });

        // Create healthy variant
        await target.catalogItemVariant.create({
          data: {
            orgId,
            itemId: created.id,
            variantType: 'healthy',
            name: item.healthyName || item.classicName,
            description: item.healthyDescription,
            price: item.healthyPrice || item.classicPrice,
            imageUrl: item.healthyImage || item.classicImage,
            nutritionData: {
              calories: item.healthyCalories,
              protein: item.healthyProtein,
              fats: item.healthyFats,
              carbs: item.healthyCarbs,
              healthySwaps: parseJsonString(item.healthySwaps),
            },
            isActive: true,
          },
        });

        count++;
      } catch (e) {
        console.warn(
          `  Skipped item ${item.id} (${item.classicName}): ${(e as Error).message.slice(0, 80)}`,
        );
        skipped++;
      }
    }
    console.log(
      `  Menu items: ${count} migrated (with classic + healthy variants each)${skipped ? `, ${skipped} skipped` : ''}`,
    );
  } catch (e) {
    console.error('  Menu items migration error:', (e as Error).message);
  }
}

// ─── Step 7: Variations ───────────────────────────────────────────────────────

async function migrateVariations(orgId: string) {
  console.log('Migrating size variations...');
  try {
    const variations = await source.variation.findMany();
    let count = 0;
    let skipped = 0;

    for (const v of variations) {
      const itemId = mapId(v.menuItemId);
      if (!itemId) {
        skipped++;
        continue;
      }

      try {
        const created = await target.catalogSizeVariation.create({
          data: {
            orgId,
            itemId,
            externalId: v.posVariationId || v.id,
            name: v.name,
            groupName: v.groupName || 'Size',
            price: v.price,
            inStock: v.inStock,
            sortOrder: v.sortOrder || 0,
          },
        });
        idMap.set(v.id, created.id);
        count++;
      } catch (e) {
        console.warn(`  Skipped variation ${v.id}: ${(e as Error).message.slice(0, 80)}`);
        skipped++;
      }
    }
    console.log(`  Size variations: ${count} migrated${skipped ? `, ${skipped} skipped` : ''}`);
  } catch (e) {
    console.error('  Variations migration error:', (e as Error).message);
  }
}

// ─── Step 8: Addon Groups & Addons ────────────────────────────────────────────

async function migrateAddonGroups(orgId: string) {
  console.log('Migrating addon groups & addons...');
  try {
    const groups = await source.addonGroup.findMany({
      include: { addons: true },
    });
    let groupCount = 0;
    let addonCount = 0;
    let skipped = 0;

    for (const g of groups) {
      const itemId = mapId(g.menuItemId);
      if (!itemId) {
        skipped++;
        continue;
      }

      try {
        const createdGroup = await target.catalogOptionGroup.create({
          data: {
            orgId,
            itemId,
            externalId: g.posGroupId || g.id,
            name: g.name,
            minSelection: g.minSelection,
            maxSelection: g.maxSelection,
            rank: g.rank || 0,
          },
        });
        idMap.set(g.id, createdGroup.id);
        groupCount++;

        for (const a of g.addons) {
          try {
            const createdAddon = await target.catalogOption.create({
              data: {
                orgId,
                groupId: createdGroup.id,
                externalId: a.posAddonId || a.id,
                name: a.name,
                price: a.price,
                inStock: a.inStock,
                rank: a.rank || 0,
                isActive: a.active,
              },
            });
            idMap.set(a.id, createdAddon.id);
            addonCount++;
          } catch (e) {
            console.warn(`  Skipped addon ${a.id}: ${(e as Error).message.slice(0, 80)}`);
          }
        }
      } catch (e) {
        console.warn(`  Skipped addon group ${g.id}: ${(e as Error).message.slice(0, 80)}`);
        skipped++;
      }
    }
    console.log(
      `  Addon groups: ${groupCount}, Addons: ${addonCount} migrated${skipped ? `, ${skipped} skipped` : ''}`,
    );
  } catch (e) {
    console.error('  Addon groups migration error:', (e as Error).message);
  }
}

// ─── Step 9: Item Taxes ───────────────────────────────────────────────────────

async function migrateItemTaxes(orgId: string) {
  console.log('Migrating item taxes...');
  try {
    const taxes = await source.itemTax.findMany();
    let count = 0;
    let skipped = 0;

    for (const t of taxes) {
      const itemId = mapId(t.menuItemId);
      if (!itemId) {
        skipped++;
        continue;
      }

      try {
        await target.catalogItemTax.create({
          data: {
            orgId,
            itemId,
            externalId: t.taxId || t.id,
            name: t.taxName,
            rate: t.taxValue,
            taxType: mapTaxType(t.taxType),
            orderType: mapOrderType(t.orderType),
          },
        });
        count++;
      } catch (e) {
        console.warn(`  Skipped item tax ${t.id}: ${(e as Error).message.slice(0, 80)}`);
        skipped++;
      }
    }
    console.log(`  Item taxes: ${count} migrated${skipped ? `, ${skipped} skipped` : ''}`);
  } catch (e) {
    console.error('  Item taxes migration error:', (e as Error).message);
  }
}

// ─── Step 10: Loyalty ─────────────────────────────────────────────────────────

async function migrateLoyalty(orgId: string) {
  console.log('Migrating loyalty accounts & transactions...');
  try {
    const accounts = await source.loyaltyAccount.findMany({
      include: { transactions: true },
    });
    let accCount = 0;
    let txCount = 0;
    let skipped = 0;

    for (const a of accounts) {
      const endUserId = mapId(a.userId);
      if (!endUserId) {
        skipped++;
        continue;
      }

      try {
        const created = await target.loyaltyAccount.create({
          data: {
            orgId,
            endUserId,
            balance: a.balance,
            totalEarned: a.totalEarned,
            totalRedeemed: a.totalRedeemed,
            tier: a.tier,
          },
        });
        idMap.set(a.id, created.id);
        accCount++;

        for (const t of a.transactions) {
          try {
            await target.loyaltyTransaction.create({
              data: {
                orgId,
                accountId: created.id,
                type: t.type,
                points: t.coins,
                description: t.description,
                commerceOrderId: t.orderId ? mapId(t.orderId) : null,
              },
            });
            txCount++;
          } catch (e) {
            console.warn(`  Skipped loyalty tx ${t.id}: ${(e as Error).message.slice(0, 80)}`);
          }
        }
      } catch (e) {
        console.warn(
          `  Skipped loyalty account ${a.id}: ${(e as Error).message.slice(0, 80)}`,
        );
        skipped++;
      }
    }
    console.log(
      `  Loyalty accounts: ${accCount}, transactions: ${txCount} migrated${skipped ? `, ${skipped} skipped` : ''}`,
    );
  } catch (e) {
    console.error('  Loyalty migration error:', (e as Error).message);
  }
}

// ─── Step 11: Coupons ─────────────────────────────────────────────────────────

async function migrateCoupons(orgId: string) {
  console.log('Migrating coupons...');
  try {
    const coupons = await source.coupon.findMany();
    let count = 0;

    for (const c of coupons) {
      try {
        // Map BB applicableModes (classic, healthy, both) → variant type array
        let applicableVariantTypes: string[] = [];
        if (c.applicableModes === 'classic') {
          applicableVariantTypes = ['classic'];
        } else if (c.applicableModes === 'healthy') {
          applicableVariantTypes = ['healthy'];
        } else {
          applicableVariantTypes = ['classic', 'healthy'];
        }

        const created = await target.discountCoupon.create({
          data: {
            orgId,
            code: c.code,
            name: c.name || c.code,
            description: c.description,
            discountType: c.discountType,
            discountValue: c.discountValue,
            minOrderAmount: c.minOrderAmount,
            maxDiscountAmount: c.maxDiscount,
            maxUsageTotal: c.maxUsageTotal,
            maxUsagePerUser: c.maxUsagePerUser,
            usageCount: 0,
            applicableVariantTypes,
            applicableOrderTypes: [],
            startsAt: c.startDate,
            expiresAt: c.endDate,
            isActive: c.isActive,
          },
        });
        idMap.set(c.id, created.id);
        count++;
      } catch (e) {
        console.warn(`  Skipped coupon ${c.id} (${c.code}): ${(e as Error).message.slice(0, 80)}`);
      }
    }
    console.log(`  Coupons: ${count} migrated`);
  } catch (e) {
    console.error('  Coupons migration error:', (e as Error).message);
  }
}

// ─── Step 12: Orders ──────────────────────────────────────────────────────────

async function migrateOrders(orgId: string) {
  console.log('Migrating orders...');
  try {
    const orders = await source.order.findMany({
      include: {
        items: { include: { addons: true } },
        statusHistory: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    let count = 0;
    let skipped = 0;

    for (const o of orders) {
      const endUserId = mapId(o.userId);
      if (!endUserId) {
        skipped++;
        continue;
      }

      const addressId = o.addressId ? mapId(o.addressId) : null;

      try {
        const created = await target.commerceOrder.create({
          data: {
            orgId,
            orderNumber: `BB-${String(count + 1).padStart(5, '0')}`,
            endUserId,
            addressId,
            variantType: o.mode || 'classic',
            status: o.status,
            orderType: o.orderType || 'delivery',
            paymentMethod: o.paymentMethod,
            posOrderId: o.posOrderId,
            posRawStatus: o.posRawStatus,
            customerName: o.customerName || '',
            customerPhone: o.customerPhone || '',
            customerEmail: o.customerEmail,
            subtotal: o.subtotal,
            taxAmount: o.taxAmount || 0,
            discountAmount: o.discountAmount || 0,
            deliveryFee: o.deliveryFee || 0,
            packingCharges: o.packingCharges || 0,
            serviceCharge: o.serviceCharge || 0,
            totalAmount: o.totalAmount,
            couponCode: o.couponCode,
            loyaltyEarned: o.coinsEarned || 0,
            loyaltyRedeemed: o.coinsRedeemed || 0,
            tokenNumber: o.tokenNumber,
            specialInstructions: o.specialInstructions,
            scheduledAt: o.scheduledAt,
            channel: 'web',
            contactless: o.contactless,
            createdAt: o.createdAt,
          },
        });
        idMap.set(o.id, created.id);

        // Migrate order items
        for (const item of o.items) {
          try {
            const orderItem = await target.commerceOrderItem.create({
              data: {
                orderId: created.id,
                itemId: mapId(item.menuItemId) || item.menuItemId,
                itemName: item.itemName,
                variantType: item.mode || 'classic',
                sizeVariationId: item.variationId ? mapId(item.variationId) : null,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                taxAmount: 0,
              },
            });

            // Migrate order item addons → options
            for (const addon of item.addons) {
              try {
                await target.commerceOrderItemOption.create({
                  data: {
                    orderItemId: orderItem.id,
                    optionId: mapId(addon.addonId) || addon.addonId,
                    optionName: addon.addonName,
                    quantity: addon.quantity || 1,
                    unitPrice: addon.price,
                  },
                });
              } catch (e) {
                console.warn(
                  `  Skipped order item addon: ${(e as Error).message.slice(0, 80)}`,
                );
              }
            }
          } catch (e) {
            console.warn(`  Skipped order item ${item.id}: ${(e as Error).message.slice(0, 80)}`);
          }
        }

        // Migrate status history
        for (const sh of o.statusHistory) {
          try {
            await target.commerceOrderStatusLog.create({
              data: {
                orderId: created.id,
                fromStatus: null,
                toStatus: sh.status,
                note: sh.note,
                actorType: sh.source || 'system',
                createdAt: sh.createdAt,
              },
            });
          } catch (e) {
            // Not critical — skip silently
          }
        }

        count++;
      } catch (e) {
        console.warn(`  Skipped order ${o.id}: ${(e as Error).message.slice(0, 80)}`);
        skipped++;
      }
    }
    console.log(`  Orders: ${count} migrated${skipped ? `, ${skipped} skipped` : ''}`);
  } catch (e) {
    console.error('  Orders migration error:', (e as Error).message);
  }
}

// ─── Step 13: Promotions ──────────────────────────────────────────────────────

async function migratePromotions(orgId: string) {
  console.log('Migrating promotions...');
  try {
    const promos = await source.promotion.findMany();
    let count = 0;

    for (const p of promos) {
      try {
        // BB Promotion stores config as JSON string
        let config: any = {};
        try {
          config =
            typeof p.config === 'string' ? JSON.parse(p.config) : p.config || {};
        } catch {
          config = {};
        }

        // Include coupon code and subtitle in config if present
        if (p.couponCode) config.couponCode = p.couponCode;
        if (p.subtitle) config.subtitle = p.subtitle;
        if (p.description) config.description = p.description;

        await target.promotion.create({
          data: {
            orgId,
            title: p.title,
            type: p.type,
            config,
            imageUrl: p.imageUrl,
            priority: p.priority || 0,
            isActive: p.isActive,
            startsAt: p.startDate,
            expiresAt: p.endDate,
          },
        });
        count++;
      } catch (e) {
        console.warn(`  Skipped promotion ${p.id}: ${(e as Error).message.slice(0, 80)}`);
      }
    }
    console.log(`  Promotions: ${count} migrated`);
  } catch (e) {
    console.log('  Promotions: skipped (table may not exist)');
  }
}

// ─── Step 14: Referrals ───────────────────────────────────────────────────────

async function migrateReferrals(orgId: string) {
  console.log('Migrating referrals...');
  try {
    const refs = await source.referral.findMany();
    let count = 0;
    let skipped = 0;

    for (const r of refs) {
      const referrerId = mapId(r.referrerId);
      const refereeId = mapId(r.refereeId);
      if (!referrerId || !refereeId) {
        skipped++;
        continue;
      }

      try {
        await target.referral.create({
          data: {
            orgId,
            referrerId,
            refereeId,
            code: r.code,
            status: r.status.toLowerCase(),
            pointsAwarded: r.coinsAwarded || 0,
          },
        });
        count++;
      } catch (e) {
        console.warn(`  Skipped referral ${r.id}: ${(e as Error).message.slice(0, 80)}`);
        skipped++;
      }
    }
    console.log(`  Referrals: ${count} migrated${skipped ? `, ${skipped} skipped` : ''}`);
  } catch (e) {
    console.log('  Referrals: skipped (table may not exist)');
  }
}

// ─── Step 15: Reviews ─────────────────────────────────────────────────────────

async function migrateReviews(orgId: string) {
  console.log('Migrating reviews...');
  try {
    const reviews = await source.review.findMany({
      include: { items: true, helpfulVotes: true },
    });
    let count = 0;
    let voteCount = 0;
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
            catalogItemId: r.items?.[0]?.menuItemId
              ? mapId(r.items[0].menuItemId)
              : null,
            commerceOrderId: r.orderId ? mapId(r.orderId) : null,
            rating: r.rating,
            title: null,
            body: r.comment,
            status: r.status === 'approved' ? 'approved' : r.status,
            isVerified: true,
            helpfulCount: r.helpfulCount || 0,
          },
        });
        idMap.set(r.id, created.id);
        count++;

        // Migrate helpful votes → ReviewVote
        for (const v of r.helpfulVotes) {
          const voteEndUserId = mapId(v.userId);
          if (!voteEndUserId) continue;
          try {
            await target.reviewVote.create({
              data: {
                orgId,
                reviewId: created.id,
                endUserId: voteEndUserId,
              },
            });
            voteCount++;
          } catch {
            // Duplicate vote — skip
          }
        }
      } catch (e) {
        console.warn(`  Skipped review ${r.id}: ${(e as Error).message.slice(0, 80)}`);
        skipped++;
      }
    }
    console.log(
      `  Reviews: ${count} migrated, ${voteCount} votes${skipped ? `, ${skipped} skipped` : ''}`,
    );
  } catch (e) {
    console.log('  Reviews: skipped (table may not exist)');
  }
}

// ─── Step 16: Gift Cards ──────────────────────────────────────────────────────

async function migrateGiftCards(orgId: string) {
  console.log('Migrating gift cards...');
  try {
    const cards = await source.giftCard.findMany({
      include: { transactions: true },
    });
    let cardCount = 0;
    let txCount = 0;

    for (const g of cards) {
      try {
        const created = await target.giftCard.create({
          data: {
            orgId,
            code: g.code,
            initialBalance: g.denomination,
            currentBalance: g.balance,
            purchasedById: g.purchaserId ? mapId(g.purchaserId) : null,
            recipientName: g.recipientName,
            recipientEmail: g.recipientEmail,
            recipientPhone: g.recipientPhone,
            message: g.personalMessage,
            status: g.status || 'active',
            expiresAt: g.expiresAt,
          },
        });
        idMap.set(g.id, created.id);
        cardCount++;

        // Migrate gift card transactions
        for (const t of g.transactions) {
          try {
            await target.giftCardTransaction.create({
              data: {
                orgId,
                giftCardId: created.id,
                type: t.amount > 0 ? 'purchase' : 'redeem',
                amount: t.amount,
                endUserId: null,
                commerceOrderId: t.orderId ? mapId(t.orderId) : null,
              },
            });
            txCount++;
          } catch (e) {
            console.warn(`  Skipped gift card tx: ${(e as Error).message.slice(0, 80)}`);
          }
        }
      } catch (e) {
        console.warn(`  Skipped gift card ${g.id}: ${(e as Error).message.slice(0, 80)}`);
      }
    }
    console.log(`  Gift cards: ${cardCount}, transactions: ${txCount} migrated`);
  } catch (e) {
    console.log('  Gift cards: skipped (table may not exist)');
  }
}

// ─── Step 17: Reservations ────────────────────────────────────────────────────

async function migrateReservations(orgId: string) {
  console.log('Migrating reservations...');
  try {
    const reservations = await source.reservation.findMany();
    let count = 0;
    let skipped = 0;

    for (const r of reservations) {
      const endUserId = r.userId ? mapId(r.userId) : null;
      if (!endUserId) {
        skipped++;
        continue;
      }

      try {
        // Parse timeSlot "19:00-20:00" → startTime, endTime
        const [startTime, endTime] = (r.timeSlot || '12:00-13:00').split('-');

        await target.reservation.create({
          data: {
            orgId,
            endUserId,
            date: r.date,
            startTime: startTime.trim(),
            endTime: endTime?.trim(),
            partySize: r.partySize,
            customerName: r.guestName || '',
            customerPhone: r.guestPhone || '',
            status: r.status,
            notes: r.specialRequests,
          },
        });
        count++;
      } catch (e) {
        console.warn(`  Skipped reservation ${r.id}: ${(e as Error).message.slice(0, 80)}`);
        skipped++;
      }
    }
    console.log(`  Reservations: ${count} migrated${skipped ? `, ${skipped} skipped` : ''}`);
  } catch (e) {
    console.log('  Reservations: skipped (table may not exist)');
  }
}

// ─── Step 18: Notifications ──────────────────────────────────────────────────

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
        // Map BB channel to target NotificationType enum
        let notifType: string = 'in_app';
        try {
          const channel = n.channel || 'in_app';
          if (['email', 'sms', 'push', 'whatsapp'].includes(channel)) {
            notifType = channel;
          }
        } catch {
          // use default
        }

        await target.notification.create({
          data: {
            orgId,
            endUserId,
            type: notifType as any,
            title: n.title,
            body: n.body,
            data: n.data ? (typeof n.data === 'string' ? JSON.parse(n.data) : n.data) : null,
            status: n.isRead ? 'read' : 'sent',
            readAt: n.readAt,
            sentAt: n.sentAt,
            createdAt: n.sentAt,
          },
        });
        count++;
      } catch (e) {
        console.warn(`  Skipped notification ${n.id}: ${(e as Error).message.slice(0, 80)}`);
        skipped++;
      }
    }
    console.log(`  Notifications: ${count} migrated${skipped ? `, ${skipped} skipped` : ''}`);
  } catch (e) {
    console.log('  Notifications: skipped (table may not exist)');
  }
}

// ─── Step 19: Locations ───────────────────────────────────────────────────────

async function migrateLocations(orgId: string) {
  console.log('Migrating locations...');
  try {
    const locations = await source.location.findMany({
      include: {
        storeHours: true,
        locationHours: true,
        deliveryZones: true,
      },
    });
    let locCount = 0;
    let hoursCount = 0;
    let zoneCount = 0;

    for (const l of locations) {
      try {
        const created = await target.storeLocation.create({
          data: {
            orgId,
            name: l.name,
            slug: l.slug || slugify(l.name),
            address: l.address,
            city: l.city,
            pincode: l.pincode,
            lat: l.lat,
            lng: l.lng,
            phone: l.phone,
            email: l.email,
            isActive: l.isActive,
            isPrimary: l.isPrimary,
          },
        });
        idMap.set(l.id, created.id);
        locCount++;

        // Migrate store hours (prefer locationHours if available, fall back to storeHours)
        const hours = l.locationHours?.length ? l.locationHours : l.storeHours || [];
        for (const h of hours) {
          try {
            await target.storeHours.create({
              data: {
                orgId,
                locationId: created.id,
                dayOfWeek: h.dayOfWeek,
                openTime: h.openTime,
                closeTime: h.closeTime,
                isClosed: h.isClosed,
              },
            });
            hoursCount++;
          } catch {
            // Duplicate day — skip
          }
        }

        // Migrate delivery zones
        for (const z of l.deliveryZones || []) {
          try {
            await target.deliveryZone.create({
              data: {
                orgId,
                locationId: created.id,
                name: z.name,
                pincodes: parseJsonString(z.pincodes as any),
                radiusKm: z.radiusKm,
                centerLat: z.centerLat,
                centerLng: z.centerLng,
                fee: z.deliveryFee,
                isActive: z.isActive,
              },
            });
            zoneCount++;
          } catch (e) {
            console.warn(`  Skipped delivery zone: ${(e as Error).message.slice(0, 80)}`);
          }
        }
      } catch (e) {
        console.warn(`  Skipped location ${l.id}: ${(e as Error).message.slice(0, 80)}`);
      }
    }
    console.log(
      `  Locations: ${locCount}, Hours: ${hoursCount}, Zones: ${zoneCount} migrated`,
    );
  } catch (e) {
    console.log('  Locations: skipped (table may not exist)');
  }
}

// ─── Step 20: Blog → ContentPost ──────────────────────────────────────────────

async function migrateBlogPosts(orgId: string) {
  console.log('Migrating blog posts → content posts...');
  try {
    const posts = await source.blogPost.findMany();
    let count = 0;

    for (const p of posts) {
      try {
        let tags: string[] = [];
        try {
          tags = typeof p.tags === 'string' ? JSON.parse(p.tags) : [];
        } catch {
          tags = [];
        }

        await target.contentPost.create({
          data: {
            orgId,
            title: p.title,
            slug: p.slug,
            body: p.body,
            excerpt: p.excerpt,
            imageUrl: p.featuredImage,
            category: p.category,
            tags,
            status: p.status === 'published' ? 'published' : p.status,
            publishedAt: p.datePublished,
            metadata: {
              h1: p.h1,
              ogImage: p.ogImage,
              metaDescription: p.metaDescription,
              keywords: parseJsonString(p.keywords as any),
              canonical: p.canonical,
              author: p.author,
              viewCount: p.viewCount,
            },
          },
        });
        count++;
      } catch (e) {
        console.warn(`  Skipped blog post ${p.id}: ${(e as Error).message.slice(0, 80)}`);
      }
    }
    console.log(`  Blog/Content posts: ${count} migrated`);
  } catch (e) {
    console.log('  Blog posts: skipped (table may not exist)');
  }
}

// ─── Step 21: WhatsApp Sessions → ConversationSession ─────────────────────────

async function migrateWhatsAppSessions(orgId: string) {
  console.log('Migrating WhatsApp sessions → conversation sessions...');
  try {
    const sessions = await source.whatsAppSession.findMany({
      include: { messages: true },
    });
    let sessionCount = 0;
    let msgCount = 0;

    for (const s of sessions) {
      try {
        const endUserId = s.userId ? mapId(s.userId) : null;

        const created = await target.conversationSession.create({
          data: {
            orgId,
            channel: 'whatsapp',
            identifier: s.phone,
            endUserId,
            state: s.state.toLowerCase(),
            locationId: s.storeId ? mapId(s.storeId) : null,
            cartData: parseJsonString(s.cartData),
            orderType: s.orderType,
            addressText: s.addressText,
            paymentType: s.paymentType,
            paymentLinkId: s.paymentLinkId,
            customerName: s.customerName,
            lastActivity: s.lastActivity,
          },
        });
        idMap.set(s.id, created.id);
        sessionCount++;

        // Migrate messages
        for (const m of s.messages) {
          try {
            await target.conversationMessage.create({
              data: {
                orgId,
                sessionId: created.id,
                direction: m.direction,
                externalMessageId: m.waMessageId,
                content: m.content,
                messageType: 'text',
                createdAt: m.createdAt,
              },
            });
            msgCount++;
          } catch {
            // Skip message
          }
        }
      } catch (e) {
        console.warn(`  Skipped WA session ${s.id}: ${(e as Error).message.slice(0, 80)}`);
      }
    }
    console.log(
      `  Conversation sessions: ${sessionCount}, messages: ${msgCount} migrated`,
    );
  } catch (e) {
    console.log('  WhatsApp sessions: skipped (table may not exist)');
  }
}

// ─── Step 22: Support Tickets ────────────────────────────────────────────────

async function migrateSupportTickets(orgId: string) {
  console.log('Migrating support tickets...');
  try {
    const tickets = await source.supportTicket.findMany();
    let count = 0;
    let skipped = 0;

    for (const t of tickets) {
      const endUserId = mapId(t.userId);
      if (!endUserId) {
        skipped++;
        continue;
      }

      try {
        await target.supportTicket.create({
          data: {
            orgId,
            endUserId,
            subject: t.subject,
            body: t.description,
            category: t.category,
            priority: t.priority === 'urgent' ? 'urgent' : t.priority || 'normal',
            status: t.status,
            commerceOrderId: t.orderId ? mapId(t.orderId) : null,
          },
        });
        count++;
      } catch (e) {
        console.warn(`  Skipped ticket ${t.id}: ${(e as Error).message.slice(0, 80)}`);
        skipped++;
      }
    }
    console.log(`  Support tickets: ${count} migrated${skipped ? `, ${skipped} skipped` : ''}`);
  } catch (e) {
    console.log('  Support tickets: skipped (table may not exist)');
  }
}

// ─── Run ──────────────────────────────────────────────────────────────────────

main()
  .catch((e) => {
    console.error('\nMigration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await source.$disconnect();
    await target.$disconnect();
  });
