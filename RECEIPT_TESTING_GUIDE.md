# Receipt System Testing Guide

This guide covers testing the complete Payment Receipt System.

---

## Prerequisites

1. **Backend running** on `http://localhost:3001`
2. **Frontend running** on `http://localhost:3000`
3. **Database connected** and migrations applied
4. **Stripe test keys** configured (for test purchases)
5. **Email configured** (Resend API key or mock mode enabled)

---

## 1. Test Receipt Generation (Backend API)

### Test 1.1: Download Receipt as Order Owner

```powershell
# Replace with your actual order ID and user email
$orderId = "YOUR_ORDER_ID_HERE"
$userEmail = "your-email@example.com"

# Download receipt with user email header
Invoke-WebRequest -Uri "http://localhost:3001/api/orders/$orderId/receipt" `
  -Headers @{"x-user-email"=$userEmail} `
  -OutFile "receipt-test.pdf"

Write-Host "Receipt downloaded to receipt-test.pdf"
```

**Expected Result:**
- PDF file downloaded successfully
- PDF contains:
  - "eSIM Purchase Receipt" title
  - Customer information (email, name)
  - Order information (Order ID, date, status)
  - eSIM details (plan name, duration, data volume)
  - Price breakdown
  - Provider Order No (if exists)

### Test 1.2: Download Receipt as Admin

```powershell
$orderId = "YOUR_ORDER_ID_HERE"
$adminEmail = "admin@example.com"  # Must be in ADMIN_EMAILS env var

Invoke-WebRequest -Uri "http://localhost:3001/api/orders/$orderId/receipt" `
  -Headers @{"x-admin-email"=$adminEmail} `
  -OutFile "receipt-admin.pdf"

Write-Host "Receipt downloaded to receipt-admin.pdf"
```

**Expected Result:**
- PDF downloaded successfully (even if admin is not the order owner)

### Test 1.3: Download Receipt via Email Link (Query Param)

```powershell
$orderId = "YOUR_ORDER_ID_HERE"
$userEmail = "your-email@example.com"

# Simulate clicking email link
$url = "http://localhost:3001/api/orders/$orderId/receipt?email=" + [System.Web.HttpUtility]::UrlEncode($userEmail)

Invoke-WebRequest -Uri $url `
  -OutFile "receipt-email.pdf"

Write-Host "Receipt downloaded via email link"
```

**Expected Result:**
- PDF downloaded successfully using email query parameter

### Test 1.4: Test Unauthorized Access (Should Fail)

```powershell
$orderId = "YOUR_ORDER_ID_HERE"
$wrongEmail = "wrong-email@example.com"

try {
    Invoke-WebRequest -Uri "http://localhost:3001/api/orders/$orderId/receipt" `
      -Headers @{"x-user-email"=$wrongEmail} `
      -OutFile "receipt-unauthorized.pdf"
} catch {
    Write-Host "Expected error: $_" -ForegroundColor Yellow
}
```

**Expected Result:**
- HTTP 403 Forbidden error
- Error message: "Access denied. You must be the order owner or an admin."
- No PDF file created

### Test 1.5: Test Non-Existent Order (Should Fail)

```powershell
$fakeOrderId = "00000000-0000-0000-0000-000000000000"

try {
    Invoke-WebRequest -Uri "http://localhost:3001/api/orders/$fakeOrderId/receipt" `
      -Headers @{"x-user-email"="test@example.com"} `
      -OutFile "receipt-notfound.pdf"
} catch {
    Write-Host "Expected error: $_" -ForegroundColor Yellow
}
```

**Expected Result:**
- HTTP 404 Not Found error
- Error message: "Order {id} not found"

---

## 2. Test Receipt Email

### Test 2.1: Complete a Purchase and Verify Receipt Email

1. **Make a test purchase:**
   - Go to `http://localhost:3000`
   - Select a plan
   - Complete Stripe checkout with test card: `4242 4242 4242 4242`
   - Wait for eSIM provisioning to complete

2. **Check your email inbox** (or email logs in admin panel)

3. **Expected Email Contents:**
   - Subject: "Receipt for your purchase — Voyage"
   - Contains:
     - Order ID
     - Plan name
     - Amount paid
     - Download link button

### Test 2.2: Verify Receipt Download Link in Email

1. Open the receipt email
2. Click "Download PDF Receipt" button/link
3. Verify:
   - PDF downloads automatically
   - PDF contains correct order information
   - PDF matches order details

### Test 2.3: Check Email Logs (Admin Panel)

1. Go to `http://localhost:3000/admin/emails`
2. Filter by template: `receipt`
3. Verify:
   - Receipt email was sent
   - Status is "sent" (or "mock" if mock mode enabled)
   - Recipient email is correct
   - Variables contain order information

---

## 3. Test Frontend Download Buttons

### Test 3.1: Download Receipt from eSIM Detail Page

1. **Log in** to your account at `http://localhost:3000`
2. **Navigate to:** `/my-esims`
3. **Click on any eSIM card** to open detail page
4. **Look for "Download Receipt" button** (next to "Top Up Now" button)
5. **Click "Download Receipt"**
6. **Verify:**
   - PDF downloads automatically
   - Filename: `receipt-{orderId}.pdf`
   - PDF contains correct information

### Test 3.2: Download Receipt from Admin Panel

1. **Log in as admin** at `http://localhost:3000/admin`
2. **Navigate to:** `/admin/orders`
3. **Click on any order** to open order details
4. **Scroll to "Receipt" section** (at the bottom)
5. **Click "Download Receipt" button**
6. **Verify:**
   - PDF downloads automatically
   - PDF contains all order information
   - Works even if admin is not the order owner

---

## 4. Test Complete Purchase Flow

### End-to-End Receipt Flow Test

1. **Make a new purchase:**
   ```
   - Go to homepage
   - Select a country
   - Choose a plan
   - Complete checkout
   - Use Stripe test card: 4242 4242 4242 4242
   ```

2. **Wait for eSIM provisioning:**
   - Check backend logs for "Created REAL eSIM profile"
   - Wait 5-10 seconds for email processing

3. **Verify receipt email received:**
   - Check inbox (or email logs)
   - Should receive receipt email automatically

4. **Download receipt multiple ways:**
   - **From email:** Click download link
   - **From eSIM detail page:** Click "Download Receipt" button
   - **From admin panel:** Go to order and download

5. **Verify all receipts are identical:**
   - All three PDFs should have same content
   - All should show correct order ID, plan, price

---

## 5. Test PDF Content Accuracy

### Verify PDF Contains Correct Data

1. **Download a receipt** (any method)
2. **Open PDF** in a PDF viewer
3. **Verify each section:**

   **Customer Information:**
   - ✅ Email matches order owner
   - ✅ Name matches (if available)

   **Order Information:**
   - ✅ Order ID matches database
   - ✅ Order date is correct
   - ✅ Status is correct
   - ✅ Payment Reference matches Stripe payment

   **eSIM Details:**
   - ✅ Plan name is correct (not just plan code)
   - ✅ Duration matches plan
   - ✅ Data volume matches plan
   - ✅ Provider Order No matches (if exists)

   **Price Breakdown:**
   - ✅ Base Price matches order amount
   - ✅ Fees shown (should be 0.00)
   - ✅ Total Paid matches order amount
   - ✅ Currency is correct

---

## 6. Test Edge Cases

### Test 6.1: Receipt for Order Without eSIM Profile

```powershell
# Create a test order that hasn't been provisioned yet
# Then try to download receipt
```

**Expected:**
- Receipt still generates
- Shows order info
- Shows "Pending" for eSIM profiles or empty list

### Test 6.2: Receipt for Order with Multiple eSIM Profiles

**Scenario:**
- Some orders might have multiple profiles

**Expected:**
- Receipt shows all profiles
- Each profile listed with ICCID and Transaction No

### Test 6.3: Receipt with Special Characters in Plan Name

**Expected:**
- Special characters are sanitized in PDF
- No rendering errors
- PDF is readable

### Test 6.4: Receipt with Long Plan Names

**Expected:**
- Text wraps properly
- No overflow issues
- PDF layout remains clean

---

## 7. Manual Testing Checklist

### Backend API
- [ ] Download receipt as order owner (header)
- [ ] Download receipt as order owner (query param)
- [ ] Download receipt as admin
- [ ] Unauthorized access blocked (403)
- [ ] Non-existent order returns 404
- [ ] PDF generation successful
- [ ] PDF content is accurate

### Email System
- [ ] Receipt email sent after eSIM provisioning
- [ ] Email contains correct order info
- [ ] Download link works from email
- [ ] Email appears in email logs
- [ ] Email template renders correctly

### Frontend UI
- [ ] "Download Receipt" button visible on eSIM detail page
- [ ] Button downloads PDF correctly
- [ ] Receipt section visible in admin order detail page
- [ ] Admin can download any order's receipt
- [ ] Buttons have correct styling

### End-to-End Flow
- [ ] Complete purchase flow works
- [ ] Receipt email received automatically
- [ ] Can download receipt from email
- [ ] Can download receipt from eSIM page
- [ ] Can download receipt from admin panel
- [ ] All receipts have identical content

---

## 8. Troubleshooting

### Issue: PDF Not Downloading

**Check:**
1. Backend is running on port 3001
2. Order ID is correct
3. User email matches order owner
4. Check browser console for errors
5. Check backend logs for errors

### Issue: Receipt Email Not Sent

**Check:**
1. Email service is configured (Resend API key or mock mode)
2. Check email logs in admin panel: `/admin/emails`
3. Verify eSIM provisioning completed (check backend logs)
4. Check `OrdersService.sendReceiptEmail` is called

### Issue: Unauthorized Access Error

**Check:**
1. User email matches order owner email exactly (case-insensitive)
2. Admin email is in `ADMIN_EMAILS` env variable
3. Headers are being sent correctly
4. Check backend logs for access denied messages

### Issue: PDF Content Missing/Wrong

**Check:**
1. Order has all required fields in database
2. Plan details are fetchable (plan ID is correct)
3. eSIM profiles are linked to order
4. Check backend logs for errors during PDF generation

---

## 9. Quick Test Commands

### Get a Real Order ID

```powershell
# Query database or use admin panel to find an order ID
# Or check your email for order confirmation
```

### Test with cURL (Alternative to PowerShell)

```bash
# Download receipt as user
curl -H "x-user-email: your-email@example.com" \
  http://localhost:3001/api/orders/YOUR_ORDER_ID/receipt \
  -o receipt.pdf

# Download receipt as admin
curl -H "x-admin-email: admin@example.com" \
  http://localhost:3001/api/orders/YOUR_ORDER_ID/receipt \
  -o receipt-admin.pdf
```

---

## 10. Testing in Production

Before deploying to production:

1. **Test with real Stripe keys** (not test mode)
2. **Test email delivery** with real Resend account
3. **Verify PDF formatting** across different PDF viewers
4. **Test with real user accounts**
5. **Verify security** (unauthorized access blocked)
6. **Check performance** (PDF generation speed)
7. **Monitor email logs** for delivery issues

---

## Notes

- **Mock Mode:** If mock mode is enabled, emails will be logged but not sent
- **Test Cards:** Use Stripe test cards for testing purchases
- **Email Logs:** Check `/admin/emails` to see all email activity
- **Backend Logs:** Monitor console for PDF generation errors
- **PDF Viewer:** Use Adobe Reader or Chrome PDF viewer for best results

---

**Happy Testing! 🎉**

