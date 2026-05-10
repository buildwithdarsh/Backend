import { PrismaClient } from '@prisma/client';
import { seedPlayFlixOrg } from './organisation';
import { seedPlayFlixDemo } from './demo';
import { seedPlayFlixRichDemo } from './rich-demo';

export async function seedPlayFlix(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  const org = await seedPlayFlixOrg(prisma, plans, superAdminPassword);
  await seedPlayFlixDemo(prisma);
  await seedPlayFlixRichDemo(prisma);
  return org;
}
