-- Remove guest concept: anonymous guest sessions are no longer supported.
-- Users must either use public APIs (unauthenticated) or be logged in.

-- Remove isGuest flag from end_users
ALTER TABLE "end_users" DROP COLUMN IF EXISTS "is_guest";

-- Remove guest_id from carts (carts are always tied to an end_user)
DROP INDEX IF EXISTS "carts_org_id_guest_id_key";
ALTER TABLE "carts" DROP COLUMN IF EXISTS "guest_id";

-- Remove allow_guest_checkout setting from org_settings
DELETE FROM "org_settings" WHERE "key" = 'allow_guest_checkout';
