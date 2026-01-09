# Reviews System Implementation Guide for Voyage

This guide contains all the files and instructions needed to implement the complete reviews system.

## Overview

The reviews system includes:
- **100% Verified Purchase Badge** - All reviews (mock and real) show verified badge
- **Real Reviews Hidden from Public** - Real user reviews only visible in admin dashboard
- **Mock Reviews Only on Public Pages** - Public pages show only auto-generated mock reviews
- Real-time review submission from `/reviews` page and My eSIMs page
- Dynamic review count (mock reviews: 3242+)
- "Trusted Worldwide" section showing latest medium/long reviews with diverse usernames
- HTML entity decoding for proper text display
- Mock review generation with realistic distribution
- Admin reviews management page

---

## Files to Copy

### Backend Files

1. **`apps/backend/src/modules/reviews/reviews.controller.ts`**
   - Handles review creation, fetching, and stats
   - Includes `/reviews/count` endpoint for dynamic counts
   - Allows anonymous reviews
   - Admin endpoint: `GET /admin/reviews` (returns only real reviews)

2. **`apps/backend/src/modules/reviews/reviews.service.ts`**
   - Core review business logic
   - **All reviews return `verified: true`** (100% verified)
   - `getAllReviews()` - Returns all reviews with verified: true
   - `getReviewsByPlanId()` - Returns plan reviews with verified: true
   - `getRealReviewsForAdmin()` - Returns only real reviews for admin dashboard
   - Error handling and logging

3. **`apps/backend/src/modules/reviews/reviews.module.ts`**
   - NestJS module configuration
   - Includes `AdminReviewsController` for admin endpoints

4. **`apps/backend/src/common/utils/sanitize.ts`**
   - Updated to NOT escape apostrophes (for better readability)
   - Still sanitizes other HTML entities

### Frontend Files

1. **`apps/web/app/reviews/page.tsx`**
   - Main reviews page with filters, pagination
   - Write review dialog
   - **Shows ONLY mock reviews** (real reviews hidden)
   - All reviews show verified purchase badge
   - Real-time updates every 30 seconds

2. **`apps/web/components/PlanTrustReviews.tsx`**
   - "Trusted Worldwide" section for plan detail pages
   - Shows only medium/long reviews
   - **Shows ONLY mock reviews** (real reviews hidden)
   - All reviews show verified purchase badge
   - Randomized selection for diverse usernames
   - Updates every 30 seconds

3. **`apps/web/lib/mock-reviews.ts`**
   - Mock review generation with realistic distribution
   - 75% star-only, 15% short, 5% medium, 5% long
   - Diverse usernames (50% fake names, 30% usernames, 20% generic)
   - **100% verified** (all mock reviews have verified: true)
   - Multilingual support (EN, ES, DE, FR, PL, ZH, JA, TH, TL, ID, VI, MS, AR)
   - **Many positive reviews about service, speed, and support**
   - `isMediumOrLongReview()` helper function

4. **`apps/web/lib/utils.ts`**
   - Added `decodeHtmlEntities()` function to decode HTML entities in review text

5. **`apps/web/app/my-esims/page.tsx`**
   - Added "Review" button for each eSIM plan
   - Review modal that passes planId for verified purchase

6. **`apps/web/components/HomeReviewsSection.tsx`**
   - Updated to use "Anonymous" instead of "Verified Customer"
   - Shows only mock reviews

7. **`apps/web/app/admin/reviews/page.tsx`** ⭐ NEW
   - Admin-only page to view all real user reviews
   - Shows user email, plan ID, language, source
   - Delete review functionality
   - Added to admin navigation under "System" group

8. **`apps/web/app/admin/layout.tsx`**
   - Added "Reviews" link to admin navigation (under System group)

### Database Schema

The `Review` model should already exist in your Prisma schema. Verify it has:
- `id`, `planId?`, `userId?`, `userName?`, `rating`, `comment?`, `language?`, `source?`, `verified`, `createdAt`

---

## Implementation Steps

### Step 1: Backend Setup

1. Copy the backend files to your Voyage project
2. Ensure the `Review` model exists in your Prisma schema
3. Make sure `sanitize.ts` is updated (no apostrophe escaping)
4. Register the `ReviewsModule` in your main `app.module.ts`

### Step 2: Frontend Setup

1. Copy all frontend files
2. Install any missing dependencies (check imports)
3. Ensure routes are public (add `/reviews(.*)` to public routes in middleware if needed)
4. Add "Reviews" link to admin navigation in `admin/layout.tsx`

### Step 3: My eSIMs Integration

1. Add the review button and modal to your My eSIMs page
2. Ensure the review modal passes `planId` when submitting

### Step 4: Plan Detail Pages

1. Add `<PlanTrustReviews planId={plan.id} />` to your plan detail pages
2. Place it after the plan specs, before the "Complete Order" button

---

## Key Features Explained

### Verified Purchase Logic

- **ALL reviews show verified badge** - Both mock and real reviews display "Verified Purchase"
- **Backend**: All review endpoints return `verified: true` for all reviews
- **Mock reviews**: 100% have `verified: true`
- **Real reviews**: Backend always returns `verified: true` regardless of purchase status

### Real Reviews vs Mock Reviews

- **Public Pages** (`/reviews`, `PlanTrustReviews`, `HomeReviewsSection`):
  - Show ONLY mock reviews (auto-generated)
  - Real user reviews are completely hidden from public
  
- **Admin Dashboard** (`/admin/reviews`):
  - Shows ONLY real user reviews
  - Admin can view, manage, and delete real reviews
  - Real reviews never appear on public pages

### Review Distribution

- **75%**: Star-only (no text)
- **15%**: Short text (5-12 words)
- **5%**: Medium text (50-150 chars)
- **5%**: Long text (150+ chars)
- **~7%**: Low ratings (1-2 stars)
- **Many positive reviews** about service quality, speed, and customer support

### Dynamic Count

- Mock reviews: base 3242
- Total displayed = Mock reviews count
- Updates in real-time

### Trusted Worldwide Section

- Shows only medium/long reviews (50+ characters)
- Shows ONLY mock reviews
- Sorted by latest date
- Randomized selection from top 20 for diverse usernames
- Updates every 30 seconds
- All reviews show verified badge

---

## API Endpoints

### Public Endpoints
- `POST /api/reviews` - Create review (requires `x-user-email` header, optional)
- `GET /api/reviews/all` - Get all reviews (returns with verified: true)
- `GET /api/reviews/count` - Get total review count
- `GET /api/reviews/plan/:planId` - Get reviews for specific plan (returns with verified: true)
- `GET /api/reviews/stats` - Get review statistics

### Admin Endpoints
- `GET /api/admin/reviews` - Get only real user reviews (admin-only)
- `DELETE /api/admin/reviews/:id` - Delete a review (admin-only)

---

## Environment Variables

No new environment variables needed. Uses existing `NEXT_PUBLIC_API_URL`.

---

## Testing Checklist

- [ ] Submit review from `/reviews` page (should show verified badge, but review hidden from public)
- [ ] Submit review from My eSIMs page (should show verified badge, but review hidden from public)
- [ ] Check that `/reviews` page shows only mock reviews
- [ ] Check that `PlanTrustReviews` shows only mock reviews
- [ ] Check that all reviews show verified purchase badge
- [ ] Verify admin reviews page shows only real user reviews
- [ ] Check that review count displays correctly
- [ ] Verify "Trusted Worldwide" shows different names on refresh
- [ ] Check that HTML entities are decoded properly (apostrophes show correctly)
- [ ] Test with filters on reviews page

---

## Important Notes

1. **All reviews show verified badge** - 100% of reviews (mock and real) display "Verified Purchase"
2. **Real reviews are admin-only** - Real user reviews never appear on public pages
3. **Mock reviews are deterministic** - They generate the same reviews each time, but selection is randomized
4. **HTML entities** - Apostrophes are NOT escaped, but other entities are (and decoded on frontend)
5. **Admin reviews page** - Must wait for admin check to complete before rendering (see code for loading state)

---

## Troubleshooting

**Reviews not showing verified badge:**
- Check that `mock-reviews.ts` has `verified: true` for all reviews
- Check that backend `reviews.service.ts` returns `verified: true` in all methods
- Verify frontend components check `review.verified` before showing badge

**Real reviews appearing on public pages:**
- Ensure `/reviews/page.tsx` only uses `generateReviews()` (no API calls to fetch real reviews)
- Ensure `PlanTrustReviews.tsx` only uses `generateReviews()` (no API calls to fetch real reviews)
- Check that `HomeReviewsSection.tsx` only uses `generateReviews()`

**Admin reviews page redirects:**
- Ensure `useIsAdmin()` hook's `loading` state is checked before redirecting
- Wait for both `isLoaded` and `adminLoading` to be false before checking admin status

**HTML entities showing:**
- Ensure `decodeHtmlEntities()` is being called when displaying review text
- Check that `sanitize.ts` doesn't escape apostrophes

---

## Files Summary

**Backend (4 files):**
- `reviews.controller.ts`
- `reviews.service.ts`
- `reviews.module.ts`
- `common/utils/sanitize.ts` (update existing)

**Frontend (8 files):**
- `app/reviews/page.tsx`
- `components/PlanTrustReviews.tsx`
- `lib/mock-reviews.ts`
- `lib/utils.ts` (add function to existing)
- `app/my-esims/page.tsx` (add review button/modal)
- `components/HomeReviewsSection.tsx` (update existing)
- `app/admin/reviews/page.tsx` ⭐ NEW
- `app/admin/layout.tsx` (add Reviews link)

**Total: 12 files to copy/update**

---

## Quick Prompt for Voyage Cursor

```
I need to implement a complete reviews system with the following features:

1. **100% Verified Purchase Badge** - ALL reviews (mock and real) show verified badge
2. **Real Reviews Hidden from Public** - Real user reviews only visible in admin dashboard
3. **Mock Reviews Only on Public Pages** - Public pages show only auto-generated mock reviews
4. Admin reviews management page
5. Many positive reviews about service, speed, and support in all languages

I have a complete implementation guide with all files listed. Please read REVIEWS_IMPLEMENTATION_GUIDE.md and implement this system in the Voyage project.

Key requirements:
- Backend: reviews controller, service, module + updated sanitize utility
- Frontend: reviews page, PlanTrustReviews component, mock-reviews utility, utils update, My eSIMs review button, admin reviews page
- All reviews show verified badge (100%)
- Public pages show ONLY mock reviews
- Admin dashboard shows ONLY real reviews
- Mock reviews: 100% verified, diverse usernames (50% fake names, 30% usernames, 20% generic)
- Trusted Worldwide: Shows only medium/long reviews, randomized selection for diverse names

Please implement following the guide step by step.
```
