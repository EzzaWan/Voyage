"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PriceTag } from "@/components/PriceTag";
import { Wifi, Globe, HardDrive, Calendar, Clock, RefreshCw, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useParams } from "next/navigation";

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
    const num = typeof bytes === 'string' 
      ? (bytes === "0" || bytes === "" ? 0 : Number(bytes))
      : bytes;
    if (isNaN(num) || num < 0) return "N/A";
    if (num === 0) return "0 B";
    
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    let sizeIndex = 0;
    let size = num;
    while (size >= k && sizeIndex < sizes.length - 1) {
      size /= k;
      sizeIndex++;
    }
    return `${size.toFixed(2)} ${sizes[sizeIndex]}`;
  } catch (e) {
    return "N/A";
  }
}

export default function EsimDetailPage() {
  const { iccid } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State to store plan details for top-ups
  const [planDetailsMap, setPlanDetailsMap] = useState<Record<string, any>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Profile
      const resProfile = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/esim/${iccid}`);
      if (resProfile.ok) {
        const data = await resProfile.json();
        setProfile(data);
      }

      // Fetch History
      const resHistory = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/esim/topups?iccid=${iccid}`);
      if (resHistory.ok) {
        const data = await resHistory.json();
        setHistory(data);
        
        // Fetch plan details for each top-up
        const planCodes = [...new Set(data.map((item: any) => item.planCode).filter(Boolean))];
        const planDetails: Record<string, any> = {};
        
        await Promise.all(
          planCodes.map(async (planCode: string) => {
            try {
              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/${planCode}`);
              if (res.ok) {
                const plan = await res.json();
                planDetails[planCode] = plan;
              }
            } catch (e) {
              console.error(`Failed to fetch plan ${planCode}:`, e);
            }
          })
        );
        
        setPlanDetailsMap(planDetails);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (iccid) fetchData();
  }, [iccid]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-white">
        Loading details...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-white">
        Profile not found
      </div>
    );
  }

  const sizeGB = profile.totalVolume ? formatBytes(profile.totalVolume) : "0 GB";
  
  // Format expiry date properly
  const formatExpiryDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return "N/A";
    }
  };
  
  const expiryDate = formatExpiryDate(profile.expiredTime);
  const statusDisplay = getStatusDisplay(profile.esimStatus);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Back Button */}
      <Link href="/my-esims" className="inline-flex items-center text-[var(--voyage-muted)] hover:text-white transition-colors mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to My eSIMs
      </Link>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">eSIM Details</h1>
        <Button variant="outline" size="icon" onClick={fetchData}>
           <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Header Card (Matching PlanDetails) */}
      <div className="bg-[var(--voyage-card)]/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-[var(--voyage-border)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
              <Wifi className="h-64 w-64 text-[var(--voyage-accent)]" />
          </div>
          
          <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                  <Badge className={getStatusDisplay(profile.esimStatus).color}>
                      {getStatusDisplay(profile.esimStatus).label}
                  </Badge>
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium border border-purple-500/30">
                      eSIM
                  </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {profile.planDetails?.name || profile.iccid}
              </h1>
              <div className="flex flex-wrap gap-6 text-[var(--voyage-muted)]">
                 <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-[var(--voyage-accent)]" />
                    <span>{profile.planDetails?.location || "Global"} Region</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-[var(--voyage-accent)]" />
                    <span>4G/LTE Speed</span>
                 </div>
              </div>
          </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-[var(--voyage-card)] rounded-xl p-5 border border-[var(--voyage-border)] flex flex-col items-center justify-center text-center">
            <HardDrive className="h-5 w-5 text-[var(--voyage-accent)] mb-2" />
            <span className="text-[var(--voyage-muted)] text-sm mb-1">Data Balance</span>
            <span className="text-2xl font-bold text-white">{sizeGB}</span>
         </div>
         <div className="bg-[var(--voyage-card)] rounded-xl p-5 border border-[var(--voyage-border)] flex flex-col items-center justify-center text-center">
            <Calendar className="h-5 w-5 text-[var(--voyage-accent)] mb-2" />
            <span className="text-[var(--voyage-muted)] text-sm mb-1">Expires</span>
            <span className="text-2xl font-bold text-white">{expiryDate}</span>
         </div>
         <div className="bg-[var(--voyage-card)] rounded-xl p-5 border border-[var(--voyage-border)] flex flex-col items-center justify-center text-center">
            <span className="text-[var(--voyage-muted)] text-sm mb-1">Status</span>
            <span className="text-xl font-bold text-white">{statusDisplay.label}</span>
         </div>
         <div className="bg-[var(--voyage-card)] rounded-xl p-5 border border-[var(--voyage-border)] flex flex-col items-center justify-center text-center">
            <span className="text-[var(--voyage-muted)] text-sm mb-1">ICCID</span>
            <span className="text-sm font-mono text-white truncate max-w-full px-2">{profile.iccid}</span>
         </div>
      </div>

      {/* Top Up Button */}
      <div className="flex justify-end">
        <Link href={`/my-esims/${iccid}/topup`}>
          <Button 
             className="h-14 px-8 text-lg font-bold bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white shadow-[0_0_20px_rgba(30,144,255,0.3)] transition-all"
          >
             Top Up Now
          </Button>
        </Link>
      </div>

      {/* Top-Up History */}
      <div className="bg-[var(--voyage-card)] rounded-2xl p-8 border border-[var(--voyage-border)]">
         <h3 className="text-xl font-bold text-white mb-6">Top-Up History</h3>
         {history.length > 0 ? (
             <div className="space-y-4">
                 {history.map((item: any) => {
                   const planDetails = planDetailsMap[item.planCode];
                   const planName = planDetails?.name || item.planCode;
                   
                   return (
                     <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-[var(--voyage-bg-light)] border border-[var(--voyage-border)]">
                         <div className="flex items-center gap-4">
                             <div className="h-10 w-10 rounded-full bg-[var(--voyage-bg)] flex items-center justify-center border border-[var(--voyage-border)]">
                                 <Clock className="h-5 w-5 text-[var(--voyage-accent)]" />
                             </div>
                             <div>
                               <p className="font-bold text-white">{planName}</p>
                               <p className="text-sm text-[var(--voyage-muted)]">
                                 {(() => {
                                   if (!item.createdAt) return 'N/A';
                                   try {
                                     const date = new Date(item.createdAt);
                                     if (isNaN(date.getTime())) return 'N/A';
                                     return date.toLocaleDateString('en-US', { 
                                       year: 'numeric', 
                                       month: 'short', 
                                       day: 'numeric' 
                                     });
                                   } catch (e) {
                                     return 'N/A';
                                   }
                                 })()}
                               </p>
                             </div>
                         </div>
                         <div className="text-right">
                             <PriceTag price={item.amountCents / 100} currencyCode={item.currency} className="text-lg text-white block" />
                             <Badge variant="outline" className={
                               item.status === 'completed' ? 'text-green-400 border-green-500/30' : 
                               item.status === 'pending' ? 'text-yellow-400 border-yellow-500/30' : 
                               'text-red-400 border-red-500/30'
                             }>
                               {item.status}
                             </Badge>
                         </div>
                     </div>
                   );
                 })}
             </div>
         ) : (
             <div className="flex items-center gap-3 p-4 bg-[var(--voyage-bg-light)] rounded-lg border border-[var(--voyage-border)] text-[var(--voyage-muted)]">
                No top-up history found.
             </div>
         )}
      </div>
    </div>
  );
}

