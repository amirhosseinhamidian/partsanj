-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "canonicalUrl" VARCHAR(2048),
ADD COLUMN     "noIndex" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "openGraphDescription" VARCHAR(500),
ADD COLUMN     "openGraphImageAlt" VARCHAR(255),
ADD COLUMN     "openGraphImageUrl" VARCHAR(2048),
ADD COLUMN     "openGraphTitle" VARCHAR(160),
ADD COLUMN     "seoDescription" VARCHAR(320),
ADD COLUMN     "seoTitle" VARCHAR(120);
