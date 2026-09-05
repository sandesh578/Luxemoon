import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { Suspense } from 'react';
import { getSiteConfig } from '@/lib/settings-server';
import {
  serializeStorefrontProduct,
  storefrontProductSelect,
  type StorefrontProductRecord,
  visibleStorefrontProductWhere,
} from '@/lib/storefront-products';
import { ShopClient } from './ShopClient';

// ─── ISR: page is now STATIC ─────────────────────────────────────────────────
// Sort/filter moved entirely to ShopClient (client-side, instant, no DB call).
// ShopClient uses useSearchParams() which requires a <Suspense> boundary here —
// without Suspense, Next.js 15 would opt the entire page into ƒ Dynamic mode.
export const revalidate = 60;

// ─── Skeleton shown while ShopClient JS hydrates ─────────────────────────────
function ShopSkeleton() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] animate-pulse">
      <div className="bg-stone-900 py-16 px-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
          <div className="h-10 w-64 bg-stone-700 rounded-lg" />
          <div className="h-4 w-80 bg-stone-800 rounded" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[3/4] rounded-3xl bg-stone-100" />
              <div className="h-4 bg-stone-100 rounded w-3/4 mx-2" />
              <div className="h-4 bg-stone-100 rounded w-1/3 mx-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const getCachedShopData = unstable_cache(
  async () => {
    const [config, productsRaw, categories] = await Promise.all([
      getSiteConfig(),
      prisma.product.findMany({
        where: visibleStorefrontProductWhere,
        select: storefrontProductSelect as any,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      }) as unknown as Promise<StorefrontProductRecord[]>,
      prisma.category.findMany({
        select: { id: true, slug: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    const products = productsRaw.map((product) =>
      serializeStorefrontProduct(product, config)
    );

    return {
      products,
      categories,
      currencyCode: config.currencyCode,
    } as const;
  },
  ['shop-page-data-static'],
  { tags: ['products', 'categories', 'settings'], revalidate: 300 }
);

export default async function ShopPage() {
  const { products, categories, currencyCode: rawCurrencyCode } = await getCachedShopData();
  const currencyCode = rawCurrencyCode === 'NPR' ? 'NPR' : 'USD';

  return (
    // Suspense is REQUIRED here — useSearchParams() inside ShopClient
    // would otherwise force the whole page into ƒ Dynamic mode.
    <Suspense fallback={<ShopSkeleton />}>
      <ShopClient
        allProducts={products}
        categories={categories}
        currencyCode={currencyCode}
      />
    </Suspense>
  );
}

