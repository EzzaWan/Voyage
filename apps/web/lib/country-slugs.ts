/**
 * Country code to slug and name mapping for SEO-friendly URLs
 * Used for frontend routing only - backend still uses country codes
 */
export interface CountrySlugInfo {
  slug: string;
  name: string;
}

export const COUNTRY_SLUGS: Record<string, CountrySlugInfo> = {
  // Common countries (add more as needed)
  PL: { slug: "poland-esim", name: "Poland" },
  NL: { slug: "netherlands-esim", name: "Netherlands" },
  CA: { slug: "canada-esim", name: "Canada" },
  US: { slug: "united-states-esim", name: "United States" },
  GB: { slug: "united-kingdom-esim", name: "United Kingdom" },
  FR: { slug: "france-esim", name: "France" },
  DE: { slug: "germany-esim", name: "Germany" },
  ES: { slug: "spain-esim", name: "Spain" },
  IT: { slug: "italy-esim", name: "Italy" },
  JP: { slug: "japan-esim", name: "Japan" },
  KR: { slug: "south-korea-esim", name: "South Korea" },
  CN: { slug: "china-esim", name: "China" },
  IN: { slug: "india-esim", name: "India" },
  AU: { slug: "australia-esim", name: "Australia" },
  NZ: { slug: "new-zealand-esim", name: "New Zealand" },
  BR: { slug: "brazil-esim", name: "Brazil" },
  MX: { slug: "mexico-esim", name: "Mexico" },
  AR: { slug: "argentina-esim", name: "Argentina" },
  ZA: { slug: "south-africa-esim", name: "South Africa" },
  EG: { slug: "egypt-esim", name: "Egypt" },
  AE: { slug: "uae-esim", name: "United Arab Emirates" },
  SG: { slug: "singapore-esim", name: "Singapore" },
  TH: { slug: "thailand-esim", name: "Thailand" },
  ID: { slug: "indonesia-esim", name: "Indonesia" },
  PH: { slug: "philippines-esim", name: "Philippines" },
  VN: { slug: "vietnam-esim", name: "Vietnam" },
  MY: { slug: "malaysia-esim", name: "Malaysia" },
  TR: { slug: "turkey-esim", name: "Turkey" },
  GR: { slug: "greece-esim", name: "Greece" },
  PT: { slug: "portugal-esim", name: "Portugal" },
  CH: { slug: "switzerland-esim", name: "Switzerland" },
  AT: { slug: "austria-esim", name: "Austria" },
  BE: { slug: "belgium-esim", name: "Belgium" },
  SE: { slug: "sweden-esim", name: "Sweden" },
  NO: { slug: "norway-esim", name: "Norway" },
  DK: { slug: "denmark-esim", name: "Denmark" },
  FI: { slug: "finland-esim", name: "Finland" },
  "GL-120": { slug: "global-120-esim", name: "Global (120 Countries)" },
  "GL-139": { slug: "global-139-esim", name: "Global (139 Countries)" },
};

/**
 * Get slug from country code
 */
export function getSlugFromCode(code: string): string | null {
  const upperCode = code.toUpperCase();
  return COUNTRY_SLUGS[upperCode]?.slug || null;
}

/**
 * Get country code from slug
 */
export function getCodeFromSlug(slug: string): string | null {
  const entry = Object.entries(COUNTRY_SLUGS).find(
    ([_, info]) => info.slug === slug
  );
  return entry ? entry[0] : null;
}

/**
 * Get country name from code or slug
 */
export function getCountryName(codeOrSlug: string): string {
  // Try as code first
  const upperCode = codeOrSlug.toUpperCase();
  if (COUNTRY_SLUGS[upperCode]) {
    return COUNTRY_SLUGS[upperCode].name;
  }
  
  // Try as slug
  const code = getCodeFromSlug(codeOrSlug);
  if (code && COUNTRY_SLUGS[code]) {
    return COUNTRY_SLUGS[code].name;
  }
  
  // Fallback: try Intl.DisplayNames
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(upperCode) || codeOrSlug;
  } catch {
    return codeOrSlug;
  }
}


