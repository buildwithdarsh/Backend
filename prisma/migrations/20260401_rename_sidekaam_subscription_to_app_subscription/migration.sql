-- Rename table
ALTER TABLE "sidekaam_subscriptions" RENAME TO "app_subscriptions";

-- Rename provider-specific columns to generic names
ALTER TABLE "app_subscriptions" RENAME COLUMN "razorpayPaymentId" TO "providerPaymentId";
ALTER TABLE "app_subscriptions" RENAME COLUMN "razorpayOrderId" TO "providerOrderId";
