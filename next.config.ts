import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  output: "standalone",
  // Prevent Prisma from being bundled into the Lambda JS chunk.
  // Prisma uses native binaries that must stay as external node_modules.
  // Bundling them inflates the cold-start bundle and can cause runtime errors.
  serverExternalPackages: ['@prisma/client', '.prisma/client'],
  outputFileTracingIncludes: {
    '/*': ['./node_modules/@prisma/client/**/*', './node_modules/.prisma/client/**/*', './prisma/schema.prisma'],
    '/api/**/*': ['./node_modules/@prisma/client/**/*', './node_modules/.prisma/client/**/*', './prisma/schema.prisma'],
  },
  experimental: {
    staticGenerationMaxConcurrency: 1,
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    serverActions: {
      bodySizeLimit: '2mb',
    },
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    localPatterns: [
      { pathname: '/**' },
    ],
    qualities: [60, 75, 85],
    remotePatterns: [
      { hostname: "images.unsplash.com" },
      { hostname: "placehold.co" },
      { hostname: "res.cloudinary.com" },
    ],
  },
  headers: async () => [
    // ─── Security headers: applied to every route ─────────────────────────────
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
    // ─── CDN Cache-Control for public storefront pages ─────────────────────────
    // s-maxage=60       → CloudFront caches the rendered HTML for 60 s
    // stale-while-revalidate=300 → serves stale while origin re-renders (ISR)
    // This is the key fix for the 10–20 s load time: once CloudFront has a copy
    // it serves it in <100 ms instead of hitting Lambda + Supabase every time.
    {
      source: '/',
      headers: [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' }],
    },
    {
      source: '/shop',
      headers: [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' }],
    },
    {
      source: '/about',
      headers: [{ key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' }],
    },
    {
      source: '/contact',
      headers: [{ key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' }],
    },
    {
      source: '/category/:slug*',
      headers: [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' }],
    },
    {
      source: '/products/:slug*',
      headers: [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' }],
    },
    {
      source: '/(delivery-policy|privacy|terms|refund-policy)',
      headers: [{ key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=7200' }],
    },
    // ─── Never cache private/dynamic routes at CDN ────────────────────────────
    {
      source: '/api/:path*',
      headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
    },
    {
      source: '/admin/:path*',
      headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
    },
    {
      source: '/account/:path*',
      headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
    },
    {
      source: '/checkout/:path*',
      headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
    },
  ],
};

export default nextConfig;
