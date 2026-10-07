import type { MetadataRoute } from 'next';
import aircraftList from '@/data/aircraft-pages.json';

export const dynamic = 'force-static';

const BASE_URL = 'https://nnumbercheck.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/refund`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/disclaimer`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    // Example N-number lookup page for crawler discovery
    {
      url: `${BASE_URL}/n?number=N69009`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Aircraft SEO pages — one entry per N-number in the data file
  const aircraftPages: MetadataRoute.Sitemap = (aircraftList as string[]).map(
    (nNumber) => ({
      url: `${BASE_URL}/aircraft/${nNumber}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })
  );

  return [...staticPages, ...aircraftPages];
}
