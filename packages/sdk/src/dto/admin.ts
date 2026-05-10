import type { PaginatedQuery, SearchStatusQuery } from './query';

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface StaffRegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface StaffLoginDto {
  email: string;
  password: string;
}

export interface StaffSendOtpDto {
  identifier: string;
  type: string;
}

export interface StaffVerifyOtpDto {
  identifier: string;
  otp: string;
  type: string;
}

export interface RequestMagicLinkDto {
  email: string;
}

export interface VerifyMagicLinkQuery {
  token: string;
}

export interface StaffChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface StaffRequestPasswordResetDto {
  email: string;
}

export interface StaffResetPasswordDto {
  token: string;
  newPassword: string;
}

// ─── Users ──────────────────────────────────────────────────────────────────

export interface ListStaffUsersQuery extends SearchStatusQuery {}

export interface InviteStaffUserDto {
  email: string;
  name: string;
  roleIds?: string[];
}

export interface UpdateStaffUserDto {
  name?: string;
  email?: string;
}

export interface AssignStaffRolesDto {
  roleIds: string[];
}

// ─── Organization ───────────────────────────────────────────────────────────

export interface UpdateOrgDto {
  name?: string;
  logoUrl?: string;
}

// ─── Roles ──────────────────────────────────────────────────────────────────

export interface CreateRoleDto {
  name: string;
  permissions: string[];
}

export interface UpdateRoleDto {
  name?: string;
  permissions?: string[];
}

// ─── Catalog ────────────────────────────────────────────────────────────────

export interface CreateCatalogCategoryDto {
  name: string;
  slug: string;
  imageUrl?: string;
  rank?: number;
  parentId?: string;
  isActive?: boolean;
}

export interface UpdateCatalogCategoryDto {
  name?: string;
  slug?: string;
  imageUrl?: string;
  rank?: number;
  parentId?: string;
  isActive?: boolean;
}

export interface ListCatalogItemsQuery extends PaginatedQuery {
  categoryId?: string;
  search?: string;
}

export interface CreateCatalogVariantDto {
  variantType: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  nutritionData?: Record<string, unknown>;
  isActive?: boolean;
}

export interface UpdateCatalogVariantDto {
  variantType?: string;
  name?: string;
  price?: number;
  description?: string;
  imageUrl?: string;
  nutritionData?: Record<string, unknown>;
  isActive?: boolean;
}

export interface CreateCatalogOptionGroupDto {
  name: string;
  minSelection?: number;
  maxSelection?: number;
  rank?: number;
}

export interface UpdateCatalogOptionGroupDto {
  name?: string;
  minSelection?: number;
  maxSelection?: number;
  rank?: number;
}

export interface CreateCatalogOptionDto {
  name: string;
  price: number;
  inStock?: boolean;
  rank?: number;
  isActive?: boolean;
}

export interface UpdateCatalogOptionDto {
  name?: string;
  price?: number;
  inStock?: boolean;
  rank?: number;
  isActive?: boolean;
}

// ─── Orders ─────────────────────────────────────────────────────────────────

export interface AdminListOrdersQuery extends PaginatedQuery {
  status?: string;
  orderType?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateOrderStatusDto {
  status: string;
  note?: string;
}

// ─── Locations ──────────────────────────────────────────────────────────────

export interface SetLocationHoursDto {
  hours: Array<{
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }>;
}

// ─── End Users ──────────────────────────────────────────────────────────────

export interface ListEndUsersQuery extends SearchStatusQuery {}

export interface BulkUpsertEndUsersDto {
  endUsers: Record<string, unknown>[];
}

export interface EndUserTagsDto {
  tags: string[];
}

// ─── API Keys ───────────────────────────────────────────────────────────────

export interface CreateApiKeyDto {
  name: string;
  environment: 'live' | 'test';
  scopes: string[];
  rateLimitPerMinute?: number;
  expiresAt?: string;
}

export interface UpdateApiKeyDto {
  name?: string;
  scopes?: string[];
}

// ─── Settings ───────────────────────────────────────────────────────────────

export interface SetSettingDto {
  value: unknown;
}

export interface BulkUpdateSettingsDto {
  settings: Array<{ group: string; key: string; value: unknown }>;
}

// ─── Billing ────────────────────────────────────────────────────────────────

export interface SubscribeBillingPlanDto {
  planId: string;
  interval: 'monthly' | 'yearly';
}

// ─── Notifications ──────────────────────────────────────────────────────────

export interface PreviewTemplateDto {
  variables: Record<string, unknown>;
}

// ─── Segments ───────────────────────────────────────────────────────────────

export interface AddSegmentMembersDto {
  endUserIds: string[];
}

// ─── Campaigns ──────────────────────────────────────────────────────────────

export interface ScheduleCampaignDto {
  scheduledAt: string;
}

// ─── Loyalty ────────────────────────────────────────────────────────────────

export interface AdjustLoyaltyPointsDto {
  points: number;
  description: string;
  commerceOrderId?: string;
}

// ─── Reviews ────────────────────────────────────────────────────────────────

export interface UpdateReviewStatusDto {
  status: 'approved' | 'rejected';
}

// ─── Reservations ───────────────────────────────────────────────────────────

export interface UpdateReservationStatusDto {
  status: string;
}

// ─── Property ───────────────────────────────────────────────────────────────

export interface SetPropertyTypeAmenitiesDto {
  amenityIds: string[];
}

export interface UpdateHousekeepingDto {
  status: string;
}

export interface CreatePropertyAmenityDto {
  name: string;
  icon?: string;
}

export interface AssignPropertyUnitsDto {
  unitIds: string[];
}

export interface AdminCancelBookingDto {
  reason?: string;
}

// ─── Support ────────────────────────────────────────────────────────────────

export interface UpdateSupportTicketDto {
  status?: string;
  priority?: string;
  category?: string;
  assigneeId?: string;
}

// ─── Student Passes ─────────────────────────────────────────────────────────

export interface ListStudentPassesQuery extends PaginatedQuery {
  status?: string;
}

export interface ReviewStudentPassDto {
  status: 'approved' | 'rejected';
  rejectionReason?: string;
  [key: string]: unknown;
}

export interface BulkReviewStudentPassesDto {
  ids: string[];
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

// ─── Student Discounts ──────────────────────────────────────────────────────

export interface CreateStudentDiscountDto {
  name: string;
  description?: string;
  institutionId?: string;
  discountType: string;
  discountValue: number;
  maxDiscountCap?: number;
  minOrderAmount?: number;
  isActive?: boolean;
  validFrom?: string;
  validTo?: string;
  [key: string]: unknown;
}

export interface UpdateStudentDiscountDto {
  name?: string;
  description?: string;
  discountType?: string;
  discountValue?: number;
  isActive?: boolean;
  [key: string]: unknown;
}

// ─── Institutions ───────────────────────────────────────────────────────────

export interface CreateInstitutionDto {
  name: string;
}

export interface UpdateInstitutionDto {
  name?: string;
  isActive?: boolean;
  [key: string]: unknown;
}

// ─── Meal Plans ─────────────────────────────────────────────────────────────

export interface CreateMealPlanDto {
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  items?: Record<string, unknown>;
  isActive?: boolean;
}

export interface UpdateMealPlanDto {
  name?: string;
  description?: string;
  price?: number;
  durationDays?: number;
  items?: Record<string, unknown>;
  isActive?: boolean;
}

// ─── Inventory ─────────────────────────────────────────────────────────────

export interface CreateIngredientDto {
  name: string;
  unit: string;
  currentStock?: number;
  minStock?: number;
  costPerUnit?: number;
  supplierId?: string;
}

export interface UpdateIngredientDto {
  name?: string;
  unit?: string;
  currentStock?: number;
  minStock?: number;
  costPerUnit?: number;
  supplierId?: string;
}

export interface CreateWasteLogDto {
  ingredientId: string;
  quantity: number;
  reason: string;
}

// ─── Suppliers ─────────────────────────────────────────────────────────────

export interface CreateSupplierDto {
  name: string;
  contactName: string;
  phone: string;
  email?: string;
  leadTimeDays?: number;
  isActive?: boolean;
}

export interface UpdateSupplierDto {
  name?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  leadTimeDays?: number;
  isActive?: boolean;
}

// ─── Purchase Orders ───────────────────────────────────────────────────────

export interface CreatePurchaseOrderDto {
  supplierId: string;
  items: Array<{
    ingredientId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface UpdatePurchaseOrderDto {
  status: string;
}

export interface QueryPurchaseOrdersParams extends PaginatedQuery {
  status?: string;
}

// ─── Meal Subscriptions ────────────────────────────────────────────────────

export interface QueryMealSubscriptionsParams extends PaginatedQuery {
  status?: string;
}

// ─── Help Articles ──────────────────────────────────────────────────────────

export interface CreateHelpArticleDto {
  title: string;
  slug?: string;
  body: string;
  category?: string;
  sortOrder?: number;
}

export interface UpdateHelpArticleDto {
  title?: string;
  slug?: string;
  body?: string;
  category?: string;
  sortOrder?: number;
  isPublished?: boolean;
}

// ─── Dashboard ───────────────────────────────────────────────────────────

export interface AdminDashboardQuery {
  startDate?: string;
  endDate?: string;
}

// ─── Delivery ────────────────────────────────────────────────────────────

export interface CreateDeliveryAgentDto {
  name: string;
  phone: string;
  [key: string]: unknown;
}

export interface UpdateDeliveryAgentDto {
  name?: string;
  phone?: string;
  isActive?: boolean;
  [key: string]: unknown;
}

export interface CreateDeliveryZoneDto {
  name: string;
  pincodes: string[];
  deliveryFee: number;
  isActive?: boolean;
}

export interface UpdateDeliveryZoneDto {
  name?: string;
  pincodes?: string[];
  deliveryFee?: number;
  isActive?: boolean;
}

// ─── Marketing ───────────────────────────────────────────────────────────

export interface UpdatePopupSettingsDto {
  content?: string;
  trigger?: string;
  isActive?: boolean;
}

// ─── Finance ─────────────────────────────────────────────────────────────

export interface AdminFinanceQuery extends PaginatedQuery {
  startDate?: string;
  endDate?: string;
  status?: string;
}

// ─── Notifications Broadcast ─────────────────────────────────────────────

export interface CreateBroadcastDto {
  title: string;
  body: string;
  channel: string;
  segment?: string;
  scheduledAt?: string;
}

// ─── Reservation Slots ──────────────────────────────────────────────────

export interface CreateReservationSlotDto {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCovers: number;
  isActive?: boolean;
}

export interface UpdateReservationSlotDto {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  maxCovers?: number;
  isActive?: boolean;
}

// ─── Reservation Tables ─────────────────────────────────────────────────

export interface CreateReservationTableDto {
  tableNumber: string;
  capacity: number;
  locationId: string;
  isActive?: boolean;
}

export interface UpdateReservationTableDto {
  tableNumber?: string;
  capacity?: number;
  locationId?: string;
  isActive?: boolean;
}

// ─── Abandoned Carts ─────────────────────────────────────────────────────

export interface AdminAbandonedCartsQuery extends PaginatedQuery {
  filter?: string;
}

// ─── Scheduled Orders ────────────────────────────────────────────────────

export interface AdminScheduledOrdersQuery extends PaginatedQuery {
  date?: string;
}

// ─── Rewards Fulfillment ─────────────────────────────────────────────────

export interface FulfillRewardDto {
  code: string;
}
