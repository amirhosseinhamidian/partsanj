-- AlterTable
ALTER TABLE "VehicleModel"
ADD COLUMN "showOnHome" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "homeSortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "VehicleModel_showOnHome_isActive_homeSortOrder_idx"
ON "VehicleModel"("showOnHome", "isActive", "homeSortOrder");
