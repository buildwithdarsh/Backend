// ─── JSON Primitive ─────────────────────────────────────────────────────────
// Recursive type for arbitrary JSON values (replaces `unknown` for JSON fields)

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

// ─── Structured JSON Sub-types ─────────────────────────────────────────────

/** Nutrition info per 100g or per serving */
export interface NutritionData {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  servingSize?: string;
  [key: string]: string | number | undefined;
}

/** Tax configuration for a catalog item */
export interface TaxConfig {
  taxRate?: number;
  taxType?: 'percentage' | 'fixed';
  hsnCode?: string;
  gstRate?: number;
  cessRate?: number;
  inclusiveOfTax?: boolean;
  [key: string]: string | number | boolean | undefined;
}

/** Movie credits with cast/crew arrays */
export interface MovieCredits {
  cast: Array<{ name: string; character?: string; photoUrl?: string | null }>;
  crew: Array<{ name: string; role: string; photoUrl?: string | null }>;
}

/** Loyalty/Promotion rule config */
export interface RuleConfig {
  type?: string;
  value?: number;
  minOrder?: number;
  maxDiscount?: number;
  applicableItems?: string[];
  [key: string]: string | number | boolean | string[] | undefined;
}

/** Plan features map */
export interface PlanFeatures {
  maxProducts?: number;
  maxUsers?: number;
  maxLocations?: number;
  customDomain?: boolean;
  analytics?: boolean;
  apiAccess?: boolean;
  prioritySupport?: boolean;
  [key: string]: string | number | boolean | undefined;
}

/** Meal plan item schedule */
export interface MealPlanItem {
  day: number;
  meal: string;
  itemId?: string;
  itemName?: string;
}

/** Notification action data */
export interface NotificationData {
  actionUrl?: string;
  orderId?: string;
  bookingId?: string;
  type?: string;
  [key: string]: string | undefined;
}

/** Size variation for catalog items */
export interface CatalogSizeVariation {
  id: string;
  name: string;
  groupName: string;
  price: number;
  inStock: boolean;
  sortOrder: number;
}

// ─── SDK Configuration ──────────────────────────────────────────────────────

export interface TZConfig {
  /** Backend base URL (e.g. https://api.work.withdarsh.com) */
  baseUrl: string;
  /** Organization slug sent as X-Org-Slug header */
  orgSlug: string;
  /** Storefront publishable key sent as X-Org-Key header (required for storefront routes) */
  orgKey?: string;
  /** Custom token store (defaults to localStorage) */
  tokenStore?: TokenStore;
  /** Storage key prefix to avoid collisions between projects (default: "tz") */
  keyPrefix?: string;
  /** Called when tokens are cleared (401 after failed refresh) — use for redirect to login */
  onAuthExpired?: () => void;
}

// ─── Token Storage ──────────────────────────────────────────────────────────

export interface TokenStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

// ─── API Error ──────────────────────────────────────────────────────────────

export interface ApiError extends Error {
  status: number;
  data?: JsonValue;
}

// ─── Auth Types ─────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** EndUser as returned by all auth flows (register, login, verifyOtp, completeSignup, socialLogin) */
export interface EndUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  orgId: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  onboardingStep: number;
  avatarUrl: string | null;
  referralCode: string | null;
  attributes: Record<string, unknown> | null;
}

/** EndUser profile as returned by GET /storefront/auth/profile (includes createdAt) */
export interface EndUserProfile extends EndUser {
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: EndUser;
  /** Only present on login — the org's configured primary login identifier */
  primaryLoginId?: string;
}

/** Backend AuthUserDto — roles is string[] (role IDs) */
export interface StaffUser {
  id: string;
  email: string;
  name: string;
  orgId: string;
  roles: string[];
}

export interface StaffAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: StaffUser;
}

// ─── Pagination ─────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ─── Global Response Envelope Types ──────────────────────────────────────────

export interface ApiResponseEnvelope<T> {
  success: true;
  data: T;
  message: string | null;
  meta: { timestamp: string; requestId: string } | null;
}

export interface ApiPaginatedEnvelope<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  message: string | null;
  meta: { timestamp: string; requestId: string } | null;
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details: string[] | JsonObject | null;
  };
  meta: { timestamp: string; requestId: string } | null;
}

export type ApiResult<T> = ApiResponseEnvelope<T> | ApiErrorEnvelope;
export type ApiPaginatedResult<T> = ApiPaginatedEnvelope<T> | ApiErrorEnvelope;

// ─── Catalog ────────────────────────────────────────────────────────────────

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  rank: number;
  parentId: string | null;
  isActive: boolean;
}

export interface CatalogItemVariant {
  id: string;
  variantType: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  nutritionData: NutritionData | null;
  isActive: boolean;
}

export interface CatalogOptionGroup {
  id: string;
  name: string;
  minSelection: number;
  maxSelection: number;
  rank: number;
  options: CatalogOption[];
}

export interface CatalogOption {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
  isActive: boolean;
  rank: number;
}

export interface CatalogItem {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  category?: CatalogCategory;
  dietType: string | null;
  inStock: boolean;
  isFeatured: boolean;
  isNew: boolean;
  sortOrder: number;
  allergens: string[];
  tags: string[];
  taxConfig: TaxConfig | null;
  metadata: JsonObject | null;
  sizeVariations: CatalogSizeVariation[];
  variants: CatalogItemVariant[];
  optionGroups: CatalogOptionGroup[];
}

// ─── Cart ───────────────────────────────────────────────────────────────────

export interface CartItemOption {
  optionId: string;
  quantity?: number;
}

export interface CartLineItem {
  id: string;
  itemId: string;
  catalogItem: CatalogItem;
  sizeVariationId: string | null;
  variantType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options: CartItemOption[];
}

export interface Cart {
  id: string;
  lineItems: CartLineItem[];
  subtotal: number;
  totalItems: number;
}

// ─── Orders ─────────────────────────────────────────────────────────────────

export type OrderType = 'delivery' | 'pickup' | 'dine_in';
export type PaymentMethod = 'online' | 'cod' | 'wallet';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'picked_up' | 'completed' | 'cancelled' | 'refunded';

export interface OrderItem {
  id: string;
  itemId: string;
  itemName: string;
  variantType: string;
  sizeVariationId: string | null;
  sizeVariationName: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxAmount: number;
  metadata: JsonObject | null;
  options: { id: string; optionId: string; optionName: string; quantity: number; unitPrice: number }[];
}

export interface Order {
  id: string;
  orderNumber: string;
  endUserId: string;
  addressId: string | null;
  locationId: string | null;
  variantType: string;
  status: string;
  orderType: string;
  paymentMethod: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  deliveryFee: number;
  packingCharges: number;
  serviceCharge: number;
  totalAmount: number;
  couponCode: string | null;
  loyaltyEarned: number;
  loyaltyRedeemed: number;
  tokenNumber: number | null;
  specialInstructions: string | null;
  scheduledAt: string | null;
  channel: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

// ─── Payments ───────────────────────────────────────────────────────────────

export interface PaymentOrder {
  id: string;
  productId: string;
  amount: number;
  currency: string;
  providerOrderId?: string;
  status: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentVerification {
  paymentId: string;
  orderId: string;
  status: string;
}

// ─── Locations ──────────────────────────────────────────────────────────────

export interface StoreLocation {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  isPrimary: boolean;
  timezone: string | null;
  metadata: JsonObject | null;
  hours: LocationHours[];
}

export interface LocationHours {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

// ─── Delivery ───────────────────────────────────────────────────────────────

export interface DeliveryCalculation {
  fee: number;
  estimatedMinutes: number;
  isDeliverable: boolean;
}

export interface DeliveryTracking {
  orderId: string;
  status: string;
  estimatedDelivery: string | null;
  trackingUrl: string | null;
  timeline: Array<{ status: string; timestamp: string; note: string | null }>;
}

// ─── Loyalty ────────────────────────────────────────────────────────────────

export interface LoyaltyAccount {
  id: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  tier: string | null;
}

export interface LoyaltyTransaction {
  id: string;
  type: string;
  points: number;
  description: string;
  createdAt: string;
}

export interface LoyaltyReward {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  pointsCost: number;
  type: string;
  config: RuleConfig | null;
  imageUrl: string | null;
  isActive: boolean;
}

export interface LoyaltyRedemption {
  id: string;
  rewardId: string;
  reward: LoyaltyReward;
  pointsSpent: number;
  status: string;
  redeemedAt: string;
}

// ─── Coupons ────────────────────────────────────────────────────────────────

export interface CouponValidation {
  valid: boolean;
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  calculatedDiscount: number;
  message: string;
}

// ─── Promotions ─────────────────────────────────────────────────────────────

export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  type: string;
  config: RuleConfig | null;
  priority: number;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
}

// ─── Referrals ──────────────────────────────────────────────────────────────

export interface ReferralInfo {
  code: string;
  referralsCount: number;
  rewardsEarned: number;
}

export interface ReferralValidation {
  valid: boolean;
  message: string;
}

// ─── Reviews ────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  catalogItemId: string | null;
  commerceOrderId: string | null;
  endUserId: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  helpfulCount: number;
  createdAt: string;
}

// ─── Gift Cards ─────────────────────────────────────────────────────────────

export interface GiftCard {
  id: string;
  code: string;
  balance: number;
  originalAmount: number;
  status: string;
  expiresAt: string | null;
}

// ─── Reservations ───────────────────────────────────────────────────────────

export interface ReservationSlot {
  time: string;
  available: boolean;
  capacity: number;
}

export interface Reservation {
  id: string;
  date: string;
  startTime: string;
  endTime: string | null;
  partySize: number | null;
  customerName: string;
  customerPhone: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

// ─── Support ────────────────────────────────────────────────────────────────

export interface SupportTicket {
  id: string;
  subject: string;
  category: string | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportReply {
  id: string;
  body: string;
  isStaff: boolean;
  createdAt: string;
}

// ─── Content ────────────────────────────────────────────────────────────────

export interface ContentPost {
  id: string;
  title: string;
  slug: string;
  h1: string | null;
  body: string;
  excerpt: string | null;
  imageUrl: string | null;
  featuredImage: string | null;
  ogImage: string | null;
  category: string | null;
  tags: string[];
  status: string;
  author: string | null;
  authorId: string | null;
  metaDescription: string | null;
  keywords: string[];
  canonical: string | null;
  datePublished: string | null;
  dateModified: string | null;
  metadata: JsonObject | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Addresses ──────────────────────────────────────────────────────────────

export interface Address {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  pincode: string;
  country: string;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
}

// ─── Notifications ──────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  data: NotificationData | null;
  createdAt: string;
}

// ─── Property ───────────────────────────────────────────────────────────────

export interface PropertyType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number | null;
  maxGuests: number | null;
  bedType: string | null;
  unitSize: string | null;
  images: string[];
  amenities: Array<{ id: string; name: string; icon: string | null }>;
  status: string;
  metadata: JsonObject | null;
}

export interface PropertyBooking {
  id: string;
  bookingReference: string;
  propertyTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestCount: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  baseAmount: number;
  taxAmount: number;
  discountAmount: number;
  extraGuestCharge: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  couponCode: string | null;
  specialRequests: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyAvailability {
  date: string;
  available: number;
  total: number;
  price: number;
}

export interface PropertyPriceResolution {
  totalPrice: number;
  nights: number;
  breakdown: Array<{ date: string; price: number }>;
}

// ─── Movies ─────────────────────────────────────────────────────────────────

export interface Movie {
  id: string;
  title: string;
  originalTitle: string | null;
  slug: string;
  synopsis: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseYear: number | null;
  durationMinutes: number | null;
  contentRating: string | null;
  languages: string[];
  subtitles: string[];
  genres: string[];
  moods: string[];
}

export interface MovieDetail extends Movie {
  trailerUrl: string | null;
  streamUrl: string | null;
  rentPriceInr: number | null;
  buyPriceInr: number | null;
  rentalHours: number | null;
  rentalMaxPlays: number | null;
  credits: MovieCredits | null;
}

// ─── TMDB ───────────────────────────────────────────────────────────────────

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

export interface TmdbMovieDetail extends TmdbMovie {
  runtime: number | null;
  genres: Array<{ id: number; name: string }>;
  credits?: { cast: Array<{ name: string; character: string; profile_path: string | null }> };
}

// ─── Wallet ─────────────────────────────────────────────────────────────────

export interface WalletPack {
  id: string;
  name: string;
  amount: number;
  bonus: number;
  desc: string | null;
  isPopular: boolean;
}

export interface WalletBalance {
  balancePaise: number;
}

export interface WalletTransaction {
  id: string;
  type: 'topup' | 'debit' | 'refund';
  amountPaise: number;
  balanceAfterPaise: number;
  description: string | null;
  sessionId: string | null;
  createdAt: string;
}

// ─── Watch Sessions (PPM) ───────────────────────────────────────────────────

export type WatchSessionStatusType = 'active' | 'paused' | 'capped' | 'ended' | 'insufficient_funds';

export interface WatchSessionResponse {
  sessionId: string;
  tmdbId: number;
  movieTitle: string;
  ratePerMinPaise: number;
  meterCapPaise: number;
  status: WatchSessionStatusType;
  balancePaise: number;
}

export interface WatchSessionStatus {
  sessionId: string;
  status: WatchSessionStatusType;
  totalBilledPaise: number;
  minutesBilled: number;
  ratePerMinPaise: number;
  meterCapPaise: number;
  balancePaise: number;
}

export interface WatchSessionSummary {
  sessionId: string;
  movieTitle: string;
  minutesBilled: number;
  totalBilledPaise: number;
  meterCapPaise: number;
  hitCap: boolean;
  balancePaise: number;
}

export interface WatchSessionHistoryItem {
  id: string;
  tmdbId: number;
  movieTitle: string;
  ratePerMinPaise: number;
  meterCapPaise: number;
  totalBilledPaise: number;
  minutesBilled: number;
  status: WatchSessionStatusType;
  rating: number | null;
  startedAt: string;
  endedAt: string | null;
}

// ─── PlayFlix Room ─────────────────────────────────────────────────────────

export type PlayFlixRoomStatus = 'waiting' | 'live' | 'ended';
export type PlayFlixRoomPrivacy = 'public' | 'private';
export type PlayFlixRoomVibe = 'chill' | 'serious' | 'party' | 'commentary';
export type PlayFlixRoomViewerMode = 'sync' | 'solo';

export interface PlayFlixRoom {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  hostAvatarUrl: string | null;
  tmdbId: number;
  movieTitle: string;
  posterUrl: string | null;
  gdriveFileId: string;
  privacy: PlayFlixRoomPrivacy;
  vibe: PlayFlixRoomVibe;
  ratePerMinPaise: number;
  maxViewers: number;
  viewerCount: number;
  syncCount: number;
  soloCount: number;
  status: PlayFlixRoomStatus;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}

export interface PlayFlixRoomViewer {
  id: string;
  endUserId: string;
  name: string;
  avatarUrl: string | null;
  mode: PlayFlixRoomViewerMode;
  joinedAt: string;
}

export interface PlayFlixRoomMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  mode: PlayFlixRoomViewerMode;
  isHost: boolean;
  timestamp: number;
}

export interface PlayFlixRoomPlaybackState {
  playing: boolean;
  currentTime: number;
  playbackRate: number;
  updatedAt: number;
}

export interface PlayFlixRoomJoinResponse {
  room: PlayFlixRoom;
  viewers: PlayFlixRoomViewer[];
  playbackState: PlayFlixRoomPlaybackState | null;
  recentMessages: PlayFlixRoomMessage[];
  ablyToken: string;
}

// Backwards-compatible aliases
/** @deprecated Use PlayFlixRoomStatus */
export type WatchRoomStatus = PlayFlixRoomStatus;
/** @deprecated Use PlayFlixRoomPrivacy */
export type WatchRoomPrivacy = PlayFlixRoomPrivacy;
/** @deprecated Use PlayFlixRoomVibe */
export type WatchRoomVibe = PlayFlixRoomVibe;
/** @deprecated Use PlayFlixRoomViewerMode */
export type WatchRoomViewerMode = PlayFlixRoomViewerMode;
/** @deprecated Use PlayFlixRoom */
export type WatchRoom = PlayFlixRoom;
/** @deprecated Use PlayFlixRoomViewer */
export type WatchRoomViewer = PlayFlixRoomViewer;
/** @deprecated Use PlayFlixRoomMessage */
export type WatchRoomMessage = PlayFlixRoomMessage;
/** @deprecated Use PlayFlixRoomPlaybackState */
export type WatchRoomPlaybackState = PlayFlixRoomPlaybackState;
/** @deprecated Use PlayFlixRoomJoinResponse */
export type WatchRoomJoinResponse = PlayFlixRoomJoinResponse;

// ─── Host Earnings ─────────────────────────────────────────────────────────

export interface HostEarning {
  id: string;
  roomId: string;
  movieTitle: string;
  posterUrl: string | null;
  totalViewerMinutes: number;
  grossPaise: number;
  hostSharePaise: number;
  platformSharePaise: number;
  status: 'pending' | 'paid';
  createdAt: string;
}

export interface EarningsSummary {
  totalPaise: number;
  pendingPaise: number;
  paidPaise: number;
  totalRooms: number;
}

// ─── Connected Sources ─────────────────────────────────────────────────────

export interface ConnectedSource {
  provider: string;
  email: string | null;
  connectedAt: string;
}

export interface GoogleDriveConnectUrl {
  url: string;
}

// ─── Upload ─────────────────────────────────────────────────────────────────

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}

// ─── Contact ────────────────────────────────────────────────────────────────

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  service: string | null;
  budget: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Org Config (public storefront) ─────────────────────────────────────────

export interface StorefrontConfig {
  orgName: string;
  orgSlug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  features: Record<string, boolean>;
  auth: {
    primaryLoginId: string;
    otpLength: number;
    socialProviders: string[];
  };
  [key: string]: JsonValue;
}

// ─── Student ────────────────────────────────────────────────────────────────

export interface StudentPassStatus {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  studentIdNumber: string;
  idImageUrl: string | null;
  expiresAt: string | null;
  createdAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  institution: { id: string; name: string } | null;
}

export interface StudentDiscount {
  id: string;
  name: string;
  description: string | null;
  institutionId: string | null;
  institution: { id: string; name: string } | null;
  discountType: string;
  discountValue: number;
  maxDiscountCap: number | null;
  minOrderAmount: number | null;
  isActive: boolean;
  validFrom: string | null;
  validTo: string | null;
  createdAt: string;
}

export interface DiscountPreview {
  applicable: boolean;
  discountAmount: number;
  discountName: string | null;
  message: string | null;
}

export interface Institution {
  id: string;
  name: string;
}

// ─── Meal Plans ─────────────────────────────────────────────────────────────

export interface MealPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
  items: MealPlanItem[] | null;
  isActive: boolean;
  subscriptionsCount: number;
  createdAt: string;
}

export interface MealSubscription {
  id: string;
  mealPlanId: string;
  mealPlan: MealPlan;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

// ─── Inventory & Supply Chain ───────────────────────────────────────────────

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  costPerUnit: number;
  supplierId: string | null;
  supplier: { name: string } | null;
  updatedAt: string;
  createdAt: string;
}

export interface StockAlert {
  id: string;
  ingredientId: string;
  ingredientName: string;
  type: string;
  message: string;
  isResolved: boolean;
  createdAt: string;
}

export interface WasteLog {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  reason: string;
  costImpact: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string | null;
  leadTimeDays: number;
  isActive: boolean;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: string;
  totalAmount: number;
  items: PurchaseOrderItem[];
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface AdminMealSubscription {
  id: string;
  userName: string | null;
  userPhone: string | null;
  mealPlanName: string;
  status: string;
  startDate: string;
  endDate: string;
  deliveryTime: string | null;
  createdAt: string;
}

// ─── Help Articles ──────────────────────────────────────────────────────────

export interface HelpArticle {
  id: string;
  slug: string;
  title: string;
  body: string;
  category: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
}

// ─── Admin Types ────────────────────────────────────────────────────────────

export interface AdminOrganization {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string | null;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  isDefault: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  details: JsonObject | null;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  environment: string;
  scopes: string[];
  rateLimitPerMinute: number | null;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

// ─── Super Admin Types ──────────────────────────────────────────────────────

export interface SuperAdminStats {
  totalOrgs: number;
  totalUsers: number;
  totalEndUsers: number;
  totalCampaigns: number;
  totalRevenue: number;
}

export interface SuperAdmin {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface PlatformPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: PlanFeatures;
  isActive: boolean;
}

// ─── Admin Dashboard ─────────────────────────────────────────────────────

export interface AdminDashboardStats {
  totalOrders: number;
  ordersToday: number;
  totalRevenue: number;
  revenueToday: number;
  activeOrders: number;
  totalUsers: number;
  totalMenuItems: number;
}

export interface AdminDashboardData {
  stats: AdminDashboardStats;
  ordersByStatus: { status: string; count: number }[];
  recentOrders: { id: string; status: string; customerName: string; totalAmount: number; createdAt: string; mode: string; orderType: string }[];
}

// ─── Admin Loyalty (Extended) ────────────────────────────────────────────

export interface AdminLoyaltyAccount {
  id: string;
  balance: number;
  totalEarned: number;
  totalRedeemed: number;
  tier: string;
  user: { id: string; name: string | null; email: string | null; phone: string | null };
  transactions: { id: string; type: string; coins: number; description: string; createdAt: string }[];
}

export interface AdminLoyaltyData {
  accounts: AdminLoyaltyAccount[];
  summary: { totalAccounts: number; totalBalance: number; totalEarned: number; totalRedeemed: number };
  tierCounts: { tier: string; count: number }[];
}

// ─── Rewards / Redemptions ───────────────────────────────────────────────

export interface AdminRedemption {
  id: string;
  code: string;
  rewardId: string;
  rewardName: string;
  coins: number;
  status: string;
  createdAt: string;
  fulfilledAt: string | null;
  user: { id: string; name: string | null; phone: string | null; email: string | null };
}

export interface AdminFulfillResult {
  success: boolean;
  message: string;
  redemption?: { rewardName?: string; customerName?: string; coins?: number };
}

// ─── Delivery Agents & Zones ─────────────────────────────────────────────

export interface AdminDeliveryAgent {
  id: string;
  name: string;
  phone: string;
  status: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminDeliveryZone {
  id: string;
  name: string;
  pincodes: string[];
  deliveryFee: number;
  isActive: boolean;
  createdAt: string;
}

// ─── Marketing ───────────────────────────────────────────────────────────

export interface AdminAffiliate {
  id: string;
  utmSource: string;
  utmCampaign: string;
  clicks: number;
  conversions: number;
  conversionRate: number;
}

export interface AdminPopupSettings {
  id: string;
  content: string;
  trigger: string;
  isActive: boolean;
}

// ─── Finance ─────────────────────────────────────────────────────────────

export interface AdminInvoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  total: number;
  createdAt: string;
}

export interface AdminTaxSummary {
  sgst: number;
  cgst: number;
  igst: number;
  totalTax: number;
  totalTaxableAmount: number;
}

export interface AdminSettlement {
  id: string;
  paymentId: string;
  amount: number;
  status: string;
  method: string;
  settledAt: string;
}

export interface AdminPayout {
  id: string;
  agentId: string;
  agentName: string;
  amount: number;
  period: string;
  orderCount: number;
  isPaid: boolean;
  createdAt: string;
}

// ─── Notifications Broadcast ─────────────────────────────────────────────

export interface AdminBroadcast {
  id: string;
  title: string;
  body: string;
  channel: string;
  segment: string;
  sentCount: number;
  openCount: number;
  status: string;
  scheduledAt: string | null;
  createdAt: string;
}

// ─── Scheduled Orders ────────────────────────────────────────────────────

export interface AdminScheduledOrder {
  id: string;
  orderID: string;
  customerName: string;
  customerPhone: string;
  scheduledAt: string;
  orderType: string;
  status: string;
  totalAmount: number;
  isCatering: boolean;
  createdAt: string;
}

// ─── Abandoned Carts ─────────────────────────────────────────────────────

export interface AdminAbandonedCart {
  id: string;
  email: string | null;
  phone: string | null;
  subtotal: number;
  itemCount: number;
  recoveryEmailSent: boolean;
  recoveredAt: string | null;
  createdAt: string;
}

// ─── Waitlists ───────────────────────────────────────────────────────────

export interface AdminWaitlistEntry {
  id: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

export interface AdminWaitlistGroup {
  menuItemId: string;
  menuItemName: string;
  menuItemImage: string | null;
  count: number;
  entries: AdminWaitlistEntry[];
}

// ─── Reservation Slots ──────────────────────────────────────────────────

export interface AdminReservationSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCovers: number;
  isActive: boolean;
}

// ─── Admin Order (Extended) ──────────────────────────────────────────────

export interface AdminOrder {
  id: string;
  status: string;
  posOrderId: string | null;
  mode: string;
  orderType: string;
  customerName: string;
  customerPhone: string;
  subtotal: number;
  totalAmount: number;
  paymentMethod: string | null;
  couponCode: string | null;
  itemCount: number;
  createdAt: string;
}

export interface AdminOrderDetail {
  id: string;
  status: string;
  posOrderId: string | null;
  posRawStatus: string | null;
  mode: string;
  orderType: string;
  paymentMethod: string | null;
  paymentType: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount: number;
  packingCharges: number;
  serviceCharge: number;
  totalAmount: number;
  specialInstructions: string | null;
  couponCode: string | null;
  coinsEarned: number;
  coinsRedeemed: number;
  createdAt: string;
  items: {
    id: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    mode: string;
    addons: { addonName: string; price: number; quantity: number }[];
  }[];
  statusHistory: { status: string; source: string; note: string | null; createdAt: string }[];
  address: { line1: string; line2: string | null; city: string; pincode: string } | null;
  user: { id: string; name: string | null; email: string | null; phone: string | null };
}

// ─── Admin Customer ──────────────────────────────────────────────────────

export interface AdminCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  ordersCount: number;
  loyaltyTier: string | null;
  createdAt: string;
}

export interface AdminCustomerDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  loyaltyTier: string | null;
  ordersCount: number;
  createdAt: string;
  recentOrders: { id: string; status: string; totalAmount: number; itemCount: number; createdAt: string }[];
  loyalty: { balance: number; tier: string; lifetimePoints: number } | null;
  reviews: { id: string; rating: number; comment: string | null; status: string; createdAt: string }[];
  supportTickets: { id: string; subject: string; status: string; createdAt: string }[];
  notes: { id: string; content: string; author: string; createdAt: string }[];
}

// ─── Admin Blog Post ─────────────────────────────────────────────────────

export interface AdminBlogPost {
  id: string;
  slug: string;
  title: string;
  h1: string;
  excerpt: string | null;
  featuredImage: string | null;
  status: string;
  category: string | null;
  tags: string;
  author: string;
  viewCount: number;
  datePublished: string | null;
  dateModified: string | null;
  createdAt: string;
  _count: { media: number; reviews: number };
}

// ─── Admin Coupon ────────────────────────────────────────────────────────

export interface AdminCoupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  maxUsageTotal: number | null;
  maxUsagePerUser: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  applicableModes: string;
  usageCount: number;
  createdAt: string;
}

// ─── Admin Promotion (Extended) ──────────────────────────────────────────

export interface AdminPromotion {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  type: string;
  imageUrl: string | null;
  couponCode: string | null;
  isActive: boolean;
  priority: number;
  startDate: string | null;
  endDate: string | null;
  config: string | null;
  createdAt: string;
}

// ─── Admin Gift Card (Extended) ──────────────────────────────────────────

export interface AdminGiftCardTransaction {
  id: string;
  type: string;
  amount: number;
  orderId: string | null;
  createdAt: string;
}

export interface AdminGiftCard {
  id: string;
  code: string;
  denomination: number;
  balance: number;
  purchaserName: string | null;
  purchaserEmail: string | null;
  recipientName: string | null;
  recipientEmail: string | null;
  recipientPhone: string | null;
  personalMessage: string | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  transactions?: AdminGiftCardTransaction[];
}

// ─── Admin Reservation ──────────────────────────────────────────────────

export interface AdminReservation {
  id: string;
  guestName: string;
  guestPhone: string | null;
  guestEmail: string | null;
  partySize: number;
  date: string;
  timeSlot: string;
  status: string;
  table: string | null;
  notes: string | null;
  createdAt: string;
}

// ─── Admin Reservation Table ─────────────────────────────────────────────

export interface AdminReservationTable {
  id: string;
  tableNumber: string;
  capacity: number;
  locationId: string;
  locationName?: string;
  isActive: boolean;
}

// ─── Admin Support Ticket (Extended) ─────────────────────────────────────

export interface AdminTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerEmail: string | null;
  subject: string;
  category: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  createdAt: string;
}

export interface AdminTicketMessage {
  id: string;
  body: string;
  sender: string;
  senderType: string;
  senderName: string;
  createdAt: string;
}

export interface AdminTicketDetail {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  subject: string;
  category: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  orderId: string | null;
  messages: AdminTicketMessage[];
  createdAt: string;
  updatedAt: string;
}

// ─── Admin Location (Extended) ───────────────────────────────────────────

export interface AdminLocation {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  isPrimary: boolean;
  createdAt: string;
}

export interface AdminLocationDetail extends AdminLocation {
  hours: { day: number; open: string; close: string; isClosed: boolean }[];
  zones: AdminDeliveryZone[];
  menuItemIds: string[];
}

// ─── Admin Setting ───────────────────────────────────────────────────────

export interface AdminSetting {
  key: string;
  value: string | number | boolean;
  type: string;
  label: string;
  description: string | null;
  group: string;
}

// ─── Admin Student Pass (Extended) ───────────────────────────────────────

export interface AdminStudentPass {
  id: string;
  status: string;
  studentIdNumber: string;
  idImageUrl: string | null;
  institutionId: string | null;
  institutionName: string | null;
  userName: string | null;
  userPhone: string | null;
  userEmail: string | null;
  flagged: boolean;
  expiresAt: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: { id: string; name: string | null; email: string | null; phone: string | null };
  institution: { id: string; name: string } | null;
}

export interface AdminStudentPassDetail extends AdminStudentPass {
  rejectionReason: string | null;
  autoVerified: boolean;
  year: string | null;
  aadhaarLast4: string | null;
  internalNote: string | null;
  user: { id: string; name: string | null; email: string | null; phone: string | null };
  institution: {
    id: string;
    name: string;
    shortCode: string;
    emailDomain: string | null;
    requiresManualReview: boolean;
    customValidityDays: number | null;
  } | null;
  fraudSignals: { dailyUsageCount: number };
  usageHistory: { id: string; date: string; orderId: string; discountAmount: number }[];
}

export interface AdminStudentPassStats {
  totalByStatus: { status: string; count: number }[];
  autoVerifiedPct: number;
  pendingCount: number;
  avgReviewTimeMs: number;
  topInstitutions: { id: string; name: string; activePassCount: number }[];
  topDiscountRules: { id: string; name: string; totalDiscountGiven: number }[];
}

// ─── Admin Student Discount (Extended) ───────────────────────────────────

export interface AdminStudentDiscount {
  id: string;
  name: string;
  description: string | null;
  institutionId: string | null;
  institution: { id: string; name: string } | null;
  priority: number;
  isActive: boolean;
  discountType: string;
  discountValue: number | null;
  maxDiscountCap: number | null;
  minDiscountFloor: number | null;
  maxDiscountPctOfOrder: number | null;
  minOrderAmount: number | null;
  maxOrderAmount: number | null;
  minItemCount: number | null;
  maxItemCount: number | null;
  orderTypes: string | null;
  cartModes: string | null;
  scope: string | null;
  categoryIds: string | null;
  itemIds: string | null;
  exclusionCategoryIds: string | null;
  exclusionItemIds: string | null;
  applicableModes: string | null;
  applicableCategories: string[] | null;
  validFrom: string | null;
  validTo: string | null;
  daysOfWeek: string | null;
  timeFrom: string | null;
  timeTo: string | null;
  blackoutDates: string | null;
  maxUsageTotal: number | null;
  maxUsagePerUser: number | null;
  maxUsagePerDay: number | null;
  maxUsagePerUserPerDay: number | null;
  maxUsagePerUserPerWeek: number | null;
  maxUsagePerUserPerMonth: number | null;
  stackWithCoupons: boolean;
  stackWithPromotions: boolean;
  stackWithLoyalty: boolean;
  stackWithOtherStudentDiscounts: boolean;
  earnLoyaltyCoins: boolean;
  loyaltyMultiplier: number | null;
  totalUses: number;
  totalDiscountGiven: number;
  createdAt: string;
  [key: string]: JsonValue;
}

// ─── Admin Institution (Extended) ────────────────────────────────────────

export interface AdminInstitution {
  id: string;
  name: string;
  shortCode: string;
  emailDomain: string | null;
  logoUrl: string | null;
  customValidityDays: number | null;
  requiresManualReview: boolean;
  isActive: boolean;
  passCount: number;
  _count?: { studentPasses: number };
  createdAt: string;
}

// ─── Admin Review (Extended) ─────────────────────────────────────────────

export interface AdminItemRating {
  itemName: string;
  rating: number;
  comment: string | null;
}

export interface AdminReview {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  orderNumber: string | null;
  orderId: string | null;
  photos: string[] | null;
  itemRatings: AdminItemRating[] | null;
  item: { id: string; name: string; image: string | null } | null;
  createdAt: string;
}

// ─── Admin Help Article (Extended) ───────────────────────────────────────

export interface AdminHelpArticle {
  id: string;
  slug: string;
  title: string;
  body: string;
  category: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
}

// ─── Admin Menu Item ─────────────────────────────────────────────────────

export interface AdminMenuItem {
  id: string;
  posItemId: string;
  categoryId: string;
  category: { id: string; name: string };
  diet: string;
  inStock: boolean;
  sortOrder: number;
  classicName: string;
  classicDescription: string;
  classicPrice: number;
  classicCalories: number;
  healthyName: string;
  healthyDescription: string;
  healthyPrice: number;
  healthyCalories: number;
  isBestseller: boolean;
  isNew: boolean;
  variations: { id: string; name: string; groupName: string; price: number; inStock: boolean }[];
  addonGroups: { id: string; name: string; minSelection: number; maxSelection: number; addons: { id: string; name: string; price: number; inStock: boolean }[] }[];
}

export interface AdminSyncLog {
  id: string;
  source: string;
  success: boolean;
  itemCount: number;
  errorMsg: string | null;
  duration: number | null;
  createdAt: string;
}

// ─── Prisma Enum Mirror Types ──────────────────────────────────────────────
// String literal unions matching Prisma enums for use in admin UIs

export type OrgStatus = 'active' | 'suspended' | 'trial' | 'cancelled';
export type SuperAdminRole = 'super_admin' | 'support' | 'finance';
export type UserStatus = 'active' | 'invited' | 'suspended' | 'blocked';
export type EndUserStatus = 'active' | 'unsubscribed' | 'blocked';
export type SegmentType = 'static' | 'dynamic';
export type ApiKeyEnv = 'live' | 'test';
export type OauthProvider = 'google' | 'github';
export type OtpType = 'login' | 'phone_verify' | 'email_verify' | 'password_reset';
export type NotificationType = 'in_app' | 'email' | 'sms' | 'push' | 'whatsapp' | 'webhook';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
export type TemplateChannel = 'email' | 'sms' | 'push' | 'whatsapp';
export type CampaignChannel = 'email' | 'sms' | 'push' | 'whatsapp' | 'multi';
export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed';
export type PaymentProviderType = 'razorpay' | 'stripe';
export type ProductType = 'one_time' | 'subscription';
export type SubscriptionStatus = 'created' | 'active' | 'paused' | 'cancelled' | 'expired' | 'halted';
export type PaymentStatus = 'captured' | 'failed' | 'refunded' | 'partially_refunded';
export type RefundStatus = 'pending' | 'processed' | 'failed';
export type InvoiceType = 'subscription' | 'usage' | 'manual';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

// ─── Banking Enum Types ─────────────────────────────────────────────────────

export type KycStatus = 'pending' | 'submitted' | 'verified' | 'rejected' | 'expired';
export type KycDocumentType = 'aadhaar' | 'pan' | 'passport' | 'voter_id' | 'driving_license';
export type BankAccountType = 'savings' | 'current';
export type BankAccountStatus = 'active' | 'frozen' | 'closed' | 'dormant';
export type TransferMode = 'neft' | 'rtgs' | 'imps' | 'upi' | 'swift' | 'internal';
export type TransferStatus = 'initiated' | 'processing' | 'completed' | 'failed' | 'reversed';
export type CardType = 'debit' | 'credit';
export type CardVariant = 'virtual' | 'physical';
export type CardStatus = 'active' | 'blocked' | 'expired' | 'cancelled';
export type ScheduledTransferFrequency = 'once' | 'daily' | 'weekly' | 'monthly';
export type ScheduledTransferStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export type BillPaymentStatus = 'pending' | 'paid' | 'failed';
export type FixedDepositStatus = 'active' | 'matured' | 'closed_premature' | 'renewed';

// ─── Banking: KYC ───────────────────────────────────────────────────────────

export interface KycVerification {
  id: string;
  documentType: KycDocumentType;
  documentNumber: string;
  documentUrl: string | null;
  selfieUrl: string | null;
  status: KycStatus;
  verifiedAt: string | null;
  rejectionNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KycStatusResponse {
  verifications: KycVerification[];
  isFullyVerified: boolean;
}

// ─── Banking: Accounts ──────────────────────────────────────────────────────

export interface BankAccount {
  id: string;
  accountNumber: string;
  ifscCode: string;
  accountType: BankAccountType;
  status: BankAccountStatus;
  nickname: string | null;
  balance: number;
  currency: string;
  autoSweepEnabled: boolean;
  autoSweepThreshold: number | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountBalance {
  accountId: string;
  accountNumber: string;
  balance: number;
  currency: string;
  accountType: BankAccountType;
}

// ─── Banking: Transactions ──────────────────────────────────────────────────

export interface BankTransaction {
  id: string;
  accountId: string;
  type: 'credit' | 'debit';
  mode: TransferMode | null;
  amount: number;
  balanceAfter: number;
  currency: string;
  description: string;
  referenceNumber: string | null;
  counterpartyName: string | null;
  counterpartyAccount: string | null;
  counterpartyIfsc: string | null;
  status: TransferStatus;
  category: string | null;
  createdAt: string;
}

// ─── Banking: Beneficiaries ─────────────────────────────────────────────────

export interface Beneficiary {
  id: string;
  name: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string | null;
  upiId: string | null;
  nickname: string | null;
  isFavorite: boolean;
  transferLimit: number | null;
  isVerified: boolean;
  createdAt: string;
}

// ─── Banking: Cards ─────────────────────────────────────────────────────────

export interface BankCard {
  id: string;
  cardType: CardType;
  variant: CardVariant;
  status: CardStatus;
  lastFourDigits: string;
  cardNetwork: string;
  expiryMonth: number;
  expiryYear: number;
  nameOnCard: string;
  dailyLimit: number;
  internationalEnabled: boolean;
  internationalFrom: string | null;
  internationalUntil: string | null;
  contactlessEnabled: boolean;
  atmWithdrawalLimit: number;
  onlineEnabled: boolean;
  createdAt: string;
}

// ─── Banking: Fixed Deposits ────────────────────────────────────────────────

export interface FixedDeposit {
  id: string;
  accountId: string;
  fdNumber: string;
  principalAmount: number;
  interestRate: number;
  tenureDays: number;
  maturityAmount: number;
  maturityDate: string;
  status: FixedDepositStatus;
  autoRenew: boolean;
  closedAt: string | null;
  createdAt: string;
}

export interface FixedDepositClosure {
  payoutAmount: number;
  daysHeld: number;
  prematureRate: number;
}

// ─── Banking: Scheduled Transfers ───────────────────────────────────────────

export interface ScheduledTransfer {
  id: string;
  senderAccountId: string;
  beneficiaryName: string;
  beneficiaryAccount: string;
  beneficiaryIfsc: string;
  amount: number;
  mode: TransferMode;
  frequency: ScheduledTransferFrequency;
  status: ScheduledTransferStatus;
  description: string | null;
  nextExecutionAt: string;
  lastExecutedAt: string | null;
  endsAt: string | null;
  executionCount: number;
  createdAt: string;
}

// ─── Banking: Bill Payments ─────────────────────────────────────────────────

export interface BillPayment {
  id: string;
  accountId: string;
  billerCategory: string;
  billerName: string;
  billerId: string | null;
  consumerNumber: string;
  amount: number;
  status: BillPaymentStatus;
  referenceNumber: string | null;
  paidAt: string | null;
  createdAt: string;
}

// ─── Banking: Analytics ─────────────────────────────────────────────────────

export interface SpendingCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
}

export interface SpendingBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface SpendingBreakdown {
  breakdown: SpendingBreakdownItem[];
  totalSpent: number;
  period: { months: number; since: string };
}

export interface MonthlyTrendItem {
  month: string;
  income: number;
  expenditure: number;
  net: number;
}

export interface MonthlyTrends {
  trends: MonthlyTrendItem[];
}

export interface CashFlowSummary {
  totalIncome: number;
  totalExpenditure: number;
  netCashFlow: number;
  period: { start: string; end: string };
}

export interface BudgetItem {
  id: string;
  category: string;
  monthlyLimit: number;
  alertAt: number;
  isActive: boolean;
  spent: number;
  utilization: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
}

export interface AnomalyAlert {
  id: string;
  transactionId: string | null;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
}

export interface NetWorthSnapshot {
  accounts: Array<{
    id: string;
    accountNumber: string;
    accountType: BankAccountType;
    balance: number;
    nickname: string | null;
  }>;
  fixedDeposits: Array<{
    id: string;
    fdNumber: string;
    principalAmount: number;
    maturityAmount: number;
    maturityDate: string;
  }>;
  summary: {
    accountsTotal: number;
    fixedDepositsTotal: number;
    netWorth: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── SubRadar — Subscription Intelligence ─────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

export type TrackedBillingCycle =
  | 'monthly'
  | 'quarterly'
  | 'half_yearly'
  | 'yearly'
  | 'weekly'
  | 'lifetime';

export type TrackedSubSource = 'gmail_auto' | 'manual';

export type TrackedSubStatus =
  | 'active'
  | 'cancelled'
  | 'paused'
  | 'forgotten'
  | 'free_trial';

export type SubAlertType =
  | 'renewal_7d'
  | 'renewal_3d'
  | 'renewal_1d'
  | 'free_trial_expiry'
  | 'price_increase'
  | 'price_decrease';

export type SubSuggestionType =
  | 'cheaper_alternative'
  | 'plan_downgrade'
  | 'cancel_forgotten'
  | 'cancel_low_usage'
  | 'free_tier_available';

export type SubSuggestionStatus = 'pending' | 'accepted' | 'dismissed' | 'not_interested';

/** A Gmail account connected for subscription scanning. */
export interface GmailAccount {
  id: string;
  email: string;
  scopes: string[];
  lastScanAt: string | null;
  connectedAt: string;
}

/** A detected or manually added subscription. */
export interface TrackedSubscription {
  id: string;
  serviceName: string;
  domain: string | null;
  logoUrl: string | null;
  category: string;
  /** Amount in paise (₹ × 100) */
  amountPaise: number;
  currency: string;
  billingCycle: TrackedBillingCycle;
  nextRenewalAt: string | null;
  lastSeenAt: string | null;
  lastActivityAt: string | null;
  source: TrackedSubSource;
  status: TrackedSubStatus;
  isFreeTrialDetected: boolean;
  freeTrialEndsAt: string | null;
  notes: string | null;
  createdAt: string;
}

/** Renewal/trial/price-change alert for a tracked subscription. */
export interface SubscriptionAlert {
  id: string;
  alertType: SubAlertType;
  daysUntilRenewal: number | null;
  /** Amount in paise */
  amountPaise: number | null;
  previousAmountPaise: number | null;
  scheduledAt: string;
  sentAt: string | null;
  isDismissed: boolean;
  createdAt: string;
  trackedSubscription: {
    id: string;
    serviceName: string;
    logoUrl: string | null;
    category: string;
    billingCycle: TrackedBillingCycle;
  };
}

/** A money-saving suggestion generated by the engine. */
export interface SubscriptionSuggestion {
  id: string;
  suggestionType: SubSuggestionType;
  title: string;
  description: string;
  /** Estimated annual savings in paise */
  savingsPaise: number | null;
  alternativeServiceName: string | null;
  alternativeAmountPaise: number | null;
  affiliateUrl: string | null;
  status: SubSuggestionStatus;
  createdAt: string;
  trackedSubscription: {
    id: string;
    serviceName: string;
    logoUrl: string | null;
    amountPaise: number;
    billingCycle: TrackedBillingCycle;
    category: string;
  };
}

/** Spending summary returned by analytics. */
export interface SubRadarSummary {
  totalMonthlyPaise: number;
  totalAnnualPaise: number;
  activeCount: number;
  lowUsageCount: number;
  forgottenCount: number;
  byCategory: Record<string, { count: number; monthlyPaise: number }>;
}

/** Month-by-month spending trend. */
export interface SubRadarTrend {
  trend: Array<{ month: string; totalPaise: number }>;
}
