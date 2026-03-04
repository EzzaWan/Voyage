# Affiliate System Flow & Mock Mode Behavior

## 🎁 Give 10%, Get 10% Program

The Voyo affiliate program rewards both the referrer and the referred:
- **Referred Users Get**: 10% off their first eSIM purchase
- **Affiliates Get**: 10% commission on all purchases from referred users (lifetime)

This creates a win-win situation that encourages sharing and grows the user base.

---

## 📋 Complete Affiliate Flow

### Step 1: User Signs Up (Automatic)
When a **new user** is created (first purchase):
- ✅ An `Affiliate` record is automatically created for them
- ✅ A unique referral code is generated (e.g., `ABC12345`)
- ✅ The affiliate record is linked to the user

### Step 2: Referral Capture
1. **Referrer shares link**: `https://yoursite.com/?ref=ABC12345`
2. **New visitor clicks link**: 
   - Frontend detects `?ref=ABC12345` in URL
   - Stores referral code in cookie (`voyage_ref`)
   - Cookie persists for 1 year
   - **Banner appears**: "You've been referred! Get 10% off your first purchase"

### Step 3: New User Makes First Purchase
When the referred user clicks "Buy Now":
1. Referral code is read from cookie
2. Referral code is sent to backend in checkout request
3. Backend stores referral code in Stripe session metadata
4. **10% discount is applied** to the checkout amount (first purchase only)
   - Checkout page shows: "10% First Purchase Discount!"
   - Discount is applied automatically at Stripe checkout

### Step 3.5: First-Purchase Discount Logic
The 10% discount is applied when:
- ✅ User has a referral record (was referred by someone)
- ✅ User's `firstPurchaseDiscountUsed` is `false`
- ✅ User has no previous completed orders

After the first purchase:
- `Referral.firstPurchaseDiscountUsed` is set to `true`
- Subsequent purchases are at full price
- Affiliate still earns 10% commission on all purchases

### Step 4: Payment & User Creation
After Stripe payment succeeds:
1. Backend receives webhook: `checkout.session.completed`
2. User is created/updated in database
3. **If new user**: Affiliate record is created automatically
4. **If referral code exists**: `Referral` record is created linking:
   - Affiliate (owner of code) → Referred User

### Step 5: Order Processing
After payment:
1. Order is created with status `paid`
2. eSIM provisioning happens (real or mock)
3. When eSIM is ready, order status becomes `esim_created`

### Step 6: Commission Generation (10%)
When order status becomes `esim_created`:
1. System checks if the user has a referral
2. If yes, calculates: `commission = order.amountCents * 0.10`
3. Creates `Commission` record
4. Updates affiliate's `totalCommission` field

### Step 7: Top-Up Commissions (10%)
When a top-up is completed:
- Same commission logic applies
- 10% of top-up amount is added to affiliate's commission

---

## 🔄 Mock Mode vs Real Mode

### **Mock Mode Behavior:**

✅ **Orders ARE Created**: Orders are still saved to database in mock mode  
✅ **Commissions ARE Generated**: Commissions work the same in mock mode  
✅ **Purchases DO Appear**: Recent purchases show up in affiliate dashboard  

**Why?**
- Mock mode only affects the **eSIM provider API calls** (eSIM Access API)
- Mock mode does NOT affect:
  - Database operations (Orders, Commissions, Referrals)
  - Stripe payments
  - Affiliate tracking
  - Commission calculations

### Example Flow in Mock Mode:

1. User A shares referral link: `/?ref=ABC12345`
2. User B visits link (cookie stores `ABC12345`)
3. User B makes purchase
4. Stripe processes payment (real or test mode)
5. Order created in DB with status `paid`
6. Mock mode: eSIM provider API returns mock response
7. Order status becomes `esim_created` (even with mock data)
8. **Commission is created** (10% of order amount)
9. Purchase appears in User A's affiliate dashboard

### What Gets Mocked:
- ❌ eSIM Access API calls (`/esim/order`, `/esim/query`, `/esim/topup`)
- ❌ eSIM profile data (ICCID, QR codes, etc.)

### What Still Works (Real):
- ✅ Database records (Orders, Commissions, Referrals)
- ✅ Stripe payments
- ✅ Affiliate tracking
- ✅ Commission calculations
- ✅ Dashboard display

---

## 📊 Affiliate Dashboard Data

The affiliate dashboard shows:
- **Recent Purchases**: All orders/topups from referred users
- **Filter**: Only shows orders with status `paid`, `active`, or `provisioning`
- **Commissions**: All commission records (from both orders and top-ups)

**In Mock Mode:**
- ✅ Orders appear in "Recent Purchases"
- ✅ Commissions are tracked
- ✅ Stats are calculated correctly
- ✅ Referral count is accurate

**Only Difference:**
- The eSIM profiles shown are mock data
- But the orders/commissions are real database records

---

## 💡 Key Points

1. **Give 10%, Get 10%**: Referred users get 10% off their first purchase; affiliates earn 10% commission on all purchases

2. **First-Purchase Discount**:
   - Applied automatically at checkout for referred users
   - Only applies to the FIRST purchase (tracked by `firstPurchaseDiscountUsed` field)
   - Does NOT apply to top-ups (only initial eSIM purchases)
   - Does NOT apply to V-Cash payments

3. **Lifetime Commissions**: Once a referral link is used, ALL future purchases by that user generate commissions (forever)

4. **10% Commission**: Applied to:
   - Initial eSIM purchases (based on discounted amount for first purchase)
   - All top-ups
   - Works in both mock and real mode

5. **No Self-Referrals**: Users cannot refer themselves (system prevents this)

6. **One Referral Per User**: Each user can only have ONE referrer (the first one who referred them)

7. **Cookie-Based Tracking**: Referral code stored in cookie, survives page refreshes and navigation

---

## 🧪 Testing Affiliate System

### Test in Mock Mode:
```
1. User A: Visit /account → Get referral code
2. User A: Share link: /?ref=ABC12345
3. User B: Visit link (cookie stored)
4. User B: Sign up and make purchase
5. User A: Check /account/affiliate → Should see:
   - Referral count: +1
   - Recent purchase from User B
   - Commission record (10% of purchase)
```

### What to Check:
- ✅ Referral code in cookie
- ✅ Referral record created
- ✅ Order appears in "Recent Purchases"
- ✅ Commission calculated correctly
- ✅ Stats update in real-time

---

## 📝 Database Structure

```
User
  └─ Affiliate (1:1)
       ├─ Referral[] (has many)
       └─ Commission[] (has many)

Referral
  ├─ Points to: Affiliate (referrer) → User (referred)
  └─ firstPurchaseDiscountUsed: Boolean (default: false)
     └─ Set to true after first purchase with discount

Commission
  ├─ Links to: Affiliate
  ├─ Links to: Order or TopUp
  └─ amountCents = 10% of purchase (discounted amount for first purchase)
```

---

**Bottom Line**: Mock mode does NOT affect affiliate tracking. All orders, commissions, and referrals work exactly the same whether you're in mock mode or real mode. The only difference is the eSIM provider data is mocked.

