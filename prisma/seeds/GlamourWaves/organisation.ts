import { PrismaClient } from '@prisma/client';
import { seedOrganization, OrgSettingEntry } from '../Shared';

const GLAMOURWAVES_SETTINGS: OrgSettingEntry[] = [
  // Branding
  { group: 'branding', key: 'name', value: '"Glamour Waves"', type: 'string', label: 'Business display name' },
  { group: 'branding', key: 'tagline', value: '"Unisex Salon — Where Style Meets Elegance"', type: 'string', label: 'Tagline' },
  { group: 'branding', key: 'currency', value: '"INR"', type: 'string', label: 'Currency code' },
  { group: 'branding', key: 'currency_symbol', value: '"₹"', type: 'string', label: 'Currency symbol' },
  { group: 'branding', key: 'timezone', value: '"Asia/Kolkata"', type: 'string', label: 'Timezone' },
  { group: 'branding', key: 'primary_color', value: '"#B8860B"', type: 'string', label: 'Primary brand color (gold)' },
  { group: 'branding', key: 'secondary_color', value: '"#1A1A2E"', type: 'string', label: 'Secondary brand color (navy)' },
  { group: 'branding', key: 'logo_url', value: '""', type: 'string', label: 'Logo URL' },
  // Contact
  { group: 'contact', key: 'phone', value: '"+91 98765 43210"', type: 'string', label: 'Business phone' },
  { group: 'contact', key: 'whatsapp', value: '"919876543210"', type: 'string', label: 'WhatsApp number' },
  { group: 'contact', key: 'email', value: '"hello@glamourwaves.in"', type: 'string', label: 'Business email' },
  { group: 'contact', key: 'address', value: '"Near City Center Mall, Lashkar, Gwalior, MP 474001"', type: 'string', label: 'Business address' },
  { group: 'contact', key: 'city', value: '"Gwalior"', type: 'string', label: 'City' },
  { group: 'contact', key: 'state', value: '"Madhya Pradesh"', type: 'string', label: 'State' },
  { group: 'contact', key: 'pincode', value: '"474001"', type: 'string', label: 'Pincode' },
  { group: 'contact', key: 'google_maps', value: '"https://maps.google.com/?q=Glamour+Waves+Salon+Gwalior"', type: 'string', label: 'Google Maps URL' },
  { group: 'contact', key: 'instagram', value: '"https://instagram.com/glamourwaves"', type: 'string', label: 'Instagram URL' },
  { group: 'contact', key: 'facebook', value: '"https://facebook.com/glamourwaves"', type: 'string', label: 'Facebook URL' },
  // Auth
  { group: 'auth', key: 'primary_login_id', value: '"phone"', type: 'string', label: 'Primary login identifier' },
  { group: 'auth', key: 'otp_enabled', value: 'true', type: 'boolean', label: 'OTP login enabled' },
  { group: 'auth', key: 'dummy_mode', value: 'true', type: 'boolean', label: 'Dummy OTP (dev)' },
  { group: 'auth', key: 'dummy_code', value: '"123456"', type: 'string', label: 'Dummy OTP code (dev)' },
  // Features
  { group: 'features', key: 'reviews_enabled', value: 'true', type: 'boolean', label: 'Reviews enabled' },
  { group: 'features', key: 'whatsapp_enabled', value: 'true', type: 'boolean', label: 'WhatsApp booking enabled' },
  { group: 'features', key: 'whatsapp_phone', value: '"919876543210"', type: 'string', label: 'WhatsApp phone for booking' },
  { group: 'features', key: 'gallery_enabled', value: 'true', type: 'boolean', label: 'Gallery enabled' },
  { group: 'features', key: 'blog_enabled', value: 'false', type: 'boolean', label: 'Blog enabled' },
  { group: 'features', key: 'booking_enabled', value: 'true', type: 'boolean', label: 'Online booking enabled' },
  // Booking / Appointments
  { group: 'booking', key: 'prefix', value: '"GW"', type: 'string', label: 'Booking reference prefix' },
  { group: 'booking', key: 'auto_confirm', value: 'false', type: 'boolean', label: 'Auto-confirm bookings' },
  { group: 'booking', key: 'slot_duration_minutes', value: '30', type: 'number', label: 'Default slot duration (minutes)' },
  { group: 'booking', key: 'advance_booking_days', value: '30', type: 'number', label: 'How many days in advance customers can book' },
  // Business Hours
  { group: 'hours', key: 'monday', value: '"10:00-20:00"', type: 'string', label: 'Monday hours' },
  { group: 'hours', key: 'tuesday', value: '"10:00-20:00"', type: 'string', label: 'Tuesday hours' },
  { group: 'hours', key: 'wednesday', value: '"10:00-20:00"', type: 'string', label: 'Wednesday hours' },
  { group: 'hours', key: 'thursday', value: '"10:00-20:00"', type: 'string', label: 'Thursday hours' },
  { group: 'hours', key: 'friday', value: '"10:00-20:00"', type: 'string', label: 'Friday hours' },
  { group: 'hours', key: 'saturday', value: '"09:00-21:00"', type: 'string', label: 'Saturday hours' },
  { group: 'hours', key: 'sunday', value: '"10:00-18:00"', type: 'string', label: 'Sunday hours' },
  // Notifications
  { group: 'notifications', key: 'booking_confirm_whatsapp', value: 'true', type: 'boolean', label: 'WhatsApp on booking confirmation' },
  { group: 'notifications', key: 'booking_confirm_sms', value: 'true', type: 'boolean', label: 'SMS on booking confirmation' },
  { group: 'notifications', key: 'owner_notify_on_booking', value: 'true', type: 'boolean', label: 'Notify salon owner on new booking' },
];

export async function seedGlamourWavesOrg(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  console.log('\n--- Onboarding Glamour Waves ---');
  const org = await seedOrganization(prisma, {
    name: 'Glamour Waves',
    slug: 'glamourwaves',
    planSlug: 'pro',
    adminEmail: 'glamourwaves@techzunction.com',
    adminName: 'GlamourWaves Admin',
    adminPassword: superAdminPassword,
    settings: GLAMOURWAVES_SETTINGS,
    plans,
  });

  // Seed service catalog categories
  console.log('  Seeding Glamour Waves service catalog...');

  const gwCategories = [
    { name: 'Hair Services', slug: 'hair', rank: 1 },
    { name: 'Skin Services', slug: 'skin', rank: 2 },
    { name: 'Makeup', slug: 'makeup', rank: 3 },
    { name: "Men's Grooming", slug: 'mens', rank: 4 },
    { name: 'Packages', slug: 'packages', rank: 5 },
  ];

  const createdCats: Record<string, string> = {};
  for (const cat of gwCategories) {
    const created = await prisma.catalogCategory.upsert({
      where: { orgId_slug: { orgId: org.id, slug: cat.slug } },
      update: { name: cat.name, rank: cat.rank },
      create: { orgId: org.id, name: cat.name, slug: cat.slug, rank: cat.rank, isActive: true },
    });
    createdCats[cat.slug] = created.id;
  }
  console.log(`  ✓ ${gwCategories.length} service categories`);

  // Seed catalog items + default variant (prices in INR)
  const gwItems = [
    // Hair Services
    { catSlug: 'hair', name: 'Haircut & Styling', slug: 'haircut-styling', price: 300, desc: 'Professional haircut and styling for all hair types', gender: 'unisex', duration: '30 min' },
    { catSlug: 'hair', name: 'Hair Spa', slug: 'hair-spa', price: 800, desc: 'Relaxing hair spa treatment for nourished, silky hair', gender: 'unisex', duration: '60 min' },
    { catSlug: 'hair', name: 'Hair Coloring', slug: 'hair-coloring', price: 1500, desc: 'Expert hair coloring with premium ammonia-free products', gender: 'unisex', duration: '90 min' },
    { catSlug: 'hair', name: 'Keratin Treatment', slug: 'keratin-treatment', price: 3500, desc: 'Smoothening keratin treatment for frizz-free hair', gender: 'unisex', duration: '120 min' },
    { catSlug: 'hair', name: 'Hair Smoothening', slug: 'hair-smoothening', price: 4000, desc: 'Permanent hair smoothening for straight, shiny locks', gender: 'unisex', duration: '150 min' },
    { catSlug: 'hair', name: 'Rebonding', slug: 'rebonding', price: 4500, desc: 'Chemical rebonding for permanently straight hair', gender: 'unisex', duration: '180 min' },
    { catSlug: 'hair', name: 'Blow Dry & Set', slug: 'blow-dry', price: 400, desc: 'Professional blow dry and styling', gender: 'women', duration: '30 min' },
    { catSlug: 'hair', name: 'Hair Extensions', slug: 'hair-extensions', price: 5000, desc: 'Natural-looking hair extensions for added length and volume', gender: 'women', duration: '120 min' },
    // Skin Services
    { catSlug: 'skin', name: 'Classic Facial', slug: 'classic-facial', price: 500, desc: 'Deep cleansing facial for radiant skin', gender: 'unisex', duration: '45 min' },
    { catSlug: 'skin', name: 'Gold Facial', slug: 'gold-facial', price: 1200, desc: 'Luxurious gold facial for glowing, youthful skin', gender: 'unisex', duration: '60 min' },
    { catSlug: 'skin', name: 'Clean-Up', slug: 'clean-up', price: 400, desc: 'Quick face clean-up for fresh, clear skin', gender: 'unisex', duration: '30 min' },
    { catSlug: 'skin', name: 'Bleach', slug: 'bleach', price: 300, desc: 'Face and arms bleaching for even skin tone', gender: 'women', duration: '20 min' },
    { catSlug: 'skin', name: 'De-Tan Pack', slug: 'de-tan', price: 600, desc: 'Professional de-tan treatment to remove sun damage', gender: 'unisex', duration: '30 min' },
    { catSlug: 'skin', name: 'Full Body Waxing', slug: 'full-body-waxing', price: 1500, desc: 'Complete body waxing for smooth, hair-free skin', gender: 'women', duration: '60 min' },
    { catSlug: 'skin', name: 'Threading (Eyebrows)', slug: 'threading', price: 50, desc: 'Precision eyebrow threading for perfect shape', gender: 'women', duration: '10 min' },
    { catSlug: 'skin', name: 'Manicure', slug: 'manicure', price: 500, desc: 'Relaxing manicure with nail shaping and polish', gender: 'unisex', duration: '30 min' },
    { catSlug: 'skin', name: 'Pedicure', slug: 'pedicure', price: 600, desc: 'Soothing pedicure for soft, pampered feet', gender: 'unisex', duration: '40 min' },
    // Makeup
    { catSlug: 'makeup', name: 'Party Makeup', slug: 'party-makeup', price: 2000, desc: 'Glamorous party-ready makeup for any occasion', gender: 'women', duration: '60 min' },
    { catSlug: 'makeup', name: 'Bridal Makeup', slug: 'bridal-makeup', price: 8000, desc: 'Stunning bridal makeup for your special day', gender: 'women', duration: '120 min' },
    { catSlug: 'makeup', name: 'Engagement Makeup', slug: 'engagement-makeup', price: 5000, desc: 'Elegant engagement ceremony makeup', gender: 'women', duration: '90 min' },
    { catSlug: 'makeup', name: 'HD Makeup', slug: 'hd-makeup', price: 4000, desc: 'High-definition camera-ready makeup', gender: 'women', duration: '90 min' },
    { catSlug: 'makeup', name: 'Airbrush Makeup', slug: 'airbrush-makeup', price: 6000, desc: 'Flawless airbrush technique for a seamless finish', gender: 'women', duration: '90 min' },
    // Men's Grooming
    { catSlug: 'mens', name: "Men's Haircut", slug: 'mens-haircut', price: 200, desc: 'Sharp, stylish haircuts for men', gender: 'men', duration: '20 min' },
    { catSlug: 'mens', name: 'Beard Shaping & Trim', slug: 'beard-shaping', price: 150, desc: 'Precision beard shaping and grooming', gender: 'men', duration: '15 min' },
    { catSlug: 'mens', name: "Men's Hair Color", slug: 'mens-hair-color', price: 800, desc: 'Natural-looking hair coloring for men', gender: 'men', duration: '45 min' },
    { catSlug: 'mens', name: "Men's Face Cleanup", slug: 'mens-cleanup', price: 400, desc: 'Refreshing face cleanup for men', gender: 'men', duration: '30 min' },
    { catSlug: 'mens', name: "Men's Hair Treatment", slug: 'mens-hair-treatment', price: 1000, desc: 'Professional hair treatment for men', gender: 'men', duration: '45 min' },
    { catSlug: 'mens', name: 'Head Massage', slug: 'head-massage', price: 200, desc: 'Relaxing head massage for stress relief', gender: 'men', duration: '20 min' },
    // Packages
    { catSlug: 'packages', name: 'Bridal Package (Complete)', slug: 'bridal-package', price: 15000, desc: 'Complete bridal package: makeup, hair styling, draping, jewellery setting', gender: 'women', duration: '4 hours' },
    { catSlug: 'packages', name: 'Pre-Bridal Package (5 Sessions)', slug: 'pre-bridal-package', price: 8000, desc: '5-session package: facials, clean-ups, waxing, bleach, manicure-pedicure', gender: 'women', duration: 'Multi-session' },
    { catSlug: 'packages', name: 'Party Ready Package', slug: 'party-ready-package', price: 3500, desc: 'Party makeup, hair styling, and manicure combo', gender: 'women', duration: '90 min' },
    { catSlug: 'packages', name: "Groom's Package", slug: 'groom-package', price: 3000, desc: 'Complete grooming package for the groom: facial, haircut, styling', gender: 'men', duration: '90 min' },
    { catSlug: 'packages', name: 'Couple Package', slug: 'couple-package', price: 5000, desc: 'Matching grooming packages for couples', gender: 'unisex', duration: '120 min' },
  ];

  let sortOrder = 0;
  for (const entry of gwItems) {
    const categoryId = createdCats[entry.catSlug];
    if (!categoryId) continue;

    const item = await prisma.catalogItem.upsert({
      where: { orgId_slug: { orgId: org.id, slug: entry.slug } },
      update: { categoryId, sortOrder },
      create: {
        orgId: org.id,
        categoryId,
        slug: entry.slug,
        sortOrder,
        metadata: { gender: entry.gender, duration: entry.duration },
      },
    });

    await prisma.catalogItemVariant.upsert({
      where: { orgId_itemId_variantType: { orgId: org.id, itemId: item.id, variantType: 'default' } },
      update: { name: entry.name, description: entry.desc, price: entry.price },
      create: {
        orgId: org.id,
        itemId: item.id,
        variantType: 'default',
        name: entry.name,
        description: entry.desc,
        price: entry.price,
        isActive: true,
      },
    });

    sortOrder++;
  }
  console.log(`  ✓ ${gwItems.length} service items with variants`);

  // ─── Seed sample end users (needed for reviews) ────────────────────────
  console.log('  Seeding sample end users...');
  const sampleUsers = [
    { name: 'Priya Sharma', phone: '+919800000001' },
    { name: 'Rahul Verma', phone: '+919800000002' },
    { name: 'Anita Patel', phone: '+919800000003' },
    { name: 'Vikash Singh', phone: '+919800000004' },
    { name: 'Neha Jain', phone: '+919800000005' },
    { name: 'Deepak Tiwari', phone: '+919800000006' },
  ];

  const endUserIds: string[] = [];
  for (const u of sampleUsers) {
    const eu = await prisma.endUser.upsert({
      where: { orgId_phone: { orgId: org.id, phone: u.phone } },
      update: { name: u.name },
      create: { orgId: org.id, name: u.name, phone: u.phone, status: 'active' },
    });
    endUserIds.push(eu.id);
  }
  console.log(`  ✓ ${sampleUsers.length} sample end users`);

  // ─── Seed reviews / testimonials ───────────────────────────────────────
  console.log('  Seeding reviews...');
  const reviews = [
    { userIdx: 0, rating: 5, title: 'Stunning bridal makeup', body: 'Amazing experience! The bridal makeup was absolutely stunning. Everyone at the wedding kept complimenting me. Thank you Glamour Waves!', service: 'Bridal Makeup' },
    { userIdx: 1, rating: 5, title: 'Best salon in Gwalior', body: 'Best salon in Gwalior for men. Clean, professional, and the haircut was exactly what I wanted. Highly recommend!', service: 'Haircut & Styling' },
    { userIdx: 2, rating: 4, title: 'Love their hair spa', body: 'Love their hair spa treatment. My hair feels so soft and healthy after every visit. The staff is very courteous and skilled.', service: 'Hair Spa' },
    { userIdx: 3, rating: 5, title: 'Fantastic hair coloring', body: 'Got my hair colored here and the result was fantastic. Very reasonable pricing for the quality of service.', service: 'Hair Coloring' },
    { userIdx: 4, rating: 5, title: 'Gold facial is amazing', body: 'The gold facial was so relaxing and my skin glowed for days. This is now my go-to salon. Wonderful experience every time!', service: 'Gold Facial' },
    { userIdx: 5, rating: 4, title: 'Top-notch grooming', body: 'Great atmosphere and talented stylists. The beard grooming service is top-notch. Will keep coming back!', service: 'Beard Shaping' },
  ];

  // Delete existing seeded reviews for this org, then recreate
  await prisma.review.deleteMany({ where: { orgId: org.id, isVerified: true } });
  for (const r of reviews) {
    await prisma.review.create({
      data: {
        orgId: org.id,
        endUserId: endUserIds[r.userIdx]!,
        rating: r.rating,
        title: r.title,
        body: r.body,
        status: 'approved',
        isVerified: true,
      },
    });
  }
  console.log(`  ✓ ${reviews.length} approved reviews`);

  // ─── Seed gallery content posts ────────────────────────────────────────
  console.log('  Seeding gallery content...');
  const galleryPosts = [
    { slug: 'gallery-hair-1', title: 'Hair Styling Transformation', category: 'hair', imageUrl: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&q=80&auto=format', tags: ['hair', 'gallery'] },
    { slug: 'gallery-hair-2', title: 'Hair Coloring Result', category: 'hair', imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80&auto=format', tags: ['hair', 'gallery'] },
    { slug: 'gallery-hair-3', title: 'Bridal Hair Styling', category: 'hair', imageUrl: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800&q=80&auto=format', tags: ['hair', 'gallery'] },
    { slug: 'gallery-hair-4', title: 'Keratin Treatment Result', category: 'hair', imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80&auto=format', tags: ['hair', 'gallery'] },
    { slug: 'gallery-makeup-1', title: 'Bridal Makeup', category: 'makeup', imageUrl: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=800&q=80&auto=format', tags: ['makeup', 'gallery'] },
    { slug: 'gallery-makeup-2', title: 'Party Makeup Look', category: 'makeup', imageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&q=80&auto=format', tags: ['makeup', 'gallery'] },
    { slug: 'gallery-makeup-3', title: 'Engagement Makeup', category: 'makeup', imageUrl: 'https://images.unsplash.com/photo-1457972729786-0411a3b2b626?w=800&q=80&auto=format', tags: ['makeup', 'gallery'] },
    { slug: 'gallery-makeup-4', title: 'HD Makeup Result', category: 'makeup', imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80&auto=format', tags: ['makeup', 'gallery'] },
    { slug: 'gallery-skin-1', title: 'Facial Treatment', category: 'skin', imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80&auto=format', tags: ['skin', 'gallery'] },
    { slug: 'gallery-skin-2', title: 'Skin Glow After Treatment', category: 'skin', imageUrl: 'https://images.unsplash.com/photo-1552693673-1bf958298935?w=800&q=80&auto=format', tags: ['skin', 'gallery'] },
    { slug: 'gallery-salon-1', title: 'Salon Interior', category: 'salon', imageUrl: 'https://images.unsplash.com/photo-1633681122611-e632bd3f0bec?w=800&q=80&auto=format', tags: ['salon', 'gallery'] },
    { slug: 'gallery-salon-2', title: 'Styling Stations', category: 'salon', imageUrl: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80&auto=format', tags: ['salon', 'gallery'] },
  ];

  for (const post of galleryPosts) {
    await prisma.contentPost.upsert({
      where: { orgId_slug: { orgId: org.id, slug: post.slug } },
      update: { title: post.title, imageUrl: post.imageUrl, category: post.category, status: 'published' },
      create: {
        orgId: org.id,
        slug: post.slug,
        title: post.title,
        body: '',
        imageUrl: post.imageUrl,
        category: post.category,
        tags: post.tags,
        status: 'published',
        publishedAt: new Date(),
      },
    });
  }
  console.log(`  ✓ ${galleryPosts.length} gallery content posts`);

  // Print storefront key
  const gwOrgFull = await prisma.organization.findUnique({ where: { id: org.id }, select: { storefrontKey: true, slug: true } });
  console.log('\n  ┌──────────────────────────────────────────────────────────┐');
  console.log(`  │  Glamour Waves org slug       : ${gwOrgFull!.slug.padEnd(25)}│`);
  console.log(`  │  Glamour Waves storefront key : ${gwOrgFull!.storefrontKey.padEnd(25)}│`);
  console.log('  │  → Copy the key into Velvet/.env.local                   │');
  console.log('  │    NEXT_PUBLIC_TZ_ORG_KEY=<key above>                    │');
  console.log('  └──────────────────────────────────────────────────────────┘\n');

  return org;
}
