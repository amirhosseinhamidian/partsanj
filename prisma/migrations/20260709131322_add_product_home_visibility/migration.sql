-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "homeSortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "showOnHome" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Product_showOnHome_status_isPublished_homeSortOrder_idx" ON "Product"("showOnHome", "status", "isPublished", "homeSortOrder");
