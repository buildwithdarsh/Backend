import { PrismaClient } from '@prisma/client';
import { seedOrganization, OrgSettingEntry } from '../Shared';

const LEARNPROACADEMY_SETTINGS: OrgSettingEntry[] = [
  // Branding
  { group: 'branding', key: 'name', value: '"LearnPro Academy"', type: 'string', label: 'Business display name' },
  { group: 'branding', key: 'tagline', value: '"Digitize your coaching"', type: 'string', label: 'Tagline' },
  { group: 'branding', key: 'primary_color', value: '"#2563EB"', type: 'string', label: 'Primary brand color' },
  { group: 'branding', key: 'secondary_color', value: '"#7C3AED"', type: 'string', label: 'Secondary brand color' },
  { group: 'branding', key: 'currency', value: '"INR"', type: 'string', label: 'Currency code' },
  { group: 'branding', key: 'timezone', value: '"Asia/Kolkata"', type: 'string', label: 'Timezone' },
  // Auth
  { group: 'auth', key: 'primary_login_id', value: '"email"', type: 'string', label: 'Primary login identifier' },
  { group: 'auth', key: 'require_email_verification', value: 'true', type: 'boolean', label: 'Require email verification' },
  { group: 'auth', key: 'google_login_enabled', value: 'true', type: 'boolean', label: 'Google login enabled' },
  { group: 'auth', key: 'allow_social_login', value: 'true', type: 'boolean', label: 'Social login enabled' },
  // Features
  { group: 'features', key: 'subscription_enabled', value: 'true', type: 'boolean', label: 'Subscription enabled' },
  { group: 'features', key: 'reviews_enabled', value: 'true', type: 'boolean', label: 'Reviews enabled' },
  { group: 'features', key: 'referral_enabled', value: 'true', type: 'boolean', label: 'Referral system enabled' },
  { group: 'features', key: 'referral_points', value: '100', type: 'number', label: 'Points awarded for referral' },
  // Checkout
  { group: 'checkout', key: 'online_pay_enabled', value: 'true', type: 'boolean', label: 'Online payment enabled' },
  { group: 'checkout', key: 'cod_enabled', value: 'false', type: 'boolean', label: 'Cash on delivery enabled' },
  // Payments
  { group: 'payments', key: 'emi_enabled', value: 'true', type: 'boolean', label: 'EMI payment enabled' },
  { group: 'payments', key: 'partial_payment', value: 'true', type: 'boolean', label: 'Partial payment enabled' },
  { group: 'payments', key: 'partial_min_percent', value: '50', type: 'number', label: 'Minimum partial payment percent' },
  // Tax
  { group: 'tax', key: 'rate', value: '18', type: 'number', label: 'Default tax rate (%)' },
  { group: 'tax', key: 'label', value: '"GST"', type: 'string', label: 'Tax label' },
  { group: 'tax', key: 'inclusive', value: 'true', type: 'boolean', label: 'Prices include tax' },
];

export async function seedLearnProAcademyOrg(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  console.log('\n--- Onboarding LearnProAcademy ---');
  const org = await seedOrganization(prisma, {
    name: 'LearnPro Academy',
    slug: 'learnproacademy',
    planSlug: 'pro',
    adminEmail: 'learnproacademy@techzunction.com',
    adminName: 'LearnPro Admin',
    adminPassword: superAdminPassword,
    settings: LEARNPROACADEMY_SETTINGS,
    plans,
    storefrontKey: 'tz_2478652bce65ad8ebd29565205343f6d',
  });

  return org;
}
