# Migration Files List - Quick Reference

## 📋 PART 1: AFFILIATE "GIVE 10% GET 10%" DISCOUNT

### Database
- `prisma/schema.prisma` - Add `firstPurchaseDiscountUsed` field to `Referral` model

### Backend
- `apps/backend/src/modules/orders/orders.service.ts`
  - Update `createStripeCheckoutForOrder()` - Add referral discount logic
  - Update `handleStripePayment()` - Mark discount as used after payment
  - Add/Update `checkReferralDiscountEligibility()` - Check eligibility

- `apps/backend/src/modules/orders/orders.controller.ts`
  - Update `createCheckoutSession()` - Accept `referralCode` in body
  - Add `checkReferralDiscount()` - New GET endpoint

### Frontend - Web
- `apps/web/app/checkout/[orderId]/page.tsx` - Add referral discount UI and checkout logic
- `apps/web/app/account/affiliate/page.tsx` - Update dashboard with "Give 10% Get 10%" messaging
- `apps/web/lib/referral.ts` - Ensure `getReferralCode()` function exists
- `apps/web/components/ReferralDiscountBanner.tsx` - Update banner (if exists)
- `apps/web/app/layout.tsx` - Include ReferralDiscountBanner (if using site-wide banner)

### Frontend - Mobile
- `apps/mobile/app/checkout.tsx` - Add referral discount UI and checkout logic
- `apps/mobile/app/affiliate.tsx` - Update dashboard with "Give 10% Get 10%" messaging
- `apps/mobile/src/utils/referral.ts` - Add mobile referral functions (create if doesn't exist)

---

## 📋 PART 2: PLAN FILTER (1GB 7 DAYS PLANS)

### Frontend - Web
- `apps/web/lib/plan-utils.ts`
  - Add `hasFUP()` function
  - Add `is1GB7DaysPlan()` function
  - Update `isPlanVisible()` - Allow 1GB 7 days to bypass price check
  - Update `groupPlansByDataSize()` - Allow 1GB 7 days plans
  - Update `getDurationsForSize()` - Allow 1GB 7 days plans
  - Update `filterVisiblePlans()` - Allow 1GB 7 days plans

### Frontend - Mobile
- `apps/mobile/src/utils/planUtils.ts`
  - Add `hasFUP()` function
  - Add `is1GB7DaysPlan()` function
  - Update `isPlanVisible()` - Allow 1GB 7 days to bypass price check
  - Update `filterVisiblePlans()` - Allow 1GB 7 days plans

---

## 📋 PART 3: ADMIN DELETE FUNCTIONALITY

### Backend
- `apps/backend/src/modules/admin/controllers/admin-orders.controller.ts`
  - Add `Delete` import
  - Add `deleteOrder()` endpoint

- `apps/backend/src/modules/admin/controllers/admin-users.controller.ts`
  - Add `Delete` import
  - Add `AdminService` import and injection
  - Add `deleteUser()` endpoint

### Frontend - Web
- `apps/web/components/admin/AdminTable.tsx`
  - Add `render` prop to `Column` interface
  - Update cell rendering to support custom render functions
  - Add `React` import

- `apps/web/app/admin/orders/page.tsx`
  - Add imports: `Button`, `Trash2`, `useToast`
  - Add state: `deletingOrderId`
  - Add `handleDeleteOrder()` function
  - Add "Actions" column with delete button

- `apps/web/app/admin/users/page.tsx`
  - Add imports: `Button`, `Trash2`, `useToast`
  - Add state: `deletingUserId`
  - Add `handleDeleteUser()` function
  - Add "Actions" column with delete button

---

## 📊 SUMMARY

**Total Files to Modify:**
- Database: 1 file
- Backend: 4 files
- Frontend Web: 8 files
- Frontend Mobile: 3 files

**Total: 16 files**

---

## 🔍 KEY SEARCH TERMS

If files don't exist or have different names, search for:
- `createStripeCheckoutForOrder` - Order checkout creation
- `handleStripePayment` - Payment webhook handler
- `filterVisiblePlans` - Plan filtering logic
- `isPlanVisible` - Plan visibility check
- `AdminTable` - Admin table component
- `admin/orders` - Admin orders page
- `admin/users` - Admin users page
- `Referral` model - Database model
- `getReferralCode` - Referral code retrieval

---

## ⚠️ IMPORTANT NOTES

1. **Cookie Name**: May be different (e.g., `cheapesims_ref` instead of `voyage_ref`)
2. **API URL**: May use different base URL or endpoint structure
3. **Prisma Models**: Model names may differ (e.g., `EsimProfile` vs `ESimProfile`)
4. **Admin Service**: `AdminService.logAction()` may not exist - remove or create
5. **Icon Library**: May use different icon library
6. **Toast Library**: May use different toast/notification system









