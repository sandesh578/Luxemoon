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
    optimizePackageImports: ['lucide-react'],
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
  ],
};

export default nextConfig;
