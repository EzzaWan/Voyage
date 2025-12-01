"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QrCode, Signal, RefreshCw, Calendar, HardDrive, Download, Copy, CheckCircle2 } from "lucide-react";
import Image from "next/image";

import Link from "next/link";

interface PlanDetails {
  name?: string;
  packageCode?: string;
  locationCode?: string;
  volume?: number;
  duration?: number;
  durationUnit?: string;
}

interface EsimProfile {
  id: string;
  iccid: string;
  status?: string;
  esimStatus?: string;
  planName?: string; // If we join this in backend, or derived
  totalVolume?: string | null; // BigInt converted to string
  orderUsage?: string | null; // BigInt converted to string
  qrCodeUrl?: string | null;
  ac?: string | null;
  smdpStatus?: string | null;
  expiredTime?: string | null;
  esimTranNo?: string;
  planDetails?: PlanDetails;
  order?: {
    id: string;
    planId: string;
    status: string;
  };
}

// Helper function to format user-friendly status
function getStatusDisplay(esimStatus: string | undefined): { label: string; color: string } {
  if (!esimStatus) return { label: "Pending", color: "bg-gray-500/20 text-gray-400" };
  
  const statusMap: Record<string, { label: string; color: string }> = {
    GOT_RESOURCE: { label: "Ready", color: "bg-green-500/20 text-green-400 hover:bg-green-500/30" },
    IN_USE: { label: "Active", color: "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30" },
    EXPIRED: { label: "Expired", color: "bg-red-500/20 text-red-400 hover:bg-red-500/30" },
    SUSPENDED: { label: "Suspended", color: "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30" },
  };
  
  return statusMap[esimStatus] || { label: esimStatus, color: "bg-gray-500/20 text-gray-400" };
}

// Helper function to format bytes to readable format
function formatBytes(bytes: string | number | null | undefined): string {
  if (bytes === null || bytes === undefined) return "N/A";
  try {
    // Handle BigInt string conversion or number
    const num = typeof bytes === 'string' 
      ? (bytes === "0" || bytes === "" ? 0 : Number(bytes))
      : bytes;
    if (isNaN(num) || num < 0) return "N/A";
    if (num === 0) return "0 B";
    
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    
    // Find the appropriate unit
    let sizeIndex = 0;
    let size = num;
    
    while (size >= k && sizeIndex < sizes.length - 1) {
      size /= k;
      sizeIndex++;
    }
    
    // Format with appropriate decimal places
    const decimals = sizeIndex === 0 ? 0 : 2;
    return `${size.toFixed(decimals)} ${sizes[sizeIndex]}`;
  } catch (e) {
    console.error('[formatBytes] Error formatting bytes:', bytes, e);
    return "N/A";
  }
}

// Helper function to format plan display name
function formatPlanName(planDetails: PlanDetails | undefined, planId?: string): string {
  if (planDetails?.name) {
    return planDetails.name;
  }
  
  if (planDetails) {
    const location = planDetails.locationCode || '';
    const volume = planDetails.volume ? formatBytes(planDetails.volume) : '';
    const duration = planDetails.duration ? `${planDetails.duration} ${planDetails.durationUnit || 'Days'}` : '';
    
    const parts = [location, volume, duration].filter(Boolean);
    return parts.length > 0 ? parts.join(' • ') : planId || 'Plan';
  }
  
  return planId || 'Unknown Plan';
}

export default function MyEsimsPage() {
  const { user, isLoaded } = useUser();
  const [esims, setEsims] = useState<EsimProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEsim, setSelectedEsim] = useState<EsimProfile | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchEsims = async () => {
      try {
        const userEmail = user.primaryEmailAddress?.emailAddress;
        if (!userEmail) {
          setLoading(false);
          return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/esims?email=${encodeURIComponent(userEmail)}`);
        if (res.ok) {
          const data = await res.json();
          console.log('[MY-ESIMS] Received profiles:', data);
          // Debug: Log specific fields
          if (data && data.length > 0) {
            console.log('[MY-ESIMS] First profile details:', {
              totalVolume: data[0].totalVolume,
              expiredTime: data[0].expiredTime,
              esimStatus: data[0].esimStatus,
            });
          }
          setEsims(data);
        } else {
          const errorText = await res.text();
          console.error('[MY-ESIMS] API error:', res.status, errorText);
        }
      } catch (e) {
        console.error('[MY-ESIMS] Fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchEsims();
  }, [user, isLoaded]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">My eSIMs</h1>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={async () => {
            setLoading(true);
            const userEmail = user?.primaryEmailAddress?.emailAddress;
            if (userEmail) {
              try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/esims?email=${encodeURIComponent(userEmail)}`);
                if (res.ok) {
                  const data = await res.json();
                  setEsims(data);
                }
              } catch (e) {
                console.error('[MY-ESIMS] Refresh error:', e);
              }
            }
            setLoading(false);
          }}
        >
           <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           {[...Array(3)].map((_, i) => (
             <Skeleton key={i} className="h-64 w-full rounded-xl bg-[var(--voyage-card)]" />
           ))}
        </div>
      ) : esims.length === 0 ? (
        <div className="text-center py-20 bg-[var(--voyage-card)] rounded-xl border border-[var(--voyage-border)]">
           <Signal className="h-12 w-12 mx-auto text-[var(--voyage-muted)] mb-4 opacity-50" />
           <h3 className="text-xl font-bold text-white mb-2">No eSIMs yet</h3>
           <p className="text-[var(--voyage-muted)] mb-6">Get your first travel data plan today.</p>
           <Button className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)]">Browse Plans</Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           {esims.map((esim) => {
             const status = getStatusDisplay(esim.esimStatus);
             return (
               <Link key={esim.id} href={`/my-esims/${esim.iccid}`} className="block">
                 <Card className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] overflow-hidden hover:border-[var(--voyage-accent)] transition-colors cursor-pointer">
                    <div className="h-2 bg-gradient-to-r from-[var(--voyage-accent)] to-purple-500" />
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                       <div className="flex-1 min-w-0 pr-2">
                          <h3 className="font-bold text-lg text-white mb-1 truncate">
                            {formatPlanName(esim.planDetails, esim.order?.planId)}
                          </h3>
                          {esim.planDetails?.locationCode && (
                            <p className="text-sm text-[var(--voyage-muted)]">
                              {esim.planDetails.locationCode}
                            </p>
                          )}
                       </div>
                       <Badge className={status.color}>
                          {status.label}
                       </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <div className="p-3 bg-[var(--voyage-bg-light)] rounded-lg border border-[var(--voyage-border)] flex items-center justify-between">
                           <span className="text-sm text-[var(--voyage-muted)]">ICCID</span>
                           <span className="font-mono text-sm text-white">{esim.iccid}</span>
                        </div>
                        
                        {esim.totalVolume !== null && esim.totalVolume !== undefined && (
                          <div className="p-3 bg-[var(--voyage-bg-light)] rounded-lg border border-[var(--voyage-border)] flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <HardDrive className="h-4 w-4 text-[var(--voyage-muted)]" />
                                <span className="text-sm text-[var(--voyage-muted)]">Data</span>
                             </div>
                             <span className="text-sm text-white font-medium">{formatBytes(esim.totalVolume)}</span>
                          </div>
                        )}
                        
                        {esim.expiredTime && (
                          <div className="p-3 bg-[var(--voyage-bg-light)] rounded-lg border border-[var(--voyage-border)] flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-[var(--voyage-muted)]" />
                                <span className="text-sm text-[var(--voyage-muted)]">Expires</span>
                             </div>
                             <span className="text-sm text-white">
                                {(() => {
                                  try {
                                    const date = new Date(esim.expiredTime);
                                    if (isNaN(date.getTime())) return "N/A";
                                    return date.toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    });
                                  } catch (e) {
                                    return "N/A";
                                  }
                                })()}
                             </span>
                          </div>
                        )}
                     </div>
                     
                     {esim.qrCodeUrl && (
                        <Button 
                          className="w-full bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedEsim(esim);
                          }}
                        >
                           <QrCode className="mr-2 h-4 w-4" /> View QR Code
                        </Button>
                     )}

                     <Link href={`/my-esims/${esim.iccid}/topup`} className="block w-full" onClick={(e) => e.stopPropagation()}>
                       <Button 
                          className="w-full h-10 text-md font-bold bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white shadow-[0_0_20px_rgba(30,144,255,0.3)] transition-all mt-2"
                       >
                          Top Up
                       </Button>
                     </Link>
                     
                     {esim.ac && (
                        <Button 
                          variant="outline"
                          className="w-full bg-[var(--voyage-bg-light)] hover:bg-[var(--voyage-border)] text-white border border-[var(--voyage-border)]"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            await navigator.clipboard.writeText(esim.ac);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                        >
                           {copied ? (
                              <>
                                 <CheckCircle2 className="mr-2 h-4 w-4" /> Copied!
                              </>
                           ) : (
                              <>
                                 <Copy className="mr-2 h-4 w-4" /> Copy Activation Code
                              </>
                           )}
                        </Button>
                     )}
                  </CardContent>
                 </Card>
               </Link>
             );
           })}
        </div>
      )}
      
      {/* QR Code Modal */}
      {selectedEsim && selectedEsim.qrCodeUrl && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEsim(null)}
        >
          <div 
            className="bg-[var(--voyage-card)] rounded-xl border border-[var(--voyage-border)] p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Install eSIM</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedEsim(null)}
                className="text-[var(--voyage-muted)] hover:text-white"
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-[var(--voyage-muted)]">
                Scan this QR code with your device to install the eSIM profile.
              </p>
              
              <div className="bg-white p-4 rounded-lg flex items-center justify-center">
                <Image
                  src={selectedEsim.qrCodeUrl}
                  alt="eSIM QR Code"
                  width={300}
                  height={300}
                  className="w-full h-auto"
                />
              </div>
              
              {selectedEsim.ac && (
                <div className="p-3 bg-[var(--voyage-bg-light)] rounded-lg border border-[var(--voyage-border)]">
                  <p className="text-xs text-[var(--voyage-muted)] mb-2">Activation Code:</p>
                  <p className="font-mono text-sm text-white break-all">{selectedEsim.ac}</p>
                </div>
              )}
              
              <Button
                className="w-full bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white"
                onClick={() => setSelectedEsim(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
