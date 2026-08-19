-- This migration duplicated changes already introduced by:
-- 20260818144936_add_vehicle_model_home_fields
-- 20260818145336_add_vehicle_model_home_fields_index
--
-- Keep it idempotent because it previously reached production
-- and failed there before applying any step.

ALTER TABLE "VehicleModel"
ADD COLUMN IF NOT EXISTS "showOnHome" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "VehicleModel"
ADD COLUMN IF NOT EXISTS "homeSortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "VehicleModel_showOnHome_isActive_homeSortOrder_idx"
ON "VehicleModel"("showOnHome", "isActive", "homeSortOrder");