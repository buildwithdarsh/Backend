import { PrismaClient } from '@prisma/client';
import { seedGlamourWavesOrg } from './organisation';
import { seedGlamourWavesRichDemo } from './rich-demo';

export async function seedGlamourWaves(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  const org = await seedGlamourWavesOrg(prisma, plans, superAdminPassword);
  await seedGlamourWavesRichDemo(prisma);
  return org;
}
