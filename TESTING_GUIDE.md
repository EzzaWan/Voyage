# Voyage eSIM App - Complete Feature List & Testing Guide

## 📋 Table of Contents
1. [Frontend Features (Next.js)](#frontend-features)
2. [Backend API Endpoints](#backend-api-endpoints)
3. [Database Models](#database-models)
4. [Automated Cron Jobs](#automated-cron-jobs)
5. [Webhook Integrations](#webhook-integrations)
6. [External Services](#external-services)

---

## 🎨 Frontend Features (Next.js)

### 1. Homepage Dashboard (`/`)
**Location:** `apps/web/app/page.tsx`

**Features:**
- Display all countries with HD flag icons
- Search functionality to filter countries
- Responsive grid layout
- Animated UI with dark blue theme

**How to Test:**
1. Navigate to `http://localhost:3000`
2. ✅ Verify countries are displayed with flag icons
3. ✅ Type in search box - countries should filter in real-time
4. ✅ Click on any country card - should navigate to country plans page
5. ✅ Check console for any errors

**Expected Behavior:**
- Flags should be HD quality (320px)
- Search should work instantly
- Cards should have hover effects

---

### 2. Countries List Page (`/countries`)
**Location:** `apps/web/app/countries/page.tsx`

**Features:**
- Full list of all available countries/regions
- Search bar for filtering
- Country cards with flags

**How to Test:**
1. Navigate to `http://localhost:3000/countries`
2. ✅ Verify all countries are listed
3. ✅ Test search functionality
4. ✅ Click country card to see plans

---

### 3. Country Plans Page (`/countries/[code]`)
**Location:** `apps/web/app/countries/[code]/page.tsx`

**Features:**
- Display all eSIM plans for a specific country
- Shows plan details (data, validity, price)
- "Buy Now" button for each plan

**How to Test:**
1. Navigate to `http://localhost:3000/countries/US` (or any country code)
2. ✅ Verify plans are displayed
3. ✅ Check prices are in dollars (not cents)
4. ✅ Click "Buy Now" button
5. ✅ Should redirect to plan details page

**Expected Behavior:**
- Plans should show correct pricing (e.g., $0.25, $3.00)
- Prices should be formatted as currency

---

### 4. Plan Details Page (`/plans/[id]`)
**Location:** `apps/web/app/plans/[id]/page.tsx`

**Features:**
- Full plan details
- "Buy Now" button
- Price display

**How to Test:**
1. Navigate to a plan page (e.g., from country plans)
2. ✅ Verify all plan details are shown
3. ✅ Check price is displayed correctly
4. ✅ Click "Buy Now"
5. ✅ Should create order and redirect to Stripe checkout

**Expected Behavior:**
- Price should be in dollars
- Button should trigger order creation

---

### 5. Checkout Pages
**Location:** `apps/web/app/checkout/`

**Pages:**
- `/checkout/[orderId]` - Order checkout page
- `/checkout/success` - Payment success
- `/checkout/cancel` - Payment cancelled

**How to Test:**
1. Create an order by clicking "Buy Now"
2. ✅ Should redirect to Stripe checkout
3. Complete payment with test card: `4242 4242 4242 4242`
4. ✅ Should redirect to success page
5. ✅ Order should be created in database

---

### 6. My eSIMs Page (`/my-esims`)
**Location:** `apps/web/app/my-esims/page.tsx`

**Features:**
- Display user's eSIM profiles
- Show QR codes for installation
- Display eSIM status

**How to Test:**
1. Sign in with Clerk
2. Navigate to `http://localhost:3000/my-esims`
3. ✅ Verify your eSIM profiles are listed
4. ✅ Check QR codes are displayed (if available)
5. ✅ Verify status information

**Prerequisites:**
- Must be authenticated (Clerk)
- Must have at least one completed order

---

### 7. Profile Page (`/profile`)
**Location:** `apps/web/app/profile/page.tsx`

**Features:**
- User profile information

**How to Test:**
1. Sign in with Clerk
2. Navigate to `http://localhost:3000/profile`
3. ✅ Verify profile information is displayed

---

## 🔌 Backend API Endpoints (NestJS)

**Base URL:** `http://localhost:3001/api`

### Public Endpoints

#### 1. GET `/api/countries`
**Returns:** List of all countries with flag URLs

**How to Test:**
```bash
curl http://localhost:3001/api/countries
```

**Expected Response:**
```json
[
  {
    "code": "US",
    "name": "United States",
    "locationLogo": "https://flagcdn.com/w320/us.png"
  },
  ...
]
```

**✅ Success Criteria:**
- Returns array of countries
- Each country has `code`, `name`, and `locationLogo`
- Flags are HD quality (w320)

---

#### 2. GET `/api/countries/:code/plans`
**Returns:** List of eSIM plans for a country

**How to Test:**
```bash
curl http://localhost:3001/api/countries/US/plans
```

**Expected Response:**
```json
[
  {
    "packageCode": "JC016",
    "slug": "US_1GB_7",
    "name": "United States 1GB 7 Days",
    "price": 0.25,
    "currencyCode": "USD",
    "volume": 1073741824,
    "duration": 7,
    ...
  }
]
```

**✅ Success Criteria:**
- Prices are in dollars (decimal), not cents
- All plan details are present

---

#### 3. GET `/api/plans/:id`
**Returns:** Single plan details

**How to Test:**
```bash
curl http://localhost:3001/api/plans/JC016
```

**Expected Response:**
```json
{
  "packageCode": "JC016",
  "name": "United States 1GB 7 Days",
  "price": 0.25,
  ...
}
```

**✅ Success Criteria:**
- Returns single plan object
- Price is in dollars

---

### Order Endpoints

#### 4. POST `/api/orders`
**Creates:** Stripe checkout session for new order

**Request Body:**
```json
{
  "planCode": "JC016",
  "amount": 0.25,
  "currency": "usd",
  "planName": "United States 1GB 7 Days"
}
```

**How to Test:**
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "planCode": "JC016",
    "amount": 0.25,
    "currency": "usd",
    "planName": "Test Plan"
  }'
```

**Expected Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

**✅ Success Criteria:**
- Returns Stripe checkout URL
- Order is created in database with status "pending"
- Amount is validated (minimum $0.50 USD)

**⚠️ Validation:**
- Amounts below $0.50 will be rejected
- Stripe minimum is 50 cents

---

#### 5. GET `/api/orders/retry-now`
**Manually triggers:** Retry cycle for failed orders

**How to Test:**
```bash
curl http://localhost:3001/api/orders/retry-now
```

**Expected Response:**
```json
{
  "message": "Retry cycle completed",
  "timestamp": "2025-12-01T..."
}
```

**✅ Success Criteria:**
- Processes pending orders
- Updates order statuses
- Logs show `[RETRY]` prefix

---

### eSIM Endpoints

#### 6. GET `/api/sync-now`
**Manually triggers:** Sync cycle for all eSIM profiles

**How to Test:**
```bash
curl http://localhost:3001/api/sync-now
```

**Expected Response:**
```json
{
  "message": "Sync cycle completed",
  "timestamp": "2025-12-01T..."
}
```

**✅ Success Criteria:**
- Updates all profile statuses
- Logs show `[SYNC]` prefix

---

### TopUp Endpoints

#### 7. POST `/api/topup/create`
**Creates:** Stripe checkout session for topup

**Request Body:**
```json
{
  "profileId": "uuid-here",
  "planCode": "TOPUP_JC172",
  "amount": 5.00,
  "currency": "usd"
}
```

**How to Test:**
```bash
curl -X POST http://localhost:3001/api/topup/create \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "your-profile-id",
    "planCode": "TOPUP_JC172",
    "amount": 5.00,
    "currency": "usd"
  }'
```

**Expected Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

**✅ Success Criteria:**
- Returns Stripe checkout URL
- TopUp record created with status "pending"
- Profile ID is validated

**💡 Important - Payment Safety:**
- **This endpoint does NOT charge you** - it only creates a checkout URL
- Payment only happens if you complete the Stripe checkout form
- If using **test mode** (keys starting with `sk_test_`), no real money is charged even if you complete checkout
- Use Stripe test cards (e.g., `4242 4242 4242 4242`) to safely test the full flow

---

#### 8. GET `/api/topup/me?userId=...`
**Returns:** List of user's topups

**How to Test:**
```bash
curl "http://localhost:3001/api/topup/me?userId=user-uuid"
```

**Expected Response:**
```json
[
  {
    "id": "topup-uuid",
    "status": "completed",
    "amountCents": 500,
    "profile": {
      "id": "profile-uuid",
      "iccid": "..."
    },
    ...
  }
]
```

**✅ Success Criteria:**
- Returns array of topups
- Includes profile information
- Ordered by creation date (newest first)

---

### User Endpoints

#### 9. GET `/api/user/esims?email=...`
**Returns:** User's eSIM profiles by email

**How to Test:**
```bash
curl "http://localhost:3001/api/user/esims?email=user@example.com"
```

**Expected Response:**
```json
[
  {
    "id": "profile-uuid",
    "iccid": "...",
    "qrCodeUrl": "...",
    "esimStatus": "IN_USE",
    ...
  }
]
```

**✅ Success Criteria:**
- Returns user's profiles
- Includes all profile details

---

### Webhook Endpoints

#### 10. POST `/api/webhooks/stripe`
**Receives:** Stripe webhook events

**How to Test:**
1. Use Stripe CLI to forward webhooks:
   ```bash
   stripe listen --forward-to http://localhost:3001/api/webhooks/stripe
   ```
2. Trigger a test payment
3. ✅ Check backend logs for webhook processing

**Supported Events:**
- `checkout.session.completed` - Processes order or topup
- `payment_intent.succeeded` - Retries pending orders

**✅ Success Criteria:**
- Webhook signature is verified
- Orders/topups are processed correctly
- Logs show webhook events

---

## 🗄️ Database Models

### Models in Prisma Schema:

1. **User**
   - `id`, `email`, `name`
   - Relations: `orders[]`, `profiles[]`, `topups[]`

2. **Plan**
   - Cached snapshot of provider plans
   - `id`, `providerId`, `locationCode`, `name`, etc.

3. **Order**
   - `id`, `userId`, `planId`, `amountCents`, `status`
   - Relations: `profiles[]`

4. **EsimProfile**
   - `id`, `orderId`, `esimTranNo`, `iccid`, `qrCodeUrl`
   - Relations: `order`, `topups[]`

5. **TopUp**
   - `id`, `userId`, `profileId`, `planCode`, `status`
   - Relations: `user`, `profile`

6. **WebhookEvent**
   - Stores webhook payloads for audit

**How to Test Database:**
```bash
# Check database connection
npx prisma studio
# Opens browser at http://localhost:5555
```

**✅ Success Criteria:**
- All models visible in Prisma Studio
- Relations are working
- Data persists correctly

---

## ⏰ Automated Cron Jobs

### 1. eSIM Retry Cron (`EsimRetryCron`)
**File:** `apps/backend/src/cron/esim-retry.cron.ts`
**Schedule:** Every 2 minutes

**What it does:**
- Finds orders with status: `esim_no_orderno`, `esim_pending`, `esim_order_failed`
- Retries eSIM order creation with provider
- Polls for profile allocation
- Updates order status

**How to Test:**
1. Create an order that fails (or manually set status)
2. Wait 2 minutes
3. ✅ Check logs for `[CRON][ESIM-RETRY]`
4. ✅ Check database - order status should update

**Log Pattern:**
```
[CRON][ESIM-RETRY] Running retry cycle...
[CRON][ESIM-RETRY] Found X pending order(s)
[RETRY] Processing order...
```

---

### 2. eSIM Sync Cron (`EsimSyncCron`)
**File:** `apps/backend/src/cron/esim-sync.cron.ts`
**Schedule:** Every 15 minutes

**What it does:**
- Fetches all eSIM profiles from database
- Queries provider for latest status/usage
- Updates profile fields (status, volume, etc.)

**How to Test:**
1. Wait 15 minutes
2. ✅ Check logs for `[CRON][ESIM-SYNC]`
3. ✅ Check database - profiles should be updated

**Log Pattern:**
```
[CRON][ESIM-SYNC] Syncing all profiles...
[CRON][ESIM-SYNC] Found X profile(s)
[SYNC] Updated profile...
```

---

### 3. TopUp Retry Cron (`TopUpRetryCron`)
**File:** `apps/backend/src/cron/topup-retry.cron.ts`
**Schedule:** Every 3 minutes

**What it does:**
- Finds topups with status: `pending`, `processing`
- Polls provider to check if recharge was applied
- Updates topup status to `completed` when done

**How to Test:**
1. Create a topup
2. Wait 3 minutes
3. ✅ Check logs for `[CRON][TOPUP-RETRY]`
4. ✅ Check database - topup status should update

**Log Pattern:**
```
[CRON][TOPUP-RETRY] Running topup retry cycle...
[CRON][TOPUP-RETRY] Found X pending/processing topup(s)
[TOPUP] Polling recharge order...
```

---

## 🔔 Webhook Integrations

### Stripe Webhooks
**Endpoint:** `POST /api/webhooks/stripe`

**Supported Events:**

1. **checkout.session.completed**
   - Routes to `ordersService.handleStripePayment()` for orders
   - Routes to `topUpService.handleStripeTopUp()` for topups (if `metadata.type === 'topup'`)

2. **payment_intent.succeeded**
   - Retries pending orders

**How to Test:**
```bash
# Install Stripe CLI
stripe listen --forward-to http://localhost:3001/api/webhooks/stripe

# In another terminal, trigger test events
stripe trigger checkout.session.completed
```

**✅ Success Criteria:**
- Webhooks are received
- Signature verification passes
- Orders/topups are processed
- Logs show processing

---

### eSIM Access Webhooks (Future)
**Endpoint:** `POST /api/webhooks/esim` (may need implementation)

**Expected Events:**
- `ORDER_STATUS`
- `SMDP_EVENT`
- `ESIM_STATUS`
- `DATA_USAGE`
- `VALIDITY_USAGE`

---

## 🔐 Authentication (Clerk)

**Protected Routes:**
- `/checkout/*` - Requires authentication
- `/my-esims` - Requires authentication

**How to Test:**
1. Navigate to protected route
2. ✅ Should redirect to sign-in if not authenticated
3. Sign in with Clerk
4. ✅ Should have access to protected routes

**Environment Variables Needed:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

---

## 💳 Payment Flow (Stripe)

### Complete Order Flow:

1. **Frontend:** User clicks "Buy Now"
   - POST `/api/orders`
   - Receives Stripe checkout URL

2. **User:** Completes payment on Stripe

3. **Webhook:** `checkout.session.completed` received
   - Creates/updates User
   - Creates Order (status: `paid`)
   - Calls eSIM provider `/esim/order`
   - Polls for profile allocation
   - Creates EsimProfile

4. **Cron:** Retry jobs handle failures
   - Retries failed orders every 2 minutes
   - Syncs profiles every 15 minutes

**Test Card:**
- Number: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

**✅ Success Criteria:**
- Payment succeeds
- Order created in database
- eSIM profile allocated
- QR code available in "My eSIMs"

---

## 📊 Testing Checklist

### Quick Smoke Test:
- [x] Homepage loads with countries and flags
- [x] Search works on homepage
- [x] Can navigate to country plans
- [x] Can view plan details
- [x] Can create order (stripe checkout)
- [x] Webhook processes payment
- [x] Order status updates correctly
- [x] eSIM profile created
- [x] Can view eSIMs in "My eSIMs"

### API Testing:

**Quick Test Commands (copy-paste ready):**

1. **GET `/api/countries`** - Test countries list:
   ```bash
   curl http://localhost:3001/api/countries | jq
   ```
   ✅ **Check:** Should return array with `code`, `name`, `locationLogo` fields

2. **GET `/api/countries/:code/plans`** - Test plans for a country:
   ```bash
   curl http://localhost:3001/api/countries/US/plans | jq
   # Or try: NL, GB, FR, etc.
   ```
   ✅ **Check:** Should return array of plans with `packageCode`, `name`, `price` (in dollars)

3. **POST `/api/orders`** - Create order checkout:
   ```bash
   curl -X POST http://localhost:3001/api/orders \
     -H "Content-Type: application/json" \
     -d '{
       "planCode": "P7B64E9XP",
       "amount": 0.55,
       "currency": "usd",
       "planName": "Test Plan"
     }' | jq
   ```
   ✅ **Check:** Should return `{"url": "https://checkout.stripe.com/..."}`
   ⚠️ **Note:** Amount must be >= $0.50 (50 cents)

4. **GET `/api/orders/retry-now`** - Manually trigger retry:
   ```bash
   curl http://localhost:3001/api/orders/retry-now | jq
   ```
   ✅ **Check:** Should return message and check backend logs for `[RETRY]` logs

5. **POST `/api/topup/create`** - Create topup checkout:
   ```bash
   # First, get a profile ID from your database or from /api/user/esims
   curl -X POST http://localhost:3001/api/topup/create \
     -H "Content-Type: application/json" \
     -d '{
       "profileId": "YOUR_PROFILE_ID_HERE",
       "planCode": "P7B64E9XP",
       "amount": 5.00,
       "currency": "usd"
     }' | jq
   ```
   ✅ **Check:** Should return `{"url": "https://checkout.stripe.com/..."}`
   💡 **Tip:** Get profile ID from: `curl "http://localhost:3001/api/user/esims?email=YOUR_EMAIL" | jq '.[0].id'`

6. **GET `/api/topup/me`** - Get user's topups:
   ```bash
   # Replace USER_ID with actual user UUID from database
   curl "http://localhost:3001/api/topup/me?userId=USER_ID" | jq
   ```
   ✅ **Check:** Should return array of topups with `status`, `amountCents`, `profile` fields
   💡 **Tip:** Get userId from: `curl "http://localhost:3001/api/user/esims?email=YOUR_EMAIL" | jq '.[0].userId'`

**Checklist:**
- [x] GET `/api/countries` returns data
- [x] GET `/api/countries/:code/plans` returns plans
- [x] POST `/api/orders` creates checkout
- [x] GET `/api/orders/retry-now` works
- [x] POST `/api/topup/create` creates topup checkout
- [x] GET `/api/topup/me` returns topups

**💡 Pro Tips:**
- Add `| jq` at the end to pretty-print JSON (requires `jq` tool installed)
- On Windows PowerShell, use `Invoke-WebRequest` instead of `curl`
- Check backend logs while testing to see detailed processing
- Use Prisma Studio (`npx prisma studio`) to verify database records

### Cron Jobs:
- [x] eSIM retry runs every 2 min (check logs)
- [x] eSIM sync runs every 15 min (check logs)
- [x] TopUp retry runs every 3 min (check logs)

### Database:
- [x] User records created
- [x] Order records created
- [x] EsimProfile records created
- [x] TopUp records created
- [x] Relations work correctly

---

## 🐛 Common Issues & Solutions

### Issue: Flags not showing
**Solution:** Check `next.config.js` has flagcdn.com in remotePatterns

### Issue: Prices showing incorrectly
**Solution:** Check backend converts provider units (/10000) and frontend displays dollars

### Issue: Webhook fails
**Solution:** Ensure raw body is preserved, check STRIPE_WEBHOOK_SECRET

### Issue: Cron jobs not running
**Solution:** Check ScheduleModule is imported in CronModule

### Issue: Circular dependency errors
**Solution:** Use `forwardRef()` when modules import each other

---

## 📝 Environment Variables Required

**Backend (.env):**
```
DATABASE_URL=postgresql://...
ESIM_ACCESS_CODE=...
ESIM_SECRET_KEY=...
ESIM_API_BASE=https://api.esimaccess.com/api/v1/open
STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
REDIS_URL=redis://localhost:6379
WEB_URL=http://localhost:3000
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

---

## 🚀 Quick Start Testing Commands

```bash
# Start backend
cd apps/backend
npm run dev

# Start frontend (in new terminal)
cd apps/web
npm run dev

# Check database
npx prisma studio

# Test API endpoints
curl http://localhost:3001/api/countries
curl http://localhost:3001/api/countries/US/plans

# Monitor cron jobs (check backend logs)
# Look for [CRON][ESIM-RETRY], [CRON][ESIM-SYNC], [CRON][TOPUP-RETRY]
```

---

## ✅ All Features Summary

### Frontend:
- ✅ Homepage with countries and flags
- ✅ Country plans listing
- ✅ Plan details page
- ✅ Checkout flow
- ✅ My eSIMs page
- ✅ Profile page
- ✅ Clerk authentication

### Backend:
- ✅ Country/plan listing APIs
- ✅ Order creation with Stripe
- ✅ eSIM provisioning flow
- ✅ TopUp creation and processing
- ✅ User eSIM listing
- ✅ Webhook handling
- ✅ Manual retry/sync endpoints

### Automation:
- ✅ eSIM retry cron (2 min)
- ✅ eSIM sync cron (15 min)
- ✅ TopUp retry cron (3 min)

### Database:
- ✅ User model
- ✅ Order model
- ✅ EsimProfile model
- ✅ TopUp model
- ✅ WebhookEvent model
- ✅ Plan model

---

**Last Updated:** December 1, 2025

