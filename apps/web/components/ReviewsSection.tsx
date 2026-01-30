"use client";

import { useState, useEffect } from "react";
import { Star, User, CheckCircle2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { addReview, Review } from "@/lib/reviews";
import { generateReviews, ReviewData } from "@/lib/mock-reviews";
import { cn, decodeHtmlEntities } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

export function ReviewsSection({ limit }: { limit?: number }) {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
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
    try {
      // Generate enough mock reviews to ensure we have reviews with text
      // Generate 200 reviews to have good variety, then filter for ones with text
      const mockReviews = generateReviews(200);
      
      // Filter to only show reviews with text/comments (like /reviews page)
      const reviewsWithText = mockReviews.filter(review => review.comment && review.comment.trim().length > 0);
      
      // Sort by date (newest first)
      const sortedReviews = reviewsWithText.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      // Take the limit
      setReviews(sortedReviews.slice(0, limit || sortedReviews.length));
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
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

  const displayedReviews = reviews;
  const averageRating = 4.8; // Hardcoded to match /reviews page

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <h2 className="text-2xl font-bold text-white">Customer Reviews</h2>
          <Button onClick={() => setShowForm(!showForm)} variant="outline" className="bg-transparent border-[var(--voyo-accent)] text-[var(--voyo-accent)] hover:bg-[var(--voyo-accent)] hover:text-white transition-all">
            Write a Review
          </Button>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex text-yellow-400">
             {[1, 2, 3, 4, 5].map((star) => (
               <Star key={star} className={cn("h-5 w-5", star <= Math.round(averageRating) ? "fill-current" : "text-gray-600")} />
             ))}
           </div>
           <span className="text-[var(--voyo-muted)]">{averageRating.toFixed(1)} out of 5 ({reviews.length > 0 ? reviews.length.toLocaleString() + '+' : '0'} reviews)</span>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[var(--voyo-card)] p-6 rounded-xl border border-[var(--voyo-border)] space-y-4 animate-in slide-in-from-top-2">
           <div>
             <label className="block text-sm font-medium text-white mb-1">Name</label>
             <Input 
               value={newReview.userName}
               onChange={(e) => setNewReview(prev => ({ ...prev, userName: e.target.value }))}
               placeholder="Your name"
               required
               className="bg-[var(--voyo-bg)] border-[var(--voyo-border)] text-white"
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
               className="bg-[var(--voyo-bg)] border-[var(--voyo-border)] text-white"
             />
           </div>
           <div className="flex justify-end gap-2">
             <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="text-white hover:bg-[var(--voyo-bg-light)]">Cancel</Button>
             <Button type="submit" disabled={submitting} className="bg-[var(--voyo-accent)] text-white hover:bg-[var(--voyo-accent-soft)]">
               {submitting ? 'Submitting...' : 'Submit Review'}
             </Button>
           </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
           <div className="col-span-full text-center text-[var(--voyo-muted)]">Loading reviews...</div>
        ) : displayedReviews.length === 0 ? (
          <div className="col-span-full text-center text-[var(--voyo-muted)]">No reviews yet</div>
        ) : (
          displayedReviews.map((review) => <ReviewCard key={review.id} review={review} />)
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewData }) {
  // Format date: "Jan 9, 2024"
  const dateFormatted = new Date(review.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-[var(--voyo-card)] p-6 rounded-xl border border-white/5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "w-4 h-4 fill-current",
                  star <= review.rating ? "text-[var(--voyo-accent)]" : "text-zinc-700"
                )}
              />
            ))}
          </div>
          {review.verified && (
            <div className="flex items-center text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Verified Purchase
            </div>
          )}
        </div>
        <span className="text-xs text-zinc-400">{dateFormatted}</span>
      </div>

      {review.comment ? (
        <div className="space-y-2">
          <p className="text-zinc-200 leading-relaxed text-sm md:text-base">
            {decodeHtmlEntities(review.comment)}
          </p>
          {review.language && review.language !== 'en' && (
            <div className="flex items-center text-xs text-zinc-400 mt-2">
              <Globe className="w-3 h-3 mr-1" />
              <span className="uppercase">{review.language}</span>
              <span className="mx-2">•</span>
              <span className="cursor-pointer hover:text-zinc-300 underline decoration-dotted">
                Translate
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-zinc-400 italic">
          Customer rated this product but did not leave a comment.
        </p>
      )}

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
         <span className="text-xs font-medium text-zinc-400">
            {review.author}
         </span>
         {review.source === 'support' && (
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
               Via Support Survey
            </span>
         )}
      </div>
    </div>
  );
}

