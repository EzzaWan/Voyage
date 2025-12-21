"use client";

import { ReviewsSection } from "@/components/ReviewsSection";

export default function ReviewsPage() {
  return (
    <div className="space-y-8">
      <div>
          <h1 className="text-4xl font-bold text-white mb-4">Customer Reviews</h1>
          <p className="text-[var(--voyage-muted)] text-lg">See what travelers are saying about Voyage Data.</p>
      </div>
      <ReviewsSection />
    </div>
  );
}
