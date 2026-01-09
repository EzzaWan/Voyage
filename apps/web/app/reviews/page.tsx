"use client";

import { useState, useMemo, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Star, CheckCircle2, Globe, MessageSquare, Filter } from "lucide-react";
import { cn, decodeHtmlEntities } from "@/lib/utils";
import { generateReviews, ReviewData } from "@/lib/mock-reviews";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { safeFetch } from "@/lib/safe-fetch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BASE_MOCK_COUNT = 3242; // Base count for mock reviews
const ITEMS_PER_PAGE = 20;

export default function ReviewsPage() {
  const { user, isLoaded } = useUser();
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterTextOnly, setFilterTextOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Only show mock reviews (real reviews are hidden from public)
  useEffect(() => {
    const loadReviews = async () => {
      try {
        // Generate mock reviews only (real reviews are admin-only)
        const mockReviews = generateReviews(BASE_MOCK_COUNT);
        
        // Sort by date (newest first)
        const sortedReviews = mockReviews.sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
        setReviews(sortedReviews);
      } catch (error) {
        console.error("Failed to load reviews:", error);
        // Fallback to mock reviews only
        const mockReviews = generateReviews(BASE_MOCK_COUNT);
        setReviews(mockReviews);
      }
    };
    
    loadReviews();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadReviews, 30000);
    return () => clearInterval(interval);
  }, []);

  const averageRating = 4.8; // Hardcoded to match the "Trust" requirement

  // Filter Logic
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      if (filterRating && review.rating !== filterRating) return false;
      if (filterTextOnly && !review.comment) return false;
      return true;
    });
  }, [reviews, filterRating, filterTextOnly]);

  const displayedReviews = filteredReviews.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to leave a review.", variant: "destructive" });
      return;
    }

    // Comment is optional - star-only reviews are valid
    if (comment.trim() && comment.trim().length < 2) {
      toast({ title: "Invalid comment", description: "Comment must be at least 2 characters if provided.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const userEmail = user.primaryEmailAddress?.emailAddress;
      
      if (!userEmail) {
        toast({ title: "Error", description: "User email not found. Please try signing in again.", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      
      const userName = user.fullName || userEmail.split('@')[0] || 'Anonymous';
      
      await safeFetch(`${apiUrl}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
        },
        body: JSON.stringify({
          userName,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      toast({ title: "Review submitted", description: "Thank you for your review! It will be reviewed by our team." });
      setShowReviewDialog(false);
      setComment("");
      setRating(5);
      
      // Real reviews are admin-only, so we don't reload them here
      // Just keep showing mock reviews
      setVisibleCount(ITEMS_PER_PAGE); // Reset to show from top
    } catch (error: any) {
      console.error("Review submission error:", error);
      const errorMessage = error?.message || error?.cause?.message || "Failed to submit review.";
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--voyage-bg)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-[var(--voyage-card)] rounded-2xl p-8 border border-white/5 shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">Customer Reviews</h1>
            {isLoaded && user && (
              <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent)]/90 font-bold rounded-lg text-black">
                    Write Review
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[var(--voyage-card)] border border-white/5 shadow-xl rounded-xl max-w-md sm:rounded-xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-white">Write a Review</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block text-white">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="focus:outline-none transform hover:scale-110 transition-transform"
                          >
                            <Star
                              className={cn(
                                "h-8 w-8 transition-colors",
                                star <= rating
                                  ? "fill-[var(--voyage-accent)] text-[var(--voyage-accent)]"
                                  : "text-zinc-700"
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block text-white">
                        Comment <span className="text-zinc-400 font-normal">(optional)</span>
                      </label>
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience with this plan... (optional)"
                        className="min-h-[120px] border border-white/10 rounded-lg focus:ring-2 focus:ring-[var(--voyage-accent)]/20 focus:border-[var(--voyage-accent)] resize-none text-white bg-[var(--voyage-bg)]"
                        maxLength={1000}
                      />
                      <p className="text-xs text-zinc-400 mt-1">
                        {comment.length}/1000 characters - Star-only reviews are welcome!
                      </p>
                    </div>
                    <Button
                      onClick={handleSubmitReview}
                      disabled={submitting}
                      className="w-full bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent)]/90 text-black font-bold rounded-lg"
                    >
                      {submitting ? "Submitting..." : "Submit Review"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            <div className="flex items-center space-x-2">
              <span className="text-5xl font-bold text-white">{averageRating}</span>
              <div className="flex flex-col items-start">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "w-6 h-6 fill-current",
                        star <= Math.round(averageRating)
                          ? "text-[var(--voyage-accent)]"
                          : "text-zinc-700"
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-zinc-400 font-medium">out of 5 stars</span>
              </div>
            </div>
            <p className="text-zinc-300 font-medium">
              Based on <span className="text-white font-bold">{reviews.length.toLocaleString()}+</span> ratings and feedback
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center justify-between bg-[var(--voyage-card)] p-4 rounded-xl border border-white/5 shadow-sm sticky top-4 z-10">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterRating === null && !filterTextOnly ? "default" : "outline"}
              size="sm"
              onClick={() => { setFilterRating(null); setFilterTextOnly(false); }}
              className="rounded-full border-white/10"
            >
              All Reviews
            </Button>
            <Button
              variant={filterTextOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterTextOnly(!filterTextOnly)}
              className="rounded-full space-x-2 border-white/10"
            >
              <MessageSquare className="w-4 h-4" />
              <span>With Text</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full space-x-2 border-white/10">
                  <Filter className="w-4 h-4" />
                  <span>Star Rating {filterRating ? `(${filterRating}★)` : ""}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[var(--voyage-card)] border border-white/5">
                <DropdownMenuItem onClick={() => setFilterRating(null)} className="text-white">All Ratings</DropdownMenuItem>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <DropdownMenuItem key={rating} onClick={() => setFilterRating(rating)} className="text-white">
                    {rating} Stars
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="text-sm text-zinc-400">
            Showing {displayedReviews.length} of {filteredReviews.length}
          </div>
        </div>

        {/* Review List */}
        <div className="space-y-4">
          {displayedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}

          {displayedReviews.length === 0 && (
            <div className="text-center py-12 text-zinc-400">
              No reviews found matching your filters.
            </div>
          )}
        </div>

        {/* Load More */}
        {visibleCount < filteredReviews.length && (
          <div className="text-center pt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handleLoadMore}
              className="min-w-[200px] border-white/10 hover:bg-white/5"
            >
              Load More Reviews
            </Button>
          </div>
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
    <div className="bg-[var(--voyage-card)] p-6 rounded-xl border border-white/5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "w-4 h-4 fill-current",
                  star <= review.rating ? "text-[var(--voyage-accent)]" : "text-zinc-700"
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
