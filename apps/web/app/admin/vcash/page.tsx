"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { safeFetch } from "@/lib/safe-fetch";
import { Search, Wallet, Plus, Loader2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
}

export default function AdminVCashPage() {
  const { user } = useUser();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  const [searchEmail, setSearchEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [crediting, setCrediting] = useState(false);

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    try {
      const userData = await safeFetch<User>(
        `${apiUrl}/admin/users/search?email=${encodeURIComponent(searchEmail.trim())}`,
        {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
          showToast: false,
        }
      );

      setSelectedUser(userData);
      setSearchEmail("");

      // Fetch V-Cash balance
      await fetchBalance(userData.id);
    } catch (error: any) {
      toast({
        title: "User not found",
        description: error.message || "Could not find user with that email",
        variant: "destructive",
      });
      setSelectedUser(null);
      setBalance(null);
    } finally {
      setSearching(false);
    }
  };

  const fetchBalance = async (userId: string) => {
    setLoadingBalance(true);
    try {
      const data = await safeFetch<{ balanceCents: number }>(
        `${apiUrl}/admin/vcash/${userId}`,
        {
          headers: {
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
          showToast: false,
        }
      );
      setBalance(data.balanceCents);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      setBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleCredit = async () => {
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "Please search for a user first",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    const amountCents = Math.round(amountNum * 100);

    setCrediting(true);
    try {
      const result = await safeFetch<{ success: boolean; newBalance: number }>(
        `${apiUrl}/admin/vcash/credit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
          },
          body: JSON.stringify({
            userId: selectedUser.id,
            amountCents,
            reason: reason.trim() || undefined,
          }),
        }
      );

      toast({
        title: "Success",
        description: `V-Cash added successfully. New balance: $${(result.newBalance / 100).toFixed(2)}`,
      });

      // Update balance
      setBalance(result.newBalance);
      setAmount("");
      setReason("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add V-Cash",
        variant: "destructive",
      });
    } finally {
      setCrediting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">V-Cash Management</h1>
        <p className="text-[var(--voyage-muted)]">
          Add V-Cash to any user account
        </p>
      </div>

      {/* Search User */}
      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="email" className="text-white mb-2 block">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                className="bg-[var(--voyage-bg)] border-[var(--voyage-border)] text-white"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                disabled={searching}
                className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)]"
              >
                {searching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected User Info */}
      {selectedUser && (
        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Label className="text-[var(--voyage-muted)] text-sm">Email</Label>
                <p className="text-white font-medium">{selectedUser.email}</p>
              </div>
              {selectedUser.name && (
                <div>
                  <Label className="text-[var(--voyage-muted)] text-sm">Name</Label>
                  <p className="text-white font-medium">{selectedUser.name}</p>
                </div>
              )}
              <div>
                <Label className="text-[var(--voyage-muted)] text-sm">User ID</Label>
                <p className="text-white font-mono text-sm">{selectedUser.id}</p>
              </div>
              <div className="pt-2 border-t border-[var(--voyage-border)]">
                <Label className="text-[var(--voyage-muted)] text-sm">V-Cash Balance</Label>
                {loadingBalance ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--voyage-accent)]" />
                    <span className="text-[var(--voyage-muted)]">Loading...</span>
                  </div>
                ) : balance !== null ? (
                  <p className="text-2xl font-bold text-white mt-1">
                    ${(balance / 100).toFixed(2)}
                  </p>
                ) : (
                  <p className="text-[var(--voyage-muted)] mt-1">Unable to load balance</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credit Form */}
      {selectedUser && (
        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add V-Cash
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount" className="text-white mb-2 block">
                  Amount (USD)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-[var(--voyage-bg)] border-[var(--voyage-border)] text-white"
                />
                <p className="text-xs text-[var(--voyage-muted)] mt-1">
                  Enter amount in dollars (e.g., 10.50 for $10.50)
                </p>
              </div>

              <div>
                <Label htmlFor="reason" className="text-white mb-2 block">
                  Reason (Optional)
                </Label>
                <Input
                  id="reason"
                  type="text"
                  placeholder="Manual credit, refund, etc."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="bg-[var(--voyage-bg)] border-[var(--voyage-border)] text-white"
                />
              </div>

              <Button
                onClick={handleCredit}
                disabled={crediting || !amount}
                className="w-full bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)]"
              >
                {crediting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding V-Cash...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add V-Cash
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedUser && (
        <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
          <CardContent className="py-8 text-center">
            <p className="text-[var(--voyage-muted)]">
              Search for a user by email to view their V-Cash balance and add credits
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


