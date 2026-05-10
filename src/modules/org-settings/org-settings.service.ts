import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { EncryptionService } from '../../services/encryption/encryption.service.js';

// Default settings applied when no org-level override exists.
// This is the single source of truth — FE DEFAULT_CONFIG must match these values.
const DEFAULTS: Record<string, Record<string, { value: string; type: string }>> = {
  auth: {
    primary_login_id: { value: 'phone', type: 'string' },
    require_phone_verification: { value: 'true', type: 'boolean' },
    require_email_verification: { value: 'false', type: 'boolean' },
    otp_length: { value: '6', type: 'number' },
    otp_expiry_minutes: { value: '5', type: 'number' },
    allow_social_login: { value: 'false', type: 'boolean' },
    google_login_enabled: { value: 'false', type: 'boolean' },
    facebook_login_enabled: { value: 'false', type: 'boolean' },
    password_min_length: { value: '8', type: 'number' },
    force_phone_for_orders: { value: 'true', type: 'boolean' },
  },
  branding: {
    name: { value: '', type: 'string' },
    tagline: { value: '', type: 'string' },
    logo_url: { value: '', type: 'string' },
    favicon_url: { value: '', type: 'string' },
    og_image_url: { value: '', type: 'string' },
    primary_color: { value: '#F5A623', type: 'string' },
    secondary_color: { value: '#4A7C59', type: 'string' },
    accent_color: { value: '#FF6B35', type: 'string' },
    font_family: { value: 'Inter', type: 'string' },
    currency: { value: 'INR', type: 'string' },
    currency_symbol: { value: '₹', type: 'string' },
    timezone: { value: 'Asia/Kolkata', type: 'string' },
    country_code: { value: 'IN', type: 'string' },
    date_format: { value: 'DD/MM/YYYY', type: 'string' },
    dark_mode_enabled: { value: 'false', type: 'boolean' },
    powered_by_visible: { value: 'true', type: 'boolean' },
  },
  catalog: {
    variant_types: { value: '["default"]', type: 'json' },
    default_variant_type: { value: 'classic', type: 'string' },
    show_calories: { value: 'true', type: 'boolean' },
    show_nutrition: { value: 'false', type: 'boolean' },
    show_allergens: { value: 'false', type: 'boolean' },
    show_diet_badges: { value: 'true', type: 'boolean' },
    diet_filter_default: { value: 'all', type: 'string' },
    show_ratings: { value: 'false', type: 'boolean' },
    show_out_of_stock: { value: 'true', type: 'boolean' },
    items_per_page: { value: '20', type: 'number' },
    search_enabled: { value: 'true', type: 'boolean' },
  },
  checkout: {
    cod_enabled: { value: 'true', type: 'boolean' },
    online_pay_enabled: { value: 'true', type: 'boolean' },
    min_order_amount: { value: '0', type: 'number' },
    packing_charges: { value: '0', type: 'number' },
    tip_enabled: { value: 'false', type: 'boolean' },
    tip_presets: { value: '[10, 20, 50]', type: 'json' },
    instructions_enabled: { value: 'true', type: 'boolean' },
    scheduled_orders: { value: 'false', type: 'boolean' },
    promo_code_field: { value: 'true', type: 'boolean' },
    gift_wrap_enabled: { value: 'false', type: 'boolean' },
    gift_wrap_price: { value: '0', type: 'number' },
  },
  contact: {
    phone: { value: '', type: 'string' },
    email: { value: '', type: 'string' },
    address: { value: '', type: 'string' },
    instagram: { value: '', type: 'string' },
    facebook: { value: '', type: 'string' },
    twitter: { value: '', type: 'string' },
  },
  delivery: {
    enabled: { value: 'true', type: 'boolean' },
    fee: { value: '40', type: 'number' },
    free_above: { value: '499', type: 'number' },
    prep_time_minutes: { value: '20', type: 'number' },
    pickup_enabled: { value: 'true', type: 'boolean' },
    dine_in_enabled: { value: 'false', type: 'boolean' },
    live_tracking_enabled: { value: 'false', type: 'boolean' },
    max_distance_km: { value: '10', type: 'number' },
    contactless_default: { value: 'false', type: 'boolean' },
    slot_based_delivery: { value: 'false', type: 'boolean' },
    pickup_eta_minutes: { value: '15', type: 'number' },
    delivery_eta_minutes: { value: '30', type: 'number' },
  },
  features: {
    coupons_enabled: { value: 'true', type: 'boolean' },
    promotions_enabled: { value: 'true', type: 'boolean' },
    referral_enabled: { value: 'true', type: 'boolean' },
    referral_points: { value: '50', type: 'number' },
    reviews_enabled: { value: 'true', type: 'boolean' },
    gift_cards_enabled: { value: 'false', type: 'boolean' },
    reservations_enabled: { value: 'false', type: 'boolean' },
    whatsapp_enabled: { value: 'false', type: 'boolean' },
    whatsapp_phone: { value: '', type: 'string' },
    blog_enabled: { value: 'false', type: 'boolean' },
    help_center_enabled: { value: 'false', type: 'boolean' },
    feedback_enabled: { value: 'false', type: 'boolean' },
    self_checkin_enabled: { value: 'false', type: 'boolean' },
    subscription_enabled: { value: 'false', type: 'boolean' },
    table_qr_enabled: { value: 'false', type: 'boolean' },
    student_pass_enabled: { value: 'true', type: 'boolean' },
    meal_plans_enabled: { value: 'false', type: 'boolean' },
  },
  loyalty: {
    enabled: { value: 'true', type: 'boolean' },
    point_name: { value: 'coins', type: 'string' },
    point_name_plural: { value: 'coins', type: 'string' },
    point_value: { value: '1', type: 'number' },
    points_per_amount: { value: '10', type: 'number' },
    points_per_amount_threshold: { value: '100', type: 'number' },
    healthy_boost_multiplier: { value: '2', type: 'number' },
    redemption_min_points: { value: '10', type: 'number' },
    redemption_max_percent: { value: '50', type: 'number' },
    first_order_bonus: { value: '25', type: 'number' },
    welcome_bonus: { value: '0', type: 'number' },
    birthday_bonus: { value: '0', type: 'number' },
    review_bonus: { value: '0', type: 'number' },
    expiry_days: { value: '365', type: 'number' },
    tier_names: { value: '["Bronze", "Silver", "Gold"]', type: 'json' },
    tier_silver_threshold: { value: '500', type: 'number' },
    tier_gold_threshold: { value: '2000', type: 'number' },
    tier_silver_multiplier: { value: '1.5', type: 'number' },
    tier_gold_multiplier: { value: '2', type: 'number' },
    show_tier_progress: { value: 'true', type: 'boolean' },
  },
  orders: {
    prefix: { value: 'BB', type: 'string' },
    auto_confirm: { value: 'false', type: 'boolean' },
    auto_accept_minutes: { value: '0', type: 'number' },
    reorder_enabled: { value: 'true', type: 'boolean' },
    order_tracking_enabled: { value: 'true', type: 'boolean' },
    receipt_enabled: { value: 'true', type: 'boolean' },
    rating_enabled: { value: 'false', type: 'boolean' },
    rating_mandatory: { value: 'false', type: 'boolean' },
    token_display_enabled: { value: 'false', type: 'boolean' },
    order_types: { value: '["delivery", "pickup"]', type: 'json' },
    cancel_allowed_minutes: { value: '5', type: 'number' },
    cancel_refund_enabled: { value: 'true', type: 'boolean' },
    cancel_refund_percent: { value: '100', type: 'number' },
    max_order_amount: { value: '10000', type: 'number' },
    max_items_per_order: { value: '50', type: 'number' },
  },
  tax: {
    rate: { value: '5', type: 'number' },
    label: { value: 'GST', type: 'string' },
    inclusive: { value: 'true', type: 'boolean' },
    service_charge_enabled: { value: 'false', type: 'boolean' },
    service_charge_percent: { value: '0', type: 'number' },
  },
  payments: {
    cod_max_amount: { value: '5000', type: 'number' },
    cod_min_amount: { value: '0', type: 'number' },
    online_discount: { value: '0', type: 'number' },
    partial_payment: { value: 'false', type: 'boolean' },
    partial_min_percent: { value: '50', type: 'number' },
    wallet_enabled: { value: 'false', type: 'boolean' },
    wallet_topup_enabled: { value: 'false', type: 'boolean' },
    upi_enabled: { value: 'true', type: 'boolean' },
    card_enabled: { value: 'true', type: 'boolean' },
    netbanking_enabled: { value: 'true', type: 'boolean' },
    emi_enabled: { value: 'false', type: 'boolean' },
    refund_auto: { value: 'false', type: 'boolean' },
    refund_enabled: { value: 'true', type: 'boolean' },
    refund_percentage: { value: '100', type: 'number' },
    refund_window_hours: { value: '24', type: 'number' },
    partial_refund_enabled: { value: 'true', type: 'boolean' },
    refund_to_wallet: { value: 'false', type: 'boolean' },
  },
  seo: {
    meta_title: { value: '', type: 'string' },
    meta_description: { value: '', type: 'string' },
    canonical_url: { value: '', type: 'string' },
    og_type: { value: 'website', type: 'string' },
    twitter_handle: { value: '', type: 'string' },
  },
  analytics: {
    google_analytics_id: { value: '', type: 'string' },
    facebook_pixel_id: { value: '', type: 'string' },
    gtm_id: { value: '', type: 'string' },
  },
  app: {
    pwa_enabled: { value: 'false', type: 'boolean' },
    app_store_url: { value: '', type: 'string' },
    play_store_url: { value: '', type: 'string' },
  },
  system: {
    maintenance_mode: { value: 'false', type: 'boolean' },
    maintenance_message: { value: '', type: 'string' },
    coming_soon: { value: 'false', type: 'boolean' },
  },
  rewards: {
    free_fries: { value: '50', type: 'number' },
    free_shake: { value: '100', type: 'number' },
    free_burger: { value: '200', type: 'number' },
    free_delivery: { value: '75', type: 'number' },
    free_combo: { value: '350', type: 'number' },
    free_smoothie: { value: '150', type: 'number' },
  },
};

// Groups that must never be exposed via the public storefront config endpoint
const PRIVATE_GROUPS = new Set(['whatsapp', 'pos', 'otp', 'integrations', 'email']);

@Injectable()
export class OrgSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  private tryDecrypt(value: string): string {
    try {
      return this.encryption.decrypt(value);
    } catch {
      return value;
    }
  }

  async getAll(orgId: string) {
    const settings = await this.prisma.orgSettings.findMany({
      where: { orgId },
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });

    return settings;
  }

  async getByGroup(orgId: string, group: string) {
    const settings = await this.prisma.orgSettings.findMany({
      where: { orgId, group },
      orderBy: { key: 'asc' },
    });

    return settings;
  }

  async get(orgId: string, group: string, key: string): Promise<string | null> {
    const setting = await this.prisma.orgSettings.findUnique({
      where: { orgId_group_key: { orgId, group, key } },
    });

    if (setting) {
      return setting.value;
    }

    // Fall back to defaults
    return DEFAULTS[group]?.[key]?.value ?? null;
  }

  async getTyped<T>(orgId: string, group: string, key: string, defaultValue: T): Promise<T> {
    const raw = await this.get(orgId, group, key);
    if (raw === null) return defaultValue;

    const defaultDef = DEFAULTS[group]?.[key];
    const type = defaultDef?.type ?? 'string';

    try {
      switch (type) {
        case 'boolean':
          return (raw === 'true') as unknown as T;
        case 'number':
          return Number(raw) as unknown as T;
        case 'json':
          return JSON.parse(raw) as T;
        default:
          return raw as unknown as T;
      }
    } catch {
      return defaultValue;
    }
  }

  async set(
    orgId: string,
    group: string,
    key: string,
    value: string,
    type?: string,
    label?: string,
  ) {
    return this.prisma.orgSettings.upsert({
      where: { orgId_group_key: { orgId, group, key } },
      update: {
        value,
        ...(type !== undefined && { type }),
        ...(label !== undefined && { label }),
      },
      create: {
        orgId,
        group,
        key,
        value,
        type: type ?? 'string',
        label: label ?? null,
      },
    });
  }

  async bulkSet(
    orgId: string,
    settings: Array<{ group: string; key: string; value: string; type?: string; label?: string }>,
  ) {
    const operations = settings.map((s) =>
      this.prisma.orgSettings.upsert({
        where: { orgId_group_key: { orgId, group: s.group, key: s.key } },
        update: {
          value: s.value,
          ...(s.type !== undefined && { type: s.type }),
          ...(s.label !== undefined && { label: s.label }),
        },
        create: {
          orgId,
          group: s.group,
          key: s.key,
          value: s.value,
          type: s.type ?? 'string',
          label: s.label ?? null,
        },
      }),
    );

    return this.prisma.$transaction(operations);
  }

  async delete(orgId: string, group: string, key: string) {
    return this.prisma.orgSettings.deleteMany({
      where: { orgId, group, key },
    });
  }

  /**
   * Returns a safe subset of settings for the storefront (public config).
   * Excludes internal/sensitive groups defined in PRIVATE_GROUPS.
   */
  async getPublicConfig(orgId: string): Promise<Record<string, Record<string, unknown>>> {
    const settings = await this.prisma.orgSettings.findMany({
      where: { orgId },
    });

    // Build a structured config object from DB + defaults
    const result: Record<string, Record<string, unknown>> = {};

    // Apply defaults first (skip private groups)
    for (const [group, keys] of Object.entries(DEFAULTS)) {
      if (PRIVATE_GROUPS.has(group)) continue;
      result[group] = {};
      for (const [key, def] of Object.entries(keys)) {
        result[group][key] = this.parseValue(def.value, def.type);
      }
    }

    // Override with DB values (skip private groups)
    for (const setting of settings) {
      if (PRIVATE_GROUPS.has(setting.group)) continue;
      if (!result[setting.group]) {
        result[setting.group] = {};
      }
      result[setting.group]![setting.key] = this.parseValue(setting.value, setting.type);
    }

    // Expose non-secret payment provider config from org_configs
    const orgConfig = await this.prisma.orgConfig.findUnique({ where: { orgId } });
    if (orgConfig) {
      if (!result['payment']) result['payment'] = {};
      if (orgConfig.activePaymentProvider) {
        result['payment']['active_provider'] = orgConfig.activePaymentProvider;
      }
      if (orgConfig.paymentRazorpayKeyId) {
        result['payment']['razorpay_key_id'] = this.tryDecrypt(orgConfig.paymentRazorpayKeyId);
      }
    }

    return result;
  }

  private parseValue(value: string, type: string): unknown {
    switch (type) {
      case 'boolean':
        return value === 'true';
      case 'number':
        return Number(value);
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      case 'string':
      default:
        // Strip surrounding quotes if the value was stored JSON-encoded (e.g., '"INR"' → 'INR')
        if (value.startsWith('"') && value.endsWith('"')) {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }
        return value;
    }
  }
}
