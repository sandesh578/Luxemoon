# 🚀 AUDIT QUICK REFERENCE - ACTION ITEMS

## 🔴 CRITICAL FIXES (This Week)

### 1. Database Indexes

**File:** `prisma/schema.prisma`  
**Time:** 2 hours  
**Effort:** Add 4 composite indexes

```prisma
model Product {
  @@index([isActive, isArchived, isDraft, createdAt])
  @@index([categoryId, isActive, createdAt])
  @@index([isActive, isArchived, isDraft])
  @@index([isFeatured, isBestSeller, isNew])
}

model Order {
  @@index([status, createdAt])
  @@index([userId, createdAt])
}
```

**Migration:** `npx prisma migrate dev --name add_missing_indexes`

---

### 2. Homepage Query Consolidation

**File:** `app/page.tsx`  
**Time:** 4 hours  
**Current Cost:** 5-6 DB queries + JSON parsing  
**Fix:** Combine into 2 queries with in-memory filtering

```typescript
// ❌ BEFORE: 6 queries
const [content, featured, newArrivals, bestSellers, nanoplastia] = await Promise.all([...])

// ✅ AFTER: 2 queries
const [content, allProducts] = await Promise.all([
  prisma.homepageContent.findUnique(...),
  prisma.product.findMany({
    where: { isActive: true, isArchived: false, isDraft: false }
  })
])

// Partition in-memory
const featured = allProducts.filter(p => p.isFeatured);
const newArrivals = allProducts.filter(p => p.isNew);
```

---

### 3. Bestseller Denormalization

**File:** `prisma/schema.prisma` + Migration  
**Time:** 6 hours  
**Impact:** 100x speedup on bestseller sort

```prisma
model Product {
  totalOrdersCount  Int  @default(0)
  @@index([totalOrdersCount])
}
```

**Migration Steps:**

```sql
-- 1. Add column
ALTER TABLE "Product" ADD COLUMN "totalOrdersCount" INT DEFAULT 0;

-- 2. Populate existing data
UPDATE "Product" p
SET "totalOrdersCount" = (
  SELECT COUNT(*) FROM "OrderItem" oi WHERE oi."productId" = p.id
);

-- 3. Update on order creation
// In app/api/orders/route.ts
await tx.product.updateMany({
  where: { id: { in: productIds } },
  data: { totalOrdersCount: { increment: quantity } }
});
```

---

### 4. Type Safety - Remove `any`

**Files:**

- `app/page.tsx` (lines 78-90)
- `app/shop/page.tsx` (lines 43-50)
- `components/Navbar.tsx` (line 29)

**Time:** 8 hours  
**Strategy:** Create typed interfaces

```typescript
// Create lib/types/index.ts
export interface Product {
  id: string;
  slug: string;
  name: string;
  priceInside: Decimal;
  images: string[];
  // ... all fields typed
}

export interface SanitizedProduct extends Omit<Product, 'priceInside'> {
  priceInside: number; // After conversion
}

// Replace all `any` with specific types
const sanitizeProducts = (products: Product[]): SanitizedProduct[] => {
  // Now properly typed
};
```

---

### 5. Error Handling & Logging

**Files:** Multiple API routes  
**Time:** 4 hours

```typescript
// ❌ BAD
catch (e) {
  console.error("error", e);
}

// ✅ GOOD
catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  logger.error('order.creation.failed', {
    message,
    stack: error instanceof Error ? error.stack : undefined,
    orderId: order?.id,
    email: data.email
  });

  // Alert ops if critical
  if (error.message.includes('database')) {
    await notifyOps('Database error in order creation');
  }

  return NextResponse.json(
    { error: 'Failed to create order. Please try again.' },
    { status: 500 }
  );
}
```

---

## 🟠 HIGH PRIORITY (Next 2 Weeks)

### 6. Fix Navbar Session Fetching

**File:** `components/Navbar.tsx`  
**Time:** 2 hours

```typescript
// ❌ BEFORE: Fetches on every route change
useEffect(() => {
  fetchSession();
}, [fetchSession, pathname]); // Runs every navigation!

// ✅ AFTER: Fetch only once + cache
useEffect(() => {
  // Load from localStorage first
  const cached = sessionStorage.getItem('session-cache');
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < 5 * 60000) {
      // 5 min cache
      setSession(data);
      return;
    }
  }

  // Fetch fresh
  fetchSession();
}, []); // Empty dependency - once on mount

// Cache result
const fetchSession = useCallback(async () => {
  const response = await fetch('/api/auth/session');
  const data = await response.json();
  setSession(data);
  sessionStorage.setItem(
    'session-cache',
    JSON.stringify({
      data,
      timestamp: Date.now()
    })
  );
}, []);
```

---

### 7. Implement Pagination

**File:** `app/shop/page.tsx` + `app/page.tsx`  
**Time:** 6 hours

```typescript
const PAGE_SIZE = 20;
const page = parseInt(searchParams.page) || 1;
const skip = (page - 1) * PAGE_SIZE;

const [products, total] = await Promise.all([
  prisma.product.findMany({
    where: { isActive: true, isArchived: false, isDraft: false },
    skip,
    take: PAGE_SIZE,
    orderBy: { createdAt: 'desc' }
  }),
  prisma.product.count({
    where: { isActive: true, isArchived: false, isDraft: false }
  })
]);

const totalPages = Math.ceil(total / PAGE_SIZE);

return {
  products,
  pagination: { page, totalPages, total, pageSize: PAGE_SIZE }
};
```

---

### 8. Add Rate Limiting

**File:** Create `lib/rate-limit.ts`  
**Time:** 4 hours

```typescript
import { LRUCache } from 'lru-cache';

const ipCache = new LRUCache<string, number[]>({
  max: 10000,
  ttl: 1000 * 60 * 15 // 15 min
});

export function rateLimit(
  ip: string,
  limit: number = 5,
  window: number = 60000
) {
  const timestamps = ipCache.get(ip) || [];
  const now = Date.now();
  const recent = timestamps.filter((t) => now - t < window);

  if (recent.length >= limit) {
    return { success: false, retryAfter: window };
  }

  recent.push(now);
  ipCache.set(ip, recent);
  return { success: true };
}

// Usage in API:
export async function POST(req: Request) {
  const ip = getClientIP(req);
  const { success, retryAfter } = rateLimit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter / 1000) } }
    );
  }
  // ...
}
```

---

### 9. CSRF Protection

**File:** Create `lib/csrf.ts`  
**Time:** 2 hours

```typescript
import crypto from 'crypto';

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function verifyCSRFToken(token: string, stored: string): boolean {
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(stored));
}

// Middleware
export function withCSRFProtection(handler: NextApiHandler) {
  return async (req: Request) => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      const token = req.headers.get('x-csrf-token');
      const stored = (await cookies()).get('csrf-token')?.value;

      if (!token || !stored || !verifyCSRFToken(token, stored)) {
        return NextResponse.json(
          { error: 'CSRF validation failed' },
          { status: 403 }
        );
      }
    }
    return handler(req);
  };
}
```

---

### 10. Split Providers Context

**File:** Create `components/providers/` directory  
**Time:** 5 hours

```
components/providers/
  ├── CartProvider.tsx
  ├── LocationProvider.tsx
  ├── ConfigProvider.tsx
  ├── I18nProvider.tsx
  └── RootProviders.tsx

// RootProviders.tsx
export function RootProviders({ children }) {
  return (
    <CartProvider>
      <LocationProvider>
        <ConfigProvider>
          <I18nProvider>
            {children}
          </I18nProvider>
        </ConfigProvider>
      </LocationProvider>
    </CartProvider>
  );
}
```

---

## 📊 EFFORT ESTIMATION

| Task                       | Hours  | Difficulty | Impact      |
| -------------------------- | ------ | ---------- | ----------- |
| Database indexes           | 2      | Easy       | 🔴 Critical |
| Homepage query fix         | 4      | Medium     | 🔴 Critical |
| Bestseller denormalization | 6      | Medium     | 🔴 Critical |
| Type safety                | 8      | Medium     | 🔴 Critical |
| Error handling             | 4      | Easy       | 🔴 Critical |
| Session fetching           | 2      | Easy       | 🟠 High     |
| Pagination                 | 6      | Medium     | 🟠 High     |
| Rate limiting              | 4      | Medium     | 🟠 High     |
| CSRF protection            | 2      | Easy       | 🟠 High     |
| Split providers            | 5      | Medium     | 🟠 High     |
| **TOTAL**                  | **43** |            |             |

**Recommended Timeline:**

- Week 1: 20 hours (critical fixes + type safety)
- Week 2: 15 hours (performance + security)
- Week 3: 8 hours (refactoring + polish)

---

## ✅ VERIFICATION CHECKLIST

After implementing fixes, verify:

### Performance

- [ ] Homepage Largest Contentful Paint < 1.5s (goal: 800ms)
- [ ] Shop page sort switch < 600ms (goal: 400ms)
- [ ] API response times < 300ms (goal: 200ms)
- [ ] No layout shift when loading dynamic components

### Code Quality

- [ ] TypeScript strict mode passes
- [ ] No console.error or console.warn in production
- [ ] All errors logged with context
- [ ] Test coverage > 50% for APIs

### Security

- [ ] CSRF tokens validated on all POST/PUT/DELETE
- [ ] Rate limiting active
- [ ] No console logs with sensitive data
- [ ] All user inputs validated with Zod

### Database

- [ ] All product queries use indexes
- [ ] No N+1 queries in critical paths
- [ ] Pagination implemented for all product listings
- [ ] Connection pooling configured

---

## 🔗 RESOURCES

### TypeScript Migration

```bash
npm install --save-dev typescript @types/node @types/react
npm run typecheck --noEmit
```

### Performance Testing

```bash
npm install --save-dev @next/bundle-analyzer
npx next build --analyze  # See bundle size
```

### Database Tools

```bash
npx prisma studio  # UI for database inspection
npx prisma migrate status
npx prisma db seed  # Reseed with test data
```

---

## 📝 DEPLOYMENT CHECKLIST

Before deploying fixes:

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Database migrations tested locally
- [ ] Performance benchmarks met
- [ ] Error tracking configured
- [ ] Monitoring alerts set up

---

**Document Version:** 1.0  
**Last Updated:** June 14, 2026
