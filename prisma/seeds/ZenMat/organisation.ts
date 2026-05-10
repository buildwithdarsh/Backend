import { PrismaClient } from '@prisma/client';
import { seedOrganization, OrgSettingEntry } from '../Shared';

const ZENMAT_SETTINGS: OrgSettingEntry[] = [
  // Branding
  { group: 'branding', key: 'name', value: '"ZenMat"', type: 'string', label: 'Business display name' },
  { group: 'branding', key: 'tagline', value: '"Find your flow"', type: 'string', label: 'Tagline' },
  { group: 'branding', key: 'primary_color', value: '"#059669"', type: 'string', label: 'Primary brand color' },
  { group: 'branding', key: 'secondary_color', value: '"#7C3AED"', type: 'string', label: 'Secondary brand color' },
  { group: 'branding', key: 'currency', value: '"INR"', type: 'string', label: 'Currency code' },
  { group: 'branding', key: 'timezone', value: '"Asia/Kolkata"', type: 'string', label: 'Timezone' },
  // Auth
  { group: 'auth', key: 'primary_login_id', value: '"email"', type: 'string', label: 'Primary login identifier' },
  { group: 'auth', key: 'google_login_enabled', value: 'true', type: 'boolean', label: 'Google login enabled' },
  { group: 'auth', key: 'allow_social_login', value: 'true', type: 'boolean', label: 'Social login enabled' },
  // Features
  { group: 'features', key: 'subscription_enabled', value: 'true', type: 'boolean', label: 'Subscription enabled' },
  { group: 'features', key: 'reviews_enabled', value: 'true', type: 'boolean', label: 'Reviews enabled' },
  { group: 'features', key: 'referral_enabled', value: 'true', type: 'boolean', label: 'Referral system enabled' },
  { group: 'features', key: 'referral_points', value: '50', type: 'number', label: 'Referral points reward' },
  { group: 'features', key: 'whatsapp_enabled', value: 'true', type: 'boolean', label: 'WhatsApp enabled' },
  { group: 'features', key: 'reservations_enabled', value: 'true', type: 'boolean', label: 'Reservations enabled' },
  // Checkout
  { group: 'checkout', key: 'online_pay_enabled', value: 'true', type: 'boolean', label: 'Online payment enabled' },
  { group: 'checkout', key: 'cod_enabled', value: 'false', type: 'boolean', label: 'Cash on delivery enabled' },
  // Loyalty
  { group: 'loyalty', key: 'enabled', value: 'true', type: 'boolean', label: 'Loyalty program enabled' },
  { group: 'loyalty', key: 'point_name', value: '"karma"', type: 'string', label: 'Loyalty point name' },
  { group: 'loyalty', key: 'point_name_plural', value: '"karma"', type: 'string', label: 'Loyalty point name (plural)' },
  { group: 'loyalty', key: 'first_order_bonus', value: '50', type: 'number', label: 'First order bonus points' },
  // Tax
  { group: 'tax', key: 'rate', value: '18', type: 'number', label: 'Default tax rate (%)' },
  { group: 'tax', key: 'label', value: '"GST"', type: 'string', label: 'Tax label' },
  { group: 'tax', key: 'inclusive', value: 'true', type: 'boolean', label: 'Prices include tax' },
];

export async function seedZenMatOrg(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  console.log('\n--- Onboarding ZenMat ---');
  const org = await seedOrganization(prisma, {
    name: 'ZenMat',
    slug: 'zenmat',
    planSlug: 'pro',
    adminEmail: 'zenmat@techzunction.com',
    adminName: 'ZenMat Admin',
    adminPassword: superAdminPassword,
    settings: ZENMAT_SETTINGS,
    plans,
    storefrontKey: 'tz_27c4d7900cf1a3503e3b78e78dc1895a',
  });

  return org;
}
