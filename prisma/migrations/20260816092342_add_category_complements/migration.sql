-- CreateTable
CREATE TABLE "CategoryComplement" (
    "id" TEXT NOT NULL,
    "sourceCategoryId" TEXT NOT NULL,
    "targetCategoryId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryComplement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategoryComplement_sourceCategoryId_sortOrder_idx" ON "CategoryComplement"("sourceCategoryId", "sortOrder");

-- CreateIndex
CREATE INDEX "CategoryComplement_targetCategoryId_idx" ON "CategoryComplement"("targetCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryComplement_sourceCategoryId_targetCategoryId_key" ON "CategoryComplement"("sourceCategoryId", "targetCategoryId");

-- AddForeignKey
ALTER TABLE "CategoryComplement" ADD CONSTRAINT "CategoryComplement_sourceCategoryId_fkey" FOREIGN KEY ("sourceCategoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryComplement" ADD CONSTRAINT "CategoryComplement_targetCategoryId_fkey" FOREIGN KEY ("targetCategoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
