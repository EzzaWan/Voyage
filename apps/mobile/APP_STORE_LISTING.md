# iOS App Store Listing Guide for Voyo

This document contains all the content you need for your iOS App Store listing. Copy and paste these into App Store Connect.

---

## 📱 App Information

### App Name
**Voyo** (or **Voyage** - use the name from your app.config.ts)

### Subtitle (Optional but Recommended)
**Global eSIM for Travelers**

---

## ✨ Promotional Text
*(170 characters max - appears above description on iOS 11+ and macOS 10.13+)*

**Option 1 (Short & Punchy):**
```
Stay connected in 190+ countries with instant eSIM activation. No roaming fees, no contracts. Perfect for travelers and digital nomads.
```

**Option 2 (Feature-Focused):**
```
Get instant eSIM data plans for 190+ countries. Activate in minutes, avoid roaming charges, and travel with confidence. QR code delivery included.
```

**Option 3 (Benefit-Focused):**
```
Connect anywhere, instantly. Buy eSIM data plans for your destination before you travel. No physical SIM cards, no roaming fees, no hassle.
```

---

## 📝 Description
*(Up to 4,000 characters - detailed description of your app)*

```
Voyo is your gateway to seamless global connectivity. Whether you're traveling for business or pleasure, stay connected in over 190 countries with instant eSIM activation—no physical SIM cards required.

🌍 GLOBAL COVERAGE
Connect in 190+ countries across all continents. From bustling cities to remote destinations, Voyo has you covered with reliable 4G/LTE networks.

⚡ INSTANT ACTIVATION
Get your eSIM activated within minutes of purchase. No waiting, no shipping delays. Simply scan the QR code and you're connected.

📱 EASY SETUP
Compatible with all eSIM-enabled devices. Our simple QR code installation process takes just seconds. Works on iPhone XS and later, iPad Pro, and other eSIM-compatible devices.

💰 NO ROAMING FEES
Avoid expensive roaming charges from your home carrier. Pay only for the data you need, when you need it. Transparent pricing with no hidden fees.

✈️ TRAVEL-FRIENDLY
Perfect for:
• Business travelers
• Digital nomads
• Vacationers
• Students studying abroad
• Anyone who needs reliable internet abroad

🔒 SECURE & TRUSTED
• PCI DSS compliant payments
• Secure checkout with Stripe
• Instant delivery guarantee
• 24/7 customer support
• Money-back satisfaction guarantee

📊 FLEXIBLE PLANS
Choose from a variety of data plans tailored to your travel needs:
• Short trips (1-7 days)
• Extended stays (7-30 days)
• High data usage plans
• Budget-friendly options

🎯 KEY FEATURES
• Browse plans by country or region
• Compare prices and data allowances
• Guest checkout available
• Order tracking
• QR code delivery via email
• Manage all your eSIMs in one place
• Support for multiple devices

Whether you're planning a weekend getaway or a month-long adventure, Voyo makes staying connected simple, affordable, and hassle-free.

Download Voyo today and experience connectivity without boundaries.
```

---

## 🔑 Keywords
*(100 characters max - comma-separated keywords for App Store search)*

```
esim,travel,roaming,data,connectivity,international,sim card,travel data,global wifi,travel internet,mobile data,travel sim,esim card,international data,travel connectivity,data plan,travel app,roaming free,travel wifi,global data
```

**Alternative (if you need more specific terms):**
```
esim,travel data,roaming,international,connectivity,data plan,travel sim,global wifi,mobile data,travel internet,esim card,travel app,roaming free,international data,travel connectivity
```

---

## 🌐 Support URL
*(Required - URL with support information)*

**If you have a support page:**
```
https://yourdomain.com/support
```

**If you have a help center:**
```
https://yourdomain.com/help
```

**If you have a contact page:**
```
https://yourdomain.com/contact
```

**If you don't have a support page yet, create one with:**
- FAQ section
- How to install eSIM guide
- Troubleshooting tips
- Contact information (email, chat, etc.)

---

## 📢 Marketing URL
*(Optional but recommended - URL with marketing information about your app)*

**If you have a marketing/landing page:**
```
https://yourdomain.com
```

**Or create a dedicated app landing page:**
```
https://yourdomain.com/app
```

**Include on this page:**
- App screenshots
- Key features
- Benefits
- Download links
- Testimonials

---

## © Copyright
*(Format: "Year Owner Name" - Do NOT include a URL)*

**Example format:**
```
2025 Voyo Inc.
```

**Or if individual:**
```
2025 [Your Name]
```

**Or if company:**
```
2025 [Your Company Name]
```

**Important:** 
- Use the current year (2025)
- Use the legal entity name that owns the app
- Do NOT include URLs or website addresses
- Format: `YYYY [Owner Name]`

---

## 🗺️ Routing App Coverage File
*(Only required if your app provides turn-by-turn navigation or routing services)*

**For Voyo eSIM app:** This is likely **NOT required** unless your app specifically provides:
- Turn-by-turn navigation
- Route planning
- Location-based routing services

**If you do need it:**
- File must be in `.geojson` format
- Can only contain one MultiPolygon element
- Specifies geographic regions your app supports
- See Apple's documentation for format requirements

**For a standard eSIM marketplace app, you can skip this field.**

---

## 🔍 App Review Information
*(Required for app submission - Apple uses this to test your app)*

### Sign-In Information

**Check "Sign-in required"** if your app requires authentication to access key features.

**Test Account Credentials:**
- **User name:** `appreview@yourdomain.com` (or your test account email)
- **Password:** `[Your Test Password]`

**Important:** 
- Create a dedicated test account with full app access
- Ensure the account has $10 in vcash balance for testing purchases
- **2FA has been disabled for this test account** (see `DISABLE_2FA_FOR_TEST_ACCOUNT.md` for instructions)
- This account will be used by Apple reviewers to test the app
- Sign-in requires only email and password (no 2FA code needed)

### Contact Information

Fill in your contact details so Apple can reach you if needed during review:

- **First name:** `[Your First Name]`
- **Last name:** `[Your Last Name]`
- **Phone number:** `+1 [Your Phone Number]` (include country code)
- **Email:** `[Your Contact Email]` (usually your developer account email)

### Notes
*(4,000 characters max - explain how to test your app)*

```
TEST ACCOUNT CREDENTIALS:
Email: appreview@yourdomain.com
Password: [Your Test Password]

IMPORTANT: This is a production build. The test account has been pre-loaded with $10 in vcash balance for testing purchases.

NOTE: Two-factor authentication (2FA) has been temporarily disabled for this test account to facilitate App Store review. The test account can be signed in with just email and password - no 2FA code required.

TESTING INSTRUCTIONS:

1. SIGN-IN:
   - The app allows browsing without sign-in, but account features require authentication
   - Use the provided test account credentials to sign in
   - No 2FA code is required for this test account (2FA has been disabled for review purposes)
   - The test account has full access to all app features

2. BROWSING PLANS:
   - You can browse eSIM plans by country or region without signing in
   - Tap on any country to view available data plans
   - Plans show data allowance, validity period, and price
   - You can compare different plans before purchasing

3. TESTING PURCHASE FLOW:
   - Sign in with the test account (has $10 vcash balance)
   - Select any eSIM plan (choose a low-cost plan to stay within the $10 balance)
   - Proceed to checkout
   - The app uses vcash balance for payment (no credit card required for testing)
   - Complete the purchase to test the full order flow

4. ORDER PROCESSING:
   - After purchase, the order will be processed
   - eSIM provisioning may take a few minutes
   - Once ready, you'll see the QR code in the "My eSIMs" section
   - QR codes are for testing purposes only and won't activate real service

5. KEY FEATURES TO TEST:
   - Country/region browsing
   - Plan selection and comparison
   - Account sign-in
   - Purchase flow with vcash
   - Order tracking
   - QR code display
   - eSIM management in "My eSIMs"

6. NOTES:
   - This is a production environment - all transactions use real vcash balance
   - Test eSIM orders will be provisioned but QR codes are for demonstration only
   - If you encounter any issues or need assistance, please contact [your-email@domain.com]

Thank you for reviewing our app!
```

### Attachment
*(Optional - attach additional documentation if needed)*

You can optionally attach:
- Demo video showing app workflow
- Additional testing instructions
- Screenshots with annotations

**Recommendation:** Only attach if you have specific complex features that need explanation beyond the Notes section.

---

## 📋 Additional App Store Information

### Category
**Primary:** Travel  
**Secondary:** Utilities (or Business)

### Age Rating
**4+** (or appropriate rating based on content)

### Privacy Policy URL
*(Required - must be accessible)*
```
https://yourdomain.com/privacy
```

### App Preview Video (Optional)
- 15-30 second video showing app in action
- Demonstrates key features
- Can significantly improve conversion

### Screenshots Required
**iPhone 6.7" Display (iPhone 14 Pro Max, 15 Pro Max):**
- 1290 x 2796 pixels
- Minimum 3, up to 10 screenshots

**iPhone 6.5" Display (iPhone 11 Pro Max, XS Max):**
- 1242 x 2688 pixels
- Minimum 3, up to 10 screenshots

**iPad Pro 12.9" (3rd generation and later):**
- 2048 x 2732 pixels
- Minimum 3, up to 10 screenshots

**Recommended Screenshots:**
1. Homepage/Country selection
2. Plan details/pricing
3. Checkout/payment
4. QR code/activation
5. My eSIMs/management
6. Coverage map (if available)

---

## ✅ Checklist Before Submission

- [ ] App name matches your branding
- [ ] Promotional text is under 170 characters
- [ ] Description is compelling and under 4,000 characters
- [ ] Keywords are relevant and under 100 characters
- [ ] Support URL is live and functional
- [ ] Marketing URL is live (if provided)
- [ ] Copyright uses correct format (Year + Owner)
- [ ] Privacy Policy URL is accessible
- [ ] **App Review Information completed:**
  - [ ] Test account created with $10 vcash balance
  - [ ] 2FA disabled for test account in Clerk Dashboard (see `DISABLE_2FA_FOR_TEST_ACCOUNT.md`)
  - [ ] Sign-in credentials provided (email and password only - no 2FA needed)
  - [ ] Contact information filled in
  - [ ] Notes section completed with testing instructions
- [ ] All screenshots are uploaded in correct sizes
- [ ] App icon is 1024x1024 pixels
- [ ] Age rating is appropriate
- [ ] Category is correctly selected

---

## 💡 Tips for Better App Store Performance

1. **Use the promotional text wisely** - Update it regularly to highlight new features or promotions
2. **A/B test your description** - Try different versions to see what converts better
3. **Update keywords** - Monitor search performance and adjust keywords quarterly
4. **Keep screenshots fresh** - Update them when you add major features
5. **Respond to reviews** - Engage with users who leave reviews
6. **Use App Store Connect analytics** - Track what's working and optimize

---

## 📞 Need Help?

If you need to update any of these fields after submission:
1. Go to App Store Connect
2. Select your app
3. Go to "App Information" or "Pricing and Availability"
4. Edit the relevant fields
5. Submit for review (if required)

---

**Last Updated:** 2025-01-XX  
**App Version:** 1.0.0  
**Bundle ID:** com.voyo.mobile

