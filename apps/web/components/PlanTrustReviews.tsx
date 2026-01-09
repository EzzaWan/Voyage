"use client";

import { useEffect, useState } from "react";
import { Star, Globe, User, ChevronRight } from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export function PlanTrustReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const data = await safeFetch<{ reviews: Review[]; total: number }>(
          `${apiUrl}/reviews?limit=3&minRating=4`,
          { showToast: false }
        );
        
        if (data && data.reviews) {
          setReviews(data.reviews);
          setTotalCount(data.total);
        }
      } catch (error) {
        console.error("Failed to fetch reviews", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
    return <div className="animate-pulse h-48 bg-[var(--voyage-card)] rounded-xl" />;
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <div className="bg-[var(--voyage-card)] rounded-2xl p-6 border border-white/5 shadow-sm">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wide text-sm">
            <Globe className="w-4 h-4 text-[var(--voyage-accent)]" />
            <span>Trusted Worldwide</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-4 h-4 fill-[var(--voyage-accent)] text-[var(--voyage-accent)]" />
              ))}
            </div>
            <span className="font-bold text-white text-base">4.8/5</span>
            <span className="text-[var(--voyage-muted)] text-sm">({totalCount.toLocaleString()} reviews)</span>
          </div>
        </div>

        <Link 
          href="/reviews"
          className="flex items-center gap-1 bg-[var(--voyage-accent)]/10 text-[var(--voyage-accent)] px-4 py-1.5 rounded-full text-xs font-bold hover:bg-[var(--voyage-accent)]/20 transition-colors self-start md:self-center"
        >
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.map((review) => (
          <div 
            key={review.id} 
            className="bg-[var(--voyage-bg)]/50 border border-white/5 rounded-xl p-4 transition-all hover:border-[var(--voyage-accent)]/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-[var(--voyage-bg-light)] flex items-center justify-center text-[var(--voyage-muted)]">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-sm text-white">Traveler</span>
              <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                Verified
              </span>
            </div>
            <p className="text-[var(--voyage-muted)] text-sm leading-relaxed">
              "{review.comment}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
