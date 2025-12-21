"use client";

import { useState, useEffect } from "react";
import { Star, User, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { getReviews, addReview, Review } from "@/lib/reviews";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

export function ReviewsSection({ limit }: { limit?: number }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({ userName: '', rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  useEffect(() => {
    loadReviews();

    // Listen for review updates from other components/tabs
    const handleReviewsUpdate = () => {
      loadReviews();
    };

    window.addEventListener('reviews-updated', handleReviewsUpdate);
    // Also listen to storage events for cross-tab sync
    window.addEventListener('storage', handleReviewsUpdate);

    return () => {
      window.removeEventListener('reviews-updated', handleReviewsUpdate);
      window.removeEventListener('storage', handleReviewsUpdate);
    };
  }, []);

  const loadReviews = async () => {
    const data = await getReviews();
    setReviews(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.userName || !newReview.comment) return;

    setSubmitting(true);
    try {
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      await addReview(newReview, userEmail);
      await loadReviews();
      setNewReview({ userName: '', rating: 5, comment: '' });
      setShowForm(false);
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const displayedReviews = limit ? reviews.slice(0, limit) : reviews;
  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <h2 className="text-2xl font-bold text-white">Customer Reviews</h2>
          <Button onClick={() => setShowForm(!showForm)} variant="outline" className="bg-transparent border-[var(--voyage-accent)] text-[var(--voyage-accent)] hover:bg-[var(--voyage-accent)] hover:text-white transition-all">
            Write a Review
          </Button>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex text-yellow-400">
             {[1, 2, 3, 4, 5].map((star) => (
               <Star key={star} className={cn("h-5 w-5", star <= Math.round(averageRating) ? "fill-current" : "text-gray-600")} />
             ))}
           </div>
           <span className="text-[var(--voyage-muted)]">{averageRating.toFixed(1)} out of 5 ({reviews.length} reviews)</span>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[var(--voyage-card)] p-6 rounded-xl border border-[var(--voyage-border)] space-y-4 animate-in slide-in-from-top-2">
           <div>
             <label className="block text-sm font-medium text-white mb-1">Name</label>
             <Input 
               value={newReview.userName}
               onChange={(e) => setNewReview(prev => ({ ...prev, userName: e.target.value }))}
               placeholder="Your name"
               required
               className="bg-[var(--voyage-bg)] border-[var(--voyage-border)] text-white"
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-white mb-1">Rating</label>
             <div className="flex gap-1">
               {[1, 2, 3, 4, 5].map((star) => (
                 <button
                   key={star}
                   type="button"
                   onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                   className="focus:outline-none transition-transform hover:scale-110"
                 >
                   <Star className={cn("h-8 w-8", star <= newReview.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-600")} />
                 </button>
               ))}
             </div>
           </div>
           <div>
             <label className="block text-sm font-medium text-white mb-1">Review</label>
             <Textarea 
               value={newReview.comment}
               onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
               placeholder="Share your experience..."
               required
               className="bg-[var(--voyage-bg)] border-[var(--voyage-border)] text-white"
             />
           </div>
           <div className="flex justify-end gap-2">
             <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="text-white hover:bg-[var(--voyage-bg-light)]">Cancel</Button>
             <Button type="submit" disabled={submitting} className="bg-[var(--voyage-accent)] text-white hover:bg-[var(--voyage-accent-soft)]">
               {submitting ? 'Submitting...' : 'Submit Review'}
             </Button>
           </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
           <div className="col-span-full text-center text-[var(--voyage-muted)]">Loading reviews...</div>
        ) : displayedReviews.map((review) => (
          <div key={review.id} className="bg-[var(--voyage-card)] p-5 rounded-xl border border-[var(--voyage-border)] hover:border-[var(--voyage-accent)]/30 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[var(--voyage-accent)]/20 flex items-center justify-center text-[var(--voyage-accent)]">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{review.userName}</div>
                  <div className="text-xs text-[var(--voyage-muted)]">{review.date}</div>
                </div>
              </div>
              {review.verified && (
                <div className="flex items-center gap-1 text-green-400 text-xs bg-green-400/10 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </div>
              )}
            </div>
            <div className="flex text-yellow-400 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className={cn("h-3 w-3", star <= review.rating ? "fill-current" : "text-gray-600")} />
              ))}
            </div>
            <p className="text-sm text-[var(--voyage-muted)] leading-relaxed">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

