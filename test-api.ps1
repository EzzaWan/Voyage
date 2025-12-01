# Voyage eSIM API Testing Script for Windows PowerShell
# Usage: .\test-api.ps1

$BaseUrl = "http://localhost:3001/api"

Write-Host "🧪 Testing Voyage eSIM API Endpoints" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: GET /api/countries
Write-Host "1️⃣  Testing GET /api/countries" -ForegroundColor Yellow
Write-Host "----------------------------"
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/countries" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ SUCCESS (HTTP $($response.StatusCode))" -ForegroundColor Green
        $data = $response.Content | ConvertFrom-Json
        if ($data.Count -gt 0) {
            Write-Host "First country: $($data[0].name) ($($data[0].code))"
        }
    }
} catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
Write-Host ""

# Test 2: GET /api/countries/:code/plans
Write-Host "2️⃣  Testing GET /api/countries/US/plans" -ForegroundColor Yellow
Write-Host "------------------------------------"
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/countries/US/plans" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ SUCCESS (HTTP $($response.StatusCode))" -ForegroundColor Green
        $data = $response.Content | ConvertFrom-Json
        Write-Host "Found $($data.Count) plan(s)"
        if ($data.Count -gt 0) {
            Write-Host "First plan: $($data[0].name) - `$$($data[0].price)"
        }
    }
} catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
Write-Host ""

# Test 3: POST /api/orders
Write-Host "3️⃣  Testing POST /api/orders" -ForegroundColor Yellow
Write-Host "---------------------------"
try {
    $body = @{
        planCode = "P7B64E9XP"
        amount = 0.55
        currency = "usd"
        planName = "Test Plan"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$BaseUrl/orders" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
        Write-Host "✅ SUCCESS (HTTP $($response.StatusCode))" -ForegroundColor Green
        $data = $response.Content | ConvertFrom-Json
        if ($data.url) {
            Write-Host "Checkout URL created: $($data.url.Substring(0, [Math]::Min(50, $data.url.Length)))..."
        }
    }
} catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
Write-Host ""

# Test 4: GET /api/orders/retry-now
Write-Host "4️⃣  Testing GET /api/orders/retry-now" -ForegroundColor Yellow
Write-Host "-----------------------------------"
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/orders/retry-now" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ SUCCESS (HTTP $($response.StatusCode))" -ForegroundColor Green
        Write-Host "Response: $($response.Content)"
    }
} catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
Write-Host ""

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "✅ Basic API tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Yellow
Write-Host "   - Test topup endpoints manually (require profile IDs)"
Write-Host "   - Check backend logs for detailed processing"
Write-Host "   - Use 'npx prisma studio' to verify database records"

