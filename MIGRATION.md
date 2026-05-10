# Darsh Gupta Central Backend — Migration Notes

## Architecture

The Central Backend is a NestJS multi-tenant SaaS platform that centralizes all client backend functionality. Every client (BurgerEmpire, ViCity, etc.) connects to the same backend, identified by `org_id`.

## Multi-Tenant Patterns

### Org Resolution
- **JWT**: `orgId` is embedded in the token payload
- **API Key**: `orgId` from the API key record
- **Header**: `X-Org-Slug` header resolves org slug → org ID
- **Middleware**: `StorefrontOrgMiddleware` handles slug resolution for `/api/v1/storefront/*` routes

### Data Isolation
- Every data table has an `org_id` column with CASCADE delete
- All queries filter by `org_id`
- Unique constraints are scoped to org (e.g., `@@unique([orgId, email])`)

## Modules

### Phase 0: Foundation
- **EndUser Auth** — Customer auth (register, login, OTP, guest, JWT with refresh token rotation)
- **OrgSettings** — Per-org config key-value store (replaces BurgerEmpire's SystemSetting)
- **EndUser Addresses** — Customer address management

### Phase 1: Catalog
- **Catalog** — Categories, Items, Variants (replaces Classic/Healthy mode), Size Variations, Option Groups, Options, Taxes, Location Overrides

### Phase 2: Cart & Orders
- **Cart** — Server-persisted cart with line items and options
- **Commerce Orders** — Full order lifecycle (pending → delivered), status logging

### Phase 3: Engagement
- **Loyalty** — Points (renamed from coins), tiers, rewards catalog, redemptions
- **Coupons** — Discount codes with usage tracking and validation
- **Promotions** — Time-based promotional offers
- **Referrals** — Referral codes with two-sided rewards

### Phase 4: Operations
- **POS** — Adapter pattern (IPosProvider), PetPooja, mock, circuit breaker
- **Locations** — Store locations with hours and holidays
- **Delivery** — Zone-based fee calculation, ETA

### Phase 5: Engagement (cont.)
- **Reviews** — Item reviews with moderation and helpful voting
- **Gift Cards** — Balance management, purchase, redemption
- **Reservations** — Table booking with slots and resources
- **Support** — Ticketing system
- **Content** — Blog/CMS posts

### Phase 6: Conversational Commerce
- **WhatsApp** — FSM-based ordering via Meta Cloud API

## Naming Conventions

| BurgerEmpire | Central Backend | Reason |
|-------------|----------------|--------|
| MenuItemDB | CatalogItem | Commerce-generic |
| Variation | CatalogSizeVariation | Distinguishes from variant types |
| AddonGroup | CatalogOptionGroup | Universal term |
| Addon | CatalogOption | Universal term |
| mode (classic/healthy) | variantType | Configurable per org |
| Order | CommerceOrder | Distinguishes from PaymentOrder |
| coins | points | More generic |
| RestaurantTable | BookableResource | Works for any reservable entity |
| BlogPost | ContentPost | Generic CMS |

## API Routes

### Storefront (customer-facing)
All under `/api/v1/storefront/`:
- `auth/*` — EndUser auth
- `config` — Public org settings
- `addresses` — Address CRUD
- `catalog/*` — Browse catalog
- `cart/*` — Cart management
- `orders/*` — Place/view orders
- `loyalty/*` — Points, rewards
- `coupons/validate` — Validate coupon
- `promotions` — Active promotions
- `referral/*` — Referral codes
- `reviews/*` — Read/write reviews
- `gift-cards/*` — Purchase/redeem/balance
- `reservations/*` — Book tables
- `support/*` — Submit tickets
- `content/*` — Read content
- `locations` — Store info
- `delivery/calculate` — Fee/ETA

### Admin
Under `/api/v1/`:
- Full CRUD for all entities
- `commerce/orders` — Order management
- `loyalty/*` — Account management
- `pos/*` — Sync, logs
- etc.

### Webhooks
- `POST /api/v1/webhooks/whatsapp/:orgSlug` — WhatsApp incoming

## Data Migration

### Running the migration

```bash
# 1. Generate the source Prisma client (one-time setup)
#    Copy BurgerEmpire's schema.prisma to scripts/generated/source-schema.prisma
#    then generate into scripts/generated/source-client/
npx prisma generate --schema=scripts/generated/source-schema.prisma

# 2. Run the migration
SOURCE_DATABASE_URL="postgresql://user:pass@host:5432/burgerempire" \
DATABASE_URL="postgresql://user:pass@host:5432/central_backend" \
npx tsx scripts/migrate-burgerempire.ts
```

### What it does

The script (`scripts/migrate-burgerempire.ts`) migrates all BurgerEmpire data into the Central Backend under the `burgerempire` organization:

1. **Creates/finds** the `burgerempire` Organization record
2. **SystemSettings → OrgSettings** — key-value config pairs
3. **Users** — admin users → `User` table, customer users → `EndUser` table
4. **Addresses → EndUserAddress** — with end-user ID mapping
5. **Categories → CatalogCategory** — with external ID preservation
6. **MenuItems → CatalogItem + CatalogItemVariant** — each item gets a `classic` and `healthy` variant with nutrition data
7. **Variations → CatalogSizeVariation** — size/portion variations
8. **AddonGroups + Addons → CatalogOptionGroup + CatalogOption** — customization options
9. **ItemTaxes → CatalogItemTax** — with numeric→string type conversion
10. **LoyaltyAccounts + Transactions** — coins → points, tier preserved
11. **Coupons → DiscountCoupon** — with mode→variantType mapping
12. **Orders + Items + Addons → CommerceOrder + Items + Options** — full order history with status logs
13. **Promotions** — with config JSON preserved
14. **Referrals** — with both referrer/referee ID mapping
15. **Reviews + Helpful votes → Review + ReviewVote** — with order/item linking
16. **GiftCards + Transactions** — balance and history
17. **Reservations** — timeSlot string split into startTime/endTime
18. **Notifications** — channel type and read status mapped
19. **Locations + StoreHours + DeliveryZones** — full location setup
20. **BlogPosts → ContentPost** — with SEO metadata in JSON
21. **WhatsApp Sessions → ConversationSession + Messages** — FSM state preserved
22. **SupportTickets** — with order linking

### ID mapping

All source cuid IDs are mapped to target UUIDs via an in-memory `Map<string, string>`. The original BurgerEmpire ID is stored in:
- `EndUser.externalId` — for customer users
- `CatalogCategory.externalId` — for categories
- `CatalogItem.externalId` — for menu items (stores posItemId)
- `CatalogSizeVariation.externalId` — for variations
- `CatalogOptionGroup.externalId` — for addon groups
- `CatalogOption.externalId` — for addons
- `CatalogItemTax.externalId` — for tax records

### Error handling

- Each entity migration is wrapped in try/catch — individual record failures are logged and skipped
- Missing foreign key references (unmapped IDs) cause the record to be skipped with a warning
- Tables that may not exist in older BurgerEmpire versions are wrapped at the function level

### Data not migrated

The following BurgerEmpire-specific data is **not** migrated (no equivalent in Central Backend):
- `Cart` / `CartItem` / `CartItemAddon` — transient session data
- `Payment` — Razorpay-specific, not portable
- `Tax` / `Discount` — POS-synced reference tables
- `MenuSyncLog` — replaced by `PosSyncLog`
- `RewardRedemption` — replaced by `LoyaltyRedemption` (different schema)
- `WhatsAppMessage` details beyond content — migrated as `ConversationMessage`
- `PushSubscription` / `NotificationPreference` — device-specific
- `Broadcast` — replaced by `Campaign` system
- `DeliveryAgent` / `DeliveryAssignment` / `AgentPayout` — no equivalent yet
- `AbandonedCart` / `AffiliateClick` — analytics tables
- `Ingredient` / `StockAlert` / `WasteLog` / `Supplier` / `PurchaseOrder` — inventory management
- `MealPlan` / `Subscription` — meal plan subscriptions
- `Invoice` — different schema in Central Backend
- `Institution` / `StudentPass` / `StudentDiscount` — BurgerEmpire-specific
- `TicketMessage` / `CustomerNote` / `HelpArticle` — CRM-specific
- `BlogMedia` / `BlogReview` — blog sub-resources
- `RestaurantTable` / `ReservationSlot` — replaced by `BookableResource` / `ReservationSlot` (different schema)
- `LocationMenuItem` — replaced by `CatalogLocationItem`

## ViCity Onboarding

### New Modules Added
- **Property** — PropertyType, PropertyUnit, PropertyAmenity, PropertyTypeAmenity
- **Property Bookings** — PropertyBooking, PropertyBookingUnit, PropertyPayment
- **Property Inventory** — PropertyInventory, PropertyInventoryHold
- **Property Pricing** — PropertyPricingRule with multi-rule resolution engine

### ViCity Field Mappings

| ViCity | Central Backend | Notes |
|--------|----------------|-------|
| RoomType | PropertyType | Generic name |
| RoomUnit | PropertyUnit | Generic name |
| Booking | PropertyBooking | With full lifecycle |
| BookingRoom | PropertyBookingUnit | Unit assignment per booking |
| Payment | PropertyPayment | Razorpay fields mapped to provider* |
| Inventory | PropertyInventory | Date-based availability |
| PricingRule | PropertyPricingRule | Multi-type priority engine |
| Amenity | PropertyAmenity | Per-org amenities |
| RoomTypeAmenity | PropertyTypeAmenity | Amenity-to-type junction |
| SystemSettings | OrgSettings | Single record → group/key pairs |
| User (admin/super_admin) | User | Staff/admin users |
| User (guest/user) | EndUser | Customer users |
| Coupon | DiscountCoupon | With usage tracking |
| CouponUsage | DiscountCouponUsage | User-level usage records |

### ViCity Migration

```bash
# 1. Generate the source Prisma client (one-time setup)
#    Copy ViCity's schema.prisma to scripts/generated/source-schema.prisma
#    then generate into scripts/generated/source-client/
npx prisma generate --schema=scripts/generated/source-schema.prisma

# 2. Run the migration
SOURCE_DATABASE_URL="postgresql://user:pass@host:5432/vicity" \
DATABASE_URL="postgresql://user:pass@host:5432/central_backend" \
npx tsx scripts/migrate-vicity.ts
```

### What it does

The script (`scripts/migrate-vicity.ts`) migrates all ViCity data into the Central Backend under the `vicity` organization:

1. **Creates/finds** the `vicity` Organization record
2. **SystemSettings → OrgSettings** — single record split into group/key pairs (general, booking, tax, property)
3. **Users** — admin/super_admin → `User` table, guest/user → `EndUser` table
4. **RoomType → PropertyType** — with slug generation and metadata
5. **RoomUnit → PropertyUnit** — room number, floor, status, housekeeping
6. **Amenity → PropertyAmenity** — with icon and category
7. **RoomTypeAmenity → PropertyTypeAmenity** — junction table
8. **Inventory → PropertyInventory** — date-based unit availability
9. **PricingRule → PropertyPricingRule** — multi-type rules with priority
10. **Booking → PropertyBooking** — full booking lifecycle with guest data
11. **BookingRoom → PropertyBookingUnit** — unit assignments per booking
12. **Payment → PropertyPayment** — Razorpay fields mapped to provider* generics
13. **Coupon + CouponUsage → DiscountCoupon + DiscountCouponUsage** — with usage tracking
14. **Review → Review** — rating, status, body preserved
15. **Notification → Notification** — type mapped to in_app, read status preserved
16. **AuditLog → AuditLog** — actor role mapped to actorType, changes preserved

### ID mapping

All source UUIDs are mapped to target UUIDs via an in-memory `Map<string, string>`. The original ViCity ID is stored in:
- `EndUser.externalId` — for customer users
- `PropertyType.metadata.sourceId` — for room types
- `PropertyBooking.metadata.sourceId` — for bookings
- `PropertyPayment.metadata.sourceId` — for payments
- `User.metadata.sourceId` — for admin users

### Data not migrated

The following ViCity-specific data is **not** migrated (no equivalent in Central Backend):
- `Session` — transient auth session data
- `EmailVerificationToken` / `PasswordResetToken` / `PhoneOtp` — transient auth tokens
- `InventoryHold` — transient hold data (migrated bookings already reflect final state)
- `WebhookEvent` — Razorpay webhook payloads (raw provider data)
- `NotificationLog` — delivery channel logs (email/sms status)

## Onboarding a New Client

1. Create `Organization` record with unique slug
2. Set up `OrgConfig` with provider credentials
3. Populate `OrgSettings` with feature flags and config
4. Point client's frontend at Central Backend with `X-Org-Slug` header
5. No code changes required in the Central Backend
