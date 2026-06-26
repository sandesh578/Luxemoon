ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "totalOrdersCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "Product" AS p
SET "totalOrdersCount" = COALESCE((
  SELECT SUM(oi."quantity")
  FROM "OrderItem" AS oi
  WHERE oi."productId" = p."id"
), 0);

CREATE INDEX IF NOT EXISTS "Product_isActive_isArchived_isDraft_totalOrdersCount_createdAt_idx"
ON "Product"("isActive", "isArchived", "isDraft", "totalOrdersCount" DESC, "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Order_status_createdAt_userId_idx"
ON "Order"("status", "createdAt" DESC, "userId");

CREATE INDEX IF NOT EXISTS "Review_productId_createdAt_idx"
ON "Review"("productId", "createdAt" DESC);
