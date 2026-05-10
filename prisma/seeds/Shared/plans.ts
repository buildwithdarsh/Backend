import { PrismaClient } from '@prisma/client';

const PLANS = [
  {
    name: 'Free',
    slug: 'free',
    priceMonthlyInr: null,
    priceYearlyInr: null,
    features: {
      max_users: 5,
      max_end_users: 1000,
      max_api_calls_per_month: 10000,
      max_campaigns_per_month: 5,
      email_enabled: true,
      sms_enabled: false,
      whatsapp_enabled: false,
      push_enabled: false,
      webhooks_enabled: false,
      custom_roles_enabled: false,
      analytics_enabled: false,
      audit_logs_enabled: false,
      api_keys_enabled: false,
      custom_smtp_enabled: false,
      payment_enabled: false,
      payment_links_enabled: false,
      storage_enabled: false,
      support_level: 'community',
    },
  },
  {
    name: 'Pro',
    slug: 'pro',
    priceMonthlyInr: 999,
    priceYearlyInr: 9990,
    features: {
      max_users: 25,
      max_end_users: 50000,
      max_api_calls_per_month: 500000,
      max_campaigns_per_month: 100,
      email_enabled: true,
      sms_enabled: true,
      whatsapp_enabled: true,
      push_enabled: true,
      webhooks_enabled: true,
      custom_roles_enabled: true,
      analytics_enabled: true,
      audit_logs_enabled: true,
      api_keys_enabled: true,
      custom_smtp_enabled: false,
      payment_enabled: true,
      payment_links_enabled: false,
      storage_enabled: true,
      support_level: 'email',
    },
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    priceMonthlyInr: 4999,
    priceYearlyInr: 49990,
    features: {
      max_users: -1,
      max_end_users: -1,
      max_api_calls_per_month: -1,
      max_campaigns_per_month: -1,
      email_enabled: true,
      sms_enabled: true,
      whatsapp_enabled: true,
      push_enabled: true,
      webhooks_enabled: true,
      custom_roles_enabled: true,
      analytics_enabled: true,
      audit_logs_enabled: true,
      api_keys_enabled: true,
      custom_smtp_enabled: true,
      payment_enabled: true,
      payment_links_enabled: true,
      storage_enabled: true,
      support_level: 'dedicated',
    },
  },
] as const;

export async function seedPlans(prisma: PrismaClient): Promise<Array<{ id: string; slug: string }>> {
  console.log('Creating plans...');
  const createdPlans: Array<{ id: string; slug: string }> = [];
  for (const plan of PLANS) {
    const created = await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: { name: plan.name, priceMonthlyInr: plan.priceMonthlyInr, priceYearlyInr: plan.priceYearlyInr, features: plan.features },
      create: { name: plan.name, slug: plan.slug, priceMonthlyInr: plan.priceMonthlyInr, priceYearlyInr: plan.priceYearlyInr, features: plan.features },
    });
    createdPlans.push({ id: created.id, slug: created.slug });
    console.log(`  ✓ Plan "${created.name}" (${created.id})`);
  }
  return createdPlans;
}
