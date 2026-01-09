"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Star, CheckCircle2, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";
import { generateReviews, ReviewData } from "@/lib/mock-reviews";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Helper to convert ReviewData to the component's internal state format
interface ReviewState extends ReviewData {
  userName: string;
}

export function HomeReviewsSection() {
  const { user, isLoaded } = useUser();
  const [reviews, setReviews] = useState<ReviewState[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [planId, setPlanId] = useState("");
  const [language, setLanguage] = useState("en");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        
        // Fetch real review count (optional, for display)
        // Generate mock reviews
        const allMockReviews = generateReviews(3242);
        
        // Filter for ones with text and sort by date
        const displayReviews = allMockReviews
          .filter(r => r.comment && r.comment.length > 20)
          .slice(0, 6)
          .map(r => ({
            ...r,
            userName: r.author || "Anonymous"
          }));
        
        setReviews(displayReviews);
      } catch (error) {
        console.error("Failed to load reviews:", error);
        // Fallback
        const allMockReviews = generateReviews(3242);
        const displayReviews = allMockReviews
          .filter(r => r.comment && r.comment.length > 20)
          .slice(0, 6)
          .map(r => ({
            ...r,
            userName: r.author || "Anonymous"
          }));
        setReviews(displayReviews);
      } finally {
        setLoading(false);
      }
    };
    
    loadReviews();
  }, []);

  const handleSubmitReview = async () => {
    // Mock submission for now since we are using static data
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to leave a review.", variant: "destructive" });
      return;
    }

    if (!planId.trim()) {
      toast({ title: "Plan required", description: "Please enter a plan ID.", variant: "destructive" });
      return;
    }

    // Comment is optional - star-only reviews are valid
    // Only validate length if comment is provided
    if (comment.trim() && comment.trim().length < 2) {
      toast({ title: "Invalid comment", description: "Comment must be at least 2 characters if provided.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({ title: "Review submitted", description: "Thank you for your review! It will appear after moderation." });
      setShowReviewDialog(false);
      setComment("");
      setPlanId("");
      setRating(5);
      setLanguage("en");
      setSubmitting(false);
    }, 1000);
  };

  const averageRating = 4.8;
  const totalCount = 3242;

  return (
    <div className="bg-[var(--voyage-card)] border border-white/5 rounded-xl p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
        <div className="flex items-center gap-4">
          <div className="bg-[var(--voyage-bg)] p-3 border border-white/5 rounded-full shadow-sm">
            <MessageSquare className="h-6 w-6 text-[var(--voyage-accent)]" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Customer Reviews</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(averageRating)
                        ? "fill-[var(--voyage-accent)] text-[var(--voyage-accent)]"
                        : "text-zinc-700"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-[var(--voyage-muted)]">
                {averageRating.toFixed(1)} ({totalCount.toLocaleString()} reviews)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isLoaded && user && (
            <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent)]/90 text-black rounded-lg font-bold">
                  Write Review
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[var(--voyage-card)] border border-white/5 shadow-xl rounded-xl max-w-md sm:rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-white">Write a Review</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold mb-2 block text-white">Plan ID</label>
                    <input
                      type="text"
                      value={planId}
                      onChange={(e) => setPlanId(e.target.value)}
                      placeholder="Enter plan package code..."
                      className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-[var(--voyage-accent)]/20 focus:border-[var(--voyage-accent)] transition-all text-sm bg-[var(--voyage-bg)] text-white"
                    />
                  </div>
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
                            className={`h-8 w-8 ${
                              star <= rating
                                ? "fill-[var(--voyage-accent)] text-[var(--voyage-accent)]"
                                : "text-zinc-700"
                            } transition-colors`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block text-white">
                      Comment <span className="text-[var(--voyage-muted)] font-normal">(optional)</span>
                    </label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience with this plan... (optional)"
                      className="min-h-[120px] border border-white/10 rounded-lg focus:ring-2 focus:ring-[var(--voyage-accent)]/20 focus:border-[var(--voyage-accent)] resize-none bg-[var(--voyage-bg)] text-white"
                      maxLength={1000}
                    />
                    <p className="text-xs text-[var(--voyage-muted)] mt-1">
                      {comment.length}/1000 characters - Star-only reviews are welcome!
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block text-white">
                      Language <span className="text-[var(--voyage-muted)] font-normal">(optional)</span>
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-[var(--voyage-accent)]/20 focus:border-[var(--voyage-accent)] transition-all text-sm bg-[var(--voyage-bg)] text-white"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="zh">Chinese</option>
                      <option value="ja">Japanese</option>
                      <option value="ar">Arabic</option>
                      <option value="th">Thai</option>
                      <option value="id">Indonesian</option>
                      <option value="vi">Vietnamese</option>
                      <option value="tl">Filipino</option>
                      <option value="ms">Malay</option>
                      <option value="de">German</option>
                      <option value="fr">French</option>
                      <option value="pl">Polish</option>
                    </select>
                  </div>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={submitting || !planId.trim()}
                    className="w-full bg-[var(--voyage-accent)] hover:bg-[var(--voyage-accent)]/90 text-black font-bold rounded-lg"
                  >
                    {submitting ? "Submitting..." : "Submit Review"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Link href="/reviews">
            <Button variant="outline" className="border border-white/10 rounded-lg font-bold hover:bg-white/5 text-white">
              View All <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--voyage-muted)]">Loading reviews...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-[var(--voyage-bg)] border border-white/5 p-6 rounded-xl hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-lg text-white">{review.userName}</span>
                  {review.verified && (
                    <span className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= review.rating
                          ? "fill-[var(--voyage-accent)] text-[var(--voyage-accent)]"
                          : "text-zinc-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-[var(--voyage-muted)] mb-3 line-clamp-4 leading-relaxed">{review.comment}</p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                <p className="text-xs text-[var(--voyage-muted)] font-medium">
                  {new Date(review.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

