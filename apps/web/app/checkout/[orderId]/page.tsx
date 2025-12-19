'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckoutProgress } from "@/components/checkout/CheckoutProgress";
import { EmailPreview } from "@/components/checkout/EmailPreview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CreditCard, Loader2, Tag, X } from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface Order {
  id: string;
  planId: string;
  amountCents: number;
  displayAmountCents?: number;
  displayCurrency?: string;
  currency: string;
  status: string;
}

export default function CheckoutPage({ params }: { params: { orderId: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState<{ percent: number; originalAmount: number; originalDisplayAmount: number } | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const orderData = await safeFetch<Order>(`${apiUrl}/orders/${params.orderId}`, {
          showToast: false,
        });
        setOrder(orderData);

        // Check if promo code was previously applied (stored in localStorage)
        const storedPromo = localStorage.getItem(`promo_${params.orderId}`);
        if (storedPromo) {
          try {
            const promoData = JSON.parse(storedPromo);
            // Verify the stored promo matches the current order state
            // If order amount matches expected discounted amount, restore promo state
            const expectedDiscounted = Math.round(promoData.originalAmount * (1 - promoData.discountPercent / 100));
            if (Math.abs(orderData.amountCents - expectedDiscounted) < 10) { // Allow small rounding differences
              setAppliedPromo(promoData.promoCode);
              setPromoDiscount({
                percent: promoData.discountPercent,
                originalAmount: promoData.originalAmount,
                originalDisplayAmount: promoData.originalDisplayAmount,
              });
            } else {
              // Promo doesn't match, clear it
              localStorage.removeItem(`promo_${params.orderId}`);
            }
          } catch (e) {
            // Invalid stored data, clear it
            localStorage.removeItem(`promo_${params.orderId}`);
          }
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
        toast({
          title: "Error",
          description: "Failed to load order details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.orderId, toast]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast({
        title: "Invalid code",
        description: "Please enter a promo code.",
        variant: "destructive",
      });
      return;
    }

    // Check if a promo is already applied (in UI state or localStorage)
    if (appliedPromo) {
      toast({
        title: "Promo code already applied",
        description: `You already have ${appliedPromo} applied. Remove it first to apply a different code.`,
        variant: "destructive",
      });
      return;
    }

    // Check localStorage for existing promo
    const storedPromo = localStorage.getItem(`promo_${params.orderId}`);
    if (storedPromo) {
      try {
        const promoData = JSON.parse(storedPromo);
        if (promoData.promoCode) {
          toast({
            title: "Promo code already applied",
            description: `You already have ${promoData.promoCode} applied. Remove it first to apply a different code.`,
            variant: "destructive",
          });
          return;
        }
      } catch (e) {
        // Invalid stored data, continue
      }
    }

    setApplyingPromo(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const result = await safeFetch<{
        valid: boolean;
        promoCode: string;
        discountPercent: number;
        originalAmount: number;
        originalDisplayAmount?: number;
        discountedAmount: number;
        displayAmount: number;
        displayCurrency: string;
      }>(
        `${apiUrl}/orders/${params.orderId}/validate-promo`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promoCode: promoCode.trim() }),
          errorMessage: "Failed to validate promo code.",
        }
      );

      if (result.valid) {

        // Store original amounts before updating
        const originalOrderAmount = order?.amountCents || 0;
        const originalDisplayAmount = order?.displayAmountCents || order?.amountCents || 0;
        
        setAppliedPromo(result.promoCode);
        setPromoDiscount({
          percent: result.discountPercent,
          originalAmount: result.originalAmount,
          originalDisplayAmount: result.originalDisplayAmount || originalDisplayAmount,
        });
        
        // Store promo info in localStorage to persist across page reloads
        localStorage.setItem(`promo_${params.orderId}`, JSON.stringify({
          promoCode: result.promoCode,
          discountPercent: result.discountPercent,
          originalAmount: result.originalAmount,
          originalDisplayAmount: result.originalDisplayAmount || originalDisplayAmount,
        }));
        
        // Update order with new amounts
        setOrder(prev => prev ? {
          ...prev,
          amountCents: result.discountedAmount,
          displayAmountCents: result.displayAmount,
          displayCurrency: result.displayCurrency,
        } : null);
        
        setPromoCode("");
        toast({
          title: "Promo code applied!",
          description: `${result.discountPercent}% discount applied to your order.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Invalid promo code",
        description: error.message || "This promo code is not valid or has expired.",
        variant: "destructive",
      });
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleRemovePromo = async () => {
    if (!appliedPromo || !promoDiscount) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      // Call endpoint to remove promo and restore original amount
      await safeFetch(
        `${apiUrl}/orders/${params.orderId}/remove-promo`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          errorMessage: "Failed to remove promo code.",
        }
      );

      // Remove from localStorage
      localStorage.removeItem(`promo_${params.orderId}`);

      // Restore original amounts in UI
      setOrder(prev => prev && promoDiscount ? {
        ...prev,
        amountCents: promoDiscount.originalAmount,
        displayAmountCents: promoDiscount.originalDisplayAmount,
      } : prev);

      setAppliedPromo(null);
      setPromoDiscount(null);
      
      toast({
        title: "Promo code removed",
        description: "The promo code has been removed and original price restored.",
      });
    } catch (error) {
      console.error('Failed to remove promo code:', error);
      // Still remove from UI even if backend call fails
      // Remove from localStorage
      localStorage.removeItem(`promo_${params.orderId}`);
      
      // Restore original amounts from stored values
      if (promoDiscount && order) {
        setOrder({
          ...order,
          amountCents: promoDiscount.originalAmount,
          displayAmountCents: promoDiscount.originalDisplayAmount,
        });
      }
      setAppliedPromo(null);
      setPromoDiscount(null);
    }
  };

  const handleProceedToPayment = async () => {
    setProcessing(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const data = await safeFetch<{ url: string }>(
        `${apiUrl}/orders/${params.orderId}/checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            promoCode: appliedPromo || undefined,
          }),
          errorMessage: "Failed to start payment. Please try again.",
        }
      );

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment failed",
        description: error.message || "Failed to start payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (cents: number, currency?: string) => {
    return formatCurrency(cents / 100, currency || 'USD');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--voyage-accent)]" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center py-12">
          <p className="text-[var(--voyage-muted)]">Order not found</p>
        </div>
      </div>
    );
  }

  const displayAmount = order.displayAmountCents || order.amountCents;
  const displayCurrency = order.displayCurrency || order.currency;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Progress Indicator */}
      <div className="bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-2xl p-6">
        <CheckoutProgress currentStep={currentStep} />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Order Review */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Review Your Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-[var(--voyage-bg-light)] rounded-lg p-4 border border-[var(--voyage-border)]">
                  <p className="text-sm text-[var(--voyage-muted)] mb-2">
                    Order ID: <span className="text-white font-mono">{params.orderId}</span>
                  </p>
                  <p className="text-sm text-[var(--voyage-muted)]">
                    Plan: <span className="text-white">{order.planId}</span>
                  </p>
                </div>
                
                {/* Promo Code Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white">Promo Code</h3>
                  {appliedPromo ? (
                    <div className="flex items-center justify-between bg-[var(--voyage-accent)]/10 border border-[var(--voyage-accent)] rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-[var(--voyage-accent)]" />
                        <span className="text-sm font-medium text-white">{appliedPromo}</span>
                      </div>
                      <button
                        onClick={handleRemovePromo}
                        className="text-[var(--voyage-muted)] hover:text-white transition-colors"
                        aria-label="Remove promo code"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleApplyPromo();
                          }
                        }}
                        className="bg-[var(--voyage-bg-light)] border-[var(--voyage-border)] text-white placeholder:text-[var(--voyage-muted)] focus:border-[var(--voyage-accent)]"
                      />
                      <Button
                        onClick={handleApplyPromo}
                        disabled={applyingPromo || !promoCode.trim()}
                        variant="outline"
                        className="border-[var(--voyage-border)] bg-[var(--voyage-card)] text-white hover:bg-[var(--voyage-accent)] hover:border-[var(--voyage-accent)]"
                      >
                        {applyingPromo ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--voyage-muted)]">Subtotal</span>
                      <span className="text-white">
                        {promoDiscount 
                          ? formatPrice(promoDiscount.originalDisplayAmount || promoDiscount.originalAmount, displayCurrency)
                          : formatPrice(displayAmount, displayCurrency)
                        }
                      </span>
                    </div>
                    {appliedPromo && promoDiscount && (
                      <div className="flex justify-between text-sm text-[var(--voyage-accent)]">
                        <span>Discount ({appliedPromo})</span>
                        <span>-{formatPrice(
                          (promoDiscount.originalDisplayAmount || promoDiscount.originalAmount) - displayAmount, 
                          displayCurrency
                        )}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--voyage-muted)]">Tax</span>
                      <span className="text-white">Included</span>
                    </div>
                    <div className="pt-2 border-t border-[var(--voyage-border)] flex justify-between">
                      <span className="font-semibold text-white">Total</span>
                      <span className="text-lg font-bold text-[var(--voyage-accent)]">
                        {formatPrice(displayAmount, displayCurrency)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleProceedToPayment}
                    disabled={processing || order.status !== 'pending'}
                    className="w-full bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent-soft)] text-white py-6 text-lg"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>
                  {order.status !== 'pending' && (
                    <p className="text-xs text-[var(--voyage-muted)] mt-2 text-center">
                      This order has already been processed.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary & Email Preview */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order Summary Card */}
          <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
            <CardHeader>
              <CardTitle className="text-white">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--voyage-muted)]">Plan</span>
                  <span className="text-white">{order.planId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--voyage-muted)]">Subtotal</span>
                  <span className="text-white">
                    {promoDiscount 
                      ? formatPrice(promoDiscount.originalDisplayAmount || promoDiscount.originalAmount, displayCurrency)
                      : formatPrice(displayAmount, displayCurrency)
                    }
                  </span>
                </div>
                {appliedPromo && promoDiscount && (
                  <div className="flex justify-between text-sm text-[var(--voyage-accent)]">
                    <span>Discount ({appliedPromo})</span>
                    <span>-{formatPrice(
                      (promoDiscount.originalDisplayAmount || promoDiscount.originalAmount) - displayAmount, 
                      displayCurrency
                    )}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--voyage-muted)]">Tax</span>
                  <span className="text-white">Included</span>
                </div>
                <div className="pt-3 border-t border-[var(--voyage-border)] flex justify-between">
                  <span className="font-semibold text-white">Total</span>
                  <span className="text-xl font-bold text-[var(--voyage-accent)]">
                    {formatPrice(displayAmount, displayCurrency)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Preview Toggle */}
          <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)]">
            <CardContent className="pt-6">
              <Button
                variant="outline"
                className="w-full border-[var(--voyage-border)] bg-[var(--voyage-bg-light)] text-white hover:bg-[var(--voyage-card)] hover:text-white"
                onClick={() => setShowEmailPreview(!showEmailPreview)}
              >
                <Mail className="mr-2 h-4 w-4" />
                {showEmailPreview ? 'Hide' : 'Preview'} Confirmation Email
              </Button>
            </CardContent>
          </Card>

          {/* Email Preview Card */}
          {showEmailPreview && order && (
            <EmailPreview 
              orderId={params.orderId}
              amount={displayAmount / 100}
              currency={displayCurrency}
            />
          )}
        </div>
      </div>
    </div>
  );
}

