# Quick Receipt Testing Guide

## 🚀 Quick Start Testing

### Step 1: Find an Order ID

You need an order ID from a completed purchase. Get it from:

**Option A: Check your email**
- Look for order confirmation emails
- Order ID will be in the email

**Option B: Use Admin Panel**
1. Go to `http://localhost:3000/admin/orders`
2. Click on any order
3. Copy the Order ID from the URL or page

**Option C: Check Database**
```sql
SELECT id, "userId", status, "createdAt" FROM "Order" ORDER BY "createdAt" DESC LIMIT 5;
```

### Step 2: Run the Test Script

```powershell
# Run the automated test script
.\test-receipt.ps1
```

The script will ask you for:
- Order ID
- Your email (must match order owner)
- Admin email (optional)

### Step 3: Manual Testing

#### Test Receipt Download (Backend)

```powershell
# Replace these values:
$orderId = "your-order-id-here"
$userEmail = "your-email@example.com"

# Download receipt
Invoke-WebRequest -Uri "http://localhost:3001/api/orders/$orderId/receipt" `
  -Headers @{"x-user-email"=$userEmail} `
  -OutFile "receipt.pdf"

# Open the PDF
Start-Process "receipt.pdf"
```

#### Test from Frontend

1. **Go to My eSIMs:**
   - Navigate to `http://localhost:3000/my-esims`
   - Click on any eSIM card
   - Click "Download Receipt" button

2. **Go to Admin Panel:**
   - Navigate to `http://localhost:3000/admin/orders`
   - Click on any order
   - Scroll to "Receipt" section
   - Click "Download Receipt"

#### Test Receipt Email

1. **Make a new purchase:**
   - Go to homepage
   - Select a plan
   - Complete checkout with Stripe test card: `4242 4242 4242 4242`
   - Wait for eSIM provisioning (check backend logs)

2. **Check your email:**
   - Look for "Receipt for your purchase — Voyage"
   - Click "Download PDF Receipt" link

3. **Or check Email Logs:**
   - Go to `http://localhost:3000/admin/emails`
   - Filter by template: `receipt`
   - Verify email was sent

---

## ✅ Checklist

- [ ] Receipt downloads as PDF
- [ ] PDF contains correct order information
- [ ] Customer email/name shown correctly
- [ ] Plan name (not just code) displayed
- [ ] Price breakdown is accurate
- [ ] Receipt email received after purchase
- [ ] Download link in email works
- [ ] Download button works on eSIM detail page
- [ ] Admin can download any receipt
- [ ] Unauthorized access is blocked (403 error)

---

## 🔍 Verify PDF Content

Open the downloaded PDF and check:

1. **Title:** "eSIM Purchase Receipt"
2. **Customer Info:** Your email and name
3. **Order ID:** Matches the order
4. **Order Date:** Correct timestamp
5. **Plan Name:** Human-readable (not just code)
6. **Duration:** e.g., "1 DAY" or "30 DAYS"
7. **Data Volume:** e.g., "1.00 GB"
8. **Provider Order No:** If exists
9. **Price:** Matches what you paid
10. **Currency:** Correct symbol

---

## 🐛 Common Issues

### "Access denied" Error
- ✅ Check your email matches the order owner exactly
- ✅ For admin: Check email is in `ADMIN_EMAILS` env variable
- ✅ Try using query parameter: `?email=your@email.com`

### PDF Not Generating
- ✅ Check backend is running
- ✅ Check order exists in database
- ✅ Check backend logs for errors

### Receipt Email Not Sent
- ✅ Check email service is configured (Resend API key)
- ✅ Check mock mode is disabled (or emails logged as "mock")
- ✅ Verify eSIM provisioning completed
- ✅ Check email logs in admin panel

### Download Button Not Working
- ✅ Check browser console for errors
- ✅ Verify user is logged in
- ✅ Check network tab for failed requests

---

## 📝 Testing Scenarios

### Scenario 1: Complete Purchase Flow
1. Make a purchase
2. Wait for eSIM provisioning
3. Receive receipt email
4. Download receipt from email
5. Verify receipt matches order

### Scenario 2: Download from Multiple Places
1. Download from email link
2. Download from eSIM detail page
3. Download from admin panel
4. All three PDFs should be identical

### Scenario 3: Security Testing
1. Try downloading someone else's receipt → Should fail (403)
2. Try downloading with wrong email → Should fail (403)
3. Try downloading non-existent order → Should fail (404)
4. Admin can download any receipt → Should work

---

## 🎯 Quick Test Commands

### Get Order ID from Database
```powershell
# Using psql (if PostgreSQL client installed)
psql $env:DATABASE_URL -c "SELECT id, status, \"createdAt\" FROM \"Order\" ORDER BY \"createdAt\" DESC LIMIT 1;"
```

### Download Receipt (Quick)
```powershell
$orderId = "YOUR_ORDER_ID"
$email = "your@email.com"

Invoke-WebRequest "http://localhost:3001/api/orders/$orderId/receipt?email=$email" -OutFile "test.pdf"
```

### Check Email Logs (API)
```powershell
$adminEmail = "your-admin@email.com"

Invoke-RestMethod "http://localhost:3001/api/admin/email/logs?template=receipt&limit=5" `
  -Headers @{"x-admin-email"=$adminEmail} | ConvertTo-Json -Depth 5
```

---

**Need help?** Check the detailed guide: `RECEIPT_TESTING_GUIDE.md`

