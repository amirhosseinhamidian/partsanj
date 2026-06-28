-- CreateEnum
CREATE TYPE "ProductAuditAction" AS ENUM ('CREATED', 'UPDATED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "ProductAuditLog" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" "ProductAuditAction" NOT NULL,
    "changes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductAuditLog_productId_createdAt_idx" ON "ProductAuditLog"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductAuditLog_actorUserId_createdAt_idx" ON "ProductAuditLog"("actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProductAuditLog" ADD CONSTRAINT "ProductAuditLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAuditLog" ADD CONSTRAINT "ProductAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
