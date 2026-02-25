# Apple review fixes – plan (updated with Sign in with Apple REST API)

## Reference: Sign in with Apple REST API first

Per [Sign in with Apple REST API](https://developer.apple.com/documentation/signinwithapplerestapi) and [TN3194: Handling account deletions and revoking tokens](https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple):

- **Token revocation** is the only programmatic way to invalidate user tokens: `POST https://appleid.apple.com/auth/revoke` with `client_id`, `client_secret` (JWT, ES256, from your Apple private key), `token` (refresh_token or access_token), `token_type_hint` (e.g. `refresh_token`). See [Revoke tokens](https://developer.apple.com/documentation/signinwithapplerestapi/revoke-tokens).
- To revoke, you must have a **refresh token or access token**. You get these by exchanging the authorization code with `POST https://appleid.apple.com/auth/token` and storing the response (id_token, access_token, refresh_token). See [Generate and validate tokens](https://developer.apple.com/documentation/signinwithapplerestapi/generate-and-validate-tokens).
- **If you don’t have the user’s refresh/access token:** You must still fulfill the account deletion request: delete all user data, revert client to unauthenticated state, and you may direct the user to [manually revoke access](https://support.apple.com/en-us/102571) for your app. You cannot call `/auth/revoke` without a token.

**Implication for this app:** Auth is handled by Clerk; the app sends Apple `identityToken` to Clerk and does not exchange the code for refresh_token on our backend. So we do **not** have Apple refresh/access tokens stored. Account deletion will: (1) delete user and data in our backend, (2) delete the user in Clerk, (3) optionally show in UI a link to Apple’s “Manage your Apple ID” / revoke page so the user can revoke the app there. No server-side call to Apple `/auth/revoke` unless we later add a backend flow that receives and stores Apple refresh tokens.

---

## 1. Guideline 2.1 – Sign in with Apple spinner spins indefinitely

**Cause:** `startAppleOAuth()` can hang (redirect/callback never fires), so `setOauthLoading(null)` never runs.

**Fix (mobile only):**

- In [apps/mobile/app/(auth)/sign-in.tsx](apps/mobile/app/(auth)/sign-in.tsx) and [apps/mobile/app/(auth)/sign-up.tsx](apps/mobile/app/(auth)/sign-up.tsx):
  - Wrap the Apple flow in `Promise.race` with a ~45–60s timeout.
  - On timeout: clear `oauthLoading`, set error (e.g. “Sign in took too long. Please try again.”).
  - If `startAppleOAuth` resolves but `createdSessionId` is falsy: clear loading and set an error (don’t leave spinner running).

---

## 2. Guideline 5.1.1(v) – In-app account deletion

Per [Offering account deletion in your app](https://developer.apple.com/support/offering-account-deletion-in-your-app) and TN3194:

- **Backend:** New endpoint (e.g. `POST /user/delete-account`) that:
  - Authenticates the user (e.g. existing `x-user-email` + ClerkAuthGuard, or Clerk JWT verification).
  - Deletes/anonymizes the user and all related data (User, Affiliate, SupportTicket, Review, V-Cash, Orders/EsimProfile per retention rules).
  - Deletes the user in Clerk via Backend API (`clerkClient.users.deleteUser(userId)`).
  - Does **not** call Apple `/auth/revoke` (we don’t have refresh_token). Optionally store a “revoked” or “deletion requested” flag if we add server-to-server or token storage later.
- **Apple side:** In the delete-account confirmation screen, add a short note and link: “If you signed in with Apple, you can revoke this app’s access in [Apple ID settings](https://support.apple.com/en-us/102571).” This satisfies TN3194 when we don’t have tokens.

**Mobile:** In [apps/mobile/app/profile.tsx](apps/mobile/app/profile.tsx):

- Add a “Delete account” row (destructive) for signed-in users.
- Two-step confirmation, then call backend delete endpoint, then `signOut()` and redirect.
- In the confirmation step, include the optional line about revoking Apple access at the link above.

---

## 3. Order of implementation

1. **Sign in with Apple spinner fix** (mobile) – timeout + missing-session handling.
2. **Backend account deletion** – endpoint, Clerk user deletion, DB user + related data.
3. **Mobile account deletion** – Profile “Delete account”, confirmation, API call, sign out, optional Apple revoke link.
