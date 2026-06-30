INSERT INTO "AdminAuditLog" (
  "id",
  "actorUserId",
  "entityType",
  "entityId",
  "entityLabel",
  "action",
  "changes",
  "createdAt"
)
SELECT
  product_audit."id",
  product_audit."actorUserId",
  'PRODUCT'::"AdminAuditEntityType",
  product_audit."productId",
  COALESCE(product."name", product_audit."productId"),
  product_audit."action"::text::"AdminAuditAction",
  product_audit."changes",
  product_audit."createdAt"
FROM "ProductAuditLog" AS product_audit
LEFT JOIN "Product" AS product
  ON product."id" = product_audit."productId"
ON CONFLICT ("id") DO NOTHING;