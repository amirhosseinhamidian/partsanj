-- CreateEnum
CREATE TYPE "MediaAssetPurpose" AS ENUM ('PRODUCT', 'BLOG', 'CATEGORY', 'BRAND', 'VEHICLE', 'GENERAL');

-- CreateEnum
CREATE TYPE "MediaAssetStatus" AS ENUM ('READY', 'DELETED', 'ERROR');

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "purpose" "MediaAssetPurpose" NOT NULL,
    "status" "MediaAssetStatus" NOT NULL DEFAULT 'READY',
    "objectKey" VARCHAR(1024) NOT NULL,
    "publicUrl" VARCHAR(2048) NOT NULL,
    "thumbnailObjectKey" VARCHAR(1024) NOT NULL,
    "thumbnailPublicUrl" VARCHAR(2048) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "sourceMimeType" VARCHAR(100) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "originalSizeBytes" INTEGER NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "thumbnailSizeBytes" INTEGER NOT NULL,
    "thumbnailWidth" INTEGER NOT NULL,
    "thumbnailHeight" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_objectKey_key" ON "MediaAsset"("objectKey");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_thumbnailObjectKey_key" ON "MediaAsset"("thumbnailObjectKey");

-- CreateIndex
CREATE INDEX "MediaAsset_purpose_createdAt_idx" ON "MediaAsset"("purpose", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_status_createdAt_idx" ON "MediaAsset"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_uploadedById_createdAt_idx" ON "MediaAsset"("uploadedById", "createdAt");

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
