"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QrCode, Signal, RefreshCw } from "lucide-react";

interface EsimProfile {
  id: string;
  iccid: string;
  status: string;
  esimStatus?: string;
  planName?: string; // If we join this in backend, or derived
  totalVolume?: number;
  qrCodeUrl?: string;
}

export default function MyEsimsPage() {
  const { user, isLoaded } = useUser();
  const [esims, setEsims] = useState<EsimProfile[]>([]);
  const [loading, setLoading] = useState(true);

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
          setEsims(data);
        }
      } catch (e) {
        console.error(e);
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
        <Button variant="outline" size="icon" onClick={() => window.location.reload()}>
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
           {esims.map((esim) => (
             <Card key={esim.id} className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] overflow-hidden hover:border-[var(--voyage-accent)] transition-colors">
                <div className="h-2 bg-gradient-to-r from-[var(--voyage-accent)] to-purple-500" />
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                   <div>
                      <h3 className="font-bold text-lg text-white mb-1">{esim.iccid.slice(0, 8)}...</h3>
                      <p className="text-sm text-[var(--voyage-muted)]">Global Data</p>
                   </div>
                   <Badge className={esim.esimStatus === 'active' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-gray-500/20 text-gray-400'}>
                      {esim.esimStatus || 'Pending'}
                   </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="p-3 bg-[var(--voyage-bg-light)] rounded-lg border border-[var(--voyage-border)] flex items-center justify-between">
                      <span className="text-sm text-[var(--voyage-muted)]">ICCID</span>
                      <span className="font-mono text-sm text-white">{esim.iccid}</span>
                   </div>
                   
                   <Button className="w-full bg-[var(--voyage-bg-light)] hover:bg-[var(--voyage-border)] text-white border border-[var(--voyage-border)]">
                      <QrCode className="mr-2 h-4 w-4" /> View QR Code
                   </Button>
                </CardContent>
             </Card>
           ))}
        </div>
      )}
    </div>
  );
}
