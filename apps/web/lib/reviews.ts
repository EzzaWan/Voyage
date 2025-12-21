import { safeFetch } from './safe-fetch';

export interface Review {
  id: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  verified: boolean;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Convert backend review format to frontend format
const formatReview = (review: any): Review => ({
  id: review.id,
  userName: review.userName,
  rating: review.rating,
  comment: review.comment,
  date: new Date(review.createdAt).toISOString().split('T')[0],
  verified: review.verified,
});

export const getReviews = async (limit?: number): Promise<Review[]> => {
  try {
    const url = limit 
      ? `${apiUrl}/reviews?limit=${limit}`
      : `${apiUrl}/reviews`;
    
    const response = await safeFetch<{ reviews: any[] }>(url, { showToast: false });
    return response.reviews.map(formatReview);
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return [];
  }
};

// Custom event to notify other tabs/components of changes
const dispatchStorageEvent = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('reviews-updated'));
  }
};

export const addReview = async (
  review: Omit<Review, 'id' | 'date' | 'verified'>,
  userEmail?: string
): Promise<Review> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (userEmail) {
    headers['x-user-email'] = userEmail;
  }

  const response = await safeFetch<any>(`${apiUrl}/reviews`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
    }),
    errorMessage: 'Failed to submit review. Please try again.',
  });

  dispatchStorageEvent();
  return formatReview(response);
};

export const deleteReview = async (id: string): Promise<void> => {
  await safeFetch(`${apiUrl}/reviews/${id}`, {
    method: 'DELETE',
    errorMessage: 'Failed to delete review. Please try again.',
  });
  
  dispatchStorageEvent();
};

