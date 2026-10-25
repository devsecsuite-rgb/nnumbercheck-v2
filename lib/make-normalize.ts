// Canonical makes we serve hub pages for.
// Anything not in here is filtered out at build time.
export const CANONICAL_MAKES = new Set<string>([
  'aero-commander', 'aeronca', 'aerostar', 'air-tractor',
  'american-champion', 'aviat', 'beechcraft', 'bellanca',
  'cessna', 'champion', 'cirrus', 'dehavilland', 'diamond',
  'embraer', 'ercoupe', 'fairchild', 'grumman-american',
  'learjet', 'luscombe', 'maule', 'mooney', 'north-american',
  'pilatus', 'piper', 'rockwell-international', 'schleicher',
  'socata', 'stinson', 'taylorcraft', 'tecna', 'vans', 'waco',
]);

// Raw FAA make string (lowercased) -> canonical slug.
// Unmapped names fall through to slugify.
export const RAW_TO_CANONICAL: Record<string, string> = {
  'textron aviation inc': 'cessna',
  'cessna aircraft co': 'cessna',
  'cessna aircraft company': 'cessna',

  'beech': 'beechcraft',
  'beech aircraft corp': 'beechcraft',
  'beech aircraft corporation': 'beechcraft',
  'raytheon aircraft company': 'beechcraft',
  'hawker beechcraft corp': 'beechcraft',
  'hawker beechcraft corporation': 'beechcraft',

  'piper aircraft inc': 'piper',
  'piper aircraft corporation': 'piper',
  'new piper aircraft inc': 'piper',

  'cirrus design corp': 'cirrus',
  'cirrus design corporation': 'cirrus',

  'embraer executive aircraft inc': 'embraer',
  'embraer s a': 'embraer',
  'embraer s.a.': 'embraer',

  'learjet inc': 'learjet',
  'rockwell international': 'rockwell-international',
  'north american': 'north-american',
  'north american aviation': 'north-american',
  'grumman american': 'grumman-american',
  'grumman american aviation': 'grumman-american',
  'american aviation': 'grumman-american',

  'champion aircraft': 'champion',
  'american champion': 'american-champion',
  'american champion aircraft': 'american-champion',

  'air tractor': 'air-tractor',
  'air tractor inc': 'air-tractor',
  'air tractor company': 'air-tractor',

  'diamond aircraft industries': 'diamond',
  'diamond aircraft': 'diamond',
  'de havilland': 'dehavilland',
  'dehavilland canada': 'dehavilland',
  'dehavilland aircraft of canada': 'dehavilland',

  'maule aerospace technology': 'maule',
  'maule airplane': 'maule',
  'mooney airplane co inc': 'mooney',
  'mooney international corp': 'mooney',

  'vans aircraft inc': 'vans',
  'vans aircraft': 'vans',
  "van's aircraft": 'vans',

  'pilatus aircraft': 'pilatus',
  'pilatus aircraft ltd': 'pilatus',

  'aerostar international inc': 'aerostar',
  'aerostar aircraft corp': 'aerostar',
  'aerostar aircraft corporation': 'aerostar',

  'costruzioni aeronautiche tecna': 'tecna',
  'bellanca aircraft corp': 'bellanca',
  'bellanca aircraft corporation': 'bellanca',
  'aeronca aircraft corp': 'aeronca',
  'stinson aircraft': 'stinson',
  'stinson aircraft corp': 'stinson',
  'taylorcraft aircraft corp': 'taylorcraft',
  'taylorcraft aviation': 'taylorcraft',
  'ercoupe engineering': 'ercoupe',
  'engineering research': 'ercoupe',
  'fairchild aircraft': 'fairchild',
  'fairchild hiller': 'fairchild',
  'fairchild industries': 'fairchild',
  'luscombe aircraft': 'luscombe',
  'luscombe airplane': 'luscombe',
  'aero commander': 'aero-commander',
  'aero commander inc': 'aero-commander',
};

const EXCLUDED_PATTERNS: RegExp[] = [
  /helicopter/i, /sikorsky/i, /robinson heli/i,
  /eurocopter/i, /hughes heli/i, /bell heli/i,
  /schweizer/i, /md heli/i,
  /amazon/i, /\bdji\b/i, /uvify/i, /ea vision/i,
  /\bxag\b/i, /agras/i,
  /balloon/i, /cameron balloons/i,
];

export function normalizeMake(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  if (!lower) return null;
  if (EXCLUDED_PATTERNS.some((r) => r.test(lower))) return null;
  const mapped = RAW_TO_CANONICAL[lower];
  if (mapped) return mapped;
  return lower.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || null;
}

export function isCanonicalMake(slug: string): boolean {
  return CANONICAL_MAKES.has(slug);
}

export function slugifyModel(model: string): string {
  return model
    .toLowerCase()
    .replace(/[/\\]/g, '-')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function displayMakeFromSlug(slug: string): string {
  const OVERRIDES: Record<string, string> = {
    'aero-commander': 'Aero Commander',
    'dehavilland': 'De Havilland',
    'american-champion': 'American Champion',
    'embraer': 'Embraer',
    'learjet': 'Learjet',
    'vans': "Van's",
    'tecna': 'Tecna',
  };
  if (OVERRIDES[slug]) return OVERRIDES[slug];
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
