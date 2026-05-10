import { PrismaClient } from '@prisma/client';
import { seedOrganization, OrgSettingEntry } from '../Shared';

const DATRIFT_SETTINGS: OrgSettingEntry[] = [
  // Branding
  { group: 'branding', key: 'name', value: '"Datrift"', type: 'string', label: 'Business display name' },
  { group: 'branding', key: 'tagline', value: '"Your data, your way"', type: 'string', label: 'Tagline' },
  { group: 'branding', key: 'primary_color', value: '"#2563EB"', type: 'string', label: 'Primary brand color' },
  { group: 'branding', key: 'currency', value: '"USD"', type: 'string', label: 'Currency code' },
  { group: 'branding', key: 'currency_symbol', value: '"$"', type: 'string', label: 'Currency symbol' },
  { group: 'branding', key: 'timezone', value: '"UTC"', type: 'string', label: 'Timezone' },
  { group: 'branding', key: 'logo_url', value: '""', type: 'string', label: 'Logo URL' },
  // Auth
  { group: 'auth', key: 'primary_login_id', value: '"email"', type: 'string', label: 'Primary login identifier' },
  { group: 'auth', key: 'require_email_verification', value: 'true', type: 'boolean', label: 'Require email verification' },
  { group: 'auth', key: 'google_login_enabled', value: 'true', type: 'boolean', label: 'Google login enabled' },
  { group: 'auth', key: 'allow_social_login', value: 'true', type: 'boolean', label: 'Allow social login' },
  // Features
  { group: 'features', key: 'subscription_enabled', value: 'true', type: 'boolean', label: 'Subscription enabled' },
  // Payments
  { group: 'payments', key: 'wallet_enabled', value: 'false', type: 'boolean', label: 'Wallet enabled' },
  { group: 'payments', key: 'upi_enabled', value: 'false', type: 'boolean', label: 'UPI enabled' },
  { group: 'payments', key: 'card_enabled', value: 'true', type: 'boolean', label: 'Card payments enabled' },
  { group: 'payments', key: 'netbanking_enabled', value: 'false', type: 'boolean', label: 'Netbanking enabled' },
  // Tax
  { group: 'tax', key: 'rate', value: '0', type: 'number', label: 'Default tax rate (%)' },
  { group: 'tax', key: 'label', value: '"Tax"', type: 'string', label: 'Tax label' },
  { group: 'tax', key: 'inclusive', value: 'false', type: 'boolean', label: 'Prices include tax' },
];

export async function seedDatriftOrg(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  console.log('\n--- Onboarding Datrift ---');
  const org = await seedOrganization(prisma, {
    name: 'Datrift',
    slug: 'datrift',
    planSlug: 'pro',
    adminEmail: 'datrift@techzunction.com',
    adminName: 'Datrift Admin',
    adminPassword: superAdminPassword,
    settings: DATRIFT_SETTINGS,
    plans,
    storefrontKey: 'tz_688237c60047fb74aa2c7c742e0e07a8',
  });

  return org;
}
