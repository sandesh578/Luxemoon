import React from "react";
import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ClientOverlays } from "@/components/ClientOverlays";
import { getHomepageNotice, getSiteConfig } from "@/lib/settings-server";
import { validateServerEnv } from "@/lib/env";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { normalizeCurrencyCode } from "@/lib/currency";

const SAFE_SITE_CONFIG = {
  storeName: "Luxe Moon",
  metaTitle: "LuxeMoon | Official Korean Beauty & Haircare",
  metaDescription:
    "LuxeMoon Nano Botox 4-in-1 cosmetics system: Anti-Hair Fall Shampoo, Shining Silk Hair Mask, and Soft & Silky Hair Serum.",
  faviconUrl: null,
  logoUrl: null,
  bannerText: "Rooted in Korea. Created for the World.",
  languageToggleEnabled: false,
  showStockOnProduct: true,
  currencyCode: "USD" as const,
  nprConversionRate: 133.5,
  deliveryChargeInside: 0,
  deliveryChargeOutside: 150,
  freeDeliveryThreshold: 5000,
  codFee: 0,
  expressDeliveryEnabled: false,
  estimatedDeliveryInside: "1-2 days",
  estimatedDeliveryOutside: "3-5 days",
  globalDiscountPercent: 0,
  globalDiscountStart: null,
  globalDiscountEnd: null,
  allowStacking: false,
  contactPhone: "+977 9800000000",
  contactEmail: "hello@luxemoonbeauty.com",
  contactAddress: "Durbarmarg, Kathmandu",
  whatsappNumber: null,
  facebookUrl: null,
  instagramUrl: null,
  tiktokUrl: null,
  footerContent: "<p>3-step haircare system built for stronger roots, deep nourishment, and smooth frizz-controlled shine.</p>",
  privacyPolicy: "<h2>Privacy Policy</h2><p>We respect your privacy. Your data is never sold.</p>",
  termsConditions: "<h2>Terms & Conditions</h2><p>By using this site, you agree to our terms.</p>",
  aboutContent: "<h2>Our Story</h2><p>Luxe Moon is premium Korean haircare created for the world.</p>",
  emailNotificationsEnabled: false,
  smsNotificationsEnabled: false,
  noticeBarEnabled: false,
  noticeBarText: null,
  noticeBarStill: false,
};

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif"
});

const lato = Lato({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-sans"
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    validateServerEnv();
  } catch (e) {
    console.warn("Environment validation skipped or failed during build:", e instanceof Error ? e.message : e);
  }
  const config = await getSiteConfig().catch(() => SAFE_SITE_CONFIG);
  const configuredBaseUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || '';
  const normalizedBaseUrl = configuredBaseUrl
    ? (/^https?:\/\//i.test(configuredBaseUrl) ? configuredBaseUrl : `https://${configuredBaseUrl}`)
    : 'https://www.luxemoonbeauty.com';
  const metadataBase = (() => {
    try {
      return new URL(normalizedBaseUrl);
    } catch {
      return new URL('https://www.luxemoonbeauty.com');
    }
  })();
  const metadataBaseHref = metadataBase.toString().replace(/\/$/, '');

  return {
    title: {
      default: config.metaTitle || SAFE_SITE_CONFIG.metaTitle,
      template: `%s | ${config.storeName || SAFE_SITE_CONFIG.storeName}`,
    },
    description:
      config.metaDescription || SAFE_SITE_CONFIG.metaDescription,
    metadataBase,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: config.metaTitle || SAFE_SITE_CONFIG.metaTitle,
      description: config.metaDescription || undefined,
      url: metadataBaseHref,
      siteName: config.storeName || SAFE_SITE_CONFIG.storeName,
      locale: 'en_US',
      type: 'website',
    },
    icons: {
      icon: config.faviconUrl || "/favicon.ico",
      shortcut: config.faviconUrl || "/favicon.ico",
      apple: config.faviconUrl || "/favicon.ico",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  try {
    validateServerEnv();
  } catch (e) {
    // During build, we might not have all env vars. We log but continue 
    // because getSiteConfig has fallbacks.
    console.warn("Environment validation skipped or failed in RootLayout:", e instanceof Error ? e.message : e);
  }
  const [rawConfig, noticeBar] = await Promise.all([
    Promise.race([
      getSiteConfig().catch(() => SAFE_SITE_CONFIG as any),
      new Promise<typeof SAFE_SITE_CONFIG>((resolve) =>
        setTimeout(() => resolve(SAFE_SITE_CONFIG as any), 800)
      )
    ]),
    Promise.race([
      getHomepageNotice().catch(() => ({
        noticeBarText: null,
        noticeBarEnabled: false,
        noticeBarStill: false,
      })),
      new Promise<{
        noticeBarText: string | null;
        noticeBarEnabled: boolean;
        noticeBarStill: boolean;
      }>((resolve) =>
        setTimeout(
          () =>
            resolve({
              noticeBarText: null,
              noticeBarEnabled: false,
              noticeBarStill: false,
            }),
          800
        )
      )
    ]),
  ]);

  const config = {
    ...rawConfig,
    globalDiscountStart: rawConfig.globalDiscountStart?.toISOString() ?? null,
    globalDiscountEnd: rawConfig.globalDiscountEnd?.toISOString() ?? null,
    noticeBarText: noticeBar.noticeBarText,
    noticeBarEnabled: noticeBar.noticeBarEnabled,
    noticeBarStill: noticeBar.noticeBarStill,
    currencyCode: normalizeCurrencyCode(rawConfig.currencyCode),
  };

  return (
    <html lang={DEFAULT_LOCALE} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
        <link rel="preconnect" href="https://nominatim.openstreetmap.org" crossOrigin="" />
      </head>
      <body className={`${playfair.variable} ${lato.variable} font-sans bg-[#F6EFE7] text-[#5C3A21]`} suppressHydrationWarning>
        <Providers config={config} initialLocale={DEFAULT_LOCALE}>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
          <ClientOverlays />
        </Providers>
      </body>
    </html>
  );
}
