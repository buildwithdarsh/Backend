import { PrismaClient } from '@prisma/client';
import { seedOrganization, OrgSettingEntry } from '../Shared';

const AUTOCAREHUB_SETTINGS: OrgSettingEntry[] = [
  // Branding
  { group: 'branding', key: 'name', value: '"AutoCare Hub"', type: 'string', label: 'Business display name' },
  { group: 'branding', key: 'tagline', value: '"Your car, our care"', type: 'string', label: 'Tagline' },
  { group: 'branding', key: 'primary_color', value: '"#EF4444"', type: 'string', label: 'Primary brand color' },
  { group: 'branding', key: 'currency', value: '"INR"', type: 'string', label: 'Currency code' },
  { group: 'branding', key: 'currency_symbol', value: '"₹"', type: 'string', label: 'Currency symbol' },
  { group: 'branding', key: 'timezone', value: '"Asia/Kolkata"', type: 'string', label: 'Timezone' },
  { group: 'branding', key: 'logo_url', value: '""', type: 'string', label: 'Logo URL' },
  // Auth
  { group: 'auth', key: 'primary_login_id', value: '"phone"', type: 'string', label: 'Primary login identifier' },
  { group: 'auth', key: 'otp_length', value: '6', type: 'number', label: 'OTP length' },
  // Features
  { group: 'features', key: 'reviews_enabled', value: 'true', type: 'boolean', label: 'Reviews enabled' },
  { group: 'features', key: 'whatsapp_enabled', value: 'true', type: 'boolean', label: 'WhatsApp enabled' },
  { group: 'features', key: 'referral_enabled', value: 'true', type: 'boolean', label: 'Referral system enabled' },
  // Delivery
  { group: 'delivery', key: 'enabled', value: 'false', type: 'boolean', label: 'Delivery enabled' },
  // Catalog
  { group: 'catalog', key: 'show_ratings', value: 'true', type: 'boolean', label: 'Show ratings on catalog' },
  { group: 'catalog', key: 'search_enabled', value: 'true', type: 'boolean', label: 'Search enabled' },
  // Contact
  { group: 'contact', key: 'phone', value: '""', type: 'string', label: 'Business phone' },
  { group: 'contact', key: 'email', value: '""', type: 'string', label: 'Business email' },
  { group: 'contact', key: 'address', value: '""', type: 'string', label: 'Business address' },
  // Tax
  { group: 'tax', key: 'rate', value: '18', type: 'number', label: 'Default tax rate (%)' },
  { group: 'tax', key: 'label', value: '"GST"', type: 'string', label: 'Tax label' },
  { group: 'tax', key: 'inclusive', value: 'true', type: 'boolean', label: 'Prices include tax' },
];

export async function seedAutoCareHubOrg(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  console.log('\n--- Onboarding AutoCareHub ---');
  const org = await seedOrganization(prisma, {
    name: 'AutoCare Hub',
    slug: 'autocarehub',
    planSlug: 'pro',
    adminEmail: 'autocarehub@techzunction.com',
    adminName: 'AutoCareHub Admin',
    adminPassword: superAdminPassword,
    settings: AUTOCAREHUB_SETTINGS,
    plans,
    storefrontKey: 'tz_d3a2f660589a7a34e69bcfe6d8295496',
  });

  return org;
}
