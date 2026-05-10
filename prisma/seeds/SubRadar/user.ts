import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const END_USER_ID = '44349fa5-f91e-49ce-b6d9-e713df34e8d0';

export async function seedSubRadarUser(prisma: PrismaClient) {
  // Get SubRadar org
  const org = await prisma.organization.findFirst({ where: { slug: 'subradar' } });
  if (!org) throw new Error('SubRadar org not found');
  const ORG_ID = org.id;
  console.log('Seeding for org:', ORG_ID);

  // Ensure the end user exists before creating subscriptions
  const pwHash = await hash('Test@1234', 10);
  await prisma.endUser.upsert({
    where: { id: END_USER_ID },
    update: {},
    create: {
      id: END_USER_ID,
      orgId: ORG_ID,
      name: 'Aarav Sharma',
      email: 'aarav@subradar.in',
      phone: '9876543210',
      passwordHash: pwHash,
      isPhoneVerified: true,
      isEmailVerified: true,
      status: 'active',
    },
  });
  console.log('  ✓ End user created/verified');

  // Clear existing data for this user
  await prisma.subscriptionSuggestion.deleteMany({ where: { orgId: ORG_ID, endUserId: END_USER_ID } });
  await prisma.subscriptionAlert.deleteMany({ where: { orgId: ORG_ID, endUserId: END_USER_ID } });
  await prisma.trackedSubscription.deleteMany({ where: { orgId: ORG_ID, endUserId: END_USER_ID } });

  const now = new Date();
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400_000);
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400_000);

  // ─── Tracked Subscriptions ───────────────────────────────────────────────
  const subs = await Promise.all([
    // 1. Netflix — active, renews in 3 days
    prisma.trackedSubscription.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      serviceName: 'Netflix', domain: 'netflix.com',
      category: 'streaming', amountPaise: 64900, billingCycle: 'monthly',
      status: 'active', source: 'gmail_auto',
      nextRenewalAt: daysFromNow(3),
      firstSeenAt: daysAgo(180), lastSeenAt: daysAgo(1), lastActivityAt: daysAgo(1),
    }}),
    // 2. Spotify — active, renews in 12 days
    prisma.trackedSubscription.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      serviceName: 'Spotify', domain: 'spotify.com',
      category: 'streaming', amountPaise: 11900, billingCycle: 'monthly',
      status: 'active', source: 'gmail_auto',
      nextRenewalAt: daysFromNow(12),
      firstSeenAt: daysAgo(365), lastSeenAt: daysAgo(5), lastActivityAt: daysAgo(5),
    }}),
    // 3. ChatGPT Plus — active, renews in 7 days
    prisma.trackedSubscription.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      serviceName: 'ChatGPT Plus', domain: 'chat.openai.com',
      category: 'ai_tools', amountPaise: 169900, billingCycle: 'monthly',
      status: 'active', source: 'gmail_auto',
      nextRenewalAt: daysFromNow(7),
      firstSeenAt: daysAgo(90), lastSeenAt: daysAgo(2), lastActivityAt: daysAgo(2),
    }}),
    // 4. Adobe Creative Cloud — active, yearly, renews in 45 days
    prisma.trackedSubscription.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      serviceName: 'Adobe Creative Cloud', domain: 'adobe.com',
      category: 'creative', amountPaise: 480000, billingCycle: 'yearly',
      status: 'active', source: 'gmail_auto',
      nextRenewalAt: daysFromNow(45),
      firstSeenAt: daysAgo(320), lastSeenAt: daysAgo(45), lastActivityAt: daysAgo(45),
    }}),
    // 5. Notion — active, renews in 18 days
    prisma.trackedSubscription.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      serviceName: 'Notion', domain: 'notion.so',
      category: 'productivity', amountPaise: 1600, billingCycle: 'monthly',
      status: 'active', source: 'gmail_auto',
      nextRenewalAt: daysFromNow(18),
      firstSeenAt: daysAgo(200), lastSeenAt: daysAgo(3), lastActivityAt: daysAgo(3),
    }}),
    // 6. Prime Video — active, yearly
    prisma.trackedSubscription.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      serviceName: 'Amazon Prime', domain: 'primevideo.com',
      category: 'streaming', amountPaise: 179900, billingCycle: 'yearly',
      status: 'active', source: 'gmail_auto',
      nextRenewalAt: daysFromNow(120),
      firstSeenAt: daysAgo(245), lastSeenAt: daysAgo(10), lastActivityAt: daysAgo(10),
    }}),
    // 7. GitHub Copilot — active, renews in 1 day
    prisma.trackedSubscription.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      serviceName: 'GitHub Copilot', domain: 'github.com',
      category: 'ai_tools', amountPaise: 834900, billingCycle: 'yearly',
      status: 'active', source: 'gmail_auto',
      nextRenewalAt: daysFromNow(1),
      firstSeenAt: daysAgo(364), lastSeenAt: daysAgo(1), lastActivityAt: daysAgo(1),
    }}),
    // 8. Cult.fit — forgotten (no activity 70+ days)
    prisma.trackedSubscription.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      serviceName: 'Cult.fit', domain: 'cult.fit',
      category: 'fitness', amountPaise: 49900, billingCycle: 'monthly',
      status: 'forgotten', source: 'gmail_auto',
      nextRenewalAt: daysFromNow(8),
      firstSeenAt: daysAgo(180), lastSeenAt: daysAgo(75), lastActivityAt: daysAgo(75),
    }}),
    // 9. Canva Pro — free trial, expires in 5 days
    prisma.trackedSubscription.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      serviceName: 'Canva Pro', domain: 'canva.com',
      category: 'creative', amountPaise: 39900, billingCycle: 'monthly',
      status: 'free_trial', source: 'gmail_auto',
      isFreeTrialDetected: true,
      freeTrialEndsAt: daysFromNow(5),
      nextRenewalAt: daysFromNow(5),
      firstSeenAt: daysAgo(25), lastSeenAt: daysAgo(2), lastActivityAt: daysAgo(2),
    }}),
    // 10. Zoom — cancelled
    prisma.trackedSubscription.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      serviceName: 'Zoom', domain: 'zoom.us',
      category: 'productivity', amountPaise: 134900, billingCycle: 'yearly',
      status: 'cancelled', source: 'gmail_auto',
      nextRenewalAt: null,
      firstSeenAt: daysAgo(400), lastSeenAt: daysAgo(60), lastActivityAt: daysAgo(60),
    }}),
    // 11. Perplexity Pro — active
    prisma.trackedSubscription.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      serviceName: 'Perplexity Pro', domain: 'perplexity.ai',
      category: 'ai_tools', amountPaise: 169900, billingCycle: 'monthly',
      status: 'active', source: 'gmail_auto',
      nextRenewalAt: daysFromNow(22),
      firstSeenAt: daysAgo(60), lastSeenAt: daysAgo(4), lastActivityAt: daysAgo(4),
    }}),
    // 12. Disney+ Hotstar — forgotten
    prisma.trackedSubscription.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      serviceName: 'Disney+ Hotstar', domain: 'hotstar.com',
      category: 'streaming', amountPaise: 89900, billingCycle: 'yearly',
      status: 'forgotten', source: 'gmail_auto',
      nextRenewalAt: daysFromNow(90),
      firstSeenAt: daysAgo(300), lastSeenAt: daysAgo(85), lastActivityAt: daysAgo(85),
    }}),
  ]);

  const [netflix, spotify, chatgpt, adobe, notion, , copilot, cultfit, canva, , perplexity, hotstar] = subs;

  console.log(`Created ${subs.length} subscriptions`);

  // ─── Alerts ──────────────────────────────────────────────────────────────
  const alerts = await Promise.all([
    // Netflix renews in 3 days
    prisma.subscriptionAlert.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      trackedSubscriptionId: netflix.id,
      alertType: 'renewal_3d', daysUntilRenewal: 3,
      amountPaise: netflix.amountPaise,
      scheduledAt: daysFromNow(3),
      isDismissed: false,
    }}),
    // GitHub Copilot renews tomorrow
    prisma.subscriptionAlert.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      trackedSubscriptionId: copilot.id,
      alertType: 'renewal_1d', daysUntilRenewal: 1,
      amountPaise: copilot.amountPaise,
      scheduledAt: daysFromNow(1),
      isDismissed: false,
    }}),
    // ChatGPT renews in 7 days
    prisma.subscriptionAlert.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      trackedSubscriptionId: chatgpt.id,
      alertType: 'renewal_7d', daysUntilRenewal: 7,
      amountPaise: chatgpt.amountPaise,
      scheduledAt: daysFromNow(7),
      isDismissed: false,
    }}),
    // Canva Pro trial expiring in 5 days
    prisma.subscriptionAlert.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      trackedSubscriptionId: canva.id,
      alertType: 'free_trial_expiry',
      amountPaise: canva.amountPaise,
      scheduledAt: daysFromNow(5),
      isDismissed: false,
    }}),
    // Adobe price increase (was ₹3,600, now ₹4,800/yr)
    prisma.subscriptionAlert.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      trackedSubscriptionId: adobe.id,
      alertType: 'price_increase',
      amountPaise: 480000, previousAmountPaise: 360000,
      scheduledAt: daysAgo(5),
      isDismissed: false,
    }}),
    // Spotify price dropped (was ₹179, now ₹119)
    prisma.subscriptionAlert.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      trackedSubscriptionId: spotify.id,
      alertType: 'price_decrease',
      amountPaise: 11900, previousAmountPaise: 17900,
      scheduledAt: daysAgo(10),
      isDismissed: false,
    }}),
    // Dismissed — Netflix 7d (old)
    prisma.subscriptionAlert.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      trackedSubscriptionId: netflix.id,
      alertType: 'renewal_7d', daysUntilRenewal: 7,
      amountPaise: netflix.amountPaise,
      scheduledAt: daysAgo(4),
      isDismissed: true,
    }}),
  ]);

  console.log(`Created ${alerts.length} alerts`);

  // ─── Suggestions ─────────────────────────────────────────────────────────
  const suggestions = await Promise.all([
    // Switch from Adobe CC to Canva Pro (cheaper)
    prisma.subscriptionSuggestion.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      trackedSubscriptionId: adobe.id,
      suggestionType: 'cheaper_alternative',
      title: 'Switch from Adobe CC to Canva Pro',
      description: 'Adobe Creative Cloud costs ₹4,800/year. Canva Pro covers most design needs at just ₹3,999/year — saving you ₹801 annually.',
      alternativeServiceName: 'Canva Pro',
      alternativeAmountPaise: 39900,
      savingsPaise: 80100,
      status: 'pending',
    }}),
    // Cancel Cult.fit — forgotten
    prisma.subscriptionSuggestion.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      trackedSubscriptionId: cultfit.id,
      suggestionType: 'cancel_forgotten',
      title: "You haven't used Cult.fit in 75 days",
      description: "Cult.fit has been inactive for over 2 months. Cancelling would save you ₹499/month — ₹5,988 per year.",
      savingsPaise: 598800,
      status: 'pending',
    }}),
    // Cancel Disney+ — forgotten
    prisma.subscriptionSuggestion.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      trackedSubscriptionId: hotstar.id,
      suggestionType: 'cancel_forgotten',
      title: "Disney+ Hotstar has been idle for 85 days",
      description: "No activity detected since you subscribed. Cancelling saves ₹899/year. You can always resubscribe during a sale.",
      savingsPaise: 89900,
      status: 'pending',
    }}),
    // Downgrade Perplexity to free
    prisma.subscriptionSuggestion.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      trackedSubscriptionId: perplexity.id,
      suggestionType: 'free_tier_available',
      title: 'Perplexity has a generous free tier',
      description: "Perplexity Pro costs ₹1,699/month. The free tier includes 5 Pro searches per day — enough for casual use and saving you ₹20,388/year.",
      savingsPaise: 2038800,
      status: 'pending',
    }}),
    // Downgrade Notion to personal free
    prisma.subscriptionSuggestion.create({ data: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      trackedSubscriptionId: notion.id,
      suggestionType: 'plan_downgrade',
      title: 'Notion Free covers most personal use',
      description: "You're on Notion Plus at ₹16/month. Notion Free now has unlimited pages and blocks for individuals — downgrading saves ₹192/year.",
      savingsPaise: 19200,
      status: 'pending',
    }}),
  ]);

  console.log(`Created ${suggestions.length} suggestions`);
  console.log('✅ Rich seed complete!');
}
