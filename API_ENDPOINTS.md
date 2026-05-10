# API Endpoints Reference

> Auto-generated endpoint map for the Darsh Gupta Backend.
> Last updated: 2026-03-18

## Auth Levels

| Level | Guard | Description |
|-------|-------|-------------|
| `PUBLIC` | `@Public()` | No authentication required |
| `USER` | Global `JwtAuthGuard` | Org-admin JWT — any authenticated staff user |
| `ENDUSER` | `EndUserJwtGuard` | Storefront end-user JWT |
| `SUPERADMIN` | `SuperAdminGuard` | Platform super-admin JWT (HS256) |

## Storefront Headers

All `/api/v1/storefront/*` routes require both headers:

| Header | Format | Description |
|--------|--------|-------------|
| `X-Org-Slug` | `my-store` | Organization slug |
| `X-Org-Key` | `tz_...` | Publishable storefront key (generated per org) |

The key is returned when creating an org via super admin and can be regenerated via `POST /api/v1/admin/orgs/:id/regenerate-key`.

---

## 1. Auth

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | POST | `/api/v1/auth/register` | Register a new user | `RegisterDto` | PUBLIC | users, organizations |
| 2 | POST | `/api/v1/auth/login` | Log in with email and password | `LoginDto` | PUBLIC | users, sessions |
| 3 | POST | `/api/v1/auth/logout` | Log out and revoke refresh token | `RefreshTokenDto` | USER | sessions |
| 4 | POST | `/api/v1/auth/refresh` | Refresh access token using refresh token | `RefreshTokenDto` | PUBLIC | sessions |
| 5 | POST | `/api/v1/auth/magic-link` | Request a magic link for passwordless login | `RequestMagicLinkDto` | PUBLIC | magic_links, users |
| 6 | GET | `/api/v1/auth/magic-link/verify` | Verify a magic link token | `VerifyMagicLinkDto` | PUBLIC | magic_links, users |
| 7 | POST | `/api/v1/auth/otp/send` | Send an OTP to the given identifier | `SendOtpDto` | PUBLIC | otp, users |
| 8 | POST | `/api/v1/auth/otp/verify` | Verify an OTP and receive tokens | `VerifyOtpDto` | PUBLIC | otp, users |
| 9 | POST | `/api/v1/auth/password/reset-request` | Request a password reset email | `RequestPasswordResetDto` | PUBLIC | password_resets, users |
| 10 | POST | `/api/v1/auth/password/reset` | Reset password using a token | `ResetPasswordDto` | PUBLIC | password_resets, users |
| 11 | POST | `/api/v1/auth/password/change` | Change password (authenticated users) | `ChangePasswordDto` | USER | users |

## 2. End-User Auth (Storefront)

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | POST | `/api/v1/storefront/auth/register` | Register a new end user | `EndUserRegisterDto` | PUBLIC | end_users |
| 2 | POST | `/api/v1/storefront/auth/login` | Log in with email/phone and password | `EndUserLoginDto` | PUBLIC | end_users, sessions |
| 3 | POST | `/api/v1/storefront/auth/guest` | Create a guest session | `EndUserGuestDto` | PUBLIC | end_users, sessions |
| 4 | POST | `/api/v1/storefront/auth/logout` | Log out and revoke refresh token | `EndUserRefreshTokenDto` | ENDUSER | sessions |
| 5 | POST | `/api/v1/storefront/auth/refresh` | Refresh access token | `EndUserRefreshTokenDto` | PUBLIC | sessions |
| 6 | POST | `/api/v1/storefront/auth/send-otp` | Send OTP to phone/email | `EndUserSendOtpDto` | PUBLIC | otp |
| 7 | POST | `/api/v1/storefront/auth/verify-otp` | Verify OTP and receive tokens | `EndUserVerifyOtpDto` | PUBLIC | otp, end_users |
| 8 | POST | `/api/v1/storefront/auth/request-reset` | Request password reset | `EndUserRequestResetDto` | PUBLIC | password_resets |
| 9 | POST | `/api/v1/storefront/auth/reset-password` | Reset password with token | `EndUserResetPasswordDto` | PUBLIC | password_resets, end_users |
| 10 | POST | `/api/v1/storefront/auth/forgot-password` | Alias for request-reset | `EndUserRequestResetDto` | PUBLIC | password_resets |
| 11 | POST | `/api/v1/storefront/auth/start-signup` | Step 1: Start signup with phone, sends OTP | `StartSignupDto` | PUBLIC | end_users, otp |
| 12 | POST | `/api/v1/storefront/auth/verify-signup-otp` | Step 2: Verify signup OTP, returns temp tokens | `VerifySignupOtpDto` | PUBLIC | end_users, otp |
| 13 | POST | `/api/v1/storefront/auth/complete-signup` | Step 3: Complete signup with name, email, password | `CompleteSignupDto` | ENDUSER | end_users |
| 14 | GET | `/api/v1/storefront/auth/me` | Get current user profile | — | ENDUSER | end_users |
| 15 | PATCH | `/api/v1/storefront/auth/profile` | Update user profile | `EndUserUpdateProfileDto` | ENDUSER | end_users |
| 16 | POST | `/api/v1/storefront/auth/change-password` | Change password (authenticated) | inline | ENDUSER | end_users |
| 17 | GET | `/api/v1/storefront/auth/google` | Initiate Google OAuth flow | — | PUBLIC | — |
| 18 | GET | `/api/v1/storefront/auth/google/callback` | Google OAuth callback | — | PUBLIC | end_users, organizations |
| 19 | GET | `/api/v1/storefront/auth/facebook` | Initiate Facebook OAuth flow | — | PUBLIC | — |
| 20 | GET | `/api/v1/storefront/auth/facebook/callback` | Facebook OAuth callback | — | PUBLIC | end_users, organizations |

## 3. Health

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/health` | Basic health check | — | PUBLIC | — |
| 2 | GET | `/api/v1/health/detailed` | Detailed health check with dependency status | — | USER | database, redis |

## 4. Users

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/users` | List users in the organization (paginated) | `QueryUsersDto` | USER | users |
| 2 | GET | `/api/v1/users/me` | Get own profile | — | USER | users, user_roles |
| 3 | GET | `/api/v1/users/:id` | Get user by ID | — | USER | users |
| 4 | POST | `/api/v1/users/invite` | Invite a new user to the organization | `InviteUserDto` | USER | users, user_roles |
| 5 | PATCH | `/api/v1/users/:id` | Update user | `UpdateUserDto` | USER | users |
| 6 | DELETE | `/api/v1/users/:id` | Soft-delete user | — | USER | users |
| 7 | POST | `/api/v1/users/:id/suspend` | Suspend user | — | USER | users |
| 8 | POST | `/api/v1/users/:id/reinstate` | Reinstate suspended user | — | USER | users |
| 9 | POST | `/api/v1/users/:id/roles` | Assign roles to user (replaces existing) | `AssignRolesDto` | USER | user_roles, roles |

## 5. Organizations

### Admin (Super Admin)

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | POST | `/api/v1/admin/orgs` | Create a new organization | `CreateOrganizationDto` | SUPERADMIN | organizations |
| 2 | GET | `/api/v1/admin/orgs` | List all organizations (paginated) | `QueryOrganizationDto` | SUPERADMIN | organizations |
| 3 | GET | `/api/v1/admin/orgs/:id` | Get organization by ID | — | SUPERADMIN | organizations |
| 4 | GET | `/api/v1/admin/orgs/slug/:slug` | Get organization by slug | — | SUPERADMIN | organizations |
| 5 | PATCH | `/api/v1/admin/orgs/:id` | Update organization | `UpdateOrganizationDto` | SUPERADMIN | organizations |
| 6 | DELETE | `/api/v1/admin/orgs/:id` | Soft-delete organization | — | SUPERADMIN | organizations |
| 7 | POST | `/api/v1/admin/orgs/:id/suspend` | Suspend organization | — | SUPERADMIN | organizations |
| 8 | POST | `/api/v1/admin/orgs/:id/reinstate` | Reinstate suspended organization | — | SUPERADMIN | organizations |
| 9 | POST | `/api/v1/admin/orgs/:id/regenerate-key` | Regenerate storefront API key for an organization | — | SUPERADMIN | organizations |

### Org Self

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/org/me` | Get my organization details | — | USER | organizations |
| 2 | PATCH | `/api/v1/org/me` | Update my organization | `UpdateOrganizationDto` | USER | organizations |

## 6. Roles

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/roles` | List all roles in the organization | — | USER | roles |
| 2 | GET | `/api/v1/roles/permissions` | List all available permissions | — | USER | — |
| 3 | GET | `/api/v1/roles/:id` | Get role by ID | — | USER | roles |
| 4 | POST | `/api/v1/roles` | Create a custom role | `CreateRoleDto` | USER | roles |
| 5 | PATCH | `/api/v1/roles/:id` | Update role | `UpdateRoleDto` | USER | roles |
| 6 | DELETE | `/api/v1/roles/:id` | Soft-delete role | — | USER | roles |

## 7. Super Admin

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | POST | `/api/v1/admin/login` | Super admin login | `LoginSuperAdminDto` | PUBLIC | super_admins |
| 2 | GET | `/api/v1/admin/stats` | Get platform-wide dashboard statistics | — | SUPERADMIN | organizations, users, campaigns |
| 3 | GET | `/api/v1/admin/super-admins` | List super admin accounts | `QueryAdminDto` | SUPERADMIN | super_admins |
| 4 | POST | `/api/v1/admin/super-admins` | Create a new super admin account | `CreateSuperAdminDto` | SUPERADMIN | super_admins |
| 5 | POST | `/api/v1/admin/orgs/:id/impersonate` | Impersonate an organization | — | SUPERADMIN | organizations |
| 6 | GET | `/api/v1/admin/usage` | Get global per-organization usage breakdown | — | SUPERADMIN | usage_records |
| 7 | GET | `/api/v1/admin/invoices` | List all invoices across organizations | `QueryAdminInvoicesDto` | SUPERADMIN | invoices |
| 8 | PATCH | `/api/v1/admin/invoices/:id` | Mark an invoice as paid | — | SUPERADMIN | invoices |
| 9 | POST | `/api/v1/admin/plans` | Create a new plan | inline | SUPERADMIN | plans |
| 10 | PATCH | `/api/v1/admin/plans/:id` | Update a plan | inline | SUPERADMIN | plans |

## 8. Audit

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/audit` | Get audit logs for the current organization | `QueryAuditDto` | USER | audit_logs |
| 2 | GET | `/api/v1/admin/audit` | Get audit logs across all organizations (super admin) | `QueryAdminAuditDto` | SUPERADMIN | audit_logs |

## 9. API Keys

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/api-keys` | List all API keys (metadata only, no hashes) | — | USER | api_keys |
| 2 | POST | `/api/v1/api-keys` | Create a new API key (plain key returned only once) | `CreateApiKeyDto` | USER | api_keys |
| 3 | GET | `/api/v1/api-keys/:id` | Get API key metadata | — | USER | api_keys |
| 4 | PATCH | `/api/v1/api-keys/:id` | Update API key name, scopes, or rate limit | `UpdateApiKeyDto` | USER | api_keys |
| 5 | DELETE | `/api/v1/api-keys/:id` | Revoke (soft-delete) an API key | — | USER | api_keys |
| 6 | POST | `/api/v1/api-keys/:id/rotate` | Rotate an API key (revoke old, create new with same config) | — | USER | api_keys |

## 10. Org Config (Super Admin)

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/admin/orgs/:id/config` | Get organization config (masked secrets) | — | SUPERADMIN | org_config |
| 2 | PATCH | `/api/v1/admin/orgs/:id/config` | Update organization config | `UpdateOrgConfigDto` | SUPERADMIN | org_config |
| 3 | POST | `/api/v1/admin/orgs/:id/config/test/:group` | Test provider connectivity for a group | — | SUPERADMIN | — |
| 4 | POST | `/api/v1/admin/orgs/:id/config/reset/:group` | Reset provider group to platform defaults | — | SUPERADMIN | org_config |

## 11. Platform Config (Super Admin)

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/admin/platform-config` | Get all platform config entries (masked) | — | SUPERADMIN | platform_config |
| 2 | PATCH | `/api/v1/admin/platform-config` | Upsert a platform config entry | `UpdatePlatformConfigDto` | SUPERADMIN | platform_config |
| 3 | POST | `/api/v1/admin/platform-config/test/:group` | Test platform provider connectivity for a group | — | SUPERADMIN | — |

## 12. Org Settings

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/settings` | Get all org settings | — | USER | org_settings |
| 2 | GET | `/api/v1/settings/:group` | Get settings by group | — | USER | org_settings |
| 3 | PUT | `/api/v1/settings/:group/:key` | Set a single setting | `UpdateSettingDto` | USER | org_settings |
| 4 | PUT | `/api/v1/settings` | Bulk update settings | `BulkUpdateSettingsDto` | USER | org_settings |
| 5 | DELETE | `/api/v1/settings/:group/:key` | Delete a setting | — | USER | org_settings |
| 6 | GET | `/api/v1/storefront/config` | Get public config for storefront | — | PUBLIC | org_settings |

## 13. Billing

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/billing/plan` | Get current plan and usage summary | — | USER | subscriptions, plans |
| 2 | GET | `/api/v1/billing/plans` | List all available plans | — | PUBLIC | plans |
| 3 | POST | `/api/v1/billing/subscribe` | Subscribe to a plan | `SubscribeDto` | USER | subscriptions |
| 4 | POST | `/api/v1/billing/cancel` | Cancel current subscription | — | USER | subscriptions |
| 5 | GET | `/api/v1/billing/invoices` | List invoices (paginated) | `QueryInvoicesDto` | USER | invoices |
| 6 | GET | `/api/v1/billing/invoices/:id` | Get invoice by ID | — | USER | invoices |
| 7 | POST | `/api/v1/billing/webhook` | Handle billing provider webhook | inline | PUBLIC | invoices, subscriptions |
| 8 | GET | `/api/v1/billing/usage` | Get current period usage statistics | — | USER | usage_records |

## 14. Usage

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/usage` | Get current period usage summary | — | USER | usage_records |
| 2 | GET | `/api/v1/usage/history` | Get paginated usage history | `QueryUsageDto` | USER | usage_records |
| 3 | GET | `/api/v1/usage/breakdown` | Get per-resource usage breakdown | `QueryUsageDto` | USER | usage_records |

## 15. Segments

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/segments` | List segments (paginated) | `PaginationDto` | USER | segments |
| 2 | POST | `/api/v1/segments` | Create a new segment | `CreateSegmentDto` | USER | segments |
| 3 | GET | `/api/v1/segments/:id` | Get segment details with member count | — | USER | segments |
| 4 | PATCH | `/api/v1/segments/:id` | Update a segment | `UpdateSegmentDto` | USER | segments |
| 5 | DELETE | `/api/v1/segments/:id` | Soft-delete a segment | — | USER | segments |
| 6 | POST | `/api/v1/segments/:id/preview` | Preview dynamic segment (count + sample) | — | USER | segments, end_users |
| 7 | GET | `/api/v1/segments/:id/members` | List members of a segment (paginated) | `PaginationDto` | USER | segment_members |
| 8 | POST | `/api/v1/segments/:id/members` | Add end users to a static segment | `AddMembersDto` | USER | segment_members |
| 9 | DELETE | `/api/v1/segments/:id/members/:uid` | Remove an end user from a static segment | — | USER | segment_members |

## 16. Campaigns

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/campaigns` | List all campaigns (paginated) | `QueryCampaignsDto` | USER | campaigns |
| 2 | POST | `/api/v1/campaigns` | Create a new campaign | `CreateCampaignDto` | USER | campaigns |
| 3 | GET | `/api/v1/campaigns/:id` | Get campaign details with analytics summary | — | USER | campaigns, campaign_analytics |
| 4 | PATCH | `/api/v1/campaigns/:id` | Update a draft campaign | `UpdateCampaignDto` | USER | campaigns |
| 5 | DELETE | `/api/v1/campaigns/:id` | Soft-delete a draft campaign | — | USER | campaigns |
| 6 | POST | `/api/v1/campaigns/:id/launch` | Launch a campaign (validate, resolve audience, queue) | — | USER | campaigns |
| 7 | POST | `/api/v1/campaigns/:id/schedule` | Schedule a draft campaign for future delivery | inline | USER | campaigns |
| 8 | POST | `/api/v1/campaigns/:id/pause` | Pause a running campaign | — | USER | campaigns |
| 9 | POST | `/api/v1/campaigns/:id/resume` | Resume a paused campaign | — | USER | campaigns |
| 10 | POST | `/api/v1/campaigns/:id/cancel` | Cancel a scheduled campaign | — | USER | campaigns |
| 11 | GET | `/api/v1/campaigns/:id/logs` | Get paginated delivery logs for a campaign | `PaginationDto` | USER | campaign_delivery_logs |
| 12 | GET | `/api/v1/campaigns/:id/analytics` | Get full analytics for a campaign | — | USER | campaign_analytics |

## 17. End Users (Admin)

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/end-users` | List end users (paginated, filterable) | `QueryEndUsersDto` | USER | end_users |
| 2 | POST | `/api/v1/end-users` | Create a new end user | `CreateEndUserDto` | USER | end_users |
| 3 | POST | `/api/v1/end-users/bulk` | Bulk upsert end users by externalId | `BulkUpsertEndUserDto` | USER | end_users |
| 4 | GET | `/api/v1/end-users/:id` | Get a single end user by ID | — | USER | end_users |
| 5 | PATCH | `/api/v1/end-users/:id` | Update an end user | `UpdateEndUserDto` | USER | end_users |
| 6 | DELETE | `/api/v1/end-users/:id` | Soft-delete an end user | — | USER | end_users |
| 7 | POST | `/api/v1/end-users/:id/block` | Block an end user | — | USER | end_users |
| 8 | POST | `/api/v1/end-users/:id/unblock` | Unblock an end user | — | USER | end_users |
| 9 | PATCH | `/api/v1/end-users/:id/attributes` | Merge-update end user custom attributes | `UpdateAttributesDto` | USER | end_users |
| 10 | POST | `/api/v1/end-users/:id/tags` | Add tags to an end user | inline | USER | end_users |
| 11 | DELETE | `/api/v1/end-users/:id/tags` | Remove tags from an end user | inline | USER | end_users |

## 18. Webhooks

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/webhooks` | List all webhooks | — | USER | webhooks |
| 2 | POST | `/api/v1/webhooks` | Create a new webhook | `CreateWebhookDto` | USER | webhooks |
| 3 | GET | `/api/v1/webhooks/:id` | Get a webhook by ID | — | USER | webhooks |
| 4 | PATCH | `/api/v1/webhooks/:id` | Update a webhook | `UpdateWebhookDto` | USER | webhooks |
| 5 | DELETE | `/api/v1/webhooks/:id` | Soft-delete a webhook | — | USER | webhooks |
| 6 | POST | `/api/v1/webhooks/:id/test` | Send a test event to a webhook | — | USER | webhooks, webhook_logs |
| 7 | GET | `/api/v1/webhooks/:id/logs` | Get paginated delivery logs for a webhook | `QueryWebhookLogsDto` | USER | webhook_logs |
| 8 | POST | `/api/v1/webhooks/:id/retry/:logId` | Retry a failed webhook delivery | — | USER | webhook_logs |

## 19. Upload

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | POST | `/api/v1/upload` | Upload a file (admin) | multipart/form-data | USER | — (Cloudinary) |
| 2 | POST | `/api/v1/storefront/upload` | Upload a file (storefront) | multipart/form-data | ENDUSER | — (Cloudinary) |

## 20. Contact

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | POST | `/api/v1/storefront/contact` | Submit a contact message | `CreateContactDto` | PUBLIC | contact_messages |
| 2 | POST | `/api/v1/storefront/contact/subscribe` | Subscribe to newsletter | `SubscribeDto` | PUBLIC | subscribers |
| 3 | GET | `/api/v1/contact-messages` | List contact messages (paginated) | `QueryContactsDto` | USER | contact_messages |
| 4 | GET | `/api/v1/contact-messages/:id` | Get a single contact message | — | USER | contact_messages |
| 5 | PATCH | `/api/v1/contact-messages/:id/read` | Mark contact message as read | — | USER | contact_messages |
| 6 | PATCH | `/api/v1/contact-messages/:id/unread` | Mark contact message as unread | — | USER | contact_messages |
| 7 | DELETE | `/api/v1/contact-messages/:id` | Delete a contact message | — | USER | contact_messages |

## 21. Catalog

### Admin

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/catalog/categories` | List all catalog categories | `QueryItemsDto` | USER | catalog_categories |
| 2 | POST | `/api/v1/catalog/categories` | Create a catalog category | `CreateCategoryDto` | USER | catalog_categories |
| 3 | PATCH | `/api/v1/catalog/categories/:id` | Update a catalog category | `UpdateCategoryDto` | USER | catalog_categories |
| 4 | DELETE | `/api/v1/catalog/categories/:id` | Soft-delete a catalog category | — | USER | catalog_categories |
| 5 | GET | `/api/v1/catalog/items` | List catalog items with filters & pagination | `QueryItemsDto` | USER | catalog_items |
| 6 | GET | `/api/v1/catalog/items/:id` | Get a single catalog item with full details | — | USER | catalog_items |
| 7 | POST | `/api/v1/catalog/items` | Create a catalog item | `CreateItemDto` | USER | catalog_items |
| 8 | PATCH | `/api/v1/catalog/items/:id` | Update a catalog item | `UpdateItemDto` | USER | catalog_items |
| 9 | DELETE | `/api/v1/catalog/items/:id` | Soft-delete a catalog item | — | USER | catalog_items |
| 10 | POST | `/api/v1/catalog/items/:id/variants` | Create a variant for a catalog item | `CreateItemVariantDto` | USER | catalog_item_variants |
| 11 | PATCH | `/api/v1/catalog/variants/:id` | Update an item variant | `CreateItemVariantDto` | USER | catalog_item_variants |
| 12 | DELETE | `/api/v1/catalog/variants/:id` | Delete an item variant | — | USER | catalog_item_variants |
| 13 | POST | `/api/v1/catalog/items/:id/option-groups` | Create an option group for a catalog item | `CreateOptionGroupDto` | USER | option_groups |
| 14 | PATCH | `/api/v1/catalog/option-groups/:id` | Update an option group | `CreateOptionGroupDto` | USER | option_groups |
| 15 | DELETE | `/api/v1/catalog/option-groups/:id` | Delete an option group | — | USER | option_groups |
| 16 | POST | `/api/v1/catalog/option-groups/:groupId/options` | Create an option within an option group | `CreateOptionDto` | USER | options |
| 17 | PATCH | `/api/v1/catalog/options/:id` | Update an option | `CreateOptionDto` | USER | options |
| 18 | DELETE | `/api/v1/catalog/options/:id` | Delete an option | — | USER | options |

### Storefront

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/storefront/catalog/categories` | List active catalog categories | — | PUBLIC | catalog_categories |
| 2 | GET | `/api/v1/storefront/catalog/items` | List catalog items with filters & pagination | `QueryItemsDto` | PUBLIC | catalog_items |
| 3 | GET | `/api/v1/storefront/catalog/items/:id` | Get a single catalog item with full details | — | PUBLIC | catalog_items |

## 22. Commerce Orders

### Admin

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/commerce/orders` | List all orders for the organization | `QueryOrdersDto` | USER | commerce_orders |
| 2 | GET | `/api/v1/commerce/orders/stats` | Get order statistics | — | USER | commerce_orders |
| 3 | GET | `/api/v1/commerce/orders/:id` | Get order detail | — | USER | commerce_orders |
| 4 | PATCH | `/api/v1/commerce/orders/:id/status` | Update order status | `UpdateOrderStatusDto` | USER | commerce_orders |

### Storefront

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | POST | `/api/v1/storefront/orders` | Place a new order from the storefront | `CreateOrderDto` | ENDUSER | commerce_orders, cart |
| 2 | GET | `/api/v1/storefront/orders` | List own orders | `QueryOrdersDto` | ENDUSER | commerce_orders |
| 3 | POST | `/api/v1/storefront/orders/reorder` | Re-order items from a previous order | inline | ENDUSER | commerce_orders, cart |
| 4 | GET | `/api/v1/storefront/orders/:id` | Get order detail | — | ENDUSER | commerce_orders |
| 5 | POST | `/api/v1/storefront/orders/:id/issue` | Report an issue with an order | inline | ENDUSER | commerce_orders, support_tickets |

## 23. Cart

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/storefront/cart` | Get current user cart (single cart, mixed mode) | — | ENDUSER | carts, cart_line_items |
| 2 | POST | `/api/v1/storefront/cart/items` | Add item to cart (variantType per item) | `AddCartItemDto` | ENDUSER | cart_line_items |
| 3 | PATCH | `/api/v1/storefront/cart/items/:id` | Update cart item quantity | `UpdateCartItemDto` | ENDUSER | cart_line_items |
| 4 | DELETE | `/api/v1/storefront/cart/items/:id` | Remove item from cart | — | ENDUSER | cart_line_items |
| 5 | POST | `/api/v1/storefront/cart/validate` | Validate cart items are still available | — | ENDUSER | carts |
| 6 | DELETE | `/api/v1/storefront/cart` | Clear entire cart | — | ENDUSER | carts |

## 24. Locations

### Admin

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/locations` | List all store locations | — | USER | locations |
| 2 | GET | `/api/v1/locations/:id` | Get a single store location with hours and zones | — | USER | locations |
| 3 | POST | `/api/v1/locations` | Create a store location | `CreateLocationDto` | USER | locations |
| 4 | PATCH | `/api/v1/locations/:id` | Update a store location | `UpdateLocationDto` | USER | locations |
| 5 | DELETE | `/api/v1/locations/:id` | Soft-delete a store location | — | USER | locations |
| 6 | PUT | `/api/v1/locations/:id/hours` | Set store hours for a location (upserts all days) | `SetHoursDto` | USER | location_hours |
| 7 | GET | `/api/v1/locations/:id/delivery-zones` | List delivery zones for a location | — | USER | delivery_zones |
| 8 | POST | `/api/v1/locations/:id/delivery-zones` | Create a delivery zone for a location | `CreateDeliveryZoneDto` | USER | delivery_zones |
| 9 | PATCH | `/api/v1/locations/delivery-zones/:zoneId` | Update a delivery zone | `UpdateDeliveryZoneDto` | USER | delivery_zones |
| 10 | DELETE | `/api/v1/locations/delivery-zones/:zoneId` | Delete a delivery zone | — | USER | delivery_zones |

### Storefront

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/storefront/locations` | List active store locations with hours | — | PUBLIC | locations |
| 2 | GET | `/api/v1/storefront/locations/:id` | Get a single store location with hours and zones | — | PUBLIC | locations |

## 25. POS

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | POST | `/api/v1/pos/sync` | Trigger a manual POS menu sync | — | USER | catalog_items, pos_sync_logs |
| 2 | GET | `/api/v1/pos/logs` | List POS sync logs | `QuerySyncLogsDto` | USER | pos_sync_logs |

## 26. Delivery

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | POST | `/api/v1/storefront/delivery/calculate` | Calculate delivery fee and ETA | `CalculateDeliveryDto` | PUBLIC | delivery_zones |
| 2 | POST | `/api/v1/storefront/delivery/fee` | Calculate delivery fee (alias for /calculate) | `CalculateDeliveryDto` | PUBLIC | delivery_zones |
| 3 | GET | `/api/v1/storefront/delivery/orders/:orderId/tracking` | Get delivery tracking info for an order | — | ENDUSER | delivery_orders |

## 27. Property

### Admin

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/property/types` | List all property types | — | USER | property_types |
| 2 | GET | `/api/v1/property/types/:id` | Get a property type by ID | — | USER | property_types |
| 3 | POST | `/api/v1/property/types` | Create a property type | `CreatePropertyTypeDto` | USER | property_types |
| 4 | PATCH | `/api/v1/property/types/:id` | Update a property type | `UpdatePropertyTypeDto` | USER | property_types |
| 5 | DELETE | `/api/v1/property/types/:id` | Soft-delete a property type | — | USER | property_types |
| 6 | PUT | `/api/v1/property/types/:id/amenities` | Set amenities for a property type | `ManageAmenitiesDto` | USER | property_type_amenities |
| 7 | GET | `/api/v1/property/units` | List all property units | — | USER | property_units |
| 8 | POST | `/api/v1/property/units` | Create a property unit | `CreatePropertyUnitDto` | USER | property_units |
| 9 | PATCH | `/api/v1/property/units/:id` | Update a property unit | `UpdatePropertyUnitDto` | USER | property_units |
| 10 | PATCH | `/api/v1/property/units/:id/housekeeping` | Update housekeeping status of a unit | `UpdateHousekeepingDto` | USER | property_units |
| 11 | GET | `/api/v1/property/amenities` | List all amenities | — | USER | amenities |
| 12 | POST | `/api/v1/property/amenities` | Create an amenity | `CreateAmenityDto` | USER | amenities |

### Storefront

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/storefront/property/types` | List active property types with amenities | — | PUBLIC | property_types |
| 2 | GET | `/api/v1/storefront/property/types/:id` | Get property type detail | — | PUBLIC | property_types |

## 28. Property Bookings

### Admin

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/property/bookings` | List all property bookings with filters & pagination | `QueryBookingsDto` | USER | property_bookings |
| 2 | GET | `/api/v1/property/bookings/:id` | Get booking detail | — | USER | property_bookings |
| 3 | PATCH | `/api/v1/property/bookings/:id` | Update booking notes/guest details | `UpdateBookingDto` | USER | property_bookings |
| 4 | POST | `/api/v1/property/bookings/:id/check-in` | Check in a booking | — | USER | property_bookings |
| 5 | POST | `/api/v1/property/bookings/:id/check-out` | Check out a booking | — | USER | property_bookings |
| 6 | POST | `/api/v1/property/bookings/:id/cancel` | Cancel a booking | `CancelBookingDto` | USER | property_bookings |
| 7 | POST | `/api/v1/property/bookings/:id/assign-units` | Assign units to a booking | `AssignUnitsDto` | USER | property_bookings, property_units |

### Storefront

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | POST | `/api/v1/storefront/property/bookings` | Create a new property booking | `CreateBookingDto` | ENDUSER | property_bookings |
| 2 | GET | `/api/v1/storefront/property/bookings` | List my bookings | `QueryBookingsDto` | ENDUSER | property_bookings |
| 3 | GET | `/api/v1/storefront/property/bookings/:id` | Get my booking detail | — | ENDUSER | property_bookings |
| 4 | POST | `/api/v1/storefront/property/bookings/:id/cancel` | Cancel my booking | `CancelBookingDto` | ENDUSER | property_bookings |
| 5 | POST | `/api/v1/storefront/property/bookings/:id/payment-order` | Create payment order for booking | `CreatePaymentOrderDto` | ENDUSER | property_bookings, property_payments |
| 6 | POST | `/api/v1/storefront/property/bookings/verify-payment` | Verify and confirm payment | `VerifyPaymentDto` | ENDUSER | property_bookings, property_payments |
| 7 | GET | `/api/v1/storefront/property/bookings/lookup` | Lookup booking by reference | — | PUBLIC | property_bookings |

## 29. Property Inventory

### Admin

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/property/inventory/availability` | Get availability for a property type over a date range | `CheckAvailabilityDto` | USER | property_inventory |
| 2 | GET | `/api/v1/property/inventory/calendar` | Get calendar view across all property types | `CalendarQueryDto` | USER | property_inventory |
| 3 | POST | `/api/v1/property/inventory/block` | Block dates for a property type | `BlockDatesDto` | USER | property_inventory |
| 4 | POST | `/api/v1/property/inventory/hold` | Create a temporary inventory hold | `CreateHoldDto` | USER | property_inventory_holds |

### Storefront

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/storefront/property/availability` | Check property availability (public) | `StorefrontAvailabilityDto` | PUBLIC | property_inventory |

## 30. Property Pricing

### Admin

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/property/pricing` | List all pricing rules | — | USER | pricing_rules |
| 2 | POST | `/api/v1/property/pricing` | Create a pricing rule | `CreatePricingRuleDto` | USER | pricing_rules |
| 3 | PATCH | `/api/v1/property/pricing/:id` | Update a pricing rule | `UpdatePricingRuleDto` | USER | pricing_rules |
| 4 | DELETE | `/api/v1/property/pricing/:id` | Delete a pricing rule | — | USER | pricing_rules |
| 5 | POST | `/api/v1/property/pricing/resolve` | Resolve effective price for a stay | `ResolvePriceDto` | USER | pricing_rules |

### Storefront

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | POST | `/api/v1/storefront/property/pricing/resolve` | Calculate price for dates (public) | `ResolvePriceDto` | PUBLIC | pricing_rules |

## 31. Payments

### Admin

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/payments` | List payments | `QueryPaymentsDto` | USER | payments |
| 2 | GET | `/api/v1/payments/:id` | Get payment detail | — | USER | payments |
| 3 | POST | `/api/v1/payments/orders` | Create an order | `CreateOrderDto` | USER | payment_orders |
| 4 | POST | `/api/v1/payments/orders/:id/verify` | Verify and capture payment for an order | `VerifyPaymentDto` | USER | payment_orders |
| 5 | GET | `/api/v1/payments/orders` | List orders | `QueryOrdersDto` | USER | payment_orders |
| 6 | GET | `/api/v1/payments/orders/:id` | Get order detail | — | USER | payment_orders |
| 7 | POST | `/api/v1/payments/subscriptions` | Create a subscription | `CreateSubscriptionDto` | USER | subscriptions |
| 8 | GET | `/api/v1/payments/subscriptions` | List subscriptions | `QuerySubscriptionsDto` | USER | subscriptions |
| 9 | GET | `/api/v1/payments/subscriptions/:id` | Get subscription detail | — | USER | subscriptions |
| 10 | POST | `/api/v1/payments/subscriptions/:id/pause` | Pause a subscription | — | USER | subscriptions |
| 11 | POST | `/api/v1/payments/subscriptions/:id/resume` | Resume a paused subscription | — | USER | subscriptions |
| 12 | POST | `/api/v1/payments/subscriptions/:id/cancel` | Cancel a subscription | — | USER | subscriptions |
| 13 | POST | `/api/v1/payments/:paymentId/refunds` | Create a refund for a payment | `CreateRefundDto` | USER | refunds, payments |
| 14 | GET | `/api/v1/payments/:paymentId/refunds` | List refunds for a payment | — | USER | refunds |
| 15 | POST | `/api/v1/payments/links` | Create a payment link | `CreatePaymentLinkDto` | USER | payment_links |
| 16 | GET | `/api/v1/payments/links` | List payment links | `PaginationDto` | USER | payment_links |
| 17 | GET | `/api/v1/payments/links/:id` | Get payment link detail | — | USER | payment_links |
| 18 | POST | `/api/v1/payments/links/:id/deactivate` | Deactivate a payment link | — | USER | payment_links |
| 19 | DELETE | `/api/v1/payments/links/:id` | Delete a payment link | — | USER | payment_links |
| 20 | POST | `/api/v1/payments/products` | Create a product | `CreateProductDto` | USER | products |
| 21 | GET | `/api/v1/payments/products` | List products | `PaginationDto` | USER | products |
| 22 | GET | `/api/v1/payments/products/:id` | Get product detail | — | USER | products |
| 23 | PATCH | `/api/v1/payments/products/:id` | Update a product | `UpdateProductDto` | USER | products |
| 24 | DELETE | `/api/v1/payments/products/:id` | Delete a product | — | USER | products |
| 25 | POST | `/api/v1/payments/webhook/razorpay` | Razorpay webhook handler | — | PUBLIC | payments |
| 26 | POST | `/api/v1/payments/webhook/stripe` | Stripe webhook handler | — | PUBLIC | payments |

### Storefront

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | POST | `/api/v1/storefront/payments/create-order` | Create a payment order | `CreateOrderDto` | ENDUSER | payment_orders |
| 2 | POST | `/api/v1/storefront/payments/verify` | Verify and capture payment | `VerifyPaymentDto` | ENDUSER | payment_orders, payments |

## 32. Notifications

### Admin

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/notifications` | List all notifications (paginated) | `QueryNotificationsDto` | USER | notifications |
| 2 | POST | `/api/v1/notifications/send` | Send a single notification | `SendNotificationDto` | USER | notifications |
| 3 | POST | `/api/v1/notifications/send-bulk` | Send bulk notifications | `SendBulkNotificationDto` | USER | notifications |
| 4 | GET | `/api/v1/notifications/in-app` | List in-app notifications for an end user | `QueryNotificationsDto` | USER | notifications |
| 5 | GET | `/api/v1/notifications/unread-count` | Get unread in-app notification count | — | USER | notifications |
| 6 | GET | `/api/v1/notifications/:id` | Get notification status by ID | — | USER | notifications |
| 7 | POST | `/api/v1/notifications/:id/resend` | Retry a failed notification | — | USER | notifications |
| 8 | PATCH | `/api/v1/notifications/:id/read` | Mark a notification as read | — | USER | notifications |
| 9 | POST | `/api/v1/notifications/read-all` | Mark all in-app notifications as read | — | USER | notifications |

### Storefront

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/storefront/notifications` | Get in-app notifications for the current end user | `QueryNotificationsDto` | ENDUSER | notifications |
| 2 | POST | `/api/v1/storefront/notifications/:id/read` | Mark a notification as read | — | ENDUSER | notifications |
| 3 | POST | `/api/v1/storefront/notifications/read-all` | Mark all notifications as read | — | ENDUSER | notifications |

## 33. Notification Templates

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/templates` | List all notification templates (paginated) | `PaginationDto` | USER | notification_templates |
| 2 | GET | `/api/v1/templates/:id` | Get a notification template by ID | — | USER | notification_templates |
| 3 | POST | `/api/v1/templates` | Create a new notification template | `CreateTemplateDto` | USER | notification_templates |
| 4 | PATCH | `/api/v1/templates/:id` | Update a notification template | `UpdateTemplateDto` | USER | notification_templates |
| 5 | DELETE | `/api/v1/templates/:id` | Soft-delete a notification template | — | USER | notification_templates |
| 6 | POST | `/api/v1/templates/:id/preview` | Preview a rendered template with sample variables | `PreviewTemplateDto` | USER | notification_templates |

## 34. Loyalty

### Admin

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/loyalty/accounts` | List all loyalty accounts | `QueryAccountsDto` | USER | loyalty_accounts |
| 2 | GET | `/api/v1/loyalty/accounts/:id` | Get a loyalty account with recent transactions | — | USER | loyalty_accounts, loyalty_transactions |
| 3 | POST | `/api/v1/loyalty/accounts/:id/adjust` | Manually adjust points for an account | `AdjustPointsDto` | USER | loyalty_accounts, loyalty_transactions |
| 4 | GET | `/api/v1/loyalty/rewards` | List all rewards (including inactive) | — | USER | loyalty_rewards |
| 5 | GET | `/api/v1/loyalty/rewards/:id` | Get a single reward | — | USER | loyalty_rewards |
| 6 | POST | `/api/v1/loyalty/rewards` | Create a reward | `CreateRewardDto` | USER | loyalty_rewards |
| 7 | PATCH | `/api/v1/loyalty/rewards/:id` | Update a reward | `UpdateRewardDto` | USER | loyalty_rewards |
| 8 | DELETE | `/api/v1/loyalty/rewards/:id` | Delete a reward | — | USER | loyalty_rewards |

### Storefront

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/storefront/loyalty` | Get loyalty account and balance | — | ENDUSER | loyalty_accounts |
| 2 | GET | `/api/v1/storefront/loyalty/transactions` | List loyalty transactions | — | ENDUSER | loyalty_transactions |
| 3 | GET | `/api/v1/storefront/loyalty/rewards` | List available rewards catalog | — | ENDUSER | loyalty_rewards |
| 4 | GET | `/api/v1/storefront/loyalty/redeem` | Get active redemptions | — | ENDUSER | loyalty_redemptions |
| 5 | POST | `/api/v1/storefront/loyalty/redeem` | Redeem a reward using loyalty points | `RedeemRewardDto` | ENDUSER | loyalty_redemptions, loyalty_accounts |

## 35. Coupons

### Admin

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/coupons` | List all coupons with filters & pagination | `QueryCouponsDto` | USER | coupons |
| 2 | GET | `/api/v1/coupons/:id` | Get a single coupon with usage history | — | USER | coupons, coupon_usage |
| 3 | POST | `/api/v1/coupons` | Create a new coupon | `CreateCouponDto` | USER | coupons |
| 4 | PATCH | `/api/v1/coupons/:id` | Update a coupon | `UpdateCouponDto` | USER | coupons |
| 5 | DELETE | `/api/v1/coupons/:id` | Soft-delete a coupon | — | USER | coupons |

### Storefront

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | POST | `/api/v1/storefront/coupons/validate` | Validate a coupon code | `ValidateCouponDto` | PUBLIC | coupons, coupon_usage |

## 36. Promotions

### Admin

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/promotions` | List all promotions with filters & pagination | `QueryPromotionsDto` | USER | promotions |
| 2 | GET | `/api/v1/promotions/:id` | Get a single promotion | — | USER | promotions |
| 3 | POST | `/api/v1/promotions` | Create a new promotion | `CreatePromotionDto` | USER | promotions |
| 4 | PATCH | `/api/v1/promotions/:id` | Update a promotion | `UpdatePromotionDto` | USER | promotions |
| 5 | DELETE | `/api/v1/promotions/:id` | Soft-delete a promotion | — | USER | promotions |

### Storefront

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/storefront/promotions` | List active promotions | — | PUBLIC | promotions |

## 37. Referrals (Storefront)

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/storefront/referral` | Get my referral code | — | ENDUSER | referral_codes |
| 2 | POST | `/api/v1/storefront/referral/validate` | Validate a referral code | `ValidateReferralDto` | PUBLIC | referral_codes |

## 38. Reviews

### Admin

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/reviews` | List all reviews with filters & pagination | `QueryReviewsDto` | USER | reviews |
| 2 | PATCH | `/api/v1/reviews/:id/status` | Approve or reject a review | `UpdateReviewStatusDto` | USER | reviews |

### Storefront

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/storefront/reviews` | List approved reviews (optionally filter by item) | `QueryReviewsDto` | PUBLIC | reviews |
| 2 | GET | `/api/v1/storefront/reviews/my` | Get reviews submitted by the current user | — | ENDUSER | reviews |
| 3 | POST | `/api/v1/storefront/reviews` | Submit a new review | `CreateReviewDto` | ENDUSER | reviews |
| 4 | POST | `/api/v1/storefront/reviews/:id/helpful` | Toggle helpful vote on a review | — | ENDUSER | review_helpful_votes |

## 39. Gift Cards

### Admin

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/gift-cards` | List all gift cards with filters & pagination | `QueryGiftCardsDto` | USER | gift_cards |
| 2 | GET | `/api/v1/gift-cards/:id` | Get a single gift card with transactions | — | USER | gift_cards, gift_card_transactions |
| 3 | POST | `/api/v1/gift-cards` | Create a new gift card | `CreateGiftCardDto` | USER | gift_cards |

### Storefront

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | POST | `/api/v1/storefront/gift-cards/purchase` | Purchase a new gift card | `PurchaseGiftCardDto` | ENDUSER | gift_cards |
| 2 | POST | `/api/v1/storefront/gift-cards/redeem` | Redeem a gift card | `RedeemGiftCardDto` | ENDUSER | gift_cards, gift_card_transactions |
| 3 | GET | `/api/v1/storefront/gift-cards/balance` | Check gift card balance by code | — | PUBLIC | gift_cards |

## 40. Reservations

### Admin

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/reservations` | List all reservations with filters & pagination | `QueryReservationsDto` | USER | reservations |
| 2 | PATCH | `/api/v1/reservations/:id/status` | Update reservation status | `UpdateReservationStatusDto` | USER | reservations |
| 3 | GET | `/api/v1/reservations/resources` | List all bookable resources | — | USER | bookable_resources |
| 4 | POST | `/api/v1/reservations/resources` | Create a bookable resource | `CreateResourceDto` | USER | bookable_resources |
| 5 | PATCH | `/api/v1/reservations/resources/:id` | Update a bookable resource | `UpdateResourceDto` | USER | bookable_resources |
| 6 | DELETE | `/api/v1/reservations/resources/:id` | Delete a bookable resource | — | USER | bookable_resources |

### Storefront

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/storefront/reservations/availability` | Check reservation availability for a date | `CheckAvailabilityDto` | PUBLIC | reservation_slots, bookable_resources |
| 2 | POST | `/api/v1/storefront/reservations` | Create a new reservation | `CreateReservationDto` | ENDUSER | reservations |
| 3 | GET | `/api/v1/storefront/reservations` | List my reservations | `QueryReservationsDto` | ENDUSER | reservations |
| 4 | POST | `/api/v1/storefront/reservations/:id/cancel` | Cancel a reservation | — | ENDUSER | reservations |

## 41. Support

### Admin

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/support` | List all support tickets with filters & pagination | `QueryTicketsDto` | USER | support_tickets |
| 2 | GET | `/api/v1/support/:id` | Get a single support ticket | — | USER | support_tickets |
| 3 | PATCH | `/api/v1/support/:id` | Update ticket status, priority, category, or assignment | `UpdateTicketDto` | USER | support_tickets |

### Storefront

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | POST | `/api/v1/storefront/support` | Create a new support ticket | `CreateTicketDto` | ENDUSER | support_tickets |
| 2 | GET | `/api/v1/storefront/support` | List my support tickets | `QueryTicketsDto` | ENDUSER | support_tickets |
| 3 | POST | `/api/v1/storefront/support/:ticketId/reply` | Reply to a support ticket | `CreateTicketReplyDto` | ENDUSER | support_ticket_replies |

## 42. Content

### Admin

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/content` | List all content posts with filters & pagination | `QueryContentDto` | USER | content |
| 2 | GET | `/api/v1/content/:id` | Get a single content post | — | USER | content |
| 3 | POST | `/api/v1/content` | Create a new content post | `CreateContentDto` | USER | content |
| 4 | PATCH | `/api/v1/content/:id` | Update a content post | `UpdateContentDto` | USER | content |
| 5 | DELETE | `/api/v1/content/:id` | Soft-delete a content post | — | USER | content |

### Storefront

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/storefront/content` | List published content posts | `QueryContentDto` | PUBLIC | content |
| 2 | GET | `/api/v1/storefront/content/:slug` | Get a published content post by slug | — | PUBLIC | content |

## 43. End-User Addresses (Storefront)

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/storefront/addresses` | List all addresses | — | ENDUSER | end_user_addresses |
| 2 | GET | `/api/v1/storefront/addresses/:id` | Get a single address | — | ENDUSER | end_user_addresses |
| 3 | POST | `/api/v1/storefront/addresses` | Create a new address | `CreateAddressDto` | ENDUSER | end_user_addresses |
| 4 | PATCH | `/api/v1/storefront/addresses/:id` | Update an address | `UpdateAddressDto` | ENDUSER | end_user_addresses |
| 5 | DELETE | `/api/v1/storefront/addresses/:id` | Delete an address | — | ENDUSER | end_user_addresses |

## 44. Movies

### Admin (Super Admin)

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | POST | `/api/v1/admin/movies` | Create a new movie | `CreateMovieDto` | SUPERADMIN | catalog_items |
| 2 | GET | `/api/v1/admin/movies/stream-mappings` | List all movie stream mappings | — | SUPERADMIN | movie_stream_mappings |
| 3 | POST | `/api/v1/admin/movies/stream-mappings` | Create or update a movie stream mapping | inline | SUPERADMIN | movie_stream_mappings |
| 4 | DELETE | `/api/v1/admin/movies/stream-mappings/:tmdbId` | Delete a movie stream mapping | — | SUPERADMIN | movie_stream_mappings |

### Storefront

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/storefront/movies` | List movies with filters | `QueryMoviesDto` | PUBLIC | catalog_items |
| 2 | GET | `/api/v1/storefront/movies/hero-banners` | Get active hero banners | — | PUBLIC | catalog_items |
| 3 | GET | `/api/v1/storefront/movies/genres` | Get genre categories | — | PUBLIC | catalog_categories |
| 4 | GET | `/api/v1/storefront/movies/:slug` | Get movie detail by slug | — | PUBLIC | catalog_items |
| 5 | GET | `/api/v1/storefront/movies/library` | Get user library | — | ENDUSER | entitlements |
| 6 | GET | `/api/v1/storefront/movies/:id/stream` | Get stream URL (checks entitlement) | — | ENDUSER | entitlements |
| 7 | POST | `/api/v1/storefront/movies/:id/progress` | Update watch progress | inline | ENDUSER | watch_progress |
| 8 | POST | `/api/v1/storefront/movies/:id/rent` | Create rental entitlement | — | ENDUSER | entitlements |
| 9 | POST | `/api/v1/storefront/movies/:id/buy` | Create purchase entitlement | — | ENDUSER | entitlements |

### Watchlist

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/storefront/watchlist` | Get watchlist | — | ENDUSER | watchlist |
| 2 | POST | `/api/v1/storefront/watchlist/:catalogItemId` | Add to watchlist | — | ENDUSER | watchlist |
| 3 | DELETE | `/api/v1/storefront/watchlist/:catalogItemId` | Remove from watchlist | — | ENDUSER | watchlist |

## 45. TMDB Movies (Storefront)

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/storefront/tmdb/popular` | Popular movies from TMDB | — | PUBLIC | — (TMDB API) |
| 2 | GET | `/api/v1/storefront/tmdb/trending` | Trending movies this week | — | PUBLIC | — (TMDB API) |
| 3 | GET | `/api/v1/storefront/tmdb/bollywood` | Popular Bollywood movies | — | PUBLIC | — (TMDB API) |
| 4 | GET | `/api/v1/storefront/tmdb/hollywood` | Popular Hollywood movies | — | PUBLIC | — (TMDB API) |
| 5 | GET | `/api/v1/storefront/tmdb/tamil` | Popular Tamil movies | — | PUBLIC | — (TMDB API) |
| 6 | GET | `/api/v1/storefront/tmdb/telugu` | Popular Telugu movies | — | PUBLIC | — (TMDB API) |
| 7 | GET | `/api/v1/storefront/tmdb/search` | Search movies | — | PUBLIC | — (TMDB API) |
| 8 | GET | `/api/v1/storefront/tmdb/genres` | Movie genres list | — | PUBLIC | — (TMDB API) |
| 9 | GET | `/api/v1/storefront/tmdb/stream/:id` | Get stream URL for a movie | — | PUBLIC | movie_stream_mappings |
| 10 | GET | `/api/v1/storefront/tmdb/play/:id` | Proxy-stream a movie video (auth required for real content) | — | PUBLIC (JWT for real content) | movie_stream_mappings |
| 11 | GET | `/api/v1/storefront/tmdb/:id` | Movie detail by TMDB ID | — | PUBLIC | — (TMDB API) |

## 46. Wallet (Storefront)

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/storefront/wallet/packs` | Get wallet top-up packs | — | PUBLIC | org_settings |

## 47. WhatsApp Webhook

| # | Method | Route | Description | DTO | Access | Tables |
|---|--------|-------|-------------|-----|--------|--------|
| 1 | GET | `/api/v1/webhooks/whatsapp/:orgSlug` | WhatsApp webhook verification challenge | — | PUBLIC | organizations, org_settings |
| 2 | POST | `/api/v1/webhooks/whatsapp/:orgSlug` | Handle incoming WhatsApp message | — | PUBLIC | organizations, end_users, conversations |
