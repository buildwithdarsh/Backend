import { PrismaClient } from '@prisma/client';
import { seedOrganization, OrgSettingEntry } from '../Shared';

const VELVET_SETTINGS: OrgSettingEntry[] = [
  // Branding
  { group: 'branding', key: 'name', value: '"Velvet Salon"', type: 'string', label: 'Business display name' },
  { group: 'branding', key: 'tagline', value: '"Where style meets elegance"', type: 'string', label: 'Tagline' },
  { group: 'branding', key: 'primary_color', value: '"#B45309"', type: 'string', label: 'Primary brand color' },
  { group: 'branding', key: 'secondary_color', value: '"#78350F"', type: 'string', label: 'Secondary brand color' },
  { group: 'branding', key: 'font_family', value: '"Playfair Display"', type: 'string', label: 'Font family' },
  { group: 'branding', key: 'currency', value: '"INR"', type: 'string', label: 'Currency code' },
  { group: 'branding', key: 'timezone', value: '"Asia/Kolkata"', type: 'string', label: 'Timezone' },
  { group: 'branding', key: 'country_code', value: '"IN"', type: 'string', label: 'Country code' },
  // Auth
  { group: 'auth', key: 'primary_login_id', value: '"phone"', type: 'string', label: 'Primary login identifier' },
  { group: 'auth', key: 'otp_length', value: '4', type: 'number', label: 'OTP length' },
  // Delivery
  { group: 'delivery', key: 'enabled', value: 'false', type: 'boolean', label: 'Delivery enabled' },
  // Features
  { group: 'features', key: 'reservations_enabled', value: 'true', type: 'boolean', label: 'Reservations enabled' },
  { group: 'features', key: 'reviews_enabled', value: 'true', type: 'boolean', label: 'Reviews enabled' },
  { group: 'features', key: 'whatsapp_enabled', value: 'true', type: 'boolean', label: 'WhatsApp enabled' },
  { group: 'features', key: 'whatsapp_phone', value: '""', type: 'string', label: 'WhatsApp phone' },
  // Checkout
  { group: 'checkout', key: 'online_pay_enabled', value: 'true', type: 'boolean', label: 'Online payment enabled' },
  { group: 'checkout', key: 'cod_enabled', value: 'true', type: 'boolean', label: 'Cash on delivery enabled' },
  // Contact
  { group: 'contact', key: 'phone', value: '""', type: 'string', label: 'Business phone' },
  { group: 'contact', key: 'address', value: '"Gwalior, Madhya Pradesh"', type: 'string', label: 'Business address' },
  // Tax
  { group: 'tax', key: 'rate', value: '18', type: 'number', label: 'Default tax rate (%)' },
  { group: 'tax', key: 'label', value: '"GST"', type: 'string', label: 'Tax label' },
  { group: 'tax', key: 'inclusive', value: 'true', type: 'boolean', label: 'Prices include tax' },
];

export async function seedVelvetOrg(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  console.log('\n--- Onboarding Velvet ---');
  const org = await seedOrganization(prisma, {
    name: 'Velvet Salon',
    slug: 'velvet',
    planSlug: 'free',
    adminEmail: 'velvet@techzunction.com',
    adminName: 'Velvet Admin',
    adminPassword: superAdminPassword,
    settings: VELVET_SETTINGS,
    plans,
    storefrontKey: 'tz_3ae024bdd09a25af8a53f17846c58f4f',
  });

  return org;
}
