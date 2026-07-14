CREATE TYPE "OrderSmsType" AS ENUM (
  'CUSTOMER_PAYMENT_REMINDER',
  'CUSTOMER_PAYMENT_SUCCESS',
  'CUSTOMER_ORDER_SHIPPED',
  'ADMIN_NEW_PAID_ORDER'
);

CREATE TYPE "SmsOutboxStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'SENT',
  'FAILED',
  'CANCELLED'
);

CREATE TABLE "OrderSmsOutbox" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "type" "OrderSmsType" NOT NULL,
  "recipient" TEXT NOT NULL,
  "status" "SmsOutboxStatus" NOT NULL DEFAULT 'PENDING',
  "dueAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lockedAt" TIMESTAMP(3),
  "provider" TEXT NOT NULL DEFAULT 'KAVENEGAR',
  "providerMessageId" TEXT,
  "lastError" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OrderSmsOutbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX
  "OrderSmsOutbox_orderId_type_recipient_key"
  ON "OrderSmsOutbox"(
    "orderId",
    "type",
    "recipient"
  );

CREATE INDEX
  "OrderSmsOutbox_status_dueAt_idx"
  ON "OrderSmsOutbox"(
    "status",
    "dueAt"
  );

CREATE INDEX
  "OrderSmsOutbox_orderId_createdAt_idx"
  ON "OrderSmsOutbox"(
    "orderId",
    "createdAt"
  );

ALTER TABLE "OrderSmsOutbox"
  ADD CONSTRAINT "OrderSmsOutbox_orderId_fkey"
  FOREIGN KEY ("orderId")
  REFERENCES "Order"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
