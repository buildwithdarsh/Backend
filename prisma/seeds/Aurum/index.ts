import { PrismaClient } from '@prisma/client';
import { seedAurumOrg } from './organisation';
import { seedAurumDemo } from './demo';

export async function seedAurum(prisma: PrismaClient, plans: Array<{ id: string; slug: string }>, superAdminPassword: string) {
  const org = await seedAurumOrg(prisma, plans, superAdminPassword);
  await seedAurumDemo(prisma);
  return org;
}
