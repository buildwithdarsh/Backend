import { PrismaClient } from '@prisma/client';
import { seedTechZunctionOrg } from './organisation';
import { seedTechZunctionDemo } from './demo';

export async function seedTechZunction(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
  superAdminEmail: string,
) {
  const org = await seedTechZunctionOrg(prisma, plans, superAdminPassword, superAdminEmail);
  await seedTechZunctionDemo(prisma);
  return org;
}
