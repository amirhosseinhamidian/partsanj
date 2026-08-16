-- CreateEnum
CREATE TYPE "ProductBehaviorEventType" AS ENUM ('VIEW', 'ADD_TO_CART');

-- CreateTable
CREATE TABLE "ProductBehaviorEvent" (
    "id" TEXT NOT NULL,
    "type" "ProductBehaviorEventType" NOT NULL,
    "sessionId" VARCHAR(64) NOT NULL,
    "productId" TEXT NOT NULL,
    "vehicleVariantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductBehaviorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductBehaviorEvent_sessionId_createdAt_idx" ON "ProductBehaviorEvent"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductBehaviorEvent_productId_type_createdAt_idx" ON "ProductBehaviorEvent"("productId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "ProductBehaviorEvent_sessionId_productId_type_createdAt_idx" ON "ProductBehaviorEvent"("sessionId", "productId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "ProductBehaviorEvent_vehicleVariantId_createdAt_idx" ON "ProductBehaviorEvent"("vehicleVariantId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProductBehaviorEvent" ADD CONSTRAINT "ProductBehaviorEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBehaviorEvent" ADD CONSTRAINT "ProductBehaviorEvent_vehicleVariantId_fkey" FOREIGN KEY ("vehicleVariantId") REFERENCES "VehicleVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
