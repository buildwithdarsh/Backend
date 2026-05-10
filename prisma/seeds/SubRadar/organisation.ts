import { PrismaClient } from '@prisma/client';
import { seedOrganization, OrgSettingEntry } from '../Shared';

export async function seedSubRadarOrg(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  console.log('\n--- Onboarding SubRadar ---');

  const settings: OrgSettingEntry[] = [
    // Branding
    { group: 'branding', key: 'name', value: '"SubRadar"', type: 'string', label: 'Platform display name' },
    { group: 'branding', key: 'tagline', value: '"Subscription intelligence — save ₹7,440/year"', type: 'string', label: 'Tagline' },
    { group: 'branding', key: 'currency', value: '"INR"', type: 'string', label: 'Currency code' },
    { group: 'branding', key: 'currency_symbol', value: '"₹"', type: 'string', label: 'Currency symbol' },
    { group: 'branding', key: 'timezone', value: '"Asia/Kolkata"', type: 'string', label: 'Timezone' },
    { group: 'branding', key: 'primary_color', value: '"#7C3AED"', type: 'string', label: 'Primary brand color (violet)' },
    // Auth
    { group: 'auth', key: 'primary_login_id', value: '"phone"', type: 'string', label: 'Primary login identifier' },
    { group: 'auth', key: 'otp_length', value: '6', type: 'number', label: 'OTP length' },
    { group: 'auth', key: 'dummy_mode', value: 'true', type: 'boolean', label: 'Dummy OTP (dev)' },
    { group: 'auth', key: 'dummy_code', value: '"123456"', type: 'string', label: 'Dummy OTP code (dev)' },
    // Features
    { group: 'features', key: 'gmail_scan_enabled', value: 'true', type: 'boolean', label: 'Gmail scanning enabled' },
    { group: 'features', key: 'suggestions_enabled', value: 'true', type: 'boolean', label: 'Money-saving suggestions enabled' },
    { group: 'features', key: 'alerts_enabled', value: 'true', type: 'boolean', label: 'Renewal alerts enabled' },
    { group: 'features', key: 'affiliate_enabled', value: 'true', type: 'boolean', label: 'Affiliate links enabled' },
    // Plan limits (free vs pro)
    { group: 'plan', key: 'free_max_subscriptions', value: '5', type: 'number', label: 'Max subscriptions on free tier' },
    { group: 'plan', key: 'pro_price_paise', value: '4900', type: 'number', label: 'Pro plan price in paise' },
    { group: 'plan', key: 'pro_trial_days', value: '14', type: 'number', label: 'Pro trial duration (days)' },
  ];

  const srOrg = await seedOrganization(prisma, {
    name: 'SubRadar',
    slug: 'subradar',
    planSlug: 'pro',
    adminEmail: 'subradar@techzunction.com',
    adminName: 'SubRadar Admin',
    adminPassword: superAdminPassword,
    storefrontKey: 'tz_733066be68ea4aadefd6c6e77d6f4d15',
    settings,
    plans,
  });

  // Seed service catalog — curated list of known Indian subscription services
  console.log('  Seeding SubRadar service catalog...');
  const serviceCatalog = [
    // Streaming
    { serviceName: 'Netflix', domain: 'netflix.com', category: 'streaming', monthlyAmountPaise: 64900, yearlyAmountPaise: null, hasFreeTier: false, affiliateUrl: null },
    { serviceName: 'Amazon Prime Video', domain: 'primevideo.com', category: 'streaming', monthlyAmountPaise: null, yearlyAmountPaise: 149900, hasFreeTier: false, affiliateUrl: null },
    { serviceName: 'Disney+ Hotstar', domain: 'hotstar.com', category: 'streaming', monthlyAmountPaise: 29900, yearlyAmountPaise: 89900, hasFreeTier: false, affiliateUrl: null },
    { serviceName: 'SonyLIV', domain: 'sonyliv.com', category: 'streaming', monthlyAmountPaise: 29900, yearlyAmountPaise: 99900, hasFreeTier: false, affiliateUrl: null },
    { serviceName: 'Zee5', domain: 'zee5.com', category: 'streaming', monthlyAmountPaise: 9900, yearlyAmountPaise: 99900, hasFreeTier: true, affiliateUrl: null },
    { serviceName: 'JioCinema', domain: 'jiocinema.com', category: 'streaming', monthlyAmountPaise: 2900, yearlyAmountPaise: 29900, hasFreeTier: true, affiliateUrl: null },
    { serviceName: 'Apple TV+', domain: 'tv.apple.com', category: 'streaming', monthlyAmountPaise: 9900, yearlyAmountPaise: null, hasFreeTier: false, affiliateUrl: null },
    // Productivity
    { serviceName: 'Notion', domain: 'notion.so', category: 'productivity', monthlyAmountPaise: 800, yearlyAmountPaise: null, hasFreeTier: true, affiliateUrl: null },
    { serviceName: 'Microsoft 365', domain: 'microsoft365.com', category: 'productivity', monthlyAmountPaise: 51900, yearlyAmountPaise: null, hasFreeTier: false, affiliateUrl: null },
    { serviceName: 'Slack', domain: 'slack.com', category: 'productivity', monthlyAmountPaise: 0, yearlyAmountPaise: null, hasFreeTier: true, affiliateUrl: null },
    { serviceName: 'Zoom', domain: 'zoom.us', category: 'productivity', monthlyAmountPaise: 139900, yearlyAmountPaise: null, hasFreeTier: true, affiliateUrl: null },
    { serviceName: 'Todoist', domain: 'todoist.com', category: 'productivity', monthlyAmountPaise: 40000, yearlyAmountPaise: null, hasFreeTier: true, affiliateUrl: null },
    // AI Tools
    { serviceName: 'ChatGPT Plus', domain: 'openai.com', category: 'ai_tools', monthlyAmountPaise: 169900, yearlyAmountPaise: null, hasFreeTier: true, affiliateUrl: null },
    { serviceName: 'Claude Pro', domain: 'claude.ai', category: 'ai_tools', monthlyAmountPaise: 169900, yearlyAmountPaise: null, hasFreeTier: true, affiliateUrl: null },
    { serviceName: 'GitHub Copilot', domain: 'github.com', category: 'ai_tools', monthlyAmountPaise: 836, yearlyAmountPaise: null, hasFreeTier: true, affiliateUrl: null },
    { serviceName: 'Perplexity Pro', domain: 'perplexity.ai', category: 'ai_tools', monthlyAmountPaise: 1699, yearlyAmountPaise: null, hasFreeTier: true, affiliateUrl: null },
    // Creative
    { serviceName: 'Adobe Creative Cloud', domain: 'adobe.com', category: 'creative', monthlyAmountPaise: 418800, yearlyAmountPaise: null, hasFreeTier: false, affiliateUrl: null },
    { serviceName: 'Canva Pro', domain: 'canva.com', category: 'creative', monthlyAmountPaise: 49900, yearlyAmountPaise: 39900, hasFreeTier: true, affiliateUrl: null },
    { serviceName: 'Figma', domain: 'figma.com', category: 'creative', monthlyAmountPaise: 0, yearlyAmountPaise: null, hasFreeTier: true, affiliateUrl: null },
    // Fitness
    { serviceName: 'Cult.fit', domain: 'cult.fit', category: 'fitness', monthlyAmountPaise: 49900, yearlyAmountPaise: null, hasFreeTier: false, affiliateUrl: null },
    { serviceName: 'Calm', domain: 'calm.com', category: 'fitness', monthlyAmountPaise: 49900, yearlyAmountPaise: 299900, hasFreeTier: true, affiliateUrl: null },
    { serviceName: 'Headspace', domain: 'headspace.com', category: 'fitness', monthlyAmountPaise: 34900, yearlyAmountPaise: 264900, hasFreeTier: true, affiliateUrl: null },
    // Finance
    { serviceName: 'ET Prime', domain: 'economictimes.indiatimes.com', category: 'finance', monthlyAmountPaise: null, yearlyAmountPaise: 79900, hasFreeTier: false, affiliateUrl: null },
    { serviceName: 'Moneycontrol Pro', domain: 'moneycontrol.com', category: 'finance', monthlyAmountPaise: null, yearlyAmountPaise: 59900, hasFreeTier: true, affiliateUrl: null },
  ];

  for (const service of serviceCatalog) {
    await prisma.serviceCatalog.upsert({
      where: { orgId_domain: { orgId: srOrg.id, domain: service.domain } },
      update: {
        serviceName: service.serviceName,
        category: service.category,
        monthlyAmountPaise: service.monthlyAmountPaise,
        yearlyAmountPaise: service.yearlyAmountPaise,
        hasFreeTier: service.hasFreeTier,
      },
      create: {
        orgId: srOrg.id,
        serviceName: service.serviceName,
        domain: service.domain,
        category: service.category,
        monthlyAmountPaise: service.monthlyAmountPaise,
        yearlyAmountPaise: service.yearlyAmountPaise,
        hasFreeTier: service.hasFreeTier,
        isActive: true,
      },
    });
  }
  console.log(`  ✓ ${serviceCatalog.length} services in catalog`);

  // Print the storefront key so it can be copied into .env.local
  const srOrgFull = await prisma.organization.findUnique({ where: { id: srOrg.id }, select: { storefrontKey: true, slug: true } });
  console.log('\n  ┌─────────────────────────────────────────────────────────┐');
  console.log(`  │  SubRadar org slug    : ${srOrgFull!.slug.padEnd(32)}│`);
  console.log(`  │  SubRadar storefront key : ${srOrgFull!.storefrontKey.padEnd(28)}│`);
  console.log('  │  → Copy the key into SubRadar/.env.local                │');
  console.log('  │    NEXT_PUBLIC_TZ_ORG_KEY=<key above>                   │');
  console.log('  └─────────────────────────────────────────────────────────┘\n');

  return srOrg;
}
