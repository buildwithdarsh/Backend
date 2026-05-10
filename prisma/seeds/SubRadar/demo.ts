import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const DEMO_PASSWORD = 'Demo@1234';
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);
const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000);

export async function seedSubRadarDemo(prisma: PrismaClient) {
  console.log('\n── SubRadar demo data ──');
  const org = await prisma.organization.findUnique({ where: { slug: 'subradar' } });
  if (!org) { console.log('  ✗ subradar org not found'); return; }

  const pwHash = await hash(DEMO_PASSWORD, 10);

  const demoUser = await prisma.endUser.upsert({
    where: { orgId_email: { orgId: org.id, email: 'demo@subradar.in' } } as never,
    update: {},
    create: {
      orgId: org.id,
      name: 'Neel Bose',
      email: 'demo@subradar.in',
      phone: '9840004001',
      passwordHash: pwHash,
      isEmailVerified: true,
      status: 'active',
    },
  });
  console.log('  ✓ Demo user: demo@subradar.in');

  // Clear old demo data
  await prisma.subscriptionSuggestion.deleteMany({ where: { orgId: org.id, endUserId: demoUser.id } });
  await prisma.subscriptionAlert.deleteMany({ where: { orgId: org.id, endUserId: demoUser.id } });
  await prisma.trackedSubscription.deleteMany({ where: { orgId: org.id, endUserId: demoUser.id } });

  const subs = await Promise.all([
    prisma.trackedSubscription.create({ data: { orgId: org.id, endUserId: demoUser.id, serviceName: 'Netflix', domain: 'netflix.com', category: 'streaming', amountPaise: 64900, billingCycle: 'monthly', status: 'active', source: 'gmail_auto', nextRenewalAt: daysFromNow(3), firstSeenAt: daysAgo(180), lastSeenAt: daysAgo(1), lastActivityAt: daysAgo(1) } }),
    prisma.trackedSubscription.create({ data: { orgId: org.id, endUserId: demoUser.id, serviceName: 'Spotify', domain: 'spotify.com', category: 'streaming', amountPaise: 11900, billingCycle: 'monthly', status: 'active', source: 'gmail_auto', nextRenewalAt: daysFromNow(12), firstSeenAt: daysAgo(365), lastSeenAt: daysAgo(5), lastActivityAt: daysAgo(5) } }),
    prisma.trackedSubscription.create({ data: { orgId: org.id, endUserId: demoUser.id, serviceName: 'ChatGPT Plus', domain: 'chat.openai.com', category: 'ai_tools', amountPaise: 169900, billingCycle: 'monthly', status: 'active', source: 'gmail_auto', nextRenewalAt: daysFromNow(7), firstSeenAt: daysAgo(90), lastSeenAt: daysAgo(2), lastActivityAt: daysAgo(2) } }),
    prisma.trackedSubscription.create({ data: { orgId: org.id, endUserId: demoUser.id, serviceName: 'Adobe Creative Cloud', domain: 'adobe.com', category: 'creative', amountPaise: 480000, billingCycle: 'yearly', status: 'active', source: 'gmail_auto', nextRenewalAt: daysFromNow(45), firstSeenAt: daysAgo(320), lastSeenAt: daysAgo(45), lastActivityAt: daysAgo(45) } }),
    prisma.trackedSubscription.create({ data: { orgId: org.id, endUserId: demoUser.id, serviceName: 'Notion', domain: 'notion.so', category: 'productivity', amountPaise: 1600, billingCycle: 'monthly', status: 'active', source: 'gmail_auto', nextRenewalAt: daysFromNow(18), firstSeenAt: daysAgo(200), lastSeenAt: daysAgo(3), lastActivityAt: daysAgo(3) } }),
    prisma.trackedSubscription.create({ data: { orgId: org.id, endUserId: demoUser.id, serviceName: 'Amazon Prime', domain: 'primevideo.com', category: 'streaming', amountPaise: 179900, billingCycle: 'yearly', status: 'active', source: 'gmail_auto', nextRenewalAt: daysFromNow(120), firstSeenAt: daysAgo(245), lastSeenAt: daysAgo(10), lastActivityAt: daysAgo(10) } }),
    prisma.trackedSubscription.create({ data: { orgId: org.id, endUserId: demoUser.id, serviceName: 'GitHub Copilot', domain: 'github.com', category: 'ai_tools', amountPaise: 834900, billingCycle: 'yearly', status: 'active', source: 'gmail_auto', nextRenewalAt: daysFromNow(1), firstSeenAt: daysAgo(364), lastSeenAt: daysAgo(1), lastActivityAt: daysAgo(1) } }),
    prisma.trackedSubscription.create({ data: { orgId: org.id, endUserId: demoUser.id, serviceName: 'Cult.fit', domain: 'cult.fit', category: 'fitness', amountPaise: 49900, billingCycle: 'monthly', status: 'forgotten', source: 'gmail_auto', nextRenewalAt: daysFromNow(8), firstSeenAt: daysAgo(180), lastSeenAt: daysAgo(75), lastActivityAt: daysAgo(75) } }),
    prisma.trackedSubscription.create({ data: { orgId: org.id, endUserId: demoUser.id, serviceName: 'Canva Pro', domain: 'canva.com', category: 'creative', amountPaise: 39900, billingCycle: 'monthly', status: 'free_trial', source: 'gmail_auto', isFreeTrialDetected: true, freeTrialEndsAt: daysFromNow(5), nextRenewalAt: daysFromNow(5), firstSeenAt: daysAgo(25), lastSeenAt: daysAgo(2), lastActivityAt: daysAgo(2) } }),
    prisma.trackedSubscription.create({ data: { orgId: org.id, endUserId: demoUser.id, serviceName: 'Zoom', domain: 'zoom.us', category: 'productivity', amountPaise: 134900, billingCycle: 'yearly', status: 'cancelled', source: 'gmail_auto', nextRenewalAt: null, firstSeenAt: daysAgo(400), lastSeenAt: daysAgo(60), lastActivityAt: daysAgo(60) } }),
    prisma.trackedSubscription.create({ data: { orgId: org.id, endUserId: demoUser.id, serviceName: 'Perplexity Pro', domain: 'perplexity.ai', category: 'ai_tools', amountPaise: 169900, billingCycle: 'monthly', status: 'active', source: 'gmail_auto', nextRenewalAt: daysFromNow(22), firstSeenAt: daysAgo(60), lastSeenAt: daysAgo(4), lastActivityAt: daysAgo(4) } }),
    prisma.trackedSubscription.create({ data: { orgId: org.id, endUserId: demoUser.id, serviceName: 'Disney+ Hotstar', domain: 'hotstar.com', category: 'streaming', amountPaise: 89900, billingCycle: 'yearly', status: 'forgotten', source: 'gmail_auto', nextRenewalAt: daysFromNow(90), firstSeenAt: daysAgo(300), lastSeenAt: daysAgo(85), lastActivityAt: daysAgo(85) } }),
  ]);
  console.log(`  ✓ ${subs.length} tracked subscriptions`);

  const [netflix, spotify, chatgpt, adobe, notion, , copilot, cultfit, canva, , perplexity, hotstar] = subs;

  await Promise.all([
    prisma.subscriptionAlert.create({ data: { orgId: org.id, endUserId: demoUser.id, trackedSubscriptionId: netflix!.id, alertType: 'renewal_3d', daysUntilRenewal: 3, amountPaise: netflix!.amountPaise, scheduledAt: daysFromNow(3) } }),
    prisma.subscriptionAlert.create({ data: { orgId: org.id, endUserId: demoUser.id, trackedSubscriptionId: copilot!.id, alertType: 'renewal_1d', daysUntilRenewal: 1, amountPaise: copilot!.amountPaise, scheduledAt: daysFromNow(1) } }),
    prisma.subscriptionAlert.create({ data: { orgId: org.id, endUserId: demoUser.id, trackedSubscriptionId: chatgpt!.id, alertType: 'renewal_7d', daysUntilRenewal: 7, amountPaise: chatgpt!.amountPaise, scheduledAt: daysFromNow(7) } }),
    prisma.subscriptionAlert.create({ data: { orgId: org.id, endUserId: demoUser.id, trackedSubscriptionId: canva!.id, alertType: 'free_trial_expiry', amountPaise: canva!.amountPaise, scheduledAt: daysFromNow(5) } }),
    prisma.subscriptionAlert.create({ data: { orgId: org.id, endUserId: demoUser.id, trackedSubscriptionId: adobe!.id, alertType: 'price_increase', amountPaise: 480000, previousAmountPaise: 360000, scheduledAt: daysAgo(5) } }),
    prisma.subscriptionAlert.create({ data: { orgId: org.id, endUserId: demoUser.id, trackedSubscriptionId: spotify!.id, alertType: 'price_decrease', amountPaise: 11900, previousAmountPaise: 17900, scheduledAt: daysAgo(10) } }),
  ]);
  console.log('  ✓ 6 subscription alerts');

  await Promise.all([
    prisma.subscriptionSuggestion.create({ data: { orgId: org.id, endUserId: demoUser.id, trackedSubscriptionId: adobe!.id, suggestionType: 'cheaper_alternative', title: 'Switch from Adobe CC to Canva Pro', description: 'Adobe Creative Cloud costs ₹4,800/year. Canva Pro covers most design needs at just ₹3,999/year — saving ₹801 annually.', alternativeServiceName: 'Canva Pro', alternativeAmountPaise: 39900, savingsPaise: 80100, status: 'pending' } }),
    prisma.subscriptionSuggestion.create({ data: { orgId: org.id, endUserId: demoUser.id, trackedSubscriptionId: cultfit!.id, suggestionType: 'cancel_forgotten', title: "You haven't used Cult.fit in 75 days", description: 'Cancelling saves ₹499/month — ₹5,988/year.', savingsPaise: 598800, status: 'pending' } }),
    prisma.subscriptionSuggestion.create({ data: { orgId: org.id, endUserId: demoUser.id, trackedSubscriptionId: hotstar!.id, suggestionType: 'cancel_forgotten', title: 'Disney+ Hotstar idle for 85 days', description: 'No activity detected. Cancelling saves ₹899/year.', savingsPaise: 89900, status: 'pending' } }),
    prisma.subscriptionSuggestion.create({ data: { orgId: org.id, endUserId: demoUser.id, trackedSubscriptionId: perplexity!.id, suggestionType: 'free_tier_available', title: 'Perplexity has a generous free tier', description: 'The free tier includes 5 Pro searches/day — saving ₹20,388/year.', savingsPaise: 2038800, status: 'pending' } }),
    prisma.subscriptionSuggestion.create({ data: { orgId: org.id, endUserId: demoUser.id, trackedSubscriptionId: notion!.id, suggestionType: 'plan_downgrade', title: 'Notion Free covers most personal use', description: 'Notion Free now has unlimited pages — downgrading saves ₹192/year.', savingsPaise: 19200, status: 'pending' } }),
  ]);
  console.log('  ✓ 5 savings suggestions');
}
