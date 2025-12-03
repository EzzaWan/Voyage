# Deployment Guide: Railway + Vercel

Quick deployment guide for Voyage eSIM marketplace.

## 🚀 Railway (Backend + PostgreSQL)

### Step 1: Create PostgreSQL Database
1. Go to [Railway Dashboard](https://railway.app)
2. Create new project
3. Click "New" → "Database" → "Add PostgreSQL"
4. Wait for it to provision
5. Go to PostgreSQL service → "Variables" tab
6. Copy the `DATABASE_URL` (you'll need this)

### Step 2: Create Backend Web Service
1. In same Railway project, click "New" → "GitHub Repo"
2. Connect your Voyage repository
3. Railway will detect it - click "Add Service"
4. In service settings, set:
   - **Root Directory**: `.` (repo root)
   - **Build Command**: `npm install && npx prisma generate --schema=prisma/schema.prisma && cd apps/backend && npm run build`
   - **Start Command**: `cd apps/backend && npm run start:prod`
5. Go to "Variables" tab and add these:

```env
DATABASE_URL=<paste from Postgres service>
PORT=3001
CLIENT_URL=https://your-app.vercel.app
WEB_URL=https://your-app.vercel.app
CLERK_SECRET_KEY=sk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
ESIM_ACCESS_API_KEY=your_key
ESIM_ACCESS_SECRET=your_secret
RESEND_API_KEY=re_...
EXCHANGE_RATE_API_KEY=your_key
ADMIN_EMAILS=your-email@gmail.com
REDIS_URL=redis://... (optional)
```

6. Go to "Settings" → "Generate Domain" to get your backend URL
7. Copy the URL (e.g., `https://voyage-backend.up.railway.app`)

---

## 🎨 Vercel (Frontend)

### Step 1: Import Project
1. Go to [Vercel Dashboard](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your Voyage GitHub repository
4. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build` (auto)
   - **Output Directory**: `.next` (auto)
   - **Install Command**: `npm install` (auto)

### Step 2: Environment Variables
Add these in Vercel project settings → "Environment Variables":

```env
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_ADMIN_EMAILS=your-email@gmail.com
NEXT_PUBLIC_WEB_URL=https://your-app.vercel.app
```

### Step 3: Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Copy your Vercel URL (e.g., `https://voyage-app.vercel.app`)
4. **Important**: Update Railway backend env var `CLIENT_URL` and `WEB_URL` with your Vercel URL
5. Restart Railway backend service

---

## 📦 Post-Deployment Setup

### 1. Run Database Migrations
Connect to Railway PostgreSQL and run:

```bash
# Option A: Using Railway CLI
railway connect
npx prisma migrate deploy --schema=prisma/schema.prisma

# Option B: Get connection string from Railway
# Copy DATABASE_URL and run locally:
DATABASE_URL="postgresql://..." npx prisma migrate deploy --schema=prisma/schema.prisma
```

### 2. Configure Stripe Webhook
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-backend.up.railway.app/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `charge.succeeded`
4. Copy webhook signing secret to Railway `STRIPE_WEBHOOK_SECRET`

### 3. Update Clerk
In Clerk Dashboard → Settings → Domains:
- Add your Vercel domain
- Update allowed origins

---

## ✅ Quick Checklist

- [ ] PostgreSQL created on Railway
- [ ] Backend service deployed on Railway
- [ ] All environment variables set in Railway
- [ ] Frontend deployed on Vercel
- [ ] All environment variables set in Vercel
- [ ] Database migrations run
- [ ] Stripe webhook configured
- [ ] Clerk domains updated
- [ ] Railway `CLIENT_URL` updated with Vercel URL

---

## 🔧 Troubleshooting

**Backend won't start?**
- Check Railway logs
- Verify `DATABASE_URL` is correct
- Make sure `PORT=3001` is set

**Frontend can't connect to backend?**
- Verify `NEXT_PUBLIC_API_URL` points to Railway backend
- Check Railway backend is running
- Verify CORS settings in backend

**Database connection failed?**
- Check `DATABASE_URL` format
- Verify PostgreSQL is running on Railway
- Run migrations: `npx prisma migrate deploy`

---

## 📝 Environment Variable Reference

### Railway (Backend)
- `DATABASE_URL` - From PostgreSQL service
- `PORT` - Set to 3001
- `CLIENT_URL` - Your Vercel frontend URL
- `WEB_URL` - Your Vercel frontend URL
- `CLERK_SECRET_KEY` - From Clerk dashboard
- `STRIPE_SECRET_KEY` - From Stripe dashboard
- `STRIPE_WEBHOOK_SECRET` - From Stripe webhook
- `ESIM_ACCESS_API_KEY` - Your eSIM provider key
- `ESIM_ACCESS_SECRET` - Your eSIM provider secret
- `RESEND_API_KEY` - From Resend dashboard
- `EXCHANGE_RATE_API_KEY` - From exchange rate API
- `ADMIN_EMAILS` - Comma-separated admin emails

### Vercel (Frontend)
- `NEXT_PUBLIC_API_URL` - Railway backend URL + `/api`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - From Clerk dashboard
- `CLERK_SECRET_KEY` - From Clerk dashboard
- `NEXT_PUBLIC_ADMIN_EMAILS` - Comma-separated admin emails
- `NEXT_PUBLIC_WEB_URL` - Your Vercel app URL

---

**Done!** Your app should now be live. 🎉

