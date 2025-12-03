# Quick Test Instructions

## Issue Found
PDFKit is installed, but the backend might need to be restarted or there's a runtime error.

## Steps to Test:

### 1. Restart Backend Server
**Important:** Stop and restart your backend server to pick up any changes.

If backend is running, stop it (Ctrl+C), then restart:
```powershell
cd apps/backend
npm run start:dev
```

Or if running from root:
```powershell
npm run dev
```

### 2. Test Receipt Download

After backend restarts, run this command:

```powershell
# Test receipt download
$orderId = "15428bf8-de90-413f-92c5-cda18c6fe08e"
$userEmail = "ezzawan9@gmail.com"

Invoke-WebRequest -Uri "http://localhost:3001/api/orders/$orderId/receipt?email=$userEmail" -OutFile "receipt-test.pdf"

# Check if file was created
if (Test-Path "receipt-test.pdf") {
    Write-Host "✅ Success! Opening PDF..." -ForegroundColor Green
    Start-Process "receipt-test.pdf"
} else {
    Write-Host "❌ Failed - check backend logs" -ForegroundColor Red
}
```

### 3. Check Backend Logs

Look at your backend console output. You should see:
- Any error messages about PDFKit
- Any errors during PDF generation
- HTTP request logs

Common errors to look for:
- "Cannot find module 'pdfkit'"
- "PDFDocument is not a constructor"
- Any stack traces

### 4. Alternative: Test from Browser

1. Open: `http://localhost:3000/my-esims`
2. Click on an eSIM card
3. Click "Download Receipt" button
4. Check browser console (F12) for errors

---

## If Still Getting 500 Error:

Check backend console for the actual error. Common fixes:

1. **Import Error:** PDFKit might need different import syntax
2. **Missing Dependencies:** PDFKit requires additional native modules
3. **Runtime Error:** Check the full stack trace in backend logs

---

## Quick Debug Command

```powershell
# This will show the full error response
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/orders/15428bf8-de90-413f-92c5-cda18c6fe08e/receipt?email=ezzawan9@gmail.com"
} catch {
    Write-Host "Error:" -ForegroundColor Red
    $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        $_.ErrorDetails.Message
    }
}
```

