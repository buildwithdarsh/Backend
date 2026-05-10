import { PrismaClient } from '@prisma/client';
import { seedOrganization, OrgSettingEntry } from '../Shared';

const FURNISHNOW_SETTINGS: OrgSettingEntry[] = [
  // Branding
  { group: 'branding', key: 'name', value: '"FurnishNow"', type: 'string', label: 'Business display name' },
  { group: 'branding', key: 'tagline', value: '"Handcrafted for life"', type: 'string', label: 'Tagline' },
  { group: 'branding', key: 'primary_color', value: '"#1A1A2E"', type: 'string', label: 'Primary brand color' },
  { group: 'branding', key: 'secondary_color', value: '"#B8860B"', type: 'string', label: 'Secondary brand color' },
  { group: 'branding', key: 'currency', value: '"INR"', type: 'string', label: 'Currency code' },
  { group: 'branding', key: 'timezone', value: '"Asia/Kolkata"', type: 'string', label: 'Timezone' },
  // Auth
  { group: 'auth', key: 'primary_login_id', value: '"phone"', type: 'string', label: 'Primary login identifier' },
  { group: 'auth', key: 'otp_length', value: '6', type: 'number', label: 'OTP length' },
  // Delivery
  { group: 'delivery', key: 'enabled', value: 'true', type: 'boolean', label: 'Delivery enabled' },
  { group: 'delivery', key: 'fee', value: '0', type: 'number', label: 'Delivery fee (currency units)' },
  { group: 'delivery', key: 'free_above', value: '0', type: 'number', label: 'Free delivery above this amount' },
  { group: 'delivery', key: 'prep_time_minutes', value: '1440', type: 'number', label: 'Estimated prep time (minutes)' },
  { group: 'delivery', key: 'max_distance_km', value: '500', type: 'number', label: 'Max delivery distance (km)' },
  // Checkout
  { group: 'checkout', key: 'cod_enabled', value: 'true', type: 'boolean', label: 'Cash on delivery enabled' },
  { group: 'checkout', key: 'online_pay_enabled', value: 'true', type: 'boolean', label: 'Online payment enabled' },
  { group: 'checkout', key: 'min_order_amount', value: '2999', type: 'number', label: 'Minimum order amount' },
  // Features
  { group: 'features', key: 'reviews_enabled', value: 'true', type: 'boolean', label: 'Reviews enabled' },
  { group: 'features', key: 'referral_enabled', value: 'true', type: 'boolean', label: 'Referral system enabled' },
  { group: 'features', key: 'referral_points', value: '200', type: 'number', label: 'Points awarded for referral' },
  { group: 'features', key: 'whatsapp_enabled', value: 'true', type: 'boolean', label: 'WhatsApp enabled' },
  { group: 'features', key: 'gift_cards_enabled', value: 'true', type: 'boolean', label: 'Gift cards enabled' },
  // Loyalty
  { group: 'loyalty', key: 'enabled', value: 'true', type: 'boolean', label: 'Loyalty program enabled' },
  { group: 'loyalty', key: 'point_name', value: '"coins"', type: 'string', label: 'What loyalty points are called' },
  { group: 'loyalty', key: 'point_name_plural', value: '"coins"', type: 'string', label: 'Plural form of point name' },
  // Orders
  { group: 'orders', key: 'prefix', value: '"FN"', type: 'string', label: 'Order number prefix' },
  // Payments
  { group: 'payments', key: 'emi_enabled', value: 'true', type: 'boolean', label: 'EMI payment enabled' },
  { group: 'payments', key: 'partial_payment', value: 'true', type: 'boolean', label: 'Partial payment enabled' },
  { group: 'payments', key: 'partial_min_percent', value: '30', type: 'number', label: 'Minimum partial payment percent' },
  // Tax
  { group: 'tax', key: 'rate', value: '12', type: 'number', label: 'Default tax rate (%)' },
  { group: 'tax', key: 'label', value: '"GST"', type: 'string', label: 'Tax label' },
  { group: 'tax', key: 'inclusive', value: 'true', type: 'boolean', label: 'Prices include tax' },
  // Catalog
  { group: 'catalog', key: 'show_ratings', value: 'true', type: 'boolean', label: 'Show ratings on catalog' },
  { group: 'catalog', key: 'search_enabled', value: 'true', type: 'boolean', label: 'Search enabled' },
];

export async function seedFurnishNowOrg(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  console.log('\n--- Onboarding FurnishNow ---');
  const org = await seedOrganization(prisma, {
    name: 'FurnishNow',
    slug: 'furnishnow',
    planSlug: 'pro',
    adminEmail: 'furnishnow@techzunction.com',
    adminName: 'FurnishNow Admin',
    adminPassword: superAdminPassword,
    settings: FURNISHNOW_SETTINGS,
    plans,
    storefrontKey: 'tz_472dd82b23a2373dbad5dd4068726ba4',
  });

  return org;
}
