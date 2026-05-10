import { PrismaClient } from '@prisma/client';
import { seedOrganization, OrgSettingEntry } from '../Shared';

const DINEEASE_SETTINGS: OrgSettingEntry[] = [
  // Branding
  { group: 'branding', key: 'name', value: '"DineEase"', type: 'string', label: 'Business display name' },
  { group: 'branding', key: 'tagline', value: '"Discover, Order, Reserve"', type: 'string', label: 'Tagline' },
  { group: 'branding', key: 'primary_color', value: '"#F97316"', type: 'string', label: 'Primary brand color' },
  { group: 'branding', key: 'secondary_color', value: '"#0EA5E9"', type: 'string', label: 'Secondary brand color' },
  { group: 'branding', key: 'currency', value: '"INR"', type: 'string', label: 'Currency code' },
  { group: 'branding', key: 'currency_symbol', value: '"₹"', type: 'string', label: 'Currency symbol' },
  { group: 'branding', key: 'timezone', value: '"Asia/Kolkata"', type: 'string', label: 'Timezone' },
  { group: 'branding', key: 'logo_url', value: '""', type: 'string', label: 'Logo URL' },
  // Auth
  { group: 'auth', key: 'primary_login_id', value: '"phone"', type: 'string', label: 'Primary login identifier' },
  { group: 'auth', key: 'otp_length', value: '6', type: 'number', label: 'OTP length' },
  // Delivery
  { group: 'delivery', key: 'enabled', value: 'true', type: 'boolean', label: 'Delivery enabled' },
  { group: 'delivery', key: 'fee', value: '30', type: 'number', label: 'Delivery fee (currency units)' },
  { group: 'delivery', key: 'free_above', value: '599', type: 'number', label: 'Free delivery above this amount' },
  { group: 'delivery', key: 'prep_time_minutes', value: '25', type: 'number', label: 'Estimated prep time (minutes)' },
  { group: 'delivery', key: 'pickup_enabled', value: 'true', type: 'boolean', label: 'Pickup enabled' },
  { group: 'delivery', key: 'dine_in_enabled', value: 'true', type: 'boolean', label: 'Dine-in enabled' },
  // Checkout
  { group: 'checkout', key: 'cod_enabled', value: 'true', type: 'boolean', label: 'Cash on delivery enabled' },
  { group: 'checkout', key: 'online_pay_enabled', value: 'true', type: 'boolean', label: 'Online payment enabled' },
  { group: 'checkout', key: 'min_order_amount', value: '149', type: 'number', label: 'Minimum order amount' },
  { group: 'checkout', key: 'tip_enabled', value: 'true', type: 'boolean', label: 'Tip enabled' },
  { group: 'checkout', key: 'tip_presets', value: '[20,50,100]', type: 'json', label: 'Tip preset amounts' },
  // Features
  { group: 'features', key: 'coupons_enabled', value: 'true', type: 'boolean', label: 'Coupons enabled' },
  { group: 'features', key: 'reservations_enabled', value: 'true', type: 'boolean', label: 'Reservations enabled' },
  { group: 'features', key: 'reviews_enabled', value: 'true', type: 'boolean', label: 'Reviews enabled' },
  { group: 'features', key: 'whatsapp_enabled', value: 'true', type: 'boolean', label: 'WhatsApp enabled' },
  { group: 'features', key: 'referral_enabled', value: 'true', type: 'boolean', label: 'Referral system enabled' },
  { group: 'features', key: 'referral_points', value: '40', type: 'number', label: 'Points awarded for referral' },
  // Loyalty
  { group: 'loyalty', key: 'enabled', value: 'true', type: 'boolean', label: 'Loyalty program enabled' },
  { group: 'loyalty', key: 'point_name', value: '"bites"', type: 'string', label: 'What loyalty points are called' },
  { group: 'loyalty', key: 'point_name_plural', value: '"bites"', type: 'string', label: 'Plural form of point name' },
  // Orders
  { group: 'orders', key: 'prefix', value: '"DE"', type: 'string', label: 'Order number prefix' },
  { group: 'orders', key: 'auto_confirm', value: 'false', type: 'boolean', label: 'Auto-confirm orders (skip pending)' },
  // Tax
  { group: 'tax', key: 'rate', value: '5', type: 'number', label: 'Default tax rate (%)' },
  { group: 'tax', key: 'label', value: '"GST"', type: 'string', label: 'Tax label' },
  { group: 'tax', key: 'inclusive', value: 'true', type: 'boolean', label: 'Prices include tax' },
  // Catalog
  { group: 'catalog', key: 'show_ratings', value: 'true', type: 'boolean', label: 'Show ratings on catalog' },
  { group: 'catalog', key: 'show_diet_badges', value: 'true', type: 'boolean', label: 'Show diet badges' },
  { group: 'catalog', key: 'search_enabled', value: 'true', type: 'boolean', label: 'Search enabled' },
];

export async function seedDineEaseOrg(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  console.log('\n--- Onboarding DineEase ---');
  const org = await seedOrganization(prisma, {
    name: 'DineEase',
    slug: 'dineease',
    planSlug: 'pro',
    adminEmail: 'dineease@techzunction.com',
    adminName: 'DineEase Admin',
    adminPassword: superAdminPassword,
    settings: DINEEASE_SETTINGS,
    plans,
    storefrontKey: 'tz_a1bf387d6d445ebbb96ee626b516e78c',
  });

  return org;
}
