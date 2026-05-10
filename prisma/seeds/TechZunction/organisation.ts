import { PrismaClient } from '@prisma/client';
import { seedOrganization } from '../Shared';

export async function seedTechZunctionOrg(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
  superAdminEmail: string,
) {
  console.log('\n--- Onboarding TechZunction (demo) ---');
  const org = await seedOrganization(prisma, {
    name: 'TechZunction',
    slug: 'techzunction',
    planSlug: 'free',
    adminEmail: superAdminEmail,
    adminName: 'TZ Admin',
    adminPassword: superAdminPassword,
    settings: [
      { group: 'branding', key: 'name', value: '"TechZunction"', type: 'string', label: 'Business name' },
      { group: 'branding', key: 'currency', value: '"INR"', type: 'string', label: 'Currency' },
      { group: 'branding', key: 'timezone', value: '"Asia/Kolkata"', type: 'string', label: 'Timezone' },
    ],
    plans,
  });

  return org;
}
