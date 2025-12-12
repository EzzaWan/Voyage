import { Metadata } from "next";
import { REGION_NAMES, Region } from "@/lib/regions";

/**
 * Generate SEO metadata for region pages
 */
export async function generateMetadata({ params }: { params: { region: string } }): Promise<Metadata> {
  const regionSlug = params.region as Region;
  const regionName = REGION_NAMES[regionSlug] || regionSlug;
  
  return {
    title: `${regionName} eSIM Plans — Buy Prepaid eSIM for ${regionName}`,
    description: `Buy eSIM plans for ${regionName}. Browse countries in ${regionName} with instant activation, no contract, global coverage.`,
    openGraph: {
      title: `${regionName} eSIM Plans`,
      description: `Buy eSIM plans for countries in ${regionName}. Instant activation, no contract.`,
      type: "website",
    },
  };
}

export default function RegionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}


