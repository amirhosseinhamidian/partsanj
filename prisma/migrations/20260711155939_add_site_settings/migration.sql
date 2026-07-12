-- AlterEnum
ALTER TYPE "AdminAuditEntityType" ADD VALUE 'SITE_SETTING';

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL DEFAULT 'site',
    "siteName" VARCHAR(100) NOT NULL DEFAULT 'پارت‌سنج',
    "siteTagline" VARCHAR(200),
    "siteBaseUrl" VARCHAR(2048) NOT NULL DEFAULT 'https://partsanj.com',
    "logoLightUrl" VARCHAR(2048),
    "logoDarkUrl" VARCHAR(2048),
    "faviconUrl" VARCHAR(2048),
    "supportPhone" VARCHAR(50),
    "supportMobile" VARCHAR(50),
    "whatsappUrl" VARCHAR(2048),
    "telegramUrl" VARCHAR(2048),
    "baleUrl" VARCHAR(2048),
    "instagramUrl" VARCHAR(2048),
    "defaultSeoTitle" VARCHAR(120),
    "defaultSeoDescription" VARCHAR(320),
    "defaultOgImageUrl" VARCHAR(2048),
    "noIndexSite" BOOLEAN NOT NULL DEFAULT false,
    "storeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "orderingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "showPrices" BOOLEAN NOT NULL DEFAULT true,
    "defaultShippingCostToman" INTEGER,
    "freeShippingThresholdToman" INTEGER,
    "orderExpirationMinutes" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);
