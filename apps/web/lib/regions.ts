/**
 * Country code to region mapping (frontend only, static)
 * Used for region pages and filtering
 */

export type Region = 
  | "asia"
  | "europe" 
  | "north-america"
  | "south-america"
  | "africa"
  | "oceania"
  | "global";

export const REGION_NAMES: Record<Region, string> = {
  "asia": "Asia",
  "europe": "Europe",
  "north-america": "North America",
  "south-america": "South America",
  "africa": "Africa",
  "oceania": "Oceania",
  "global": "Global",
};

/**
 * Country code to region mapping
 * Add more countries as needed - this is a static frontend mapping
 */
const COUNTRY_TO_REGION: Record<string, Region> = {
  // Asia
  AF: "asia", AM: "asia", AZ: "asia", BH: "asia", BD: "asia", BT: "asia",
  BN: "asia", KH: "asia", CN: "asia", GE: "asia", HK: "asia", IN: "asia",
  ID: "asia", IR: "asia", IQ: "asia", IL: "asia", JP: "asia", JO: "asia",
  KZ: "asia", KW: "asia", KG: "asia", LA: "asia", LB: "asia", MY: "asia",
  MV: "asia", MN: "asia", MM: "asia", NP: "asia", KP: "asia", OM: "asia",
  PK: "asia", PH: "asia", QA: "asia", SA: "asia", SG: "asia", KR: "asia",
  LK: "asia", SY: "asia", TW: "asia", TJ: "asia", TH: "asia", TL: "asia",
  TR: "asia", TM: "asia", AE: "asia", UZ: "asia", VN: "asia", YE: "asia",
  
  // Europe
  AL: "europe", AD: "europe", AT: "europe", BY: "europe", BE: "europe",
  BA: "europe", BG: "europe", HR: "europe", CY: "europe", CZ: "europe",
  DK: "europe", EE: "europe", FI: "europe", FR: "europe", DE: "europe",
  GR: "europe", HU: "europe", IS: "europe", IE: "europe", IT: "europe",
  LV: "europe", LI: "europe", LT: "europe", LU: "europe", MT: "europe",
  MD: "europe", MC: "europe", ME: "europe", NL: "europe", MK: "europe",
  NO: "europe", PL: "europe", PT: "europe", RO: "europe", RU: "europe",
  SM: "europe", RS: "europe", SK: "europe", SI: "europe", ES: "europe",
  SE: "europe", CH: "europe", UA: "europe", GB: "europe", VA: "europe",
  
  // North America
  CA: "north-america", MX: "north-america", US: "north-america",
  BZ: "north-america", CR: "north-america", SV: "north-america",
  GT: "north-america", HN: "north-america", NI: "north-america",
  PA: "north-america",
  
  // South America
  AR: "south-america", BO: "south-america", BR: "south-america",
  CL: "south-america", CO: "south-america", EC: "south-america",
  GY: "south-america", PY: "south-america", PE: "south-america",
  SR: "south-america", UY: "south-america", VE: "south-america",
  
  // Africa
  DZ: "africa", AO: "africa", BJ: "africa", BW: "africa", BF: "africa",
  BI: "africa", CV: "africa", CM: "africa", CF: "africa", TD: "africa",
  KM: "africa", CG: "africa", CD: "africa", CI: "africa", DJ: "africa",
  EG: "africa", GQ: "africa", ER: "africa", SZ: "africa", ET: "africa",
  GA: "africa", GM: "africa", GH: "africa", GN: "africa", GW: "africa",
  KE: "africa", LS: "africa", LR: "africa", LY: "africa", MG: "africa",
  MW: "africa", ML: "africa", MR: "africa", MU: "africa", MA: "africa",
  MZ: "africa", NA: "africa", NE: "africa", NG: "africa", RW: "africa",
  ST: "africa", SN: "africa", SC: "africa", SL: "africa", SO: "africa",
  ZA: "africa", SS: "africa", SD: "africa", TZ: "africa", TG: "africa",
  TN: "africa", UG: "africa", ZM: "africa", ZW: "africa",
  
  // Oceania
  AU: "oceania", NZ: "oceania", FJ: "oceania", PG: "oceania",
  NC: "oceania", PF: "oceania", WS: "oceania", SB: "oceania",
  VU: "oceania",

  // Global
  "GL-120": "global", "GL-139": "global",
};

/**
 * Get region for a country code
 */
export function getRegionForCountry(code: string): Region | null {
  const upperCode = code.toUpperCase();
  return COUNTRY_TO_REGION[upperCode] || null;
}

/**
 * Get all country codes for a region
 */
export function getCountriesForRegion(region: Region): string[] {
  return Object.entries(COUNTRY_TO_REGION)
    .filter(([_, reg]) => reg === region)
    .map(([code]) => code);
}

/**
 * Check if a country code belongs to a region
 */
export function isCountryInRegion(code: string, region: Region): boolean {
  return getRegionForCountry(code) === region;
}


