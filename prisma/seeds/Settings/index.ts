/**
 * Seeds ALL OrgSettings with sensible defaults for every org.
 */
import { PrismaClient } from '@prisma/client';

interface Setting {
  group: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  label: string;
}

// ─── Default settings for ALL orgs ──────────────────────────────────────────
const DEFAULTS: Setting[] = [
  // ─── auth ───────────────────────────────────────────────────────────────
  { group: 'auth', key: 'primary_login_id', value: 'phone', type: 'string', label: 'Primary login identifier (phone or email)' },
  { group: 'auth', key: 'require_phone_verification', value: 'true', type: 'boolean', label: 'Require phone OTP before account creation' },
  { group: 'auth', key: 'require_email_verification', value: 'false', type: 'boolean', label: 'Require email verification' },
  { group: 'auth', key: 'otp_length', value: '6', type: 'number', label: 'OTP code length (4-8 digits)' },
  { group: 'auth', key: 'otp_expiry_minutes', value: '5', type: 'number', label: 'OTP expiry in minutes' },
  { group: 'auth', key: 'allow_social_login', value: 'false', type: 'boolean', label: 'Allow Google/Facebook login' },
  { group: 'auth', key: 'google_login_enabled', value: 'false', type: 'boolean', label: 'Enable Google OAuth for end users' },
  { group: 'auth', key: 'facebook_login_enabled', value: 'false', type: 'boolean', label: 'Enable Facebook OAuth' },
  { group: 'auth', key: 'apple_login_enabled', value: 'false', type: 'boolean', label: 'Enable Apple Sign-In' },
  { group: 'auth', key: 'max_sessions', value: '5', type: 'number', label: 'Max concurrent sessions per user' },
  { group: 'auth', key: 'session_timeout_hours', value: '168', type: 'number', label: 'Session expiry (hours, default 7 days)' },
  { group: 'auth', key: 'password_min_length', value: '6', type: 'number', label: 'Minimum password length' },
  { group: 'auth', key: 'force_phone_for_orders', value: 'false', type: 'boolean', label: 'Require verified phone before ordering' },
  { group: 'auth', key: 'demo_enabled', value: 'false', type: 'boolean', label: 'Enable demo login for storefront' },
  { group: 'auth', key: 'demo_email', value: '', type: 'string', label: 'Email of the demo end-user account' },

  // ─── branding ───────────────────────────────────────────────────────────
  { group: 'branding', key: 'name', value: '', type: 'string', label: 'Business name' },
  { group: 'branding', key: 'tagline', value: '', type: 'string', label: 'Tagline / slogan' },
  { group: 'branding', key: 'logo_url', value: '', type: 'string', label: 'Logo URL (Cloudinary path or full URL)' },
  { group: 'branding', key: 'favicon_url', value: '', type: 'string', label: 'Favicon URL' },
  { group: 'branding', key: 'og_image_url', value: '', type: 'string', label: 'Default OpenGraph image' },
  { group: 'branding', key: 'primary_color', value: '#3B82F6', type: 'string', label: 'Primary brand color (hex)' },
  { group: 'branding', key: 'secondary_color', value: '#1E293B', type: 'string', label: 'Secondary color (hex)' },
  { group: 'branding', key: 'accent_color', value: '#F59E0B', type: 'string', label: 'Accent / highlight color' },
  { group: 'branding', key: 'error_color', value: '#EF4444', type: 'string', label: 'Error state color' },
  { group: 'branding', key: 'success_color', value: '#10B981', type: 'string', label: 'Success state color' },
  { group: 'branding', key: 'font_family', value: 'Inter', type: 'string', label: 'Primary font family' },
  { group: 'branding', key: 'currency', value: 'INR', type: 'string', label: 'Currency code (ISO 4217)' },
  { group: 'branding', key: 'currency_symbol', value: '₹', type: 'string', label: 'Currency symbol' },
  { group: 'branding', key: 'timezone', value: 'Asia/Kolkata', type: 'string', label: 'Timezone (IANA)' },
  { group: 'branding', key: 'country_code', value: '+91', type: 'string', label: 'Default phone country code' },
  { group: 'branding', key: 'date_format', value: 'DD/MM/YYYY', type: 'string', label: 'Date display format' },
  { group: 'branding', key: 'dark_mode_enabled', value: 'false', type: 'boolean', label: 'Enable dark mode toggle' },
  { group: 'branding', key: 'footer_text', value: '', type: 'string', label: 'Custom footer text' },
  { group: 'branding', key: 'custom_css', value: '', type: 'string', label: 'Custom CSS injection (advanced)' },
  { group: 'branding', key: 'powered_by_visible', value: 'true', type: 'boolean', label: 'Show "Powered by TechZunction"' },

  // ─── catalog ────────────────────────────────────────────────────────────
  { group: 'catalog', key: 'variant_types', value: '["default"]', type: 'json', label: 'Available variant types' },
  { group: 'catalog', key: 'default_variant_type', value: 'default', type: 'string', label: 'Default variant type' },
  { group: 'catalog', key: 'show_calories', value: 'true', type: 'boolean', label: 'Show calorie count on items' },
  { group: 'catalog', key: 'show_nutrition', value: 'true', type: 'boolean', label: 'Show full nutrition data' },
  { group: 'catalog', key: 'show_allergens', value: 'true', type: 'boolean', label: 'Show allergen warnings' },
  { group: 'catalog', key: 'show_diet_badges', value: 'true', type: 'boolean', label: 'Show veg/nonveg/egg badges' },
  { group: 'catalog', key: 'diet_filter_default', value: 'all', type: 'string', label: 'Default diet filter' },
  { group: 'catalog', key: 'show_ratings', value: 'true', type: 'boolean', label: 'Show item ratings' },
  { group: 'catalog', key: 'show_out_of_stock', value: 'true', type: 'boolean', label: 'Show out-of-stock items (greyed)' },
  { group: 'catalog', key: 'items_per_page', value: '20', type: 'number', label: 'Items per page in menu' },
  { group: 'catalog', key: 'image_aspect_ratio', value: '1:1', type: 'string', label: 'Item image aspect ratio' },
  { group: 'catalog', key: 'search_enabled', value: 'true', type: 'boolean', label: 'Enable search in menu' },

  // ─── checkout ───────────────────────────────────────────────────────────
  { group: 'checkout', key: 'cod_enabled', value: 'true', type: 'boolean', label: 'Allow Cash on Delivery' },
  { group: 'checkout', key: 'online_pay_enabled', value: 'true', type: 'boolean', label: 'Allow online payment' },
  { group: 'checkout', key: 'min_order_amount', value: '0', type: 'number', label: 'Minimum order amount' },
  { group: 'checkout', key: 'packing_charges', value: '0', type: 'number', label: 'Packing charges per order' },
  { group: 'checkout', key: 'tip_enabled', value: 'false', type: 'boolean', label: 'Show tip option at checkout' },
  { group: 'checkout', key: 'tip_presets', value: '[10,15,20]', type: 'json', label: 'Tip percentage presets' },
  { group: 'checkout', key: 'tip_custom_enabled', value: 'true', type: 'boolean', label: 'Allow custom tip amount' },
  { group: 'checkout', key: 'instructions_enabled', value: 'true', type: 'boolean', label: 'Allow special instructions' },
  { group: 'checkout', key: 'scheduled_orders', value: 'false', type: 'boolean', label: 'Allow scheduled / future orders' },
  { group: 'checkout', key: 'schedule_max_days', value: '7', type: 'number', label: 'Max days ahead for scheduling' },
  { group: 'checkout', key: 'min_prep_time_minutes', value: '15', type: 'number', label: 'Minimum prep time shown' },
  { group: 'checkout', key: 'express_checkout', value: 'false', type: 'boolean', label: 'One-tap reorder for repeat customers' },
  { group: 'checkout', key: 'promo_code_field', value: 'true', type: 'boolean', label: 'Show promo code input' },
  { group: 'checkout', key: 'gift_wrap_enabled', value: 'false', type: 'boolean', label: 'Offer gift wrapping' },
  { group: 'checkout', key: 'gift_wrap_price', value: '0', type: 'number', label: 'Gift wrap charge' },
  { group: 'checkout', key: 'order_notes_enabled', value: 'true', type: 'boolean', label: 'Allow order-level notes' },

  // ─── contact ────────────────────────────────────────────────────────────
  { group: 'contact', key: 'phone', value: '', type: 'string', label: 'Business phone number' },
  { group: 'contact', key: 'email', value: '', type: 'string', label: 'Business email' },
  { group: 'contact', key: 'address', value: '', type: 'string', label: 'Business address' },
  { group: 'contact', key: 'google_maps', value: '', type: 'string', label: 'Google Maps embed URL' },
  { group: 'contact', key: 'instagram', value: '', type: 'string', label: 'Instagram handle' },
  { group: 'contact', key: 'facebook', value: '', type: 'string', label: 'Facebook page URL' },
  { group: 'contact', key: 'twitter', value: '', type: 'string', label: 'Twitter/X handle' },

  // ─── delivery ───────────────────────────────────────────────────────────
  { group: 'delivery', key: 'enabled', value: 'true', type: 'boolean', label: 'Enable delivery orders' },
  { group: 'delivery', key: 'fee', value: '0', type: 'number', label: 'Default delivery fee' },
  { group: 'delivery', key: 'free_above', value: '0', type: 'number', label: 'Free delivery above this amount (0=never)' },
  { group: 'delivery', key: 'prep_time_minutes', value: '20', type: 'number', label: 'Default preparation time (minutes)' },
  { group: 'delivery', key: 'pickup_enabled', value: 'true', type: 'boolean', label: 'Allow pickup orders' },
  { group: 'delivery', key: 'dine_in_enabled', value: 'true', type: 'boolean', label: 'Allow dine-in orders' },
  { group: 'delivery', key: 'self_pickup_discount', value: '0', type: 'number', label: 'Discount % for pickup orders' },
  { group: 'delivery', key: 'live_tracking_enabled', value: 'false', type: 'boolean', label: 'Show live delivery tracking' },
  { group: 'delivery', key: 'eta_buffer_minutes', value: '5', type: 'number', label: 'Extra minutes added to ETA' },
  { group: 'delivery', key: 'max_distance_km', value: '15', type: 'number', label: 'Maximum delivery radius (km)' },
  { group: 'delivery', key: 'surge_multiplier', value: '1.0', type: 'number', label: 'Delivery fee surge multiplier' },
  { group: 'delivery', key: 'contactless_default', value: 'false', type: 'boolean', label: 'Default to contactless delivery' },
  { group: 'delivery', key: 'delivery_partner', value: '', type: 'string', label: 'Third-party delivery partner' },
  { group: 'delivery', key: 'slot_based_delivery', value: 'false', type: 'boolean', label: 'Enable time-slot based delivery' },

  // ─── features ───────────────────────────────────────────────────────────
  { group: 'features', key: 'coupons_enabled', value: 'true', type: 'boolean', label: 'Enable coupons' },
  { group: 'features', key: 'promotions_enabled', value: 'true', type: 'boolean', label: 'Enable promotions' },
  { group: 'features', key: 'referral_enabled', value: 'false', type: 'boolean', label: 'Enable referral program' },
  { group: 'features', key: 'referral_points', value: '50', type: 'number', label: 'Referral reward points' },
  { group: 'features', key: 'reviews_enabled', value: 'true', type: 'boolean', label: 'Enable reviews' },
  { group: 'features', key: 'gift_cards_enabled', value: 'false', type: 'boolean', label: 'Enable gift cards' },
  { group: 'features', key: 'reservations_enabled', value: 'false', type: 'boolean', label: 'Enable reservations' },
  { group: 'features', key: 'student_pass_enabled', value: 'false', type: 'boolean', label: 'Enable student passes' },
  { group: 'features', key: 'meal_plans_enabled', value: 'false', type: 'boolean', label: 'Enable meal plan subscriptions' },
  { group: 'features', key: 'whatsapp_enabled', value: 'false', type: 'boolean', label: 'Enable WhatsApp ordering' },
  { group: 'features', key: 'whatsapp_phone', value: '', type: 'string', label: 'WhatsApp business number' },
  { group: 'features', key: 'blog_enabled', value: 'false', type: 'boolean', label: 'Enable blog / content section' },
  { group: 'features', key: 'faq_enabled', value: 'false', type: 'boolean', label: 'Enable FAQ section' },
  { group: 'features', key: 'help_center_enabled', value: 'false', type: 'boolean', label: 'Enable help center' },
  { group: 'features', key: 'feedback_enabled', value: 'true', type: 'boolean', label: 'Enable feedback collection' },
  { group: 'features', key: 'social_wall_enabled', value: 'false', type: 'boolean', label: 'Show social media wall' },
  { group: 'features', key: 'table_qr_enabled', value: 'false', type: 'boolean', label: 'Enable QR code for tables' },
  { group: 'features', key: 'self_checkin_enabled', value: 'false', type: 'boolean', label: 'Enable self check-in kiosk mode' },
  { group: 'features', key: 'subscription_enabled', value: 'false', type: 'boolean', label: 'Enable subscription / recurring orders' },

  // ─── loyalty ────────────────────────────────────────────────────────────
  { group: 'loyalty', key: 'enabled', value: 'false', type: 'boolean', label: 'Enable loyalty program' },
  { group: 'loyalty', key: 'point_name', value: 'points', type: 'string', label: 'Loyalty point name (singular)' },
  { group: 'loyalty', key: 'point_name_plural', value: 'points', type: 'string', label: 'Loyalty point name (plural)' },
  { group: 'loyalty', key: 'point_value', value: '1', type: 'number', label: 'Value of 1 point in currency' },
  { group: 'loyalty', key: 'points_per_amount', value: '1', type: 'number', label: 'Points earned per amount spent' },
  { group: 'loyalty', key: 'points_per_amount_threshold', value: '100', type: 'number', label: 'Amount threshold for earning (e.g. 1 point per ₹100)' },
  { group: 'loyalty', key: 'healthy_boost_multiplier', value: '1.0', type: 'number', label: 'Multiplier for healthy variant items' },
  { group: 'loyalty', key: 'redemption_min_points', value: '50', type: 'number', label: 'Minimum points to redeem' },
  { group: 'loyalty', key: 'redemption_max_percent', value: '50', type: 'number', label: 'Max % of subtotal payable by points' },
  { group: 'loyalty', key: 'first_order_bonus', value: '0', type: 'number', label: 'Bonus points on first order' },
  { group: 'loyalty', key: 'welcome_bonus', value: '0', type: 'number', label: 'Points given on signup' },
  { group: 'loyalty', key: 'birthday_bonus', value: '0', type: 'number', label: 'Points given on birthday' },
  { group: 'loyalty', key: 'review_bonus', value: '0', type: 'number', label: 'Points for leaving a review' },
  { group: 'loyalty', key: 'referral_referee_bonus', value: '0', type: 'number', label: 'Points given to referred user' },
  { group: 'loyalty', key: 'referral_referrer_bonus', value: '0', type: 'number', label: 'Points given to referrer' },
  { group: 'loyalty', key: 'expiry_days', value: '365', type: 'number', label: 'Points expire after N days (0=never)' },
  { group: 'loyalty', key: 'tier_silver_threshold', value: '500', type: 'number', label: 'Silver tier threshold' },
  { group: 'loyalty', key: 'tier_silver_multiplier', value: '1.25', type: 'number', label: 'Silver tier multiplier' },
  { group: 'loyalty', key: 'tier_gold_threshold', value: '1500', type: 'number', label: 'Gold tier threshold' },
  { group: 'loyalty', key: 'tier_gold_multiplier', value: '1.5', type: 'number', label: 'Gold tier multiplier' },
  { group: 'loyalty', key: 'tier_names', value: '["Bronze","Silver","Gold"]', type: 'json', label: 'Tier display names' },
  { group: 'loyalty', key: 'show_tier_progress', value: 'true', type: 'boolean', label: 'Show progress bar to next tier' },

  // ─── notifications ──────────────────────────────────────────────────────
  { group: 'notifications', key: 'order_confirm_email', value: 'true', type: 'boolean', label: 'Send order confirmation email' },
  { group: 'notifications', key: 'order_confirm_sms', value: 'true', type: 'boolean', label: 'Send order confirmation SMS' },
  { group: 'notifications', key: 'order_confirm_whatsapp', value: 'false', type: 'boolean', label: 'Send order confirmation WhatsApp' },
  { group: 'notifications', key: 'welcome_email', value: 'true', type: 'boolean', label: 'Send welcome email on signup' },
  { group: 'notifications', key: 'welcome_sms', value: 'false', type: 'boolean', label: 'Send welcome SMS' },
  { group: 'notifications', key: 'order_status_push', value: 'true', type: 'boolean', label: 'Push on order status change' },
  { group: 'notifications', key: 'promotion_push', value: 'true', type: 'boolean', label: 'Push for new promotions' },
  { group: 'notifications', key: 'loyalty_push', value: 'true', type: 'boolean', label: 'Push for points earned/redeemed' },
  { group: 'notifications', key: 'review_reminder', value: 'false', type: 'boolean', label: 'Remind to review after delivery' },
  { group: 'notifications', key: 'review_reminder_hours', value: '24', type: 'number', label: 'Hours after delivery to remind' },
  { group: 'notifications', key: 'abandoned_cart_enabled', value: 'false', type: 'boolean', label: 'Enable abandoned cart reminders' },
  { group: 'notifications', key: 'abandoned_cart_hours', value: '2', type: 'number', label: 'Hours before cart reminder' },
  { group: 'notifications', key: 'daily_digest', value: 'false', type: 'boolean', label: 'Daily digest email for admin' },

  // ─── orders ─────────────────────────────────────────────────────────────
  { group: 'orders', key: 'prefix', value: 'ORD', type: 'string', label: 'Order number prefix' },
  { group: 'orders', key: 'auto_confirm', value: 'false', type: 'boolean', label: 'Auto-confirm new orders' },
  { group: 'orders', key: 'max_order_amount', value: '50000', type: 'number', label: 'Maximum order amount' },
  { group: 'orders', key: 'auto_accept_minutes', value: '0', type: 'number', label: 'Auto-accept after N minutes (0=manual)' },
  { group: 'orders', key: 'cancel_allowed_minutes', value: '5', type: 'number', label: 'Allow cancel within N minutes' },
  { group: 'orders', key: 'reorder_enabled', value: 'true', type: 'boolean', label: 'Allow one-tap reorder' },
  { group: 'orders', key: 'order_tracking_enabled', value: 'true', type: 'boolean', label: 'Show order status tracking' },
  { group: 'orders', key: 'receipt_enabled', value: 'true', type: 'boolean', label: 'Generate order receipt / invoice' },
  { group: 'orders', key: 'rating_enabled', value: 'true', type: 'boolean', label: 'Ask for order rating after delivery' },
  { group: 'orders', key: 'rating_mandatory', value: 'false', type: 'boolean', label: 'Require rating before next order' },
  { group: 'orders', key: 'token_display_enabled', value: 'true', type: 'boolean', label: 'Show token number for pickup/dine-in' },
  { group: 'orders', key: 'max_items_per_order', value: '50', type: 'number', label: 'Max items in a single order' },
  { group: 'orders', key: 'order_types', value: '["delivery","pickup","dine_in"]', type: 'json', label: 'Allowed order types' },

  // ─── otp ────────────────────────────────────────────────────────────────
  { group: 'otp', key: 'dummy_mode', value: 'false', type: 'boolean', label: 'Use dummy OTP (dev only)' },
  { group: 'otp', key: 'dummy_code', value: '123456', type: 'string', label: 'Dummy OTP code (when dummy mode on)' },

  // ─── pos ────────────────────────────────────────────────────────────────
  { group: 'pos', key: 'provider', value: '', type: 'string', label: 'POS provider (petpooja, etc.)' },
  { group: 'pos', key: 'auto_sync', value: 'false', type: 'boolean', label: 'Auto-sync menu from POS' },

  // ─── tax ────────────────────────────────────────────────────────────────
  { group: 'tax', key: 'rate', value: '0', type: 'number', label: 'Tax rate (%)' },
  { group: 'tax', key: 'label', value: 'Tax', type: 'string', label: 'Tax label (GST, VAT, etc.)' },
  { group: 'tax', key: 'inclusive', value: 'true', type: 'boolean', label: 'Prices include tax' },
  { group: 'tax', key: 'gst_number', value: '', type: 'string', label: 'GST / Tax ID number' },
  { group: 'tax', key: 'service_charge_enabled', value: 'false', type: 'boolean', label: 'Enable service charge' },
  { group: 'tax', key: 'service_charge_percent', value: '0', type: 'number', label: 'Service charge percentage' },
  { group: 'tax', key: 'tax_on_delivery', value: 'false', type: 'boolean', label: 'Apply tax on delivery fee' },
  { group: 'tax', key: 'tax_on_packing', value: 'false', type: 'boolean', label: 'Apply tax on packing charges' },

  // ─── payments (NEW) ─────────────────────────────────────────────────────
  { group: 'payments', key: 'cod_max_amount', value: '5000', type: 'number', label: 'Maximum COD order amount' },
  { group: 'payments', key: 'cod_min_amount', value: '0', type: 'number', label: 'Minimum COD order amount' },
  { group: 'payments', key: 'online_discount', value: '0', type: 'number', label: 'Discount % for online payment' },
  { group: 'payments', key: 'partial_payment', value: 'false', type: 'boolean', label: 'Allow partial payment (advance)' },
  { group: 'payments', key: 'partial_min_percent', value: '50', type: 'number', label: 'Minimum advance percentage' },
  { group: 'payments', key: 'wallet_enabled', value: 'false', type: 'boolean', label: 'Enable in-app wallet' },
  { group: 'payments', key: 'wallet_topup_enabled', value: 'false', type: 'boolean', label: 'Allow wallet top-up' },
  { group: 'payments', key: 'upi_enabled', value: 'true', type: 'boolean', label: 'Enable UPI payments' },
  { group: 'payments', key: 'card_enabled', value: 'true', type: 'boolean', label: 'Enable card payments' },
  { group: 'payments', key: 'netbanking_enabled', value: 'true', type: 'boolean', label: 'Enable netbanking' },
  { group: 'payments', key: 'emi_enabled', value: 'false', type: 'boolean', label: 'Enable EMI options' },
  { group: 'payments', key: 'refund_auto', value: 'false', type: 'boolean', label: 'Auto-refund on cancellation' },

  // ─── analytics (NEW) ────────────────────────────────────────────────────
  { group: 'analytics', key: 'google_analytics_id', value: '', type: 'string', label: 'GA4 measurement ID' },
  { group: 'analytics', key: 'facebook_pixel_id', value: '', type: 'string', label: 'Facebook Pixel ID' },
  { group: 'analytics', key: 'mixpanel_token', value: '', type: 'string', label: 'Mixpanel project token' },
  { group: 'analytics', key: 'hotjar_id', value: '', type: 'string', label: 'Hotjar site ID' },
  { group: 'analytics', key: 'gtm_id', value: '', type: 'string', label: 'Google Tag Manager ID' },
  { group: 'analytics', key: 'clarity_id', value: '', type: 'string', label: 'Microsoft Clarity ID' },

  // ─── seo (NEW) ──────────────────────────────────────────────────────────
  { group: 'seo', key: 'meta_title', value: '', type: 'string', label: 'Default page title' },
  { group: 'seo', key: 'meta_description', value: '', type: 'string', label: 'Default meta description' },
  { group: 'seo', key: 'canonical_url', value: '', type: 'string', label: 'Canonical domain URL' },
  { group: 'seo', key: 'robots', value: 'index,follow', type: 'string', label: 'Robots meta tag' },
  { group: 'seo', key: 'sitemap_enabled', value: 'true', type: 'boolean', label: 'Auto-generate sitemap' },
  { group: 'seo', key: 'structured_data_enabled', value: 'true', type: 'boolean', label: 'Add JSON-LD structured data' },
  { group: 'seo', key: 'og_type', value: 'website', type: 'string', label: 'OpenGraph type' },
  { group: 'seo', key: 'twitter_handle', value: '', type: 'string', label: 'Twitter handle for cards' },

  // ─── property (NEW — hospitality) ───────────────────────────────────────
  { group: 'property', key: 'check_in_time', value: '', type: 'string', label: 'Standard check-in time (HH:mm)' },
  { group: 'property', key: 'check_out_time', value: '', type: 'string', label: 'Standard check-out time (HH:mm)' },
  { group: 'property', key: 'early_checkin_fee', value: '0', type: 'number', label: 'Early check-in surcharge' },
  { group: 'property', key: 'late_checkout_fee', value: '0', type: 'number', label: 'Late check-out surcharge' },
  { group: 'property', key: 'max_guests_per_unit', value: '3', type: 'number', label: 'Max guests before extra charge' },
  { group: 'property', key: 'extra_guest_charge', value: '500', type: 'number', label: 'Per extra guest per night' },
  { group: 'property', key: 'child_age_limit', value: '12', type: 'number', label: 'Age below which child is free' },
  { group: 'property', key: 'cancellation_hours', value: '24', type: 'number', label: 'Free cancellation window (hours)' },
  { group: 'property', key: 'cancellation_fee_percent', value: '50', type: 'number', label: 'Cancellation fee after window (%)' },
  { group: 'property', key: 'advance_booking_days', value: '90', type: 'number', label: 'Max days ahead for booking' },
  { group: 'property', key: 'min_stay_nights', value: '1', type: 'number', label: 'Minimum stay requirement' },
  { group: 'property', key: 'max_stay_nights', value: '30', type: 'number', label: 'Maximum stay' },
  { group: 'property', key: 'housekeeping_auto_dirty', value: 'true', type: 'boolean', label: 'Auto-set dirty after checkout' },
  { group: 'property', key: 'id_verification', value: 'true', type: 'boolean', label: 'Require ID at check-in' },
  { group: 'property', key: 'deposit_enabled', value: 'false', type: 'boolean', label: 'Require security deposit' },

  // ─── integrations (NEW) ─────────────────────────────────────────────────
  { group: 'integrations', key: 'google_maps_key', value: '', type: 'string', label: 'Google Maps API key (for FE)' },
  { group: 'integrations', key: 'recaptcha_key', value: '', type: 'string', label: 'reCAPTCHA site key' },
  { group: 'integrations', key: 'intercom_app_id', value: '', type: 'string', label: 'Intercom chat widget ID' },
  { group: 'integrations', key: 'tawk_to_id', value: '', type: 'string', label: 'Tawk.to chat widget ID' },
  { group: 'integrations', key: 'freshdesk_url', value: '', type: 'string', label: 'Freshdesk helpdesk URL' },
  { group: 'integrations', key: 'webhook_secret', value: '', type: 'string', label: 'Shared webhook secret' },
  { group: 'integrations', key: 'slack_webhook', value: '', type: 'string', label: 'Slack notification webhook' },
  { group: 'integrations', key: 'telegram_bot_token', value: '', type: 'string', label: 'Telegram bot token' },
  { group: 'integrations', key: 'zapier_hook_url', value: '', type: 'string', label: 'Zapier integration URL' },
  { group: 'integrations', key: 'custom_domain', value: '', type: 'string', label: 'Custom domain for storefront' },

  // ─── system (NEW) ──────────────────────────────────────────────────────
  { group: 'system', key: 'maintenance_mode', value: 'false', type: 'boolean', label: 'Put storefront in maintenance' },
  { group: 'system', key: 'maintenance_message', value: "We'll be back soon!", type: 'string', label: 'Maintenance mode message' },
  { group: 'system', key: 'rate_limit_per_minute', value: '60', type: 'number', label: 'API rate limit per user' },
  { group: 'system', key: 'max_upload_size_mb', value: '10', type: 'number', label: 'Max file upload size (MB)' },
  { group: 'system', key: 'cors_origins', value: '[]', type: 'json', label: 'Additional CORS origins' },
  { group: 'system', key: 'debug_mode', value: 'false', type: 'boolean', label: 'Enable verbose logging (dev only)' },
  { group: 'system', key: 'app_version_min', value: '', type: 'string', label: 'Minimum app version (for mobile)' },
  { group: 'system', key: 'coming_soon', value: 'false', type: 'boolean', label: 'Coming soon mode (show teaser)' },

  // ─── app (NEW — mobile/PWA) ────────────────────────────────────────────
  { group: 'app', key: 'pwa_enabled', value: 'true', type: 'boolean', label: 'Enable PWA install prompt' },
  { group: 'app', key: 'splash_screen_url', value: '', type: 'string', label: 'Custom splash screen image' },
  { group: 'app', key: 'app_store_url', value: '', type: 'string', label: 'iOS App Store link' },
  { group: 'app', key: 'play_store_url', value: '', type: 'string', label: 'Google Play Store link' },
  { group: 'app', key: 'force_update_version', value: '', type: 'string', label: 'Force update below this version' },
  { group: 'app', key: 'push_vapid_public_key', value: '', type: 'string', label: 'VAPID public key for web push' },
  { group: 'app', key: 'offline_mode', value: 'false', type: 'boolean', label: 'Enable offline browsing' },
  { group: 'app', key: 'bottom_nav_items', value: '[]', type: 'json', label: 'Custom bottom nav configuration' },

  // ─── email (NEW) ───────────────────────────────────────────────────────
  { group: 'email', key: 'sender_name', value: '', type: 'string', label: '"From" name in emails' },
  { group: 'email', key: 'sender_email', value: '', type: 'string', label: '"From" email address' },
  { group: 'email', key: 'reply_to', value: '', type: 'string', label: 'Reply-to email' },
  { group: 'email', key: 'footer_text', value: '', type: 'string', label: 'Email footer text' },
  { group: 'email', key: 'unsubscribe_url', value: '', type: 'string', label: 'Unsubscribe link' },
  { group: 'email', key: 'template_logo_url', value: '', type: 'string', label: 'Logo URL in email templates' },
];

// ─── Per-org overrides (only values that differ from defaults) ──────────────
const ORG_OVERRIDES: Record<string, Partial<Record<string, string>>> = {
  burgerempire: {
    'auth.primary_login_id': 'phone',
    'auth.require_phone_verification': 'true',
    'auth.demo_enabled': 'true',
    'auth.demo_email': 'arjun.sharma@gmail.com',
    'branding.name': 'Burger Empire',
    'branding.tagline': 'Burgers that love you back',
    'branding.primary_color': '#F5A623',
    'branding.secondary_color': '#4A7C59',
    'branding.currency': 'INR',
    'branding.currency_symbol': '₹',
    'catalog.variant_types': '["classic","healthy"]',
    'catalog.default_variant_type': 'classic',
    'checkout.cod_enabled': 'true',
    'checkout.min_order_amount': '99',
    'checkout.packing_charges': '15',
    'delivery.fee': '40',
    'delivery.free_above': '499',
    'delivery.prep_time_minutes': '20',
    'features.coupons_enabled': 'true',
    'features.promotions_enabled': 'true',
    'features.referral_enabled': 'true',
    'features.reviews_enabled': 'true',
    'features.gift_cards_enabled': 'true',
    'features.reservations_enabled': 'true',
    'features.whatsapp_enabled': 'true',
    'loyalty.enabled': 'true',
    'loyalty.point_name': 'coins',
    'loyalty.point_name_plural': 'coins',
    'loyalty.points_per_amount': '1',
    'loyalty.points_per_amount_threshold': '100',
    'loyalty.healthy_boost_multiplier': '1.5',
    'loyalty.first_order_bonus': '50',
    'loyalty.redemption_min_points': '50',
    'loyalty.redemption_max_percent': '50',
    'orders.prefix': 'BB',
    'pos.provider': 'petpooja',
    'pos.auto_sync': 'true',
    'tax.rate': '5',
    'tax.label': 'GST',
    'tax.inclusive': 'true',
    'seo.meta_title': 'Burger Empire — Gwalior\'s Favourite Burgers',
    'seo.meta_description': 'Order burgers, sides, shakes & more. Classic & healthy options. Free delivery above ₹499.',
  },
  vicity: {
    'auth.primary_login_id': 'email',
    'auth.require_phone_verification': 'false',
    'auth.require_email_verification': 'true',
    'auth.demo_enabled': 'true',
    'auth.demo_email': 'rahul.kapoor@gmail.com',
    'branding.name': 'The Courtyard Villa',
    'branding.tagline': 'Where stories find a home',
    'branding.primary_color': '#92764A',
    'branding.secondary_color': '#1E293B',
    'branding.currency': 'INR',
    'branding.currency_symbol': '₹',
    'catalog.variant_types': '["default"]',
    'features.coupons_enabled': 'true',
    'features.reviews_enabled': 'true',
    'features.reservations_enabled': 'false',
    'loyalty.enabled': 'false',
    'property.check_in_time': '14:00',
    'property.check_out_time': '11:00',
    'property.max_guests_per_unit': '3',
    'property.extra_guest_charge': '500',
    'property.cancellation_hours': '48',
    'property.cancellation_fee_percent': '50',
    'property.advance_booking_days': '90',
    'tax.rate': '18',
    'tax.label': 'GST',
    'tax.inclusive': 'false',
    'seo.meta_title': 'The Courtyard Villa — Premium Stays',
    'seo.meta_description': 'Book your stay at The Courtyard Villa. Premium rooms, modern amenities.',
  },
  subradar: {
    'auth.primary_login_id': 'email',
    'auth.demo_enabled': 'true',
    'auth.demo_email': 'demo@subradar.in',
  },
  aurum: {
    'auth.primary_login_id': 'phone',
    'auth.demo_enabled': 'true',
    'auth.demo_email': 'demo@aurum.in',
  },
  playflix: {
    'auth.demo_enabled': 'true',
    'auth.demo_email': 'demo@playflix.in',
  },
  techzunction: {
    'branding.name': 'TechZunction',
    'branding.tagline': 'Build. Scale. Succeed.',
    'branding.primary_color': '#3B82F6',
    'auth.primary_login_id': 'email',
  },
};

export async function seedAllSettings(prisma: PrismaClient) {
  console.log('Seeding all OrgSettings...\n');

  const orgs = await prisma.organization.findMany({ select: { id: true, slug: true } });

  for (const org of orgs) {
    const overrides = ORG_OVERRIDES[org.slug] ?? {};
    let created = 0;
    let updated = 0;

    for (const setting of DEFAULTS) {
      const overrideKey = `${setting.group}.${setting.key}`;
      const value = overrides[overrideKey] ?? setting.value;

      const result = await prisma.orgSettings.upsert({
        where: { orgId_group_key: { orgId: org.id, group: setting.group, key: setting.key } },
        update: { value, type: setting.type, label: setting.label },
        create: { orgId: org.id, group: setting.group, key: setting.key, value, type: setting.type, label: setting.label },
      });

      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        created++;
      } else {
        updated++;
      }
    }

    console.log(`  ${org.slug}: ${created} created, ${updated} updated (${DEFAULTS.length} total)`);
  }

  console.log(`\nDone! ${DEFAULTS.length} settings × ${orgs.length} orgs = ${DEFAULTS.length * orgs.length} records`);
}

