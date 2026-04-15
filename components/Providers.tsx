'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { DEFAULT_LOCALE, type Locale, LOCALE_COOKIE_NAME, isLocale, translate } from '@/lib/i18n';
import { calculateDiscountedPrice } from '@/lib/settings';

// Types
export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceInside: number;
  priceOutside: number;
  originalPrice?: number | null;
  category: string;
  images: string[];
  features: string[];
  stock: number;
  videoUrl?: string | null;
  sku?: string | null;
  discountPercent?: number;
  discountFixed?: number | null;
  discountStart?: string | null;
  discountEnd?: string | null;
  isFeatured?: boolean;
  isNew?: boolean;
  tags?: string[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface SiteConfig {
  storeName: string;
  bannerText: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  languageToggleEnabled: boolean;
  showStockOnProduct: boolean;
  currencyCode: 'USD' | 'NPR';
  nprConversionRate: number;
  deliveryChargeInside: number;
  deliveryChargeOutside: number;
  freeDeliveryThreshold: number;
  codFee: number;
  expressDeliveryEnabled: boolean;
  estimatedDeliveryInside: string;
  estimatedDeliveryOutside: string;
  globalDiscountPercent: number;
  globalDiscountStart?: string | null;
  globalDiscountEnd?: string | null;
  allowStacking: boolean;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  whatsappNumber?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  footerContent?: string | null;
  privacyPolicy?: string | null;
  termsConditions?: string | null;
  aboutContent?: string | null;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  noticeBarEnabled?: boolean;
  noticeBarText?: string | null;
  noticeBarStill?: boolean;
}

interface LocationContextType {
  isInsideValley: boolean;
  toggleLocation: () => void;
  setInsideValley: (isInside: boolean) => void;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  deliveryCharge: number;
  finalTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

interface ConfigContextType {
  config: SiteConfig;
}

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LocationContext = createContext<LocationContextType | null>(null);
const CartContext = createContext<CartContextType | null>(null);
const ConfigContext = createContext<ConfigContextType | null>(null);
const I18nContext = createContext<I18nContextType | null>(null);

export const Providers = ({
  children,
  config,
  initialLocale,
}: {
  children?: React.ReactNode,
  config: SiteConfig,
  initialLocale: Locale,
}) => {
  const [isInsideValley, setInsideValleyState] = useState(true);
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const saved = localStorage.getItem('lm_cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setItems(parsed.map(item => ({
            ...item,
            priceInside: Number(item.priceInside) || 0,
            priceOutside: Number(item.priceOutside) || 0,
            originalPrice: item.originalPrice ? (Number(item.originalPrice) || null) : null,
          })));
        }
      } catch {
        localStorage.removeItem('lm_cart');
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    const cookieLocale = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith(`${LOCALE_COOKIE_NAME}=`))
      ?.split('=')[1];

    if (isLocale(cookieLocale) && cookieLocale !== locale) {
      setLocaleState(cookieLocale);
      document.documentElement.lang = cookieLocale;
      return;
    }

    document.documentElement.lang = initialLocale || DEFAULT_LOCALE;
  }, [initialLocale, locale]);

  useEffect(() => {
    if (hydrated) localStorage.setItem('lm_cart', JSON.stringify(items));
  }, [items, hydrated]);

  const toggleLocation = useCallback(() => setInsideValleyState(prev => !prev), []);
  const setInsideValley = useCallback((val: boolean) => setInsideValleyState(val), []);
  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = nextLocale;
  }, []);

  const addToCart = useCallback((product: Product, quantity: number) => {
    const sanitizedProduct = {
      ...product,
      priceInside: Number(product.priceInside) || 0,
      priceOutside: Number(product.priceOutside) || 0,
      originalPrice: product.originalPrice ? (Number(product.originalPrice) || null) : null,
    };

    setItems(prev => {
      const existing = prev.find(item => item.id === sanitizedProduct.id);
      if (existing) {
        return prev.map(item => item.id === sanitizedProduct.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...sanitizedProduct, quantity }];
    });
    setIsCartOpen(true);
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, qty: number) => {
    if (qty < 1) return;
    setItems(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const cartTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = isInsideValley ? item.priceInside : item.priceOutside;
      const basePrice = Number(price) || 0;
      const unitPrice = calculateDiscountedPrice(basePrice, item, config);
      return sum + (unitPrice * item.quantity);
    }, 0);
  }, [items, isInsideValley, config]);

  const deliveryCharge = useMemo(() => (
    cartTotal >= config.freeDeliveryThreshold
      ? 0
      : (isInsideValley ? config.deliveryChargeInside : config.deliveryChargeOutside)
  ), [cartTotal, config.freeDeliveryThreshold, config.deliveryChargeInside, config.deliveryChargeOutside, isInsideValley]);

  const finalTotal = useMemo(() => cartTotal + deliveryCharge, [cartTotal, deliveryCharge]);
  const t = useCallback((key: string, vars?: Record<string, string | number>) => translate(locale, key, vars), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const configValue = useMemo(() => ({ config }), [config]);
  const i18nValue = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  const locationValue = useMemo(
    () => ({ isInsideValley, toggleLocation, setInsideValley }),
    [isInsideValley, toggleLocation, setInsideValley]
  );
  const cartValue = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      deliveryCharge,
      finalTotal,
      isCartOpen,
      setIsCartOpen,
    }),
    [
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      deliveryCharge,
      finalTotal,
      isCartOpen,
      setIsCartOpen,
    ]
  );

  return (
    <ConfigContext.Provider value={configValue}>
      <I18nContext.Provider value={i18nValue}>
        <LocationContext.Provider value={locationValue}>
          <CartContext.Provider value={cartValue}>
            {children}
          </CartContext.Provider>
        </LocationContext.Provider>
      </I18nContext.Provider>
    </ConfigContext.Provider>
  );
};

export const useLocationContext = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocationContext missing");
  return ctx;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart missing");
  return ctx;
};

export const useConfig = () => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig missing");
  return ctx.config;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n missing");
  return ctx;
};
