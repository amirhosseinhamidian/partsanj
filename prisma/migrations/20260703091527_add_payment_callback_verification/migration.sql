-- AlterTable
ALTER TABLE "PaymentAttempt" ADD COLUMN     "callbackPayload" JSONB,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "providerCardHash" TEXT,
ADD COLUMN     "providerCardPan" TEXT,
ADD COLUMN     "providerReferenceId" TEXT,
ADD COLUMN     "verificationPayload" JSONB;

-- CreateIndex
CREATE INDEX "PaymentAttempt_status_callbackReceivedAt_idx" ON "PaymentAttempt"("status", "callbackReceivedAt");

CREATE UNIQUE INDEX "PaymentAttempt_provider_session_unique"
ON "PaymentAttempt" ("providerCode", "providerSessionId")
WHERE "providerSessionId" IS NOT NULL;

CREATE UNIQUE INDEX "PaymentAttempt_provider_reference_unique"
ON "PaymentAttempt" ("providerCode", "providerReferenceId")
WHERE "providerReferenceId" IS NOT NULL;