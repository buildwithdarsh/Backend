import { PrismaClient } from '@prisma/client';
import { seedOrganization, OrgSettingEntry } from '../Shared';

const VICITY_SETTINGS: OrgSettingEntry[] = [
  // Property
  { group: 'property', key: 'check_in_time', value: '"14:00"', type: 'string', label: 'Check-in time' },
  { group: 'property', key: 'check_out_time', value: '"11:00"', type: 'string', label: 'Check-out time' },
  { group: 'property', key: 'tax_rate', value: '18', type: 'number', label: 'Tax rate (%)' },
  { group: 'property', key: 'tax_label', value: '"GST"', type: 'string', label: 'Tax label' },
  { group: 'property', key: 'booking_hold_minutes', value: '10', type: 'number', label: 'Booking hold duration (minutes)' },
  { group: 'property', key: 'advance_payment_percent', value: '50', type: 'number', label: 'Advance payment percentage' },
  { group: 'property', key: 'max_guests_included', value: '6', type: 'number', label: 'Max guests included in base price' },
  { group: 'property', key: 'extra_guest_charge', value: '150000', type: 'number', label: 'Extra guest charge per night (paise)' },
  { group: 'property', key: 'min_nights', value: '1', type: 'number', label: 'Minimum nights per booking' },
  { group: 'property', key: 'max_nights', value: '21', type: 'number', label: 'Maximum nights per booking' },
  // Features
  { group: 'features', key: 'coupons_enabled', value: 'true', type: 'boolean', label: 'Coupons enabled' },
  { group: 'features', key: 'reviews_enabled', value: 'true', type: 'boolean', label: 'Reviews enabled' },
  // Branding
  { group: 'branding', key: 'name', value: '"The Courtyard Villa"', type: 'string', label: 'Property display name' },
  { group: 'branding', key: 'tagline', value: '"Your Private Retreat"', type: 'string', label: 'Tagline' },
  { group: 'branding', key: 'currency', value: '"INR"', type: 'string', label: 'Currency code' },
  { group: 'branding', key: 'currency_symbol', value: '"₹"', type: 'string', label: 'Currency symbol' },
  { group: 'branding', key: 'timezone', value: '"Asia/Kolkata"', type: 'string', label: 'Timezone' },
  { group: 'branding', key: 'logo_url', value: '""', type: 'string', label: 'Logo URL' },
  { group: 'branding', key: 'primary_color', value: '"#C9A96E"', type: 'string', label: 'Primary brand color (gold)' },
  { group: 'branding', key: 'secondary_color', value: '"#1A1A1A"', type: 'string', label: 'Secondary brand color (charcoal)' },
  // Contact
  { group: 'contact', key: 'phone', value: '""', type: 'string', label: 'Property phone' },
  { group: 'contact', key: 'email', value: '""', type: 'string', label: 'Property email' },
  { group: 'contact', key: 'address', value: '""', type: 'string', label: 'Property address' },
  { group: 'contact', key: 'instagram', value: '""', type: 'string', label: 'Instagram URL' },
  { group: 'contact', key: 'facebook', value: '""', type: 'string', label: 'Facebook URL' },
  { group: 'contact', key: 'google_maps', value: '""', type: 'string', label: 'Google Maps URL' },
  // Checkout
  { group: 'checkout', key: 'online_pay_enabled', value: 'true', type: 'boolean', label: 'Online payment enabled' },
  { group: 'checkout', key: 'partial_pay_enabled', value: 'true', type: 'boolean', label: 'Partial payment (advance) enabled' },
  // Booking
  { group: 'booking', key: 'prefix', value: '"TCV"', type: 'string', label: 'Booking reference prefix' },
  { group: 'booking', key: 'auto_confirm', value: 'false', type: 'boolean', label: 'Auto-confirm bookings' },
  // Notifications
  { group: 'notifications', key: 'booking_confirm_sms', value: 'true', type: 'boolean', label: 'SMS on booking confirmation' },
  { group: 'notifications', key: 'booking_confirm_email', value: 'true', type: 'boolean', label: 'Email on booking confirmation' },
  { group: 'notifications', key: 'checkin_reminder', value: 'true', type: 'boolean', label: 'Send check-in reminder' },
  { group: 'notifications', key: 'checkin_reminder_hours', value: '24', type: 'number', label: 'Hours before check-in to send reminder' },
];

export async function seedViCityOrg(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  console.log('\n--- Onboarding ViCity ---');
  const org = await seedOrganization(prisma, {
    name: 'The Courtyard Villa',
    slug: 'vicity',
    planSlug: 'pro',
    adminEmail: 'vicity@techzunction.com',
    adminName: 'ViCity Admin',
    adminPassword: superAdminPassword,
    storefrontKey: 'tz_8dd644b3f0e11433a528f79464a139c0',
    settings: VICITY_SETTINGS,
    plans,
  });

  const orgFull = await prisma.organization.findUnique({ where: { id: org.id }, select: { storefrontKey: true } });
  console.log(`  ℹ  ViCity storefront key: ${orgFull!.storefrontKey}`);

  // Seed ViCity sample property type
  console.log('  Seeding ViCity sample property...');
  const villaType = await prisma.propertyType.upsert({
    where: { orgId_slug: { orgId: org.id, slug: 'courtyard-villa' } },
    update: { name: 'Courtyard Villa', basePrice: 1500000, maxGuests: 6, bedType: 'King', unitSize: '2500 sqft' },
    create: {
      orgId: org.id,
      name: 'Courtyard Villa',
      slug: 'courtyard-villa',
      description: 'A luxurious private villa with courtyard, pool, and garden.',
      basePrice: 1500000,
      maxGuests: 6,
      bedType: 'King',
      unitSize: '2500 sqft',
      images: [],
      status: 'active',
    },
  });
  console.log(`  ✓ Property type "${villaType.name}" (${villaType.id})`);

  // Seed a single unit
  await prisma.propertyUnit.upsert({
    where: { orgId_unitNumber: { orgId: org.id, unitNumber: 'VILLA-01' } },
    update: {},
    create: { orgId: org.id, propertyTypeId: villaType.id, unitNumber: 'VILLA-01', floor: 0, status: 'available', housekeepingStatus: 'clean' },
  });
  console.log('  ✓ Property unit VILLA-01');

  // Seed amenities
  const amenities = ['Wi-Fi', 'Pool', 'Parking', 'AC', 'Kitchen', 'Garden', 'BBQ', 'TV'];
  for (const amenityName of amenities) {
    const amenity = await prisma.propertyAmenity.upsert({
      where: { orgId_name: { orgId: org.id, name: amenityName } },
      update: {},
      create: { orgId: org.id, name: amenityName, isActive: true },
    });
    await prisma.propertyTypeAmenity.upsert({
      where: { orgId_propertyTypeId_amenityId: { orgId: org.id, propertyTypeId: villaType.id, amenityId: amenity.id } },
      update: {},
      create: { orgId: org.id, propertyTypeId: villaType.id, amenityId: amenity.id },
    });
  }
  console.log(`  ✓ ${amenities.length} amenities linked to villa`);

  // Weekend pricing rule
  await prisma.propertyPricingRule.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      orgId: org.id,
      propertyTypeId: villaType.id,
      name: 'Weekend Rate',
      type: 'weekend',
      multiplier: 1.20,
      daysOfWeek: [5, 6],
      priority: 10,
      isActive: true,
    },
  });
  console.log('  ✓ Weekend pricing rule (1.2x)');

  return org;
}
