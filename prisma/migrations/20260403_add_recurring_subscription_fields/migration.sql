-- AlterTable
ALTER TABLE "app_subscriptions" ADD COLUMN "providerSubscriptionId" TEXT;
ALTER TABLE "app_subscriptions" ADD COLUMN "providerPlanId" TEXT;
ALTER TABLE "app_subscriptions" ADD COLUMN "cancelledAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "app_subscriptions_providerSubscriptionId_idx" ON "app_subscriptions"("providerSubscriptionId");
