/*
  Warnings:

  - A unique constraint covering the columns `[modelId,name]` on the table `VehicleVariant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "VehicleVariant_modelId_name_key" ON "VehicleVariant"("modelId", "name");
