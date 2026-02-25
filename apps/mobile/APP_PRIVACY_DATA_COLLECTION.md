# App Privacy Data Collection - What to Check

Based on your Voyo eSIM app, here's what you should check in the App Privacy section:

## ✅ Already Checked (Based on Your Screenshots)

### Contact Info
- ✅ **Name** - You collect user names via Clerk
- ✅ **Email Address** - Required for account creation (Clerk)
- ✅ **Phone Number** - If you collect phone numbers (check if optional)
- ❌ **Physical Address** - Uncheck (you don't collect addresses)
- ❌ **Other User Contact Info** - Uncheck

### Financial Info
- ✅ **Payment Info** - You process payments via Stripe
- ❌ **Credit Info** - Uncheck (no credit scores)
- ❌ **Other Financial Info** - Uncheck

### Location
- ✅ **Precise Location** - You checked this, but verify:
  - Do you actually collect precise GPS location?
  - Or just country/region for eSIM suggestions?
  - If you only use country selection (not GPS), you might want to uncheck this
- ❌ **Coarse Location** - Uncheck (unless you use approximate location)

## 📋 Additional Categories to Check

### Identifiers
- ✅ **User ID** - Check this
  - You use Clerk user IDs, account IDs
  - Description: "Account ID, user ID from Clerk authentication"
- ✅ **Device ID** - Check this
  - You collect device identifiers for fraud prevention
  - Description: "Device identifiers for fraud prevention and app functionality"
- ✅ **Purchases** - Check this
  - You track eSIM purchase history
  - Description: "eSIM purchase history and order records"

### Usage Data
- ✅ **Product Interaction** - Check this
  - You track app usage, pages viewed, features used
  - Description: "App usage, pages viewed, features accessed for analytics"
- ❌ **Advertising Data** - Uncheck (unless you show ads)
- ❌ **Other Usage Data** - Uncheck (unless you collect other usage data)

### Diagnostics
- ✅ **Crash Data** - Check this (if you use crash reporting)
  - If you use Sentry, Firebase Crashlytics, or similar
  - Description: "Crash logs for app stability"
- ✅ **Performance Data** - Check this (if you use analytics)
  - App launch time, performance metrics
  - Description: "App performance metrics for optimization"
- ❌ **Other Diagnostic Data** - Uncheck

### User Content
- ✅ **Customer Support** - Check this
  - Support tickets, chat messages
  - Description: "Customer support tickets and chat messages"
- ❌ **Emails or Text Messages** - Uncheck
- ❌ **Photos or Videos** - Uncheck
- ❌ **Audio Data** - Uncheck
- ❌ **Gameplay Content** - Uncheck
- ❌ **Other User Content** - Uncheck

### Browsing History
- ❌ **Browsing History** - Uncheck
  - Unless you track web browsing within the app

### Search History
- ✅ **Search History** - Check this (if you have search)
  - If users can search for countries/plans
  - Description: "Search queries for countries and eSIM plans"

### Sensitive Info
- ❌ **Sensitive Info** - Uncheck
  - No racial, health, biometric data

### Contacts
- ❌ **Contacts** - Uncheck
  - You don't access user's contact list

### Health & Fitness
- ❌ **Health** - Uncheck
- ❌ **Fitness** - Uncheck

### Surroundings
- ❌ **Environment Scanning** - Uncheck

### Body
- ❌ **Hands** - Uncheck
- ❌ **Head** - Uncheck

## 🔍 For Each Checked Item, You'll Need to Specify:

1. **Purpose of Collection:**
   - App Functionality
   - Analytics
   - Product Personalization
   - Advertising (if applicable)
   - Developer Communications
   - Fraud Prevention
   - etc.

2. **Linked to User:**
   - Yes/No (is it linked to user identity?)

3. **Used for Tracking:**
   - Yes/No (do you track users across apps/websites?)

4. **Data Retention:**
   - How long you keep the data

## 💡 Quick Checklist

**Must Check:**
- [x] Contact Info → Name
- [x] Contact Info → Email Address
- [x] Contact Info → Phone Number (if collected)
- [x] Financial Info → Payment Info
- [x] Identifiers → User ID
- [x] Identifiers → Device ID
- [x] Identifiers → Purchases
- [x] Usage Data → Product Interaction
- [x] User Content → Customer Support
- [x] Diagnostics → Crash Data (if you use crash reporting)
- [x] Diagnostics → Performance Data (if you use analytics)

**Maybe Check:**
- [ ] Location → Precise Location (only if you use GPS)
- [ ] Search History (if you have search functionality)

**Don't Check:**
- Everything else unless you actually collect it

## ⚠️ Important Notes

1. **Be Accurate:** Only check what you actually collect
2. **Location Data:** If you only use country selection (not GPS), uncheck "Precise Location"
3. **Tracking:** For most items, "Used for Tracking" should be **NO** unless you track users across apps
4. **Linked to User:** Most data will be "Yes" since you have user accounts

## 📝 Example Purpose Selections

For each checked item, typical purposes:

- **User ID, Email, Name:** App Functionality, Developer Communications
- **Payment Info:** App Functionality, Fraud Prevention
- **Device ID:** App Functionality, Fraud Prevention, Analytics
- **Purchases:** App Functionality, Analytics
- **Product Interaction:** Analytics, Product Personalization
- **Customer Support:** App Functionality
- **Crash Data:** Analytics
- **Performance Data:** Analytics


