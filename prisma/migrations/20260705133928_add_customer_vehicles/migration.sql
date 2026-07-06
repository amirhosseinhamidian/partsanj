-- CreateTable
CREATE TABLE "CustomerVehicle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleVariantId" TEXT NOT NULL,
    "label" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerVehicle_userId_isDefault_idx" ON "CustomerVehicle"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "CustomerVehicle_vehicleVariantId_idx" ON "CustomerVehicle"("vehicleVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerVehicle_userId_vehicleVariantId_key" ON "CustomerVehicle"("userId", "vehicleVariantId");

-- AddForeignKey
ALTER TABLE "CustomerVehicle" ADD CONSTRAINT "CustomerVehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerVehicle" ADD CONSTRAINT "CustomerVehicle_vehicleVariantId_fkey" FOREIGN KEY ("vehicleVariantId") REFERENCES "VehicleVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "CustomerVehicle_one_default_per_user"
ON "CustomerVehicle" ("userId")
WHERE "isDefault" = true;
