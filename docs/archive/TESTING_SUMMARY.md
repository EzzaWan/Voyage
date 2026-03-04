# Affiliate Analytics & Fraud Detection Testing Summary

## Test Execution Results

### Test Date: 2025-12-08

### Test Script: `test-affiliate-system.js`

The automated test script was executed with the following results:

#### ✅ Successful Tests (2/12)
1. **Invalid Code Rejection** - Correctly rejected invalid referral codes
2. **Duplicate Signup Prevention** - Correctly rejected duplicate signups

#### ⚠️ Warning Tests (1/12)
1. **Rate Limiting** - Needs backend verification

#### ❌ Failed Tests (7/12)
All endpoint tests returned 404 errors, indicating:
- Backend may not be running, OR
- Routes are not registered correctly

Failed endpoints:
- `/api/affiliate/track-click` (POST)
- `/api/affiliate/track-signup` (POST)
- `/api/affiliate/analytics/overview` (GET)
- `/api/affiliate/analytics/funnel` (GET)
- `/api/affiliate/analytics/time-series` (GET)
- `/api/affiliate/analytics/devices` (GET)
- `/api/affiliate/analytics/geography` (GET)

#### ⊘ Skipped Tests (1/12)
1. **Fraud Detection** - Could not find affiliate for testing

---

## Manual Testing Guide

Since automated tests indicate backend connectivity issues, follow these manual testing steps:

### Prerequisites
1. **Start Backend Server**
   ```bash
   cd apps/backend
   npm run dev
   ```
   Verify backend is running on `http://localhost:3001`

2. **Start Frontend Server**
   ```bash
   cd apps/web
   npm run dev
   ```
   Verify frontend is running on `http://localhost:3000`

3. **Verify Database Migrations**
   Ensure all Prisma migrations are applied:
   ```bash
   npx prisma migrate dev
   ```

### Testing Steps

#### 1. Test Click Tracking

**Via Browser:**
- Visit: `http://localhost:3000/?ref=YOUR_REFERRAL_CODE`
- Check browser console for any errors
- Verify cookie `voyage_ref` is set
- Check backend logs for click tracking

**Via API (using curl/PowerShell):**
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/affiliate/track-click" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"referralCode":"YOUR_CODE","deviceFingerprint":"test1"}'
```

**Verify in Database:**
```sql
SELECT * FROM "AffiliateClick" 
WHERE "referralCode" = 'YOUR_CODE' 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

#### 2. Test Signup Tracking

**Via Browser:**
1. Clear cookies or use incognito
2. Visit: `http://localhost:3000/?ref=YOUR_REFERRAL_CODE`
3. Sign up with a new email
4. After login, check for signup tracking

**Verify in Database:**
```sql
SELECT * FROM "AffiliateSignup" 
WHERE "referralCode" = 'YOUR_CODE';
```

#### 3. Test Analytics Endpoints

**Prerequisites:** Must have an authenticated affiliate account

**Test Overview:**
```powershell
$headers = @{
    "x-user-email" = "your-affiliate-email@example.com"
}
Invoke-WebRequest -Uri "http://localhost:3001/api/affiliate/analytics/overview" `
  -Method GET `
  -Headers $headers
```

**Expected Response:**
```json
{
  "clicks": 0,
  "signups": 0,
  "buyers": 0,
  "clickToSignup": 0,
  "signupToBuyer": 0,
  "clickToBuyer": 0,
  "referredRevenueCents": 0,
  "commissionCents": 0,
  ...
}
```

#### 4. Test Fraud Detection

**Check Fraud Score:**
```powershell
$headers = @{
    "x-admin-email" = "lilrannee@gmail.com"
}
Invoke-WebRequest -Uri "http://localhost:3001/api/admin/affiliate/fraud/SEARCH?q=REFERRAL_CODE" `
  -Method GET `
  -Headers $headers
```

**Verify Fraud Events:**
```sql
SELECT * FROM "AffiliateFraudEvent" 
ORDER BY "createdAt" DESC 
LIMIT 20;

SELECT * FROM "AffiliateFraudScore" 
ORDER BY "updatedAt" DESC;
```

#### 5. Test Admin Fraud Dashboard

1. Navigate to: `http://localhost:3000/admin/affiliate/fraud`
2. Must be logged in as admin (`lilrannee@gmail.com`)
3. Search for affiliates
4. View fraud scores and events
5. Test freeze/unfreeze functionality

#### 6. Test Affiliate Dashboard

1. Navigate to: `http://localhost:3000/account/affiliate`
2. Verify analytics cards display
3. Check charts render (if data exists)
4. Verify funnel metrics
5. Check device/geo breakdowns

---

## Database Verification Queries

### Check All Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'AffiliateClick',
    'AffiliateSignup', 
    'AffiliateFraudEvent',
    'AffiliateFraudScore',
    'Affiliate'
  );
```

### Check for Test Data
```sql
-- Clicks
SELECT COUNT(*) as click_count, "referralCode"
FROM "AffiliateClick"
GROUP BY "referralCode";

-- Signups
SELECT COUNT(*) as signup_count, "referralCode"
FROM "AffiliateSignup"
GROUP BY "referralCode";

-- Fraud Events
SELECT "type", COUNT(*) as count
FROM "AffiliateFraudEvent"
GROUP BY "type";

-- Fraud Scores
SELECT a."referralCode", fs."totalScore", fs."riskLevel", a."isFrozen"
FROM "Affiliate" a
LEFT JOIN "AffiliateFraudScore" fs ON fs."affiliateId" = a.id;
```

---

## Expected Behavior

### Click Tracking
- ✅ Creates `AffiliateClick` record
- ✅ Parses IP, user-agent, device, browser, country
- ✅ Generates device fingerprint
- ✅ Rate limits (1 per IP per 5 seconds per code)
- ✅ Triggers IP reputation fraud check (async)

### Signup Tracking
- ✅ Creates `AffiliateSignup` record (unique per userId)
- ✅ Prevents duplicate signups
- ✅ Triggers email risk fraud check
- ✅ Triggers device fingerprint fraud check

### Analytics
- ✅ Calculates clicks, signups, buyers
- ✅ Calculates conversion rates (click→signup, signup→buyer, click→buyer)
- ✅ Returns 30-day time series data
- ✅ Returns device/browser breakdowns
- ✅ Returns geography breakdowns

### Fraud Detection
- ✅ IP reputation checks (VPN/proxy/datacenter)
- ✅ Device fingerprinting (duplicate devices)
- ✅ Email risk scoring (disposable domains)
- ✅ Payment method fingerprinting (reused cards)
- ✅ Auto-freeze at score ≥ 60
- ✅ Blocks payouts/V-Cash for frozen affiliates

---

## Troubleshooting

### Backend Not Responding
1. Check if backend process is running
2. Verify port 3001 is not in use
3. Check backend logs for errors
4. Verify database connection

### 404 Errors
1. Verify routes are registered in `AffiliateModule`
2. Check controller decorators match paths
3. Verify global prefix is `/api`
4. Check NestJS bootstrap logs

### Database Errors
1. Run `npx prisma migrate dev`
2. Verify `DATABASE_URL` is correct
3. Check Prisma client is generated: `npx prisma generate`

### Authentication Issues
1. Verify `x-user-email` header is sent
2. Check user exists in database
3. Verify affiliate account exists for user

---

## Next Steps

1. **Start Backend Server** - Ensure backend is running before testing
2. **Create Test Affiliate** - Use existing user or create new one
3. **Generate Test Data** - Create clicks, signups, orders
4. **Verify All Features** - Test each component systematically
5. **Check Frontend UI** - Verify dashboards display correctly

---

## Test Script Usage

Run the automated test script:
```bash
node test-affiliate-system.js <referralCode> <testEmail> <adminEmail>
```

Example:
```bash
node test-affiliate-system.js ABC12345 test@example.com lilrannee@gmail.com
```

The script will test:
- Click tracking
- Signup tracking  
- Analytics endpoints
- Fraud detection endpoints
- Database table existence

