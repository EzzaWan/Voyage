# Cursor prompt: Match auth setup to our reference app (Voyage)

Use this when working on our **second mobile app**. Goal: make auth behave like our **Voyage** app. If the second app’s auth already works (email sign-up, Apple Sign In, no “guest after sign-up”), **don’t change anything**. If it has the same bugs we fixed, apply the same patterns below.

---

## 1. Clerk Dashboard (check first)

Before touching code, verify in **Clerk Dashboard** for the second app’s Clerk instance:

- **Native applications**  
  - iOS app added with correct **App ID prefix (Team ID)** and **Bundle ID** (must match the app’s `bundleIdentifier`).

- **SSO connections → Apple**  
  - Apple OAuth **enabled**, “Enable for sign-up and sign-in” **ON**.  
  - If using native Sign in with Apple, custom credentials (Services ID, private key, Team ID, Key ID) configured as needed.

- **User & authentication → Username**  
  - **“Require username”** must be **OFF** if sign-up is email+password or Apple only with no username field.  
  - If “Require username” is ON and the app doesn’t collect a username, sign-up will never complete and users will end up as guests.  
  - “Sign-up with username” and “Sign-in with username” can stay ON; only “Require username” must be OFF for our flow.

If all of the above already match and the second app’s sign-up and Apple Sign In work, **stop here — no code changes needed**.

---

## 2. Code patterns (only if the second app has the same bugs)

Apply these only if the second app shows: “go to homepage but still guest” after email verification or after Apple Sign In.

### Email sign-up (after verification code)

- After `signUp.attemptEmailAddressVerification({ code })`, **do not** call `setActive` or navigate unless sign-up is complete and you have a session:
  - Check `completeSignUp.status === 'complete'`.
  - Check `completeSignUp.createdSessionId` is truthy.
  - Check `setActive` is available (e.g. from `useSignUp()`).
- Only then: `await setActive({ session: completeSignUp.createdSessionId });` and navigate home.
- If any check fails, show an error (e.g. “Sign-up incomplete…”) and **do not** navigate to home.

### Apple Sign In / Sign Up

- Use Clerk’s **native** flow: `useSignInWithApple()` and `startAppleAuthenticationFlow()` (not only OAuth redirect).
- After `startAppleAuthenticationFlow()`:
  - If `createdSessionId` is truthy: use `setActiveFromOAuth || setActive`, call it with that session, then navigate home.
  - If `createdSessionId` is null: **do not** navigate to home; show an error (e.g. “Apple sign-in failed…”) so the user knows it didn’t complete.
- Ensure `expo-apple-authentication` is in the app’s plugins (e.g. in `app.config.ts` / `app.json`).

### OAuth callback (if the app uses redirect-based OAuth, e.g. Google)

- On the callback route, wait for Clerk to set the session (e.g. `isSignedIn` from `useAuth()` or session in params) before redirecting home.
- Use a timeout (e.g. 8s); if no session after the timeout, redirect to sign-in instead of home, so the user doesn’t land as a guest.

---

## 3. Delete account (App Store / Guideline 5.1.1(v))

If the second app **already has** an in-app “Delete account” flow that works and removes the user from Clerk + your backend, **don’t change it**. Otherwise, match this pattern.

### Backend

- **Endpoint:** `POST /user/delete-account` (or equivalent path).
- **Auth:** Require the user to be signed in (e.g. ClerkAuthGuard that sets `req.userId` from your auth). Optionally add RateLimitGuard and CsrfGuard.
- **Input:** Body `{ clerkUserId: string }` (Clerk user id). Identify the backend user from the auth token/header (e.g. `req.userId` = your DB user id). Validate that `clerkUserId` is present.
- **Logic:**
  1. Ensure `CLERK_SECRET_KEY` is set; if not, return 400 “Account deletion is not configured”.
  2. Optionally verify the user exists in your DB.
  3. Call Clerk: `createClerkClient({ secretKey }).users.deleteUser(clerkUserId)`. If it fails (e.g. user already deleted), log and continue so you still clean your DB.
  4. In a **single Prisma transaction**, delete or anonymize all data that references this user, in **dependency order** (child tables first, then parent). Voyage order: affiliate-related (commissions, referrals, payout requests/methods, fraud events/scores, clicks, signups, then affiliate), referrals by this user, orders → esim profiles → usage/topups, then support tickets (anonymize `userId`), reviews (anonymize `userId` and set `userName: 'Deleted User'`), vCash, mobile tokens, topups by userId, finally the User row.
- **Response:** e.g. `{ success: true, message: 'Account has been deleted.' }`.

Dependencies: `@clerk/backend` for `createClerkClient` and `users.deleteUser`.

### Mobile (profile/settings)

- **Entry:** A “Delete account” menu/button (e.g. in Profile), marked destructive (red).
- **Flow:**
  1. User taps “Delete account” → show a **confirmation modal**.
  2. Modal: short explanation that this permanently deletes their account and data; if they signed in with Apple, add: “If you signed in with Apple, you can revoke this app’s access in your Apple ID settings.” (link to https://support.apple.com/en-us/102571 or similar).
  3. Buttons: Cancel (close modal) and Confirm/Delete (call API).
  4. On confirm: send `POST` to your backend delete-account endpoint with:
     - Header: `x-user-email` (or whatever your auth expects) set to the current user’s email.
     - Body: `JSON.stringify({ clerkUserId: user.id })` (Clerk’s `user.id`).
  5. On success: close modal, call Clerk `signOut()`, then navigate to home or sign-in (e.g. `router.replace('/')`).
  6. On error: show the error in the modal (e.g. “Failed to delete account. Please try again.”) and keep modal open.
- **Loading:** Disable the confirm button and show a spinner while the request is in progress.

---

## 4. Summary

- **If the second app’s auth already works:** don’t change code; only ensure Clerk config (especially “Require username” OFF) is correct for the future.
- **If it has “sign-up then still guest”:** fix Clerk “Require username” first, then apply the code patterns in section 2 so we never call `setActive` with null or navigate home without a real session.
- **Delete account:** If they already have a working in-app delete that removes the user from Clerk and your DB, leave it. Otherwise implement backend (Clerk delete + DB cleanup in a transaction) and mobile (destructive “Delete account” + confirmation modal with Apple revoke note, then signOut and navigate).
