# Production Build Guide for iOS and Android

This guide covers how to build and submit your Voyo app to the App Store (iOS) and Google Play Store (Android).

## Prerequisites

### Required Accounts
- **iOS**: Apple Developer Account ($99/year) - Required for App Store submission
- **Android**: Google Play Developer Account ($25 one-time) - Required for Play Store submission
- **EAS**: Expo account (free tier available) - Already configured

### Required Tools
```bash
# Install EAS CLI globally if not already installed
npm install -g eas-cli

# Login to your Expo account
eas login
```

## Step 1: Configure EAS Secrets

Set up environment variables for production builds:

```bash
cd apps/mobile

# Set your production API URL
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value "https://your-production-api.com" --type string

# Set your Clerk publishable key
eas secret:create --scope project --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "pk_live_..." --type string
```

**Note**: These secrets are automatically used in production builds. You can also use `.env.mobile` for local development.

## Step 2: iOS Production Build (App Store)

### 2.1 Configure iOS App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Create a new app:
   - **Bundle ID**: `com.voyo.mobile` (must match `app.config.ts`)
   - **App Name**: Voyo
   - **Primary Language**: English
   - **SKU**: voyo-mobile-001 (or any unique identifier)

### 2.2 Build iOS Production App

```bash
cd apps/mobile

# Build for iOS App Store
eas build --platform ios --profile production
```

**What happens:**
- EAS automatically manages certificates and provisioning profiles
- Build takes ~15-20 minutes
- You'll get a download link when complete

### 2.3 Submit to App Store

**Option A: Automatic Submission (Recommended)**
```bash
# Submit directly to App Store Connect
eas submit --platform ios --profile production
```

**Option B: Manual Submission**
1. Download the `.ipa` file from EAS build page
2. Use [Transporter app](https://apps.apple.com/us/app/transporter/id1450874784) or Xcode to upload
3. Complete app metadata in App Store Connect

### 2.4 App Store Connect Setup

After submission, complete in App Store Connect:
1. **App Information**: Description, keywords, category
2. **Pricing**: Set price (Free or Paid)
3. **App Privacy**: Privacy policy URL, data collection details
4. **App Review Information**: Contact details, demo account (if needed)
5. **Version Information**: Screenshots, app preview, description
6. **Build**: Select the uploaded build
7. Submit for review

## Step 3: Android Production Build (Play Store)

### 3.1 Configure Google Play Console

1. Go to [Google Play Console](https://play.google.com/console/)
2. Create a new app:
   - **App Name**: Voyo
   - **Default Language**: English
   - **App or Game**: App
   - **Free or Paid**: Select your preference

### 3.2 Build Android Production App

```bash
cd apps/mobile

# Build for Android Play Store (AAB format)
eas build --platform android --profile production
```

**What happens:**
- EAS automatically signs the app with a keystore
- Build takes ~10-15 minutes
- You'll get a download link when complete

**Note**: The first build will generate a keystore. **SAVE THE KEYSTORE PASSWORD** - you'll need it for future updates!

### 3.3 Submit to Play Store

**Option A: Automatic Submission (Recommended)**
```bash
# Submit directly to Google Play Console
eas submit --platform android --profile production
```

**Option B: Manual Submission**
1. Download the `.aab` file from EAS build page
2. Go to Google Play Console → Your App → Production
3. Click "Create new release"
4. Upload the `.aab` file
5. Add release notes
6. Review and publish

### 3.4 Play Store Setup

Complete required sections in Play Console:
1. **Store listing**: App description, screenshots, feature graphic
2. **Content rating**: Complete questionnaire
3. **Privacy policy**: Required URL
4. **App access**: If your app requires login, provide demo credentials
5. **Target audience**: Age groups
6. **Data safety**: Declare data collection practices
7. **Production release**: Upload build and publish

## Step 4: Update App Version

Before each new release, update the version in `app.config.ts`:

```typescript
version: '1.0.1', // Increment for each release
```

For iOS, you may also need to update the build number in App Store Connect.

## Step 5: Build Commands Reference

### Build for Both Platforms
```bash
eas build --platform all --profile production
```

### Build for Specific Platform
```bash
# iOS only
eas build --platform ios --profile production

# Android only
eas build --platform android --profile production
```

### Check Build Status
```bash
eas build:list
```

### View Build Logs
```bash
eas build:view [BUILD_ID]
```

## Important Notes

### iOS Specific
- **Apple Developer Account Required**: You cannot submit to App Store without a paid Apple Developer account
- **TestFlight**: Use `preview` profile for TestFlight builds
- **Certificates**: EAS manages these automatically, but you can view them in your Apple Developer account
- **App Review**: Typically takes 24-48 hours, can take up to 7 days

### Android Specific
- **Keystore**: EAS generates and manages the keystore. The password is shown once - save it!
- **AAB vs APK**: Play Store requires AAB format (already configured in `eas.json`)
- **App Review**: Typically takes a few hours to 3 days
- **Staged Rollout**: Recommended - release to 20% → 50% → 100% of users

### Environment Variables
- Production builds use EAS secrets (set with `eas secret:create`)
- Local development uses `.env.mobile` file
- Make sure production API URLs and keys are correct

### Build Profiles
- **development**: For development builds with dev client
- **preview**: For internal testing (TestFlight, internal distribution)
- **production**: For App Store and Play Store releases

## Troubleshooting

### iOS Build Fails
- Check Apple Developer account status
- Verify bundle identifier matches App Store Connect
- Check certificates in Apple Developer portal

### Android Build Fails
- Verify package name matches Play Console
- Check if keystore exists (first build creates it)
- Ensure all required permissions are declared

### Submission Fails
- Verify app metadata is complete
- Check for required screenshots and descriptions
- Ensure privacy policy URL is accessible

## Next Steps After First Release

1. **Monitor**: Check crash reports and user reviews
2. **Update**: Use the same process for updates (increment version)
3. **Analytics**: Set up analytics to track usage
4. **Marketing**: Prepare app store optimization (ASO)

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)






