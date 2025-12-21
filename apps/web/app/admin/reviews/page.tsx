"use client";

import { useEffect, useState } from "react";
import { Trash2, Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { getReviews, deleteReview, Review } from "@/lib/reviews";
import { safeFetch } from "@/lib/safe-fetch";
import { useUser } from "@clerk/nextjs";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function AdminReviewsPage() {
  const { user } = useUser();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadReviews();
    }

    // Listen for review updates from other components/tabs
    const handleReviewsUpdate = () => {
      if (user) {
        loadReviews();
      }
    };

    window.addEventListener('reviews-updated', handleReviewsUpdate);
    // Also listen to storage events for cross-tab sync
    window.addEventListener('storage', handleReviewsUpdate);

    return () => {
      window.removeEventListener('reviews-updated', handleReviewsUpdate);
      window.removeEventListener('storage', handleReviewsUpdate);
    };
  }, [user]);

  const loadReviews = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    
    try {
      const response = await safeFetch<{ reviews: any[] }>(`${apiUrl}/admin/reviews`, {
        headers: {
          'x-admin-email': user.primaryEmailAddress.emailAddress,
        },
        showToast: false,
      });
      const formattedReviews = response.reviews.map((review: any) => ({
        id: review.id,
        userName: review.userName,
        rating: review.rating,
        comment: review.comment,
        date: new Date(review.createdAt).toISOString().split('T')[0],
        verified: review.verified,
      }));
      setReviews(formattedReviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    if (!confirm("Are you sure you want to delete this review?")) return;
    
    try {
      await safeFetch(`${apiUrl}/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-email': user.primaryEmailAddress.emailAddress,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Reviews Management</h1>
      </div>

      <Card className="bg-[var(--voyage-card)] border-[var(--voyage-border)] text-white">
        <CardHeader>
          <CardTitle>All Reviews ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-[var(--voyage-muted)]">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="text-[var(--voyage-muted)]">No reviews found.</div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="flex items-start justify-between p-4 bg-[var(--voyage-bg)]/50 rounded-lg border border-[var(--voyage-border)]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{review.userName}</span>
                      <span className="text-xs text-[var(--voyage-muted)]">({review.date})</span>
                      {review.verified && (
                        <span className="flex items-center gap-1 text-green-400 text-xs bg-green-400/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </span>
                      )}
                    </div>
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`h-4 w-4 ${star <= review.rating ? "fill-current" : "text-gray-600"}`} />
                      ))}
                    </div>
                    <p className="text-[var(--voyage-muted)] mt-2">{review.comment}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(review.id)}
                    className="flex items-center gap-2"
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

