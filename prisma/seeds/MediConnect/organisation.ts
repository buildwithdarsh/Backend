import { PrismaClient } from '@prisma/client';
import { seedOrganization, OrgSettingEntry } from '../Shared';

const MEDICONNECT_SETTINGS: OrgSettingEntry[] = [
  // Branding
  { group: 'branding', key: 'name', value: '"MediConnect"', type: 'string', label: 'Business display name' },
  { group: 'branding', key: 'tagline', value: '"Healthcare, connected"', type: 'string', label: 'Tagline' },
  { group: 'branding', key: 'primary_color', value: '"#06B6D4"', type: 'string', label: 'Primary brand color' },
  { group: 'branding', key: 'secondary_color', value: '"#7C3AED"', type: 'string', label: 'Secondary brand color' },
  { group: 'branding', key: 'currency', value: '"INR"', type: 'string', label: 'Currency code' },
  { group: 'branding', key: 'timezone', value: '"Asia/Kolkata"', type: 'string', label: 'Timezone' },
  // Auth
  { group: 'auth', key: 'primary_login_id', value: '"phone"', type: 'string', label: 'Primary login identifier' },
  { group: 'auth', key: 'otp_length', value: '6', type: 'number', label: 'OTP length' },
  { group: 'auth', key: 'require_phone_verification', value: 'true', type: 'boolean', label: 'Require phone verification' },
  // Features
  { group: 'features', key: 'subscription_enabled', value: 'true', type: 'boolean', label: 'Subscription enabled' },
  { group: 'features', key: 'reviews_enabled', value: 'true', type: 'boolean', label: 'Reviews enabled' },
  { group: 'features', key: 'whatsapp_enabled', value: 'true', type: 'boolean', label: 'WhatsApp enabled' },
  { group: 'features', key: 'reservations_enabled', value: 'true', type: 'boolean', label: 'Reservations enabled' },
  // Checkout
  { group: 'checkout', key: 'online_pay_enabled', value: 'true', type: 'boolean', label: 'Online payment enabled' },
  { group: 'checkout', key: 'cod_enabled', value: 'false', type: 'boolean', label: 'Cash on delivery enabled' },
  // Tax
  { group: 'tax', key: 'rate', value: '0', type: 'number', label: 'Default tax rate (%)' },
  { group: 'tax', key: 'label', value: '"NA"', type: 'string', label: 'Tax label' },
  { group: 'tax', key: 'inclusive', value: 'true', type: 'boolean', label: 'Prices include tax' },
];

export async function seedMediConnectOrg(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  console.log('\n--- Onboarding MediConnect ---');
  const org = await seedOrganization(prisma, {
    name: 'MediConnect',
    slug: 'mediconnect',
    planSlug: 'pro',
    adminEmail: 'mediconnect@techzunction.com',
    adminName: 'MediConnect Admin',
    adminPassword: superAdminPassword,
    settings: MEDICONNECT_SETTINGS,
    plans,
    storefrontKey: 'tz_0e7b32dc017000f06d1fb1baedd4ddbc',
  });

  return org;
}
