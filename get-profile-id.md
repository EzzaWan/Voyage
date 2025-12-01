# How to Get Your Profile ID

## Method 1: Using the API Endpoint (Easiest)

Use the `/api/user/esims` endpoint with your email:

```bash
# Replace YOUR_EMAIL with your actual Clerk email
curl "http://localhost:3001/api/user/esims?email=YOUR_EMAIL@example.com"
```

This returns all your eSIM profiles. The `id` field is your profile ID.

**Example response:**
```json
[
  {
    "id": "22b0ca0c-1979-422f-9e02-abc123...",  // <-- This is your profile ID
    "iccid": "8997250230000291441",
    "esimStatus": "GOT_RESOURCE",
    "qrCodeUrl": "https://p.qrsim.net/...",
    ...
  }
]
```

**To extract just the profile ID:**
```bash
# Linux/Mac:
curl "http://localhost:3001/api/user/esims?email=YOUR_EMAIL@example.com" | jq '.[0].id'

# Windows PowerShell:
$response = Invoke-WebRequest -Uri "http://localhost:3001/api/user/esims?email=YOUR_EMAIL@example.com"
($response.Content | ConvertFrom-Json)[0].id
```

---

## Method 2: Using Prisma Studio (Visual)

1. Open Prisma Studio:
   ```bash
   npx prisma studio
   ```
   
2. Browser opens at `http://localhost:5555`

3. Click on **"EsimProfile"** in the left sidebar

4. Find your profile (look for your ICCID or order details)

5. Copy the **`id`** field (it's a UUID like `22b0ca0c-1979-422f-9e02-...`)

---

## Method 3: From Browser Console (Frontend)

1. Go to `http://localhost:3000/my-esims` in your browser

2. Open Developer Tools (F12 or Right-click → Inspect)

3. Go to the **Console** tab

4. You should see logs like:
   ```
   [MY-ESIMS] Received profiles: [...]
   [MY-ESIMS] First profile details: {...}
   ```

5. Expand the logged profile array and find the `id` field

---

## Quick Test Command Template

Once you have your profile ID, test the topup endpoint:

```bash
curl -X POST http://localhost:3001/api/topup/create \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "YOUR_PROFILE_ID_HERE",
    "planCode": "P7B64E9XP",
    "amount": 5.00,
    "currency": "usd"
  }'
```

---

## Finding Your User ID (for topup/me endpoint)

Your User ID is also available from the same endpoint:

```bash
curl "http://localhost:3001/api/user/esims?email=YOUR_EMAIL@example.com" | jq '.[0].userId'
```

Or from Prisma Studio → **User** table → find your email → copy the `id` field.

