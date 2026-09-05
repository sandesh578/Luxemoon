'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { Grid, Star } from 'lucide-react';
import { SortDropdown } from './SortDropdown';
import { useI18n } from '@/components/Providers';
import { formatCurrency } from '@/lib/currency';
import type { StorefrontProduct } from '@/lib/storefront-products';

interface Category {
  id: string;
  slug: string;
  name: string;
}

interface ShopClientProps {
  allProducts: StorefrontProduct[];
  categories: Category[];
  currencyCode: 'USD' | 'NPR';
}

export function ShopClient({ allProducts, categories, currencyCode }: ShopClientProps) {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const sort = searchParams.get('sort') || '';
  const filter = searchParams.get('filter') || '';

  const formatPrice = (amount: number) => formatCurrency(amount, currencyCode);

  // ─── Client-side filter + sort (replaces server-side DB re-query) ──────────
  const products = useMemo(() => {
    let list = [...allProducts];

    // Apply filter
    if (filter === 'featured') {
      list = list.filter((p) => p.isFeatured);
    } else if (filter === 'new') {
      list = list.filter((p) => p.isNew);
    } else if (filter === 'bestsellers') {
      list = list.sort(
        (a, b) => (b.totalOrdersCount ?? 0) - (a.totalOrdersCount ?? 0)
      );
      return list; // early return — sort already applied
    }

    // Apply sort
    if (sort === 'price_asc') {
      list = list.sort((a, b) => a.priceInside - b.priceInside);
    } else if (sort === 'price_desc') {
      list = list.sort((a, b) => b.priceInside - a.priceInside);
    } else if (sort === 'newest') {
      list = list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sort === 'bestselling') {
      list = list.sort(
        (a, b) => (b.totalOrdersCount ?? 0) - (a.totalOrdersCount ?? 0)
      );
    } else {
      // Default: featured first, then newest
      list = list.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return list;
  }, [allProducts, sort, filter]);

  // ─── Dynamic title based on active filter ─────────────────────────────────
  let pageTitle = t('shopPage.title');
  let pageSubtitle = t('shopPage.subtitle');
  if (filter === 'featured') {
    pageTitle = t('shopPage.featuredTitle');
    pageSubtitle = t('shopPage.featuredSubtitle');
  } else if (filter === 'new') {
    pageTitle = t('shopPage.newTitle');
    pageSubtitle = t('shopPage.newSubtitle');
  } else if (filter === 'bestsellers') {
    pageTitle = t('shopPage.bestTitle');
    pageSubtitle = t('shopPage.bestSubtitle');
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Shop Header */}
      <section className="bg-stone-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-4">
          <h1 className="font-serif text-4xl md:text-5xl font-bold">{pageTitle}</h1>
          <p className="text-stone-400 max-w-lg">{pageSubtitle}</p>
        </div>
      </section>

      {/* Category Quick Links */}
      <div className="bg-white border-b border-stone-100 sticky top-16 z-10 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 flex gap-8 py-4">
          <Link
            href="/shop"
            className="text-sm font-bold text-amber-600 whitespace-nowrap border-b-2 border-amber-600 pb-1"
          >
            {t('shopPage.allProducts')}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="text-sm font-bold text-stone-400 hover:text-stone-900 transition-colors whitespace-nowrap"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
          <div className="flex items-center gap-2 text-stone-400">
            <Grid className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">
              {t('shopPage.showingItems', { count: products.length })}
            </span>
          </div>
          <SortDropdown />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {products.map((product, index) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group cursor-pointer block"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-stone-100 mb-4 shadow-sm group-hover:shadow-2xl transition-all duration-500">
                {product.images[0] && (
                  <Image
                    src={product.images[0]}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    alt={product.name}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    priority={index < 4}
                    loading={index < 4 ? 'eager' : 'lazy'}
                  />
                )}

                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.isFeatured && (
                    <span className="text-[10px] font-bold bg-amber-500/90 text-white px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm shadow-lg">
                      <Star className="w-2 h-2 fill-current" />{' '}
                      {t('shopPage.bestseller').toUpperCase()}
                    </span>
                  )}
                  {product.originalPrice && product.originalPrice > product.priceInside && (
                    <span className="text-[10px] font-bold bg-red-600 text-white px-3 py-1 rounded-full shadow-lg">
                      {t('shopPage.offer').toUpperCase()}
                    </span>
                  )}
                </div>

                {product.stock <= 0 && (
                  <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="bg-stone-900 border border-stone-800 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full">
                      {t('shopPage.soldOut')}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5 px-2">
                <h3 className="font-serif text-lg text-stone-900 group-hover:text-amber-700 transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-stone-900">{formatPrice(product.priceInside)}</span>
                  {product.originalPrice && product.originalPrice > product.priceInside && (
                    <span className="text-xs text-stone-400 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
