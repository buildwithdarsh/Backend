import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const orgs = await prisma.organization.findMany({
    select: { slug: true, storefrontKey: true },
    orderBy: { slug: 'asc' },
  });
  for (const o of orgs) console.log(`${o.slug}\t${o.storefrontKey}`);
  await prisma.$disconnect();
}
main();
