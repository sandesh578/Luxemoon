-- Performance indexes for Product model
-- These indexes improve query performance for:
--   1. isBestSeller filter/sort operations
--   2. Default shop sort: isFeatured DESC, createdAt DESC (compound)

CREATE INDEX IF NOT EXISTS "Product_isBestSeller_idx" ON "Product"("isBestSeller");
CREATE INDEX IF NOT EXISTS "Product_isActive_isArchived_isDraft_isFeatured_createdAt_idx" ON "Product"("isActive", "isArchived", "isDraft", "isFeatured", "createdAt" DESC);
