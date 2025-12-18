"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { CountryCard } from "@/components/CountryCard";
import { CountrySkeleton } from "@/components/skeletons";
import { PlanCard, Plan } from "@/components/PlanCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Globe, ArrowRight, Shield, Lock, Clock, CheckCircle2, Star, Quote, Zap, Smartphone, Wifi, Plane, HelpCircle } from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";
import { getRegionForCountry, REGION_NAMES, Region } from "@/lib/regions";
import { filterVisiblePlans } from "@/lib/plan-utils";

interface Country {
  code: string;
  name: string;
  locationLogo?: string;
  type?: number; // 1 = country, 2 = region
}

export default function Home() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Country[]>([]);
  const [filtered, setFiltered] = useState<Country[]>([]);
  const [filteredRegions, setFilteredRegions] = useState<Country[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [popularPlans, setPopularPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const data = await safeFetch<any>(`${apiUrl}/countries`, { showToast: false });
        console.log('[HOME] Received countries data:', data);
        // Handle both array and { locationList: [...] } formats
        const locationArray = Array.isArray(data) ? data : (data.locationList || []);
        console.log('[HOME] Locations array:', locationArray.slice(0, 3));
        
        // Separate countries (type === 1) from regions (type === 2)
        // Explicitly filter: countries must be type === 1, regions must be type === 2
        const countriesList = locationArray.filter((item: Country) => item.type === 1); // Only countries
        const regionsList = locationArray.filter((item: Country) => item.type === 2); // Only regions
        
        const sortedCountries = countriesList.sort((a: Country, b: Country) => a.name.localeCompare(b.name));
        const sortedRegions = regionsList.sort((a: Country, b: Country) => a.name.localeCompare(b.name));
        
        setCountries(sortedCountries);
        setRegions(sortedRegions);
        setFiltered(sortedCountries);
        setFilteredRegions(sortedRegions);
      } catch (error) {
        console.error("Failed to fetch countries", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);

  // Fetch popular plans from popular countries
  useEffect(() => {
    if (search) return; // Don't fetch if searching
    
    const fetchPopularPlans = async () => {
      setLoadingPlans(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        // Popular countries: US, UK, France, Japan, Australia
        const popularCountries = ['US', 'GB', 'FR', 'JP', 'AU'];
        const allPlans: Plan[] = [];
        
        // Fetch plans from each popular country (limit to first 2 plans per country)
        for (const countryCode of popularCountries) {
          try {
            const data = await safeFetch<Plan[]>(`${apiUrl}/countries/${countryCode}/plans`, { showToast: false });
            if (Array.isArray(data) && data.length > 0) {
              // Filter visible plans and take first 2
              const visiblePlans = filterVisiblePlans(data).slice(0, 2);
              allPlans.push(...visiblePlans);
            }
          } catch (error) {
            console.error(`Failed to fetch plans for ${countryCode}:`, error);
          }
        }
        
        // Sort by price and take top 6
        const sorted = allPlans
          .sort((a, b) => a.price - b.price)
          .slice(0, 6);
        
        setPopularPlans(sorted);
      } catch (error) {
        console.error("Failed to fetch popular plans", error);
      } finally {
        setLoadingPlans(false);
      }
    };
    
    fetchPopularPlans();
  }, [search]);

  // Group countries by region
  const countriesByRegion = useMemo(() => {
    const grouped: Record<Region, Country[]> = {
      "asia": [],
      "europe": [],
      "north-america": [],
      "south-america": [],
      "africa": [],
      "oceania": [],
      "global": [],
    };

    countries.forEach((country) => {
      const region = getRegionForCountry(country.code);
      if (region) {
        grouped[region].push(country);
      }
    });

    return grouped;
  }, [countries]);

  useEffect(() => {
    if (!search) {
      setFiltered(countries);
      setFilteredRegions(regions);
    } else {
      const lower = search.toLowerCase();
      setFiltered(countries.filter(c => c.name.toLowerCase().includes(lower)));
      setFilteredRegions(regions.filter(r => r.name.toLowerCase().includes(lower)));
    }
  }, [search, countries, regions]);

  const regionGroups: Region[] = ["asia", "europe", "north-america", "south-america", "africa", "oceania", "global"];

  return (
    <div className="min-h-[80vh] flex flex-col space-y-8">
       {/* Hero Section with Travel Imagery */}
       <div className="relative overflow-hidden rounded-3xl border border-[var(--voyage-border)] bg-gradient-to-br from-[var(--voyage-bg)] via-[var(--voyage-bg-light)] to-[#051020]">
         {/* Background Pattern */}
         <div className="absolute inset-0 opacity-10">
           <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--voyage-accent)] rounded-full blur-3xl"></div>
           <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
         </div>
         
         <div className="relative flex flex-col items-center text-center max-w-4xl mx-auto py-16 md:py-24 px-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center justify-center p-2 rounded-full bg-[var(--voyage-bg-light)] border border-[var(--voyage-border)] mb-4">
               <span className="flex items-center gap-2 text-sm font-medium text-[var(--voyage-text)] px-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Active in 190+ Countries
               </span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
               Connectivity without <br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--voyage-accent)] to-purple-400">boundaries.</span>
            </h1>
            <p className="text-xl md:text-2xl text-[var(--voyage-muted)] max-w-2xl mx-auto leading-relaxed">
               Instant eSIM delivery for global travelers. Connect in seconds, avoid roaming fees, and travel with confidence.
            </p>
            
            <div className="pt-8 flex justify-center w-full">
               <div className="w-full max-w-xl">
                 <SearchBar value={search} onChange={setSearch} />
               </div>
            </div>
         </div>
       </div>

       {/* Why Choose Voyage Section */}
       {!search && (
         <div className="space-y-6">
           <div className="text-center">
             <h2 className="text-3xl font-bold text-white mb-2">Why Choose Voyage?</h2>
             <p className="text-[var(--voyage-muted)]">Everything you need for seamless global connectivity</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <div className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-6 hover:border-[var(--voyage-accent)]/50 transition-all">
               <div className="p-3 bg-[var(--voyage-accent)]/10 rounded-lg w-fit mb-4">
                 <Zap className="h-6 w-6 text-[var(--voyage-accent)]" />
               </div>
               <h3 className="text-lg font-bold text-white mb-2">Instant Activation</h3>
               <p className="text-sm text-[var(--voyage-muted)]">
                 Get your eSIM activated within minutes. No waiting, no physical SIM cards needed.
               </p>
             </div>
             
             <div className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-6 hover:border-[var(--voyage-accent)]/50 transition-all">
               <div className="p-3 bg-[var(--voyage-accent)]/10 rounded-lg w-fit mb-4">
                 <Smartphone className="h-6 w-6 text-[var(--voyage-accent)]" />
               </div>
               <h3 className="text-lg font-bold text-white mb-2">Easy Setup</h3>
               <p className="text-sm text-[var(--voyage-muted)]">
                 Simple QR code installation. Works on all eSIM-compatible devices worldwide.
               </p>
             </div>
             
             <div className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-6 hover:border-[var(--voyage-accent)]/50 transition-all">
               <div className="p-3 bg-[var(--voyage-accent)]/10 rounded-lg w-fit mb-4">
                 <Wifi className="h-6 w-6 text-[var(--voyage-accent)]" />
               </div>
               <h3 className="text-lg font-bold text-white mb-2">Global Coverage</h3>
               <p className="text-sm text-[var(--voyage-muted)]">
                 Connect in 190+ countries with high-speed 4G/LTE networks. Stay connected everywhere.
               </p>
             </div>
             
             <div className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-6 hover:border-[var(--voyage-accent)]/50 transition-all">
               <div className="p-3 bg-[var(--voyage-accent)]/10 rounded-lg w-fit mb-4">
                 <Plane className="h-6 w-6 text-[var(--voyage-accent)]" />
               </div>
               <h3 className="text-lg font-bold text-white mb-2">Travel-Friendly</h3>
               <p className="text-sm text-[var(--voyage-muted)]">
                 No roaming charges, no contracts. Perfect for travelers, digital nomads, and business trips.
               </p>
             </div>
           </div>
         </div>
       )}

       {/* Popular Plans Section */}
       {!search && (
         <div className="space-y-6">
           <div className="flex items-center justify-between">
             <div>
               <h2 className="text-3xl font-bold text-white mb-2">Popular Plans</h2>
               <p className="text-[var(--voyage-muted)]">Best-selling eSIM plans from popular destinations</p>
             </div>
             <Link href="/">
               <Button variant="outline" className="border-[var(--voyage-border)] text-white hover:bg-[var(--voyage-bg-light)]">
                 View All <ArrowRight className="ml-2 h-4 w-4" />
               </Button>
             </Link>
           </div>
           
           {loadingPlans ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {[...Array(6)].map((_, i) => (
                 <div key={i} className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-6 animate-pulse">
                   <div className="h-6 bg-[var(--voyage-bg-light)] rounded mb-4 w-24"></div>
                   <div className="h-4 bg-[var(--voyage-bg-light)] rounded w-32 mb-2"></div>
                   <div className="h-4 bg-[var(--voyage-bg-light)] rounded w-40"></div>
                 </div>
               ))}
             </div>
           ) : popularPlans.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {popularPlans.map((plan) => (
                 <PlanCard key={plan.packageCode} plan={plan} />
               ))}
             </div>
           ) : null}
         </div>
       )}

       {/* Trust Badges & Guarantee Messaging */}
       {!search && (
         <div className="space-y-6">
           {/* Trust Badges */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div className="flex items-center gap-3 p-4 bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl hover:border-[var(--voyage-accent)]/50 transition-all">
               <div className="p-2 bg-green-500/10 rounded-lg">
                 <Lock className="h-6 w-6 text-green-400" />
               </div>
               <div>
                 <h3 className="text-sm font-semibold text-white">SSL Secured</h3>
                 <p className="text-xs text-[var(--voyage-muted)]">256-bit encryption</p>
               </div>
             </div>
             <div className="flex items-center gap-3 p-4 bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl hover:border-[var(--voyage-accent)]/50 transition-all">
               <div className="p-2 bg-blue-500/10 rounded-lg">
                 <Shield className="h-6 w-6 text-blue-400" />
               </div>
               <div>
                 <h3 className="text-sm font-semibold text-white">Money-Back Guarantee</h3>
                 <p className="text-xs text-[var(--voyage-muted)]">30-day satisfaction</p>
               </div>
             </div>
             <div className="flex items-center gap-3 p-4 bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl hover:border-[var(--voyage-accent)]/50 transition-all">
               <div className="p-2 bg-purple-500/10 rounded-lg">
                 <Clock className="h-6 w-6 text-purple-400" />
               </div>
               <div>
                 <h3 className="text-sm font-semibold text-white">24/7 Support</h3>
                 <p className="text-xs text-[var(--voyage-muted)]">Always here to help</p>
               </div>
             </div>
           </div>

           {/* Guarantee Messaging */}
           <div className="bg-gradient-to-r from-[var(--voyage-accent)]/10 to-purple-500/10 rounded-2xl p-6">
             <div className="flex flex-col md:flex-row items-center justify-center gap-4">
               <div className="flex items-center gap-2">
                 <CheckCircle2 className="h-6 w-6 text-green-400" />
                 <span className="text-lg font-bold text-white">Instant Delivery</span>
               </div>
               <div className="hidden md:block h-6 w-px bg-[var(--voyage-border)]" />
               <div className="flex items-center gap-2">
                 <CheckCircle2 className="h-6 w-6 text-green-400" />
                 <span className="text-lg font-bold text-white">Satisfaction Guaranteed</span>
               </div>
               <div className="hidden md:block h-6 w-px bg-[var(--voyage-border)]" />
               <div className="flex items-center gap-2">
                 <CheckCircle2 className="h-6 w-6 text-green-400" />
                 <span className="text-lg font-bold text-white">No Hidden Fees</span>
               </div>
             </div>
           </div>

           {/* Security Indicators */}
           <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--voyage-muted)]">
             <div className="flex items-center gap-2">
               <Shield className="h-4 w-4 text-[var(--voyage-accent)]" />
               <span>PCI DSS Compliant</span>
             </div>
             <div className="hidden sm:block h-4 w-px bg-[var(--voyage-border)]" />
             <div className="flex items-center gap-2">
               <Lock className="h-4 w-4 text-[var(--voyage-accent)]" />
               <span>Data Protection</span>
             </div>
             <div className="hidden sm:block h-4 w-px bg-[var(--voyage-border)]" />
             <div className="flex items-center gap-2">
               <CheckCircle2 className="h-4 w-4 text-green-400" />
               <span>Secure Payments</span>
             </div>
           </div>
         </div>
       )}

       {/* Region Sections */}
       {!search && (
         <div className="space-y-4">
           <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-1">Browse by Continent</h2>
            <p className="text-sm text-[var(--voyage-muted)]">Explore eSIM plans by continent</p>
           </div>
           
           {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
               {[...Array(6)].map((_, i) => (
                 <div key={i} className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-6 animate-pulse">
                   <div className="h-6 bg-[var(--voyage-bg-light)] rounded mb-2 w-24"></div>
                   <div className="h-4 bg-[var(--voyage-bg-light)] rounded w-32"></div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
               {regionGroups.map((region) => {
                 const regionCountries = countriesByRegion[region];
                 // Always show Global region, even if empty
                 if (region !== "global" && regionCountries.length === 0) return null;
                 
                 return (
                   <Link
                     key={region}
                     href={`/regions/${region}`}
                     className="group bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-6 hover:border-[var(--voyage-accent)] transition-all"
                   >
                     <div className="flex items-center justify-between">
                       <div>
                         <h3 className="text-xl font-bold text-white mb-1">
                           {REGION_NAMES[region]}
                         </h3>
                         <p className="text-sm text-[var(--voyage-muted)]">
                           {region === "global" ? "130+ countries" : `${regionCountries.length} countries`}
                         </p>
                       </div>
                       <ArrowRight className="h-5 w-5 text-[var(--voyage-muted)] group-hover:text-[var(--voyage-accent)] transition-colors" />
                     </div>
                   </Link>
                 );
               })}
             </div>
           )}
         </div>
       )}

       {/* All Countries Grid (type 1 only) */}
       <div className="space-y-4">
         <h2 className="text-2xl font-bold text-white">
           {search ? `Search Results` : "All Countries"}
         </h2>
         
         {loading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(12)].map((_, i) => (
                <CountrySkeleton key={i} />
              ))}
           </div>
         ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 animate-in fade-in duration-1000">
              {filtered.map((country) => (
                 <CountryCard key={country.code} country={country} />
              ))}
              
              {filtered.length === 0 && !loading && (
                 <div className="col-span-full text-center py-20 text-[var(--voyage-muted)]">
                    {search ? `No countries found matching "${search}"` : "No countries available"}
                 </div>
              )}
           </div>
         )}
       </div>

       {/* Regions List (type 2) */}
       {!search && filteredRegions.length > 0 && (
         <div className="space-y-4">
           <h2 className="text-2xl font-bold text-white">Regions</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 animate-in fade-in duration-1000">
             {filteredRegions.map((region) => (
               <CountryCard key={region.code} country={region} />
             ))}
           </div>
         </div>
       )}

       {/* FAQ Section */}
       {!search && (
         <div className="space-y-6">
           <div className="text-center">
             <h2 className="text-3xl font-bold text-white mb-2">Frequently Asked Questions</h2>
             <p className="text-[var(--voyage-muted)]">Quick answers to common questions</p>
           </div>
           
           <div className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-2xl p-6 md:p-8">
             <Accordion type="single" collapsible className="w-full">
               <AccordionItem value="item-1">
                 <AccordionTrigger className="text-white hover:text-[var(--voyage-accent)]">
                   What is an eSIM and how does it work?
                 </AccordionTrigger>
                 <AccordionContent className="text-[var(--voyage-muted)]">
                   An eSIM (embedded SIM) is a digital SIM card that's built into your device. Instead of a physical SIM card, you download a profile directly to your phone. Simply scan the QR code we provide, and your eSIM will be activated instantly. It works just like a regular SIM card but without the hassle of swapping physical cards.
                 </AccordionContent>
               </AccordionItem>
               
               <AccordionItem value="item-2">
                 <AccordionTrigger className="text-white hover:text-[var(--voyage-accent)]">
                   Which devices support eSIM?
                 </AccordionTrigger>
                 <AccordionContent className="text-[var(--voyage-muted)]">
                   Most modern smartphones support eSIM, including iPhone XS and newer, Google Pixel 3 and newer, Samsung Galaxy S20 and newer, and many other devices. Check your device compatibility using our <Link href="/support/device-check" className="text-[var(--voyage-accent)] hover:underline">device checker</Link> before purchasing.
                 </AccordionContent>
               </AccordionItem>
               
               <AccordionItem value="item-3">
                 <AccordionTrigger className="text-white hover:text-[var(--voyage-accent)]">
                   How quickly will I receive my eSIM?
                 </AccordionTrigger>
                 <AccordionContent className="text-[var(--voyage-muted)]">
                   Your eSIM is delivered instantly via email after payment confirmation. You'll receive a QR code and activation instructions within minutes of your purchase. No waiting, no shipping delays!
                 </AccordionContent>
               </AccordionItem>
               
               <AccordionItem value="item-4">
                 <AccordionTrigger className="text-white hover:text-[var(--voyage-accent)]">
                   Can I use my regular SIM and eSIM at the same time?
                 </AccordionTrigger>
                 <AccordionContent className="text-[var(--voyage-muted)]">
                   Yes! Most eSIM-compatible devices support dual SIM functionality, allowing you to use both your regular SIM and eSIM simultaneously. This is perfect for keeping your home number active while using data from your eSIM abroad.
                 </AccordionContent>
               </AccordionItem>
               
               <AccordionItem value="item-5">
                 <AccordionTrigger className="text-white hover:text-[var(--voyage-accent)]">
                   What happens if I don't use all my data?
                 </AccordionTrigger>
                 <AccordionContent className="text-[var(--voyage-muted)]">
                   Unused data expires at the end of your plan's validity period. However, many of our plans are valid for 30 days, giving you plenty of time to use your data. Some plans also support top-ups if you need more data before expiry.
                 </AccordionContent>
               </AccordionItem>
               
               <AccordionItem value="item-6">
                 <AccordionTrigger className="text-white hover:text-[var(--voyage-accent)]">
                   Do you offer refunds?
                 </AccordionTrigger>
                 <AccordionContent className="text-[var(--voyage-muted)]">
                   Yes, we offer a 30-day money-back guarantee. If you're not satisfied with your eSIM service, you can request a refund within 30 days of purchase. See our <Link href="/support?tab=refund" className="text-[var(--voyage-accent)] hover:underline">refund policy</Link> for full details.
                 </AccordionContent>
               </AccordionItem>
             </Accordion>
           </div>
         </div>
       )}

       {/* Testimonials Section - Bottom of Page */}
       {!search && (
         <div className="space-y-6 pt-8">
           <div className="text-center">
             <h2 className="text-3xl font-bold text-white mb-2">Trusted by Travelers Worldwide</h2>
             <p className="text-[var(--voyage-muted)]">See what our customers are saying</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Testimonial 1 */}
             <div className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-6 hover:border-[var(--voyage-accent)]/50 transition-all">
               <div className="flex items-center gap-1 mb-4">
                 {[...Array(5)].map((_, i) => (
                   <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                 ))}
               </div>
               <Quote className="h-6 w-6 text-[var(--voyage-accent)] mb-3 opacity-50" />
               <p className="text-[var(--voyage-text)] mb-4 italic">
                 "Perfect for my European trip! Activated instantly and worked flawlessly in 8 countries. No more expensive roaming charges!"
               </p>
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full bg-[var(--voyage-accent)]/20 flex items-center justify-center">
                   <span className="text-sm font-bold text-[var(--voyage-accent)]">SM</span>
                 </div>
                 <div>
                   <p className="text-sm font-semibold text-white">Sarah M.</p>
                   <p className="text-xs text-[var(--voyage-muted)]">Verified Customer</p>
                 </div>
               </div>
             </div>

             {/* Testimonial 2 */}
             <div className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-6 hover:border-[var(--voyage-accent)]/50 transition-all">
               <div className="flex items-center gap-1 mb-4">
                 {[...Array(5)].map((_, i) => (
                   <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                 ))}
               </div>
               <Quote className="h-6 w-6 text-[var(--voyage-accent)] mb-3 opacity-50" />
               <p className="text-[var(--voyage-text)] mb-4 italic">
                 "Best eSIM service I've used. The setup was so easy with the QR code, and customer support helped me when I had questions."
               </p>
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full bg-[var(--voyage-accent)]/20 flex items-center justify-center">
                   <span className="text-sm font-bold text-[var(--voyage-accent)]">JK</span>
                 </div>
                 <div>
                   <p className="text-sm font-semibold text-white">James K.</p>
                   <p className="text-xs text-[var(--voyage-muted)]">Verified Customer</p>
                 </div>
               </div>
             </div>

             {/* Testimonial 3 */}
             <div className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-6 hover:border-[var(--voyage-accent)]/50 transition-all">
               <div className="flex items-center gap-1 mb-4">
                 {[...Array(5)].map((_, i) => (
                   <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                 ))}
               </div>
               <Quote className="h-6 w-6 text-[var(--voyage-accent)] mb-3 opacity-50" />
               <p className="text-[var(--voyage-text)] mb-4 italic">
                 "Affordable prices and great coverage. I bought a global plan and it worked perfectly across Asia. Highly recommend!"
               </p>
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full bg-[var(--voyage-accent)]/20 flex items-center justify-center">
                   <span className="text-sm font-bold text-[var(--voyage-accent)]">ML</span>
                 </div>
                 <div>
                   <p className="text-sm font-semibold text-white">Maria L.</p>
                   <p className="text-xs text-[var(--voyage-muted)]">Verified Customer</p>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}

