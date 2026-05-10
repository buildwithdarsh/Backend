import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const DEMO_PASSWORD = 'Demo@1234';
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);
const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000);

export async function seedViCityDemo(prisma: PrismaClient) {
  console.log('\n── ViCity demo data ──');
  const org = await prisma.organization.findUnique({ where: { slug: 'vicity' } });
  if (!org) { console.log('  ✗ vicity org not found'); return; }

  const pwHash = await hash(DEMO_PASSWORD, 10);
  const villaType = await prisma.propertyType.findFirst({ where: { orgId: org.id } });
  if (!villaType) { console.log('  ✗ no property type found'); return; }

  // 2 extra units
  for (const unitNum of ['VILLA-02', 'VILLA-03']) {
    await prisma.propertyUnit.upsert({
      where: { orgId_unitNumber: { orgId: org.id, unitNumber: unitNum } },
      update: {},
      create: { orgId: org.id, propertyTypeId: villaType.id, unitNumber: unitNum, floor: 0, status: 'available', housekeepingStatus: 'clean' },
    });
  }
  console.log('  ✓ 3 property units total');

  // 8 guest end users
  const guests = [
    { name: 'Rahul Kapoor', email: 'rahul.kapoor@gmail.com', phone: '9820002001' },
    { name: 'Shruti Joshi', email: 'shruti.joshi@gmail.com', phone: '9820002002' },
    { name: 'Vikas Malhotra', email: 'vikas.malhotra@gmail.com', phone: '9820002003' },
    { name: 'Nisha Rao', email: 'nisha.rao@gmail.com', phone: '9820002004' },
    { name: 'Aditya Bansal', email: 'aditya.bansal@gmail.com', phone: '9820002005' },
    { name: 'Kavya Reddy', email: 'kavya.reddy@gmail.com', phone: '9820002006' },
    { name: 'Mohit Chaudhary', email: 'mohit.chaudhary@gmail.com', phone: '9820002007' },
    { name: 'Pooja Saxena', email: 'pooja.saxena@gmail.com', phone: '9820002008' },
  ];

  const guestUsers: Array<{ id: string }> = [];
  for (const g of guests) {
    const eu = await prisma.endUser.upsert({
      where: { orgId_email: { orgId: org.id, email: g.email } } as never,
      update: { name: g.name, isPhoneVerified: true },
      create: {
        orgId: org.id, name: g.name, email: g.email, phone: g.phone,
        passwordHash: pwHash, isEmailVerified: true, isPhoneVerified: true, status: 'active',
      },
    });
    guestUsers.push(eu);
  }
  console.log(`  ✓ ${guestUsers.length} guest users`);

  // 10 bookings
  const bookingData = [
    { guestIdx: 0, nights: 2, checkInOffset: -30, status: 'checked_out', paymentStatus: 'paid' },
    { guestIdx: 1, nights: 3, checkInOffset: -15, status: 'checked_out', paymentStatus: 'paid' },
    { guestIdx: 2, nights: 1, checkInOffset: -5, status: 'checked_out', paymentStatus: 'paid' },
    { guestIdx: 3, nights: 2, checkInOffset: 2, status: 'confirmed', paymentStatus: 'paid' },
    { guestIdx: 4, nights: 3, checkInOffset: 7, status: 'confirmed', paymentStatus: 'partial' },
    { guestIdx: 5, nights: 2, checkInOffset: 14, status: 'confirmed', paymentStatus: 'pending' },
    { guestIdx: 6, nights: 4, checkInOffset: 21, status: 'confirmed', paymentStatus: 'pending' },
    { guestIdx: 7, nights: 1, checkInOffset: -45, status: 'cancelled', paymentStatus: 'refunded' },
    { guestIdx: 0, nights: 2, checkInOffset: -60, status: 'checked_out', paymentStatus: 'paid' },
    { guestIdx: 2, nights: 3, checkInOffset: 30, status: 'confirmed', paymentStatus: 'pending' },
  ];

  for (let i = 0; i < bookingData.length; i++) {
    const bd = bookingData[i]!;
    const guest = guestUsers[bd.guestIdx]!;
    const guestInfo = guests[bd.guestIdx]!;
    const checkIn = new Date(Date.now() + bd.checkInOffset * 86_400_000);
    const checkOut = new Date(checkIn.getTime() + bd.nights * 86_400_000);
    const base = villaType.basePrice * bd.nights;
    const tax = Math.round(base * 0.12);
    const total = base + tax;
    const ref = `VLR${String(1000 + i).padStart(4, '0')}`;

    await prisma.propertyBooking.upsert({
      where: { orgId_bookingReference: { orgId: org.id, bookingReference: ref } } as never,
      update: {},
      create: {
        orgId: org.id,
        bookingReference: ref,
        endUserId: guest.id,
        propertyTypeId: villaType.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        nights: bd.nights,
        guestCount: Math.floor(Math.random() * 4) + 1,
        guestName: guestInfo.name,
        guestPhone: guestInfo.phone,
        guestEmail: guestInfo.email,
        baseAmount: base,
        taxAmount: tax,
        totalAmount: total,
        status: bd.status,
        paymentStatus: bd.paymentStatus,
        paymentType: 'full',
        checkedInAt: bd.status === 'checked_out' ? new Date(checkIn.getTime() + 3 * 3600_000) : null,
        checkedOutAt: bd.status === 'checked_out' ? new Date(checkOut.getTime() + 11 * 3600_000) : null,
        cancelledAt: bd.status === 'cancelled' ? daysAgo(40) : null,
      },
    } as never);
  }
  console.log('  ✓ 10 property bookings');

  // 5 reviews
  const reviews = [
    { guestIdx: 0, rating: 5, title: 'Absolutely stunning villa!', body: 'The courtyard is magical at night. Pool was pristine, staff incredibly warm. Will definitely be back!' },
    { guestIdx: 1, rating: 5, title: 'Perfect anniversary getaway', body: 'Everything was flawless — from the welcome drinks to the BBQ setup. Best 3 nights of our lives.' },
    { guestIdx: 2, rating: 4, title: 'Beautiful but AC could be stronger', body: 'Gorgeous property with great amenities. Minor note: the bedroom AC struggled a bit in peak afternoon heat.' },
    { guestIdx: 8, rating: 5, title: 'Weekend that turned into a tradition', body: 'Third time staying here. The garden is even more beautiful than photos. Already booked our next trip.' },
    { guestIdx: 3, rating: 4, title: 'Great value for a luxury experience', body: 'Loved the privacy and the kitchen setup. Would appreciate more streaming options on the TV.' },
  ];

  for (const r of reviews) {
    const guest = guestUsers[r.guestIdx % guestUsers.length]!;
    await prisma.review.create({
      data: {
        orgId: org.id,
        endUserId: guest.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        status: 'approved',
        isVerified: true,
        createdAt: daysAgo(Math.floor(Math.random() * 60) + 5),
      },
    });
  }
  console.log('  ✓ 5 guest reviews');

  // 2 coupons
  const coupons = [
    { code: 'VELO10', name: '10% Off Your Stay', discountType: 'percent', discountValue: 10, minOrderAmount: 5000 },
    { code: 'FLAT2000', name: 'Flat ₹2,000 Off', discountType: 'fixed', discountValue: 2000, minOrderAmount: 10000 },
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
        maxUsageTotal: 200,
        isActive: true,
        expiresAt: daysFromNow(120),
        applicableVariantTypes: [],
        applicableOrderTypes: [],
      },
    } as never);
  }
  console.log('  ✓ 2 discount coupons');
}
