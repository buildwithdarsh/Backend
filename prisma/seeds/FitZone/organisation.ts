import { PrismaClient } from '@prisma/client';
import { seedOrganization, OrgSettingEntry } from '../Shared';

const FITZONE_SETTINGS: OrgSettingEntry[] = [
  // Branding
  { group: 'branding', key: 'name', value: '"FitZone"', type: 'string', label: 'Business display name' },
  { group: 'branding', key: 'tagline', value: '"Your fitness, your zone"', type: 'string', label: 'Tagline' },
  { group: 'branding', key: 'primary_color', value: '"#6D28D9"', type: 'string', label: 'Primary brand color' },
  { group: 'branding', key: 'secondary_color', value: '"#10B981"', type: 'string', label: 'Secondary brand color' },
  { group: 'branding', key: 'currency', value: '"INR"', type: 'string', label: 'Currency code' },
  { group: 'branding', key: 'timezone', value: '"Asia/Kolkata"', type: 'string', label: 'Timezone' },
  // Auth
  { group: 'auth', key: 'primary_login_id', value: '"phone"', type: 'string', label: 'Primary login identifier' },
  { group: 'auth', key: 'otp_length', value: '6', type: 'number', label: 'OTP length' },
  { group: 'auth', key: 'google_login_enabled', value: 'true', type: 'boolean', label: 'Google login enabled' },
  // Features
  { group: 'features', key: 'subscription_enabled', value: 'true', type: 'boolean', label: 'Subscription enabled' },
  { group: 'features', key: 'reviews_enabled', value: 'true', type: 'boolean', label: 'Reviews enabled' },
  { group: 'features', key: 'referral_enabled', value: 'true', type: 'boolean', label: 'Referral system enabled' },
  { group: 'features', key: 'referral_points', value: '50', type: 'number', label: 'Points awarded for referral' },
  { group: 'features', key: 'whatsapp_enabled', value: 'true', type: 'boolean', label: 'WhatsApp enabled' },
  { group: 'features', key: 'reservations_enabled', value: 'true', type: 'boolean', label: 'Reservations enabled' },
  // Checkout
  { group: 'checkout', key: 'online_pay_enabled', value: 'true', type: 'boolean', label: 'Online payment enabled' },
  { group: 'checkout', key: 'cod_enabled', value: 'false', type: 'boolean', label: 'Cash on delivery enabled' },
  // Loyalty
  { group: 'loyalty', key: 'enabled', value: 'true', type: 'boolean', label: 'Loyalty program enabled' },
  { group: 'loyalty', key: 'point_name', value: '"reps"', type: 'string', label: 'What loyalty points are called' },
  { group: 'loyalty', key: 'point_name_plural', value: '"reps"', type: 'string', label: 'Plural form of point name' },
  { group: 'loyalty', key: 'first_order_bonus', value: '100', type: 'number', label: 'Bonus points on first order' },
  // Tax
  { group: 'tax', key: 'rate', value: '18', type: 'number', label: 'Default tax rate (%)' },
  { group: 'tax', key: 'label', value: '"GST"', type: 'string', label: 'Tax label' },
  { group: 'tax', key: 'inclusive', value: 'true', type: 'boolean', label: 'Prices include tax' },
];

export async function seedFitZoneOrg(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  console.log('\n--- Onboarding FitZone ---');
  const org = await seedOrganization(prisma, {
    name: 'FitZone',
    slug: 'fitzone',
    planSlug: 'pro',
    adminEmail: 'fitzone@techzunction.com',
    adminName: 'FitZone Admin',
    adminPassword: superAdminPassword,
    settings: FITZONE_SETTINGS,
    plans,
    storefrontKey: 'tz_5f1a3cedaeab46bbea83b4c425b09548',
  });

  return org;
}
