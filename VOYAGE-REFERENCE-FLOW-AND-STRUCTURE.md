# Voyage (Voyo) — Reference: Flow, Logic, Implementation & Structure

This document describes **how Voyage works** in terms of flow, logic, implementation, and structure. Use it as a reference when building a **new** eSIM selling site that should follow the same patterns (without reusing Voyage’s design, UI, or UX).

---

## 1. Repository & app structure

### 1.1 Monorepo layout

- **Root**: npm workspaces (`apps/web`, `apps/backend`, `apps/worker`, `libs/*`).
- **Apps**
  - **`apps/web`**: Next.js (App Router) — marketing, plans, checkout, my-eSIMs, admin.
  - **`apps/backend`**: NestJS (Node/TypeScript) — REST API, webhooks, cron.
  - **`apps/worker`**: Optional worker (e.g. BullMQ) for async jobs (provisioning, webhooks).
  - **`apps/mobile`**: Expo/React Native — same backend API; Clerk for auth; `x-user-email` for API auth.
- **Libs**
  - **`libs/esim-access`**: Shared SDK for the eSIM provider API (auth, signing, packages, order, query, topup, usage, webhooks). Used by backend (and optionally worker).

### 1.2 Backend module layout

Backend is organized by feature modules. Main ones:

- **EsimModule** — locations, packages, plan details, mock mode, markup.
- **OrdersModule** — create order, pending order, Stripe checkout, V-Cash checkout, guest access, retry/sync.
- **StripeModule** — Stripe client, checkout sessions, webhook signature verification.
- **WebhooksModule** — Stripe, Clerk, eSIM provider webhooks.
- **UsersModule** — get user eSIMs by email, delete account (Clerk + DB).
- **TopUpModule** — top-up checkout (Stripe), complete top-up, retry.
- **AffiliateModule** — referral codes, commissions, payouts, fraud.
- **VCashModule** — balance, debit/credit (e.g. refunds, pay with V-Cash).
- **CurrencyModule** — convert USD ↔ display currency; default currency from admin.
- **CronModule** — eSIM retry, eSIM sync, top-up retry, commission availability.
- **AdminModule** — settings (mock, markup, default currency), admin-only routes.
- **EmailModule**, **ReceiptModule**, **SupportModule**, **ReviewsModule**, **BlogModule**, **DeviceModule**, **LogModule**, **CommonModule**.

---

## 2. Authentication

### 2.1 Identity provider: Clerk

- **Web**: Clerk (`@clerk/nextjs`) — sign-in, sign-up (email + verification), Apple/Google OAuth. Session drives “logged in” state.
- **Mobile**: Clerk (Expo) — same; use **native** Apple flow (`useSignInWithApple`, `startAppleAuthenticationFlow`) and only call `setActive` when `createdSessionId` is truthy so the user does not land as a guest after sign-up.
- **Backend does not use Clerk tokens for validation.** It identifies the user by **email** passed in a header.

### 2.2 Backend “auth”: email header

- **Protected routes** use `ClerkAuthGuard` (or equivalent): require header **`x-user-email`** (current user’s email from Clerk).
- Backend looks up `User` by email (normalized: lowercase, trim) and attaches `req.userId` / `req.userEmail`. No JWT validation; trust comes from the frontend sending the same email Clerk has for the session.
- **Web**: Next.js API routes or server components get the session from Clerk and pass the user’s email in `x-user-email` when calling the backend.
- **Mobile**: After Clerk sign-in, store/retrieve the user’s email and send it as `x-user-email` on every API request (e.g. in `apiFetch` or axios interceptor).

### 2.3 User record in DB

- **User** is created:
  - On **Clerk `user.created` webhook**: upsert by email, set name; then create **Affiliate** for that user; optionally **link guest orders** with that email to this user.
  - On **first order (guest or logged-in)**: if no user exists for the given email, backend creates a `User` (e.g. in `createPendingOrder` or `handleStripePayment`).
- **Linking guest orders**: When a user is created or confirmed (e.g. after Clerk sign-up), backend calls `linkGuestOrdersToUser(email, userId)` to reassign all orders (and their eSIM profiles) from that email to this user id.

### 2.4 Delete account (App Store / 5.1.1(v))

- **Backend**: `POST /user/delete-account` (or equivalent). Body: `{ clerkUserId: string }`. Auth: identify user from `x-user-email` (or your auth header).
  - Call Clerk: `createClerkClient({ secretKey }).users.deleteUser(clerkUserId)`.
  - In a **single Prisma transaction**, delete or anonymize all data that references this user in **dependency order** (e.g. affiliate-related tables, referrals, orders → esim profiles → usage/topups, support tickets anonymized, reviews anonymized, vCash, mobile tokens, then `User`).
- **Client**: “Delete account” in profile/settings → confirmation modal (with Apple revoke note if using Sign in with Apple) → call delete-account API with `clerkUserId: user.id` → on success: `signOut()`, then navigate to sign-in/home.

---

## 3. Order and payment flow

### 3.1 Principle: charge first, then provision

- **Preferred flow**: Create a **pending** order, collect payment (Stripe or V-Cash); only after payment is confirmed, call the eSIM provider to create the eSIM. This avoids charging the provider balance before the customer pays.

### 3.2 Create order (pending) — step 1

- **Endpoint**: `POST /orders`  
  Body: `planCode`, `amount` (USD number), `currency`, `planName`, `displayCurrency?`, `referralCode?`, `email?`, `duration?` (for unlimited/day-pass plans), `paymentMethod?` (`'stripe' | 'vcash'`).
- **Logic**:
  - If `paymentMethod === 'vcash'`: require `email`; upsert user by email; check V-Cash balance; debit V-Cash; create order with `status: 'paid'`, `paymentMethod: 'vcash'`; then trigger eSIM provisioning and emails (same as post-payment flow). Return success.
  - If Stripe (default): create **pending** order:
    - Resolve user: if `email` provided, upsert user by email; else create a **guest** user (e.g. `guest-{uuid}@voyoesim.com`).
    - Create `Order` with `status: 'pending'`, `paymentMethod: 'stripe'`, `planId: planCode`, `amountCents` (USD cents), `displayCurrency` / `displayAmountCents` (optional), `duration` if provided.
  - Return `{ orderId }`.
- **Frontend**: From plan page, call `POST /orders` with plan details and optional email (from Clerk if logged in). Then redirect to **checkout page** for that `orderId` (e.g. `/checkout/{orderId}`).

### 3.3 Checkout page (review + pay)

- **Get order**: `GET /orders/:orderId` — returns order details (id, planId, amountCents, displayAmountCents, displayCurrency, status, EsimProfile if any, duration).
- **Update email (guest)**: `POST /orders/:orderId/update-email` with `{ email }` — only if order is pending; upserts user by email and sets `order.userId` to that user.
- **Promo**:  
  - Validate: `POST /orders/:orderId/validate-promo` with `{ promoCode }`. Backend has a fixed map of codes → discount percent; applies discount to pending order and returns new amounts.  
  - Remove: `POST /orders/:orderId/remove-promo` with `originalAmount`, `originalDisplayAmount` to restore.
- **Referral discount (first purchase 10%)**:  
  - Check: `GET /orders/:orderId/referral-discount?referralCode=XXX`. Backend checks: no other completed order for this user, valid referral code, not self-referral, first-purchase discount not yet used.  
  - At **create Stripe checkout** (see below), pass `referralCode` in body; backend applies 10% and stores in session metadata; after successful payment, backend marks `Referral.firstPurchaseDiscountUsed`.
- **Create Stripe session**: `POST /orders/:orderId/checkout` with optional `{ referralCode }`.  
  - Backend loads pending order; optionally applies referral 10% (only for first purchase); converts amount to display currency; creates Stripe Checkout Session with **metadata**: `orderId`, `planCode`, `amountUSD`, `originalAmountUSD`, `displayCurrency`, `referralCode`, `referralDiscountApplied`, `referralId`.  
  - Success URL: e.g. `{WEB_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`; cancel URL: checkout page.  
  - Return `{ url }`; frontend redirects to `url` (Stripe Hosted Checkout).

### 3.4 After payment: webhook and order completion

- **Stripe webhook**: `POST /webhooks/stripe`. Verify signature with `STRIPE_WEBHOOK_SECRET` and `rawBody`.
  - **`checkout.session.completed`**:
    - If `metadata.type === 'topup'` → hand off to **top-up** flow (see Top-up).
    - Else: **order payment** — call `ordersService.handleStripePayment(session)`.
- **handleStripePayment(session)**:
  - Read `metadata.orderId`. If present (**pending-order flow**):
    - Load order and user; update user email/name from `session.customer_details` if needed (e.g. replace guest email).
    - Amount: use `metadata.amountUSD` (or convert from `session.amount_total` + currency).
    - Update order: `status: 'paid'`, `paymentRef` (e.g. payment_intent id), `esimOrderNo: 'PENDING-...'`, `displayCurrency`, `displayAmountCents`.
    - Affiliate/referral: ensure user has Affiliate; if `metadata.referralCode`, create Referral if not exists; if `metadata.referralDiscountApplied` and `metadata.referralId`, set `Referral.firstPurchaseDiscountUsed = true`.
    - Then call **processOrderCompletion**: send order confirmation email, send guest access email, call **performEsimOrderForOrder** (provision eSIM).
  - If no `metadata.orderId` (legacy): create new User (upsert by email), create new Order with `status: 'paid'`, then same processOrderCompletion.
- **performEsimOrderForOrder(order, user, planCode)**:
  - Build `transactionId` (e.g. `stripe_{orderId}` or `vcash_{orderId}`; provider may require &lt; 50 chars).
  - Resolve **provider price** in provider units (from provider API or fallback from marked-up amount); build `packageInfoList` (e.g. `packageCode`, `count: 1`, `price`, optionally `periodNum` for duration).
  - `POST /esim/order` to provider with `transactionId`, `packageInfoList`, `amount`.
  - On success: get `orderNo` from response; **poll** `POST /esim/query` with `orderNo` until `esimList` has at least one profile (with retries/delay).
  - Create or update **EsimProfile** (orderId, userId, iccid, qrCodeUrl, ac, esimStatus, expiredTime, totalVolume, etc.).
  - Update order `status: 'esim_created'`.
  - Add **commission** for referral (if applicable; not for V-Cash).
  - Send **eSIM ready** email (with receipt download link); set `order.receiptSent = true`.

### 3.5 Success page

- **GET** order by session: e.g. `GET /orders/by-session/:sessionId` (backend retrieves Stripe session, reads `metadata.orderId`, or finds order by `paymentRef`).
- Show order status and link to “My eSIMs” or order detail. Store guest email in localStorage if needed for “view order” later.

### 3.6 Guest access to order (no account)

- **Request link**: `POST /orders/:orderId/request-guest-access` with `{ email }`. Backend verifies email matches order’s user email; generates a **signed token** (e.g. HMAC of `orderId` + email + expiry, 7 days); sends email with link `{APP_URL}/orders/{orderId}?token=...&email=...`.
- **View order**: `GET /orders/:orderId/guest?token=...&email=...`. Backend verifies token and email; returns order + EsimProfile so guest can see QR and details.
- Token format: payload (orderId, email, type, exp) + HMAC, then base64url; validate signature and expiry.

### 3.7 Currency and amounts

- **Internal storage**: Always **USD cents** (`amountCents`) for order amount and commission. Display currency and display amount are stored separately (`displayCurrency`, `displayAmountCents`) for receipts and UI.
- **Stripe**: Checkout amount is in **display currency** (converted from USD via CurrencyService). Minimum charge equivalent to $0.50 USD enforced.
- **Provider**: Prices in provider-specific units (e.g. 1/10000th); backend converts from USD cost (or fetches current package price) when calling `/esim/order`.

---

## 4. eSIM provider integration

### 4.1 Shared SDK (`libs/esim-access`)

- **Responsibility**: Signing (e.g. HMAC-SHA256 with timestamp, requestId, accessCode, body), HTTP client, typed methods for:
  - **Locations**: e.g. `POST /location/list` → list of regions/countries (code, name, type, subLocation).
  - **Packages**: get packages by location; response includes packageCode, price (provider units), volume, validity, etc.
  - **Order**: `POST /esim/order` with `transactionId`, `packageInfoList`, `amount`.
  - **Query**: `POST /esim/query` with `orderNo`, pager → `esimList` (iccid, qrCodeUrl, ac, esimStatus, expiredTime, totalVolume, etc.).
  - **Top-up**, **usage**, **profile actions** (suspend/unsuspend/cancel/revoke), **webhooks** (parse/verify).
- **Config**: `ESIM_ACCESS_CODE`, `ESIM_SECRET_KEY`, `ESIM_API_BASE` (and optional mock/base URL override).

### 4.2 Backend use of provider

- **EsimService** (backend) wraps the SDK; checks **admin mock mode** — if enabled, order/query/topup can return mock data without calling provider.
- **Markup**: Admin has a default markup percent. Package prices from provider are converted to USD cents, markup applied, then (optionally) converted to display currency for API responses.
- **Plans**: `GET /plans/:planCode` (or by slug) returns plan details for a package (name, packageCode, location, volume, duration, price in display currency). Used by checkout and emails.

### 4.3 Provisioning retry and sync (cron)

- **Retry pending orders**: Cron finds orders in `esim_pending`, `esim_no_orderno`, or `esim_order_failed`; for each, calls provider again (same transactionId, packageCode, amount/periodNum), then polls query; on success, creates/updates EsimProfile and sends emails if not already sent (`receiptSent`).
- **Sync profiles**: Cron loads all EsimProfiles; for each, calls `/esim/query` and optionally `/esim/usage/query`; updates `esimStatus`, `totalVolume`, `expiredTime`, `orderUsage`, and writes **EsimUsageHistory** when usage changes.
- **Manual**: e.g. `GET /orders/retry-now` triggers one retry cycle (for debugging).

---

## 5. Top-up flow

- **Get top-up plans**: Backend endpoint that calls provider (e.g. top-up packages for an ICCID/location).
- **Create top-up checkout**: `POST /topup/checkout` (or similar) with `profileId`, `planCode`, amount, currency. Backend creates Stripe Checkout Session with **metadata**: `type: 'topup'`, `profileId`, `planCode`, `amountUSD`; creates **TopUp** row `status: 'pending'`, `paymentRef: session.id`.
- **Webhook**: On `checkout.session.completed`, if `metadata.type === 'topup'`, call **topUpService.handleStripeTopUp(session)** — create/update TopUp record, call provider top-up API, update profile, send confirmation email.
- **Retry**: Cron retries pending/failed top-ups similar to orders.

---

## 6. Affiliate and referral

### 6.1 Model

- **Affiliate**: One per user (created on user creation via Clerk webhook or first order). Fields: `userId`, `referralCode` (unique, e.g. nanoid 8 uppercase).
- **Referral**: Links affiliate to referred user: `affiliateId`, `referredUserId`; `firstPurchaseDiscountUsed` (boolean) for “Give 10% Get 10%”.
- **Commission**: Per completed (paid) order for a referred user; amount in USD cents; status (pending/available/paid); V-Cash orders do **not** create commission.

### 6.2 Flow

- **Referral code at checkout**: Stored in cookie or query param; sent when creating Stripe session. Backend creates **Referral** if valid (code exists, not self-referral) and applies 10% discount only for **first purchase** (no other completed order for that user); after payment, set `firstPurchaseDiscountUsed = true`.
- **Commission**: After eSIM is created for an order (`addCommissionForOrder`), if user has a Referral, create **Commission** (e.g. 10% of order amount in USD cents). Refunds: Stripe `charge.refunded` / `payment_intent.canceled` webhook triggers **reverseCommission** and order status update.
- **Payout**: Affiliate can request payout; admin approves; payouts and fraud (e.g. chargeback) are tracked; high-risk can freeze affiliate.

---

## 7. Promo codes

- **Validate**: `POST /orders/:orderId/validate-promo` with `{ promoCode }`. Backend keeps a map (e.g. code → discount percent); only for **pending** orders; applies discount to `amountCents` and `displayAmountCents` (respect Stripe minimum). Returns new amounts and promo info.
- **Remove**: `POST /orders/:orderId/remove-promo` with `originalAmount`, `originalDisplayAmount` to restore (for pending only).

---

## 8. V-Cash (store credit)

- **Balance**: Stored in **VCashBalance** (userId, balanceCents). **VCashTransaction** records debit/credit with reason and metadata.
- **Pay with V-Cash**: In create-order flow, when `paymentMethod === 'vcash'`, backend debits balance, creates order as `paid`, then runs same provisioning and email flow.
- **Refund to V-Cash**: Admin or refund flow can credit user’s V-Cash instead of card refund; create VCashTransaction and update VCashBalance.

---

## 9. Webhooks summary

| Source   | Endpoint           | Security                    | Main handling                                                                 |
|----------|--------------------|-----------------------------|-------------------------------------------------------------------------------|
| Stripe   | POST /webhooks/stripe | Signature (rawBody + secret) | checkout.session.completed → order or top-up; payment_intent.succeeded → retry; charge.refunded → reverse commission; disputes → fraud      |
| Clerk    | POST /webhooks/clerk  | Svix signature              | user.created → upsert User, create Affiliate, linkGuestOrdersToUser; user.updated → update name |
| eSIM     | POST /webhooks/esim   | Optional secret header + IP | Verify (optional), persist WebhookEvent, enqueue processing (e.g. ORDER_STATUS, ESIM_STATUS)   |

- **CSRF**: Applied to state-changing requests (POST/PUT/PATCH/DELETE) except webhooks. Client sends header `x-csrf-token` (e.g. 64-char hex). Backend validates format (and optionally server-side token). Webhooks are excluded.

---

## 10. Security and guards

- **Rate limiting**: Per-route decorator (e.g. N requests per window); applied to order creation, checkout, promo, guest access.
- **CSRF**: Guard on non-GET requests; requires `x-csrf-token` in correct format; skip for webhooks.
- **Auth**: Protected routes use guard that requires `x-user-email` and resolve `userId` from DB.
- **Admin**: Admin routes check email against allowed list (env or AdminSettings).
- **Receipt download**: `GET /orders/:id/receipt` — allow if `x-user-email` (or query `email`) matches order’s user, or `x-admin-email` is admin.

---

## 11. Mobile app (Expo) and API

- **Same backend**: Mobile uses same REST base URL; all order, user, eSIM, top-up, affiliate endpoints are shared.
- **Auth**: Clerk (Expo). After sign-in, get user email and send **`x-user-email`** on every request. Token cache for session.
- **CSRF**: Mobile generates a 64-char hex CSRF token per session and sends it in **`x-csrf-token`** on POST/PUT/PATCH/DELETE.
- **API client**: Central `apiFetch(basePath, { method, headers, body, authToken })` that adds base URL, CSRF for state-changing, and auth header if needed.
- **Deep links**: Success/cancel URLs for Stripe can point to web; for native payment sheet, handle return and then fetch order by session or payment ref.

---

## 12. Database (Prisma) — main models

- **User**: id, email (unique), name, createdAt.
- **Order**: id, userId, planId, amountCents, currency, displayCurrency, displayAmountCents, status (pending | paid | provisioning | esim_created | …), paymentMethod (stripe | vcash), paymentRef, esimOrderNo, duration, receiptSent, refund fields.
- **EsimProfile**: id, orderId, userId?, esimTranNo, iccid, qrCodeUrl, ac, smdpStatus, esimStatus, totalVolume, orderUsage, expiredTime.
- **EsimUsageHistory**: profileId, usedBytes, recordedAt.
- **Affiliate**: id, userId (unique), referralCode (unique), totalCommission, isFrozen.
- **Referral**: id, affiliateId, referredUserId (unique), firstPurchaseDiscountUsed.
- **Commission**: id, affiliateId, orderId?, orderType, amountCents, status, availableAt.
- **TopUp**: id, userId, profileId, planCode, amountCents, status, paymentRef, rechargeOrder.
- **VCashBalance**: userId (PK), balanceCents, updatedAt.
- **VCashTransaction**: id, userId, type, amountCents, reason, metadata.
- **SupportTicket**, **Review**, **BlogPost**, **AdminSettings**, **WebhookEvent**, **EmailLog**, **DeviceSupport**, etc.

---

## 13. Email

- **Order confirmation**: After payment (Stripe or V-Cash); includes order summary, plan name, guest access link.
- **Guest access**: Link to view order with token (sent with order confirmation for every order).
- **eSIM ready**: When EsimProfile is created; includes QR, ICCID, status, receipt download link; then set `receiptSent = true`.
- **Receipt**: Can be sent again via `POST /orders/:id/resend-receipt`; if profile exists, send eSIM-ready email, else receipt-only.
- **Templates**: Handlebars (or similar) under backend templates; variables for user, order, plan, profile, URLs.

---

## 14. Key implementation details to replicate

1. **Order flow**: Always create a **pending** order first (with user/guest by email); then Stripe Checkout with **orderId in metadata**; webhook updates that order and runs provisioning. No “create eSIM then charge”.
2. **User identity**: Backend uses **email in header** (`x-user-email`), not Clerk JWT. Clerk is used only on frontend/mobile for session; backend trusts the email for protected routes.
3. **Guest and link**: Guests get a user row (by email or placeholder); after payment, “guest access” link (signed token) lets them view order without account; when they sign up, **linkGuestOrdersToUser** merges orders to their account.
4. **Currency**: Store USD cents; convert to display currency for Stripe and API responses; respect Stripe minimum.
5. **Referral**: One referral code per user (Affiliate); 10% first-purchase discount; commission only on non–V-Cash paid orders; mark first-purchase discount used only **after** successful payment.
6. **eSIM**: Single SDK in lib; backend applies markup and optional mock; after payment, call provider order API, poll query, then create EsimProfile and send eSIM-ready email; cron retry and sync usage/status.
7. **Webhooks**: Stripe (signature), Clerk (Svix), eSIM (optional secret + IP); CSRF only on non-webhook state-changing requests.
8. **Delete account**: One endpoint that deletes user in Clerk and, in one transaction, removes/anonymizes all related data in dependency order.

---

## 15. API surface (backend routes)

- **Public**: `GET /esim/locations`, `GET /esim/packages/:locationCode`, `GET /plans/:planCode`, `GET /device/check`, blog/support/reviews as needed.
- **Orders**: `POST /orders`, `GET /orders/:id`, `GET /orders/by-session/:sessionId`, `POST /orders/:orderId/update-email`, `POST /orders/:orderId/validate-promo`, `POST /orders/:orderId/remove-promo`, `GET /orders/:orderId/referral-discount`, `POST /orders/:orderId/checkout`, `GET /orders/:id/receipt`, `POST /orders/:id/resend-receipt`, `POST /orders/:orderId/request-guest-access`, `GET /orders/:orderId/guest`, `GET /orders/retry-now`.
- **Users**: `GET /user/esims` (query by email from header), `POST /user/delete-account` (body: clerkUserId).
- **Top-up**: `GET /topup/plans` (or similar), `POST /topup/checkout`.
- **Affiliate**: `GET /affiliate/me`, `POST /affiliate/track-signup`, `GET /affiliate/track-click`, payout endpoints.
- **VCash**: `GET /vcash/balance`, (admin or internal debit/credit).
- **Webhooks**: `POST /webhooks/stripe`, `POST /webhooks/clerk`, `POST /webhooks/esim`.
- **Admin**: Under a prefix (e.g. `/admin`), settings, orders, users, affiliates, payouts, logs; guarded by admin email check.
- Base path may be under `/api` (e.g. `NEXT_PUBLIC_API_URL` = `https://api.example.com/api`). All state-changing POST/PUT/PATCH/DELETE send `x-csrf-token`; authenticated routes send `x-user-email`.

---

## 16. Quick checklist for a new eSIM site

- [ ] Monorepo or separate backend; shared eSIM SDK or equivalent.
- [ ] Auth: Clerk (or equivalent) on frontend; backend identifies user by email header.
- [ ] Order: Create pending order → Stripe Checkout with orderId in metadata → webhook updates order and provisions eSIM.
- [ ] User: Created on Clerk webhook + on first order; guest orders linked when user signs up.
- [ ] Guest access: Signed token (orderId + email + expiry); request link by email; view order with token + email.
- [ ] Currency: Store USD cents; convert for display and Stripe; Stripe minimum.
- [ ] Referral: One code per user; 10% first purchase; commission after eSIM created; no commission for V-Cash.
- [ ] Promo: Validate and apply on pending order; restore with original amounts.
- [ ] Top-up: Stripe session with type=topup in metadata; webhook routes to top-up handler.
- [ ] Webhooks: Stripe (signature), Clerk (Svix), eSIM (optional); CSRF on state-changing, not on webhooks.
- [ ] Cron: Retry failed eSIM orders; sync profile status/usage.
- [ ] Delete account: Clerk delete + single DB transaction for all user-related data.

Use this document as the single reference for **flow, logic, implementation, and structure** when building a new eSIM site that should behave like Voyage without reusing its design or UX.
