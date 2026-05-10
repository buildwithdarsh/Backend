import type { CartItemOption, OrderType, PaymentMethod } from '../types';
import type { PaginatedQuery } from './query';

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface RegisterEndUserDto {
  name?: string;
  email?: string;
  phone?: string;
  password: string;
  referralCode?: string;
}

export interface LoginEndUserDto {
  email?: string;
  phone?: string;
  password: string;
}

export interface EndUserSendOtpDto {
  identifier: string;
  type: string;
}

export interface EndUserVerifyOtpDto {
  identifier: string;
  otp: string;
  type: string;
}

export interface StartSignupDto {
  phone: string;
}

export interface VerifySignupOtpDto {
  phone: string;
  otp: string;
}

export interface EndUserRequestResetDto {
  identifier: string;
}

export interface EndUserResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface CompleteSignupDto {
  name: string;
  email?: string;
  password: string;
}

export interface UpdateEndUserProfileDto {
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  preferences?: Record<string, unknown>;
}

export interface ChangeEndUserPasswordDto {
  currentPassword: string;
  newPassword: string;
}

// ─── Catalog ────────────────────────────────────────────────────────────────

export interface GetCatalogItemsQuery extends PaginatedQuery {
  categoryId?: string;
  search?: string;
  dietType?: string;
  inStock?: boolean;
  isFeatured?: boolean;
  variantType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Cart ───────────────────────────────────────────────────────────────────

export interface AddCartItemDto {
  itemId: string;
  sizeVariationId?: string;
  quantity?: number;
  variantType: string;
  options?: CartItemOption[];
}

export interface UpdateCartItemDto {
  quantity: number;
}

// ─── Orders ─────────────────────────────────────────────────────────────────

export interface CreateOrderDto {
  variantType: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  customerName: string;
  customerPhone: string;
  paymentSubMethod?: string;
  partialPayment?: Record<string, unknown>;
  addressId?: string;
  locationId?: string;
  customerEmail?: string;
  specialInstructions?: string;
  couponCode?: string;
  loyaltyPointsToRedeem?: number;
  scheduledAt?: string;
  channel?: string;
  contactless?: boolean;
  giftWrap?: boolean;
}

export interface ListOrdersQuery extends PaginatedQuery {
  status?: string;
  orderType?: OrderType;
  startDate?: string;
  endDate?: string;
}

export interface ReorderDto {
  orderId: string;
}

export interface ReportOrderIssueDto {
  subject: string;
  description: string;
}

// ─── Payments ───────────────────────────────────────────────────────────────

export interface CreatePaymentOrderDto {
  productId: string;
  currency: 'INR' | 'USD';
  endUserId?: string;
  amount?: number;
  metadata?: Record<string, unknown>;
}

export interface VerifyPaymentDto {
  orderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  stripePaymentIntentId?: string;
}

// ─── Delivery ───────────────────────────────────────────────────────────────

export interface CalculateDeliveryDto {
  locationId: string;
  lat?: number;
  lng?: number;
  pincode?: string;
  orderType?: string;
}

// ─── Loyalty ────────────────────────────────────────────────────────────────

export interface RedeemLoyaltyRewardDto {
  rewardId: string;
}

// ─── Coupons ────────────────────────────────────────────────────────────────

export interface ValidateCouponDto {
  code: string;
  cartTotal?: number;
}

// ─── Referrals ──────────────────────────────────────────────────────────────

export interface ValidateReferralDto {
  code: string;
}

// ─── Reviews ────────────────────────────────────────────────────────────────

export interface ListReviewsQuery extends PaginatedQuery {
  catalogItemId?: string;
}

export interface CreateReviewDto {
  catalogItemId?: string;
  commerceOrderId?: string;
  rating: number;
  title?: string;
  body?: string;
}

// ─── Gift Cards ─────────────────────────────────────────────────────────────

export interface PurchaseGiftCardDto {
  amount: number;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  message?: string;
}

export interface RedeemGiftCardDto {
  code: string;
  amount: number;
  commerceOrderId?: string;
}

// ─── Reservations ───────────────────────────────────────────────────────────

export interface CheckReservationAvailabilityQuery {
  date: string;
  partySize?: number;
}

export interface CreateReservationDto {
  date: string;
  startTime: string;
  endTime?: string;
  partySize?: number;
  customerName: string;
  customerPhone: string;
  notes?: string;
  resourceId?: string;
  slotId?: string;
}

// ─── Support ────────────────────────────────────────────────────────────────

export interface CreateSupportTicketDto {
  subject: string;
  category?: string;
  body: string;
  commerceOrderId?: string;
}

export interface ReplySupportTicketDto {
  body: string;
}

// ─── Content ────────────────────────────────────────────────────────────────

export interface ListContentQuery extends PaginatedQuery {
  type?: string;
}

// ─── Addresses ──────────────────────────────────────────────────────────────

export interface CreateAddressDto {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  pincode: string;
  country?: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
}

export interface UpdateAddressDto {
  label?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
}

// ─── Contact ────────────────────────────────────────────────────────────────

export interface SubmitContactDto {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  service?: string;
  budget?: string;
  message: string;
}

export interface SubscribeNewsletterDto {
  email: string;
  name?: string;
  source?: string;
}

// ─── Property ───────────────────────────────────────────────────────────────

export interface CreatePropertyBookingDto {
  propertyTypeId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  notes?: string;
}

export interface CancelPropertyBookingDto {
  reason?: string;
}

export interface CreatePropertyPaymentOrderDto {
  amount: number;
}

export interface CheckPropertyAvailabilityQuery {
  /** Optional. Pass empty string or omit to query the full calendar across all types. */
  propertyTypeId?: string;
  checkIn: string;
  checkOut: string;
}

export interface ResolvePropertyPriceDto {
  propertyTypeId: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
}

// ─── Movies ─────────────────────────────────────────────────────────────────

export interface ListMoviesQuery extends PaginatedQuery {
  genre?: string;
  search?: string;
}

export interface UpdateMovieProgressDto {
  progress: number;
  duration: number;
}

// ─── Student ────────────────────────────────────────────────────────────────

export interface ApplyStudentPassDto {
  studentIdNumber: string;
  idImageUrl: string;
  institutionId?: string;
}

export interface PreviewStudentDiscountDto {
  cartTotal: number;
  itemIds?: string[];
}

// ─── Meal Plans ─────────────────────────────────────────────────────────────

export interface SubscribeMealPlanDto {
  mealPlanId: string;
}

// ─── Wallet ─────────────────────────────────────────────────────────────────

export interface TopUpWalletDto {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
  amountPaise: number;
  bonusPaise?: number;
}

// ─── Watch Sessions (PPM) ───────────────────────────────────────────────────

export interface StartWatchSessionDto {
  movieTitle: string;
  ratePerMinPaise: number;
  meterCapPaise: number;
  roomId?: string;
  mode?: 'sync' | 'solo';
}

// ─── PlayFlix Room ─────────────────────────────────────────────────────────

export interface CreatePlayFlixRoomDto {
  tmdbId: number;
  movieTitle: string;
  posterUrl?: string | null;
  gdriveFileId: string;
  name: string;
  privacy?: 'public' | 'private';
  vibe?: 'chill' | 'serious' | 'party' | 'commentary';
  ratePerMinPaise: number;
  maxViewers?: number;
}

export interface JoinPlayFlixRoomDto {
  mode: 'sync' | 'solo';
}

export interface SwitchPlayFlixRoomModeDto {
  mode: 'sync' | 'solo';
}

export interface ListPlayFlixRoomsQuery extends PaginatedQuery {
  tmdbId?: number;
  status?: 'waiting' | 'live';
}

// Backwards-compatible aliases
/** @deprecated Use CreatePlayFlixRoomDto */
export type CreateWatchRoomDto = CreatePlayFlixRoomDto;
/** @deprecated Use JoinPlayFlixRoomDto */
export type JoinWatchRoomDto = JoinPlayFlixRoomDto;
/** @deprecated Use SwitchPlayFlixRoomModeDto */
export type SwitchWatchRoomModeDto = SwitchPlayFlixRoomModeDto;
/** @deprecated Use ListPlayFlixRoomsQuery */
export type ListWatchRoomsQuery = ListPlayFlixRoomsQuery;

// ─── Earnings ──────────────────────────────────────────────────────────────

export interface ListEarningsQuery extends PaginatedQuery {
  status?: 'pending' | 'paid';
}

// ─── Connected Sources ─────────────────────────────────────────────────────

export interface GoogleDriveCallbackDto {
  code: string;
}

// ─── Banking: KYC ──────────────────────────────────────────────────────────

export interface SubmitKycDto {
  documentType: 'aadhaar' | 'pan' | 'passport' | 'voter_id' | 'driving_license';
  documentNumber: string;
  documentUrl?: string;
  selfieUrl?: string;
}

// ─── Banking: Accounts ─────────────────────────────────────────────────────

export interface UpdateAccountNicknameDto {
  nickname: string;
}

export interface SetAutoSweepDto {
  enabled: boolean;
  threshold?: number;
}

export interface GetStatementQuery extends PaginatedQuery {
  startDate?: string;
  endDate?: string;
}

export interface CreateFixedDepositDto {
  accountId: string;
  principalAmount: number;
  tenureDays: number;
  autoRenew?: boolean;
}

// ─── Banking: Transfers ────────────────────────────────────────────────────

export interface InitiateTransferDto {
  senderAccountId: string;
  beneficiaryAccount: string;
  beneficiaryIfsc: string;
  beneficiaryName: string;
  amount: number;
  mode: 'neft' | 'rtgs' | 'imps' | 'upi' | 'swift' | 'internal';
  description?: string;
  upiId?: string;
}

export interface AddBeneficiaryDto {
  name: string;
  accountNumber: string;
  ifscCode: string;
  bankName?: string;
  upiId?: string;
  nickname?: string;
  transferLimit?: number;
}

export interface CreateScheduledTransferDto {
  senderAccountId: string;
  beneficiaryName: string;
  beneficiaryAccount: string;
  beneficiaryIfsc: string;
  amount: number;
  mode: 'neft' | 'rtgs' | 'imps' | 'upi' | 'swift' | 'internal';
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  description?: string;
  nextExecutionAt: string;
  endsAt?: string;
}

export interface PayBillDto {
  accountId: string;
  billerCategory: string;
  billerName: string;
  billerId?: string;
  consumerNumber: string;
  amount: number;
}

export interface ListBillPaymentsQuery extends PaginatedQuery {
  category?: string;
}

// ─── Banking: Cards ────────────────────────────────────────────────────────

export interface GenerateVirtualCardDto {
  cardType: 'debit' | 'credit';
  accountId?: string;
  nameOnCard: string;
  cardNetwork?: string;
}

export interface UpdateCardLimitsDto {
  dailyLimit?: number;
  atmWithdrawalLimit?: number;
}

export interface ToggleInternationalDto {
  enabled: boolean;
  from?: string;
  until?: string;
}

export interface ToggleCardFeatureDto {
  enabled: boolean;
}

// ─── Banking: Analytics ────────────────────────────────────────────────────

export interface SetBudgetDto {
  category: string;
  monthlyLimit: number;
  alertAt?: number;
}

export interface GetAnomalyAlertsQuery extends PaginatedQuery {
  unreadOnly?: boolean;
}

// ─── SubRadar ──────────────────────────────────────────────────────────────

export type SubRadarBillingCycle =
  | 'monthly'
  | 'quarterly'
  | 'half_yearly'
  | 'yearly'
  | 'weekly'
  | 'lifetime';

export type SubRadarSubStatus =
  | 'active'
  | 'cancelled'
  | 'paused'
  | 'forgotten'
  | 'free_trial';

export type SubRadarSuggestionAction = 'accepted' | 'dismissed' | 'not_interested';

export interface GmailCallbackDto {
  code: string;
}

export interface AddTrackedSubscriptionDto {
  serviceName: string;
  domain?: string;
  logoUrl?: string;
  category: string;
  /** Amount in paise (₹ × 100) */
  amountPaise: number;
  currency?: string;
  billingCycle: SubRadarBillingCycle;
  nextRenewalAt?: string;
  isFreeTrialDetected?: boolean;
  freeTrialEndsAt?: string;
  notes?: string;
}

export interface UpdateTrackedSubscriptionDto {
  serviceName?: string;
  logoUrl?: string;
  category?: string;
  amountPaise?: number;
  billingCycle?: SubRadarBillingCycle;
  nextRenewalAt?: string;
  status?: SubRadarSubStatus;
  notes?: string;
}

export interface QueryTrackedSubscriptionsDto extends PaginatedQuery {
  category?: string;
  status?: SubRadarSubStatus;
}

export interface QuerySubscriptionAlertsDto extends PaginatedQuery {
  undismissed?: boolean;
}

export interface QuerySubscriptionSuggestionsDto extends PaginatedQuery {}

export interface SuggestionActionDto {
  action: SubRadarSuggestionAction;
}
