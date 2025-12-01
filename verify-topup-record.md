# Verifying TopUp Record in Prisma Studio

## Expected TopUp Record

Based on the API test, you should see a TopUp record with:

- **ID**: `1b5ed712-56c1-4edf-af78-5e4e45ce3538`
- **userId**: `e56319e4-9917-406a-a329-3fb09c5d0615`
- **profileId**: `22b0ca0c-1979-422f-9e02-b19590acdfc5`
- **planCode**: `P7B64E9XP`
- **amountCents**: `500`
- **currency**: `usd`
- **status**: `pending`
- **paymentRef**: `cs_test_a1woMDFgKLXy2AmQEzTeQVLvTP0pjDNyXdiuI3bL4xOFatfcTaoj7UVEFt`
- **rechargeOrder**: `null` (will be set after provider processes)
- **createdAt**: Recent timestamp

## How to Check in Prisma Studio

1. **Open Prisma Studio:**
   ```bash
   npx prisma studio
   ```

2. **Navigate to TopUp table:**
   - Click on **"TopUp"** in the left sidebar
   - You should see 1 record

3. **Verify the record:**
   - Check the `id` field matches: `1b5ed712-56c1-4edf-af78-5e4e45ce3538`
   - Check `status` is `pending`
   - Check `amountCents` is `500` (which is $5.00)

4. **Check relations:**
   - Click on the record to view details
   - You should see the related `User` and `EsimProfile` records

## If You Don't See the Record

If the record is missing, check:

1. **Backend logs** - Look for `[TOPUP] Created topup record` message
2. **Database connection** - Ensure Prisma Studio is connected to the same database
3. **Transaction rollback** - Check if there was an error that rolled back the transaction

## Next Steps After Payment

Once you complete the Stripe checkout (with test card), the record will update:
- `status` → `processing` (when webhook processes)
- `rechargeOrder` → Will be set after provider accepts the recharge
- Eventually `status` → `completed` when the cron job confirms it

