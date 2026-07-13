-- CreateEnum
CREATE TYPE "OrderInventoryStatus" AS ENUM ('NOT_RESERVED', 'RESERVED', 'COMMITTED', 'RELEASED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "inventoryCommittedAt" TIMESTAMP(3),
ADD COLUMN     "inventoryReleasedAt" TIMESTAMP(3),
ADD COLUMN     "inventoryReservedAt" TIMESTAMP(3),
ADD COLUMN     "inventoryStatus" "OrderInventoryStatus" NOT NULL DEFAULT 'NOT_RESERVED';

-- CreateIndex
CREATE INDEX "Order_inventoryStatus_idx" ON "Order"("inventoryStatus");
