import { PrismaClient } from '@prisma/client';
import { seedOrganization, OrgSettingEntry } from '../Shared';

const DESIGNNEST_SETTINGS: OrgSettingEntry[] = [
  // Branding
  { group: 'branding', key: 'name', value: '"DesignNest"', type: 'string', label: 'Business display name' },
  { group: 'branding', key: 'tagline', value: '"Design your dream space"', type: 'string', label: 'Tagline' },
  { group: 'branding', key: 'primary_color', value: '"#D97706"', type: 'string', label: 'Primary brand color' },
  { group: 'branding', key: 'secondary_color', value: '"#78350F"', type: 'string', label: 'Secondary brand color' },
  { group: 'branding', key: 'currency', value: '"INR"', type: 'string', label: 'Currency code' },
  { group: 'branding', key: 'currency_symbol', value: '"₹"', type: 'string', label: 'Currency symbol' },
  { group: 'branding', key: 'timezone', value: '"Asia/Kolkata"', type: 'string', label: 'Timezone' },
  { group: 'branding', key: 'logo_url', value: '""', type: 'string', label: 'Logo URL' },
  // Auth
  { group: 'auth', key: 'primary_login_id', value: '"email"', type: 'string', label: 'Primary login identifier' },
  { group: 'auth', key: 'google_login_enabled', value: 'true', type: 'boolean', label: 'Google login enabled' },
  { group: 'auth', key: 'allow_social_login', value: 'true', type: 'boolean', label: 'Allow social login' },
  // Features
  { group: 'features', key: 'reviews_enabled', value: 'true', type: 'boolean', label: 'Reviews enabled' },
  { group: 'features', key: 'referral_enabled', value: 'true', type: 'boolean', label: 'Referral system enabled' },
  { group: 'features', key: 'referral_points', value: '100', type: 'number', label: 'Points awarded for referral' },
  { group: 'features', key: 'whatsapp_enabled', value: 'true', type: 'boolean', label: 'WhatsApp enabled' },
  // Checkout
  { group: 'checkout', key: 'online_pay_enabled', value: 'true', type: 'boolean', label: 'Online payment enabled' },
  { group: 'checkout', key: 'cod_enabled', value: 'false', type: 'boolean', label: 'Cash on delivery enabled' },
  // Tax
  { group: 'tax', key: 'rate', value: '18', type: 'number', label: 'Default tax rate (%)' },
  { group: 'tax', key: 'label', value: '"GST"', type: 'string', label: 'Tax label' },
  { group: 'tax', key: 'inclusive', value: 'true', type: 'boolean', label: 'Prices include tax' },
];

export async function seedDesignNestOrg(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  console.log('\n--- Onboarding DesignNest ---');
  const org = await seedOrganization(prisma, {
    name: 'DesignNest',
    slug: 'designnest',
    planSlug: 'pro',
    adminEmail: 'designnest@techzunction.com',
    adminName: 'DesignNest Admin',
    adminPassword: superAdminPassword,
    settings: DESIGNNEST_SETTINGS,
    plans,
    storefrontKey: 'tz_2f42fb82839e45c6e695333b74473b61',
  });

  return org;
}
