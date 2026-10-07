import type { MetadataRoute } from 'next';
import aircraftList from '@/data/aircraft-pages.json';
import aircraftData from '@/data/aircraft-data.json';

export const dynamic = 'force-static';

const BASE_URL = 'https://nnumbercheck.com';
const LIMIT = 3000;

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-');
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/aircraft`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/refund`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/disclaimer`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const aircraftPages: MetadataRoute.Sitemap = (aircraftList as string[])
    .slice(0, LIMIT)
    .map((nNumber) => ({
      url: `${BASE_URL}/aircraft/${nNumber}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

  // Build the same 150 hub pages that generateStaticParams creates
  const data = aircraftData as Record<string, any>;
  const counts = new Map<string, { make: string; model: string; count: number }>();

  for (const entry of Object.values(data)) {
    const make = (entry as any).aircraft?.make;
    const model = (entry as any).aircraft?.model;
    if (!make || !model) continue;
    const key = `${make}|${model}`;
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { make, model, count: 1 });
  }

  const hubPages: MetadataRoute.Sitemap = [...counts.values()]
    .filter((p) => p.count >= 5)
    .sort((a, b) => b.count - a.count)
    .slice(0, 150)
    .map(({ make, model }) => ({
      url: `${BASE_URL}/aircraft/make/${slugify(make)}/model/${slugify(model)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  return [...staticPages, ...aircraftPages, ...hubPages];
}
