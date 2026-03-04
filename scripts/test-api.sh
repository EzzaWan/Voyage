#!/bin/bash
# Voyage eSIM API Testing Script
# Usage: ./test-api.sh

BASE_URL="http://localhost:3001/api"

echo "🧪 Testing Voyage eSIM API Endpoints"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: GET /api/countries
echo "1️⃣  Testing GET /api/countries"
echo "----------------------------"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/countries")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ SUCCESS${NC} (HTTP $http_code)"
    echo "First country: $(echo "$body" | jq -r '.[0] | "\(.name) (\(.code))"' 2>/dev/null || echo "Check response manually")"
else
    echo -e "${RED}❌ FAILED${NC} (HTTP $http_code)"
fi
echo ""

# Test 2: GET /api/countries/:code/plans
echo "2️⃣  Testing GET /api/countries/US/plans"
echo "------------------------------------"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/countries/US/plans")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ SUCCESS${NC} (HTTP $http_code)"
    count=$(echo "$body" | jq '. | length' 2>/dev/null || echo "?")
    echo "Found $count plan(s)"
    if [ -n "$count" ] && [ "$count" != "?" ] && [ "$count" -gt 0 ]; then
        first_plan=$(echo "$body" | jq -r '.[0] | "\(.name) - $\(.price)"' 2>/dev/null || echo "")
        echo "First plan: $first_plan"
    fi
else
    echo -e "${RED}❌ FAILED${NC} (HTTP $http_code)"
fi
echo ""

# Test 3: POST /api/orders
echo "3️⃣  Testing POST /api/orders"
echo "---------------------------"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "planCode": "P7B64E9XP",
    "amount": 0.55,
    "currency": "usd",
    "planName": "Test Plan"
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
    echo -e "${GREEN}✅ SUCCESS${NC} (HTTP $http_code)"
    url=$(echo "$body" | jq -r '.url' 2>/dev/null || echo "")
    if [ -n "$url" ] && [ "$url" != "null" ]; then
        echo "Checkout URL created: ${url:0:50}..."
    fi
else
    echo -e "${RED}❌ FAILED${NC} (HTTP $http_code)"
    echo "Response: $body"
fi
echo ""

# Test 4: GET /api/orders/retry-now
echo "4️⃣  Testing GET /api/orders/retry-now"
echo "-----------------------------------"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/orders/retry-now")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ SUCCESS${NC} (HTTP $http_code)"
    echo "Response: $body"
else
    echo -e "${RED}❌ FAILED${NC} (HTTP $http_code)"
fi
echo ""

echo "===================================="
echo "✅ Basic API tests completed!"
echo ""
echo "💡 Next steps:"
echo "   - Test topup endpoints manually (require profile IDs)"
echo "   - Check backend logs for detailed processing"
echo "   - Use 'npx prisma studio' to verify database records"

