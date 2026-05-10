/**
 * Main Seed Orchestrator
 *
 * Usage:
 *   SEED_SUPER_ADMIN_PASSWORD=xxx npx ts-node prisma/seed.ts              # seed all
 *   SEED_SUPER_ADMIN_PASSWORD=xxx npx ts-node prisma/seed.ts --aurum      # seed only Aurum
 *   SEED_SUPER_ADMIN_PASSWORD=xxx npx ts-node prisma/seed.ts --burgerempire --vicity  # multiple
 *
 * Flags: see PROJECT_FLAGS below
 */
import { PrismaClient } from '@prisma/client';
import { seedPlans, seedSuperAdmin, seedPlatformConfigs } from './seeds/Shared';
import { seedBurgerEmpire } from './seeds/BurgerEmpire';
import { seedViCity } from './seeds/ViCity';
import { seedPlayFlix } from './seeds/PlayFlix';
import { seedAurum } from './seeds/Aurum';
import { seedSubRadar } from './seeds/SubRadar';
import { seedTechZunction } from './seeds/TechZunction';
import { seedGlamourWaves } from './seeds/GlamourWaves';
import { seedAllSettings } from './seeds/Settings';
import { seedSideKaamOrg, seedSideKaamMarketplaceData } from './seeds/SideKaam';
import { seedAutoCareHubOrg } from './seeds/AutoCareHub';
import { seedBloomBoxOrg } from './seeds/BloomBox';
import { seedDatriftOrg } from './seeds/Datrift';
import { seedDesignNestOrg } from './seeds/DesignNest';
import { seedDineEaseOrg } from './seeds/DineEase';
import { seedEventCraftOrg } from './seeds/EventCraft';
import { seedFitZoneOrg } from './seeds/FitZone';
import { seedFurnishNowOrg } from './seeds/FurnishNow';
import { seedLearnProAcademyOrg } from './seeds/LearnProAcademy';
import { seedMediConnectOrg } from './seeds/MediConnect';
import { seedPawPalaceOrg } from './seeds/PawPalace';
import { seedQuickAppsOrg } from './seeds/QuickApps';
import { seedStyleVaultOrg } from './seeds/StyleVault';
import { seedVelvetOrg } from './seeds/Velvet';
import { seedZenMatOrg } from './seeds/ZenMat';

const prisma = new PrismaClient();

const PROJECT_FLAGS = [
  'burgerempire', 'vicity', 'playflix', 'aurum', 'subradar',
  'techzunction', 'glamourwaves', 'sidekaam',
  'autocarehub', 'bloombox', 'datrift', 'designnest', 'dineease',
  'eventcraft', 'fitzone', 'furnishnow', 'learnproacademy',
  'mediconnect', 'pawpalace', 'quickapps', 'stylevault',
  'velvet', 'zenmat',
  'settings',
] as const;
type ProjectFlag = (typeof PROJECT_FLAGS)[number];

function parseFlags(): Set<ProjectFlag> | 'all' {
  const args = process.argv.slice(2).map((a) => a.replace(/^--/, '').toLowerCase());
  const matched = args.filter((a): a is ProjectFlag => PROJECT_FLAGS.includes(a as ProjectFlag));
  return matched.length > 0 ? new Set(matched) : 'all';
}

async function main(): Promise<void> {
  const targets = parseFlags();
  const seedAll = targets === 'all';

  console.log(seedAll ? 'Starting full seed...\n' : `Starting seed for: ${Array.from(targets).join(', ')}\n`);

  // ─── Shared (always runs) ──────────────────────────────────────────────
  const plans = await seedPlans(prisma);
  const { email: superAdminEmail, password: superAdminPassword } = await seedSuperAdmin(prisma);
  await seedPlatformConfigs(prisma);

  // ─── Existing project seeds ────────────────────────────────────────────
  if (seedAll || targets.has('burgerempire')) {
    await seedBurgerEmpire(prisma, plans, superAdminPassword);
  }

  if (seedAll || targets.has('vicity')) {
    await seedViCity(prisma, plans, superAdminPassword);
  }

  if (seedAll || targets.has('playflix')) {
    await seedPlayFlix(prisma, plans, superAdminPassword);
  }

  if (seedAll || targets.has('aurum')) {
    await seedAurum(prisma, plans, superAdminPassword);
  }

  if (seedAll || targets.has('techzunction')) {
    await seedTechZunction(prisma, plans, superAdminPassword, superAdminEmail);
  }

  if (seedAll || targets.has('glamourwaves')) {
    await seedGlamourWaves(prisma, plans, superAdminPassword);
  }

  if (seedAll || targets.has('subradar')) {
    await seedSubRadar(prisma, plans, superAdminPassword);
  }

  if (seedAll || targets.has('sidekaam')) {
    const skOrg = await seedSideKaamOrg(prisma, plans, superAdminPassword);
    if (skOrg?.id) {
      await seedSideKaamMarketplaceData(prisma, skOrg.id);
    }
  }

  // ─── New project seeds ─────────────────────────────────────────────────
  if (seedAll || targets.has('autocarehub')) {
    await seedAutoCareHubOrg(prisma, plans, superAdminPassword);
  }

  if (seedAll || targets.has('bloombox')) {
    await seedBloomBoxOrg(prisma, plans, superAdminPassword);
  }

  if (seedAll || targets.has('datrift')) {
    await seedDatriftOrg(prisma, plans, superAdminPassword);
  }

  if (seedAll || targets.has('designnest')) {
    await seedDesignNestOrg(prisma, plans, superAdminPassword);
  }

  if (seedAll || targets.has('dineease')) {
    await seedDineEaseOrg(prisma, plans, superAdminPassword);
  }

  if (seedAll || targets.has('eventcraft')) {
    await seedEventCraftOrg(prisma, plans, superAdminPassword);
  }

  if (seedAll || targets.has('fitzone')) {
    await seedFitZoneOrg(prisma, plans, superAdminPassword);
  }

  if (seedAll || targets.has('furnishnow')) {
    await seedFurnishNowOrg(prisma, plans, superAdminPassword);
  }

  if (seedAll || targets.has('learnproacademy')) {
    await seedLearnProAcademyOrg(prisma, plans, superAdminPassword);
  }

  if (seedAll || targets.has('mediconnect')) {
    await seedMediConnectOrg(prisma, plans, superAdminPassword);
  }

  if (seedAll || targets.has('pawpalace')) {
    await seedPawPalaceOrg(prisma, plans, superAdminPassword);
  }

  if (seedAll || targets.has('quickapps')) {
    await seedQuickAppsOrg(prisma, plans, superAdminPassword);
  }

  if (seedAll || targets.has('stylevault')) {
    await seedStyleVaultOrg(prisma, plans, superAdminPassword);
  }

  if (seedAll || targets.has('velvet')) {
    await seedVelvetOrg(prisma, plans, superAdminPassword);
  }

  if (seedAll || targets.has('zenmat')) {
    await seedZenMatOrg(prisma, plans, superAdminPassword);
  }

  // ─── Settings (runs after all orgs are created) ────────────────────────
  if (seedAll || targets.has('settings')) {
    await seedAllSettings(prisma);
  }

  console.log('\nSeed completed successfully');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
