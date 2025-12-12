import { Metadata } from "next";
import { getCountryName } from "@/lib/country-slugs";

/**
 * Generate SEO metadata for country pages
 * Layout component allows metadata generation for client component pages
 */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const countryName = getCountryName(params.slug);
  
  return {
    title: `${countryName} eSIM — Buy Prepaid eSIM for ${countryName}`,
    description: `Buy ${countryName} eSIM — prepaid data plans with 1GB, 5GB, 10GB+ options. Instant activation, no contract, global coverage.`,
    openGraph: {
      title: `${countryName} eSIM`,
      description: `Buy ${countryName} eSIM — prepaid data plans with instant activation.`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${countryName} eSIM`,
      description: `Buy ${countryName} eSIM — prepaid data plans with instant activation.`,
    },
  };
}

export default function CountryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}


