# Files to Copy to Voyage Project

## Backend Files (4 files)

1. `apps/backend/src/modules/reviews/reviews.controller.ts`
2. `apps/backend/src/modules/reviews/reviews.service.ts`
3. `apps/backend/src/modules/reviews/reviews.module.ts`
4. `apps/backend/src/common/utils/sanitize.ts` (update existing file - remove apostrophe escaping)

## Frontend Files (8 files)

1. `apps/web/app/reviews/page.tsx`
2. `apps/web/components/PlanTrustReviews.tsx`
3. `apps/web/lib/mock-reviews.ts`
4. `apps/web/lib/utils.ts` (add `decodeHtmlEntities()` function to existing file)
5. `apps/web/app/my-esims/page.tsx` (add review button/modal section)
6. `apps/web/components/HomeReviewsSection.tsx` (update existing file)
7. `apps/web/app/admin/reviews/page.tsx` ⭐ NEW FILE
8. `apps/web/app/admin/layout.tsx` (add "Reviews" link to navigation)

## Database

- Ensure `Review` model exists in Prisma schema with all required fields
- No new migrations needed (Review model should already exist)

## Key Changes Summary

- **All reviews show verified badge** (100%)
- **Real reviews hidden from public** (admin-only)
- **Mock reviews only on public pages**
- **Admin reviews page** for managing real reviews
- **Many positive reviews** about service, speed, support

## Implementation Order

1. Copy backend files → Register ReviewsModule
2. Copy frontend files → Add admin navigation link
3. Test public pages (should show only mock reviews with verified badge)
4. Test admin page (should show only real reviews)
5. Test review submission (should work but reviews hidden from public)

