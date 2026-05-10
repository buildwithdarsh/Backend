import { PrismaClient } from '@prisma/client';
import { seedOrganization, OrgSettingEntry } from '../Shared';

const STYLEVAULT_SETTINGS: OrgSettingEntry[] = [
  // Branding
  { group: 'branding', key: 'name', value: '"StyleVault"', type: 'string', label: 'Business display name' },
  { group: 'branding', key: 'tagline', value: '"Curated Indian fashion"', type: 'string', label: 'Tagline' },
  { group: 'branding', key: 'primary_color', value: '"#7C3AED"', type: 'string', label: 'Primary brand color' },
  { group: 'branding', key: 'secondary_color', value: '"#DB2777"', type: 'string', label: 'Secondary brand color' },
  { group: 'branding', key: 'currency', value: '"INR"', type: 'string', label: 'Currency code' },
  { group: 'branding', key: 'currency_symbol', value: '"₹"', type: 'string', label: 'Currency symbol' },
  { group: 'branding', key: 'timezone', value: '"Asia/Kolkata"', type: 'string', label: 'Timezone' },
  { group: 'branding', key: 'logo_url', value: '""', type: 'string', label: 'Logo URL' },
  // Auth
  { group: 'auth', key: 'primary_login_id', value: '"phone"', type: 'string', label: 'Primary login identifier' },
  { group: 'auth', key: 'otp_length', value: '6', type: 'number', label: 'OTP length' },
  { group: 'auth', key: 'google_login_enabled', value: 'true', type: 'boolean', label: 'Google login enabled' },
  // Delivery
  { group: 'delivery', key: 'enabled', value: 'true', type: 'boolean', label: 'Delivery enabled' },
  { group: 'delivery', key: 'fee', value: '99', type: 'number', label: 'Delivery fee (currency units)' },
  { group: 'delivery', key: 'free_above', value: '1999', type: 'number', label: 'Free delivery above this amount' },
  { group: 'delivery', key: 'prep_time_minutes', value: '2880', type: 'number', label: 'Estimated prep time (minutes)' },
  // Checkout
  { group: 'checkout', key: 'cod_enabled', value: 'true', type: 'boolean', label: 'Cash on delivery enabled' },
  { group: 'checkout', key: 'online_pay_enabled', value: 'true', type: 'boolean', label: 'Online payment enabled' },
  { group: 'checkout', key: 'min_order_amount', value: '499', type: 'number', label: 'Minimum order amount' },
  // Features
  { group: 'features', key: 'coupons_enabled', value: 'true', type: 'boolean', label: 'Coupons enabled' },
  { group: 'features', key: 'reviews_enabled', value: 'true', type: 'boolean', label: 'Reviews enabled' },
  { group: 'features', key: 'referral_enabled', value: 'true', type: 'boolean', label: 'Referral system enabled' },
  { group: 'features', key: 'referral_points', value: '100', type: 'number', label: 'Points awarded for referral' },
  { group: 'features', key: 'whatsapp_enabled', value: 'true', type: 'boolean', label: 'WhatsApp ordering enabled' },
  { group: 'features', key: 'gift_cards_enabled', value: 'true', type: 'boolean', label: 'Gift cards enabled' },
  // Loyalty
  { group: 'loyalty', key: 'enabled', value: 'true', type: 'boolean', label: 'Loyalty program enabled' },
  { group: 'loyalty', key: 'point_name', value: '"gems"', type: 'string', label: 'What loyalty points are called' },
  { group: 'loyalty', key: 'point_name_plural', value: '"gems"', type: 'string', label: 'Plural form of point name' },
  { group: 'loyalty', key: 'first_order_bonus', value: '50', type: 'number', label: 'Bonus points on first order' },
  // Orders
  { group: 'orders', key: 'prefix', value: '"SV"', type: 'string', label: 'Order number prefix' },
  // Payments
  { group: 'payments', key: 'emi_enabled', value: 'true', type: 'boolean', label: 'EMI payments enabled' },
  { group: 'payments', key: 'partial_payment', value: 'true', type: 'boolean', label: 'Partial payment enabled' },
  { group: 'payments', key: 'partial_min_percent', value: '30', type: 'number', label: 'Minimum partial payment percent' },
  // Tax
  { group: 'tax', key: 'rate', value: '5', type: 'number', label: 'Default tax rate (%)' },
  { group: 'tax', key: 'label', value: '"GST"', type: 'string', label: 'Tax label' },
  { group: 'tax', key: 'inclusive', value: 'true', type: 'boolean', label: 'Prices include tax' },
  // Catalog
  { group: 'catalog', key: 'show_ratings', value: 'true', type: 'boolean', label: 'Show ratings on catalog' },
  { group: 'catalog', key: 'search_enabled', value: 'true', type: 'boolean', label: 'Search enabled' },
  { group: 'catalog', key: 'show_diet_badges', value: 'false', type: 'boolean', label: 'Show diet badges' },
];

export async function seedStyleVaultOrg(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  console.log('\n--- Onboarding StyleVault ---');
  const org = await seedOrganization(prisma, {
    name: 'StyleVault',
    slug: 'stylevault',
    planSlug: 'pro',
    adminEmail: 'stylevault@techzunction.com',
    adminName: 'StyleVault Admin',
    adminPassword: superAdminPassword,
    settings: STYLEVAULT_SETTINGS,
    plans,
    storefrontKey: 'tz_ff4cab5c6f5dbf2fcc811e9406220d31',
  });

  return org;
}
