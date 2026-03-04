# Quick Receipt System Testing Script
# Run this after making a test purchase

Write-Host "🧪 Receipt System Testing" -ForegroundColor Cyan
Write-Host ""

# Configuration
$API_URL = "http://localhost:3001/api"
$WEB_URL = "http://localhost:3000"

# Get inputs
$orderId = Read-Host "Enter Order ID to test"
$userEmail = Read-Host "Enter your email (order owner)"
$adminEmail = Read-Host "Enter admin email (or press Enter to skip admin test)"

Write-Host ""
Write-Host "Starting tests..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Download as user (header)
Write-Host "Test 1: Download receipt as order owner (header)" -ForegroundColor Green
try {
    Invoke-WebRequest -Uri "$API_URL/orders/$orderId/receipt" `
        -Headers @{"x-user-email"=$userEmail} `
        -OutFile "receipt-user-header.pdf" `
        -ErrorAction Stop
    
    Write-Host "✅ Success! Receipt saved to: receipt-user-header.pdf" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Download as user (query param - simulates email link)
Write-Host "Test 2: Download receipt via email link (query param)" -ForegroundColor Green
try {
    $encodedEmail = [System.Web.HttpUtility]::UrlEncode($userEmail)
    Invoke-WebRequest -Uri "$API_URL/orders/$orderId/receipt?email=$encodedEmail" `
        -OutFile "receipt-email-link.pdf" `
        -ErrorAction Stop
    
    Write-Host "✅ Success! Receipt saved to: receipt-email-link.pdf" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Download as admin (if admin email provided)
if ($adminEmail) {
    Write-Host "Test 3: Download receipt as admin" -ForegroundColor Green
    try {
        Invoke-WebRequest -Uri "$API_URL/orders/$orderId/receipt" `
            -Headers @{"x-admin-email"=$adminEmail} `
            -OutFile "receipt-admin.pdf" `
            -ErrorAction Stop
        
        Write-Host "✅ Success! Receipt saved to: receipt-admin.pdf" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 4: Test unauthorized access (should fail)
Write-Host "Test 4: Test unauthorized access (should fail with 403)" -ForegroundColor Green
try {
    Invoke-WebRequest -Uri "$API_URL/orders/$orderId/receipt" `
        -Headers @{"x-user-email"="wrong-email@example.com"} `
        -OutFile "receipt-unauthorized.pdf" `
        -ErrorAction Stop
    
    Write-Host "❌ Security issue! Unauthorized access succeeded!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 403) {
        Write-Host "✅ Correctly blocked unauthorized access (403 Forbidden)" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Unexpected error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
Write-Host ""

# Summary
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open the PDF files and verify content" -ForegroundColor White
Write-Host "2. Check receipt email was sent (check inbox or /admin/emails)" -ForegroundColor White
Write-Host "3. Test download button on eSIM detail page: $WEB_URL/my-esims" -ForegroundColor White
Write-Host "4. Test admin receipt download: $WEB_URL/admin/orders/$orderId" -ForegroundColor White
Write-Host ""

