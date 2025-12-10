# Fix Prisma Generation Issues

## Problem
TypeScript compilation errors because Prisma client is out of sync with schema. The Prisma client needs to be regenerated, but it's currently locked because the backend is running.

## Solution

### Step 1: Stop the Backend Server
Stop the running backend server (Ctrl+C in the terminal where it's running).

### Step 2: Regenerate Prisma Client
```bash
npx prisma generate
```

### Step 3: Restart Backend
```bash
cd apps/backend
npm run dev
```

## What Was Fixed

1. ✅ Added missing `AffiliateFraudEvent` model to Prisma schema
2. ✅ Added missing `AffiliateFraudScore` model to Prisma schema
3. ✅ Fixed duplicate unique constraint on `AffiliateSignup.userId`
4. ✅ Added missing imports in `webhooks.service.ts`:
   - `AffiliateAnalyticsService`
   - `FraudDetectionService`
5. ✅ Added missing dependencies in `webhooks.controller.ts`:
   - `PrismaService`
   - `FraudService`
6. ✅ Fixed `distinct` usage in analytics service (changed to `findMany` with `distinct`)

## After Regeneration

Once Prisma client is regenerated, all TypeScript errors should be resolved because:
- `prisma.affiliateClick` will be available
- `prisma.affiliateSignup` will be available
- `prisma.affiliateFraudEvent` will be available
- `prisma.affiliateFraudScore` will be available
- Relations like `fraudScore` and `clicks` will be recognized in `include` statements

## Verification

After regenerating, check that:
1. No TypeScript errors in compilation
2. Backend starts successfully
3. All endpoints are accessible

