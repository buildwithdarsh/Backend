# NestJS Performance Audit — Darsh Gupta Backend

**Date:** 2026-03-15
**Target:** 100x improvement roadmap across 7 NestJS layers

---

## CRITICAL Findings

### 1. Config Resolver: N+1 Query Pattern Across All Provider Configs
- **Layer:** 2 (Database)
- **File:** `src/services/config-resolver/config-resolver.service.ts:232-346`
- **Issue:** `getEmailConfig()`, `getPaymentConfig()`, `getSmsConfig()`, etc. each call `getActiveProvider()` + 2-5 individual `resolve()` calls. Each `resolve()` potentially hits DB twice (orgConfig + platformConfig). A single payment config load triggers **4-6 DB queries**.
- **Fix:** Batch-load all keys per group in a single query and cache the entire config object:
```typescript
async getEmailConfig(orgId: string): Promise<EmailProviderConfig> {
  const cacheKey = `email-config:${orgId}`;
  const cached = await this.cacheService.get<EmailProviderConfig>(cacheKey);
  if (cached) return cached;

  const configs = await this.prisma.orgConfig.findMany({
    where: { orgId, key: { startsWith: 'email.' } },
  });
  // Build config object from batch result, cache it
  await this.cacheService.set(cacheKey, result, 300);
  return result;
}
```
- **Gain:** 4-6 DB queries -> 1 per provider config load

---

### 2. Auth Services: Uncached Org Slug Lookup on Every Auth Request
- **Layer:** 2 (Database) + 1 (Caching)
- **File:** `src/modules/auth/auth.service.ts:52,121,287,322,390,508` + `src/modules/end-user-auth/end-user-auth.service.ts:47,108,292,320,428,632`
- **Issue:** `findOrgBySlug()` called in every auth method (login, register, OTP, etc.) -- **12+ call sites** across both services, zero caching. 1000 concurrent logins across 10 orgs = 1000 redundant DB queries.
- **Fix:**
```typescript
private async findOrgBySlug(slug: string) {
  const cacheKey = `org:slug:${slug}`;
  const cached = await this.cacheService.get(cacheKey);
  if (cached) return cached;
  const org = await this.prisma.organization.findFirst({ where: { slug } });
  if (org) await this.cacheService.set(cacheKey, org, 300);
  return org;
}
```
- **Gain:** Eliminates ~12 redundant DB queries per auth flow under concurrent load

---

### 3. Catalog Endpoints: Zero Caching on Highest-Traffic Storefront Reads
- **Layer:** 1 (Caching) + 2 (Database)
- **File:** `src/modules/catalog/catalog.service.ts` -- `findAllCategories()`, `findAllItems()`
- **Issue:** Every storefront page load triggers deep nested DB queries (`optionGroups.options`, `sizeVariations`, `variants`) with no caching and no pagination on categories.
- **Fix:** Redis cache with 5-min TTL + invalidation on mutation.
- **Gain:** 10-50x throughput improvement on storefront hot path

---

### 4. Storefront Org Middleware: Uncached DB Query Per Request
- **Layer:** 3 (Middleware)
- **File:** `src/common/middleware/storefront-org.middleware.ts:21-24`
- **Issue:** Every `/api/v1/storefront/*` request queries org by slug -- no cache.
- **Fix:** Cache org ID by slug with 10-min TTL.
- **Gain:** 3-8ms saved per storefront request

---

### 5. API Key Guard: DB Lookup + Fire-and-Forget Update Per Request
- **Layer:** 6 (Guards)
- **File:** `src/common/guards/api-key.guard.ts:68-73,115-124`
- **Issue:** `findFirst()` on every API-key-authenticated request (no cache). Then `lastUsedAt` update creates orphaned promise on every request -- potential connection pool exhaustion under load.
- **Fix:** Cache key lookup by prefix (5-min TTL). Batch `lastUsedAt` updates via queue or periodic flush.
- **Gain:** Eliminates 1 read + 1 write per API-key request

---

### 6. Campaign Audience: Loads All Users Into Memory
- **Layer:** 4 (Async / Queue)
- **File:** `src/modules/campaigns/campaigns.service.ts:254-257` + `src/jobs/campaign-scheduler.job.ts:97-118`
- **Issue:** Campaign launch loads **all** segment user IDs into memory, then `addBulk()` enqueues all at once. 100K-user segment = 100K IDs in memory + 100K Redis writes in one call.
- **Fix:** Stream in batches of 1000:
```typescript
let cursor: string | undefined;
do {
  const batch = await this.prisma.endUser.findMany({
    where: audienceWhere, select: { id: true }, take: 1000,
    cursor: cursor ? { id: cursor } : undefined, skip: cursor ? 1 : 0,
  });
  await this.campaignQueue.addBulk(batch.map(u => ({
    name: 'send',
    data: { ...payload, endUserId: u.id },
  })));
  cursor = batch[batch.length - 1]?.id;
} while (cursor);
```
- **Gain:** Constant memory usage regardless of audience size

---

### 7. POS Menu Sync: Blocking Sync in Request Path
- **Layer:** 4 (Async / Queue)
- **File:** `src/modules/pos/pos.service.ts:18-54`
- **Issue:** Menu sync is a blocking request-time operation that can take 5-30 seconds. Entire request hangs.
- **Fix:** Queue to BullMQ, return job ID, poll for status.
- **Gain:** Request completes in <100ms instead of 5-30s

---

## MEDIUM Findings

### 8. Usage + Audit Interceptors: Per-Request DB Writes
- **Layer:** 3 (Interceptors)
- **File:** `src/common/interceptors/usage.interceptor.ts:50-62`, `src/common/interceptors/audit.interceptor.ts:64-78`
- **Issue:** Every request = 1 usage log write. Every write request = 1 audit log write (with full request body in JSON column). Fire-and-forget but causes memory/connection buildup under load.
- **Fix:** In-memory buffer with periodic flush (every 30s or 100 entries).
- **Gain:** 100x fewer DB writes

---

### 9. Segment Refresh Job: Delete-All + Re-Insert Every 5 Minutes
- **Layer:** 4 (Async)
- **File:** `src/jobs/segment-refresh.job.ts:71-91`
- **Issue:** `deleteMany()` then `createMany()` on every refresh cycle. Massive write amplification for large segments.
- **Fix:** Use `createMany({ skipDuplicates: true })` for adds + selective `deleteMany()` for removes (delta-based).
- **Gain:** 10-100x fewer writes per refresh

---

### 10. Commerce Orders: `count()` for Sequential Number
- **Layer:** 2 (Database)
- **File:** `src/modules/commerce-orders/commerce-orders.service.ts:29`
- **Issue:** `count()` on entire orders table inside transaction to generate `ORD-{n+1}`. Gets slower as orders grow.
- **Fix:** Use a Postgres sequence: `SELECT nextval('order_number_seq')`.
- **Gain:** O(n) -> O(1)

---

### 11. Delivery Zone: Full Table Scan + Client-Side Matching
- **Layer:** 2 (Database)
- **File:** `src/modules/delivery/delivery.service.ts:92-133`
- **Issue:** Fetches all zones, loops client-side to match pincode/distance. Called per order.
- **Fix:** Push pincode filter to DB `WHERE` clause.
- **Gain:** O(n) -> O(1) per order

---

### 12. Campaign Worker: Handlebars Re-Compile Per User
- **Layer:** 4 (Async)
- **File:** `src/workers/campaign.worker.ts:60-66`
- **Issue:** `Handlebars.compile()` called per job. Same template compiled 10K times for 10K users.
- **Fix:** In-memory `Map<templateId, compiled>` cache:
```typescript
private templateCache = new Map<string, HandlebarsTemplateDelegate>();

private getTemplate(templateId: string, source: string) {
  if (!this.templateCache.has(templateId)) {
    this.templateCache.set(templateId, Handlebars.compile(source));
  }
  return this.templateCache.get(templateId)!;
}
```
- **Gain:** ~5-20ms saved per job

---

### 13. Prisma Soft-Delete Extension: Overhead on Every Query
- **Layer:** 5 (DI & Modules)
- **File:** `src/database/prisma.service.ts:44-95`
- **Issue:** Extension iterates `SOFT_DELETE_MODELS` array and injects `deletedAt: null` on every `findMany/findFirst/findUnique`. Object allocation overhead compounds at thousands of queries/min.
- **Fix:** Consider Prisma middleware (runs at driver level) or raw `@default` DB views with `WHERE deleted_at IS NULL`.
- **Gain:** Reduced CPU overhead per query (~0.1-0.5ms saved, compounding)

---

### 14. Storage Service: Unbounded Client Cache + Unmemoized SDK Import
- **Layer:** 5 (DI & Modules)
- **File:** `src/services/storage/storage.service.ts:111-189`
- **Issue:** S3/R2 clients cached forever (no eviction). `loadS3SDK()` / `loadPresigner()` dynamically import on every call without memoization.
- **Fix:** Memoize SDK imports at class level. Add TTL or LRU eviction on client cache.
- **Gain:** Eliminates repeated dynamic imports; prevents memory leak

---

### 15. Coupon Validate + Record: Double Fetch
- **Layer:** 2 (Database)
- **File:** `src/modules/coupons/coupons.service.ts:162-286`
- **Issue:** `validate()` fetches full coupon, then `recordUsage()` fetches again. Two round trips, no transaction linking them.
- **Fix:** Pass coupon object from validate to record, wrap in transaction.
- **Gain:** 1 fewer DB query per coupon application

---

## QUICK-WIN Findings

### 16. Locations + Promotions + Reviews: No Cache
- **Layer:** 1 (Caching)
- **Files:** `src/modules/locations/locations.service.ts:27-32`, `src/modules/promotions/promotions.service.ts:25-48`, `src/modules/reviews/reviews.service.ts:42-69`
- **Issue:** All read-heavy, rarely changing -- hit DB every time.
- **Fix:** 5-10 min Redis cache on each.
- **Gain:** Near-instant responses; DB load eliminated

---

### 17. Interceptors Run on Health Checks
- **Layer:** 3 (Interceptors)
- **File:** `src/app.module.ts:188-194`
- **Issue:** Usage + Audit interceptors fire on `/health`, creating pointless DB writes.
- **Fix:** Early-return in interceptor if `request.url === '/health'`:
```typescript
intercept(context: ExecutionContext, next: CallHandler) {
  const req = context.switchToHttp().getRequest();
  if (req.url === '/health') return next.handle();
  // ... rest of logic
}
```
- **Gain:** 2 DB writes eliminated per health probe

---

### 18. Audit Interceptor: Regex Compiled Per Request
- **Layer:** 3 (Interceptors)
- **File:** `src/common/interceptors/audit.interceptor.ts:101-102`
- **Issue:** UUID regex pattern compiled inside `parseRoute()` on every write request.
- **Fix:** Move to static class constant:
```typescript
private static readonly UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
```
- **Gain:** Marginal CPU savings, clean code

---

### 19. RBAC Guard: Over-Fetching Role Fields
- **Layer:** 6 (Guards)
- **File:** `src/common/guards/rbac.guard.ts:107-118`
- **Issue:** Loads full role objects when only `permissions` array is needed.
- **Fix:** `select: { role: { select: { permissions: true } } }`
- **Gain:** ~30-50% less data per permission check

---

### 20. Verbose Logging in All Environments
- **Layer:** 7 (Infra)
- **File:** `src/main.ts:12`
- **Issue:** Logger includes `verbose` and `debug` levels regardless of `NODE_ENV`.
- **Fix:**
```typescript
const isProd = process.env.NODE_ENV === 'production';
logger: isProd ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug', 'verbose'],
```
- **Gain:** Reduced I/O overhead in production

---

## PRIORITY TABLE (Impact x Effort^-1) -- Top 10

| Rank | #  | Finding                                | Severity | Layer | Est. Gain                       | Effort |
|------|----|----------------------------------------|----------|-------|---------------------------------|--------|
| 1    | 3  | Cache catalog endpoints                | CRITICAL | 1+2   | **10-50x storefront throughput**| 1h     |
| 2    | 2  | Cache org slug lookup (auth + mw)      | CRITICAL | 2+3   | **3-8ms/req x every request**   | 45m    |
| 3    | 5  | Cache API key guard lookup             | CRITICAL | 6     | **2-5ms + 1 write saved/req**   | 30m    |
| 4    | 8  | Batch usage/audit log writes           | MEDIUM   | 3     | **100x fewer DB writes**        | 2h     |
| 5    | 12 | Cache compiled Handlebars templates    | MEDIUM   | 4     | **5-20ms/job x thousands**      | 20m    |
| 6    | 16 | Cache locations/promotions/reviews     | QUICK-WIN| 1     | **Near-instant storefront**     | 30m    |
| 7    | 1  | Batch config resolver queries          | CRITICAL | 2     | **4-6 queries -> 1**            | 1.5h   |
| 8    | 11 | DB-level delivery zone filter          | MEDIUM   | 2     | **O(n) -> O(1) per order**      | 1h     |
| 9    | 6  | Paginate campaign audience loading     | CRITICAL | 4     | **Constant memory at scale**    | 1.5h   |
| 10   | 7  | Move POS sync to background queue      | CRITICAL | 4     | **30s -> <100ms response**      | 1h     |

---

**Cumulative impact:** Ranks 1-4 alone should deliver **10-50x throughput** on the storefront hot path and **100x fewer DB writes** for logging. Ranks 5-10 address scalability ceilings that will surface as user volume grows.

**Total estimated implementation:** ~10 hours for all top 10.
