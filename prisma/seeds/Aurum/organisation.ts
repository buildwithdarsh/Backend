import { PrismaClient } from '@prisma/client';
import { seedOrganization, OrgSettingEntry } from '../Shared';

export async function seedAurumOrg(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  console.log('\n--- Onboarding Aurum ---');

  const settings: OrgSettingEntry[] = [
    { group: 'branding', key: 'name', value: '"Aurum"', type: 'string', label: 'Business name' },
    { group: 'branding', key: 'tagline', value: '"Banking, Refined"', type: 'string', label: 'Tagline' },
    { group: 'branding', key: 'currency', value: '"INR"', type: 'string', label: 'Currency' },
    { group: 'branding', key: 'timezone', value: '"Asia/Kolkata"', type: 'string', label: 'Timezone' },
    { group: 'auth', key: 'primary_login_id', value: '"phone"', type: 'string', label: 'Primary login identifier' },
    { group: 'auth', key: 'otp_enabled', value: 'true', type: 'boolean', label: 'OTP login enabled' },
    { group: 'auth', key: 'biometric_enabled', value: 'true', type: 'boolean', label: 'Biometric login enabled' },
    { group: 'banking', key: 'kyc_required', value: 'true', type: 'boolean', label: 'KYC required for account activation' },
    { group: 'banking', key: 'upi_enabled', value: 'true', type: 'boolean', label: 'UPI transfers enabled' },
    { group: 'banking', key: 'neft_enabled', value: 'true', type: 'boolean', label: 'NEFT transfers enabled' },
    { group: 'banking', key: 'rtgs_enabled', value: 'true', type: 'boolean', label: 'RTGS transfers enabled' },
    { group: 'banking', key: 'imps_enabled', value: 'true', type: 'boolean', label: 'IMPS transfers enabled' },
    { group: 'banking', key: 'virtual_cards_enabled', value: 'true', type: 'boolean', label: 'Virtual card generation enabled' },
    { group: 'banking', key: 'fd_enabled', value: 'true', type: 'boolean', label: 'Fixed deposits enabled' },
    { group: 'banking', key: 'bbps_enabled', value: 'true', type: 'boolean', label: 'BBPS bill payments enabled' },
  ];

  const aurumOrg = await seedOrganization(prisma, {
    name: 'Aurum Financial Technologies',
    slug: 'aurum',
    planSlug: 'pro',
    adminEmail: 'aurum@techzunction.com',
    adminName: 'Aurum Admin',
    adminPassword: superAdminPassword,
    storefrontKey: 'tz_d8cea05f47a9f16831ac02148163aecc',
    settings,
    plans,
  });

  // Seed default spending categories
  console.log('  Seeding Aurum spending categories...');
  const spendingCategories = [
    { name: 'food', icon: 'utensils', color: '#f97316', isDefault: true },
    { name: 'travel', icon: 'plane', color: '#3b82f6', isDefault: true },
    { name: 'utilities', icon: 'zap', color: '#eab308', isDefault: true },
    { name: 'shopping', icon: 'shopping-bag', color: '#ec4899', isDefault: true },
    { name: 'entertainment', icon: 'film', color: '#8b5cf6', isDefault: true },
    { name: 'health', icon: 'heart', color: '#ef4444', isDefault: true },
    { name: 'education', icon: 'book', color: '#06b6d4', isDefault: true },
    { name: 'transfer', icon: 'arrow-right-left', color: '#6b7280', isDefault: true },
    { name: 'fixed_deposit', icon: 'lock', color: '#10b981', isDefault: true },
    { name: 'investment', icon: 'trending-up', color: '#14b8a6', isDefault: true },
  ];

  for (const cat of spendingCategories) {
    await prisma.spendingCategory.upsert({
      where: { orgId_name: { orgId: aurumOrg.id, name: cat.name } },
      update: {},
      create: { orgId: aurumOrg.id, name: cat.name, icon: cat.icon, color: cat.color, isDefault: cat.isDefault },
    });
  }
  console.log(`  ✓ ${spendingCategories.length} spending categories`);

  return aurumOrg;
}
