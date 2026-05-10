import { PrismaClient } from '@prisma/client';
import { seedOrganization, OrgSettingEntry } from '../Shared';

const EVENTCRAFT_SETTINGS: OrgSettingEntry[] = [
  // Branding
  { group: 'branding', key: 'name', value: '"EventCraft"', type: 'string', label: 'Business display name' },
  { group: 'branding', key: 'tagline', value: '"Craft unforgettable events"', type: 'string', label: 'Tagline' },
  { group: 'branding', key: 'primary_color', value: '"#8B5CF6"', type: 'string', label: 'Primary brand color' },
  { group: 'branding', key: 'secondary_color', value: '"#EC4899"', type: 'string', label: 'Secondary brand color' },
  { group: 'branding', key: 'currency', value: '"INR"', type: 'string', label: 'Currency code' },
  { group: 'branding', key: 'timezone', value: '"Asia/Kolkata"', type: 'string', label: 'Timezone' },
  // Auth
  { group: 'auth', key: 'primary_login_id', value: '"email"', type: 'string', label: 'Primary login identifier' },
  { group: 'auth', key: 'google_login_enabled', value: 'true', type: 'boolean', label: 'Google login enabled' },
  { group: 'auth', key: 'allow_social_login', value: 'true', type: 'boolean', label: 'Social login enabled' },
  // Features
  { group: 'features', key: 'reviews_enabled', value: 'true', type: 'boolean', label: 'Reviews enabled' },
  { group: 'features', key: 'referral_enabled', value: 'true', type: 'boolean', label: 'Referral system enabled' },
  { group: 'features', key: 'referral_points', value: '75', type: 'number', label: 'Points awarded for referral' },
  { group: 'features', key: 'whatsapp_enabled', value: 'true', type: 'boolean', label: 'WhatsApp enabled' },
  { group: 'features', key: 'reservations_enabled', value: 'true', type: 'boolean', label: 'Reservations enabled' },
  // Checkout
  { group: 'checkout', key: 'online_pay_enabled', value: 'true', type: 'boolean', label: 'Online payment enabled' },
  { group: 'checkout', key: 'cod_enabled', value: 'false', type: 'boolean', label: 'Cash on delivery enabled' },
  // Payments
  { group: 'payments', key: 'partial_payment', value: 'true', type: 'boolean', label: 'Partial payment enabled' },
  { group: 'payments', key: 'partial_min_percent', value: '25', type: 'number', label: 'Minimum partial payment percent' },
  // Tax
  { group: 'tax', key: 'rate', value: '18', type: 'number', label: 'Default tax rate (%)' },
  { group: 'tax', key: 'label', value: '"GST"', type: 'string', label: 'Tax label' },
  { group: 'tax', key: 'inclusive', value: 'true', type: 'boolean', label: 'Prices include tax' },
];

export async function seedEventCraftOrg(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  console.log('\n--- Onboarding EventCraft ---');
  const org = await seedOrganization(prisma, {
    name: 'EventCraft',
    slug: 'eventcraft',
    planSlug: 'pro',
    adminEmail: 'eventcraft@techzunction.com',
    adminName: 'EventCraft Admin',
    adminPassword: superAdminPassword,
    settings: EVENTCRAFT_SETTINGS,
    plans,
    storefrontKey: 'tz_5d3b55b4753823b40b6cec85d9187802',
  });

  return org;
}
