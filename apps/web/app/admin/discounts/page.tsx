"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchDiscounts,
  saveDiscounts,
  clearDiscounts,
  exportDiscounts,
  importDiscounts,
  DiscountMap,
  clearGlobalDiscounts,
  GlobalDiscountMap,
  clearDiscountsCache,
} from "@/lib/admin-discounts";
import { safeFetch } from "@/lib/safe-fetch";
import { Plan } from "@/components/PlanCard";
import { Download, Upload, Trash2, Save, Search, ArrowLeft } from "lucide-react";
import { calculateGB, filterVisiblePlans } from "@/lib/plan-utils";

/**
 * Admin Discounts Page
 * Manages discounts stored in backend (AdminSettings.discountsJson)
 * Loads countries first, then plans for selected country
 */
interface Country {
  code: string;
  name: string;
  locationLogo?: string;
}

export default function AdminDiscountsPage() {
  const { user } = useUser();
  const [discounts, setDiscountsState] = useState<DiscountMap>({});
  const [globalDiscounts, setGlobalDiscountsState] = useState<GlobalDiscountMap>({});
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [countryPlans, setCountryPlans] = useState<(Plan & { countryCode?: string; countryName?: string })[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"code" | "name" | "discount" | "dataSize" | "duration">("code");

  // Load discounts and countries on mount
  useEffect(() => {
    const loadData = async () => {
      // Fetch discounts from backend
      const discountData = await fetchDiscounts();
      setDiscountsState(discountData.individual);
      setGlobalDiscountsState(discountData.global);

    // Fetch countries only (lightweight)
    const fetchCountries = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const countriesData = await safeFetch<Country[]>(`${apiUrl}/countries`, { showToast: false });
        // Sort countries alphabetically by name
        const sortedCountries = (countriesData || []).sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        setCountries(sortedCountries);
      } catch (error) {
        console.error("Failed to fetch countries:", error);
      } finally {
        setLoadingCountries(false);
      }
    };

      fetchCountries();
    };

    loadData();
  }, []);

  // Load plans when country is selected
  useEffect(() => {
    if (!selectedCountry) {
      setCountryPlans([]);
      return;
    }

    const fetchCountryPlans = async () => {
      setLoadingPlans(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const plans = await safeFetch<Plan[]>(
          `${apiUrl}/countries/${selectedCountry.code}/plans`,
          { showToast: false }
        );
        
        // Add country info to each plan
        const plansWithCountry = (plans || []).map(plan => ({
          ...plan,
          countryCode: selectedCountry.code,
          countryName: selectedCountry.name,
        }));

        // Apply filtering: exclude 0.5GB, 1.5GB, 2GB and plans under $3
        const filteredPlans = filterVisiblePlans(plansWithCountry);
        
        setCountryPlans(filteredPlans);
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        setCountryPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchCountryPlans();
  }, [selectedCountry]);

  const handleDiscountChange = (planId: string, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 100) {
      if (value === "") {
        // Allow empty input
        const newDiscounts = { ...discounts };
        delete newDiscounts[planId];
        setDiscountsState(newDiscounts);
      }
      return;
    }

    setDiscountsState({
      ...discounts,
      [planId]: num,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const adminEmail = user?.primaryEmailAddress?.emailAddress || "";
      await saveDiscounts({ global: globalDiscounts, individual: discounts }, adminEmail);
      clearDiscountsCache(); // Clear cache so fresh data is fetched
      alert("Discounts saved successfully!");
    } catch (error) {
      console.error("Failed to save discounts:", error);
      alert("Failed to save discounts. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleGlobalDiscountChange = (gbSize: number, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 100) {
      if (value === "") {
        // Allow empty input - remove discount
        const newGlobal = { ...globalDiscounts };
        const roundedGB = Math.round(gbSize * 10) / 10;
        delete newGlobal[roundedGB.toString()];
        setGlobalDiscountsState(newGlobal);
      }
      return;
    }

    const roundedGB = Math.round(gbSize * 10) / 10;
    setGlobalDiscountsState({
      ...globalDiscounts,
      [roundedGB.toString()]: num,
    });
  };

  const handleClearGlobal = async () => {
    if (confirm("Are you sure you want to clear all global discounts? This will not affect individual plan discounts.")) {
      try {
        const adminEmail = user?.primaryEmailAddress?.emailAddress || "";
        await clearGlobalDiscounts(adminEmail);
        setGlobalDiscountsState({});
        clearDiscountsCache();
        alert("Global discounts cleared successfully!");
      } catch (error) {
        console.error("Failed to clear global discounts:", error);
        alert("Failed to clear global discounts. Please try again.");
      }
    }
  };

  const handleExport = () => {
    const json = exportDiscounts();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voyage-discounts-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    setImportError(null);
    try {
      const adminEmail = user?.primaryEmailAddress?.emailAddress || "";
      const result = await importDiscounts(importText, adminEmail);
      if (result.success) {
        const loaded = await fetchDiscounts();
        setDiscountsState(loaded.individual);
        setGlobalDiscountsState(loaded.global);
        setImportText("");
        clearDiscountsCache();
        alert("Discounts imported successfully!");
      } else {
        setImportError(result.error || "Import failed");
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Import failed");
    }
  };

  const handleClear = async () => {
    if (confirm("Are you sure you want to clear all discounts? This cannot be undone.")) {
      try {
        const adminEmail = user?.primaryEmailAddress?.emailAddress || "";
        await clearDiscounts(adminEmail);
        setDiscountsState({});
        setGlobalDiscountsState({});
        clearDiscountsCache();
        alert("All discounts cleared successfully!");
      } catch (error) {
        console.error("Failed to clear discounts:", error);
        alert("Failed to clear discounts. Please try again.");
      }
    }
  };

  // Filter and sort plans for selected country
  let filteredPlans = [...countryPlans];

  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredPlans = filteredPlans.filter((plan) => {
      const planName = plan.name?.toLowerCase() || "";
      const codeLower = plan.packageCode.toLowerCase();
      return codeLower.includes(query) || planName.includes(query);
    });
  }

  // Sort plans
  filteredPlans.sort((a, b) => {
    const gbA = calculateGB(a.volume);
    const roundedGBA = Math.round(gbA * 10) / 10;
    const gbB = calculateGB(b.volume);
    const roundedGBB = Math.round(gbB * 10) / 10;
    
    // Get effective discount (individual or global)
    const discountA = discounts[a.packageCode] ?? globalDiscounts[roundedGBA.toString()] ?? 0;
    const discountB = discounts[b.packageCode] ?? globalDiscounts[roundedGBB.toString()] ?? 0;

    switch (sortBy) {
      case "code":
        return a.packageCode.localeCompare(b.packageCode);
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      case "discount":
        return discountB - discountA; // Descending
      case "dataSize": {
        const gbA = calculateGB(a.volume);
        const gbB = calculateGB(b.volume);
        return gbB - gbA; // Descending (largest first)
      }
      case "duration": {
        // Normalize duration to days for comparison
        const daysA = a.durationUnit?.toLowerCase() === "day" 
          ? a.duration 
          : a.duration * 30; // Assume month = 30 days
        const daysB = b.durationUnit?.toLowerCase() === "day"
          ? b.duration
          : b.duration * 30;
        return daysB - daysA; // Descending (longest first)
      }
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Discounts</h1>
        <p className="text-[var(--voyage-muted)]">
          Set discounts for plans. Select a country to view and edit discounts. Discounts are stored in the backend and applied globally.
        </p>
      </div>

      {/* Global Discounts Section */}
      <div className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Global Discounts by Data Size</h2>
            <p className="text-sm text-[var(--voyage-muted)]">
              Set discounts that apply to all plans of a specific GB size across all countries. Individual plan discounts override these.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleClearGlobal}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Global
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 3, 5, 10, 20, 30, 50, 100].map((gbSize) => {
            const gbKey = gbSize.toString();
            const globalDiscount = globalDiscounts[gbKey] || 0;
            return (
              <div key={gbSize} className="space-y-2">
                <Label htmlFor={`global-${gbSize}`} className="text-sm text-[var(--voyage-muted)]">
                  {gbSize} GB
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`global-${gbSize}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={globalDiscount || ""}
                    onChange={(e) => handleGlobalDiscountChange(gbSize, e.target.value)}
                    className="bg-[var(--voyage-bg)] border-[var(--voyage-border)] text-white"
                    placeholder="0"
                  />
                  <span className="text-[var(--voyage-muted)]">%</span>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="text-xs text-[var(--voyage-muted)] pt-2 border-t border-[var(--voyage-border)]">
          💡 Tip: Global discounts apply to all plans of that GB size. Set individual plan discounts below to override.
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex gap-4 items-center flex-wrap">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export JSON
        </Button>
        <Button variant="outline" onClick={handleClear}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>

      {/* Import Section */}
      <div className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-lg p-4 space-y-3">
        <Label htmlFor="import-json">Import Discounts (JSON)</Label>
        <textarea
          id="import-json"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          className="w-full h-32 bg-[var(--voyage-bg)] border border-[var(--voyage-border)] rounded-md p-3 text-white font-mono text-sm"
          placeholder='{"PLAN_CODE_1": 10, "PLAN_CODE_2": 15}'
        />
        {importError && (
          <p className="text-red-400 text-sm">{importError}</p>
        )}
        <Button variant="outline" onClick={handleImport}>
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
      </div>

      {/* Country Selection View */}
      {!selectedCountry && (
        <>
          {loadingCountries ? (
            <div className="text-center py-20 text-[var(--voyage-muted)]">
              Loading countries...
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {countries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => setSelectedCountry(country)}
                  className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-lg p-4 hover:bg-[var(--voyage-bg-light)] hover:border-[var(--voyage-accent)] transition-colors text-left"
                >
                  <div className="text-white font-medium">{country.name}</div>
                  <div className="text-sm text-[var(--voyage-muted)] mt-1">{country.code}</div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Plans View for Selected Country */}
      {selectedCountry && (
        <>
          {/* Back button and country header */}
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedCountry(null);
                setSearchQuery("");
              }}
              className="text-[var(--voyage-muted)] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Countries
            </Button>
            <div>
              <h2 className="text-xl font-bold text-white">{selectedCountry.name}</h2>
              <p className="text-sm text-[var(--voyage-muted)]">
                Plans: 1GB, 3GB, 5GB+ (excluding 0.5GB, 1.5GB, 2GB) • Minimum $3 USD
              </p>
            </div>
          </div>

          {/* Search and Sort Controls */}
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--voyage-muted)]" />
                <Input
                  type="text"
                  placeholder="Search by plan code or plan name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[var(--voyage-bg)] border-[var(--voyage-border)] text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="sort-select" className="text-[var(--voyage-muted)] whitespace-nowrap">
                Sort by:
              </Label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-2 bg-[var(--voyage-bg)] border border-[var(--voyage-border)] rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--voyage-accent)]"
              >
                <option value="code">Plan Code</option>
                <option value="name">Plan Name</option>
                <option value="dataSize">Data Size (GB)</option>
                <option value="duration">Duration</option>
                <option value="discount">Discount %</option>
              </select>
            </div>
          </div>

          {/* Discount Table */}
          {loadingPlans ? (
            <div className="text-center py-20 text-[var(--voyage-muted)]">
              Loading plans...
            </div>
          ) : (
        <div className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--voyage-bg-light)] border-b border-[var(--voyage-border)]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                    Plan Code
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                    Plan Details
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                    Discount %
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((plan) => {
                  const planGB = calculateGB(plan.volume);
                  const roundedGB = Math.round(planGB * 10) / 10;
                  const gbKey = roundedGB.toString();
                  
                  // Check if plan has individual discount
                  const hasIndividualDiscount = discounts[plan.packageCode] !== undefined && discounts[plan.packageCode] !== null;
                  const individualDiscount = discounts[plan.packageCode] || 0;
                  const globalDiscount = globalDiscounts[gbKey] || 0;
                  
                  // Display discount: individual if set, otherwise show global
                  const displayDiscount = hasIndividualDiscount ? individualDiscount : globalDiscount;
                  const isUsingGlobal = !hasIndividualDiscount && globalDiscount > 0;
                  
                  const gb = planGB.toFixed(1);
                  const planName = plan.name || `${gb} GB, ${plan.duration} ${plan.durationUnit}s`;
                  
                  return (
                    <tr
                      key={plan.packageCode}
                      className="border-b border-[var(--voyage-border)] last:border-0 hover:bg-[var(--voyage-bg-light)]/50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-mono text-sm text-white">
                          {plan.packageCode}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="text-white font-medium">
                            {planName}
                          </div>
                          <div className="text-xs text-[var(--voyage-muted)]">
                            {gb} GB • {plan.duration} {plan.durationUnit}s • ${plan.price?.toFixed(2)} USD
                          </div>
                          {isUsingGlobal && (
                            <div className="text-xs text-[var(--voyage-accent)] mt-1">
                              Using global: {globalDiscount}% for {roundedGB}GB
                            </div>
                          )}
                          {hasIndividualDiscount && (
                            <div className="text-xs text-green-400 mt-1">
                              Custom discount (overrides global)
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={hasIndividualDiscount ? individualDiscount : ""}
                            onChange={(e) => handleDiscountChange(plan.packageCode, e.target.value)}
                            className="w-24 bg-[var(--voyage-bg)] border-[var(--voyage-border)] text-white"
                            placeholder={isUsingGlobal ? globalDiscount.toString() : "0"}
                          />
                          <span className="text-[var(--voyage-muted)]">%</span>
                        </div>
                        {isUsingGlobal && displayDiscount > 0 && (
                          <div className="text-xs text-[var(--voyage-muted)] mt-1">
                            Global: {globalDiscount}%
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {hasIndividualDiscount && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Remove individual discount (will use global)
                              const newDiscounts = { ...discounts };
                              delete newDiscounts[plan.packageCode];
                              setDiscountsState(newDiscounts);
                            }}
                          >
                            Use Global
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
          )}

          {filteredPlans.length === 0 && !loadingPlans && (
            <div className="text-center py-20 text-[var(--voyage-muted)]">
              {searchQuery ? (
                <>No plans found matching "{searchQuery}"</>
              ) : (
                <>No plans available for {selectedCountry.name}. Plans must be &gt;= $3 USD and exclude 0.5GB, 1.5GB, 2GB sizes.</>
              )}
            </div>
          )}

          {filteredPlans.length > 0 && !loadingPlans && (
            <div className="text-sm text-[var(--voyage-muted)] text-center">
              Showing {filteredPlans.length} plan{filteredPlans.length !== 1 ? 's' : ''}
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
          )}
        </>
      )}
    </div>
  );
}

