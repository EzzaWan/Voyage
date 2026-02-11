# Apple Developer Account Setup Guide

This guide will walk you through setting up your Apple Developer account for iOS builds with Expo/EAS.

## Prerequisites

- ✅ Apple Developer account (you already have this!)
- ✅ Expo account (sign up at [expo.dev](https://expo.dev))
- ✅ EAS CLI installed (`npm install -g eas-cli`)

---

## Step 1: Configure Your App in Apple Developer Portal

### 1.1 Create App ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** (plus button)
4. Select **App IDs** → **Continue**
5. Select **App** → **Continue**
6. Fill in:
   - **Description**: `Voyo Mobile App`
   - **Bundle ID**: `com.voyo.mobile` (must match your app.config.ts)
   - **Capabilities**: Enable:
     - ✅ Sign In with Apple
     - ✅ Push Notifications (if you plan to use them)
   - Click **Continue** → **Register**

### 1.2 Create App in App Store Connect (for distribution)

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: `Voyo` (or your app name)
   - **Primary Language**: English (or your preference)
   - **Bundle ID**: Select `com.voyo.mobile` (created in step 1.1)
   - **SKU**: `voyo-mobile-001` (unique identifier)
   - **User Access**: Full Access
4. Click **Create**

---

## Step 2: Set Up EAS Credentials

EAS Build can automatically manage your certificates and provisioning profiles. You'll need to authenticate with your Apple Developer account.

### 2.1 Install EAS CLI (if not already installed)

```bash
npm install -g eas-cli
```

### 2.2 Login to Expo

```bash
eas login
```

### 2.3 Configure EAS Build

```bash
cd apps/mobile
eas build:configure
```

This will create/update your `eas.json` file.

### 2.4 Set Up Apple Credentials

Run this command to set up your Apple Developer credentials:

```bash
eas credentials
```

When prompted:
1. Select **iOS** platform
2. Select your project (or create a new one)
3. Choose **Set up credentials for production** (or development/preview)
4. EAS will ask for your Apple Developer account credentials:
   - **Apple ID**: Your Apple Developer account email
   - **Password**: Your Apple Developer account password
   - **App-Specific Password**: If you have 2FA enabled, you'll need to create an app-specific password at [appleid.apple.com](https://appleid.apple.com)

**Alternative: Use App Store Connect API Key (Recommended for CI/CD)**

Instead of using your Apple ID password, you can use an App Store Connect API key:

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **Users and Access** → **Keys** → **App Store Connect API**
3. Click **+** to generate a new key
4. Name it: `EAS Build Key`
5. Select **Admin** or **App Manager** role
6. Download the `.p8` key file (you can only download it once!)
7. Note the **Key ID** and **Issuer ID**

Then configure EAS to use it:

```bash
eas credentials
# Select iOS → Production
# Choose "Use App Store Connect API Key"
# Enter:
# - Key ID: (from App Store Connect)
# - Issuer ID: (from App Store Connect)
# - Key file path: (path to your .p8 file)
```

---

## Step 3: Configure Clerk for iOS

Since your app uses Clerk for authentication with Apple Sign In, you need to configure the iOS app in Clerk:

### 3.1 Add iOS App in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Configure** → **Applications** (or **OAuth** → **Applications**)
4. Click **"+ Add iOS app"** button
5. Fill in the required information:
   - **Bundle ID**: `com.voyo.mobile` (must match your app.config.ts)
   - **App Name**: `Voyo` (or your app name)
6. Click **Create** or **Save**

### 3.2 Configure Apple Sign In in Clerk

After creating the iOS app in Clerk:

1. In the iOS app settings, find **Apple** under OAuth providers
2. Enable **Sign in with Apple**
3. **Important for Mobile Apps**: 
   - **DO NOT** enable "Use custom credentials" toggle
   - **DO NOT** fill in the Service ID, Private Key, Team ID, or Key ID fields
   - These fields are only needed for **web-based** Apple Sign In
   - For native mobile apps, Clerk handles everything automatically
4. Make sure the **Bundle ID** matches: `com.voyo.mobile`

**Note**: 
- For native iOS apps, Clerk uses the native Apple Sign In flow - no Service IDs or keys needed
- The custom credentials fields (Service ID, Private Key, etc.) are only required for web OAuth flows
- Clerk will automatically handle the OAuth redirects using your Bundle ID

---

## Step 4: Configure Apple Sign In in Apple Developer Portal

Since your app uses `expo-apple-authentication`, you need to configure it:

### 4.1 Enable Sign In with Apple in App ID

1. Go back to [Apple Developer Portal](https://developer.apple.com/account)
2. **Certificates, Identifiers & Profiles** → **Identifiers**
3. Click on `com.voyo.mobile`
4. Under **Capabilities**, ensure **Sign In with Apple** is checked
5. Click **Save**

### 4.2 Configure in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Go to **App Information**
4. Under **App Services**, ensure **Sign In with Apple** is enabled

---

## Step 5: Build Your First iOS App

### 5.1 Development Build (for testing)

```bash
cd apps/mobile
eas build --platform ios --profile development
```

### 5.2 Preview Build (for TestFlight/internal testing)

```bash
eas build --platform ios --profile preview
```

### 5.3 Production Build (for App Store)

```bash
eas build --platform ios --profile production
```

---

## Step 6: Submit to App Store (when ready)

Once your production build is complete:

```bash
eas submit --platform ios
```

This will:
1. Upload your app to App Store Connect
2. Create a new version in App Store Connect
3. You can then complete the submission process in App Store Connect

---

## Troubleshooting

### Issue: "No valid 'aps-environment' entitlement found"

**Solution**: Make sure Push Notifications capability is enabled in your App ID, or remove it from your app if you're not using it.

### Issue: "Bundle identifier already exists"

**Solution**: The bundle ID `com.voyo.mobile` might already be taken. You'll need to:
1. Use a different bundle ID (e.g., `com.yourcompany.voyo`)
2. Update `app.config.ts` with the new bundle ID
3. Create a new App ID with that bundle ID

### Issue: "Invalid credentials"

**Solution**: 
- Make sure you're using the correct Apple Developer account
- If using 2FA, use an App-Specific Password or App Store Connect API Key
- Try running `eas credentials` again to reconfigure

### Issue: "Missing required capability"

**Solution**: Make sure all required capabilities (Sign In with Apple, etc.) are enabled in your App ID configuration.

---

## Next Steps

1. ✅ Complete the setup steps above
2. ✅ Configure iOS app in Clerk (Step 3)
3. ✅ Run your first build: `eas build --platform ios --profile development`
4. ✅ Test on a physical device or simulator
5. ✅ When ready, create a production build and submit to App Store

## Important Notes

- **Clerk Configuration**: You need to configure the iOS app in Clerk **before** building, as Clerk needs to know your Bundle ID to handle OAuth redirects properly.
- **One-time Setup**: Once configured, you typically won't need to change these settings unless you change your Bundle ID or app name.

---

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [Expo Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)

---

## Quick Reference

**Bundle ID**: `com.voyo.mobile`  
**App Name**: `Voyo`  
**EAS Project ID**: `4b33075c-53ed-487d-a2cc-37eedbfad152`

