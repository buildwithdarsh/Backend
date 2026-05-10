-- CreateTable
CREATE TABLE "spin_wheel_shops" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "shop_domain" VARCHAR(255) NOT NULL,
    "access_token" VARCHAR(255) NOT NULL,
    "shop_name" TEXT,
    "shop_email" TEXT,
    "plan" VARCHAR(20) NOT NULL DEFAULT 'free',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "installed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "spin_wheel_shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spin_wheel_campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "shop_domain" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "trigger_type" VARCHAR(20) NOT NULL DEFAULT 'PAGE_LOAD',
    "trigger_value" VARCHAR(100),
    "frequency_cap" VARCHAR(20) NOT NULL DEFAULT 'ONCE_SESSION',
    "device_target" VARCHAR(20) NOT NULL DEFAULT 'ALL',
    "collect_email" BOOLEAN NOT NULL DEFAULT true,
    "collect_phone" BOOLEAN NOT NULL DEFAULT false,
    "collect_name" BOOLEAN NOT NULL DEFAULT false,
    "form_position" VARCHAR(20) NOT NULL DEFAULT 'BEFORE_SPIN',
    "theme" JSONB DEFAULT '{}',
    "scheduled_start" TIMESTAMPTZ,
    "scheduled_end" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "spin_wheel_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spin_wheel_slices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "color" VARCHAR(9) NOT NULL,
    "text_color" VARCHAR(9) NOT NULL DEFAULT '#FFFFFF',
    "prize_type" VARCHAR(20) NOT NULL,
    "prize_value" DECIMAL(12,2),
    "probability" DECIMAL(5,2) NOT NULL,
    "discount_code" VARCHAR(50),
    "max_redemptions" INTEGER,
    "current_redemptions" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "spin_wheel_slices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spin_wheel_spins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "slice_id" UUID NOT NULL,
    "customer_email" VARCHAR(255),
    "customer_phone" VARCHAR(20),
    "customer_name" VARCHAR(255),
    "discount_code" VARCHAR(50),
    "redeemed" BOOLEAN NOT NULL DEFAULT false,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spin_wheel_spins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spin_wheel_analytics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "spins" INTEGER NOT NULL DEFAULT 0,
    "unique_spins" INTEGER NOT NULL DEFAULT 0,
    "emails_captured" INTEGER NOT NULL DEFAULT 0,
    "phones_captured" INTEGER NOT NULL DEFAULT 0,
    "codes_generated" INTEGER NOT NULL DEFAULT 0,
    "codes_redeemed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "spin_wheel_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "spin_wheel_shops_shop_domain_key" ON "spin_wheel_shops"("shop_domain");
CREATE INDEX "spin_wheel_shops_org_id_idx" ON "spin_wheel_shops"("org_id");

CREATE INDEX "spin_wheel_campaigns_org_id_idx" ON "spin_wheel_campaigns"("org_id");
CREATE INDEX "spin_wheel_campaigns_shop_domain_status_idx" ON "spin_wheel_campaigns"("shop_domain", "status");

CREATE INDEX "spin_wheel_slices_org_id_campaign_id_idx" ON "spin_wheel_slices"("org_id", "campaign_id");

CREATE INDEX "spin_wheel_spins_org_id_campaign_id_idx" ON "spin_wheel_spins"("org_id", "campaign_id");
CREATE INDEX "spin_wheel_spins_campaign_id_customer_email_idx" ON "spin_wheel_spins"("campaign_id", "customer_email");

CREATE UNIQUE INDEX "spin_wheel_analytics_campaign_id_date_key" ON "spin_wheel_analytics"("campaign_id", "date");
CREATE INDEX "spin_wheel_analytics_org_id_idx" ON "spin_wheel_analytics"("org_id");

-- AddForeignKey
ALTER TABLE "spin_wheel_shops" ADD CONSTRAINT "spin_wheel_shops_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "spin_wheel_campaigns" ADD CONSTRAINT "spin_wheel_campaigns_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "spin_wheel_slices" ADD CONSTRAINT "spin_wheel_slices_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "spin_wheel_slices" ADD CONSTRAINT "spin_wheel_slices_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "spin_wheel_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "spin_wheel_spins" ADD CONSTRAINT "spin_wheel_spins_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "spin_wheel_spins" ADD CONSTRAINT "spin_wheel_spins_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "spin_wheel_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "spin_wheel_spins" ADD CONSTRAINT "spin_wheel_spins_slice_id_fkey" FOREIGN KEY ("slice_id") REFERENCES "spin_wheel_slices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "spin_wheel_analytics" ADD CONSTRAINT "spin_wheel_analytics_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "spin_wheel_analytics" ADD CONSTRAINT "spin_wheel_analytics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "spin_wheel_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
