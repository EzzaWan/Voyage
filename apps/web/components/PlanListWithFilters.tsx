"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDownUp, Filter, X, ChevronDown } from "lucide-react";

interface PlanBase {
  packageCode: string;
  price: number;
  volume: number;
  duration: number;
  [key: string]: any;
}

interface PlanListWithFiltersProps<T extends PlanBase> {
  plans: T[];
  renderItem: (plan: T) => React.ReactNode;
  emptyMessage?: string;
}

type SortOption = "price_asc" | "price_desc" | "data_asc" | "data_desc" | "duration_asc" | "duration_desc";
type DurationFilter = "all" | "1-7" | "8-15" | "16-30" | "30+";
type DataFilter = "all" | "under_3" | "3_10" | "10_plus" | "20_plus" | "50_plus";

export function PlanListWithFilters<T extends PlanBase>({ 
  plans, 
  renderItem, 
  emptyMessage = "No plans found matching your criteria." 
}: PlanListWithFiltersProps<T>) {
  const [sort, setSort] = useState<SortOption>("price_asc");
  const [durationFilter, setDurationFilter] = useState<DurationFilter>("all");
  const [dataFilter, setDataFilter] = useState<DataFilter>("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const filteredPlans = useMemo(() => {
    let result = [...plans];

    // Filter by Duration
    if (durationFilter !== "all") {
      result = result.filter(plan => {
        const d = plan.duration;
        switch (durationFilter) {
          case "1-7": return d >= 1 && d <= 7;
          case "8-15": return d >= 8 && d <= 15;
          case "16-30": return d >= 16 && d <= 30;
          case "30+": return d > 30;
          default: return true;
        }
      });
    }

    // Filter by Data
    if (dataFilter !== "all") {
      result = result.filter(plan => {
        const gb = plan.volume / 1024 / 1024 / 1024;
        switch (dataFilter) {
          case "under_3": return gb < 3;
          case "3_10": return gb >= 3 && gb < 10;
          case "10_plus": return gb >= 10;
          case "20_plus": return gb >= 20;
          case "50_plus": return gb >= 50;
          default: return true;
        }
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sort) {
        case "price_asc": return a.price - b.price;
        case "price_desc": return b.price - a.price;
        case "data_asc": return a.volume - b.volume;
        case "data_desc": return b.volume - a.volume;
        case "duration_asc": return a.duration - b.duration;
        case "duration_desc": return b.duration - a.duration;
        default: return 0;
      }
    });

    return result;
  }, [plans, sort, durationFilter, dataFilter]);

  const resetFilters = () => {
    setSort("price_asc");
    setDurationFilter("all");
    setDataFilter("all");
  };

  const activeFilterCount = (durationFilter !== "all" ? 1 : 0) + (dataFilter !== "all" ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          
          {/* Sort Control */}
          <div className="flex items-center gap-2 min-w-fit">
            <ArrowDownUp className="h-4 w-4 text-[var(--voyage-muted)]" />
            <span className="text-sm text-[var(--voyage-muted)] hidden sm:inline">Sort by:</span>
            <div className="relative">
              <select 
                value={sort} 
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="appearance-none bg-[var(--voyage-bg)] text-white text-sm rounded-lg border border-[var(--voyage-border)] pl-3 pr-8 py-2 focus:outline-none focus:border-[var(--voyage-accent)]"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="data_asc">Data: Low to High</option>
                <option value="data_desc">Data: High to Low</option>
                <option value="duration_asc">Duration: Short to Long</option>
                <option value="duration_desc">Duration: Long to Short</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--voyage-muted)] pointer-events-none" />
            </div>
          </div>

          <div className="h-6 w-px bg-[var(--voyage-border)] hidden md:block" />

          {/* Quick Filters (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
             <Filter className="h-4 w-4 text-[var(--voyage-muted)]" />
             
             <div className="relative">
               <select 
                  value={durationFilter} 
                  onChange={(e) => setDurationFilter(e.target.value as DurationFilter)}
                  className="appearance-none bg-[var(--voyage-bg)] text-white text-sm rounded-lg border border-[var(--voyage-border)] pl-3 pr-8 py-2 focus:outline-none focus:border-[var(--voyage-accent)]"
               >
                  <option value="all">All Durations</option>
                  <option value="1-7">1 - 7 Days</option>
                  <option value="8-15">8 - 15 Days</option>
                  <option value="16-30">16 - 30 Days</option>
                  <option value="30+">30+ Days</option>
               </select>
               <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--voyage-muted)] pointer-events-none" />
             </div>

             <div className="relative">
               <select 
                  value={dataFilter} 
                  onChange={(e) => setDataFilter(e.target.value as DataFilter)}
                  className="appearance-none bg-[var(--voyage-bg)] text-white text-sm rounded-lg border border-[var(--voyage-border)] pl-3 pr-8 py-2 focus:outline-none focus:border-[var(--voyage-accent)]"
               >
                  <option value="all">All Data Sizes</option>
                  <option value="under_3">&lt; 3 GB</option>
                  <option value="3_10">3 GB - 10 GB</option>
                  <option value="10_plus">10 GB+</option>
                  <option value="20_plus">20 GB+</option>
                  <option value="50_plus">50 GB+</option>
               </select>
               <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--voyage-muted)] pointer-events-none" />
             </div>
          </div>
          
          {/* Mobile Filter Toggle */}
          <Button 
            variant="outline" 
            size="sm" 
            className="md:hidden flex items-center gap-2 ml-auto"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <Filter className="h-4 w-4" /> Filters
            {activeFilterCount > 0 && (
              <span className="bg-[var(--voyage-accent)] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Reset Button */}
        {(sort !== "price_asc" || durationFilter !== "all" || dataFilter !== "all") && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetFilters}
            className="text-[var(--voyage-muted)] hover:text-white flex items-center gap-2 whitespace-nowrap"
          >
            <X className="h-4 w-4" /> Reset
          </Button>
        )}
      </div>

      {/* Mobile Filters Panel */}
      {isFiltersOpen && (
         <div className="md:hidden bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-xl p-4 space-y-4 animate-in slide-in-from-top-2">
            <div className="space-y-2">
               <label className="text-xs text-[var(--voyage-muted)] uppercase font-bold">Duration</label>
               <select 
                  value={durationFilter} 
                  onChange={(e) => setDurationFilter(e.target.value as DurationFilter)}
                  className="w-full bg-[var(--voyage-bg)] text-white text-sm rounded-lg border border-[var(--voyage-border)] px-3 py-2"
               >
                  <option value="all">All Durations</option>
                  <option value="1-7">1 - 7 Days</option>
                  <option value="8-15">8 - 15 Days</option>
                  <option value="16-30">16 - 30 Days</option>
                  <option value="30+">30+ Days</option>
               </select>
            </div>
            <div className="space-y-2">
               <label className="text-xs text-[var(--voyage-muted)] uppercase font-bold">Data</label>
               <select 
                  value={dataFilter} 
                  onChange={(e) => setDataFilter(e.target.value as DataFilter)}
                  className="w-full bg-[var(--voyage-bg)] text-white text-sm rounded-lg border border-[var(--voyage-border)] px-3 py-2"
               >
                  <option value="all">All Data Sizes</option>
                  <option value="under_3">&lt; 3 GB</option>
                  <option value="3_10">3 GB - 10 GB</option>
                  <option value="10_plus">10 GB+</option>
                  <option value="20_plus">20 GB+</option>
                  <option value="50_plus">50 GB+</option>
               </select>
            </div>
         </div>
      )}

      {/* Results Grid */}
      {filteredPlans.length === 0 ? (
         <div className="text-center py-20 bg-[var(--voyage-card)] rounded-xl border border-[var(--voyage-border)]">
            <p className="text-[var(--voyage-muted)]">{emptyMessage}</p>
            <Button variant="link" onClick={resetFilters} className="mt-2 text-[var(--voyage-accent)]">
              Clear filters
            </Button>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {filteredPlans.map((plan) => renderItem(plan))}
        </div>
      )}
    </div>
  );
}

