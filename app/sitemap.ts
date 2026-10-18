import type { MetadataRoute } from 'next';
import aircraftList from '@/data/aircraft-pages.json';
import aircraftData from '@/data/aircraft-data.json';

export const dynamic = 'force-static';

const BASE_URL = 'https://nnumbercheck.com';

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[/\\]/g, '-')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ============================================================
// QUALITY GATE for aircraft pages
// Gate: 5+ accidents OR 10+ SDRs OR in seeded family
// ============================================================

const ACC_MIN = 5;
const SDR_MIN = 10;

const SEEDED_FAMILIES = [
  { make: 'cessna', model: '152' },
  { make: 'cessna', model: '172' },
  { make: 'cessna', model: '182' },
  { make: 'piper', model: 'pa-28' },
  { make: 'cirrus', model: 'sr22' },
  { make: 'beech', model: '36' },
  { make: 'beechcraft', model: '36' },
  { make: 'raytheon', model: '36' },
  { make: 'textron', model: '36' },
  { make: 'hawker', model: '36' },
];

function isSeededFamily(make: string, model: string): boolean {
  if (!make || !model) return false;
  const m = make.toLowerCase();
  const mo = model.toLowerCase();
  return SEEDED_FAMILIES.some(
    (f) => m.includes(f.make) && mo.includes(f.model)
  );
}

// Load enrichment data — written by scripts/export_enrichment.py
let enrichmentData: Record<string, { accidents?: number; sdrs?: number }> = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  enrichmentData = require('@/data/aircraft-enrichment.json');
} catch {
  // No enrichment file — only seeded families will be included
}

// ============================================================
// Sitemap generator
// ============================================================

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // ---------- Static pages ----------
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/aircraft`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/ad-check`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/sample-report`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/compare/aero-space-reports`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/refund`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/disclaimer`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/guides`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/guides/cessna-172`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/guides/piper-pa-28`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/blog/how-to-check-aircraft-ad-history`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ];

  // ---------- Aircraft pages (quality-gated) ----------
  const filteredAircraft: string[] = [];

  for (const nNumber of (aircraftList as string[])) {
    const entry = (aircraftData as Record<string, any>)[nNumber];
    const aircraft = entry?.aircraft || entry || {};
    const make = aircraft.make || '';
    const model = aircraft.model || '';

    // Always include seeded families
    if (isSeededFamily(make, model)) {
      filteredAircraft.push(nNumber);
      continue;
    }

    // Otherwise, apply the enrichment gate
    const enr = enrichmentData[nNumber];
    if (enr) {
      if ((enr.accidents || 0) >= ACC_MIN || (enr.sdrs || 0) >= SDR_MIN) {
        filteredAircraft.push(nNumber);
      }
    }
  }

  const aircraftPages: MetadataRoute.Sitemap = filteredAircraft
    .slice(0, 1200)
    .map((nNumber) => ({
      url: `${BASE_URL}/aircraft/${nNumber}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

  // ---------- Hub pages (make/model combinations) ----------
  const counts = new Map<string, { make: string; model: string; count: number }>();

  for (const entry of Object.values(aircraftData as Record<string, any>)) {
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

    const makeHubsData = require('@/data/make-hubs.json');
  const makeHubs: MetadataRoute.Sitemap = Object.keys(makeHubsData).map((make) => ({
    url: `${BASE_URL}/aircraft/make/${make}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...aircraftPages, ...hubPages, ...makeHubs];
}
