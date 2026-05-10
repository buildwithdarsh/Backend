import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const DEMO_PASSWORD = 'Demo@1234';
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);
const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export async function seedBurgerEmpireDemo(prisma: PrismaClient) {
  console.log('\n── BurgerEmpire demo data ──');
  const org = await prisma.organization.findUnique({ where: { slug: 'burgerempire' } });
  if (!org) { console.log('  ✗ burgerempire org not found — run main seed first'); return; }

  const pwHash = await hash(DEMO_PASSWORD, 10);

  // 10 demo customers
  const customers = [
    { name: 'Arjun Sharma', email: 'arjun.sharma@gmail.com', phone: '9810001001' },
    { name: 'Priya Mehta', email: 'priya.mehta@gmail.com', phone: '9810001002' },
    { name: 'Rohan Verma', email: 'rohan.verma@gmail.com', phone: '9810001003' },
    { name: 'Sneha Gupta', email: 'sneha.gupta@gmail.com', phone: '9810001004' },
    { name: 'Karan Singh', email: 'karan.singh@gmail.com', phone: '9810001005' },
    { name: 'Meera Pillai', email: 'meera.pillai@gmail.com', phone: '9810001006' },
    { name: 'Akash Yadav', email: 'akash.yadav@gmail.com', phone: '9810001007' },
    { name: 'Divya Nair', email: 'divya.nair@gmail.com', phone: '9810001008' },
    { name: 'Raj Patel', email: 'raj.patel@gmail.com', phone: '9810001009' },
    { name: 'Anjali Dubey', email: 'anjali.dubey@gmail.com', phone: '9810001010' },
  ];

  const endUsers: Array<{ id: string }> = [];
  for (const c of customers) {
    const eu = await prisma.endUser.upsert({
      where: { orgId_email: { orgId: org.id, email: c.email } } as never,
      update: { name: c.name, phone: c.phone },
      create: {
        orgId: org.id, name: c.name, email: c.email, phone: c.phone,
        passwordHash: pwHash, isEmailVerified: true, isPhoneVerified: true,
        status: 'active', referralCode: `BB${c.phone.slice(-4)}`,
      },
    });
    endUsers.push(eu);
  }
  console.log(`  ✓ ${endUsers.length} end users`);

  // Loyalty tiers
  const tiers = ['bronze', 'silver', 'gold', 'bronze', 'silver', 'gold', 'bronze', 'silver', 'bronze', 'gold'];
  for (let i = 0; i < endUsers.length; i++) {
    const earned = [200, 850, 2100, 150, 600, 3400, 80, 950, 300, 5200][i]!;
    const redeemed = Math.floor(earned * 0.3);
    await prisma.loyaltyAccount.upsert({
      where: { orgId_endUserId: { orgId: org.id, endUserId: endUsers[i]!.id } } as never,
      update: { balance: earned - redeemed, totalEarned: earned, totalRedeemed: redeemed, tier: tiers[i]! },
      create: {
        orgId: org.id, endUserId: endUsers[i]!.id,
        balance: earned - redeemed, totalEarned: earned, totalRedeemed: redeemed,
        tier: tiers[i]!,
      },
    });
  }
  console.log('  ✓ 10 loyalty accounts');

  // Find some catalog items for order line items
  const items = await prisma.catalogItem.findMany({
    where: { orgId: org.id },
    include: { variants: true },
    take: 12,
  });

  // 22 commerce orders
  const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'delivered', 'delivered', 'cancelled'];
  const orderTypes = ['delivery', 'takeaway', 'dine_in'];
  const channels = ['web', 'mobile', 'pos'];

  for (let i = 0; i < 22; i++) {
    const customer = endUsers[i % endUsers.length]!;
    const status = pick(statuses);
    const orderType = pick(orderTypes);
    const item1 = items[i % items.length];
    const item2 = items[(i + 3) % items.length];
    const variant1 = item1?.variants?.[0];
    const variant2 = item2?.variants?.[0];

    if (!item1 || !variant1) continue;

    const subtotal = variant1.price.toNumber() + (variant2 ? variant2.price.toNumber() : 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const total = subtotal + tax + (orderType === 'delivery' ? 40 : 0);
    const orderNum = `BB${String(1000 + i).padStart(4, '0')}`;

    const order = await prisma.commerceOrder.upsert({
      where: { posOrderId: `demo-${orderNum}` },
      update: {},
      create: {
        orgId: org.id,
        orderNumber: orderNum,
        endUserId: customer.id,
        variantType: 'classic',
        status,
        orderType,
        paymentMethod: pick(['online', 'cod', 'wallet']),
        customerName: customers[endUsers.indexOf(customer) % customers.length]?.name ?? 'Customer',
        customerPhone: customers[endUsers.indexOf(customer) % customers.length]?.phone ?? '9810000000',
        subtotal,
        taxAmount: tax,
        deliveryFee: orderType === 'delivery' ? 40 : 0,
        totalAmount: total,
        loyaltyEarned: Math.floor(total / 10),
        channel: pick(channels),
        posOrderId: `demo-${orderNum}`,
        createdAt: daysAgo(Math.floor(Math.random() * 60)),
      },
    });

    // Order items
    await prisma.commerceOrderItem.upsert({
      where: { id: `00000000-0000-0000-00${String(i).padStart(2, '0')}-000000000001` } as never,
      update: {},
      create: {
        id: `00000000-0000-0000-00${String(i).padStart(2, '0')}-000000000001`,
        orderId: order.id,
        itemId: item1.id,
        itemName: variant1.name,
        variantType: 'classic',
        sizeVariationName: variant1.name,
        quantity: 1,
        unitPrice: variant1.price,
        totalPrice: variant1.price,
        taxAmount: tax,
      },
    } as never);
  }
  console.log('  ✓ 22 commerce orders');

  // 3 discount coupons
  const coupons = [
    { code: 'DEMO20', name: '20% Off First Order', discountType: 'percent', discountValue: 20, minOrderAmount: 99 },
    { code: 'FLAT50', name: 'Flat ₹50 Off', discountType: 'fixed', discountValue: 50, minOrderAmount: 199 },
    { code: 'LOYALTY10', name: '10% Loyalty Reward', discountType: 'percent', discountValue: 10, minOrderAmount: 149 },
  ];
  for (const c of coupons) {
    await prisma.discountCoupon.upsert({
      where: { orgId_code: { orgId: org.id, code: c.code } } as never,
      update: {},
      create: {
        orgId: org.id,
        code: c.code,
        name: c.name,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minOrderAmount: c.minOrderAmount,
        maxUsageTotal: 500,
        isActive: true,
        expiresAt: daysFromNow(90),
        applicableVariantTypes: ['classic', 'healthy'],
        applicableOrderTypes: ['delivery', 'takeaway', 'dine_in'],
      },
    } as never);
  }
  console.log('  ✓ 3 discount coupons');

  // 2 blog posts
  const posts = [
    {
      slug: 'demo-our-story',
      title: 'The Burger Empire Story',
      excerpt: 'How we went from a tiny stall in Sector 62 to Noida\'s favourite burger joint.',
      body: 'It started in 2018 with a single griddle and a dream...',
      status: 'published',
      publishedAt: daysAgo(30),
    },
    {
      slug: 'demo-healthy-menu',
      title: 'Introducing the Healthy Menu',
      excerpt: 'Same great taste, fewer calories — our new healthy variants are here.',
      body: 'We listened to our customers and worked with nutritionists to build a menu that doesn\'t compromise on taste...',
      status: 'published',
      publishedAt: daysAgo(7),
    },
  ];
  for (const p of posts) {
    await prisma.contentPost.upsert({
      where: { orgId_slug: { orgId: org.id, slug: p.slug } } as never,
      update: {},
      create: { orgId: org.id, ...p },
    });
  }
  console.log('  ✓ 2 blog posts');
}
