import { PrismaClient } from '@prisma/client';
import { seedSubRadarOrg } from './organisation';
import { seedSubRadarUser } from './user';
import { seedSubRadarDemo } from './demo';

export async function seedSubRadar(prisma: PrismaClient, plans: Array<{ id: string; slug: string }>, superAdminPassword: string) {
  const org = await seedSubRadarOrg(prisma, plans, superAdminPassword);
  await seedSubRadarUser(prisma);
  await seedSubRadarDemo(prisma);
  return org;
}
