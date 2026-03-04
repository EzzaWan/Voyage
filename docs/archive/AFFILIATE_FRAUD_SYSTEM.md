# Affiliate Fraud Detection System

## Overview

Automatically detects suspicious affiliate behavior and assigns a fraud score. Affiliates are auto-frozen when their score reaches 60+ points.

---

## Fraud Score System

| Risk Level | Score | Action |
|-----------|-------|--------|
| Low | 0-19 | Normal monitoring |
| Medium | 20-39 | Flagged for review |
| High | 40-59 | Alert to admins |
| **Frozen** | **60+** | **Auto-freeze** (blocks payouts & V-Cash) |

**How it works:**
- Each fraud event adds points to the total score
- All scores are summed to get the total
- At 60+ points, affiliate is automatically frozen

---

## Fraud Detection Checks

### 1. IP Reputation
- VPN/Proxy IP: **+15 points**
- Datacenter IP (AWS, Azure, etc.): **+20 points**
- Tor exit node: **+25 points**

### 2. Device Fingerprint
- Same device, multiple signups: **+20 points**
- 10+ signups from same device: **+40 points** (auto-freeze)
- Self-referral (affiliate uses own code): **+25 points**
- Multi-account (same device across affiliate codes): **+30 points**

### 3. Email Risk
- Disposable email (tempmail, mailinator, etc.): **+30 points**
- Email aliasing (john+1, john+2): **+10 points**
- Bot-generated pattern (test123, user456): **+25 points**

### 4. Payment Method
- Same card across multiple accounts: **+40 points**
- Same card for multiple affiliate codes: **+50 points** (highest)

### 5. Refund Pattern
- High refund rate (>50%): **+30 points**

---

## When Checks Run

- **On signup**: IP, device, email checks
- **On payment**: Payment method check
- **On refund**: Refund pattern check

---

## Fraud Event Scores

| Event | Points |
|-------|--------|
| VPN_IP | +15 |
| DATACENTER_IP | +20 |
| TOR_IP | +25 |
| SAME_DEVICE_MULTIPLE | +20 (or +40 if 10+) |
| SELF_REFERRAL | +25 |
| MULTI_ACCOUNT | +30 |
| DISPOSABLE_EMAIL | +30 |
| SUSPICIOUS_EMAIL | +10-25 |
| CARD_REUSED | +40 |
| CARD_MULTI_AFFILIATE | +50 |
| REFUND_PATTERN | +30 |

---

## Automatic Actions

### Auto-Freeze (Score ≥ 60)
- Affiliate frozen automatically
- Blocks payouts and V-Cash conversions
- Admin must manually unfreeze

### Alerts (Score ≥ 40)
- Security event logged
- Admin notification sent

---

## Example Scenarios

**Fake Accounts:**
- VPN IP (+15) + Disposable email (+30) + Same device (+20) + Same card (+40) = **105 points → Frozen**

**Self-Referral:**
- Self-referral (+25) + Bot email (+25) = **50 points → High risk**

---

## Admin Controls

- **Freeze/Unfreeze**: Manually freeze or unfreeze affiliates
- **Fraud Dashboard**: View fraud score, events, device fingerprints, IPs, countries
- **Search**: Search affiliates by risk level

**Frozen affiliates cannot:**
- Request payouts
- Convert to V-Cash
- Earn new commissions

---

## Device Fingerprinting

Creates unique hash from: device type, OS, browser, timezone, language, screen resolution.

**Detects:**
- Same device creating multiple accounts
- Self-referrals (affiliate device = referred user device)
- Multi-account schemes (one device across multiple affiliate codes)

---

## Common Fraud Patterns

1. **Fake Account Creation**: Multiple accounts from same device/IP (+20-40)
2. **Self-Referral**: Affiliate refers themselves (+25)
3. **Card Reuse**: Same card across accounts (+40-50)
4. **Disposable Emails**: Using temp emails (+30)
5. **VPN/Proxy**: Hiding location (+15-25)
6. **Refund Abuse**: High refund rate (+30)

---

**Bottom Line:** The system automatically detects and prevents affiliate fraud through multiple checks and cumulative scoring. At 60+ points, affiliates are auto-frozen.
