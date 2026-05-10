import { PrismaClient } from '@prisma/client';
import { seedOrganization, OrgSettingEntry } from '../Shared';

const BURGEREMPIRE_SETTINGS: OrgSettingEntry[] = [
  // Variant types (replaces classic/healthy mode)
  { group: 'catalog', key: 'variant_types', value: '["classic","healthy"]', type: 'json', label: 'Available item variant types' },
  { group: 'catalog', key: 'default_variant_type', value: '"classic"', type: 'string', label: 'Default variant type' },
  // Loyalty
  { group: 'loyalty', key: 'enabled', value: 'true', type: 'boolean', label: 'Loyalty program enabled' },
  { group: 'loyalty', key: 'points_per_amount', value: '1', type: 'number', label: 'Points earned per currency unit spent' },
  { group: 'loyalty', key: 'points_per_amount_threshold', value: '100', type: 'number', label: 'Spend amount to earn points' },
  { group: 'loyalty', key: 'redemption_min_points', value: '50', type: 'number', label: 'Min points to redeem' },
  { group: 'loyalty', key: 'redemption_max_percent', value: '50', type: 'number', label: 'Max % of subtotal redeemable' },
  { group: 'loyalty', key: 'point_value', value: '1', type: 'number', label: 'Value of 1 point in currency subunit' },
  { group: 'loyalty', key: 'first_order_bonus', value: '50', type: 'number', label: 'Bonus points on first order' },
  { group: 'loyalty', key: 'healthy_boost_multiplier', value: '1.5', type: 'number', label: 'Point multiplier for healthy variant' },
  { group: 'loyalty', key: 'tier_silver_threshold', value: '500', type: 'number', label: 'Points to reach Silver tier' },
  { group: 'loyalty', key: 'tier_gold_threshold', value: '1500', type: 'number', label: 'Points to reach Gold tier' },
  { group: 'loyalty', key: 'tier_silver_multiplier', value: '1.25', type: 'number', label: 'Silver tier point multiplier' },
  { group: 'loyalty', key: 'tier_gold_multiplier', value: '1.5', type: 'number', label: 'Gold tier point multiplier' },
  // Delivery
  { group: 'delivery', key: 'enabled', value: 'true', type: 'boolean', label: 'Delivery enabled' },
  { group: 'delivery', key: 'fee', value: '40', type: 'number', label: 'Delivery fee (currency units)' },
  { group: 'delivery', key: 'free_above', value: '499', type: 'number', label: 'Free delivery above this amount' },
  { group: 'delivery', key: 'prep_time_minutes', value: '20', type: 'number', label: 'Estimated prep time (minutes)' },
  // Checkout
  { group: 'checkout', key: 'cod_enabled', value: 'true', type: 'boolean', label: 'Cash on delivery enabled' },
  { group: 'checkout', key: 'online_pay_enabled', value: 'true', type: 'boolean', label: 'Online payment enabled' },
  { group: 'checkout', key: 'packing_charges', value: '15', type: 'number', label: 'Packing charges' },
  { group: 'checkout', key: 'min_order_amount', value: '99', type: 'number', label: 'Minimum order amount' },
  // Features
  { group: 'features', key: 'coupons_enabled', value: 'true', type: 'boolean', label: 'Coupons enabled' },
  { group: 'features', key: 'promotions_enabled', value: 'true', type: 'boolean', label: 'Promotions enabled' },
  { group: 'features', key: 'referral_enabled', value: 'true', type: 'boolean', label: 'Referral system enabled' },
  { group: 'features', key: 'referral_points', value: '50', type: 'number', label: 'Points awarded for referral' },
  { group: 'features', key: 'whatsapp_enabled', value: 'true', type: 'boolean', label: 'WhatsApp ordering enabled' },
  { group: 'features', key: 'whatsapp_phone', value: '', type: 'string', label: 'WhatsApp business phone' },
  { group: 'features', key: 'reviews_enabled', value: 'true', type: 'boolean', label: 'Reviews enabled' },
  { group: 'features', key: 'gift_cards_enabled', value: 'true', type: 'boolean', label: 'Gift cards enabled' },
  { group: 'features', key: 'student_pass_enabled', value: 'false', type: 'boolean', label: 'Student pass enabled' },
  { group: 'features', key: 'reservations_enabled', value: 'true', type: 'boolean', label: 'Reservations enabled' },
  { group: 'features', key: 'meal_plans_enabled', value: 'false', type: 'boolean', label: 'Meal plans enabled' },
  // Branding
  { group: 'branding', key: 'name', value: '"Burger Empire"', type: 'string', label: 'Business display name' },
  { group: 'branding', key: 'tagline', value: '"Burgers that love you back"', type: 'string', label: 'Tagline' },
  { group: 'branding', key: 'currency', value: '"INR"', type: 'string', label: 'Currency code' },
  { group: 'branding', key: 'currency_symbol', value: '"₹"', type: 'string', label: 'Currency symbol' },
  { group: 'branding', key: 'timezone', value: '"Asia/Kolkata"', type: 'string', label: 'Timezone' },
  { group: 'branding', key: 'logo_url', value: '""', type: 'string', label: 'Logo URL' },
  { group: 'branding', key: 'primary_color', value: '"#F5A623"', type: 'string', label: 'Primary brand color' },
  { group: 'branding', key: 'secondary_color', value: '"#4A7C59"', type: 'string', label: 'Secondary brand color' },
  // Contact
  { group: 'contact', key: 'phone', value: '""', type: 'string', label: 'Business phone' },
  { group: 'contact', key: 'email', value: '""', type: 'string', label: 'Business email' },
  { group: 'contact', key: 'address', value: '""', type: 'string', label: 'Business address' },
  { group: 'contact', key: 'instagram', value: '""', type: 'string', label: 'Instagram URL' },
  { group: 'contact', key: 'facebook', value: '""', type: 'string', label: 'Facebook URL' },
  { group: 'contact', key: 'twitter', value: '""', type: 'string', label: 'Twitter/X URL' },
  { group: 'contact', key: 'google_maps', value: '""', type: 'string', label: 'Google Maps URL' },
  // Loyalty naming
  { group: 'loyalty', key: 'point_name', value: '"coins"', type: 'string', label: 'What loyalty points are called (coins, points, stars, etc.)' },
  { group: 'loyalty', key: 'point_name_plural', value: '"coins"', type: 'string', label: 'Plural form of point name' },
  // Tax
  { group: 'tax', key: 'rate', value: '5', type: 'number', label: 'Default tax rate (%)' },
  { group: 'tax', key: 'label', value: '"GST"', type: 'string', label: 'Tax label' },
  { group: 'tax', key: 'inclusive', value: 'true', type: 'boolean', label: 'Prices include tax' },
  // Orders
  { group: 'orders', key: 'prefix', value: '"BB"', type: 'string', label: 'Order number prefix' },
  { group: 'orders', key: 'auto_confirm', value: 'false', type: 'boolean', label: 'Auto-confirm orders (skip pending)' },
  { group: 'orders', key: 'max_order_amount', value: '10000', type: 'number', label: 'Maximum order amount' },
  // Notifications
  { group: 'notifications', key: 'order_confirm_sms', value: 'true', type: 'boolean', label: 'Send SMS on order confirmation' },
  { group: 'notifications', key: 'order_confirm_email', value: 'true', type: 'boolean', label: 'Send email on order confirmation' },
  { group: 'notifications', key: 'order_confirm_whatsapp', value: 'false', type: 'boolean', label: 'Send WhatsApp on order confirmation' },
  // POS
  { group: 'pos', key: 'provider', value: '"petpooja"', type: 'string', label: 'POS provider' },
  { group: 'pos', key: 'auto_sync', value: 'true', type: 'boolean', label: 'Auto-sync menu from POS' },
  // OTP
  { group: 'otp', key: 'dummy_mode', value: 'false', type: 'boolean', label: 'Dummy OTP mode (dev only)' },
  { group: 'otp', key: 'dummy_code', value: '"123456"', type: 'string', label: 'Dummy OTP code (dev only)' },
];

export async function seedBurgerEmpireOrg(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  console.log('\n--- Onboarding BurgerEmpire ---');
  const org = await seedOrganization(prisma, {
    name: 'Burger Empire',
    slug: 'burgerempire',
    planSlug: 'pro',
    adminEmail: 'burgerempire@techzunction.com',
    adminName: 'BurgerEmpire Admin',
    adminPassword: superAdminPassword,
    storefrontKey: 'tz_65b2fda395f1ab43d9e2378922f37b05',
    settings: BURGEREMPIRE_SETTINGS,
    plans,
  });

  // Seed BurgerEmpire sample catalog categories
  console.log('  Seeding BurgerEmpire sample catalog...');
  const bbCategories = [
    { name: 'Burgers', slug: 'burgers', rank: 1 },
    { name: 'Sides', slug: 'sides', rank: 2 },
    { name: 'Beverages', slug: 'beverages', rank: 3 },
    { name: 'Desserts', slug: 'desserts', rank: 4 },
    { name: 'Combos', slug: 'combos', rank: 5 },
  ];

  for (const cat of bbCategories) {
    await prisma.catalogCategory.upsert({
      where: { orgId_slug: { orgId: org.id, slug: cat.slug } },
      update: { name: cat.name, rank: cat.rank },
      create: { orgId: org.id, name: cat.name, slug: cat.slug, rank: cat.rank, isActive: true },
    });
  }
  console.log(`  ✓ ${bbCategories.length} catalog categories`);

  // Seed BurgerEmpire sample store locations
  const bbLocations = [
    { name: 'Sector 62', slug: 'sector-62', city: 'Noida', pincode: '201301', isPrimary: true },
    { name: 'Sector 18', slug: 'sector-18', city: 'Noida', pincode: '201301', isPrimary: false },
  ];

  for (const loc of bbLocations) {
    await prisma.storeLocation.upsert({
      where: { orgId_slug: { orgId: org.id, slug: loc.slug } },
      update: { name: loc.name, city: loc.city, pincode: loc.pincode, isPrimary: loc.isPrimary },
      create: { orgId: org.id, name: loc.name, slug: loc.slug, city: loc.city, pincode: loc.pincode, isPrimary: loc.isPrimary, isActive: true },
    });
  }
  console.log(`  ✓ ${bbLocations.length} store locations`);

  return org;
}
