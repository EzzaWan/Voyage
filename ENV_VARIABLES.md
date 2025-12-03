# Environment Variables Reference

## 🔧 Backend (Railway)

Copy these exactly into Railway backend service variables:

```env
# Database (from Railway PostgreSQL service)
DATABASE_URL=postgresql://postgres:password@host:port/database?sslmode=require

# Server
PORT=3001

# URLs
CLIENT_URL=https://your-app.vercel.app
WEB_URL=https://your-app.vercel.app

# Clerk Authentication
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx

# Stripe Payments
STRIPE_SECRET=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# eSIM Access Provider
ESIM_ACCESS_CODE=your_access_code_here
ESIM_SECRET_KEY=your_secret_key_here
ESIM_API_BASE=https://api.esimaccess.com/api/v1/open

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=no-reply@yourdomain.com

# Currency Conversion
EXCHANGE_RATE_API_KEY=your_api_key_here

# Admin Access (comma-separated emails)
ADMIN_EMAILS=admin@example.com,admin2@example.com

# Redis (optional)
REDIS_URL=redis://default:password@host:port
```

---

## 🎨 Frontend (Vercel)

Copy these exactly into Vercel project environment variables:

```env
# API URL (Railway backend)
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx

# Admin Access (comma-separated emails)
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com,admin2@example.com

# App URL
NEXT_PUBLIC_WEB_URL=https://your-app.vercel.app
```

---

## 📋 Variable Explanations

### Backend Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string from Railway | `postgresql://...` |
| `PORT` | ✅ | Backend server port | `3001` |
| `CLIENT_URL` | ✅ | Frontend URL (Vercel) | `https://app.vercel.app` |
| `WEB_URL` | ✅ | Frontend URL (Vercel) | `https://app.vercel.app` |
| `CLERK_SECRET_KEY` | ✅ | Clerk backend secret key | `sk_live_...` |
| `STRIPE_SECRET` | ✅ | Stripe secret key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Stripe webhook signing secret | `whsec_...` |
| `ESIM_ACCESS_CODE` | ✅ | eSIM provider access code | Your code |
| `ESIM_SECRET_KEY` | ✅ | eSIM provider secret key | Your key |
| `ESIM_API_BASE` | ✅ | eSIM provider API base URL | `https://api.esimaccess.com/api/v1/open` |
| `RESEND_API_KEY` | ✅ | Resend email API key | `re_...` |
| `EMAIL_FROM` | ⚠️ | Default sender email | `no-reply@yourdomain.com` |
| `EXCHANGE_RATE_API_KEY` | ⚠️ | Exchange rate API key | Your key |
| `ADMIN_EMAILS` | ✅ | Comma-separated admin emails | `admin@example.com` |
| `REDIS_URL` | ❌ | Redis connection string (optional) | `redis://...` |

### Frontend Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | ✅ | Railway backend API URL | `https://backend.up.railway.app/api` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key | `pk_live_...` |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key | `sk_live_...` |
| `NEXT_PUBLIC_ADMIN_EMAILS` | ✅ | Comma-separated admin emails | `admin@example.com` |
| `NEXT_PUBLIC_WEB_URL` | ✅ | Your Vercel app URL | `https://app.vercel.app` |

---

## ⚠️ Important Notes

1. **No spaces** around the `=` sign
2. **No quotes** needed (Railway/Vercel auto-handles them)
3. **Comma-separated** for `ADMIN_EMAILS`: `email1@example.com,email2@example.com`
4. **URLs must include** `https://` protocol
5. **NEXT_PUBLIC_** prefix required for frontend variables that need to be exposed to browser
6. **DATABASE_URL** format: Railway PostgreSQL provides this automatically - copy it exactly
7. **STRIPE_WEBHOOK_SECRET**: Get this after creating webhook endpoint in Stripe dashboard

---

## 🔍 Where to Get Values

- **DATABASE_URL**: Railway PostgreSQL service → Variables tab
- **CLERK_SECRET_KEY**: [Clerk Dashboard](https://dashboard.clerk.com) → API Keys
- **CLERK_PUBLISHABLE_KEY**: [Clerk Dashboard](https://dashboard.clerk.com) → API Keys
- **STRIPE_SECRET**: [Stripe Dashboard](https://dashboard.stripe.com) → Developers → API keys
- **STRIPE_WEBHOOK_SECRET**: [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks → Your endpoint → Signing secret
- **RESEND_API_KEY**: [Resend Dashboard](https://resend.com/api-keys)
- **EXCHANGE_RATE_API_KEY**: [ExchangeRate-API](https://www.exchangerate-api.com/)
- **ESIM_ACCESS_CODE & ESIM_SECRET_KEY**: From your eSIM provider

---

## ✅ Quick Copy-Paste Templates

### Railway Backend (Production)
```env
DATABASE_URL=
PORT=3001
CLIENT_URL=
WEB_URL=
CLERK_SECRET_KEY=
STRIPE_SECRET=
STRIPE_WEBHOOK_SECRET=
ESIM_ACCESS_CODE=
ESIM_SECRET_KEY=
ESIM_API_BASE=https://api.esimaccess.com/api/v1/open
RESEND_API_KEY=
EMAIL_FROM=no-reply@yourdomain.com
EXCHANGE_RATE_API_KEY=
ADMIN_EMAILS=
```

### Vercel Frontend (Production)
```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_ADMIN_EMAILS=
NEXT_PUBLIC_WEB_URL=
```

