"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Star, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { safeFetch } from "@/lib/safe-fetch";
import { toast } from "@/components/ui/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useRouter } from "next/navigation";

interface Review {
  id: string;
  planId: string | null;
  userId: string | null;
  userName: string;
  userEmail: string | null;
  rating: number;
  comment: string | null;
  language: string | null;
  source: string | null;
  verified: boolean;
  date: string;
}

export default function AdminReviewsPage() {
  const { user, isLoaded } = useUser();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for both user and admin check to complete
    if (!isLoaded || adminLoading) {
      return;
    }

    // Redirect if not admin
    if (!isAdmin) {
      router.push('/');
      return;
    }

    const fetchReviews = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const data = await safeFetch<Review[]>(`${apiUrl}/admin/reviews`, {
          headers: {
            'x-admin-email': user?.primaryEmailAddress?.emailAddress || '',
          },
          showToast: false,
        });
        setReviews(data || []);
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [user, isLoaded, isAdmin, adminLoading, router]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await safeFetch(`${apiUrl}/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-email': user?.primaryEmailAddress?.emailAddress || '',
        },
        errorMessage: 'Failed to delete review',
      });

      setReviews(reviews.filter(r => r.id !== id));
      toast({
        title: "Review deleted",
        description: "The review has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  // Show loading state while checking admin status
  if (!isLoaded || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-[var(--voyo-muted)] font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not admin (handled in useEffect, but also guard here)
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Reviews Management</h1>
      </div>

      <Card className="bg-[var(--voyo-card)] border border-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">All Reviews ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-[var(--voyo-muted)] font-mono">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="text-[var(--voyo-muted)] font-mono">No reviews found.</div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="flex items-start justify-between p-4 bg-[var(--voyo-bg)]/50 border border-white/5 rounded-lg hover:border-[var(--voyo-accent)]/20 transition-colors">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-lg text-white">{review.userName}</span>
                      <span className="text-xs text-[var(--voyo-muted)] font-mono">({review.date})</span>
                      {review.verified && (
                        <span className="flex items-center gap-1 text-emerald-500 text-xs bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 font-bold uppercase">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </span>
                      )}
                    </div>
                    <div className="flex text-[var(--voyo-accent)]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`h-4 w-4 ${star <= review.rating ? "fill-current" : "text-zinc-700"}`} />
                      ))}
                    </div>
                    {review.comment && (
                      <p className="text-[var(--voyo-muted)] mt-2 font-mono text-sm">{review.comment}</p>
                    )}
                    <div className="flex gap-4 text-xs text-[var(--voyo-muted)] font-mono uppercase mt-2">
                      {review.planId && <span>Plan: {review.planId}</span>}
                      {review.userEmail && <span>Email: {review.userEmail}</span>}
                      {review.language && <span>Lang: {review.language}</span>}
                      {review.source && <span>Source: {review.source}</span>}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(review.id)}
                    className="flex items-center gap-2 border-2 border-red-600 rounded-lg font-bold"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
