-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OrderPaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('CREATED', 'REDIRECTED', 'CALLBACK_RECEIVED', 'VERIFIED', 'FAILED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OrderItemFitmentStatus" AS ENUM ('NOT_SELECTED', 'CONFIRMED', 'REQUIRES_VERIFICATION', 'NOT_CONFIRMED');

-- CreateTable
CREATE TABLE "CustomerAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "recipientFirstName" TEXT NOT NULL,
    "recipientLastName" TEXT NOT NULL,
    "recipientMobile" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "addressLine" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "plaque" TEXT,
    "floor" TEXT,
    "unit" TEXT,
    "deliveryNotes" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" SERIAL NOT NULL,
    "customerUserId" TEXT NOT NULL,
    "sourceCartId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "paymentStatus" "OrderPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paymentMethodCode" TEXT NOT NULL DEFAULT 'ONLINE',
    "currencyCode" TEXT NOT NULL DEFAULT 'TOMAN',
    "shippingAddressId" TEXT,
    "shippingRecipientFirstName" TEXT NOT NULL,
    "shippingRecipientLastName" TEXT NOT NULL,
    "shippingRecipientMobile" TEXT NOT NULL,
    "shippingProvince" TEXT NOT NULL,
    "shippingCity" TEXT NOT NULL,
    "shippingDistrict" TEXT,
    "shippingAddressLine" TEXT NOT NULL,
    "shippingPostalCode" TEXT NOT NULL,
    "shippingPlaque" TEXT,
    "shippingFloor" TEXT,
    "shippingUnit" TEXT,
    "shippingNotes" TEXT,
    "itemsBaseTotalToman" INTEGER NOT NULL,
    "itemsDiscountToman" INTEGER NOT NULL,
    "orderDiscountToman" INTEGER NOT NULL DEFAULT 0,
    "shippingToman" INTEGER NOT NULL DEFAULT 0,
    "payableToman" INTEGER NOT NULL,
    "customerNote" TEXT,
    "adminNote" TEXT,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "vehicleVariantId" TEXT,
    "productSku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "productImageUrl" TEXT,
    "vehicleSnapshot" JSONB,
    "fitmentStatus" "OrderItemFitmentStatus" NOT NULL DEFAULT 'NOT_SELECTED',
    "fitmentNotes" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitBasePriceToman" INTEGER NOT NULL,
    "unitEffectivePriceToman" INTEGER NOT NULL,
    "lineBaseTotalToman" INTEGER NOT NULL,
    "lineDiscountToman" INTEGER NOT NULL,
    "linePayableToman" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "providerCode" TEXT NOT NULL,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'CREATED',
    "amountToman" INTEGER NOT NULL,
    "providerSessionId" TEXT,
    "providerTransactionId" TEXT,
    "providerReference" TEXT,
    "maskedCardNumber" TEXT,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "requestMetadata" JSONB,
    "responseMetadata" JSONB,
    "callbackMetadata" JSONB,
    "redirectedAt" TIMESTAMP(3),
    "callbackReceivedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerAddress_userId_isActive_idx" ON "CustomerAddress"("userId", "isActive");

-- CreateIndex
CREATE INDEX "CustomerAddress_userId_createdAt_idx" ON "CustomerAddress"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_sourceCartId_key" ON "Order"("sourceCartId");

-- CreateIndex
CREATE INDEX "Order_customerUserId_createdAt_idx" ON "Order"("customerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_createdAt_idx" ON "Order"("paymentStatus", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_vehicleVariantId_idx" ON "OrderItem"("vehicleVariantId");

-- CreateIndex
CREATE INDEX "PaymentAttempt_orderId_status_idx" ON "PaymentAttempt"("orderId", "status");

-- CreateIndex
CREATE INDEX "PaymentAttempt_status_createdAt_idx" ON "PaymentAttempt"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentAttempt_providerTransactionId_idx" ON "PaymentAttempt"("providerTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_orderId_attemptNumber_key" ON "PaymentAttempt"("orderId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_providerCode_providerSessionId_key" ON "PaymentAttempt"("providerCode", "providerSessionId");

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_sourceCartId_fkey" FOREIGN KEY ("sourceCartId") REFERENCES "Cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "CustomerAddress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_vehicleVariantId_fkey" FOREIGN KEY ("vehicleVariantId") REFERENCES "VehicleVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "CustomerAddress_one_default_per_user"
ON "CustomerAddress" ("userId")
WHERE "isDefault" = true;

ALTER TABLE "Order"
ADD CONSTRAINT "Order_totals_check"
CHECK (
  "itemsBaseTotalToman" >= 0
  AND "itemsDiscountToman" >= 0
  AND "orderDiscountToman" >= 0
  AND "shippingToman" >= 0
  AND "payableToman" >= 0
  AND "itemsDiscountToman" <= "itemsBaseTotalToman"
  AND "orderDiscountToman" <= (
    "itemsBaseTotalToman" - "itemsDiscountToman" + "shippingToman"
  )
  AND "payableToman" = (
    "itemsBaseTotalToman"
    - "itemsDiscountToman"
    - "orderDiscountToman"
    + "shippingToman"
  )
);

ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_quantity_range_check"
CHECK ("quantity" >= 1 AND "quantity" <= 99);

ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_price_check"
CHECK (
  "unitBasePriceToman" > 0
  AND "unitEffectivePriceToman" > 0
  AND "unitEffectivePriceToman" <= "unitBasePriceToman"
  AND "lineBaseTotalToman" = "unitBasePriceToman" * "quantity"
  AND "lineDiscountToman" = (
    ("unitBasePriceToman" - "unitEffectivePriceToman") * "quantity"
  )
  AND "linePayableToman" = "unitEffectivePriceToman" * "quantity"
);

ALTER TABLE "PaymentAttempt"
ADD CONSTRAINT "PaymentAttempt_amount_check"
CHECK ("amountToman" > 0);
