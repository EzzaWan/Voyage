# Privacy Policy Guide for App Store Connect

This guide helps you create or update your privacy policy URL for App Store Connect submission.

---

## 📋 Quick Answer for App Store Connect

**Privacy Policy URL:**
```
https://yourdomain.com/privacy
```

**User Privacy Choices URL (Optional):**
```
https://yourdomain.com/privacy#choices
```
*(Link to a section about user privacy choices/rights)*

---

## 📝 Privacy Policy Requirements

Your privacy policy must be:
- ✅ **Publicly accessible** (no login required)
- ✅ **Permanent URL** (won't change)
- ✅ **Mobile-friendly** (readable on all devices)
- ✅ **Comprehensive** (covers all data collection)

---

## 🎯 Required Sections for eSIM Marketplace App

Based on your app's functionality, your privacy policy should include:

### 1. **Introduction & Scope**
- Who you are (Voyo eSIM)
- What this policy covers (mobile app + website)
- Last updated date
- Contact information

### 2. **Information We Collect**

**Personal Information:**
- Email address (via Clerk authentication)
- Name (optional, via Clerk)
- Payment information (via Stripe - processed securely, not stored)
- Account credentials (managed by Clerk)

**Transaction Data:**
- eSIM purchase history
- Order details
- Payment records
- eSIM activation data (ICCID, QR codes)

**Device Information:**
- Device type and model
- Operating system version
- Unique device identifiers
- Mobile network information
- Device fingerprinting data (for fraud prevention)

**Usage Data:**
- App usage patterns
- Features accessed
- Pages viewed
- Time spent in app
- Error logs

**Location Data (if applicable):**
- Country/region for eSIM plan suggestions
- IP address (for fraud prevention and regional content)

**Support Data:**
- Customer support tickets
- Chat messages (if you store chat history)
- Contact form submissions

### 3. **How We Use Your Information**

- Process and fulfill eSIM purchases
- Provision eSIM profiles through eSIM Access API
- Send order confirmations and installation instructions
- Provide customer support
- Detect and prevent fraud
- Improve app functionality
- Send marketing communications (with consent)
- Comply with legal obligations
- Analytics and app performance monitoring

### 4. **Third-Party Services & Data Sharing**

**Critical:** You MUST disclose all third-party services:

**Authentication:**
- **Clerk** - User authentication and account management
  - Privacy Policy: https://clerk.com/legal/privacy
  - Data: Email, name, authentication tokens

**Payment Processing:**
- **Stripe** - Payment processing
  - Privacy Policy: https://stripe.com/privacy
  - Data: Payment card information (tokenized, not stored by you)

**eSIM Provisioning:**
- **eSIM Access** - eSIM profile provisioning
  - Privacy Policy: Check your eSIM Access agreement
  - Data: Order details, device information for activation

**Analytics (if used):**
- **Google Analytics** (if implemented)
  - Privacy Policy: https://policies.google.com/privacy
- **Microsoft Clarity** (if implemented)
  - Privacy Policy: https://privacy.microsoft.com/privacystatement

**Email Services:**
- **Resend** - Transactional emails
  - Privacy Policy: https://resend.com/legal/privacy-policy
  - Data: Email addresses, email content

**Cloud Hosting:**
- Your hosting provider (Railway, Vercel, etc.)
  - Data: All app data stored on their servers

**Other Sharing:**
- Legal requirements (court orders, law enforcement)
- Business transfers (mergers, acquisitions)
- With your consent

### 5. **Data Security**

- SSL/TLS encryption for data transmission
- Secure payment processing (Stripe PCI DSS compliant)
- Encrypted data storage
- Access controls and authentication
- Regular security audits
- Secure API communications

### 6. **Data Retention**

- Account data: Retained while account is active
- Transaction records: 7 years (tax/legal compliance)
- Support tickets: As needed for support purposes
- Analytics data: Aggregated, anonymized
- eSIM profiles: Retained for order history

### 7. **Your Rights (GDPR/CCPA Compliance)**

Users have the right to:
- **Access** their personal data
- **Correct** inaccurate information
- **Delete** their data (right to be forgotten)
- **Export** their data (data portability)
- **Object** to processing
- **Withdraw consent** for marketing
- **Opt-out** of data sales (if applicable)

**How to Exercise Rights:**
- Email: privacy@yourdomain.com
- In-app: Account settings
- Contact form: /contact

### 8. **Cookies & Tracking Technologies**

- Local storage (app preferences)
- Analytics cookies (if web version)
- Device fingerprinting (fraud prevention)
- Session tokens

### 9. **Children's Privacy**

- Service not intended for users under 18
- Do not knowingly collect data from children
- If discovered, will delete immediately

### 10. **International Data Transfers**

- Data may be processed outside user's country
- Appropriate safeguards in place (GDPR compliance)
- Standard contractual clauses where applicable

### 11. **Changes to Privacy Policy**

- Will notify users of material changes
- Updated date will be displayed
- Continued use constitutes acceptance

### 12. **Contact Information**

- Privacy inquiries: privacy@yourdomain.com
- General support: support@yourdomain.com
- Physical address (if required by law)

---

## 📄 Sample Privacy Policy Template

Here's a template you can adapt:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Voyo eSIM</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1 { color: #1E90FF; }
        h2 { color: #333; margin-top: 30px; }
        .last-updated { color: #666; font-style: italic; }
    </style>
</head>
<body>
    <h1>Privacy Policy</h1>
    <p class="last-updated">Last updated: [DATE]</p>
    
    <p>Voyo eSIM ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.</p>
    
    <h2>1. Information We Collect</h2>
    <h3>Personal Information</h3>
    <p>When you create an account, we collect:</p>
    <ul>
        <li>Email address (via Clerk authentication)</li>
        <li>Name (optional)</li>
        <li>Payment information (processed securely through Stripe, not stored by us)</li>
    </ul>
    
    <h3>Transaction Data</h3>
    <p>We collect information about your eSIM purchases, including order details, payment records, and eSIM activation data.</p>
    
    <h3>Device Information</h3>
    <p>We collect device type, operating system, unique device identifiers, and mobile network information to ensure compatibility and improve service.</p>
    
    <h3>Usage Data</h3>
    <p>We automatically collect information about how you interact with our app, including pages viewed, features used, and time spent.</p>
    
    <h2>2. How We Use Your Information</h2>
    <ul>
        <li>Process and fulfill your eSIM purchases</li>
        <li>Provision eSIM profiles through our eSIM provider</li>
        <li>Send order confirmations and eSIM installation instructions</li>
        <li>Provide customer support</li>
        <li>Detect and prevent fraud</li>
        <li>Improve our app and services</li>
        <li>Send promotional communications (with your consent)</li>
        <li>Comply with legal obligations</li>
    </ul>
    
    <h2>3. Third-Party Services</h2>
    <p>We use the following third-party services:</p>
    <ul>
        <li><strong>Clerk</strong> - User authentication (<a href="https://clerk.com/legal/privacy">Privacy Policy</a>)</li>
        <li><strong>Stripe</strong> - Payment processing (<a href="https://stripe.com/privacy">Privacy Policy</a>)</li>
        <li><strong>eSIM Access</strong> - eSIM provisioning (see your service agreement)</li>
        <li><strong>Resend</strong> - Email delivery (<a href="https://resend.com/legal/privacy-policy">Privacy Policy</a>)</li>
    </ul>
    
    <h2>4. Data Security</h2>
    <p>We implement industry-standard security measures including SSL/TLS encryption, secure payment processing, and regular security audits.</p>
    
    <h2>5. Your Rights</h2>
    <p>You have the right to access, correct, delete, or export your personal data. To exercise these rights, contact us at privacy@yourdomain.com.</p>
    
    <h2>6. Contact Us</h2>
    <p>For privacy inquiries: privacy@yourdomain.com</p>
    <p>For general support: support@yourdomain.com</p>
</body>
</html>
```

---

## ✅ Checklist Before Submitting

- [ ] Privacy policy is publicly accessible (no login required)
- [ ] URL is permanent and won't change
- [ ] All third-party services are disclosed
- [ ] Data collection practices are clearly explained
- [ ] User rights are explained (GDPR/CCPA)
- [ ] Contact information is provided
- [ ] Last updated date is shown
- [ ] Policy is mobile-friendly
- [ ] Policy matches your actual data practices

---

## 🔗 Integration with Your Website

If you already have a privacy policy on your website:

1. **Option 1:** Use your existing privacy policy URL
   - Make sure it covers mobile app data collection
   - Add sections for mobile-specific data if needed

2. **Option 2:** Create a dedicated mobile app privacy policy
   - Link from your main privacy policy
   - More detailed about app-specific features

3. **Option 3:** Update existing policy to cover both web and mobile
   - Most efficient approach
   - Single source of truth

---

## 📱 App Store Connect Specifics

**Privacy Policy URL:**
- Must be a direct link (not a redirect)
- Must be accessible without authentication
- Should be HTTPS
- Should load quickly

**User Privacy Choices URL (Optional):**
- Link to a section explaining user rights
- Can be an anchor link: `https://yourdomain.com/privacy#choices`
- Helps with CCPA compliance

---

## 💡 Pro Tips

1. **Keep it updated:** Review quarterly and update when you add new features
2. **Be transparent:** Clearly explain what data you collect and why
3. **Make it readable:** Use plain language, avoid legal jargon where possible
4. **Link third-party policies:** Always link to third-party privacy policies
5. **Test accessibility:** Make sure it works on mobile devices

---

## 🚨 Common Mistakes to Avoid

- ❌ Not disclosing third-party services (Clerk, Stripe, etc.)
- ❌ Not explaining data retention periods
- ❌ Missing user rights section (GDPR/CCPA)
- ❌ Privacy policy behind login wall
- ❌ Outdated information
- ❌ Not mobile-friendly

---

**Need Help?**
- Review your existing website privacy policy
- Add mobile app-specific sections
- Ensure all third-party services are disclosed
- Test the URL before submitting to App Store Connect


