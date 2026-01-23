import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';
import { useToast } from '../src/context/ToastContext';

interface Review {
  id: string;
  author: string;
  rating: number;
  comment?: string;
  date: string;
  verified?: boolean;
  language?: string;
  source?: string;
}

const ITEMS_PER_PAGE = 20;
const AVERAGE_RATING = 4.8;

// Generate realistic mock reviews
function generateMockReviews(count: number): Review[] {
  const firstNames = ['Sarah', 'James', 'Emma', 'Michael', 'Olivia', 'William', 'Sophia', 'Daniel', 'Ava', 'David', 'Mia', 'Noah', 'Isabella', 'Ethan', 'Charlotte', 'Alex', 'Maria', 'John', 'Anna', 'Tom'];
  const lastInitials = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'W', 'Y', 'Z'];
  
  const positiveComments = [
    'Super easy to set up! Had data working within minutes of landing.',
    'Great value for the price. Used it throughout my 2-week trip.',
    'Fast delivery, worked perfectly in Japan. Will use again!',
    'So convenient compared to buying local SIMs at the airport.',
    'Excellent coverage and speeds. Highly recommend.',
    'Saved so much money compared to my carrier roaming rates.',
    'QR code arrived instantly. Setup was a breeze.',
    'Used it in multiple European countries without any issues.',
    'Customer support was very helpful when I had questions.',
    'Perfect for digital nomads. Been using it for months now.',
    'Worked great in Thailand, even in remote areas.',
    'The app makes everything so simple. Love it!',
    'Best eSIM provider I have used. Period.',
    'Fast speeds even for video calls. Impressed!',
    'Reliable service throughout my business trip.',
  ];
  
  const reviews: Review[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastInitial = lastInitials[Math.floor(Math.random() * lastInitials.length)];
    
    // Weight ratings towards 5 stars (70% 5-star, 20% 4-star, 7% 3-star, 3% lower)
    let rating = 5;
    const rand = Math.random();
    if (rand > 0.70) rating = 4;
    if (rand > 0.90) rating = 3;
    if (rand > 0.97) rating = Math.floor(Math.random() * 2) + 1;
    
    // 60% have comments
    const hasComment = Math.random() > 0.4;
    
    // Random date within last 90 days
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    reviews.push({
      id: `mock-${i}`,
      author: `${firstName} ${lastInitial}.`,
      rating,
      comment: hasComment ? positiveComments[Math.floor(Math.random() * positiveComments.length)] : undefined,
      date: date.toISOString(),
      verified: Math.random() > 0.2, // 80% verified
    });
  }
  
  // Sort by date (newest first)
  return reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export default function Reviews() {
  const router = useRouter();
  const toast = useToast();
  const { user, isLoaded } = useUser();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterTextOnly, setFilterTextOnly] = useState(false);
  
  // Write review modal
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    loadReviews();
  }, []);
  
  const loadReviews = () => {
    setLoading(true);
    // Simulate loading
    setTimeout(() => {
      const mockReviews = generateMockReviews(500);
      setReviews(mockReviews);
      setLoading(false);
    }, 500);
  };
  
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      if (filterRating && review.rating !== filterRating) return false;
      if (filterTextOnly && !review.comment) return false;
      return true;
    });
  }, [reviews, filterRating, filterTextOnly]);
  
  const displayedReviews = filteredReviews.slice(0, visibleCount);
  
  const handleLoadMore = () => {
    if (visibleCount < filteredReviews.length) {
      setVisibleCount(prev => prev + ITEMS_PER_PAGE);
    }
  };
  
  const handleSubmitReview = async () => {
    if (!user) {
      toast.info('Sign in required', 'Please sign in to leave a review.');
      return;
    }
    
    setSubmitting(true);
    try {
      const userEmail = user.primaryEmailAddress?.emailAddress;
      const userName = user.fullName || userEmail?.split('@')[0] || 'Anonymous';
      
      await apiFetch('/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || '',
        },
        body: JSON.stringify({
          userName,
          rating: newRating,
          comment: newComment.trim() || undefined,
        }),
      });
      
      toast.success('Thank you!', 'Your review has been submitted and will be reviewed by our team.');
      setShowWriteModal(false);
      setNewComment('');
      setNewRating(5);
    } catch (error) {
      toast.error('Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  const renderStars = (rating: number, size: number = 14, interactive: boolean = false, onPress?: (star: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => interactive && onPress?.(star)}
            disabled={!interactive}
            activeOpacity={interactive ? 0.7 : 1}
          >
            <Text style={[
              styles.star,
              { fontSize: size },
              star <= rating && styles.starFilled,
            ]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  const renderReview = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewRating}>
          {renderStars(item.rating)}
          {item.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
        <Text style={styles.reviewDate}>{formatDate(item.date)}</Text>
      </View>
      
      {item.comment ? (
        <Text style={styles.reviewComment}>{item.comment}</Text>
      ) : (
        <Text style={styles.reviewNoComment}>Rated without comment</Text>
      )}
      
      <Text style={styles.reviewAuthor}>{item.author}</Text>
    </View>
  );
  
  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* Rating Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.averageRating}>{AVERAGE_RATING}</Text>
        {renderStars(Math.round(AVERAGE_RATING), 24)}
        <Text style={styles.totalReviews}>
          Based on {reviews.length.toLocaleString()}+ reviews
        </Text>
        
        {isLoaded && user && (
          <TouchableOpacity
            style={styles.writeReviewButton}
            onPress={() => setShowWriteModal(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.writeReviewButtonText}>Write a Review</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filterRating === null && !filterTextOnly && styles.filterChipActive,
          ]}
          onPress={() => { setFilterRating(null); setFilterTextOnly(false); }}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.filterChipText,
            filterRating === null && !filterTextOnly && styles.filterChipTextActive,
          ]}>All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterChip, filterTextOnly && styles.filterChipActive]}
          onPress={() => setFilterTextOnly(!filterTextOnly)}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.filterChipText,
            filterTextOnly && styles.filterChipTextActive,
          ]}>With Text</Text>
        </TouchableOpacity>
        
        {[5, 4, 3].map((rating) => (
          <TouchableOpacity
            key={rating}
            style={[styles.filterChip, filterRating === rating && styles.filterChipActive]}
            onPress={() => setFilterRating(filterRating === rating ? null : rating)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.filterChipText,
              filterRating === rating && styles.filterChipTextActive,
            ]}>{rating}★</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.showingText}>
        Showing {displayedReviews.length} of {filteredReviews.length} reviews
      </Text>
    </View>
  );
  
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <FlatList
        data={displayedReviews}
        renderItem={renderReview}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          visibleCount < filteredReviews.length ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={handleLoadMore}
              activeOpacity={0.8}
            >
              <Text style={styles.loadMoreText}>Load More Reviews</Text>
            </TouchableOpacity>
          ) : null
        }
      />
      
      {/* Write Review Modal */}
      <Modal
        visible={showWriteModal}
        animationType="none"
        transparent={true}
        onRequestClose={() => setShowWriteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write a Review</Text>
              <TouchableOpacity
                onPress={() => setShowWriteModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalLabel}>Rating</Text>
            {renderStars(newRating, 32, true, setNewRating)}
            
            <Text style={styles.modalLabel}>Comment (optional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Share your experience..."
              placeholderTextColor={theme.colors.textMuted}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              numberOfLines={4}
              maxLength={1000}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{newComment.length}/1000</Text>
            
            <TouchableOpacity
              style={[
                styles.submitButton,
                submitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitReview}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  listContent: {
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingTop: theme.spacing.md,
    paddingBottom: 40,
  },
  
  // Header Section
  headerSection: {
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 8,
    paddingLeft: 16,
    paddingRight: 16,
    marginBottom: theme.spacing.lg,
  },
  summaryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  averageRating: {
    fontSize: 56,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  totalReviews: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  writeReviewButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  writeReviewButtonText: {
    ...theme.typography.body,
    fontWeight: '600' as const,
    color: theme.colors.white,
  },
  
  // Filters
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  filterChip: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  showingText: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  
  // Stars
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    color: theme.colors.border,
  },
  starFilled: {
    color: '#FFD700',
  },
  
  // Review Card
  reviewCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.round,
    gap: 4,
  },
  verifiedIcon: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '700',
  },
  verifiedText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '600',
  },
  reviewDate: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  reviewComment: {
    ...theme.typography.body,
    color: theme.colors.text,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  reviewNoComment: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
  },
  reviewAuthor: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  },
  
  // Load More
  loadMoreButton: {
    backgroundColor: theme.colors.card,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: theme.spacing.sm,
  },
  loadMoreText: {
    ...theme.typography.body, fontWeight: '500' as const,
    color: theme.colors.text,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.xl,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: theme.colors.text,
  },
  modalClose: {
    fontSize: 24,
    color: theme.colors.textMuted,
  },
  modalLabel: {
    ...theme.typography.body, fontWeight: '500' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  commentInput: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.text,
    minHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 16,
  },
  charCount: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  submitButtonText: {
    ...theme.typography.body,
    fontWeight: '600' as const,
    color: theme.colors.white,
  },
});




