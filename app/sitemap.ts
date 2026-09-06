import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

// Revalidate every hour — sitemap doesn't need real-time accuracy.
// Previously had force-dynamic which caused 14-second crawl times on every Google bot hit.
export const revalidate = 3600;

const getCachedSitemapData = unstable_cache(
  async () => {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true, isArchived: false, isDraft: false },
        select: { slug: true, updatedAt: true }
      }),
      prisma.category.findMany({
        where: { isActive: true, isArchived: false },
        select: { slug: true, updatedAt: true }
      }),
    ]);
    return { products, categories };
  },
  ['sitemap-data'],
  { tags: ['products', 'categories'], revalidate: 3600 }
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.luxemoonbeauty.com';

  const { products, categories } = await getCachedSitemapData();

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/delivery-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  return [...staticPages, ...categoryEntries, ...productEntries];
}