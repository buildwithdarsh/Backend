import { PrismaClient } from '@prisma/client';
import { seedBurgerEmpireOrg } from './organisation';
import { seedBurgerEmpireMenu } from './menu';
import { seedBurgerEmpireMenuExtended } from './menu-extended';
import { seedBurgerEmpireDemo } from './demo';
import { seedBurgerEmpireRichDemo } from './rich-demo';

export async function seedBurgerEmpire(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  const org = await seedBurgerEmpireOrg(prisma, plans, superAdminPassword);
  await seedBurgerEmpireMenu(prisma);
  await seedBurgerEmpireMenuExtended(prisma);
  await seedBurgerEmpireDemo(prisma);
  await seedBurgerEmpireRichDemo(prisma);
  return org;
}
