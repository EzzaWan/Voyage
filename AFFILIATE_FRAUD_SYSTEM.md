# Affiliate Fraud Detection System

## 📋 Overview

The affiliate fraud detection system automatically identifies suspicious behavior patterns from affiliates and assigns a fraud score. When the score exceeds thresholds, affiliates can be automatically frozen to prevent abuse.

---

## 🎯 Fraud Score System

### Scoring Thresholds

| Risk Level | Score Range | Action |
|-----------|-------------|--------|
| **Low** | 0-19 points | No action, normal monitoring |
| **Medium** | 20-39 points | Flagged for review |
| **High** | 40-59 points | Alert sent to admins |
| **Frozen** | 60+ points | **Auto-freeze** (blocks payouts & V-Cash) |

### How Scoring Works

1. **Each fraud event adds points** to the affiliate's total score
2. **All event scores are summed** to get the total fraud score
3. **Risk level is automatically determined** based on total score
4. **At 60+ points**, affiliate is automatically frozen

---

## 🔍 Fraud Detection Checks

### 1. IP Reputation Check (`checkIPReputation`)

Detects suspicious IP addresses and network patterns.

**Checks:**
- **VPN/Proxy IPs**: +15 points (`VPN_IP`)
- **Datacenter IPs** (AWS, Azure, Google Cloud, DigitalOcean): +20 points (`DATACENTER_IP`)
- **Tor Exit Nodes**: +25 points (`TOR_IP`)
- **Country Mismatch**: Logged but doesn't trigger fraud event

**When it runs:**
- On affiliate click tracking
- On user signup

**Example:**
```
Affiliate normally clicks from US, but signup comes from VPN in Russia
→ +15 points (VPN_IP)
```

---

### 2. Device Fingerprint Check (`checkDeviceFingerprint`)

Detects device reuse patterns and multi-account schemes.

**Checks:**
- **Same device, multiple signups**: +20 points (`SAME_DEVICE_MULTIPLE`)
  - If 10+ signups from same device: +40 points (auto-freeze trigger)
- **Self-referral**: +25 points (`SELF_REFERRAL`)
  - Affiliate uses their own referral code
- **Multi-account**: +30 points (`MULTI_ACCOUNT`)
  - Same device used across multiple affiliate codes

**Device Fingerprint Components:**
- Device type (mobile, desktop, tablet)
- OS name and version
- Browser name and version
- Timezone
- Language
- Screen resolution

**When it runs:**
- On user signup
- On affiliate click

**Example:**
```
5 signups from same device fingerprint
→ +20 points (SAME_DEVICE_MULTIPLE)

Affiliate clicks their own referral link
→ +25 points (SELF_REFERRAL)
```

---

### 3. Email Risk Check (`checkEmailRisk`)

Detects suspicious email patterns and disposable email usage.

**Checks:**
- **Disposable email domains**: +30 points (`DISPOSABLE_EMAIL`)
  - mailinator.com, yopmail.com, tempmail.com, etc.
- **Email aliasing**: +10 points (`SUSPICIOUS_EMAIL`)
  - john+1@, john+2@, john+3@ pattern
- **Bot-generated patterns**: +25 points (`SUSPICIOUS_EMAIL`)
  - name123456@, test@, user123@, 123456@

**When it runs:**
- On user signup

**Example:**
```
User signs up with test123456@tempmail.com
→ +30 points (DISPOSABLE_EMAIL)
→ +25 points (SUSPICIOUS_EMAIL)
Total: +55 points
```

---

### 4. Payment Method Check (`checkPaymentMethod`)

Detects card reuse across multiple accounts or affiliate codes.

**Checks:**
- **Card reused across accounts**: +40 points (`CARD_REUSED`)
  - Same payment method used by different users
- **Card used for multiple affiliate codes**: +50 points (`CARD_MULTI_AFFILIATE`)
  - Highest severity - indicates organized fraud

**When it runs:**
- On order payment (Stripe webhook)

**Example:**
```
Same credit card used for 3 different user accounts
→ +40 points (CARD_REUSED)

Same card used with 2 different affiliate codes
→ +50 points (CARD_MULTI_AFFILIATE)
```

---

### 5. Refund Pattern Check (`checkRefundPattern`)

Detects refund abuse patterns.

**Checks:**
- **High refund rate**: +30 points (`REFUND_PATTERN`)
  - More than 50% of referred orders are refunded

**When it runs:**
- On order refund

**Example:**
```
Affiliate has 10 referrals, 6 of them refunded
Refund rate: 60% (> 50% threshold)
→ +30 points (REFUND_PATTERN)
```

---

## 📊 Fraud Event Types & Scores

| Event Type | Score | Description |
|------------|-------|-------------|
| `VPN_IP` | +15 | Signup/click from VPN/proxy IP |
| `DATACENTER_IP` | +20 | Signup/click from datacenter (AWS, Azure, etc.) |
| `TOR_IP` | +25 | Signup/click from Tor exit node |
| `SAME_DEVICE_MULTIPLE` | +20 | Multiple signups from same device |
| `SAME_DEVICE_MULTIPLE` (10+) | +40 | 10+ signups from same device (auto-freeze) |
| `SELF_REFERRAL` | +25 | Affiliate uses own referral code |
| `MULTI_ACCOUNT` | +30 | Same device used across multiple affiliate codes |
| `DISPOSABLE_EMAIL` | +30 | User signs up with disposable email |
| `SUSPICIOUS_EMAIL` | +10-25 | Email aliasing or bot-generated pattern |
| `CARD_REUSED` | +40 | Same card used across multiple accounts |
| `CARD_MULTI_AFFILIATE` | +50 | Same card used for multiple affiliate codes |
| `REFUND_PATTERN` | +30 | High refund rate (>50%) from referrals |

---

## ⚙️ Automatic Actions

### Auto-Freeze (Score ≥ 60)

When an affiliate's fraud score reaches 60 or higher:
- ✅ Affiliate is automatically frozen (`isFrozen = true`)
- ✅ Blocks all payout requests
- ✅ Blocks V-Cash conversions
- ✅ Risk level set to `frozen`
- ✅ Security event logged
- ✅ Alert sent to admins

**Note:** Once frozen, an admin must manually unfreeze the affiliate.

### High-Risk Alerts (Score ≥ 40)

When score crosses the high threshold:
- ✅ Security event logged
- ✅ Alert can be sent to admins (if email service configured)
- ✅ Affiliate flagged for manual review

### Score Recalculation

After each fraud event:
1. All event scores are summed
2. Risk level is updated
3. System checks if auto-freeze is needed
4. Alerts are triggered if thresholds crossed

---

## 🔄 When Fraud Checks Run

### 1. On Affiliate Click
- IP reputation check
- Device fingerprint tracking

### 2. On User Signup
- IP reputation check
- Device fingerprint check
- Email risk check
- Self-referral detection

### 3. On Order Payment
- Payment method check
- Device fingerprint verification
- Refund pattern analysis (after refund)

### 4. On Commission Generation
- All previous checks may be re-evaluated
- Fraud score recalculated

---

## 📈 Example Fraud Scenarios

### Scenario 1: Fake Account Creation

**Affiliate creates fake accounts to earn commissions:**

1. Uses VPN IP → +15 points (`VPN_IP`)
2. Uses disposable email → +30 points (`DISPOSABLE_EMAIL`)
3. Same device for 5 signups → +20 points (`SAME_DEVICE_MULTIPLE`)
4. Same card used across accounts → +40 points (`CARD_REUSED`)

**Total Score:** 105 points → **Auto-frozen** ❄️

---

### Scenario 2: Self-Referral Abuse

**Affiliate tries to refer themselves:**

1. Clicks own referral link → +25 points (`SELF_REFERRAL`)
2. Uses same device → Detected as self-referral
3. Bot-generated email → +25 points (`SUSPICIOUS_EMAIL`)

**Total Score:** 50 points → **High risk** ⚠️

---

### Scenario 3: Organized Fraud Ring

**Multiple affiliates using same cards:**

1. Same card for 3 affiliate codes → +50 points (`CARD_MULTI_AFFILIATE`)
2. Datacenter IP → +20 points (`DATACENTER_IP`)
3. 10+ signups from same device → +40 points (`SAME_DEVICE_MULTIPLE`)

**Total Score:** 110 points → **Auto-frozen** ❄️

---

## 🛡️ Admin Controls

### Freeze/Unfreeze Affiliates

**Manual Freeze:**
- Admin can freeze any affiliate manually
- Sets `isFrozen = true`
- Blocks payouts and V-Cash conversions

**Manual Unfreeze:**
- Admin can unfreeze affiliates
- Sets `isFrozen = false`
- Restores risk level based on current score
- Requires admin authentication

**Frozen Affiliates Cannot:**
- ❌ Request payouts
- ❌ Convert commissions to V-Cash
- ❌ Earn new commissions (existing ones are blocked)

---

## 📊 Fraud Dashboard

Admins can view detailed fraud information:

### Fraud Summary Includes:
- **Current fraud score** and risk level
- **All fraud events** with timestamps and details
- **Device fingerprints** and counts
- **IP addresses** used
- **Countries** of clicks/signups
- **Signup patterns** and user details
- **Statistics** (total clicks, signups, unique devices/IPs)

### Fraud Search Endpoints:
- `GET /api/admin/affiliate/fraud/search` - Search affiliates by risk level
- `GET /api/admin/affiliate/fraud/:affiliateId` - Get detailed fraud summary

---

## 🔐 Security Features

### Event Logging
- All fraud events are logged to `AffiliateFraudEvent` table
- Security events logged to `SecurityEventLog`
- Admin actions logged to `AdminLog`

### Audit Trail
- Every fraud event includes:
  - Event type and score
  - Metadata (IP, device, email, etc.)
  - Related user ID
  - Related order/transaction ID
  - Timestamp

### Admin Notifications
- High-priority alerts when score crosses thresholds
- Auto-freeze notifications
- Email notifications (if configured)

---

## 🎯 Device Fingerprinting

### How It Works

The system creates a unique fingerprint hash from:
- Device type (mobile, desktop, tablet)
- OS name and version
- Browser name and version
- Timezone
- Language
- Screen resolution

**Formula:**
```
SHA256(device|os|osVersion|browser|browserVersion|timezone|language|screenResolution)
```

### What It Detects

1. **Same Device, Multiple Accounts**
   - One device creating multiple fake accounts
   - Pattern: Same fingerprint → Multiple signups

2. **Self-Referrals**
   - Affiliate's device matches referred user's device
   - Pattern: Affiliate device = Referred user device

3. **Multi-Account Schemes**
   - Same device used across different affiliate codes
   - Pattern: One device → Multiple affiliate codes

---

## 📝 Database Structure

```
Affiliate
  ├─ AffiliateFraudScore (1:1)
  │    ├─ totalScore: number
  │    └─ riskLevel: 'low' | 'medium' | 'high' | 'frozen'
  │
  └─ AffiliateFraudEvent[] (1:many)
       ├─ type: FraudEventType
       ├─ score: number
       ├─ metadata: JSON
       ├─ userId: string (related user)
       └─ relatedId: string (order/transaction ID)
```

---

## 🚨 Common Fraud Patterns Detected

### 1. Fake Account Creation
- **Pattern:** Multiple accounts from same device/IP
- **Detection:** Device fingerprint + IP reputation
- **Score:** 20-40 points per pattern

### 2. Self-Referral Abuse
- **Pattern:** Affiliate refers themselves
- **Detection:** Device fingerprint match
- **Score:** +25 points

### 3. Card Reuse Schemes
- **Pattern:** Same card across multiple accounts
- **Detection:** Payment method tracking
- **Score:** +40-50 points (highest severity)

### 4. Disposable Email Abuse
- **Pattern:** Using temporary emails for signups
- **Detection:** Email domain check
- **Score:** +30 points

### 5. VPN/Proxy Usage
- **Pattern:** Hiding real location
- **Detection:** IP reputation check
- **Score:** +15-25 points

### 6. Refund Abuse
- **Pattern:** High refund rate to game system
- **Detection:** Refund pattern analysis
- **Score:** +30 points

---

## ⚡ Key Features

1. **Real-Time Detection**
   - Checks run immediately during signup/payment
   - No delay in fraud detection

2. **Cumulative Scoring**
   - Events accumulate over time
   - One-time mistakes don't freeze accounts
   - Persistent fraud patterns are caught

3. **Automatic Protection**
   - Auto-freeze at 60+ points
   - No manual intervention needed for severe cases

4. **Detailed Logging**
   - All events stored with full metadata
   - Complete audit trail for investigations

5. **Admin Visibility**
   - Full fraud summary with stats
   - Device fingerprints, IPs, countries
   - Signup patterns and user details

6. **Flexible Thresholds**
   - Configurable score thresholds
   - Different risk levels for different actions

---

## 🔧 Configuration

### Fraud Thresholds (in `fraud.service.ts`)

```typescript
const FRAUD_THRESHOLDS = {
  MEDIUM: 20,    // Medium risk threshold
  HIGH: 40,      // High risk threshold
  FROZEN: 60,    // Auto-freeze threshold
};
```

### Disposable Email Domains (in `fraud-detection.service.ts`)

List of known disposable email providers:
- mailinator.com, yopmail.com, tempmail.com
- 10minutemail.com, guerrillamail.com
- And 20+ more...

---

## 📋 Fraud Event Flow

```
1. User Action (Signup/Payment/Click)
   ↓
2. Fraud Detection Checks Run
   ├─ IP Reputation Check
   ├─ Device Fingerprint Check
   ├─ Email Risk Check
   ├─ Payment Method Check
   └─ Refund Pattern Check
   ↓
3. Fraud Events Created (if suspicious)
   ↓
4. Fraud Score Recalculated
   ├─ Sum all event scores
   ├─ Determine risk level
   └─ Check thresholds
   ↓
5. Automatic Actions
   ├─ Auto-freeze (if score ≥ 60)
   ├─ Send alerts (if score ≥ 40)
   └─ Log security events
   ↓
6. Admin Review (via dashboard)
```

---

## 🎓 Best Practices

### For Affiliates
- ✅ Use legitimate email addresses
- ✅ Don't create fake accounts
- ✅ Don't use VPNs for signups
- ✅ Don't reuse payment methods across accounts
- ✅ Don't refer yourself

### For Admins
- ✅ Review high-risk affiliates regularly
- ✅ Check fraud dashboard before unfreezing
- ✅ Investigate device fingerprint patterns
- ✅ Monitor refund rates
- ✅ Review fraud events for context

---

## 🔄 Manual Unfreeze Process

When an admin unfreezes an affiliate:

1. **Affiliate status**: `isFrozen = false`
2. **Risk level**: Updated based on current score
   - If score ≥ 40: `high`
   - If score ≥ 20: `medium`
   - If score < 20: `low`
3. **Security event**: Logged with admin email
4. **Payouts/V-Cash**: Re-enabled

**Note:** Unfreezing doesn't reset the fraud score. The affiliate remains at their current risk level.

---

## 📊 Fraud Statistics

The fraud summary provides:
- **Total clicks** from affiliate
- **Total signups** from referrals
- **Unique IPs** used
- **Unique devices** detected
- **Unique countries** of clicks
- **Device fingerprint counts** (how many times each device was used)
- **IP addresses** list
- **Countries** list
- **Signup details** (user emails, IPs, devices, timestamps)

---

## 🚀 Future Enhancements

Potential improvements:
- Machine learning-based fraud detection
- Integration with IP reputation services (IP2Location, MaxMind)
- Real-time Tor exit node checking
- Behavioral pattern analysis
- Velocity checks (too many signups in short time)
- Geographic anomaly detection

---

**Bottom Line:** The fraud detection system automatically identifies and prevents affiliate fraud through multi-layered checks, cumulative scoring, and automatic freezing. All events are logged for admin review and investigation.

