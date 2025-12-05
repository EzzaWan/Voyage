"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, Search, Globe, ExternalLink, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { safeFetch } from "@/lib/safe-fetch";

interface Country {
  code: string;
  name: string;
}

interface DeviceCompatibility {
  model: string;
  brand: string;
  supported: boolean;
  notes: string[];
  regionalNotes: Record<string, string>;
}

export default function DeviceCheckPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  const [deviceQuery, setDeviceQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeviceCompatibility | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const data = await safeFetch<any>(`${apiUrl}/countries`, { showToast: false });
        // Handle both array and { locationList: [...] } formats
        const countriesArray = Array.isArray(data) ? data : (data.locationList || []);
        setCountries(countriesArray.map((c: any) => ({ code: c.code, name: c.name || c.code })));
      } catch (error) {
        console.error("Failed to fetch countries:", error);
      }
    };
    fetchCountries();
  }, [apiUrl]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (deviceQuery.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const data = await safeFetch<{ models: string[] }>(`${apiUrl}/device/models?q=${encodeURIComponent(deviceQuery)}`, { showToast: false });
        setSuggestions(data.models || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions([]);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [deviceQuery, apiUrl]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCheckCompatibility = async () => {
    if (!selectedDevice) {
      alert("Please select a device model");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ model: selectedDevice });
      if (selectedCountry) {
        params.append("country", selectedCountry);
      }

      const data = await safeFetch<DeviceCompatibility>(`${apiUrl}/device/check?${params.toString()}`, {
        errorMessage: "Failed to check device compatibility. Please try again.",
      });
      setResult(data);
      if (selectedDevice) {
        localStorage.setItem('deviceModel', selectedDevice);
      }
    } catch (error) {
      console.error("Failed to check compatibility:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (model: string) => {
    setSelectedDevice(model);
    setDeviceQuery(model);
    setShowSuggestions(false);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--voyage-muted)] hover:text-[var(--voyage-accent)] transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Device Compatibility Checker</h1>
          <p className="text-[var(--voyage-muted)]">
            Check if your device supports eSIM before purchasing
          </p>
        </div>

        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)] mb-6">
          <CardHeader>
            <CardTitle className="text-white">Search Your Device</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative" ref={suggestionsRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--voyage-muted)]" />
                <Input
                  type="text"
                  placeholder="e.g., iPhone 15, Samsung Galaxy S24..."
                  value={deviceQuery}
                  onChange={(e) => {
                    setDeviceQuery(e.target.value);
                    setSelectedDevice("");
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  className="pl-10 bg-[var(--voyage-bg)] border-[var(--voyage-border)] text-white placeholder:text-[var(--voyage-muted)]"
                />
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((model) => (
                    <button
                      key={model}
                      onClick={() => handleSuggestionClick(model)}
                      className="w-full text-left px-4 py-2 hover:bg-[var(--voyage-bg-light)] text-white transition-colors"
                    >
                      {model}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--voyage-muted)]" />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full h-10 pl-10 pr-3 rounded-md border border-[var(--voyage-border)] bg-[var(--voyage-bg)] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--voyage-accent)]"
              >
                <option value="">Select country (optional)</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleCheckCompatibility}
              disabled={!selectedDevice || loading}
              className="w-full bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white"
            >
              {loading ? "Checking..." : "Check Compatibility"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Compatibility Result</CardTitle>
                <Badge
                  className={
                    result.supported
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }
                >
                  {result.supported ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1 inline" />
                      SUPPORTED
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-1 inline" />
                      NOT SUPPORTED
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-[var(--voyage-muted)]">Device</p>
                <p className="text-lg font-semibold text-white">
                  {result.brand} {result.model}
                </p>
              </div>

              {result.notes && result.notes.length > 0 && (
                <div>
                  <p className="text-sm text-[var(--voyage-muted)] mb-2">Important Notes</p>
                  <div className="space-y-2">
                    {result.notes.map((note, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-3 bg-[var(--voyage-bg-light)] rounded-md border border-[var(--voyage-border)]"
                      >
                        <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-white">{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCountry && result.regionalNotes?.[selectedCountry.toUpperCase()] && (
                <div>
                  <p className="text-sm text-[var(--voyage-muted)] mb-2">Country-Specific Information</p>
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                    <p className="text-sm text-yellow-400">
                      {result.regionalNotes[selectedCountry.toUpperCase()]}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-4 border-t border-[var(--voyage-border)]">
                {result.supported ? (
                  <>
                    <Link href="/countries">
                      <Button variant="outline" className="border-[var(--voyage-border)] text-white hover:bg-[var(--voyage-bg-light)]">
                        Browse Plans
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/support">
                      <Button variant="secondary" className="bg-[var(--voyage-bg-light)] text-white hover:bg-[var(--voyage-bg)]">
                        View Installation Guide
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link href="/support">
                    <Button variant="secondary" className="bg-[var(--voyage-bg-light)] text-white hover:bg-[var(--voyage-bg)]">
                      Contact Support
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
