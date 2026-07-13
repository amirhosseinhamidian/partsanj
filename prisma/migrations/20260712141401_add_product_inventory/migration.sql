-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "stockQuantity" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Product"
ADD CONSTRAINT "Product_stockQuantity_nonnegative"
CHECK ("stockQuantity" >= 0);

ALTER TABLE "Product"
ADD CONSTRAINT "Product_lowStockThreshold_nonnegative"
CHECK ("lowStockThreshold" >= 0);

UPDATE "Product"
SET "stockStatus" = 'CHECK_AVAILABILITY'
WHERE "stockStatus" = 'IN_STOCK'
  AND "stockQuantity" = 0;