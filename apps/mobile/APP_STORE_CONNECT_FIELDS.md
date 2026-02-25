# App Store Connect - Field-by-Field Guide

Quick reference for filling out App Store Connect forms.

---

## 📱 App Information Page

### Localizable Information

**Name:**
- ✅ Already filled: **"Voyo"** (26 characters - limit is 30)

**Subtitle:**
- Fill in: **"Global eSIM for Travelers"** (30 characters max)
- This appears below your app name in search results

**Language:**
- Keep as **"English (U.S.)"** (or your primary language)

### General Information

**Bundle ID:**
- ✅ Already set: **com.voyo.mobile**

**SKU:**
- ✅ Already set: **voyo-mobile-001**

**Apple ID:**
- ✅ Already set: **6758952146**

**Primary Language:**
- ✅ Already set: **English (U.S.)**

**Category:**
- **Primary:** Select **"Travel"**
- **Secondary (optional):** Select **"Utilities"** or **"Business"** (your choice)

**Content Rights:**
- Click **"Set Up Content Rights Information"** if you have third-party content
- For Voyo (eSIM marketplace), you likely don't need this unless you're using third-party logos/content

**License Agreement:**
- Click **"Edit"** to customize, or use **"Apple's Standard License Agreement"** (default)

---

## 🎯 Age Ratings Questionnaire

Answer these questions for your eSIM marketplace app:

### In-App Controls

**1. Parental Controls:**
- **Answer: NO**
- *Reason:* Voyo is not a children's app and doesn't have parental control features

**2. Age Assurance:**
- **Answer: NO**
- *Reason:* No age restrictions for purchasing eSIMs (standard e-commerce)

### Capabilities

**3. Unrestricted Web Access:**
- **Answer: NO**
- *Reason:* Users browse eSIM plans within the app, not unrestricted web browsing

**4. User-Generated Content:**
- **Answer: NO**
- *Reason:* Users don't create or share content; they only purchase eSIM plans

**5. Messaging and Chat:**
- **Answer: YES** ⚠️
- *Reason:* Your app has a chat feature for customer support (ChatModal component)
- *Note:* This is user-to-support chat, not user-to-user, but Apple still counts it as messaging

**6. Advertising:**
- **Answer: NO** (unless you show ads)
- *Reason:* eSIM marketplace typically doesn't show third-party ads

### Additional Questions (if shown)

**Location Sharing:**
- **Answer: NO** (unless you share user locations with other users)
- *Reason:* You may use location for showing relevant plans, but not for sharing with other users

**Frequent/Intense Violence:**
- **Answer: NO**

**Realistic Violence:**
- **Answer: NO**

**Cartoon/Fantasy Violence:**
- **Answer: NO**

**Profanity/Crude Humor:**
- **Answer: NO**

**Sexual Content/Nudity:**
- **Answer: NO**

**Gambling/Contests:**
- **Answer: NO**

**Alcohol/Tobacco/Drugs:**
- **Answer: NO**

**Mature/Suggestive Themes:**
- **Answer: NO**

**Simulated Gambling:**
- **Answer: NO**

**Horror/Fear Themes:**
- **Answer: NO**

**Medical/Treatment Information:**
- **Answer: NO**

**Unrestricted Internet Access:**
- **Answer: NO** (same as "Unrestricted Web Access")

---

## 📊 Expected Age Rating

Based on your answers:
- **Expected Rating: 4+** (Everyone)
- Your app is a standard e-commerce/travel app with customer support chat
- No mature content, violence, or restricted features

---

## ✅ Quick Checklist

### App Information:
- [x] Name: "Voyo" (already filled)
- [ ] Subtitle: "Global eSIM for Travelers"
- [ ] Primary Category: Travel
- [ ] Secondary Category: Utilities (optional)

### Age Ratings:
- [ ] Parental Controls: **NO**
- [ ] Age Assurance: **NO**
- [ ] Unrestricted Web Access: **NO**
- [ ] User-Generated Content: **NO**
- [ ] Messaging and Chat: **YES** (you have support chat)
- [ ] Advertising: **NO**
- [ ] All other content questions: **NO**

---

## 💡 Notes

1. **Messaging/Chat:** Since you have customer support chat, answer "YES" to "Messaging and Chat". This won't increase your age rating significantly - it's just customer support, not social messaging.

2. **Categories:** "Travel" is perfect for your primary category. "Utilities" or "Business" both work well as secondary.

3. **Subtitle:** Keep it short and descriptive. "Global eSIM for Travelers" clearly explains what your app does.

4. **Content Rights:** Only needed if you're using third-party content (logos, images, etc.) that requires licensing.

---

**After completing:**
1. Click **"Save"** at the top right
2. Continue to next sections (Pricing, App Privacy, etc.)


