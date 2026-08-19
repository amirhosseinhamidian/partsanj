-- CreateEnum
CREATE TYPE "ContentModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SPAM', 'DELETED');

-- CreateEnum
CREATE TYPE "InteractionAuthorType" AS ENUM ('USER', 'STAFF', 'IMPORTED_CUSTOMER');

-- CreateEnum
CREATE TYPE "InteractionSource" AS ENUM ('SITE', 'ADMIN', 'LEGACY', 'INSTAGRAM', 'WHATSAPP', 'PHONE');

-- CreateEnum
CREATE TYPE "ContentReportTargetType" AS ENUM ('PRODUCT_REVIEW', 'PRODUCT_REVIEW_REPLY', 'PRODUCT_QUESTION', 'PRODUCT_QUESTION_REPLY', 'BLOG_COMMENT');

-- CreateEnum
CREATE TYPE "ContentReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminAuditAction" ADD VALUE 'APPROVED';
ALTER TYPE "AdminAuditAction" ADD VALUE 'REJECTED';
ALTER TYPE "AdminAuditAction" ADD VALUE 'MARKED_SPAM';
ALTER TYPE "AdminAuditAction" ADD VALUE 'DELETED';
ALTER TYPE "AdminAuditAction" ADD VALUE 'RESTORED';
ALTER TYPE "AdminAuditAction" ADD VALUE 'REPLIED';
ALTER TYPE "AdminAuditAction" ADD VALUE 'IMPORTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminAuditEntityType" ADD VALUE 'PRODUCT_REVIEW';
ALTER TYPE "AdminAuditEntityType" ADD VALUE 'PRODUCT_REVIEW_REPLY';
ALTER TYPE "AdminAuditEntityType" ADD VALUE 'PRODUCT_QUESTION';
ALTER TYPE "AdminAuditEntityType" ADD VALUE 'PRODUCT_QUESTION_REPLY';
ALTER TYPE "AdminAuditEntityType" ADD VALUE 'BLOG_COMMENT';
ALTER TYPE "AdminAuditEntityType" ADD VALUE 'USER_CONTENT_REPORT';

-- AlterTable
ALTER TABLE "SiteSetting" ADD COLUMN     "blogCommentsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "productQuestionsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "productReviewsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "supportAvatarUrl" VARCHAR(2048),
ADD COLUMN     "supportBadgeLabel" VARCHAR(100) NOT NULL DEFAULT 'پاسخ رسمی پارت‌سنج',
ADD COLUMN     "supportDisplayName" VARCHAR(100) NOT NULL DEFAULT 'پارت‌سنج';

-- CreateTable
CREATE TABLE "ProductReview" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "authorUserId" TEXT,
    "authorType" "InteractionAuthorType" NOT NULL DEFAULT 'USER',
    "authorDisplayName" VARCHAR(100),
    "rating" INTEGER NOT NULL,
    "body" VARCHAR(3000),
    "status" "ContentModerationStatus" NOT NULL DEFAULT 'PENDING',
    "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "source" "InteractionSource" NOT NULL DEFAULT 'SITE',
    "sourceReference" VARCHAR(255),
    "sourceCreatedAt" TIMESTAMP(3),
    "moderatedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductReviewReply" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "parentId" TEXT,
    "authorUserId" TEXT,
    "authorType" "InteractionAuthorType" NOT NULL DEFAULT 'USER',
    "authorDisplayName" VARCHAR(100),
    "body" VARCHAR(3000) NOT NULL,
    "status" "ContentModerationStatus" NOT NULL DEFAULT 'PENDING',
    "source" "InteractionSource" NOT NULL DEFAULT 'SITE',
    "sourceReference" VARCHAR(255),
    "sourceCreatedAt" TIMESTAMP(3),
    "moderatedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductReviewReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductReviewHelpfulVote" (
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductReviewHelpfulVote_pkey" PRIMARY KEY ("reviewId","userId")
);

-- CreateTable
CREATE TABLE "ProductQuestion" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "authorUserId" TEXT,
    "authorType" "InteractionAuthorType" NOT NULL DEFAULT 'USER',
    "authorDisplayName" VARCHAR(100),
    "body" VARCHAR(2000) NOT NULL,
    "status" "ContentModerationStatus" NOT NULL DEFAULT 'PENDING',
    "source" "InteractionSource" NOT NULL DEFAULT 'SITE',
    "sourceReference" VARCHAR(255),
    "sourceCreatedAt" TIMESTAMP(3),
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "moderatedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductQuestionReply" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "parentId" TEXT,
    "authorUserId" TEXT,
    "authorType" "InteractionAuthorType" NOT NULL DEFAULT 'USER',
    "authorDisplayName" VARCHAR(100),
    "body" VARCHAR(3000) NOT NULL,
    "status" "ContentModerationStatus" NOT NULL DEFAULT 'PENDING',
    "source" "InteractionSource" NOT NULL DEFAULT 'SITE',
    "sourceReference" VARCHAR(255),
    "sourceCreatedAt" TIMESTAMP(3),
    "moderatedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductQuestionReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogComment" (
    "id" TEXT NOT NULL,
    "blogPostId" TEXT NOT NULL,
    "parentId" TEXT,
    "authorUserId" TEXT,
    "authorType" "InteractionAuthorType" NOT NULL DEFAULT 'USER',
    "authorDisplayName" VARCHAR(100),
    "body" VARCHAR(3000) NOT NULL,
    "status" "ContentModerationStatus" NOT NULL DEFAULT 'PENDING',
    "source" "InteractionSource" NOT NULL DEFAULT 'SITE',
    "sourceReference" VARCHAR(255),
    "sourceCreatedAt" TIMESTAMP(3),
    "moderatedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserContentReport" (
    "id" TEXT NOT NULL,
    "reporterUserId" TEXT NOT NULL,
    "targetType" "ContentReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" VARCHAR(150) NOT NULL,
    "details" VARCHAR(1000),
    "status" "ContentReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserContentReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductReview_productId_status_publishedAt_idx" ON "ProductReview"("productId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "ProductReview_productId_authorUserId_idx" ON "ProductReview"("productId", "authorUserId");

-- CreateIndex
CREATE INDEX "ProductReview_authorUserId_createdAt_idx" ON "ProductReview"("authorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductReview_status_createdAt_idx" ON "ProductReview"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ProductReview_source_sourceReference_idx" ON "ProductReview"("source", "sourceReference");

-- CreateIndex
CREATE INDEX "ProductReviewReply_reviewId_status_createdAt_idx" ON "ProductReviewReply"("reviewId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProductReviewReply_parentId_idx" ON "ProductReviewReply"("parentId");

-- CreateIndex
CREATE INDEX "ProductReviewReply_authorUserId_createdAt_idx" ON "ProductReviewReply"("authorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductReviewHelpfulVote_userId_createdAt_idx" ON "ProductReviewHelpfulVote"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductQuestion_productId_status_publishedAt_idx" ON "ProductQuestion"("productId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "ProductQuestion_productId_isPinned_publishedAt_idx" ON "ProductQuestion"("productId", "isPinned", "publishedAt");

-- CreateIndex
CREATE INDEX "ProductQuestion_authorUserId_createdAt_idx" ON "ProductQuestion"("authorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductQuestion_status_createdAt_idx" ON "ProductQuestion"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ProductQuestion_source_sourceReference_idx" ON "ProductQuestion"("source", "sourceReference");

-- CreateIndex
CREATE INDEX "ProductQuestionReply_questionId_status_createdAt_idx" ON "ProductQuestionReply"("questionId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProductQuestionReply_parentId_idx" ON "ProductQuestionReply"("parentId");

-- CreateIndex
CREATE INDEX "ProductQuestionReply_authorUserId_createdAt_idx" ON "ProductQuestionReply"("authorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "BlogComment_blogPostId_status_createdAt_idx" ON "BlogComment"("blogPostId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BlogComment_blogPostId_parentId_createdAt_idx" ON "BlogComment"("blogPostId", "parentId", "createdAt");

-- CreateIndex
CREATE INDEX "BlogComment_parentId_idx" ON "BlogComment"("parentId");

-- CreateIndex
CREATE INDEX "BlogComment_authorUserId_createdAt_idx" ON "BlogComment"("authorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "UserContentReport_status_createdAt_idx" ON "UserContentReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "UserContentReport_targetType_targetId_idx" ON "UserContentReport"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "UserContentReport_targetType_targetId_reporterUserId_key" ON "UserContentReport"("targetType", "targetId", "reporterUserId");

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReviewReply" ADD CONSTRAINT "ProductReviewReply_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "ProductReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReviewReply" ADD CONSTRAINT "ProductReviewReply_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReviewReply" ADD CONSTRAINT "ProductReviewReply_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProductReviewReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReviewHelpfulVote" ADD CONSTRAINT "ProductReviewHelpfulVote_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "ProductReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReviewHelpfulVote" ADD CONSTRAINT "ProductReviewHelpfulVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductQuestion" ADD CONSTRAINT "ProductQuestion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductQuestion" ADD CONSTRAINT "ProductQuestion_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductQuestionReply" ADD CONSTRAINT "ProductQuestionReply_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ProductQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductQuestionReply" ADD CONSTRAINT "ProductQuestionReply_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductQuestionReply" ADD CONSTRAINT "ProductQuestionReply_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProductQuestionReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BlogComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserContentReport" ADD CONSTRAINT "UserContentReport_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductReview"
ADD CONSTRAINT "ProductReview_rating_check"
CHECK ("rating" >= 1 AND "rating" <= 5);