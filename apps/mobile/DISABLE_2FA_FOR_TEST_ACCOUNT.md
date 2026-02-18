# How to Disable 2FA and Email Verification for App Store Review Test Account

Since your app uses **Clerk** for authentication, you need to disable both 2FA and email verification for the test account in the Clerk Dashboard.

## 🚀 Quick Fix (Most Common Issue)

**If the app is asking for email verification:**

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → **Users**
2. Find your test account (e.g., `appreview@yourdomain.com`)
3. Click on the user
4. In **"Email addresses"** section, click on the email address
5. Click **"Verify"** or **"Mark as verified"** button
6. The email is now verified - no verification prompt during sign-in

**OR disable email verification requirement:**

1. Go to **Settings** → **Email, Phone, Username**
2. Find **"Email verification"** section
3. Set **"Require email verification"** to **OFF** or **"Optional"**
4. Save changes

---

## Steps to Disable 2FA in Clerk

### Option 1: Disable 2FA for Specific User (Recommended)

1. **Go to Clerk Dashboard**
   - Visit [https://dashboard.clerk.com](https://dashboard.clerk.com)
   - Sign in with your Clerk account

2. **Navigate to Users**
   - Click on **"Users"** in the left sidebar
   - Search for your test account email (e.g., `appreview@yourdomain.com`)

3. **Open User Details**
   - Click on the test account user
   - This opens the user's detail page

4. **Disable 2FA**
   - Look for **"Two-factor authentication"** or **"MFA"** section
   - Find the option to **disable** or **remove** 2FA
   - Click **"Disable"** or **"Remove"**
   - Confirm the action

5. **Disable Email Verification Requirement**
   - In the same user details page, look for **"Email addresses"** section
   - Find the test account's email address
   - Click on the email address
   - Look for **"Verified"** status - if it shows "Unverified", click to verify it manually
   - OR go to **Settings** → **Email, Phone, Username** → **Email verification**
   - Set **"Require email verification"** to **OFF** (or set it to "Optional")
   - Save changes

6. **Verify**
   - The user should now be able to sign in with just email and password
   - No 2FA code will be required
   - No email verification will be required

### Option 2: Disable 2FA Requirement Globally (Not Recommended)

⚠️ **Warning:** This disables 2FA for ALL users, which is not recommended for production.

1. Go to Clerk Dashboard
2. Navigate to **"Settings"** → **"Multi-factor authentication"**
3. Disable the MFA requirement
4. **Remember to re-enable it after App Store review!**

### Option 3: Create Test Account Without 2FA

If you haven't created the test account yet:

1. **Create the test account** in your app (sign up normally)
2. **Before enabling 2FA**, go to Clerk Dashboard
3. Find the new user account
4. **Don't enable 2FA** for this account
5. Add $10 vcash balance to the account

## After App Store Review

**Important:** After Apple completes their review, you should:

1. **Re-enable 2FA** for the test account (if you disabled it)
2. Or **delete the test account** if it's no longer needed
3. Keep 2FA enabled for all production user accounts

## Alternative: Use Clerk's Test Mode

If you're using Clerk's test mode, you might be able to:
- Create a test user that bypasses 2FA
- Use Clerk's test credentials feature

Check Clerk's documentation for test account features.

## Disable Email Verification Globally (Alternative)

If you want to disable email verification for all users (not recommended for production, but okay for testing):

1. Go to Clerk Dashboard
2. Navigate to **"Settings"** → **"Email, Phone, Username"**
3. Find **"Email verification"** section
4. Set **"Require email verification"** to **OFF** or **"Optional"**
5. Save changes

**Note:** This affects all users. Remember to re-enable it after App Store review if needed.

## Manually Verify Test Account Email (Alternative)

Instead of disabling email verification, you can manually verify the test account's email:

1. Go to Clerk Dashboard → **Users**
2. Find your test account
3. Click on the user
4. In the **"Email addresses"** section, find the email
5. Click on the email address
6. Click **"Verify"** or **"Mark as verified"**
7. The email will now be verified and won't require verification during sign-in

## Verification

To verify both 2FA and email verification are disabled:

1. Sign out of the test account (if signed in)
2. Try signing in with the test account credentials
3. You should be able to sign in with just email and password
4. No 2FA code prompt should appear
5. No email verification prompt should appear

---

**Need Help?**
- Clerk Dashboard: [https://dashboard.clerk.com](https://dashboard.clerk.com)
- Clerk Documentation: [https://clerk.com/docs](https://clerk.com/docs)
- Clerk Support: Available in the dashboard

