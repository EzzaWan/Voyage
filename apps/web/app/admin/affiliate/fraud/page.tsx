"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminTable } from "@/components/admin/AdminTable";
import { Search, Shield, AlertTriangle, XCircle, CheckCircle, User, Globe, CreditCard, Mail } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { safeFetch } from "@/lib/safe-fetch";

interface FraudSummary {
  affiliate: {
    id: string;
    referralCode: string;
    user: {
      id: string;
      email: string;
      name: string | null;
    };
  };
  fraudScore: {
    totalScore: number;
    riskLevel: string;
    updatedAt: string;
  };
  events: Array<{
    id: string;
    type: string;
    score: number;
    metadata: any;
    createdAt: string;
    userId: string | null;
    relatedId: string | null;
  }>;
  stats: {
    totalClicks: number;
    totalSignups: number;
    uniqueIPs: number;
    uniqueDevices: number;
    uniqueCountries: number;
    deviceCounts: Array<{ fingerprint: string; count: number }>;
    ips: string[];
    countries: string[];
  };
  signups: Array<{
    userId: string;
    userEmail: string;
    ipAddress: string | null;
    deviceFingerprint: string | null;
    country: string | null;
    createdAt: string;
  }>;
}

export default function AdminFraudDashboardPage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [frozenFilter, setFrozenFilter] = useState<string>("");
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [selectedAffiliate, setSelectedAffiliate] = useState<string | null>(null);
  const [fraudDetails, setFraudDetails] = useState<FraudSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    searchAffiliates();
  }, [riskFilter, frozenFilter]);

  const searchAffiliates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery && searchQuery.trim()) params.append("q", searchQuery.trim());
      if (riskFilter && riskFilter.trim()) params.append("riskLevel", riskFilter.trim());
      if (frozenFilter && frozenFilter.trim()) params.append("frozen", frozenFilter.trim());

      const queryString = params.toString();
      const url = queryString 
        ? `${apiUrl}/admin/affiliate/fraud/search?${queryString}`
        : `${apiUrl}/admin/affiliate/fraud/search`;

      const data = await safeFetch<{ affiliates: any[] }>(
        url,
        {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
        },
      );

      setAffiliates(data.affiliates || []);
    } catch (error) {
      console.error("Failed to search affiliates:", error);
      toast({
        title: "Error",
        description: "Failed to search affiliates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFraudDetails = async (affiliateId: string) => {
    setDetailsLoading(true);
    setSelectedAffiliate(affiliateId);
    try {
      const data = await safeFetch<FraudSummary>(`${apiUrl}/admin/affiliate/fraud/${affiliateId}`, {
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
      });

      setFraudDetails(data);
    } catch (error) {
      console.error("Failed to load fraud details:", error);
      toast({
        title: "Error",
        description: "Failed to load fraud details",
        variant: "destructive",
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const freezeAffiliate = async (affiliateId: string) => {
    try {
      await safeFetch(`${apiUrl}/admin/affiliate/fraud/${affiliateId}/freeze`, {
        method: "POST",
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
      });

      toast({
        title: "Success",
        description: "Affiliate frozen",
      });

      if (selectedAffiliate === affiliateId) {
        loadFraudDetails(affiliateId);
      }
      searchAffiliates();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to freeze affiliate",
        variant: "destructive",
      });
    }
  };

  const unfreezeAffiliate = async (affiliateId: string) => {
    try {
      await safeFetch(`${apiUrl}/admin/affiliate/fraud/${affiliateId}/unfreeze`, {
        method: "POST",
        headers: {
          "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
        },
      });

      toast({
        title: "Success",
        description: "Affiliate unfrozen",
      });

      if (selectedAffiliate === affiliateId) {
        loadFraudDetails(affiliateId);
      }
      searchAffiliates();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unfreeze affiliate",
        variant: "destructive",
      });
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "frozen":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      default:
        return "bg-green-500/20 text-green-400 border-green-500/50";
    }
  };

  const formatFraudEventType = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatFraudEventDetails = (metadata: any): string => {
    if (!metadata || typeof metadata !== 'object') {
      return 'No details available';
    }

    const details: string[] = [];
    
    if (metadata.deviceFingerprint) {
      details.push(`Device: ${metadata.deviceFingerprint.substring(0, 8)}...`);
    }
    
    if (metadata.ipAddress) {
      details.push(`IP: ${metadata.ipAddress}`);
    }
    
    if (metadata.otherAffiliateIds && Array.isArray(metadata.otherAffiliateIds)) {
      details.push(`Other Affiliates: ${metadata.otherAffiliateIds.length}`);
      if (metadata.otherAffiliateIds.length > 0) {
        details.push(`IDs: ${metadata.otherAffiliateIds.slice(0, 2).join(', ')}${metadata.otherAffiliateIds.length > 2 ? '...' : ''}`);
      }
    }
    
    if (metadata.email) {
      details.push(`Email: ${metadata.email}`);
    }
    
    if (metadata.cardLast4) {
      details.push(`Card: ****${metadata.cardLast4}`);
    }
    
    if (metadata.country) {
      details.push(`Country: ${metadata.country}`);
    }
    
    if (metadata.reason) {
      details.push(`Reason: ${metadata.reason}`);
    }
    
    if (metadata.count !== undefined) {
      details.push(`Count: ${metadata.count}`);
    }
    
    if (metadata.threshold !== undefined) {
      details.push(`Threshold: ${metadata.threshold}`);
    }

    // If we have other fields not covered above, include them
    const coveredKeys = ['deviceFingerprint', 'ipAddress', 'otherAffiliateIds', 'email', 'cardLast4', 'country', 'reason', 'count', 'threshold'];
    const otherKeys = Object.keys(metadata).filter(key => !coveredKeys.includes(key));
    
    if (otherKeys.length > 0 && details.length === 0) {
      // If no standard fields found, show a simplified version of the object
      return JSON.stringify(metadata, null, 2).substring(0, 150) + (JSON.stringify(metadata).length > 150 ? '...' : '');
    }

    return details.length > 0 ? details.join(' • ') : 'No details available';
  };

  const columns = useMemo(() => [
    {
      header: "Email",
      accessor: (row: any) => row.userEmail,
    },
    {
      header: "Referral Code",
      accessor: (row: any) => row.referralCode,
      className: "font-mono font-bold text-[var(--voyage-accent)]",
    },
    {
      header: "Risk Level",
      accessor: (row: any) => row.riskLevel.toUpperCase(),
      className: (row: any) => getRiskBadgeColor(row.riskLevel),
    },
    {
      header: "Fraud Score",
      accessor: (row: any) => row.fraudScore.toString(),
      className: (row: any) => row.fraudScore >= 60 ? "text-red-400 font-bold" : row.fraudScore >= 40 ? "text-orange-400" : "text-white",
    },
    {
      header: "Status",
      accessor: (row: any) => row.isFrozen ? "Frozen" : "Active",
      className: (row: any) => row.isFrozen ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400",
    },
    {
      header: "Actions",
      accessor: (row: any) => row.isFrozen ? "Frozen - Click to manage" : "Active - Click to manage",
      className: "text-xs text-[var(--voyage-muted)]",
    },
  ], []);

  const handleRowClick = useCallback((row: any) => {
    loadFraudDetails(row.id);
  }, [loadFraudDetails]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Affiliate Fraud Dashboard</h1>
        <p className="text-[var(--voyage-muted)]">Monitor and manage affiliate fraud detection</p>
      </div>

      {/* Search and Filters */}
      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <CardTitle className="text-white">Search Affiliates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by email, user ID, or referral code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    searchAffiliates();
                  }
                }}
                className="bg-[var(--voyage-bg-light)] border-[var(--voyage-border)]"
              />
            </div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-[var(--voyage-bg-light)] border border-[var(--voyage-border)] text-white"
            >
              <option value="">All Risk Levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="frozen">Frozen</option>
            </select>
            <select
              value={frozenFilter}
              onChange={(e) => setFrozenFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-[var(--voyage-bg-light)] border border-[var(--voyage-border)] text-white"
            >
              <option value="">All Statuses</option>
              <option value="true">Frozen Only</option>
              <option value="false">Active Only</option>
            </select>
            <Button onClick={searchAffiliates} className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)]">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Affiliates List */}
      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <CardTitle className="text-white">Affiliates</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-[var(--voyage-muted)]">Loading...</p>
          ) : affiliates.length === 0 ? (
            <p className="text-[var(--voyage-muted)] text-center py-8">No affiliates found</p>
          ) : (
            <AdminTable
              data={affiliates}
              columns={columns}
              onRowClick={handleRowClick}
              emptyMessage="No affiliates found"
            />
          )}
        </CardContent>
      </Card>

      {/* Fraud Details */}
      {selectedAffiliate && (
        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Fraud Details</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedAffiliate(null);
                  setFraudDetails(null);
                }}
              >
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {detailsLoading ? (
              <p className="text-[var(--voyage-muted)]">Loading details...</p>
            ) : fraudDetails ? (
              <div className="space-y-6">
                {/* Fraud Score Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-[var(--voyage-bg-light)] border-[var(--voyage-border)]">
                    <CardContent className="p-4">
                      <p className="text-sm text-[var(--voyage-muted)] mb-1">Fraud Score</p>
                      <p className={`text-3xl font-bold ${fraudDetails.fraudScore.totalScore >= 60 ? "text-red-400" : fraudDetails.fraudScore.totalScore >= 40 ? "text-orange-400" : "text-white"}`}>
                        {fraudDetails.fraudScore.totalScore}
                      </p>
                      <Badge className={`mt-2 ${getRiskBadgeColor(fraudDetails.fraudScore.riskLevel)}`}>
                        {fraudDetails.fraudScore.riskLevel.toUpperCase()}
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card className="bg-[var(--voyage-bg-light)] border-[var(--voyage-border)]">
                    <CardContent className="p-4">
                      <p className="text-sm text-[var(--voyage-muted)] mb-1">Total Events</p>
                      <p className="text-3xl font-bold text-white">{fraudDetails.events.length}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-[var(--voyage-bg-light)] border-[var(--voyage-border)]">
                    <CardContent className="p-4">
                      <p className="text-sm text-[var(--voyage-muted)] mb-1">Signups</p>
                      <p className="text-3xl font-bold text-white">{fraudDetails.stats.totalSignups}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Stats */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[var(--voyage-bg-light)] rounded-lg p-4">
                      <p className="text-sm text-[var(--voyage-muted)]">Unique IPs</p>
                      <p className="text-xl font-bold text-white">{fraudDetails.stats.uniqueIPs}</p>
                    </div>
                    <div className="bg-[var(--voyage-bg-light)] rounded-lg p-4">
                      <p className="text-sm text-[var(--voyage-muted)]">Unique Devices</p>
                      <p className="text-xl font-bold text-white">{fraudDetails.stats.uniqueDevices}</p>
                    </div>
                    <div className="bg-[var(--voyage-bg-light)] rounded-lg p-4">
                      <p className="text-sm text-[var(--voyage-muted)]">Countries</p>
                      <p className="text-xl font-bold text-white">{fraudDetails.stats.uniqueCountries}</p>
                    </div>
                    <div className="bg-[var(--voyage-bg-light)] rounded-lg p-4">
                      <p className="text-sm text-[var(--voyage-muted)]">Total Clicks</p>
                      <p className="text-xl font-bold text-white">{fraudDetails.stats.totalClicks}</p>
                    </div>
                  </div>
                </div>

                {/* Device Fingerprints */}
                {fraudDetails.stats.deviceCounts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Device Fingerprints</h3>
                    <div className="bg-[var(--voyage-bg-light)] rounded-lg p-4 space-y-2">
                      {fraudDetails.stats.deviceCounts
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 10)
                        .map((device, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <code className="text-[var(--voyage-muted)] font-mono text-xs truncate flex-1">
                              {device.fingerprint.substring(0, 32)}...
                            </code>
                            <Badge variant="outline" className="ml-4">
                              {device.count} {device.count === 1 ? "use" : "uses"}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Fraud Events */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Fraud Events</h3>
                  <div className="bg-[var(--voyage-bg-light)] rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-[var(--voyage-card)] border-b border-[var(--voyage-border)]">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm text-white">Date</th>
                          <th className="px-4 py-2 text-left text-sm text-white">Type</th>
                          <th className="px-4 py-2 text-left text-sm text-white">Score</th>
                          <th className="px-4 py-2 text-left text-sm text-white">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fraudDetails.events.slice(0, 50).map((event) => (
                          <tr key={event.id} className="border-b border-[var(--voyage-border)]">
                            <td className="px-4 py-2 text-sm text-[var(--voyage-muted)]">
                              {new Date(event.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <Badge variant="outline" className="text-xs">
                                {formatFraudEventType(event.type)}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-sm text-white font-medium">{event.score}</td>
                            <td className="px-4 py-2 text-sm text-[var(--voyage-muted)] max-w-md">
                              <div className="text-xs whitespace-normal break-words">
                                {formatFraudEventDetails(event.metadata)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Signups List */}
                {fraudDetails.signups.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Signups</h3>
                    <div className="bg-[var(--voyage-bg-light)] rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-[var(--voyage-card)] border-b border-[var(--voyage-border)]">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm text-white">Email</th>
                            <th className="px-4 py-2 text-left text-sm text-white">IP</th>
                            <th className="px-4 py-2 text-left text-sm text-white">Country</th>
                            <th className="px-4 py-2 text-left text-sm text-white">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fraudDetails.signups.slice(0, 20).map((signup) => (
                            <tr key={signup.userId} className="border-b border-[var(--voyage-border)]">
                              <td className="px-4 py-2 text-sm text-white">{signup.userEmail}</td>
                              <td className="px-4 py-2 text-sm text-[var(--voyage-muted)] font-mono text-xs">
                                {signup.ipAddress || "N/A"}
                              </td>
                              <td className="px-4 py-2 text-sm text-[var(--voyage-muted)]">{signup.country || "N/A"}</td>
                              <td className="px-4 py-2 text-sm text-[var(--voyage-muted)]">
                                {new Date(signup.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[var(--voyage-muted)]">Failed to load fraud details</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

