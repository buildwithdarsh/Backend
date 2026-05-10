import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const DEMO_PASSWORD = 'Demo@1234';
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);
const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000);

export async function seedBurgerEmpireRichDemo(prisma: PrismaClient) {
  console.log('\n── BurgerEmpire rich demo user ──');
  const org = await prisma.organization.findUnique({ where: { slug: 'burgerempire' } });
  if (!org) { console.log('  ✗ burgerempire org not found'); return; }

  const pwHash = await hash(DEMO_PASSWORD, 10);

  // 1. EndUser
  const user = await prisma.endUser.upsert({
    where: { orgId_email: { orgId: org.id, email: 'demo@burgerempire.in' } } as never,
    update: {},
    create: {
      orgId: org.id,
      name: 'Aarav Kapoor',
      email: 'demo@burgerempire.in',
      phone: '9870001001',
      passwordHash: pwHash,
      isEmailVerified: true,
      isPhoneVerified: true,
      status: 'active',
      referralCode: 'AARAV2026',
    },
  });
  console.log(`  ✓ Demo user: ${user.email}`);

  // 2. Addresses (2)
  // EndUserAddress fields: orgId, endUserId, label, line1, line2?, city, state?, pincode, country (default IN), isDefault
  for (const addr of [
    { label: 'Home', line1: '42, Green Park Colony', city: 'Gwalior', state: 'Madhya Pradesh', pincode: '474001', isDefault: true },
    { label: 'Work', line1: 'WeWork, Phoenix Mall', line2: '3rd Floor', city: 'Gwalior', state: 'Madhya Pradesh', pincode: '474002', isDefault: false },
  ]) {
    await prisma.endUserAddress.create({ data: { orgId: org.id, endUserId: user.id, ...addr } });
  }
  console.log('  ✓ 2 addresses');

  // 3. LoyaltyAccount (Gold tier)
  // LoyaltyAccount fields: orgId, endUserId, balance, totalEarned, totalRedeemed, tier
  const loyalty = await prisma.loyaltyAccount.upsert({
    where: { orgId_endUserId: { orgId: org.id, endUserId: user.id } } as never,
    update: { balance: 2400, totalEarned: 3200, totalRedeemed: 800, tier: 'gold' },
    create: { orgId: org.id, endUserId: user.id, balance: 2400, totalEarned: 3200, totalRedeemed: 800, tier: 'gold' },
  });
  console.log('  ✓ Loyalty account (Gold, 2400 pts)');

  // 4. Find catalog items + variants for orders
  const items = await prisma.catalogItem.findMany({
    where: { orgId: org.id },
    include: { variants: true },
    take: 15,
  });

  if (items.length === 0) { console.log('  ✗ No catalog items — run menu seed first'); return; }

  // 5. Commerce Orders (15 orders across all statuses, types, channels, payments)
  // CommerceOrder fields: orgId, orderNumber, endUserId, variantType, status, orderType, paymentMethod, customerName, customerPhone, subtotal, taxAmount, deliveryFee, totalAmount, loyaltyEarned, channel, posOrderId, createdAt
  const orderConfigs = [
    { status: 'delivered', orderType: 'delivery', paymentMethod: 'online', channel: 'web', dAgo: 2 },
    { status: 'delivered', orderType: 'delivery', paymentMethod: 'cod', channel: 'mobile', dAgo: 5 },
    { status: 'delivered', orderType: 'takeaway', paymentMethod: 'online', channel: 'web', dAgo: 8 },
    { status: 'delivered', orderType: 'dine_in', paymentMethod: 'wallet', channel: 'pos', dAgo: 12 },
    { status: 'delivered', orderType: 'delivery', paymentMethod: 'online', channel: 'mobile', dAgo: 15 },
    { status: 'delivered', orderType: 'delivery', paymentMethod: 'cod', channel: 'web', dAgo: 20 },
    { status: 'delivered', orderType: 'takeaway', paymentMethod: 'online', channel: 'mobile', dAgo: 25 },
    { status: 'delivered', orderType: 'dine_in', paymentMethod: 'online', channel: 'pos', dAgo: 30 },
    { status: 'delivered', orderType: 'delivery', paymentMethod: 'online', channel: 'web', dAgo: 40 },
    { status: 'delivered', orderType: 'delivery', paymentMethod: 'cod', channel: 'mobile', dAgo: 50 },
    { status: 'preparing', orderType: 'delivery', paymentMethod: 'online', channel: 'web', dAgo: 0 },
    { status: 'confirmed', orderType: 'takeaway', paymentMethod: 'online', channel: 'mobile', dAgo: 0 },
    { status: 'pending', orderType: 'delivery', paymentMethod: 'cod', channel: 'web', dAgo: 0 },
    { status: 'cancelled', orderType: 'delivery', paymentMethod: 'online', channel: 'web', dAgo: 18 },
    { status: 'cancelled', orderType: 'dine_in', paymentMethod: 'cod', channel: 'pos', dAgo: 35 },
  ];

  const createdOrders: string[] = [];
  for (let i = 0; i < orderConfigs.length; i++) {
    const cfg = orderConfigs[i]!;
    const item = items[i % items.length]!;
    const variant = item.variants[0];
    if (!variant) continue;

    const price = variant.price.toNumber();
    const tax = Math.round(price * 0.05 * 100) / 100;
    const delFee = cfg.orderType === 'delivery' ? 40 : 0;
    const total = price + tax + delFee;
    const orderNum = `BBRD${String(i).padStart(3, '0')}`;

    const order = await prisma.commerceOrder.upsert({
      where: { posOrderId: `rich-demo-${orderNum}` },
      update: {},
      create: {
        orgId: org.id,
        orderNumber: orderNum,
        endUserId: user.id,
        variantType: i % 2 === 0 ? 'classic' : 'healthy',
        status: cfg.status,
        orderType: cfg.orderType,
        paymentMethod: cfg.paymentMethod,
        customerName: 'Aarav Kapoor',
        customerPhone: '9870001001',
        subtotal: price,
        taxAmount: tax,
        deliveryFee: delFee,
        totalAmount: total,
        loyaltyEarned: Math.floor(total / 10),
        channel: cfg.channel,
        posOrderId: `rich-demo-${orderNum}`,
        createdAt: daysAgo(cfg.dAgo),
      },
    });
    createdOrders.push(order.id);

    // Order item
    await prisma.commerceOrderItem.create({
      data: {
        orderId: order.id,
        itemId: item.id,
        itemName: variant.name,
        variantType: i % 2 === 0 ? 'classic' : 'healthy',
        sizeVariationName: variant.name,
        quantity: 1 + (i % 3),
        unitPrice: variant.price,
        totalPrice: price,
        taxAmount: tax,
      },
    } as never);

    // Status log for delivered orders
    if (cfg.status === 'delivered') {
      for (const [from, to] of [['pending', 'confirmed'], ['confirmed', 'preparing'], ['preparing', 'ready'], ['ready', 'delivered']] as const) {
        await prisma.commerceOrderStatusLog.create({
          data: { orderId: order.id, fromStatus: from, toStatus: to, actorType: 'system' },
        });
      }
    }
  }
  console.log(`  ✓ ${createdOrders.length} commerce orders with items & status logs`);

  // 6. Loyalty Transactions (10)
  // LoyaltyTransaction fields: orgId, accountId, type, points, description, commerceOrderId?, createdAt
  for (let i = 0; i < 10; i++) {
    const isRedeem = i % 4 === 3;
    await prisma.loyaltyTransaction.create({
      data: {
        orgId: org.id,
        accountId: loyalty.id,
        type: isRedeem ? 'redeem' : 'earn',
        points: isRedeem ? -(50 + i * 20) : (30 + i * 15),
        description: isRedeem ? `Redeemed on order` : `Earned from order`,
        commerceOrderId: createdOrders[i] ?? null,
        createdAt: daysAgo(50 - i * 5),
      },
    });
  }
  console.log('  ✓ 10 loyalty transactions');

  // 7. Reviews (5)
  // Review fields: orgId, endUserId, catalogItemId?, commerceOrderId?, rating, title, body, status, isVerified, helpfulCount, createdAt
  const reviewData = [
    { rating: 5, title: 'Best burgers in town!', body: 'The Paneer Maharaja is absolutely divine. Crispy, juicy, and the makhani sauce is chef\'s kiss. 10/10 would order again every single day.', helpfulCount: 12 },
    { rating: 5, title: 'Healthy options are legit', body: 'Finally a place where "healthy" doesn\'t mean "tasteless". The quinoa tikki burger with oat bun is my new go-to. Great macros too.', helpfulCount: 8 },
    { rating: 4, title: 'Great food, slight delivery delay', body: 'Food was hot and delicious as always. Delivery took 45 minutes instead of the usual 25 though. Minus one star for that.', helpfulCount: 5 },
    { rating: 5, title: 'Loyalty program is amazing', body: 'Already Gold tier! The healthy variant bonus multiplier is genius — I get 1.5x points AND eat better. Win-win.', helpfulCount: 15 },
    { rating: 3, title: 'Decent but could improve', body: 'The combo was okay. Fries were a bit cold. The shake was great though. Will try again, hoping for a better experience.', helpfulCount: 2 },
  ];

  for (let i = 0; i < reviewData.length; i++) {
    const r = reviewData[i]!;
    const item = items[i % items.length]!;
    await prisma.review.create({
      data: {
        orgId: org.id,
        endUserId: user.id,
        catalogItemId: item.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        status: 'approved',
        isVerified: true,
        helpfulCount: r.helpfulCount,
        createdAt: daysAgo(i * 10 + 3),
      },
    });
  }
  console.log('  ✓ 5 reviews');

  // 8. Gift Card (1, partially used)
  // GiftCard fields: orgId, code, initialBalance, currentBalance, purchasedById?, recipientName?, recipientEmail?, message?, status, expiresAt?
  await prisma.giftCard.upsert({
    where: { orgId_code: { orgId: org.id, code: 'AARAV-GIFT-500' } } as never,
    update: {},
    create: {
      orgId: org.id,
      code: 'AARAV-GIFT-500',
      initialBalance: 500,
      currentBalance: 250,
      purchasedById: user.id,
      recipientName: 'Priya Kapoor',
      recipientEmail: 'priya.kapoor@gmail.com',
      message: 'Happy Birthday! Enjoy some burgers on me 🍔',
      status: 'active',
      expiresAt: daysFromNow(180),
    },
  });
  console.log('  ✓ 1 gift card (₹500, ₹250 remaining)');

  // 9. Support Ticket (1 with 3 messages)
  // SupportTicket fields: orgId, endUserId, subject, body, category?, priority, status, commerceOrderId?
  // SupportMessage fields: ticketId, senderType, senderId?, body
  const ticket = await prisma.supportTicket.create({
    data: {
      orgId: org.id,
      endUserId: user.id,
      subject: 'Missing item in my order',
      body: 'Hi, I ordered a Buddy Combo (order BBRD001) but the fries were missing from the bag. Can you help?',
      category: 'order_issue',
      priority: 'high',
      status: 'resolved',
      commerceOrderId: createdOrders[0] ?? null,
      resolvedAt: daysAgo(1),
    },
  });

  await prisma.supportMessage.createMany({
    data: [
      { ticketId: ticket.id, senderType: 'enduser', senderId: user.id, body: 'Hi, I ordered a Buddy Combo (order BBRD001) but the fries were missing from the bag. Can you help?' },
      { ticketId: ticket.id, senderType: 'admin', body: 'We\'re so sorry about that, Aarav! We\'ve added 100 bonus coins to your account and a free fries coupon. 🍟' },
      { ticketId: ticket.id, senderType: 'enduser', senderId: user.id, body: 'Thanks for the quick resolution! Love the service. 😊' },
    ],
  });
  console.log('  ✓ 1 support ticket (resolved) with 3 messages');

  // 10. Discount Coupon Usages (link to existing coupons)
  const coupons = await prisma.discountCoupon.findMany({ where: { orgId: org.id }, take: 3 });
  for (let i = 0; i < Math.min(coupons.length, 3); i++) {
    await prisma.discountCouponUsage.create({
      data: {
        orgId: org.id,
        couponId: coupons[i]!.id,
        endUserId: user.id,
        commerceOrderId: createdOrders[i] ?? null,
        discountAmount: coupons[i]!.discountValue,
      },
    });
  }
  console.log(`  ✓ ${Math.min(coupons.length, 3)} coupon usages`);

  console.log('  ✅ BurgerEmpire rich demo user seeded');
}
