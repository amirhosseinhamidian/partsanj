-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminAuditAction" ADD VALUE 'ORDER_STATUS_UPDATED';
ALTER TYPE "AdminAuditAction" ADD VALUE 'ORDER_SHIPMENT_UPDATED';
ALTER TYPE "AdminAuditAction" ADD VALUE 'ORDER_CANCELLED';

-- AlterEnum
ALTER TYPE "AdminAuditEntityType" ADD VALUE 'ORDER';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "shipmentNote" TEXT,
ADD COLUMN     "shippedAt" TIMESTAMP(3),
ADD COLUMN     "shippingCarrier" TEXT,
ADD COLUMN     "trackingCode" TEXT;

-- CreateIndex
CREATE INDEX "Order_shippedAt_idx" ON "Order"("shippedAt");

ALTER TABLE "Order"
ADD CONSTRAINT "Order_shipment_integrity_check"
CHECK (
  "status" NOT IN ('SHIPPED', 'DELIVERED')
  OR (
    "shippingCarrier" IS NOT NULL
    AND length(trim("shippingCarrier")) > 0
    AND "trackingCode" IS NOT NULL
    AND length(trim("trackingCode")) > 0
    AND "shippedAt" IS NOT NULL
  )
);

ALTER TABLE "Order"
ADD CONSTRAINT "Order_delivery_integrity_check"
CHECK (
  "status" <> 'DELIVERED'
  OR "deliveredAt" IS NOT NULL
);

ALTER TABLE "Order"
ADD CONSTRAINT "Order_cancellation_integrity_check"
CHECK (
  "status" <> 'CANCELLED'
  OR (
    "cancelledAt" IS NOT NULL
    AND "cancellationReason" IS NOT NULL
    AND length(trim("cancellationReason")) > 0
  )
);
