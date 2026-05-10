import { PrismaClient } from '@prisma/client';
import { seedOrganization, OrgSettingEntry } from '../Shared';

const BLOOMBOX_SETTINGS: OrgSettingEntry[] = [
  // Branding
  { group: 'branding', key: 'name', value: '"BloomBox"', type: 'string', label: 'Business display name' },
  { group: 'branding', key: 'tagline', value: '"Fresh blooms, delivered with love"', type: 'string', label: 'Tagline' },
  { group: 'branding', key: 'primary_color', value: '"#EC4899"', type: 'string', label: 'Primary brand color' },
  { group: 'branding', key: 'secondary_color', value: '"#10B981"', type: 'string', label: 'Secondary brand color' },
  { group: 'branding', key: 'currency', value: '"INR"', type: 'string', label: 'Currency code' },
  { group: 'branding', key: 'currency_symbol', value: '"₹"', type: 'string', label: 'Currency symbol' },
  { group: 'branding', key: 'timezone', value: '"Asia/Kolkata"', type: 'string', label: 'Timezone' },
  { group: 'branding', key: 'logo_url', value: '""', type: 'string', label: 'Logo URL' },
  // Delivery
  { group: 'delivery', key: 'enabled', value: 'true', type: 'boolean', label: 'Delivery enabled' },
  { group: 'delivery', key: 'fee', value: '49', type: 'number', label: 'Delivery fee (currency units)' },
  { group: 'delivery', key: 'free_above', value: '999', type: 'number', label: 'Free delivery above this amount' },
  { group: 'delivery', key: 'prep_time_minutes', value: '45', type: 'number', label: 'Estimated prep time (minutes)' },
  { group: 'delivery', key: 'pickup_enabled', value: 'true', type: 'boolean', label: 'Pickup enabled' },
  // Checkout
  { group: 'checkout', key: 'cod_enabled', value: 'true', type: 'boolean', label: 'Cash on delivery enabled' },
  { group: 'checkout', key: 'online_pay_enabled', value: 'true', type: 'boolean', label: 'Online payment enabled' },
  { group: 'checkout', key: 'min_order_amount', value: '299', type: 'number', label: 'Minimum order amount' },
  // Features
  { group: 'features', key: 'coupons_enabled', value: 'true', type: 'boolean', label: 'Coupons enabled' },
  { group: 'features', key: 'gift_cards_enabled', value: 'true', type: 'boolean', label: 'Gift cards enabled' },
  { group: 'features', key: 'subscription_enabled', value: 'true', type: 'boolean', label: 'Subscription enabled' },
  { group: 'features', key: 'reviews_enabled', value: 'true', type: 'boolean', label: 'Reviews enabled' },
  { group: 'features', key: 'referral_enabled', value: 'true', type: 'boolean', label: 'Referral system enabled' },
  { group: 'features', key: 'referral_points', value: '30', type: 'number', label: 'Points awarded for referral' },
  // Loyalty
  { group: 'loyalty', key: 'enabled', value: 'true', type: 'boolean', label: 'Loyalty program enabled' },
  { group: 'loyalty', key: 'point_name', value: '"petals"', type: 'string', label: 'What loyalty points are called' },
  { group: 'loyalty', key: 'point_name_plural', value: '"petals"', type: 'string', label: 'Plural form of point name' },
  // Orders
  { group: 'orders', key: 'prefix', value: '"BX"', type: 'string', label: 'Order number prefix' },
  // Tax
  { group: 'tax', key: 'rate', value: '5', type: 'number', label: 'Default tax rate (%)' },
  { group: 'tax', key: 'label', value: '"GST"', type: 'string', label: 'Tax label' },
  { group: 'tax', key: 'inclusive', value: 'true', type: 'boolean', label: 'Prices include tax' },
  // Catalog
  { group: 'catalog', key: 'show_ratings', value: 'true', type: 'boolean', label: 'Show ratings on catalog' },
  { group: 'catalog', key: 'search_enabled', value: 'true', type: 'boolean', label: 'Search enabled' },
];

export async function seedBloomBoxOrg(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  console.log('\n--- Onboarding BloomBox ---');
  const org = await seedOrganization(prisma, {
    name: 'BloomBox',
    slug: 'bloombox',
    planSlug: 'pro',
    adminEmail: 'bloombox@techzunction.com',
    adminName: 'BloomBox Admin',
    adminPassword: superAdminPassword,
    settings: BLOOMBOX_SETTINGS,
    plans,
    storefrontKey: 'tz_8d38334bf098e0aaaae5e0546ea8678a',
  });

  return org;
}
