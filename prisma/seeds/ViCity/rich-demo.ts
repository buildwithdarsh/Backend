import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const DEMO_PASSWORD = 'Demo@1234';
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);

export async function seedViCityRichDemo(prisma: PrismaClient) {
  console.log('\n── ViCity rich demo user ──');
  const org = await prisma.organization.findUnique({ where: { slug: 'vicity' } });
  if (!org) { console.log('  ✗ vicity org not found'); return; }

  const villaType = await prisma.propertyType.findFirst({ where: { orgId: org.id } });
  if (!villaType) { console.log('  ✗ no property type found'); return; }

  const pwHash = await hash(DEMO_PASSWORD, 10);

  // 1. EndUser
  const user = await prisma.endUser.upsert({
    where: { orgId_email: { orgId: org.id, email: 'demo@vicity.in' } } as never,
    update: {},
    create: {
      orgId: org.id,
      name: 'Meera Sharma',
      email: 'demo@vicity.in',
      phone: '9870002001',
      passwordHash: pwHash,
      isEmailVerified: true,
      isPhoneVerified: true,
      status: 'active',
    },
  });
  console.log(`  ✓ Demo user: ${user.email}`);

  // 2. Property Bookings (8 — showing repeat guest journey)
  // PropertyBooking fields: orgId, bookingReference, endUserId, propertyTypeId, checkInDate, checkOutDate, nights, guestCount, guestName, guestPhone, guestEmail, baseAmount, taxAmount, totalAmount, status, paymentStatus, paymentType, specialRequests?, checkedInAt?, checkedOutAt?, cancelledAt?
  const bookingConfigs = [
    { ref: 'VDEMO001', nights: 2, offset: -120, status: 'checked_out', paymentStatus: 'paid', special: null },
    { ref: 'VDEMO002', nights: 3, offset: -90, status: 'checked_out', paymentStatus: 'paid', special: 'Early check-in at 12pm please' },
    { ref: 'VDEMO003', nights: 1, offset: -60, status: 'checked_out', paymentStatus: 'paid', special: null },
    { ref: 'VDEMO004', nights: 4, offset: -30, status: 'checked_out', paymentStatus: 'paid', special: 'Birthday celebration — can we get a cake?' },
    { ref: 'VDEMO005', nights: 2, offset: -10, status: 'checked_out', paymentStatus: 'paid', special: 'Late checkout requested' },
    { ref: 'VDEMO006', nights: 3, offset: 5, status: 'confirmed', paymentStatus: 'paid', special: 'Anniversary trip — any special arrangements?' },
    { ref: 'VDEMO007', nights: 2, offset: 20, status: 'confirmed', paymentStatus: 'partial', special: null },
    { ref: 'VDEMO008', nights: 1, offset: -45, status: 'cancelled', paymentStatus: 'refunded', special: null },
  ];

  const bookingIds: string[] = [];
  for (const cfg of bookingConfigs) {
    const checkIn = new Date(Date.now() + cfg.offset * 86_400_000);
    const checkOut = new Date(checkIn.getTime() + cfg.nights * 86_400_000);
    const base = villaType.basePrice * cfg.nights;
    const tax = Math.round(base * 0.18);
    const total = base + tax;

    const booking = await prisma.propertyBooking.upsert({
      where: { orgId_bookingReference: { orgId: org.id, bookingReference: cfg.ref } } as never,
      update: {},
      create: {
        orgId: org.id,
        bookingReference: cfg.ref,
        endUserId: user.id,
        propertyTypeId: villaType.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        nights: cfg.nights,
        guestCount: Math.floor(Math.random() * 4) + 2,
        guestName: 'Meera Sharma',
        guestPhone: '9870002001',
        guestEmail: 'demo@vicity.in',
        baseAmount: base,
        taxAmount: tax,
        totalAmount: total,
        status: cfg.status,
        paymentStatus: cfg.paymentStatus,
        paymentType: 'full',
        specialRequests: cfg.special,
        checkedInAt: cfg.status === 'checked_out' ? new Date(checkIn.getTime() + 14 * 3600_000) : null,
        checkedOutAt: cfg.status === 'checked_out' ? new Date(checkOut.getTime() + 11 * 3600_000) : null,
        cancelledAt: cfg.status === 'cancelled' ? daysAgo(43) : null,
      },
    } as never);
    bookingIds.push(booking.id);
  }
  console.log(`  ✓ ${bookingIds.length} property bookings`);

  // 3. Property Payments
  // PropertyPayment fields: orgId, bookingId, amount (paise), type (full/advance/balance), status (pending/captured/failed/refunded)
  for (let i = 0; i < bookingIds.length; i++) {
    const cfg = bookingConfigs[i]!;
    const base = villaType.basePrice * cfg.nights;
    const total = base + Math.round(base * 0.18);

    if (cfg.paymentStatus === 'paid') {
      await prisma.propertyPayment.create({
        data: { orgId: org.id, bookingId: bookingIds[i]!, amount: total, type: 'full', status: 'captured' },
      });
    } else if (cfg.paymentStatus === 'partial') {
      await prisma.propertyPayment.create({
        data: { orgId: org.id, bookingId: bookingIds[i]!, amount: Math.round(total * 0.5), type: 'advance', status: 'captured' },
      });
    } else if (cfg.paymentStatus === 'refunded') {
      await prisma.propertyPayment.create({
        data: { orgId: org.id, bookingId: bookingIds[i]!, amount: total, type: 'full', status: 'refunded', refundAmount: total },
      });
    }
  }
  console.log('  ✓ Property payments');

  // 4. Reviews (4 — showing loyalty)
  // Review fields: orgId, endUserId, rating, title, body, status, isVerified, createdAt
  const reviews = [
    { rating: 5, title: 'Our happy place — 5th visit!', body: 'We keep coming back to The Courtyard Villa because nothing else compares. The pool, the garden, the BBQ nights — perfection every single time. Already planning visit #6!' },
    { rating: 5, title: 'Birthday celebration was magical', body: 'The team arranged a surprise cake and decorated the courtyard with fairy lights for my birthday. So thoughtful. This is why we\'re repeat guests.' },
    { rating: 4, title: 'Almost perfect weekend', body: 'Beautiful as always. Only minor thing — the WiFi was spotty during our Sunday morning call. Everything else was stellar.' },
    { rating: 5, title: 'Anniversary trip exceeded expectations', body: 'The villa had fresh flowers and a bottle of wine waiting for us. The staff remembered our preferences from last time. Five stars, always.' },
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
        createdAt: daysAgo(i * 25 + 5),
      },
    });
  }
  console.log('  ✓ 4 reviews');

  // 5. Discount Coupon Usages
  const coupons = await prisma.discountCoupon.findMany({ where: { orgId: org.id }, take: 2 });
  for (let i = 0; i < coupons.length; i++) {
    await prisma.discountCouponUsage.create({
      data: {
        orgId: org.id,
        couponId: coupons[i]!.id,
        endUserId: user.id,
        discountAmount: coupons[i]!.discountValue,
      },
    });
  }
  console.log(`  ✓ ${coupons.length} coupon usages`);

  console.log('  ✅ ViCity rich demo user seeded');
}
