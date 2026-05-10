import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

export async function seedSuperAdmin(prisma: PrismaClient): Promise<{ email: string; password: string }> {
  console.log('\nCreating super admin...');
  const superAdminEmail = process.env['SEED_SUPER_ADMIN_EMAIL'] ?? 'admin@techzunction.com';
  const superAdminPassword = process.env['SEED_SUPER_ADMIN_PASSWORD'];
  if (!superAdminPassword) {
    console.error('  SEED_SUPER_ADMIN_PASSWORD environment variable is required');
    process.exit(1);
  }

  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: superAdminEmail },
    update: { passwordHash: await hash(superAdminPassword, 12) },
    create: { name: 'Super Admin', email: superAdminEmail, passwordHash: await hash(superAdminPassword, 12), role: 'super_admin', isActive: true },
  });
  console.log(`  ✓ Super Admin "${superAdmin.email}" (${superAdmin.id})`);

  return { email: superAdminEmail, password: superAdminPassword };
}
