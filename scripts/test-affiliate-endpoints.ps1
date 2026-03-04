# Test Affiliate Fraud and Analytics Endpoints
# Usage: .\test-affiliate-endpoints.ps1 [admin-email]
# Example: .\test-affiliate-endpoints.ps1 "your-email@example.com"

param(
    [string]$AdminEmail = ""
)

if ([string]::IsNullOrEmpty($AdminEmail)) {
    Write-Host "Please provide your admin email:" -ForegroundColor Yellow
    Write-Host "  .\test-affiliate-endpoints.ps1 -AdminEmail 'your-email@example.com'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or enter it now:" -ForegroundColor Yellow
    $AdminEmail = Read-Host "Admin Email"
}

if ([string]::IsNullOrEmpty($AdminEmail)) {
    Write-Host "Admin email is required!" -ForegroundColor Red
    exit 1
}

$baseUrl = "http://localhost:3001/api"
$headers = @{
    'x-admin-email' = $AdminEmail
    'Content-Type' = 'application/json'
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Testing Affiliate Analytics Endpoints" -ForegroundColor Cyan
Write-Host "Using admin email: $AdminEmail" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Revenue Leaderboard
Write-Host "1. Testing Revenue Leaderboard..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "${baseUrl}/admin/affiliate/leaderboard/revenue?limit=10" -Method GET -Headers $headers
    Write-Host "   ✓ Success!" -ForegroundColor Green
    Write-Host "   Found $($response.leaderboard.Count) affiliates" -ForegroundColor Green
    if ($response.leaderboard.Count -gt 0) {
        Write-Host "   Top affiliate: $($response.leaderboard[0].userEmail) - Revenue: `$$([math]::Round($response.leaderboard[0].revenueCents/100, 2))" -ForegroundColor White
    }
    $response | ConvertTo-Json -Depth 2 | Out-File -FilePath "test-analytics-revenue.json" -Encoding utf8
    Write-Host "   Results saved to test-analytics-revenue.json" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Commissions Leaderboard
Write-Host "2. Testing Commissions Leaderboard..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "${baseUrl}/admin/affiliate/leaderboard/commissions?limit=10" -Method GET -Headers $headers
    Write-Host "   ✓ Success!" -ForegroundColor Green
    Write-Host "   Found $($response.leaderboard.Count) affiliates" -ForegroundColor Green
    if ($response.leaderboard.Count -gt 0) {
        Write-Host "   Top affiliate: $($response.leaderboard[0].userEmail) - Commissions: `$$([math]::Round($response.leaderboard[0].commissionCents/100, 2))" -ForegroundColor White
    }
    $response | ConvertTo-Json -Depth 2 | Out-File -FilePath "test-analytics-commissions.json" -Encoding utf8
    Write-Host "   Results saved to test-analytics-commissions.json" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Signups Leaderboard
Write-Host "3. Testing Signups Leaderboard..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "${baseUrl}/admin/affiliate/leaderboard/signups?limit=10" -Method GET -Headers $headers
    Write-Host "   ✓ Success!" -ForegroundColor Green
    Write-Host "   Found $($response.leaderboard.Count) affiliates" -ForegroundColor Green
    if ($response.leaderboard.Count -gt 0) {
        Write-Host "   Top affiliate: $($response.leaderboard[0].userEmail) - Signups: $($response.leaderboard[0].signups)" -ForegroundColor White
    }
    $response | ConvertTo-Json -Depth 2 | Out-File -FilePath "test-analytics-signups.json" -Encoding utf8
    Write-Host "   Results saved to test-analytics-signups.json" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Conversion Rate Leaderboard
Write-Host "4. Testing Conversion Rate Leaderboard..." -ForegroundColor Yellow
try {
    $queryParams = @{
        limit = "10"
        minClicks = "5"
    }
    $uri = "${baseUrl}/admin/affiliate/leaderboard/conversion?" + ($queryParams.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" } | Join-String -Separator '&')
    $response = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
    Write-Host "   ✓ Success!" -ForegroundColor Green
    Write-Host "   Found $($response.leaderboard.Count) affiliates" -ForegroundColor Green
    if ($response.leaderboard.Count -gt 0) {
        $rate = [math]::Round($response.leaderboard[0].conversionRate * 100, 2)
        Write-Host "   Top affiliate: $($response.leaderboard[0].userEmail) - Conversion: $rate%" -ForegroundColor White
    }
    $response | ConvertTo-Json -Depth 2 | Out-File -FilePath "test-analytics-conversion.json" -Encoding utf8
    Write-Host "   Results saved to test-analytics-conversion.json" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Testing Affiliate Fraud Endpoints" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Test 5: Fraud Search
Write-Host "5. Testing Fraud Search..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "${baseUrl}/admin/affiliate/fraud/search?limit=10" -Method GET -Headers $headers
    Write-Host "   ✓ Success!" -ForegroundColor Green
    Write-Host "   Found $($response.affiliates.Count) affiliates" -ForegroundColor Green
    if ($response.affiliates.Count -gt 0) {
        $first = $response.affiliates[0]
        Write-Host "   First result: $($first.userEmail) - Risk: $($first.riskLevel) - Score: $($first.fraudScore)" -ForegroundColor White
    }
    $response | ConvertTo-Json -Depth 2 | Out-File -FilePath "test-fraud-search.json" -Encoding utf8
    Write-Host "   Results saved to test-fraud-search.json" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Fraud Search with Filters
Write-Host "6. Testing Fraud Search with Risk Filter..." -ForegroundColor Yellow
try {
    $queryParams = @{
        riskLevel = "high"
        limit = "5"
    }
    $uri = "${baseUrl}/admin/affiliate/fraud/search?" + ($queryParams.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" } | Join-String -Separator '&')
    $response = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
    Write-Host "   ✓ Success!" -ForegroundColor Green
    Write-Host "   Found $($response.affiliates.Count) high-risk affiliates" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 2 | Out-File -FilePath "test-fraud-high-risk.json" -Encoding utf8
    Write-Host "   Results saved to test-fraud-high-risk.json" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7: Fraud Search by Email/Code
Write-Host "7. Testing Fraud Search by Query..." -ForegroundColor Yellow
try {
    $searchResponse = Invoke-RestMethod -Uri "${baseUrl}/admin/affiliate/fraud/search?limit=1" -Method GET -Headers $headers
    if ($searchResponse.affiliates.Count -gt 0) {
        $referralCode = $searchResponse.affiliates[0].referralCode
        $encodedCode = [System.Web.HttpUtility]::UrlEncode($referralCode)
        $queryParams = @{
            q = $encodedCode
            limit = "5"
        }
        $uri = "${baseUrl}/admin/affiliate/fraud/search?" + ($queryParams.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" } | Join-String -Separator '&')
        $response = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
        Write-Host "   ✓ Success!" -ForegroundColor Green
        Write-Host "   Found $($response.affiliates.Count) affiliates matching '$referralCode'" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ No affiliates found to test with" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "All test results have been saved to JSON files:" -ForegroundColor White
Write-Host "  - test-analytics-revenue.json" -ForegroundColor Gray
Write-Host "  - test-analytics-commissions.json" -ForegroundColor Gray
Write-Host "  - test-analytics-signups.json" -ForegroundColor Gray
Write-Host "  - test-analytics-conversion.json" -ForegroundColor Gray
Write-Host "  - test-fraud-search.json" -ForegroundColor Gray
Write-Host "  - test-fraud-high-risk.json" -ForegroundColor Gray
Write-Host ""
