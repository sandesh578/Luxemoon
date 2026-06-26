import { calculateDiscountedPrice } from '@/lib/settings';

export const storefrontProductSelect = {
  id: true,
  slug: true,
  name: true,
  images: true,
  priceInside: true,
  originalPrice: true,
  stock: true,
  isFeatured: true,
  isNew: true,
  isBestSeller: true,
  discountPercent: true,
  discountFixed: true,
  discountStart: true,
  discountEnd: true,
  totalOrdersCount: true,
  createdAt: true,
} as const;

export type StorefrontProductRecord = {
  id: string;
  slug: string;
  name: string;
  images: string[];
  priceInside: { toNumber(): number } | number | string;
  originalPrice: { toNumber(): number } | number | string | null;
  stock: number;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  discountPercent: number;
  discountFixed: number | null;
  discountStart: Date | null;
  discountEnd: Date | null;
  totalOrdersCount: number | null;
  createdAt: Date;
};

export type DiscountConfig = {
  globalDiscountPercent: number;
  globalDiscountStart?: Date | string | null;
  globalDiscountEnd?: Date | string | null;
  allowStacking?: boolean;
};

export type StorefrontProduct = Omit<
  StorefrontProductRecord,
  'priceInside' | 'originalPrice' | 'discountStart' | 'discountEnd'
> & {
  priceInside: number;
  originalPrice: number | null;
  discountStart: string | null;
  discountEnd: string | null;
};

export const visibleStorefrontProductWhere = {
  isActive: true,
  isArchived: false,
  isDraft: false,
} as const;

export function serializeStorefrontProduct(
  product: StorefrontProductRecord,
  config: DiscountConfig
): StorefrontProduct {
  const basePrice = Number(product.priceInside);
  const originalPrice = product.originalPrice ? Number(product.originalPrice) : null;

  return {
    ...product,
    priceInside: calculateDiscountedPrice(basePrice, product, config),
    originalPrice,
    discountStart: product.discountStart?.toISOString() ?? null,
    discountEnd: product.discountEnd?.toISOString() ?? null,
  };
}
