"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { safeFetch } from "@/lib/safe-fetch";
import { toast } from "@/components/ui/use-toast";

export default function PayoutMethodsPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [method, setMethod] = useState<any>(null);
  const [type, setType] = useState<"paypal" | "bank">("paypal");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [bankHolderName, setBankHolderName] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [bankSwift, setBankSwift] = useState("");

  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchMethod = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const data = await safeFetch<{ method: any }>(`${apiUrl}/affiliate/payout/method`, {
          headers: {
            "x-user-email": user.primaryEmailAddress?.emailAddress || "",
          },
          showToast: false,
        });
        
        if (data.method) {
          setMethod(data.method);
          setType(data.method.type);
          if (data.method.type === "paypal") {
            setPaypalEmail(data.method.paypalEmail || "");
          } else {
            setBankHolderName(data.method.bankHolderName || "");
            setBankIban(data.method.bankIban || "");
            setBankSwift(data.method.bankSwift || "");
          }
        }
      } catch (error) {
        console.error("Failed to fetch payout method:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMethod();
  }, [user, isLoaded]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate before submitting
    if (type === "paypal" && (!paypalEmail || !paypalEmail.trim())) {
      toast({
        title: "Error",
        description: "PayPal email is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const requestBody: any = { type };
      
      if (type === "paypal") {
        requestBody.paypalEmail = paypalEmail.trim();
      } else {
        requestBody.bankHolderName = bankHolderName.trim();
        requestBody.bankIban = bankIban.trim();
        if (bankSwift) {
          requestBody.bankSwift = bankSwift.trim();
        }
      }

      console.log("Submitting payout method:", requestBody);
      
      await safeFetch(`${apiUrl}/affiliate/payout/method`, {
        method: "POST",
        headers: {
          "x-user-email": user.primaryEmailAddress?.emailAddress || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      toast({
        title: "Success",
        description: "Payout method saved successfully",
      });
      setTimeout(() => {
        window.location.href = "/account/affiliate";
      }, 1000);
    } catch (error: any) {
      console.error("Payout method save error:", error);
      toast({
        title: "Error",
        description: error.message || error.description || "Failed to save payout method",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link
        href="/account/affiliate"
        className="inline-flex items-center text-[var(--voyage-muted)] hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Affiliate Dashboard
      </Link>

      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <CardTitle className="text-white">{method ? "Update" : "Add"} Payout Method</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <Label className="text-white mb-3 block">Payout Method Type</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={type === "paypal" ? "default" : "outline"}
                  onClick={() => setType("paypal")}
                  className={type === "paypal" ? "bg-[var(--voyage-accent)]" : ""}
                >
                  PayPal
                </Button>
                <Button
                  type="button"
                  variant={type === "bank" ? "default" : "outline"}
                  onClick={() => setType("bank")}
                  className={type === "bank" ? "bg-[var(--voyage-accent)]" : ""}
                >
                  Bank Transfer
                </Button>
              </div>
            </div>

            {type === "paypal" ? (
              <div>
                <Label htmlFor="paypalEmail" className="text-white">
                  PayPal Email <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="paypalEmail"
                  type="email"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  required
                  className="mt-2 bg-[var(--voyage-bg-light)] border-[var(--voyage-border)] text-white"
                  placeholder="your.email@example.com"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bankHolderName" className="text-white">
                    Account Holder Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="bankHolderName"
                    value={bankHolderName}
                    onChange={(e) => setBankHolderName(e.target.value)}
                    required
                    className="mt-2 bg-[var(--voyage-bg-light)] border-[var(--voyage-border)] text-white"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="bankIban" className="text-white">
                    IBAN <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="bankIban"
                    value={bankIban}
                    onChange={(e) => setBankIban(e.target.value.toUpperCase())}
                    required
                    className="mt-2 bg-[var(--voyage-bg-light)] border-[var(--voyage-border)] text-white font-mono"
                    placeholder="GB82WEST12345698765432"
                  />
                </div>
                <div>
                  <Label htmlFor="bankSwift" className="text-white">
                    SWIFT/BIC (Optional)
                  </Label>
                  <Input
                    id="bankSwift"
                    value={bankSwift}
                    onChange={(e) => setBankSwift(e.target.value.toUpperCase())}
                    className="mt-2 bg-[var(--voyage-bg-light)] border-[var(--voyage-border)] text-white font-mono"
                    placeholder="WESTGB22"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white"
              >
                {saving ? "Saving..." : method ? "Update Method" : "Save Method"}
              </Button>
              <Link href="/account/affiliate">
                <Button type="button" variant="outline" className="border-[var(--voyage-border)]">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

