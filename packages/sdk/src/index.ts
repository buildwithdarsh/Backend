/**
 * @buildwithdarsh/sdk
 *
 * Centralized API client for all Build With Darsh frontend projects.
 * One-time init. Zero prefix repetition. Rich query objects on every call.
 *
 * ─── Quick Start ──────────────────────────────────────────────────────
 *
 *   import { TZ } from '@buildwithdarsh/sdk';
 *
 *   // Auto-reads TZ_ORG_ID, TZ_ORG_KEY from env. Auto-detects prod vs dev URL.
 *   TZ.init();
 *
 *   // OR explicit:
 *   TZ.init({ orgSlug: 'babyburger', orgKey: 'tz_abc123', env: 'dev' });
 *
 *   // Pre-login (PUBLIC — no token needed)
 *   await TZ.storefront.auth.sendOtp({ identifier: '+91...' });
 *   const config = await TZ.storefront.config.get();
 *
 *   // Post-login (ENDUSER — token auto-attached after login/verify)
 *   const { user } = await TZ.storefront.auth.verifyOtp({ identifier: '+91...', otp: '1234' });
 *   const cart = await TZ.storefront.cart.get();
 *
 *   // Rich query object
 *   const q = TZ.storefront.catalog.getItems({ page: 1, limit: 20 });
 *   const items = await q;              // await directly
 *   q.cancel();                          // abort in-flight
 *   const q2 = q.refetch();             // re-execute
 *   const nextPage = q.next();          // next page
 *   const raw = await q.raw();          // raw JSON before unwrap
 *   const status = await q.status();    // HTTP status code
 *
 *   // Admin (staff JWT)
 *   await TZ.admin.auth.login({ email: '...', password: '...' });
 *   const users = await TZ.admin.users.list({ page: 1 });
 *
 *   // Super Admin
 *   await TZ.superAdmin.auth.login({ email: '...', password: '...' });
 *   const stats = await TZ.superAdmin.stats();
 */

import { TZClient, type ScopedClient } from './client';
import { createStorefront } from './storefront';
import { createAdmin } from './admin';
import { createSuperAdmin } from './super-admin';
import type { TZConfig, TokenStore } from './types';

// ─── Environment Detection ──────────────────────────────────────────────────

const PROD_URL = 'https://api.work.withdarsh.com';
const DEV_URL = 'https://dev-api.work.withdarsh.com';

type TZEnv = 'production' | 'dev' | 'custom';

function resolveBaseUrl(env?: TZEnv, customUrl?: string): string {
  if (customUrl) return customUrl;
  if (env === 'production') return PROD_URL;
  return DEV_URL;
}

function readEnv(key: string): string | undefined {
  // Works in Node, Next.js, Vite, Expo
  if (typeof process !== 'undefined' && process.env) {
    // Next.js: NEXT_PUBLIC_*, Node: any env
    return (process.env as Record<string, string | undefined>)[key]
      ?? (process.env as Record<string, string | undefined>)[`NEXT_PUBLIC_${key}`]
      ?? (process.env as Record<string, string | undefined>)[`VITE_${key}`]
      ?? (process.env as Record<string, string | undefined>)[`EXPO_PUBLIC_${key}`];
  }
  // Vite client-side
  if (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env) {
    const env = (import.meta as unknown as { env: Record<string, string> }).env;
    return env[key] ?? env[`VITE_${key}`];
  }
  return undefined;
}

function detectEnv(): TZEnv {
  const nodeEnv = readEnv('NODE_ENV');
  if (nodeEnv === 'production') return 'production';
  return 'dev';
}

// ─── Init Options ───────────────────────────────────────────────────────────

export interface TZInitOptions {
  /** Organization slug. Falls back to TZ_ORG_ID env var. */
  orgSlug?: string;
  /** Storefront publishable key. Falls back to TZ_ORG_KEY env var. */
  orgKey?: string;
  /** Environment: 'production' | 'dev'. Auto-detected from NODE_ENV if omitted. */
  env?: TZEnv;
  /** Custom backend URL (overrides env-based URL). Falls back to TZ_API_URL env var. */
  baseUrl?: string;
  /** Storage key prefix (default: "tz"). Useful to avoid collisions between projects. */
  keyPrefix?: string;
  /** Custom token store (defaults to localStorage). */
  tokenStore?: TokenStore;
  /** Called when tokens expire and refresh fails — use for redirect to login. */
  onAuthExpired?: () => void;
}

// ─── Singleton TZ ───────────────────────────────────────────────────────────

let _client: TZClient | null = null;
let _sf: ScopedClient | null = null;
let _admin: ScopedClient | null = null;
let _sa: ScopedClient | null = null;
let _storefront: ReturnType<typeof createStorefront> | null = null;
let _adminNs: ReturnType<typeof createAdmin> | null = null;
let _superAdmin: ReturnType<typeof createSuperAdmin> | null = null;

function ensureInit() {
  if (!_client) throw new Error('TZ.init() must be called before using the SDK.');
}

/**
 * Build With Darsh SDK — Global singleton.
 *
 * Call `TZ.init()` once at app startup. Then use `TZ.storefront.*`, `TZ.admin.*`, `TZ.superAdmin.*`.
 */
export const TZ = {
  /**
   * Initialize the SDK. Call once at app startup.
   *
   * Auto-reads env vars:
   *   TZ_ORG_ID / NEXT_PUBLIC_TZ_ORG_ID    → orgSlug
   *   TZ_ORG_KEY / NEXT_PUBLIC_TZ_ORG_KEY   → orgKey (storefront publishable key)
   *   TZ_API_URL / NEXT_PUBLIC_TZ_API_URL   → custom backend URL
   *   NODE_ENV                               → 'production' uses api.work.withdarsh.com, else dev-api
   */
  init(options: TZInitOptions = {}) {
    const orgSlug = options.orgSlug ?? readEnv('TZ_ORG_ID') ?? '';
    const orgKey = options.orgKey ?? readEnv('TZ_ORG_KEY');
    const env = options.env ?? detectEnv();
    const baseUrl = options.baseUrl ?? readEnv('TZ_API_URL') ?? resolveBaseUrl(env);

    if (!orgSlug) {
      console.warn('[TZ SDK] No orgSlug provided and TZ_ORG_ID env var not found. Set it in .env or pass to TZ.init().');
    }

    const config: TZConfig = {
      baseUrl,
      orgSlug,
      keyPrefix: options.keyPrefix ?? 'tz',
      ...(orgKey != null ? { orgKey } : {}),
      ...(options.tokenStore != null ? { tokenStore: options.tokenStore } : {}),
      ...(options.onAuthExpired != null ? { onAuthExpired: options.onAuthExpired } : {}),
    };

    _client = new TZClient(config);

    // Storefront: prefix=/storefront, default scope=public, sends X-Org-Key
    _sf = _client.scoped('/storefront', 'public', true);
    // Admin: no prefix (routes are /users, /roles, etc.), default scope=staff, no X-Org-Key
    _admin = _client.scoped('', 'staff', false);
    // Super Admin: no prefix (routes are /admin/*), default scope=superadmin, no X-Org-Key
    _sa = _client.scoped('', 'superadmin', false);

    // Reset cached namespaces
    _storefront = null;
    _adminNs = null;
    _superAdmin = null;
  },

  /** The raw TZClient instance (for advanced use) */
  get client(): TZClient {
    ensureInit();
    return _client!;
  },

  /** Storefront namespace — all end-user-facing APIs */
  get storefront() {
    ensureInit();
    if (!_storefront) _storefront = createStorefront(_sf!);
    return _storefront;
  },

  /** Admin namespace — all staff/org-admin APIs */
  get admin() {
    ensureInit();
    if (!_adminNs) _adminNs = createAdmin(_client!, _admin!);
    return _adminNs;
  },

  /** Super Admin namespace — platform-wide management APIs */
  get superAdmin() {
    ensureInit();
    if (!_superAdmin) _superAdmin = createSuperAdmin(_client!, _sa!);
    return _superAdmin;
  },

  /** GET /health — Basic health check (PUBLIC) */
  health() {
    ensureInit();
    return _admin!.get<{ status: string }>('/health', 'public');
  },

  /** GET /health/detailed — Detailed health check with dependency status (USER) */
  healthDetailed() {
    ensureInit();
    return _admin!.get<{ status: string; database: string; redis: string }>('/health/detailed');
  },
};

// ─── Also export createTZ for non-singleton usage ────────────────────────────

export function createTZ(options: TZInitOptions = {}) {
  const orgSlug = options.orgSlug ?? readEnv('TZ_ORG_ID') ?? '';
  const orgKey = options.orgKey ?? readEnv('TZ_ORG_KEY');
  const env = options.env ?? detectEnv();
  const baseUrl = options.baseUrl ?? readEnv('TZ_API_URL') ?? resolveBaseUrl(env);

  const client = new TZClient({
    baseUrl,
    orgSlug,
    keyPrefix: options.keyPrefix ?? 'tz',
    ...(orgKey != null ? { orgKey } : {}),
    ...(options.tokenStore != null ? { tokenStore: options.tokenStore } : {}),
    ...(options.onAuthExpired != null ? { onAuthExpired: options.onAuthExpired } : {}),
  });

  const sf = client.scoped('/storefront', 'public', true);
  const admin = client.scoped('', 'staff', false);
  const sa = client.scoped('', 'superadmin', false);

  return {
    client,
    storefront: createStorefront(sf),
    admin: createAdmin(client, admin),
    superAdmin: createSuperAdmin(client, sa),
    health: () => admin.get<{ status: string }>('/health', 'public'),
    healthDetailed: () => admin.get<{ status: string; database: string; redis: string }>('/health/detailed'),
  };
}

// ─── Re-exports ─────────────────────────────────────────────────────────────

export { TZQuery, TZPaginatedQuery } from './query';
export type { RawResponse } from './query';
export { TZClient, ScopedClient } from './client';
export type { AuthScope } from './client';

// ─── DTO types (request shapes) ─────────────────────────────────────────────
export type * from './dto';
export type {
  // JSON primitives
  JsonPrimitive,
  JsonValue,
  JsonObject,
  // Structured sub-types
  NutritionData,
  TaxConfig,
  MovieCredits,
  RuleConfig,
  PlanFeatures,
  MealPlanItem,
  NotificationData,
  CatalogSizeVariation,
  // SDK Config
  TZConfig,
  TokenStore,
  ApiError,
  PaginationParams,
  PaginatedResponse,
  // Global Envelope Types
  ApiResponseEnvelope,
  ApiPaginatedEnvelope,
  ApiErrorEnvelope,
  ApiResult,
  ApiPaginatedResult,
  // Auth
  AuthTokens,
  EndUser,
  EndUserProfile,
  AuthResponse,
  StaffUser,
  StaffAuthResponse,
  // Catalog
  CatalogCategory,
  CatalogItem,
  CatalogItemVariant,
  CatalogOptionGroup,
  CatalogOption,
  // Cart
  Cart,
  CartLineItem,
  CartItemOption,
  // Orders
  Order,
  OrderItem,
  OrderType,
  PaymentMethod,
  OrderStatus,
  // Payments
  PaymentOrder,
  PaymentVerification,
  // Locations
  StoreLocation,
  LocationHours,
  // Delivery
  DeliveryCalculation,
  DeliveryTracking,
  // Loyalty
  LoyaltyAccount,
  LoyaltyTransaction,
  LoyaltyReward,
  LoyaltyRedemption,
  // Coupons
  CouponValidation,
  // Promotions
  Promotion,
  // Referrals
  ReferralInfo,
  ReferralValidation,
  // Reviews
  Review,
  // Gift Cards
  GiftCard,
  // Reservations
  ReservationSlot,
  Reservation,
  // Support
  SupportTicket,
  SupportReply,
  // Content
  ContentPost,
  // Addresses
  Address,
  // Notifications
  Notification,
  // Property
  PropertyType,
  PropertyBooking,
  PropertyAvailability,
  PropertyPriceResolution,
  // Movies
  Movie,
  MovieDetail,
  TmdbMovie,
  TmdbMovieDetail,
  // Wallet
  WalletPack,
  WalletBalance,
  WalletTransaction,
  // Watch Sessions (PPM)
  WatchSessionStatusType,
  WatchSessionResponse,
  WatchSessionStatus,
  WatchSessionSummary,
  WatchSessionHistoryItem,
  // Upload
  UploadResult,
  // Contact
  ContactMessage,
  // Config
  StorefrontConfig,
  // Student
  StudentPassStatus,
  StudentDiscount,
  DiscountPreview,
  Institution,
  // Inventory & Supply Chain
  Ingredient,
  StockAlert,
  WasteLog,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  AdminMealSubscription,
  // Meal Plans
  MealPlan,
  MealSubscription,
  // Help
  HelpArticle,
  // PlayFlix Room
  PlayFlixRoomStatus,
  PlayFlixRoomPrivacy,
  PlayFlixRoomVibe,
  PlayFlixRoomViewerMode,
  PlayFlixRoom,
  PlayFlixRoomViewer,
  PlayFlixRoomMessage,
  PlayFlixRoomPlaybackState,
  PlayFlixRoomJoinResponse,
  // Backwards-compatible aliases
  WatchRoomStatus,
  WatchRoomPrivacy,
  WatchRoomVibe,
  WatchRoomViewerMode,
  WatchRoom,
  WatchRoomViewer,
  WatchRoomMessage,
  WatchRoomPlaybackState,
  WatchRoomJoinResponse,
  // Host Earnings
  HostEarning,
  EarningsSummary,
  // Connected Sources
  ConnectedSource,
  GoogleDriveConnectUrl,
  // Admin
  AdminOrganization,
  Role,
  AuditLog,
  ApiKey,
  // Super Admin
  SuperAdminStats,
  SuperAdmin as SuperAdminUser,
  PlatformPlan,
  // Admin Dashboard
  AdminDashboardStats,
  AdminDashboardData,
  // Admin Loyalty
  AdminLoyaltyAccount,
  AdminLoyaltyData,
  // Admin Redemptions
  AdminRedemption,
  AdminFulfillResult,
  // Admin Delivery
  AdminDeliveryAgent,
  AdminDeliveryZone,
  // Admin Marketing
  AdminAffiliate,
  AdminPopupSettings,
  // Admin Finance
  AdminInvoice,
  AdminTaxSummary,
  AdminSettlement,
  AdminPayout,
  // Admin Broadcast
  AdminBroadcast,
  // Admin Scheduled Orders
  AdminScheduledOrder,
  // Admin Abandoned Carts
  AdminAbandonedCart,
  // Admin Waitlists
  AdminWaitlistEntry,
  AdminWaitlistGroup,
  // Admin Reservation Slots
  AdminReservationSlot,
  // Admin Orders (Extended)
  AdminOrder,
  AdminOrderDetail,
  // Admin Customers
  AdminCustomer,
  AdminCustomerDetail,
  // Admin Blog
  AdminBlogPost,
  // Admin Coupons
  AdminCoupon,
  // Admin Promotions
  AdminPromotion,
  // Admin Gift Cards
  AdminGiftCardTransaction,
  AdminGiftCard,
  // Admin Reservations
  AdminReservation,
  AdminReservationTable,
  // Admin Support Tickets
  AdminTicket,
  AdminTicketMessage,
  AdminTicketDetail,
  // Admin Locations
  AdminLocation,
  AdminLocationDetail,
  // Admin Settings
  AdminSetting,
  // Admin Student Passes
  AdminStudentPass,
  AdminStudentPassDetail,
  AdminStudentPassStats,
  // Admin Student Discounts
  AdminStudentDiscount,
  // Admin Institutions
  AdminInstitution,
  // Admin Reviews
  AdminReview,
  // Admin Help Articles
  AdminHelpArticle,
  // Admin Menu Items
  AdminMenuItem,
  AdminSyncLog,
  // Banking
  KycVerification,
  KycStatusResponse,
  BankAccount,
  BankAccountBalance,
  BankTransaction,
  Beneficiary,
  BankCard,
  FixedDeposit,
  FixedDepositClosure,
  ScheduledTransfer,
  BillPayment,
  SpendingCategory,
  SpendingBreakdownItem,
  SpendingBreakdown,
  MonthlyTrendItem,
  MonthlyTrends,
  CashFlowSummary,
  BudgetItem,
  AnomalyAlert,
  NetWorthSnapshot,
  // Banking Enum Types
  KycStatus,
  KycDocumentType,
  BankAccountType,
  BankAccountStatus,
  TransferMode,
  TransferStatus,
  CardType,
  CardVariant,
  CardStatus,
  ScheduledTransferFrequency,
  ScheduledTransferStatus,
  BillPaymentStatus,
  FixedDepositStatus,
  // SubRadar — Subscription Intelligence
  GmailAccount,
  TrackedSubscription,
  SubscriptionAlert,
  SubscriptionSuggestion,
  SubRadarSummary,
  SubRadarTrend,
  TrackedBillingCycle,
  TrackedSubSource,
  TrackedSubStatus,
  SubAlertType,
  SubSuggestionType,
  SubSuggestionStatus,
  // Prisma Enum Mirror Types
  OrgStatus,
  SuperAdminRole,
  UserStatus,
  EndUserStatus,
  SegmentType,
  ApiKeyEnv,
  OauthProvider,
  OtpType,
  NotificationType,
  NotificationStatus,
  TemplateChannel,
  CampaignChannel,
  CampaignStatus,
  PaymentProviderType,
  ProductType,
  SubscriptionStatus,
  PaymentStatus,
  RefundStatus,
  InvoiceType,
  InvoiceStatus,
} from './types';

// Marketplace types
export type {
  MarketplaceProfile,
  MarketplaceOpportunity,
  MarketplaceBooking,
  MarketplaceReview,
  MarketplaceOnboarding,
  CreateProfileInput,
  UpdateProfileInput,
  CreateOpportunityInput,
  CreateBookingInput,
  CreateReviewInput,
  SearchOpportunitiesInput,
  SaveOnboardingInput,
} from './storefront/marketplace';

// App Subscription types
export type {
  AppSubscription,
  CreateSubscriptionInput,
  ActivateSubscriptionInput,
} from './storefront/subscriptions';
