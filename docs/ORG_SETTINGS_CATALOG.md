# Darsh Gupta — Complete OrgSettings Catalog for SaaS

> Every setting a client org might need. All configurable per-org via Admin Panel.
> Settings the org doesn't use simply remain at defaults — zero impact.

## Currently Implemented (69 settings, 14 groups)

✅ auth (6), branding (8), catalog (2), checkout (4), contact (7), delivery (4),
features (11), loyalty (14), notifications (3), orders (3), otp (2), pos (2), tax (3)

---

## Proposed New Settings (organized by group)

### 🔐 auth (add 8 → total 14)
```
auth.allow_social_login         boolean  false    Allow Google/Facebook login
auth.google_login_enabled       boolean  false    Enable Google OAuth for end users
auth.facebook_login_enabled     boolean  false    Enable Facebook OAuth for end users
auth.apple_login_enabled        boolean  false    Enable Apple Sign-In
auth.max_sessions               number   5        Max concurrent sessions per user
auth.session_timeout_hours      number   168      Session expiry (default 7 days)
auth.password_min_length        number   6        Minimum password length
auth.force_phone_for_orders     boolean  false    Require verified phone before ordering
```

### 🎨 branding (add 12 → total 20)
```
branding.favicon_url            string   ""       Custom favicon URL
branding.og_image_url           string   ""       Default OpenGraph image
branding.font_family            string   "Inter"  Primary font family
branding.dark_mode_enabled      boolean  false    Enable dark mode toggle
branding.accent_color           string   ""       Accent/highlight color
branding.error_color            string   "#EF4444" Error state color
branding.success_color          string   "#10B981" Success state color
branding.footer_text            string   ""       Custom footer text
branding.custom_css             string   ""       Custom CSS injection (advanced)
branding.powered_by_visible     boolean  true     Show "Powered by Darsh Gupta"
branding.country_code           string   "+91"    Default phone country code
branding.date_format            string   "DD/MM/YYYY" Date display format
```

### 📦 catalog (add 10 → total 12)
```
catalog.show_calories           boolean  true     Show calorie count on items
catalog.show_nutrition           boolean  true     Show full nutrition data
catalog.show_allergens          boolean  true     Show allergen warnings
catalog.show_diet_badges        boolean  true     Show veg/nonveg/egg badges
catalog.diet_filter_default     string   "all"    Default diet filter (all/veg/nonveg)
catalog.show_ratings            boolean  true     Show item ratings
catalog.show_out_of_stock       boolean  true     Show out-of-stock items (greyed)
catalog.items_per_page          number   20       Items per page in menu
catalog.image_aspect_ratio      string   "1:1"    Item image aspect ratio
catalog.search_enabled          boolean  true     Enable search in menu
```

### 🛒 checkout (add 12 → total 16)
```
checkout.tip_enabled            boolean  false    Show tip option at checkout
checkout.tip_presets            json     [10,15,20] Tip percentage presets
checkout.tip_custom_enabled     boolean  true     Allow custom tip amount
checkout.instructions_enabled   boolean  true     Allow special instructions
checkout.scheduled_orders       boolean  false    Allow scheduled/future orders
checkout.schedule_max_days      number   7        Max days ahead for scheduling
checkout.min_prep_time_minutes  number   15       Minimum prep time shown
checkout.express_checkout       boolean  false    One-tap reorder for repeat customers
checkout.promo_code_field       boolean  true     Show promo code input
checkout.gift_wrap_enabled      boolean  false    Offer gift wrapping
checkout.gift_wrap_price        number   0        Gift wrap charge
checkout.order_notes_enabled    boolean  true     Allow order-level notes
```

### 🚚 delivery (add 10 → total 14)
```
delivery.pickup_enabled         boolean  true     Allow pickup orders
delivery.dine_in_enabled        boolean  true     Allow dine-in orders
delivery.self_pickup_discount   number   0        Discount % for pickup orders
delivery.live_tracking_enabled  boolean  false    Show live delivery tracking
delivery.eta_buffer_minutes     number   5        Extra minutes added to ETA
delivery.max_distance_km        number   15       Maximum delivery radius
delivery.surge_multiplier       number   1.0      Delivery fee surge multiplier
delivery.contactless_default    boolean  false    Default to contactless delivery
delivery.delivery_partner       string   ""       Third-party delivery (dunzo/shadowfax)
delivery.slot_based_delivery    boolean  false    Enable time-slot based delivery
```

### 🏷️ features (add 8 → total 19)
```
features.blog_enabled           boolean  false    Enable blog/content section
features.faq_enabled            boolean  false    Enable FAQ section
features.help_center_enabled    boolean  false    Enable help center
features.feedback_enabled       boolean  true     Enable feedback collection
features.social_wall_enabled    boolean  false    Show social media wall
features.table_qr_enabled       boolean  false    Enable QR code for tables
features.self_checkin_enabled   boolean  false    Enable self check-in kiosk mode
features.subscription_enabled   boolean  false    Enable subscription/recurring orders
```

### 🏅 loyalty (add 8 → total 22)
```
loyalty.welcome_bonus           number   0        Points given on first signup
loyalty.birthday_bonus          number   0        Points given on birthday
loyalty.review_bonus            number   10       Points for leaving a review
loyalty.referral_referee_bonus  number   25       Points given to referred user
loyalty.referral_referrer_bonus number   50       Points given to referrer
loyalty.expiry_days             number   365      Points expire after N days (0=never)
loyalty.tier_names              json     ["Bronze","Silver","Gold"] Tier display names
loyalty.show_tier_progress      boolean  true     Show progress bar to next tier
```

### 📧 notifications (add 10 → total 13)
```
notifications.welcome_email     boolean  true     Send welcome email on signup
notifications.welcome_sms       boolean  false    Send welcome SMS
notifications.order_status_push boolean  true     Push notification on order status change
notifications.promotion_push    boolean  true     Push for new promotions
notifications.loyalty_push      boolean  true     Push for points earned/redeemed
notifications.review_reminder   boolean  false    Remind to review after delivery
notifications.review_reminder_hours number 24     Hours after delivery to send reminder
notifications.abandoned_cart_enabled boolean false Enable abandoned cart reminders
notifications.abandoned_cart_hours number  2      Hours before sending cart reminder
notifications.daily_digest      boolean  false    Daily digest email for admin
```

### 📋 orders (add 10 → total 13)
```
orders.auto_accept_minutes      number   0        Auto-accept after N minutes (0=manual)
orders.cancel_allowed_minutes   number   5        Allow cancel within N minutes
orders.reorder_enabled          boolean  true     Allow one-tap reorder
orders.order_tracking_enabled   boolean  true     Show order status tracking
orders.receipt_enabled          boolean  true     Generate order receipt/invoice
orders.rating_enabled           boolean  true     Ask for order rating after delivery
orders.rating_mandatory          boolean  false    Require rating before next order
orders.token_display_enabled    boolean  true     Show token number for pickup/dine-in
orders.max_items_per_order      number   50       Maximum items in a single order
orders.order_types              json     ["delivery","pickup","dine_in"] Allowed order types
```

### 💰 tax (add 5 → total 8)
```
tax.gst_number                  string   ""       Org GST number for invoices
tax.service_charge_enabled      boolean  false    Enable service charge
tax.service_charge_percent      number   0        Service charge percentage
tax.tax_on_delivery             boolean  false    Apply tax on delivery fee
tax.tax_on_packing              boolean  false    Apply tax on packing charges
```

### 💳 payments (NEW group — 12 settings)
```
payments.cod_max_amount         number   5000     Maximum COD order amount
payments.cod_min_amount         number   0        Minimum COD order amount
payments.online_discount        number   0        Discount % for online payment
payments.partial_payment        boolean  false    Allow partial payment (advance)
payments.partial_min_percent    number   50       Minimum advance percentage
payments.wallet_enabled         boolean  false    Enable in-app wallet
payments.wallet_topup_enabled   boolean  false    Allow wallet top-up
payments.upi_enabled            boolean  true     Enable UPI payments
payments.card_enabled           boolean  true     Enable card payments
payments.netbanking_enabled     boolean  true     Enable netbanking
payments.emi_enabled            boolean  false    Enable EMI options
payments.refund_auto            boolean  false    Auto-refund on cancellation
```

### 📊 analytics (NEW group — 6 settings)
```
analytics.google_analytics_id   string   ""       GA4 measurement ID
analytics.facebook_pixel_id     string   ""       Facebook Pixel ID
analytics.mixpanel_token        string   ""       Mixpanel project token
analytics.hotjar_id             string   ""       Hotjar site ID
analytics.gtm_id                string   ""       Google Tag Manager ID
analytics.clarity_id            string   ""       Microsoft Clarity ID
```

### 🌐 seo (NEW group — 8 settings)
```
seo.meta_title                  string   ""       Default page title
seo.meta_description            string   ""       Default meta description
seo.canonical_url               string   ""       Canonical domain URL
seo.robots                      string   "index,follow" Robots meta tag
seo.sitemap_enabled             boolean  true     Auto-generate sitemap
seo.structured_data_enabled     boolean  true     Add JSON-LD structured data
seo.og_type                     string   "website" OpenGraph type
seo.twitter_handle              string   ""       Twitter handle for cards
```

### 🏨 property (NEW group — for hospitality orgs like ViCity — 15 settings)
```
property.check_in_time          string   "14:00"  Standard check-in time
property.check_out_time         string   "11:00"  Standard check-out time
property.early_checkin_fee      number   0        Early check-in surcharge
property.late_checkout_fee      number   0        Late check-out surcharge
property.max_guests_per_unit    number   3        Max guests before extra charge
property.extra_guest_charge     number   500      Per extra guest per night
property.child_age_limit        number   12       Age below which child is free
property.cancellation_hours     number   24       Free cancellation window (hours)
property.cancellation_fee_percent number 50       Cancellation fee after window
property.advance_booking_days   number   90       Max days ahead for booking
property.min_stay_nights        number   1        Minimum stay requirement
property.max_stay_nights        number   30       Maximum stay
property.housekeeping_auto_dirty boolean true     Auto-set dirty after checkout
property.id_verification        boolean  true     Require ID at check-in
property.deposit_enabled        boolean  false    Require security deposit
```

### 🤖 integrations (NEW group — 10 settings)
```
integrations.google_maps_key    string   ""       Google Maps API key (for FE)
integrations.recaptcha_key      string   ""       reCAPTCHA site key
integrations.intercom_app_id    string   ""       Intercom chat widget
integrations.tawk_to_id         string   ""       Tawk.to chat widget
integrations.freshdesk_url      string   ""       Freshdesk helpdesk URL
integrations.webhook_secret     string   ""       Shared webhook secret
integrations.slack_webhook      string   ""       Slack notification webhook
integrations.telegram_bot_token string   ""       Telegram bot for notifications
integrations.zapier_hook_url    string   ""       Zapier integration URL
integrations.custom_domain      string   ""       Custom domain for the storefront
```

### ⚙️ system (NEW group — 8 settings)
```
system.maintenance_mode         boolean  false    Put storefront in maintenance
system.maintenance_message      string   "We'll be back soon!" Maintenance message
system.rate_limit_per_minute    number   60       API rate limit per user
system.max_upload_size_mb       number   10       Max file upload size
system.session_cookie_name      string   ""       Custom session cookie name
system.cors_origins             json     []       Additional CORS origins
system.debug_mode               boolean  false    Enable verbose logging (dev only)
system.app_version_min          string   ""       Minimum app version (for mobile)
```

### 📱 app (NEW group — for mobile/PWA — 8 settings)
```
app.pwa_enabled                 boolean  true     Enable PWA install prompt
app.splash_screen_url           string   ""       Custom splash screen image
app.app_store_url               string   ""       iOS App Store link
app.play_store_url              string   ""       Google Play Store link
app.force_update_version        string   ""       Force update below this version
app.push_vapid_public_key       string   ""       VAPID public key for web push
app.offline_mode                boolean  false    Enable offline browsing
app.bottom_nav_items            json     []       Custom bottom nav configuration
```

### 📨 email (NEW group — 6 settings)
```
email.sender_name               string   ""       "From" name in emails
email.sender_email              string   ""       "From" email address
email.reply_to                  string   ""       Reply-to email
email.footer_text               string   ""       Email footer text
email.unsubscribe_url           string   ""       Unsubscribe link
email.template_logo_url         string   ""       Logo URL in email templates
```

---

## Summary

| Group | Current | Proposed New | Total |
|-------|---------|-------------|-------|
| auth | 6 | 8 | 14 |
| branding | 8 | 12 | 20 |
| catalog | 2 | 10 | 12 |
| checkout | 4 | 12 | 16 |
| contact | 7 | 0 | 7 |
| delivery | 4 | 10 | 14 |
| features | 11 | 8 | 19 |
| loyalty | 14 | 8 | 22 |
| notifications | 3 | 10 | 13 |
| orders | 3 | 10 | 13 |
| otp | 2 | 0 | 2 |
| pos | 2 | 0 | 2 |
| tax | 3 | 5 | 8 |
| **payments** (new) | 0 | 12 | 12 |
| **analytics** (new) | 0 | 6 | 6 |
| **seo** (new) | 0 | 8 | 8 |
| **property** (new) | 0 | 15 | 15 |
| **integrations** (new) | 0 | 10 | 10 |
| **system** (new) | 0 | 8 | 8 |
| **app** (new) | 0 | 8 | 8 |
| **email** (new) | 0 | 6 | 6 |
| **TOTAL** | **69** | **166** | **235** |

---

## How They're Used

```
Frontend: ConfigService.getPublicConfig() → reads OrgSettings for the org
  → UI adapts: colors, features, limits, labels

Backend: OrgSettingsService.get(orgId, 'loyalty', 'enabled') → boolean
  → Business logic adapts: loyalty calculation, delivery fees, tax rules

Admin: Settings page → grouped tabs → typed inputs → save per-setting
  → Org admin can self-configure without TZ support
```

## Security Note

Settings marked as `string` that contain API keys (analytics, integrations) should:
1. Only be returned to admin endpoints (not storefront/public config)
2. Be masked in admin UI (show last 4 chars)
3. Optionally encrypted at rest (like OrgConfig secrets)
