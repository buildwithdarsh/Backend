import type { TZClient, ScopedClient } from '../client';
import type {
  StaffAuthResponse, StaffUser, Role, AuditLog, ApiKey,
  CatalogCategory, CatalogItem, CatalogItemVariant, CatalogOptionGroup, CatalogOption,
  ContactMessage, Notification,
  LoyaltyAccount, LoyaltyReward,
  UploadResult, MealPlan,
  Ingredient, StockAlert, WasteLog, Supplier, PurchaseOrder, AdminMealSubscription,
  AdminDashboardData, AdminLoyaltyData, AdminRedemption, AdminFulfillResult,
  AdminDeliveryAgent, AdminDeliveryZone, AdminAffiliate, AdminPopupSettings,
  AdminInvoice, AdminTaxSummary, AdminSettlement, AdminPayout,
  AdminBroadcast, AdminScheduledOrder, AdminAbandonedCart, AdminWaitlistGroup,
  AdminReservationSlot, AdminOrder, AdminOrderDetail, AdminCustomer, AdminCustomerDetail,
  AdminBlogPost, AdminCoupon, AdminPromotion, AdminGiftCard, AdminGiftCardTransaction,
  AdminReservation, AdminReservationTable, AdminTicket, AdminTicketDetail, AdminTicketMessage,
  AdminLocation, AdminLocationDetail, AdminSetting,
  AdminStudentPass, AdminStudentPassDetail, AdminStudentPassStats,
  AdminStudentDiscount, AdminInstitution, AdminReview, AdminHelpArticle,
  AdminMenuItem, AdminSyncLog,
} from '../types';
import type {
  StaffRegisterDto, StaffLoginDto, StaffSendOtpDto, StaffVerifyOtpDto,
  RequestMagicLinkDto, VerifyMagicLinkQuery, StaffChangePasswordDto,
  StaffRequestPasswordResetDto, StaffResetPasswordDto,
  ListStaffUsersQuery, InviteStaffUserDto, UpdateStaffUserDto, AssignStaffRolesDto,
  UpdateOrgDto, CreateRoleDto, UpdateRoleDto,
  CreateCatalogCategoryDto, UpdateCatalogCategoryDto, ListCatalogItemsQuery,
  CreateCatalogVariantDto, UpdateCatalogVariantDto,
  CreateCatalogOptionGroupDto, UpdateCatalogOptionGroupDto,
  CreateCatalogOptionDto, UpdateCatalogOptionDto,
  AdminListOrdersQuery, UpdateOrderStatusDto,
  SetLocationHoursDto, ListEndUsersQuery, BulkUpsertEndUsersDto, EndUserTagsDto,
  CreateApiKeyDto, UpdateApiKeyDto,
  SetSettingDto, BulkUpdateSettingsDto, SubscribeBillingPlanDto,
  PreviewTemplateDto, AddSegmentMembersDto, ScheduleCampaignDto,
  AdjustLoyaltyPointsDto, UpdateReviewStatusDto, UpdateReservationStatusDto,
  SetPropertyTypeAmenitiesDto, UpdateHousekeepingDto, CreatePropertyAmenityDto,
  AssignPropertyUnitsDto, AdminCancelBookingDto, UpdateSupportTicketDto,
  ListStudentPassesQuery, ReviewStudentPassDto, BulkReviewStudentPassesDto,
  CreateStudentDiscountDto, UpdateStudentDiscountDto,
  CreateInstitutionDto, UpdateInstitutionDto,
  CreateMealPlanDto, UpdateMealPlanDto,
  CreateHelpArticleDto, UpdateHelpArticleDto,
  CreateIngredientDto, UpdateIngredientDto, CreateWasteLogDto,
  CreateSupplierDto, UpdateSupplierDto,
  CreatePurchaseOrderDto, UpdatePurchaseOrderDto, QueryPurchaseOrdersParams,
  QueryMealSubscriptionsParams,
  AdminDashboardQuery, CreateDeliveryAgentDto, UpdateDeliveryAgentDto,
  CreateDeliveryZoneDto, UpdateDeliveryZoneDto, UpdatePopupSettingsDto,
  AdminFinanceQuery, CreateBroadcastDto,
  CreateReservationSlotDto, UpdateReservationSlotDto,
  CreateReservationTableDto, UpdateReservationTableDto,
  AdminAbandonedCartsQuery, AdminScheduledOrdersQuery, FulfillRewardDto,
} from '../dto';
import type { PaginatedQuery, StatusQuery } from '../dto';

export function createAdmin(root: TZClient, c: ScopedClient) {
  const orgSlug = root.orgSlug;

  return {
    // ─── Auth (Staff) ────────────────────────────────────────────────

    auth: {
      register(data: StaffRegisterDto) {
        return root.rawRequest<StaffAuthResponse>('POST', '/auth/register', { body: { ...data, orgSlug }, scope: 'public', sendOrgKey: false })
          .then((r) => { root.saveStaffTokens(r.data.accessToken, r.data.refreshToken); return r.data; });
      },

      login(data: StaffLoginDto) {
        return root.rawRequest<StaffAuthResponse>('POST', '/auth/login', { body: { ...data, orgSlug }, scope: 'public', sendOrgKey: false })
          .then((r) => { root.saveStaffTokens(r.data.accessToken, r.data.refreshToken); return r.data; });
      },

      logout() {
        const refreshToken = root.getStaffRefreshToken();
        return root.rawRequest<void>('POST', '/auth/logout', { body: { refreshToken }, scope: 'staff', sendOrgKey: false })
          .then((r) => r.data)
          .finally(() => root.clearStaffTokens());
      },

      me() { return c.get<StaffUser>('/users/me'); },

      sendOtp(data: StaffSendOtpDto) {
        return root.rawRequest<{ message: string }>('POST', '/auth/otp/send', { body: { ...data, orgSlug }, scope: 'public', sendOrgKey: false })
          .then((r) => r.data);
      },

      verifyOtp(data: StaffVerifyOtpDto) {
        return root.rawRequest<StaffAuthResponse>('POST', '/auth/otp/verify', { body: { ...data, orgSlug }, scope: 'public', sendOrgKey: false })
          .then((r) => { root.saveStaffTokens(r.data.accessToken, r.data.refreshToken); return r.data; });
      },

      refresh() {
        const refreshToken = root.getStaffRefreshToken();
        return root.rawRequest<StaffAuthResponse>('POST', '/auth/refresh', { body: { refreshToken }, scope: 'public', sendOrgKey: false })
          .then((r) => { root.saveStaffTokens(r.data.accessToken, r.data.refreshToken); return r.data; });
      },

      requestMagicLink(data: RequestMagicLinkDto) {
        return root.rawRequest<{ message: string }>('POST', '/auth/magic-link', { body: { ...data, orgSlug }, scope: 'public', sendOrgKey: false })
          .then((r) => r.data);
      },

      verifyMagicLink(params: VerifyMagicLinkQuery) {
        return root.rawRequest<StaffAuthResponse>('GET', `/auth/magic-link/verify?token=${encodeURIComponent(params.token)}&orgSlug=${orgSlug}`, { scope: 'public', sendOrgKey: false })
          .then((r) => { root.saveStaffTokens(r.data.accessToken, r.data.refreshToken); return r.data; });
      },

      changePassword(data: StaffChangePasswordDto) {
        return c.post<{ message: string }>('/auth/password/change', data);
      },

      requestPasswordReset(data: StaffRequestPasswordResetDto) {
        return root.rawRequest<{ message: string }>('POST', '/auth/password/reset-request', { body: { ...data, orgSlug }, scope: 'public', sendOrgKey: false })
          .then((r) => r.data);
      },

      resetPassword(data: StaffResetPasswordDto) {
        return root.rawRequest<{ message: string }>('POST', '/auth/password/reset', { body: data, scope: 'public', sendOrgKey: false })
          .then((r) => r.data);
      },

      isAuthenticated: () => root.isStaffAuthenticated(),
      getToken: () => root.getStaffToken(),
      clearTokens: () => root.clearStaffTokens(),
    },

    // ─── Users ───────────────────────────────────────────────────────

    users: {
      list(params?: ListStaffUsersQuery) { return c.paginated<StaffUser>('/users', params); },
      get(id: string) { return c.get<StaffUser>(`/users/${id}`); },
      invite(data: InviteStaffUserDto) { return c.post<StaffUser>('/users/invite', data); },
      update(id: string, data: UpdateStaffUserDto) { return c.patch<StaffUser>(`/users/${id}`, data); },
      remove(id: string) { return c.del<void>(`/users/${id}`); },
      suspend(id: string) { return c.post<void>(`/users/${id}/suspend`); },
      reinstate(id: string) { return c.post<void>(`/users/${id}/reinstate`); },
      assignRoles(id: string, data: AssignStaffRolesDto) { return c.post<void>(`/users/${id}/roles`, data); },
    },

    // ─── Organization (Self) ─────────────────────────────────────────

    org: {
      me() { return c.get<{ id: string; name: string; slug: string; logoUrl: string | null }>('/org/me'); },
      update(data: UpdateOrgDto) { return c.patch<unknown>('/org/me', data); },
    },

    // ─── Roles ───────────────────────────────────────────────────────

    roles: {
      list() { return c.get<Role[]>('/roles'); },
      permissions() { return c.get<string[]>('/roles/permissions'); },
      get(id: string) { return c.get<Role>(`/roles/${id}`); },
      create(data: CreateRoleDto) { return c.post<Role>('/roles', data); },
      update(id: string, data: UpdateRoleDto) { return c.patch<Role>(`/roles/${id}`, data); },
      remove(id: string) { return c.del<void>(`/roles/${id}`); },
    },

    // ─── Catalog ─────────────────────────────────────────────────────

    catalog: {
      getCategories(params?: PaginatedQuery) { return c.paginated<CatalogCategory>('/catalog/categories', params); },
      createCategory(data: CreateCatalogCategoryDto) { return c.post<CatalogCategory>('/catalog/categories', data); },
      updateCategory(id: string, data: UpdateCatalogCategoryDto) { return c.patch<CatalogCategory>(`/catalog/categories/${id}`, data); },
      removeCategory(id: string) { return c.del<void>(`/catalog/categories/${id}`); },

      getItems(params?: ListCatalogItemsQuery) { return c.paginated<CatalogItem>('/catalog/items', params); },
      getItem(id: string) { return c.get<CatalogItem>(`/catalog/items/${id}`); },
      createItem(data: Record<string, unknown>) { return c.post<CatalogItem>('/catalog/items', data); },
      updateItem(id: string, data: Record<string, unknown>) { return c.patch<CatalogItem>(`/catalog/items/${id}`, data); },
      removeItem(id: string) { return c.del<void>(`/catalog/items/${id}`); },

      createVariant(itemId: string, data: CreateCatalogVariantDto) { return c.post<CatalogItemVariant>(`/catalog/items/${itemId}/variants`, data); },
      updateVariant(variantId: string, data: UpdateCatalogVariantDto) { return c.patch<CatalogItemVariant>(`/catalog/variants/${variantId}`, data); },
      removeVariant(variantId: string) { return c.del<void>(`/catalog/variants/${variantId}`); },

      createOptionGroup(itemId: string, data: CreateCatalogOptionGroupDto) { return c.post<CatalogOptionGroup>(`/catalog/items/${itemId}/option-groups`, data); },
      updateOptionGroup(groupId: string, data: UpdateCatalogOptionGroupDto) { return c.patch<CatalogOptionGroup>(`/catalog/option-groups/${groupId}`, data); },
      removeOptionGroup(groupId: string) { return c.del<void>(`/catalog/option-groups/${groupId}`); },

      createOption(groupId: string, data: CreateCatalogOptionDto) { return c.post<CatalogOption>(`/catalog/option-groups/${groupId}/options`, data); },
      updateOption(optionId: string, data: UpdateCatalogOptionDto) { return c.patch<CatalogOption>(`/catalog/options/${optionId}`, data); },
      removeOption(optionId: string) { return c.del<void>(`/catalog/options/${optionId}`); },
    },

    // ─── Commerce Orders ─────────────────────────────────────────────

    orders: {
      list(params?: AdminListOrdersQuery) { return c.paginated<AdminOrder>('/commerce/orders', params); },
      stats() { return c.get<Record<string, unknown>>('/commerce/orders/stats'); },
      get(id: string) { return c.get<AdminOrderDetail>(`/commerce/orders/${id}`); },
      updateStatus(id: string, data: UpdateOrderStatusDto) { return c.patch<AdminOrderDetail>(`/commerce/orders/${id}/status`, data); },
    },

    // ─── Locations ───────────────────────────────────────────────────

    locations: {
      list() { return c.get<AdminLocation[]>('/locations'); },
      get(id: string) { return c.get<AdminLocationDetail>(`/locations/${id}`); },
      create(data: Record<string, unknown>) { return c.post<AdminLocation>('/locations', data); },
      update(id: string, data: Record<string, unknown>) { return c.patch<AdminLocation>(`/locations/${id}`, data); },
      remove(id: string) { return c.del<void>(`/locations/${id}`); },
      setHours(id: string, data: SetLocationHoursDto) { return c.put<void>(`/locations/${id}/hours`, data); },
      getDeliveryZones(id: string) { return c.get<unknown[]>(`/locations/${id}/delivery-zones`); },
      createDeliveryZone(id: string, data: Record<string, unknown>) { return c.post<unknown>(`/locations/${id}/delivery-zones`, data); },
      updateDeliveryZone(zoneId: string, data: Record<string, unknown>) { return c.patch<unknown>(`/locations/delivery-zones/${zoneId}`, data); },
      removeDeliveryZone(zoneId: string) { return c.del<void>(`/locations/delivery-zones/${zoneId}`); },
    },

    // ─── End Users (Admin) ───────────────────────────────────────────

    endUsers: {
      list(params?: ListEndUsersQuery) { return c.paginated<AdminCustomer>('/end-users', params); },
      get(id: string) { return c.get<AdminCustomerDetail>(`/end-users/${id}`); },
      create(data: Record<string, unknown>) { return c.post<unknown>('/end-users', data); },
      bulkUpsert(data: BulkUpsertEndUsersDto) { return c.post<unknown>('/end-users/bulk', data); },
      update(id: string, data: Record<string, unknown>) { return c.patch<unknown>(`/end-users/${id}`, data); },
      remove(id: string) { return c.del<void>(`/end-users/${id}`); },
      block(id: string) { return c.post<void>(`/end-users/${id}/block`); },
      unblock(id: string) { return c.post<void>(`/end-users/${id}/unblock`); },
      updateAttributes(id: string, data: Record<string, unknown>) { return c.patch<unknown>(`/end-users/${id}/attributes`, data); },
      addTags(id: string, data: EndUserTagsDto) { return c.post<void>(`/end-users/${id}/tags`, data); },
      removeTags(id: string, data: EndUserTagsDto) { return c.del<void>(`/end-users/${id}/tags`); },
    },

    // ─── Audit ───────────────────────────────────────────────────────

    audit: {
      list(params?: PaginatedQuery & { action?: string; resource?: string }) { return c.paginated<AuditLog>('/audit', params); },
    },

    // ─── API Keys ────────────────────────────────────────────────────

    apiKeys: {
      list() { return c.get<ApiKey[]>('/api-keys'); },
      get(id: string) { return c.get<ApiKey>(`/api-keys/${id}`); },
      create(data: CreateApiKeyDto) { return c.post<ApiKey & { key: string }>('/api-keys', data); },
      update(id: string, data: UpdateApiKeyDto) { return c.patch<ApiKey>(`/api-keys/${id}`, data); },
      remove(id: string) { return c.del<void>(`/api-keys/${id}`); },
      rotate(id: string) { return c.post<ApiKey & { key: string }>(`/api-keys/${id}/rotate`); },
    },

    // ─── Settings ────────────────────────────────────────────────────

    settings: {
      getAll() { return c.get<{ grouped: Record<string, AdminSetting[]>; settings: AdminSetting[] }>('/settings'); },
      getGroup(group: string) { return c.get<Record<string, unknown>>(`/settings/${group}`); },
      set(group: string, key: string, data: SetSettingDto) { return c.put<void>(`/settings/${group}/${key}`, data); },
      bulkUpdate(data: BulkUpdateSettingsDto) { return c.put<void>('/settings', data); },
      remove(group: string, key: string) { return c.del<void>(`/settings/${group}/${key}`); },
    },

    // ─── Billing ─────────────────────────────────────────────────────

    billing: {
      currentPlan() { return c.get<unknown>('/billing/plan'); },
      plans() { return c.get<unknown[]>('/billing/plans'); },
      subscribe(data: SubscribeBillingPlanDto) { return c.post<unknown>('/billing/subscribe', data); },
      cancel() { return c.post<void>('/billing/cancel'); },
      invoices(params?: PaginatedQuery) { return c.paginated<unknown>('/billing/invoices', params); },
      invoice(id: string) { return c.get<unknown>(`/billing/invoices/${id}`); },
      usage() { return c.get<unknown>('/billing/usage'); },
    },

    // ─── Usage ───────────────────────────────────────────────────────

    usage: {
      current() { return c.get<unknown>('/usage'); },
      history(params?: PaginatedQuery) { return c.paginated<unknown>('/usage/history', params); },
      breakdown(params?: PaginatedQuery) { return c.paginated<unknown>('/usage/breakdown', params); },
    },

    // ─── Contact Messages ────────────────────────────────────────────

    contactMessages: {
      list(params?: PaginatedQuery) { return c.paginated<ContactMessage>('/contact-messages', params); },
      get(id: string) { return c.get<ContactMessage>(`/contact-messages/${id}`); },
      markRead(id: string) { return c.patch<void>(`/contact-messages/${id}/read`); },
      markUnread(id: string) { return c.patch<void>(`/contact-messages/${id}/unread`); },
      remove(id: string) { return c.del<void>(`/contact-messages/${id}`); },
    },

    // ─── Notifications ───────────────────────────────────────────────

    notifications: {
      list(params?: PaginatedQuery) { return c.paginated<Notification>('/notifications', params); },
      send(data: Record<string, unknown>) { return c.post<unknown>('/notifications/send', data); },
      sendBulk(data: Record<string, unknown>) { return c.post<unknown>('/notifications/send-bulk', data); },
      inApp(params?: PaginatedQuery) { return c.paginated<Notification>('/notifications/in-app', params); },
      unreadCount() { return c.get<{ count: number }>('/notifications/unread-count'); },
      get(id: string) { return c.get<Notification>(`/notifications/${id}`); },
      resend(id: string) { return c.post<void>(`/notifications/${id}/resend`); },
      markRead(id: string) { return c.patch<void>(`/notifications/${id}/read`); },
      markAllRead() { return c.post<void>('/notifications/read-all'); },
    },

    // ─── Templates ───────────────────────────────────────────────────

    templates: {
      list(params?: PaginatedQuery) { return c.paginated<unknown>('/templates', params); },
      get(id: string) { return c.get<unknown>(`/templates/${id}`); },
      create(data: Record<string, unknown>) { return c.post<unknown>('/templates', data); },
      update(id: string, data: Record<string, unknown>) { return c.patch<unknown>(`/templates/${id}`, data); },
      remove(id: string) { return c.del<void>(`/templates/${id}`); },
      preview(id: string, data: PreviewTemplateDto) { return c.post<unknown>(`/templates/${id}/preview`, data); },
    },

    // ─── Segments ────────────────────────────────────────────────────

    segments: {
      list(params?: PaginatedQuery) { return c.paginated<unknown>('/segments', params); },
      get(id: string) { return c.get<unknown>(`/segments/${id}`); },
      create(data: Record<string, unknown>) { return c.post<unknown>('/segments', data); },
      update(id: string, data: Record<string, unknown>) { return c.patch<unknown>(`/segments/${id}`, data); },
      remove(id: string) { return c.del<void>(`/segments/${id}`); },
      preview(id: string) { return c.post<unknown>(`/segments/${id}/preview`); },
      members(id: string, params?: PaginatedQuery) { return c.paginated<unknown>(`/segments/${id}/members`, params); },
      addMembers(id: string, data: AddSegmentMembersDto) { return c.post<void>(`/segments/${id}/members`, data); },
      removeMember(segmentId: string, userId: string) { return c.del<void>(`/segments/${segmentId}/members/${userId}`); },
    },

    // ─── Campaigns ───────────────────────────────────────────────────

    campaigns: {
      list(params?: StatusQuery) { return c.paginated<unknown>('/campaigns', params); },
      get(id: string) { return c.get<unknown>(`/campaigns/${id}`); },
      create(data: Record<string, unknown>) { return c.post<unknown>('/campaigns', data); },
      update(id: string, data: Record<string, unknown>) { return c.patch<unknown>(`/campaigns/${id}`, data); },
      remove(id: string) { return c.del<void>(`/campaigns/${id}`); },
      launch(id: string) { return c.post<void>(`/campaigns/${id}/launch`); },
      schedule(id: string, data: ScheduleCampaignDto) { return c.post<void>(`/campaigns/${id}/schedule`, data); },
      pause(id: string) { return c.post<void>(`/campaigns/${id}/pause`); },
      resume(id: string) { return c.post<void>(`/campaigns/${id}/resume`); },
      cancel(id: string) { return c.post<void>(`/campaigns/${id}/cancel`); },
      logs(id: string, params?: PaginatedQuery) { return c.paginated<unknown>(`/campaigns/${id}/logs`, params); },
      analytics(id: string) { return c.get<unknown>(`/campaigns/${id}/analytics`); },
    },

    // ─── Webhooks ────────────────────────────────────────────────────

    webhooks: {
      list() { return c.get<unknown[]>('/webhooks'); },
      get(id: string) { return c.get<unknown>(`/webhooks/${id}`); },
      create(data: Record<string, unknown>) { return c.post<unknown>('/webhooks', data); },
      update(id: string, data: Record<string, unknown>) { return c.patch<unknown>(`/webhooks/${id}`, data); },
      remove(id: string) { return c.del<void>(`/webhooks/${id}`); },
      test(id: string) { return c.post<unknown>(`/webhooks/${id}/test`); },
      logs(id: string, params?: PaginatedQuery) { return c.paginated<unknown>(`/webhooks/${id}/logs`, params); },
      retryLog(webhookId: string, logId: string) { return c.post<void>(`/webhooks/${webhookId}/retry/${logId}`); },
    },

    // ─── Loyalty (Admin) ─────────────────────────────────────────────

    loyalty: {
      accounts(params?: PaginatedQuery) { return c.paginated<LoyaltyAccount>('/loyalty/accounts', params); },
      getAccount(id: string) { return c.get<LoyaltyAccount>(`/loyalty/accounts/${id}`); },
      adjustPoints(id: string, data: AdjustLoyaltyPointsDto) { return c.post<void>(`/loyalty/accounts/${id}/adjust`, data); },
      rewards() { return c.get<LoyaltyReward[]>('/loyalty/rewards'); },
      getReward(id: string) { return c.get<LoyaltyReward>(`/loyalty/rewards/${id}`); },
      createReward(data: Record<string, unknown>) { return c.post<LoyaltyReward>('/loyalty/rewards', data); },
      updateReward(id: string, data: Record<string, unknown>) { return c.patch<LoyaltyReward>(`/loyalty/rewards/${id}`, data); },
      removeReward(id: string) { return c.del<void>(`/loyalty/rewards/${id}`); },
    },

    // ─── Coupons (Admin) ─────────────────────────────────────────────

    coupons: {
      list(params?: StatusQuery) { return c.paginated<AdminCoupon>('/coupons', params); },
      get(id: string) { return c.get<AdminCoupon>(`/coupons/${id}`); },
      create(data: Record<string, unknown>) { return c.post<AdminCoupon>('/coupons', data); },
      update(id: string, data: Record<string, unknown>) { return c.patch<AdminCoupon>(`/coupons/${id}`, data); },
      remove(id: string) { return c.del<void>(`/coupons/${id}`); },
    },

    // ─── Promotions (Admin) ──────────────────────────────────────────

    promotions: {
      list(params?: PaginatedQuery) { return c.paginated<AdminPromotion>('/promotions', params); },
      get(id: string) { return c.get<AdminPromotion>(`/promotions/${id}`); },
      create(data: Record<string, unknown>) { return c.post<AdminPromotion>('/promotions', data); },
      update(id: string, data: Record<string, unknown>) { return c.patch<AdminPromotion>(`/promotions/${id}`, data); },
      remove(id: string) { return c.del<void>(`/promotions/${id}`); },
    },

    // ─── Reviews (Admin) ─────────────────────────────────────────────

    reviews: {
      list(params?: StatusQuery) { return c.paginated<AdminReview>('/reviews', params); },
      updateStatus(id: string, data: UpdateReviewStatusDto) { return c.patch<AdminReview>(`/reviews/${id}/status`, data); },
    },

    // ─── Gift Cards (Admin) ──────────────────────────────────────────

    giftCards: {
      list(params?: PaginatedQuery) { return c.paginated<AdminGiftCard>('/gift-cards', params); },
      get(id: string) { return c.get<AdminGiftCard>(`/gift-cards/${id}`); },
      create(data: Record<string, unknown>) { return c.post<AdminGiftCard>('/gift-cards', data); },
    },

    // ─── Reservations (Admin) ────────────────────────────────────────

    reservations: {
      list(params?: StatusQuery) { return c.paginated<AdminReservation>('/reservations', params); },
      updateStatus(id: string, data: UpdateReservationStatusDto) { return c.patch<AdminReservation>(`/reservations/${id}/status`, data); },
      resources() { return c.get<AdminReservationTable[]>('/reservations/resources'); },
      createResource(data: Record<string, unknown>) { return c.post<AdminReservationTable>('/reservations/resources', data); },
      updateResource(id: string, data: Record<string, unknown>) { return c.patch<AdminReservationTable>(`/reservations/resources/${id}`, data); },
      removeResource(id: string) { return c.del<void>(`/reservations/resources/${id}`); },
    },

    // ─── Support (Admin) ─────────────────────────────────────────────

    support: {
      list(params?: StatusQuery) { return c.paginated<AdminTicket>('/support', params); },
      get(id: string) { return c.get<AdminTicketDetail>(`/support/${id}`); },
      update(id: string, data: UpdateSupportTicketDto) { return c.patch<AdminTicketDetail>(`/support/${id}`, data); },
      reply(ticketId: string, data: { body: string }) { return c.post<AdminTicketMessage>(`/support/${ticketId}/reply`, data); },
    },

    // ─── Content (Admin) ─────────────────────────────────────────────

    content: {
      list(params?: StatusQuery) { return c.paginated<AdminBlogPost>('/content', params); },
      get(id: string) { return c.get<AdminBlogPost>(`/content/${id}`); },
      create(data: Record<string, unknown>) { return c.post<AdminBlogPost>('/content', data); },
      update(id: string, data: Record<string, unknown>) { return c.patch<AdminBlogPost>(`/content/${id}`, data); },
      remove(id: string) { return c.del<void>(`/content/${id}`); },
    },

    // ─── Payments (Admin) ────────────────────────────────────────────

    payments: {
      list(params?: PaginatedQuery) { return c.paginated<unknown>('/payments', params); },
      get(id: string) { return c.get<unknown>(`/payments/${id}`); },
      createOrder(data: Record<string, unknown>) { return c.post<unknown>('/payments/orders', data); },
      verifyOrder(orderId: string, data: Record<string, unknown>) { return c.post<unknown>(`/payments/orders/${orderId}/verify`, data); },
      listOrders(params?: PaginatedQuery) { return c.paginated<unknown>('/payments/orders', params); },
      getOrder(id: string) { return c.get<unknown>(`/payments/orders/${id}`); },
      createRefund(paymentId: string, data: Record<string, unknown>) { return c.post<unknown>(`/payments/${paymentId}/refunds`, data); },
      listRefunds(paymentId: string) { return c.get<unknown[]>(`/payments/${paymentId}/refunds`); },
      createSubscription(data: Record<string, unknown>) { return c.post<unknown>('/payments/subscriptions', data); },
      listSubscriptions(params?: PaginatedQuery) { return c.paginated<unknown>('/payments/subscriptions', params); },
      getSubscription(id: string) { return c.get<unknown>(`/payments/subscriptions/${id}`); },
      pauseSubscription(id: string) { return c.post<void>(`/payments/subscriptions/${id}/pause`); },
      resumeSubscription(id: string) { return c.post<void>(`/payments/subscriptions/${id}/resume`); },
      cancelSubscription(id: string) { return c.post<void>(`/payments/subscriptions/${id}/cancel`); },
      createLink(data: Record<string, unknown>) { return c.post<unknown>('/payments/links', data); },
      listLinks(params?: PaginatedQuery) { return c.paginated<unknown>('/payments/links', params); },
      getLink(id: string) { return c.get<unknown>(`/payments/links/${id}`); },
      deactivateLink(id: string) { return c.post<void>(`/payments/links/${id}/deactivate`); },
      removeLink(id: string) { return c.del<void>(`/payments/links/${id}`); },
      createProduct(data: Record<string, unknown>) { return c.post<unknown>('/payments/products', data); },
      listProducts(params?: PaginatedQuery) { return c.paginated<unknown>('/payments/products', params); },
      getProduct(id: string) { return c.get<unknown>(`/payments/products/${id}`); },
      updateProduct(id: string, data: Record<string, unknown>) { return c.patch<unknown>(`/payments/products/${id}`, data); },
      removeProduct(id: string) { return c.del<void>(`/payments/products/${id}`); },
    },

    // ─── Property (Admin) ────────────────────────────────────────────

    property: {
      getTypes() { return c.get<unknown[]>('/property/types'); },
      getType(id: string) { return c.get<unknown>(`/property/types/${id}`); },
      createType(data: Record<string, unknown>) { return c.post<unknown>('/property/types', data); },
      updateType(id: string, data: Record<string, unknown>) { return c.patch<unknown>(`/property/types/${id}`, data); },
      removeType(id: string) { return c.del<void>(`/property/types/${id}`); },
      setAmenities(typeId: string, data: SetPropertyTypeAmenitiesDto) { return c.put<void>(`/property/types/${typeId}/amenities`, data); },
      getUnits() { return c.get<unknown[]>('/property/units'); },
      createUnit(data: Record<string, unknown>) { return c.post<unknown>('/property/units', data); },
      updateUnit(id: string, data: Record<string, unknown>) { return c.patch<unknown>(`/property/units/${id}`, data); },
      updateHousekeeping(id: string, data: UpdateHousekeepingDto) { return c.patch<unknown>(`/property/units/${id}/housekeeping`, data); },
      getAmenities() { return c.get<unknown[]>('/property/amenities'); },
      createAmenity(data: CreatePropertyAmenityDto) { return c.post<unknown>('/property/amenities', data); },
      listBookings(params?: StatusQuery) { return c.paginated<unknown>('/property/bookings', params); },
      getBooking(id: string) { return c.get<unknown>(`/property/bookings/${id}`); },
      updateBooking(id: string, data: Record<string, unknown>) { return c.patch<unknown>(`/property/bookings/${id}`, data); },
      checkIn(id: string) { return c.post<void>(`/property/bookings/${id}/check-in`); },
      checkOut(id: string) { return c.post<void>(`/property/bookings/${id}/check-out`); },
      cancelBooking(id: string, data?: AdminCancelBookingDto) { return c.post<unknown>(`/property/bookings/${id}/cancel`, data); },
      assignUnits(id: string, data: AssignPropertyUnitsDto) { return c.post<void>(`/property/bookings/${id}/assign-units`, data); },
      availability(params: Record<string, unknown>) { return c.get<unknown[]>(`/property/inventory/availability${toQsInline(params)}`); },
      calendar(params: Record<string, unknown>) { return c.get<unknown[]>(`/property/inventory/calendar${toQsInline(params)}`); },
      blockDates(data: Record<string, unknown>) { return c.post<void>('/property/inventory/block', data); },
      createHold(data: Record<string, unknown>) { return c.post<unknown>('/property/inventory/hold', data); },
      listPricingRules() { return c.get<unknown[]>('/property/pricing'); },
      createPricingRule(data: Record<string, unknown>) { return c.post<unknown>('/property/pricing', data); },
      updatePricingRule(id: string, data: Record<string, unknown>) { return c.patch<unknown>(`/property/pricing/${id}`, data); },
      removePricingRule(id: string) { return c.del<void>(`/property/pricing/${id}`); },
      resolvePrice(data: Record<string, unknown>) { return c.post<unknown>('/property/pricing/resolve', data); },
    },

    // ─── POS ─────────────────────────────────────────────────────────

    pos: {
      sync() { return c.post<void>('/pos/sync'); },
      logs(params?: PaginatedQuery) { return c.paginated<unknown>('/pos/logs', params); },
    },

    // ─── Upload ──────────────────────────────────────────────────────

    upload(file: File | Blob, folder?: string) {
      const formData = new FormData();
      formData.append('file', file);
      if (folder) formData.append('folder', folder);
      return c.upload<UploadResult>('/upload', formData);
    },

    // ─── Student Passes (Admin) ──────────────────────────────────────

    studentPasses: {
      list(params?: ListStudentPassesQuery) { return c.paginated<AdminStudentPass>('/student-passes', params); },
      get(id: string) { return c.get<AdminStudentPassDetail>(`/student-passes/${id}`); },
      review(id: string, data: ReviewStudentPassDto) { return c.patch<AdminStudentPassDetail>(`/student-passes/${id}`, data); },
      bulkReview(data: BulkReviewStudentPassesDto) { return c.patch<void>('/student-passes', data); },
      stats() { return c.get<AdminStudentPassStats>('/student-passes/stats'); },
    },

    // ─── Student Discounts (Admin) ───────────────────────────────────

    studentDiscounts: {
      list(params?: PaginatedQuery) { return c.paginated<AdminStudentDiscount>('/student-discounts', params); },
      get(id: string) { return c.get<AdminStudentDiscount>(`/student-discounts/${id}`); },
      create(data: CreateStudentDiscountDto) { return c.post<AdminStudentDiscount>('/student-discounts', data); },
      update(id: string, data: UpdateStudentDiscountDto) { return c.patch<AdminStudentDiscount>(`/student-discounts/${id}`, data); },
      remove(id: string) { return c.del<void>(`/student-discounts/${id}`); },
    },

    // ─── Institutions (Admin) ────────────────────────────────────────

    institutions: {
      list(params?: PaginatedQuery) { return c.paginated<AdminInstitution>('/institutions', params); },
      get(id: string) { return c.get<AdminInstitution>(`/institutions/${id}`); },
      create(data: CreateInstitutionDto) { return c.post<AdminInstitution>('/institutions', data); },
      update(id: string, data: UpdateInstitutionDto) { return c.patch<AdminInstitution>(`/institutions/${id}`, data); },
      remove(id: string) { return c.del<void>(`/institutions/${id}`); },
    },

    // ─── Inventory (Admin) ───────────────────────────────────────────

    inventory: {
      list(params?: PaginatedQuery) { return c.paginated<Ingredient>('/inventory', params); },
      get(id: string) { return c.get<Ingredient>(`/inventory/${id}`); },
      create(data: CreateIngredientDto) { return c.post<Ingredient>('/inventory', data); },
      update(id: string, data: UpdateIngredientDto) { return c.patch<Ingredient>(`/inventory/${id}`, data); },
      remove(id: string) { return c.del<void>(`/inventory/${id}`); },
      alerts: {
        list() { return c.get<StockAlert[]>('/inventory/alerts'); },
        resolve(id: string) { return c.patch<StockAlert>(`/inventory/alerts/${id}`, { isResolved: true }); },
      },
      waste: {
        list() { return c.get<WasteLog[]>('/inventory/waste'); },
        create(data: CreateWasteLogDto) { return c.post<WasteLog>('/inventory/waste', data); },
      },
    },

    // ─── Suppliers (Admin) ────────────────────────────────────────────

    suppliers: {
      list(params?: PaginatedQuery) { return c.paginated<Supplier>('/suppliers', params); },
      get(id: string) { return c.get<Supplier>(`/suppliers/${id}`); },
      create(data: CreateSupplierDto) { return c.post<Supplier>('/suppliers', data); },
      update(id: string, data: UpdateSupplierDto) { return c.patch<Supplier>(`/suppliers/${id}`, data); },
      remove(id: string) { return c.del<void>(`/suppliers/${id}`); },
    },

    // ─── Purchase Orders (Admin) ──────────────────────────────────────

    purchaseOrders: {
      list(params?: QueryPurchaseOrdersParams) { return c.paginated<PurchaseOrder>('/purchase-orders', params); },
      get(id: string) { return c.get<PurchaseOrder>(`/purchase-orders/${id}`); },
      create(data: CreatePurchaseOrderDto) { return c.post<PurchaseOrder>('/purchase-orders', data); },
      update(id: string, data: UpdatePurchaseOrderDto) { return c.patch<PurchaseOrder>(`/purchase-orders/${id}`, data); },
      remove(id: string) { return c.del<void>(`/purchase-orders/${id}`); },
    },

    // ─── Meal Subscriptions (Admin) ───────────────────────────────────

    mealSubscriptions: {
      list(params?: QueryMealSubscriptionsParams) { return c.paginated<AdminMealSubscription>('/subscriptions', params); },
      get(id: string) { return c.get<AdminMealSubscription>(`/subscriptions/${id}`); },
    },

    // ─── Meal Plans (Admin) ──────────────────────────────────────────

    mealPlans: {
      list(params?: PaginatedQuery) { return c.paginated<MealPlan>('/meal-plans', params); },
      get(id: string) { return c.get<MealPlan>(`/meal-plans/${id}`); },
      create(data: CreateMealPlanDto) { return c.post<MealPlan>('/meal-plans', data); },
      update(id: string, data: UpdateMealPlanDto) { return c.patch<MealPlan>(`/meal-plans/${id}`, data); },
      remove(id: string) { return c.del<void>(`/meal-plans/${id}`); },
    },

    // ─── Help Articles (Admin) ───────────────────────────────────────

    helpArticles: {
      list(params?: PaginatedQuery) { return c.paginated<AdminHelpArticle>('/help', params); },
      get(id: string) { return c.get<AdminHelpArticle>(`/help/${id}`); },
      create(data: CreateHelpArticleDto) { return c.post<AdminHelpArticle>('/help', data); },
      update(id: string, data: UpdateHelpArticleDto) { return c.patch<AdminHelpArticle>(`/help/${id}`, data); },
      remove(id: string) { return c.del<void>(`/help/${id}`); },
    },

    // ─── Dashboard ─────────────────────────────────────────────────────

    dashboard: {
      get(params?: AdminDashboardQuery) { return c.get<AdminDashboardData>(`/admin/dashboard${params ? toQsInline(params) : ''}`); },
    },

    // ─── Loyalty (Extended Admin View) ─────────────────────────────────

    loyaltyAdmin: {
      get(params?: { search?: string }) { return c.get<AdminLoyaltyData>(`/admin/loyalty${params?.search ? '?search=' + encodeURIComponent(params.search) : ''}`); },
    },

    // ─── Rewards / Redemptions ─────────────────────────────────────────

    redemptions: {
      list(params?: { status?: string }) { return c.get<AdminRedemption[]>(`/admin/rewards${params?.status && params.status !== 'all' ? '?status=' + params.status : ''}`); },
      fulfill(data: FulfillRewardDto) { return c.post<AdminFulfillResult>('/admin/rewards', data); },
    },

    // ─── Delivery Agents & Zones ───────────────────────────────────────

    deliveryAgents: {
      list() { return c.get<AdminDeliveryAgent[]>('/admin/delivery/agents'); },
      create(data: CreateDeliveryAgentDto) { return c.post<AdminDeliveryAgent>('/admin/delivery/agents', data); },
      update(id: string, data: UpdateDeliveryAgentDto) { return c.patch<AdminDeliveryAgent>(`/admin/delivery/agents/${id}`, data); },
      remove(id: string) { return c.del<void>(`/admin/delivery/agents/${id}`); },
    },

    deliveryZones: {
      list() { return c.get<AdminDeliveryZone[]>('/admin/delivery/zones'); },
      create(data: CreateDeliveryZoneDto) { return c.post<AdminDeliveryZone>('/admin/delivery/zones', data); },
      update(id: string, data: UpdateDeliveryZoneDto) { return c.patch<AdminDeliveryZone>(`/admin/delivery/zones/${id}`, data); },
      remove(id: string) { return c.del<void>(`/admin/delivery/zones/${id}`); },
    },

    // ─── Marketing ─────────────────────────────────────────────────────

    affiliates: {
      list() { return c.get<AdminAffiliate[]>('/admin/marketing/affiliates'); },
      update(id: string, data: Record<string, unknown>) { return c.patch<AdminAffiliate>(`/admin/marketing/affiliates/${id}`, data); },
    },

    popups: {
      get() { return c.get<AdminPopupSettings>('/admin/marketing/popups'); },
      update(data: UpdatePopupSettingsDto) { return c.patch<AdminPopupSettings>('/admin/marketing/popups', data); },
    },

    // ─── Finance ───────────────────────────────────────────────────────

    finance: {
      invoices(params?: AdminFinanceQuery) { return c.paginated<AdminInvoice>('/admin/finance/invoices', params); },
      tax(params?: { startDate?: string; endDate?: string }) { return c.get<AdminTaxSummary>(`/admin/finance/tax${params ? toQsInline(params) : ''}`); },
      settlements(params?: AdminFinanceQuery) { return c.paginated<AdminSettlement>('/admin/finance/settlements', params); },
      payouts(params?: AdminFinanceQuery) { return c.paginated<AdminPayout>('/admin/finance/payouts', params); },
      markPaid(id: string) { return c.patch<void>(`/admin/finance/payouts/${id}`, { isPaid: true }); },
      createPayout(data: Record<string, unknown>) { return c.post<AdminPayout>('/admin/finance/payouts', data); },
      markPayoutPaid(id: string) { return c.patch<void>(`/admin/finance/payouts/${id}`, { isPaid: true }); },
      exportReport(params?: Record<string, unknown>) { return c.post<{ url: string }>('/admin/reports/export', params); },
    },

    // ─── Reports ───────────────────────────────────────────────────────

    reports: {
      get(type: string, params?: Record<string, unknown>) { return c.get<Record<string, unknown>>(`/admin/reports?type=${type}${params ? '&' + new URLSearchParams(Object.entries(params).filter(([,v]) => v != null).map(([k,v]) => [k, String(v)])).toString() : ''}`); },
    },

    // ─── Broadcast Notifications ───────────────────────────────────────

    broadcast: {
      list() { return c.get<AdminBroadcast[]>('/admin/notifications/broadcast'); },
      send(data: CreateBroadcastDto) { return c.post<AdminBroadcast>('/admin/notifications/broadcast', data); },
    },

    // ─── Scheduled Orders ──────────────────────────────────────────────

    scheduledOrders: {
      list(params?: AdminScheduledOrdersQuery) { return c.get<AdminScheduledOrder[]>(`/admin/scheduled-orders${params ? toQsInline(params) : ''}`); },
      catering() { return c.get<AdminScheduledOrder[]>('/admin/catering'); },
    },

    // ─── Abandoned Carts ───────────────────────────────────────────────

    abandonedCarts: {
      list(params?: AdminAbandonedCartsQuery) { return c.paginated<AdminAbandonedCart>('/admin/abandoned-carts', params); },
      recover(id: string) { return c.post<void>(`/admin/abandoned-carts/${id}/recover`); },
    },

    // ─── Waitlists ─────────────────────────────────────────────────────

    waitlists: {
      list() { return c.get<AdminWaitlistGroup[]>('/admin/waitlists'); },
      notify(menuItemId: string) { return c.post<void>(`/admin/waitlists/${menuItemId}/notify`); },
    },

    // ─── Reservation Slots ─────────────────────────────────────────────

    reservationSlots: {
      list() { return c.get<AdminReservationSlot[]>('/admin/reservations/slots'); },
      create(data: CreateReservationSlotDto) { return c.post<AdminReservationSlot>('/admin/reservations/slots', data); },
      update(id: string, data: UpdateReservationSlotDto) { return c.patch<AdminReservationSlot>(`/admin/reservations/slots/${id}`, data); },
      remove(id: string) { return c.del<void>(`/admin/reservations/slots/${id}`); },
    },

    // ─── Reservation Tables ────────────────────────────────────────────

    reservationTables: {
      list() { return c.get<AdminReservationTable[]>('/admin/reservations/tables'); },
      create(data: CreateReservationTableDto) { return c.post<AdminReservationTable>('/admin/reservations/tables', data); },
      update(id: string, data: UpdateReservationTableDto) { return c.patch<AdminReservationTable>(`/admin/reservations/tables/${id}`, data); },
      remove(id: string) { return c.del<void>(`/admin/reservations/tables/${id}`); },
    },

    // ─── SpinWheel (Shopify App) ──────────────────────────────────────────

    spinWheel: {
      campaigns: {
        list(params: PaginatedQuery & { shopDomain?: string; status?: string } = {}) {
          return c.get(`/shopify/spinwheel/campaigns${toQsInline(params)}`);
        },
        get(id: string) { return c.get(`/shopify/spinwheel/campaigns/${id}`); },
        create(data: Record<string, unknown>) { return c.post('/shopify/spinwheel/campaigns', data); },
        update(id: string, data: Record<string, unknown>) { return c.put(`/shopify/spinwheel/campaigns/${id}`, data); },
        updateStatus(id: string, status: string) { return c.patch(`/shopify/spinwheel/campaigns/${id}/status`, { status }); },
        remove(id: string) { return c.del(`/shopify/spinwheel/campaigns/${id}`); },
      },
      slices: {
        add(campaignId: string, data: Record<string, unknown>) { return c.post(`/shopify/spinwheel/campaigns/${campaignId}/slices`, data); },
        update(campaignId: string, sliceId: string, data: Record<string, unknown>) { return c.put(`/shopify/spinwheel/campaigns/${campaignId}/slices/${sliceId}`, data); },
        remove(campaignId: string, sliceId: string) { return c.del(`/shopify/spinwheel/campaigns/${campaignId}/slices/${sliceId}`); },
        reorder(campaignId: string, sliceIds: string[]) { return c.put(`/shopify/spinwheel/campaigns/${campaignId}/slices/reorder`, { sliceIds }); },
      },
      analytics: {
        campaign(campaignId: string, params: { startDate?: string; endDate?: string } = {}) {
          return c.get(`/shopify/spinwheel/campaigns/${campaignId}/analytics${toQsInline(params)}`);
        },
        overview(shopDomain?: string) {
          return c.get(`/shopify/spinwheel/analytics/overview${shopDomain ? `?shopDomain=${shopDomain}` : ''}`);
        },
      },
      leads: {
        list(campaignId: string, params: PaginatedQuery & { email?: string; redeemed?: string } = {}) {
          return c.get(`/shopify/spinwheel/campaigns/${campaignId}/leads${toQsInline(params)}`);
        },
        exportCsv(campaignId: string) {
          return c.get(`/shopify/spinwheel/campaigns/${campaignId}/leads/export`);
        },
      },
    },
  };
}

function toQsInline(params: Record<string, unknown> | object): string {
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => [k, String(v)]);
  return entries.length ? '?' + new URLSearchParams(entries).toString() : '';
}
