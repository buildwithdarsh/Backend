import { PrismaClient } from '@prisma/client';
import { seedOrganization, type OrgSettingEntry } from '../Shared';

const SIDEKAAM_SETTINGS: OrgSettingEntry[] = [
  // Branding
  { group: 'branding', key: 'name', value: '"SideKaam"', type: 'string', label: 'Business name' },
  { group: 'branding', key: 'tagline', value: '"Kaam nahi, Side Kaam."', type: 'string', label: 'Tagline' },
  { group: 'branding', key: 'currency', value: '"INR"', type: 'string', label: 'Currency' },
  { group: 'branding', key: 'currency_symbol', value: '"₹"', type: 'string', label: 'Currency symbol' },
  { group: 'branding', key: 'timezone', value: '"Asia/Kolkata"', type: 'string', label: 'Timezone' },
  { group: 'branding', key: 'logo_url', value: '""', type: 'string', label: 'Logo URL' },
  { group: 'branding', key: 'primary_color', value: '"#10B981"', type: 'string', label: 'Primary brand color (emerald)' },

  // Auth
  { group: 'auth', key: 'primary_login_id', value: '"phone"', type: 'string', label: 'Primary login identifier' },
  { group: 'auth', key: 'otp_length', value: '4', type: 'number', label: 'OTP length' },
  { group: 'auth', key: 'google_oauth_enabled', value: 'true', type: 'boolean', label: 'Google OAuth enabled' },
  { group: 'auth', key: 'phone_otp_enabled', value: 'true', type: 'boolean', label: 'Phone OTP enabled' },
  { group: 'auth', key: 'email_password_enabled', value: 'true', type: 'boolean', label: 'Email+password enabled' },

  // SideKaam specific
  { group: 'sidekaam', key: 'enabled', value: 'true', type: 'boolean', label: 'SideKaam module enabled' },
  { group: 'sidekaam', key: 'categories', value: '["food","fashion","creative","tech","education","finance","fitness","local"]', type: 'json', label: 'Available categories' },
  { group: 'sidekaam', key: 'max_categories_per_user', value: '3', type: 'number', label: 'Max categories per user' },
  { group: 'sidekaam', key: 'max_subcategories_per_user', value: '5', type: 'number', label: 'Max sub-categories per user' },
  { group: 'sidekaam', key: 'match_batch_size', value: '20', type: 'number', label: 'Matches per batch' },

  // Subscription plans (generic)
  { group: 'subscription', key: 'subscription_monthly_price', value: '499', type: 'number', label: 'Monthly subscription price (INR)' },
  { group: 'subscription', key: 'subscription_halfyearly_price', value: '2499', type: 'number', label: '6-month subscription price (INR)' },
  { group: 'subscription', key: 'subscription_yearly_price', value: '4499', type: 'number', label: '12-month subscription price (INR)' },
  { group: 'subscription', key: 'gst_rate', value: '18', type: 'number', label: 'GST rate (%)' },

  // Payment
  { group: 'payment', key: 'razorpay_enabled', value: 'true', type: 'boolean', label: 'Razorpay enabled' },
  { group: 'payment', key: 'razorpay_key_id', value: '"rzp_test_placeholder"', type: 'string', label: 'Razorpay publishable key (safe for frontend)' },
  { group: 'payment', key: 'upi_enabled', value: 'true', type: 'boolean', label: 'UPI enabled' },
  { group: 'payment', key: 'card_enabled', value: 'true', type: 'boolean', label: 'Card payment enabled' },
  { group: 'payment', key: 'netbanking_enabled', value: 'true', type: 'boolean', label: 'Net banking enabled' },

  // Notifications
  { group: 'notifications', key: 'whatsapp_enabled', value: 'true', type: 'boolean', label: 'WhatsApp notifications' },
  { group: 'notifications', key: 'push_enabled', value: 'true', type: 'boolean', label: 'Push notifications' },
  { group: 'notifications', key: 'email_enabled', value: 'true', type: 'boolean', label: 'Email notifications' },

  // Features
  { group: 'features', key: 'referral_enabled', value: 'true', type: 'boolean', label: 'Referral program' },
  { group: 'features', key: 'referral_days_free', value: '7', type: 'number', label: 'Free days on referral' },
  { group: 'features', key: 'reviews_enabled', value: 'true', type: 'boolean', label: 'Reviews enabled' },
  { group: 'features', key: 'ai_matching_enabled', value: 'true', type: 'boolean', label: 'AI matching enabled' },
  { group: 'features', key: 'video_pitch_enabled', value: 'false', type: 'boolean', label: 'Video pitch (Phase 3)' },

  // Cities (launched)
  { group: 'sidekaam', key: 'launched_cities', value: '["Delhi","Bangalore","Mumbai","Hyderabad","Kolkata","Jaipur","Pune","Chennai","Ahmedabad","Gwalior","Varanasi","Shimla","Agra","Jhansi","Lucknow","Indore","Chandigarh","Bhopal","Noida","Gurgaon"]', type: 'json', label: 'Launched cities' },
];

export async function seedSideKaamOrg(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  console.log('\n--- Onboarding SideKaam ---');
  const org = await seedOrganization(prisma, {
    name: 'SideKaam',
    slug: 'sidekaam',
    planSlug: 'free',
    adminEmail: 'sidekaam@techzunction.com',
    adminName: 'SideKaam Admin',
    adminPassword: superAdminPassword,
    storefrontKey: 'tz_6367bfa7fcdebede7db7b492cf5ae544',
    settings: SIDEKAAM_SETTINGS,
    plans,
  });

  console.log(`  ✅ SideKaam org created: slug=sidekaam, id=${org.id}`);
  return org;
}
