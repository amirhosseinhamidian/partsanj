-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "saleEndsAt" TIMESTAMP(3),
ADD COLUMN     "salePriceToman" INTEGER,
ADD COLUMN     "saleStartsAt" TIMESTAMP(3);
