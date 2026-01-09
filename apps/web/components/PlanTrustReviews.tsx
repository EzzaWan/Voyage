"use client";

import { useEffect, useState } from "react";
import { Star, Globe, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import { generateReviews, ReviewData, isMediumOrLongReview } from "@/lib/mock-reviews";
import { decodeHtmlEntities } from "@/lib/utils";

interface PlanTrustReviewsProps {
  planId: string;
}

export function PlanTrustReviews({ planId }: PlanTrustReviewsProps) {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(3242);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        // Only show mock reviews (real reviews are admin-only)
        const BASE_MOCK_COUNT = 3242;
        const mockReviews = generateReviews(BASE_MOCK_COUNT);
        
        // Filter for medium/long reviews only
        const mediumLongReviews = mockReviews.filter(r => isMediumOrLongReview(r));
        
        // Sort by date (newest first)
        const sortedReviews = mediumLongReviews.sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
        // Select 3 reviews with diverse usernames
        // Strategy: Randomize selection from top 20 latest reviews to show variety
        const topReviews = sortedReviews.slice(0, 20); // Get top 20 latest
        const selectedReviews: ReviewData[] = [];
        const seenAuthors = new Set<string>();
        
        // Shuffle the top reviews to get variety
        const shuffledTop = [...topReviews].sort(() => Math.random() - 0.5);
        
        // Select 3 reviews ensuring diverse authors
        for (const review of shuffledTop) {
          if (selectedReviews.length >= 3) break;
          
          const authorKey = review.author?.toLowerCase() || 'anonymous';
          
          // Prefer reviews with different authors
          if (!seenAuthors.has(authorKey)) {
            selectedReviews.push(review);
            seenAuthors.add(authorKey);
          } else if (selectedReviews.length < 2) {
            // Allow one duplicate author if we need more reviews
            selectedReviews.push(review);
          }
        }
        
        // If we still need more reviews, fill with any from the pool
        if (selectedReviews.length < 3) {
          for (const review of shuffledTop) {
            if (selectedReviews.length >= 3) break;
            if (!selectedReviews.find(r => r.id === review.id)) {
              selectedReviews.push(review);
            }
          }
        }
        
        // Update total count (mock only)
        setTotalCount(BASE_MOCK_COUNT);
        setReviews(selectedReviews.slice(0, 3));
      } catch (error) {
        console.error("Failed to load reviews:", error);
        // Fallback to mock reviews
        const allMockReviews = generateReviews(3242);
        const mediumLongReviews = allMockReviews
          .filter(r => isMediumOrLongReview(r))
          .slice(0, 3);
        setReviews(mediumLongReviews);
      } finally {
        setLoading(false);
      }
    };
    
    loadReviews();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadReviews, 30000);
    return () => clearInterval(interval);
  }, [planId]);

  if (loading) {
    return (
      <div className="mt-8 bg-[var(--voyo-card)] rounded-xl p-6 border border-white/5 animate-pulse">
        <div className="h-4 bg-[var(--voyo-bg)] rounded w-1/3 mb-6"></div>
        <div className="h-8 bg-[var(--voyo-bg)] rounded w-1/2 mb-6"></div>
        <div className="space-y-3">
          <div className="h-4 bg-[var(--voyo-bg)] rounded w-full"></div>
          <div className="h-4 bg-[var(--voyo-bg)] rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) return null;

  return (
    <div className="mt-8 bg-[var(--voyo-card)] rounded-2xl p-6 border border-white/5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
            <Globe className="w-4 h-4 text-[var(--voyo-accent)]" />
            Trusted Worldwide
          </h3>
          <div className="flex items-center gap-2 mt-1">
             <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-[var(--voyo-accent)] text-[var(--voyo-accent)]" />
                ))}
             </div>
             <span className="text-sm font-bold text-white">4.8/5</span>
             <span className="text-xs text-[var(--voyo-muted)]">
               ({totalCount.toLocaleString()} reviews)
             </span>
          </div>
        </div>
        <Link 
          href="/reviews" 
          className="text-xs font-bold text-[var(--voyo-accent)] hover:text-[var(--voyo-accent)]/80 transition-colors flex items-center gap-1 bg-[var(--voyo-accent)]/10 px-3 py-1.5 rounded-full"
        >
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      
      <div className="space-y-3">
         {reviews.map(review => (
            <div key={review.id} className="bg-[var(--voyo-bg)]/50 p-4 rounded-xl border border-white/5 shadow-sm hover:shadow-md transition-shadow">
               <div className="flex items-center gap-2 mb-2">
                 <div className="bg-[var(--voyo-bg-light)] p-1 rounded-full">
                   <User className="w-3 h-3 text-[var(--voyo-muted)]" />
                 </div>
                 <span className="text-xs font-bold text-white">{review.author || "Anonymous"}</span>
                 {review.verified && (
                   <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full font-bold border border-emerald-500/20">Verified</span>
                 )}
               </div>
               <p className="text-sm text-[var(--voyo-muted)] leading-relaxed">
                 "{decodeHtmlEntities(review.comment || '')}"
               </p>
            </div>
         ))}
      </div>
    </div>
  );
}
