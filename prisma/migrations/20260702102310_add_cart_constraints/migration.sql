CREATE UNIQUE INDEX "Cart_active_customer_user_unique"
ON "Cart" ("userId")
WHERE
  "ownerType" = 'CUSTOMER'
  AND "status" = 'ACTIVE'
  AND "userId" IS NOT NULL;

CREATE UNIQUE INDEX "Cart_active_guest_token_unique"
ON "Cart" ("guestTokenHash")
WHERE
  "ownerType" = 'GUEST'
  AND "status" = 'ACTIVE'
  AND "guestTokenHash" IS NOT NULL;

ALTER TABLE "Cart"
ADD CONSTRAINT "Cart_owner_integrity_check"
CHECK (
  (
    "ownerType" = 'GUEST'
    AND "userId" IS NULL
    AND "guestTokenHash" IS NOT NULL
    AND "expiresAt" IS NOT NULL
  )
  OR
  (
    "ownerType" = 'CUSTOMER'
    AND "userId" IS NOT NULL
    AND "guestTokenHash" IS NULL
    AND "expiresAt" IS NULL
  )
);

ALTER TABLE "CartItem"
ADD CONSTRAINT "CartItem_quantity_range_check"
CHECK (
  "quantity" >= 1
  AND "quantity" <= 99
);

ALTER TABLE "CartItem"
ADD CONSTRAINT "CartItem_fitment_key_check"
CHECK (
  (
    "vehicleVariantId" IS NULL
    AND "fitmentKey" = ''
  )
  OR
  (
    "vehicleVariantId" IS NOT NULL
    AND "fitmentKey" = "vehicleVariantId"
  )
);

ALTER TABLE "CartItem"
ADD CONSTRAINT "CartItem_price_snapshot_check"
CHECK (
  "unitBasePriceToman" > 0
  AND "unitEffectivePriceToman" > 0
  AND "unitEffectivePriceToman" <= "unitBasePriceToman"
);
