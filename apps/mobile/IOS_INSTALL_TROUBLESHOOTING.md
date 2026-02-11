# iOS App Installation Troubleshooting

## Error: "Unable to Install 'Voyo' - This app cannot be installed because its integrity could not be verified"

This error occurs when iOS cannot verify the app's code signature. Here are the solutions:

---

## Solution 1: Trust the Developer Certificate (Most Common Fix)

**On your iPhone:**

1. Open **Settings** app
2. Go to **General**
3. Scroll down to **VPN & Device Management** (or **Profiles & Device Management** on older iOS)
4. Look for a profile/certificate with one of these names:
   - "Apple Development: [Your Name]"
   - "Expo Development Client"
   - "Developer App"
   - Your Apple Developer account name
5. Tap on the certificate
6. Tap **Trust "[Certificate Name]"**
7. Confirm by tapping **Trust** again
8. Try installing the app again

**Note:** If you don't see any certificate here, the app wasn't properly signed or the device isn't registered.

---

## Solution 2: Verify Device Registration

For development builds, your device must be registered in your Apple Developer account:

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Devices** in the sidebar
4. Check if your iPhone's UDID is registered
5. If not, add it:
   - Click the **+** button
   - Enter a name for your device
   - Enter your device's UDID (find it in Settings → General → About → scroll to bottom)
   - Click **Continue** → **Register**

**After adding the device:**
- Rebuild your app with EAS Build
- The new build will include your device in the provisioning profile

---

## Solution 3: Rebuild with Correct Profile

If you're using EAS Build, make sure you're using the correct build profile:

### For Development Build:
```bash
cd apps/mobile
eas build --platform ios --profile development
```

### For Preview/Internal Testing:
```bash
eas build --platform ios --profile preview
```

**Important:** Development builds require:
- Your device to be registered in Apple Developer Portal
- A valid development provisioning profile
- The device to trust the developer certificate

---

## Solution 4: Use TestFlight (Recommended for Testing)

TestFlight is the easiest way to distribute test builds:

1. Build for production/preview:
   ```bash
   eas build --platform ios --profile preview
   ```

2. Submit to TestFlight:
   ```bash
   eas submit --platform ios
   ```

3. Install via TestFlight app on your iPhone
   - TestFlight handles all code signing automatically
   - No need to trust certificates manually

---

## Solution 5: Check EAS Credentials

Verify your Apple Developer credentials are properly configured:

1. Make sure you're logged into EAS:
   ```bash
   eas login
   ```

2. Check your credentials status:
   ```bash
   eas credentials
   ```
   - Select **iOS** platform
   - Review your credentials
   - If missing, set them up following the prompts

3. If credentials are invalid, reconfigure:
   ```bash
   eas credentials
   # Select iOS → Choose the profile (development/preview/production)
   # Follow prompts to re-enter Apple Developer credentials
   ```

---

## Solution 6: Verify Bundle ID and App Configuration

Make sure your `app.config.ts` matches your Apple Developer setup:

- **Bundle ID**: Must match exactly (currently: `com.voyo.mobile`)
- **App Name**: Should match your App Store Connect app name

Check your `app.config.ts`:
```typescript
ios: {
  bundleIdentifier: 'com.voyo.mobile', // Must match Apple Developer Portal
}
```

---

## Solution 7: Check Installation Method

**❌ Don't do this:**
- Installing `.ipa` files directly via AirDrop or email
- Using third-party installers that bypass App Store/TestFlight

**✅ Do this instead:**
- Use EAS Build download link
- Use TestFlight
- Use Expo Go for development (if not using custom native code)
- Use `expo start --ios` for simulator testing

---

## Solution 8: Clear and Reinstall

If the app partially installed:

1. Delete the incomplete app icon from your home screen
2. Restart your iPhone
3. Try installing again using one of the proper methods above

---

## Quick Diagnostic Checklist

- [ ] Device is registered in Apple Developer Portal
- [ ] Developer certificate is trusted on device (Settings → General → VPN & Device Management)
- [ ] Using correct build profile (development/preview/production)
- [ ] EAS credentials are properly configured
- [ ] Bundle ID matches between app.config.ts and Apple Developer Portal
- [ ] Installing via proper method (EAS Build link, TestFlight, or Expo Go)
- [ ] Device UDID is included in provisioning profile

---

## Still Having Issues?

1. **Check EAS Build logs:**
   ```bash
   eas build:list --platform ios
   ```
   Look for any errors in the build process

2. **Verify Apple Developer Account:**
   - Make sure your Apple Developer account is active
   - Check that your membership hasn't expired
   - Verify you have the correct permissions

3. **Try a fresh build:**
   ```bash
   eas build --platform ios --profile development --clear-cache
   ```

4. **Contact Support:**
   - [Expo Forums](https://forums.expo.dev/)
   - [EAS Build Support](https://docs.expo.dev/build/introduction/)

---

## Recommended Workflow

**For Development:**
1. Use **Expo Go** from App Store (if no custom native code)
2. Or use **development builds** via EAS Build + TestFlight

**For Testing:**
1. Use **preview builds** via TestFlight
2. Share TestFlight link with testers

**For Production:**
1. Use **production builds** via App Store
2. Submit through App Store Connect

---

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [iOS Code Signing Guide](https://docs.expo.dev/app-signing/app-credentials/)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [TestFlight Guide](https://developer.apple.com/testflight/)

