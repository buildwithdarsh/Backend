import { PrismaClient } from '@prisma/client';
import { seedViCityOrg } from './organisation';
import { seedViCityDemo } from './demo';
import { seedViCityRichDemo } from './rich-demo';

export async function seedViCity(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  const org = await seedViCityOrg(prisma, plans, superAdminPassword);
  await seedViCityDemo(prisma);
  await seedViCityRichDemo(prisma);
  return org;
}
