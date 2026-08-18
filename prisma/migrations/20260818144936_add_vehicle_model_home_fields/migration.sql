-- AlterTable
ALTER TABLE "VehicleModel" ADD COLUMN     "homeSortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "showOnHome" BOOLEAN NOT NULL DEFAULT false;
