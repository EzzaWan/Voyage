# eSIM Access API — Official Reference (Markdown Version)

*Last updated based on version updates up to July 2025.*

---

# 1. Overview

The **eSIM Access Partner API** allows you to:

* List data packages
* Filter packages (country, region, type, top-up)
* Order profiles (single or batch)
* Query profile status
* Top-up existing profiles
* Cancel, suspend, unsuspend, revoke
* Check balance
* Query supported regions
* Receive webhooks for provisioning, lifecycle, usage

**Base URL (Production):**

```
https://api.esimaccess.com
```

**No sandbox exists.**
Testing is done with real orders (you can cancel refund-eligible ones).

**Rate Limit:**
`8 requests per second`

---

# 2. Authentication

## 2.1 Required Headers

| Header          | Description                           |
| --------------- | ------------------------------------- |
| `RT-AccessCode` | Your public API key                   |
| `RT-Timestamp`  | Milliseconds timestamp (string)       |
| `RT-RequestID`  | UUID v4 unique per request            |
| `RT-Signature`  | HMAC-SHA256 signature (lowercase hex) |

---

## 2.2 Signature Calculation

### Concatenate:

```
signData = Timestamp + RequestID + AccessCode + RequestBody
```

### Sign:

```
signature = HMAC_SHA256(signData, SecretKey)
```

Convert to lowercase hex.

**Example Plain Inputs:**

```
Timestamp = 1628670421
RequestID = 4ce9d9cdac9e4e17b3a2c66c358c1ce2
AccessCode = 11111
SecretKey = 1111
RequestBody = {"imsi":"326543826"}
```

Result:

```
7eb765e27df5373dea2dbc8c41a7d9557743e46c8054750f3d851b3fd01d0835
```

---

# 3. Error Codes

| Code   | Description                               |
| ------ | ----------------------------------------- |
| 000001 | Server error                              |
| 000101 | Missing mandatory header                  |
| 000102 | Wrong header format                       |
| 000103 | Unsupported HTTP method                   |
| 000104 | Invalid JSON                              |
| 000105 | Mandatory params missing                  |
| 000106 | Mandatory param null                      |
| 000107 | Invalid param length                      |
| 101001 | Timestamp expired                         |
| 101002 | IP blocked                                |
| 101003 | Signature mismatch                        |
| 200002 | Operation not allowed due to order status |
| 200005 | Package price error                       |
| 200006 | Wrong total amount                        |
| 200007 | Insufficient balance                      |
| 200008 | Order parameter error                     |
| 200009 | Abnormal order status                     |
| 200010 | Profile not yet allocated                 |
| 200011 | Insufficient available profiles           |
| 310201 | bundle.code does not exist                |
| 310211 | data_plan_location.id does not exist      |
| 310221 | currencyId does not exist                 |
| 310231 | carrierId does not exist                  |
| 310241 | packageCode does not exist                |
| 310243 | package does not exist                    |
| 310251 | vendor does not exist                     |
| 310272 | orderNo does not exist                    |
| 310403 | ICCID not in the order                    |
| 900001 | System busy                               |

---

# 4. API Endpoints

---

# 4.1 Get All Data Packages

**POST** `/api/v1/open/package/list`

### Filters:

* `locationCode` (Alpha-2 ISO)
* `type` → `BASE` or `TOPUP`
* `packageCode`
* `slug`
* `iccid` (for available top-ups)

### Request Example:

```json
{
  "locationCode": "JP",
  "type": "BASE"
}
```

### Response Example:

```json
{
  "success": "true",
  "errorCode": null,
  "obj": {
    "packageList": [
      {
        "packageCode": "JC016",
        "slug": "AU_1_7",
        "name": "Asia 11 countries 1GB 30 Days",
        "price": 10000,
        "currencyCode": "USD",
        "volume": 10485760,
        "duration": 30,
        "durationUnit": "DAY",
        "location": "JP...",
        "speed": "3G/4G",
        "favorite": false,
        "supportTopUpType": 2
      }
    ]
  }
}
```

---

# 4.2 Order Profiles

**POST** `/api/v1/open/esim/order`

### Notes:

* Provide unique `transactionId`
* Provide `packageCode` or `slug`
* Batch ordering supported
* Returns an `orderNo`
* Profiles are allocated asynchronously (use webhook)

### Request Example:

```json
{
  "transactionId": "your_txn_id",
  "amount": 15000,
  "packageInfoList": [
    {
      "packageCode": "JC016",
      "count": 1,
      "price": 15000
    }
  ]
}
```

### Response Example:

```json
{
  "success": "true",
  "obj": {
    "orderNo": "B22102010075311"
  }
}
```

---

# 4.3 Query All Allocated Profiles

**POST** `/api/v1/open/esim/query`

### Query Methods:

* `orderNo`
* `iccid`
* `esimTranNo`
* date range: `startTime`, `endTime`
* Must include `pager`

### Request Example:

```json
{
  "orderNo": "B2210206381924",
  "pager": { "pageNum": 1, "pageSize": 50 }
}
```

### Response — Profile Structure (Important):

```json
{
  "esimTranNo": "22102706381912",
  "orderNo": "B22102706381924",
  "imsi": "454006109846571",
  "iccid": "89852245280000942210",
  "ac": "LPA:1$rsp-eu.redteamobile.com$451F9802E6...",
  "qrCodeUrl": "http://static.redtea.io/...",
  "smdpStatus": "RELEASED",
  "esimStatus": "UNUSED_EXPIRED",
  "packageList": [
    {
      "packageCode": "CKH179",
      "duration": 7,
      "volume": 1073741824,
      "locationCode": "JP"
    }
  ]
}
```

---

# 4.4 Cancel Profile

**POST** `/api/v1/open/esim/cancel`

Refunds unused eSIMs (`GOT_RESOURCE` + `RELEASED`).

### Request Example:

```json
{
  "esimTranNo": "24111319542101"
}
```

---

# 4.5 Suspend Profile

**POST** `/api/v1/open/esim/suspend`

Pause data service.

### Request Example:

```json
{
  "iccid": "89852245280001138065"
}
```

---

# 4.6 Unsuspend Profile

**POST** `/api/v1/open/esim/unsuspend`

### Request Example:

```json
{
  "esimTranNo": "24111319542101"
}
```

---

# 4.7 Revoke Profile

**POST** `/api/v1/open/esim/revoke`

Non-refundable delete.

---

# 4.8 Balance Query

**POST** `/api/v1/open/balance/query`

### Response Example:

```json
{
  "obj": {
    "balance": 100000
  }
}
```

---

# 4.9 Top Up eSIM

**POST** `/api/v1/open/esim/topup`

### Request Example:

```json
{
  "esimTranNo": "24111319542101",
  "packageCode": "TOPUP_JC172",
  "transactionId": "1747191693771_topup_partner7"
}
```

---

# 4.10 Supported Regions

**POST** `/api/v1/open/location/list`

### Response Format (full example):

```json
{
  "success": "true",
  "errorCode": null,
  "errorMessage": null,
  "obj": {
    "locationList": [
      {
        "code": "ES",
        "name": "Spain",
        "type": 1
      },
      {
        "code": "NA-3",
        "name": "North America",
        "type": 2,
        "subLocation": [
          { "code": "US", "name": "United States" },
          { "code": "CA", "name": "Canada" },
          { "code": "MX", "name": "Mexico" }
        ]
      }
    ]
  }
}
```

---

# 4.11 Send SMS to Profile

**POST** `/api/v1/open/esim/sendSms`

### Request Parameters:

| Name         | Type              | Description             |
| ------------ | ----------------- | ----------------------- |
| `iccid`      | String (optional) | ICCID of the eSIM       |
| `esimTranNo` | String (optional) | eSIM transaction number |
| `message`    | String (required) | Up to 500 chars         |

### Request Example:

```json
{
  "esimTranNo": "23072017992029",
  "message": "Your Message!"
}
```

---

# 4.12 Usage Check

**POST** `/api/v1/open/esim/usage/query`

### Request:

```json
{
  "esimTranNoList": ["25030303480009"]
}
```

### Response Structure:

| Field            | Type   | Description                  |
| ---------------- | ------ | ---------------------------- |
| `esimTranNo`     | String | eSIM transaction ID          |
| `dataUsage`      | Long   | Used bytes                   |
| `totalData`      | Long   | Total bytes                  |
| `lastUpdateTime` | String | Timestamp of last usage sync |

### Example:

```json
{
  "success": "true",
  "obj": [
    {
      "esimTranNo": "25030303480009",
      "dataUsage": 1453344832,
      "totalData": 5368709120,
      "lastUpdateTime": "2025-03-19T18:00:00+0000"
    }
  ]
}
```

---

# 4.13 Set Webhook URL

**POST** `/api/v1/open/webhook/save`

### Example:

```json
{ "webhook": "https://your-server.com/webhook-endpoint" }
```

---

# 5. Webhooks

Webhooks are sent to the URL configured in your account or via the API.
All webhook payloads follow:

```json
{
  "notifyType": "TYPE",
  "content": { ... }
}
```

## 5.1 CHECK_HEALTH

Sent immediately after setting a webhook.

```json
{
  "notifyType": "CHECK_HEALTH",
  "content": {
    "orderNo": "1234567890",
    "orderStatus": "Test"
  }
}
```

---

# 5.2 ORDER_STATUS

Sent when an order’s profiles are allocated and ready.

### Example:

```json
{
  "notifyType": "ORDER_STATUS",
  "content": {
    "orderNo": "B23072016497499",
    "orderStatus": "GOT_RESOURCE"
  }
}
```

---

# 5.3 SMDP_EVENT

Real-time SM-DP+ status changes.

### Fields:

| Field        | Description                 |
| ------------ | --------------------------- |
| `eid`        | Device EID                  |
| `iccid`      | eSIM ICCID                  |
| `esimStatus` | High-level status           |
| `smdpStatus` | SM-DP+ server event         |
| `orderNo`    | Order number                |
| `esimTranNo` | eSIM allocation transaction |

### Example:

```json
{
  "notifyType": "SMDP_EVENT",
  "eventGenerateTime": "2025-09-11T13:28:09+0000",
  "notifyId": "5fcc219e32dc484598d3fd700cf3738d",
  "content": {
    "eid": "89049032007108882600137544319616",
    "iccid": "8997250230000292199",
    "esimStatus": "GOT_RESOURCE",
    "smdpStatus": "DOWNLOAD",
    "orderNo": "B25091113270004",
    "esimTranNo": "25091113270004",
    "transactionId": "12068951785848-1-1"
  }
}
```

---

# 5.4 ESIM_STATUS

Sent when a profile’s lifecycle state changes.

### Possible `esimStatus` values:

* `IN_USE`
* `USED_UP`
* `USED_EXPIRED`
* `UNUSED_EXPIRED`
* `CANCEL`
* `REVOKED`
* `GOT_RESOURCE`
* etc.

### Example:

```json
{
  "notifyType": "ESIM_STATUS",
  "eventGenerateTime": "2025-08-09T00:23:45Z",
  "notifyId": "4038b3dfb1b050bf9f02501df67284f3",
  "content": {
    "orderNo": "B25080823490018",
    "esimTranNo": "25080323490020",
    "transactionId": "e23111e4d07746889c7bce41cf3f1b16",
    "iccid": "89852000263413436720",
    "esimStatus": "CANCEL",
    "smdpStatus": "RELEASED"
  }
}
```

---

# 5.5 DATA_USAGE

Triggered at 50%, 80%, and 90% usage thresholds.

### Example:

```json
{
  "notifyType": "DATA_USAGE",
  "eventGenerateTime": "2025-07-21T10:57:28Z",
  "notifyId": "f776267e8d6745db8cc316e4c146ea0c",
  "content": {
    "orderNo": "B25052822150009",
    "transactionId": "unique_id_from_partner",
    "esimTranNo": "25052822150009",
    "iccid": "8943108170001029631",
    "totalVolume": 53687091200,
    "orderUsage": 48335585458,
    "remain": 5351505742,
    "lastUpdateTime": "2025-07-21T09:38:25Z",
    "remainThreshold": 0.1
  }
}
```

---

# 5.6 VALIDITY_USAGE

Sent when `remain = 1 DAY` before expiry.

### Example:

```json
{
  "notifyType": "VALIDITY_USAGE",
  "content": {
    "orderNo": "B23072016497499",
    "transactionId": "Your_txn_id",
    "iccid": "894310817000000003",
    "durationUnit": "DAY",
    "totalDuration": 30,
    "expiredTime": "2024-01-11T08:10:19Z",
    "remain": 1
  }
}
```

---

# 6. IP Whitelist

Recommended sender IPs:

```
3.1.131.226
54.254.74.88
18.136.190.97
18.136.60.197
18.136.19.137
```

---

# END OF DOCUMENT
