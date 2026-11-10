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

// Raw FAA make string (lowercased) → canonical slug.
// Only add entries that need mapping; unmapped names fall through to slugify.
export const RAW_TO_CANONICAL: Record<string, string> = {
  // Cessna
  'textron aviation inc': 'cessna',
  'cessna aircraft co': 'cessna',
  'cessna aircraft company': 'cessna',
  // Beechcraft
  'beech': 'beechcraft',
  'beech aircraft corp': 'beechcraft',
  'beech aircraft corporation': 'beechcraft',
  'raytheon aircraft company': 'beechcraft',
  'hawker beechcraft corp': 'beechcraft',
  'hawker beechcraft corporation': 'beechcraft',
  // Piper
  'piper aircraft inc': 'piper',
  'piper aircraft corporation': 'piper',
  'new piper aircraft inc': 'piper',
  // Cirrus
  'cirrus design corp': 'cirrus',
  'cirrus design corporation': 'cirrus',
  // Embraer
  'embraer executive aircraft inc': 'embraer',
  'embraer s a': 'embraer',
  'embraer s.a.': 'embraer',
  // Learjet
  'learjet inc': 'learjet',
  // Rockwell
  'rockwell international': 'rockwell-international',
  // North American
  'north american': 'north-american',
  'north american aviation': 'north-american',
  // Grumman / American Aviation
  'grumman american': 'grumman-american',
  'grumman american aviation': 'grumman-american',
  'american aviation': 'grumman-american',
  // Champion family
  'champion aircraft': 'champion',
  'american champion': 'american-champion',
  'american champion aircraft': 'american-champion',
  // Air Tractor
  'air tractor': 'air-tractor',
  'air tractor inc': 'air-tractor',
  'air tractor company': 'air-tractor',
  // Diamond
  'diamond aircraft industries': 'diamond',
  'diamond aircraft': 'diamond',
  // De Havilland
  'de havilland': 'dehavilland',
  'dehavilland canada': 'dehavilland',
  'dehavilland aircraft of canada': 'dehavilland',
  // Maule
  'maule aerospace technology': 'maule',
  'maule airplane': 'maule',
  // Mooney
  'mooney airplane co inc': 'mooney',
  'mooney international corp': 'mooney',
  // Van's
  'vans aircraft inc': 'vans',
  'vans aircraft': 'vans',
  "van's aircraft": 'vans',
  // Pilatus
  'pilatus aircraft': 'pilatus',
  'pilatus aircraft ltd': 'pilatus',
  // Aerostar
  'aerostar international inc': 'aerostar',
  'aerostar aircraft corp': 'aerostar',
  'aerostar aircraft corporation': 'aerostar',
  // Tecna
  'costruzioni aeronautiche tecna': 'tecna',
  // Bellanca
  'bellanca aircraft corp': 'bellanca',
  'bellanca aircraft corporation': 'bellanca',
  // Aeronca
  'aeronca aircraft corp': 'aeronca',
  // Stinson
  'stinson aircraft': 'stinson',
  'stinson aircraft corp': 'stinson',
  // Taylorcraft
  'taylorcraft aircraft corp': 'taylorcraft',
  'taylorcraft aviation': 'taylorcraft',
  // Ercoupe
  'ercoupe engineering': 'ercoupe',
  'engineering research': 'ercoupe',
  // Fairchild
  'fairchild aircraft': 'fairchild',
  'fairchild hiller': 'fairchild',
  'fairchild industries': 'fairchild',
  // Luscombe
  'luscombe aircraft': 'luscombe',
  'luscombe airplane': 'luscombe',
  // Aero Commander
  'aero commander': 'aero-commander',
  'aero commander inc': 'aero-commander',
};

// Whole-category exclusions: if any regex matches, return null.
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

// Title-case a canonical slug for display (with overrides for odd cases).
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
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
