import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

export interface OrgSettingEntry {
  group: string;
  key: string;
  value: string;
  type: string;
  label: string;
}

export async function seedOrgSettings(prisma: PrismaClient, orgId: string, settings: OrgSettingEntry[]) {
  for (const s of settings) {
    await prisma.orgSettings.upsert({
      where: { orgId_group_key: { orgId, group: s.group, key: s.key } },
      update: { value: s.value, type: s.type, label: s.label },
      create: { orgId, group: s.group, key: s.key, value: s.value, type: s.type, label: s.label },
    });
  }
}

export async function seedOrganization(
  prisma: PrismaClient,
  opts: {
    name: string;
    slug: string;
    planSlug: string;
    adminEmail: string;
    adminName: string;
    adminPassword: string;
    settings: OrgSettingEntry[];
    plans: Array<{ id: string; slug: string }>;
    storefrontKey?: string;
  },
) {
  const plan = opts.plans.find((p) => p.slug === opts.planSlug);

  const storefrontKey = opts.storefrontKey ?? `tz_${Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('hex')}`;
  const org = await prisma.organization.upsert({
    where: { slug: opts.slug },
    update: { name: opts.name, status: 'active', planId: plan?.id ?? null, ...(opts.storefrontKey ? { storefrontKey: opts.storefrontKey } : {}) },
    create: { name: opts.name, slug: opts.slug, storefrontKey, status: 'active', planId: plan?.id ?? null },
  });
  console.log(`  ✓ Organization "${org.name}" (${org.id})`);

  // OrgConfig row
  await prisma.orgConfig.upsert({
    where: { orgId: org.id },
    update: {},
    create: { orgId: org.id },
  });

  // Roles
  const orgAdminRole = await prisma.role.upsert({
    where: { orgId_name: { orgId: org.id, name: 'org_admin' } },
    update: { permissions: ['*'], isDefault: false },
    create: { orgId: org.id, name: 'org_admin', permissions: ['*'], isDefault: false },
  });

  await prisma.role.upsert({
    where: { orgId_name: { orgId: org.id, name: 'member' } },
    update: { permissions: ['campaigns:read', 'end-users:read'], isDefault: true },
    create: { orgId: org.id, name: 'member', permissions: ['campaigns:read', 'end-users:read'], isDefault: true },
  });

  // Admin user
  const adminHash = await hash(opts.adminPassword, 10);
  const adminUser = await prisma.user.upsert({
    where: { orgId_email: { orgId: org.id, email: opts.adminEmail } },
    update: { name: opts.adminName, passwordHash: adminHash },
    create: {
      orgId: org.id,
      name: opts.adminName,
      email: opts.adminEmail,
      passwordHash: adminHash,
      isEmailVerified: true,
      status: 'active',
    },
  });
  console.log(`  ✓ Admin user "${adminUser.email}"`);

  // Assign org_admin role
  await prisma.userRole.upsert({
    where: { orgId_userId_roleId: { orgId: org.id, userId: adminUser.id, roleId: orgAdminRole.id } },
    update: {},
    create: { orgId: org.id, userId: adminUser.id, roleId: orgAdminRole.id },
  });

  // Org settings
  await seedOrgSettings(prisma, org.id, opts.settings);
  console.log(`  ✓ ${opts.settings.length} org settings`);

  return org;
}
