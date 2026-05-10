import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const DEMO_PASSWORD = 'Demo@1234';
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);
const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000);

export async function seedGlamourWavesRichDemo(prisma: PrismaClient) {
  console.log('\n── GlamourWaves rich demo user ──');
  const org = await prisma.organization.findUnique({ where: { slug: 'glamourwaves' } });
  if (!org) { console.log('  ✗ glamourwaves org not found'); return; }

  const pwHash = await hash(DEMO_PASSWORD, 10);

  // 1. EndUser
  const user = await prisma.endUser.upsert({
    where: { orgId_email: { orgId: org.id, email: 'demo@glamourwaves.in' } } as never,
    update: {},
    create: {
      orgId: org.id,
      name: 'Ananya Joshi',
      email: 'demo@glamourwaves.in',
      phone: '9870004001',
      passwordHash: pwHash,
      isEmailVerified: true,
      isPhoneVerified: true,
      status: 'active',
    },
  });
  console.log(`  ✓ Demo user: ${user.email}`);

  // 2. Create BookableResources (salon stations)
  const resources: string[] = [];
  const resourceData = [
    { name: 'Station 1 — Hair', type: 'seat', capacity: 1 },
    { name: 'Station 2 — Hair', type: 'seat', capacity: 1 },
    { name: 'Skin Room A', type: 'room', capacity: 1 },
    { name: 'Makeup Room', type: 'room', capacity: 1 },
    { name: 'Men\'s Zone', type: 'seat', capacity: 2 },
  ];
  for (const rd of resourceData) {
    const res = await prisma.bookableResource.create({
      data: { orgId: org.id, name: rd.name, type: rd.type, capacity: rd.capacity, isActive: true },
    });
    resources.push(res.id);
  }
  console.log(`  ✓ ${resources.length} bookable resources`);

  // 3. Reservations (12 across various statuses and services)
  const reservationConfigs = [
    { dOffset: -90, time: '10:00', end: '11:00', service: 'Haircut + Blow Dry', status: 'completed', resourceIdx: 0 },
    { dOffset: -75, time: '14:00', end: '15:30', service: 'Hair Spa Treatment', status: 'completed', resourceIdx: 1 },
    { dOffset: -60, time: '11:00', end: '12:00', service: 'Gold Facial', status: 'completed', resourceIdx: 2 },
    { dOffset: -45, time: '15:00', end: '16:00', service: 'Manicure + Pedicure', status: 'completed', resourceIdx: 2 },
    { dOffset: -30, time: '10:00', end: '11:30', service: 'Hair Coloring', status: 'completed', resourceIdx: 0 },
    { dOffset: -20, time: '16:00', end: '18:00', service: 'Party Makeup', status: 'completed', resourceIdx: 3 },
    { dOffset: -15, time: '11:00', end: '12:00', service: 'Threading + Waxing', status: 'completed', resourceIdx: 2 },
    { dOffset: -7, time: '14:00', end: '15:00', service: 'Keratin Treatment', status: 'completed', resourceIdx: 1 },
    { dOffset: 3, time: '10:00', end: '11:00', service: 'Haircut + Styling', status: 'confirmed', resourceIdx: 0 },
    { dOffset: 10, time: '14:00', end: '16:00', service: 'Bridal Makeup Trial', status: 'confirmed', resourceIdx: 3 },
    { dOffset: -50, time: '10:00', end: '11:00', service: 'Basic Cleanup', status: 'cancelled', resourceIdx: 2 },
    { dOffset: -35, time: '15:00', end: '16:00', service: 'Hair Spa', status: 'no_show', resourceIdx: 1 },
  ];

  for (const cfg of reservationConfigs) {
    const date = cfg.dOffset >= 0 ? daysFromNow(cfg.dOffset) : daysAgo(-cfg.dOffset);
    await prisma.reservation.create({
      data: {
        orgId: org.id,
        endUserId: user.id,
        resourceId: resources[cfg.resourceIdx] ?? null,
        date,
        startTime: cfg.time,
        endTime: cfg.end,
        partySize: 1,
        customerName: 'Ananya Joshi',
        customerPhone: '9870004001',
        status: cfg.status,
        notes: cfg.service,
      },
    });
  }
  console.log('  ✓ 12 reservations (8 completed, 2 upcoming, 1 cancelled, 1 no-show)');

  // 4. Reviews (4 on completed services)
  const reviews = [
    { rating: 5, title: 'Best hair spa ever!', body: 'My hair feels like silk after the hair spa treatment. The stylist was incredibly skilled and the products they use are top-notch. Already booked my next session!' },
    { rating: 5, title: 'Party makeup was stunning', body: 'Got so many compliments at the party! The makeup artist understood exactly what I wanted — glam but not over the top. Will definitely come back for every occasion.' },
    { rating: 4, title: 'Great facial but had to wait', body: 'The Gold Facial itself was amazing — my skin was glowing for days. Only issue was a 15-minute wait even though I had an appointment. Otherwise perfect.' },
    { rating: 5, title: 'Keratin treatment transformed my hair', body: 'Went from frizzy disaster to smooth and manageable. The stylist explained the aftercare routine thoroughly. Three weeks in and it still looks salon-fresh!' },
  ];

  for (let i = 0; i < reviews.length; i++) {
    const r = reviews[i]!;
    await prisma.review.create({
      data: {
        orgId: org.id,
        endUserId: user.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        status: 'approved',
        isVerified: true,
        createdAt: daysAgo(i * 20 + 5),
      },
    });
  }
  console.log('  ✓ 4 reviews');

  console.log('  ✅ GlamourWaves rich demo user seeded');
}
