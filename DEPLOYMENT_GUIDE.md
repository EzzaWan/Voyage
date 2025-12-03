# Voyage Deployment Guide

Complete guide to deploy Voyage eSIM marketplace to your domain.

## 🎯 Deployment Architecture

**Recommended Setup:**
- **Frontend (Next.js)**: Vercel
- **Backend (NestJS)**: Railway or Render
- **Database (PostgreSQL)**: Railway/Render (included) or Neon
- **Redis**: Railway/Render (included) or Upstash
- **Domain**: Your purchased domain

**Alternative: Full VPS** (DigitalOcean, AWS, Hetzner, etc.)

---

## 📋 Option 1: Vercel + Render (Recommended)

**See detailed guide**: `RENDER_DEPLOYMENT.md`

### Quick Overview:

1. **Create PostgreSQL Database** on Render
   - Dashboard → "New +" → "PostgreSQL"
   - Copy Internal Database URL

2. **Create Redis** on Render
   - Dashboard → "New +" → "Redis"
   - Copy Internal Redis URL

3. **Deploy Backend Web Service**
   - Dashboard → "New +" → "Web Service"
   - Connect GitHub repo
   - Root Directory: `apps/backend`
   - Build: `npm install && npm run build`
   - Start: `npm run start:prod`
   - Add all environment variables (see below)

4. **Get Backend URL**: `https://voyage-backend.onrender.com`

5. **Run Migrations**: Use Prisma CLI with Render database URL

**Environment Variables for Render:**
```bash
DATABASE_URL=<internal-postgres-url-from-render>
REDIS_URL=<internal-redis-url-from-render>
PORT=3001
NODE_ENV=production
WEB_URL=https://yourdomain.com
APP_URL=https://yourdomain.com
WEBHOOK_URL=https://voyage-backend.onrender.com/api/webhooks/esim
# ... (all other variables from env.example)
```

---

## 📋 Option 2: Vercel + Railway (Alternative)

### Step 1: Set Up Database & Redis

**A) Create Railway Account**
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create a new project

**B) Add PostgreSQL**
1. Click "+ New" → "Database" → "PostgreSQL"
2. Railway will create a database with connection string
3. Copy the `DATABASE_URL` from the PostgreSQL service

**C) Add Redis**
1. Click "+ New" → "Database" → "Redis"
2. Copy the `REDIS_URL` connection string

---

### Step 2: Deploy Backend to Railway

**A) Prepare Backend**
1. In Railway dashboard, click "+ New" → "GitHub Repo"
2. Select your Voyage repository
3. Railway will detect it's a monorepo

**B) Configure Backend Service**
1. Set **Root Directory**: `apps/backend`
2. Set **Start Command**: `npm run start:prod` (or create build script)
3. Set **Build Command**: `npm install && npm run build`

**C) Add Environment Variables**
Add all these in Railway's "Variables" tab:

```bash
# Database
DATABASE_URL=<from-postgres-service>

# Redis
REDIS_URL=<from-redis-service>

# eSIM Access API
ESIM_ACCESS_CODE=your_access_code
ESIM_SECRET_KEY=your_secret_key
ESIM_API_BASE=https://api.esimaccess.com/api/v1/open

# Stripe
STRIPE_SECRET=sk_live_...  # Use LIVE keys for production
STRIPE_WEBHOOK_SECRET=whsec_...

# App URLs (UPDATE WITH YOUR DOMAIN)
WEB_URL=https://yourdomain.com
APP_URL=https://yourdomain.com
WEBHOOK_URL=https://api.yourdomain.com/api/webhooks/esim  # Or use backend URL

# Admin
ADMIN_EMAILS=your@email.com,admin@email.com
NEXT_PUBLIC_ADMIN_EMAILS=your@email.com,admin@email.com

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com  # Must be verified in Resend

# Currency API
EXCHANGE_RATE_API_KEY=your_key

# Node Environment
NODE_ENV=production
PORT=3001
```

**D) Get Backend URL**
- Railway will give you a URL like: `https://your-backend.railway.app`
- Copy this - you'll use it as `NEXT_PUBLIC_API_URL`

---

### Step 3: Deploy Frontend to Vercel

**A) Connect Repository**
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Add New Project"
4. Import your Voyage repository

**B) Configure Project**
1. **Root Directory**: `apps/web`
2. **Framework Preset**: Next.js (auto-detected)
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next`

**C) Add Environment Variables**
In Vercel project settings → Environment Variables:

```bash
# API URL (your Railway backend)
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Admin Emails
NEXT_PUBLIC_ADMIN_EMAILS=your@email.com,admin@email.com

# Domain (for referral links)
NEXT_PUBLIC_WEB_URL=https://yourdomain.com
```

**D) Connect Your Domain**
1. In Vercel project → Settings → Domains
2. Add your domain: `yourdomain.com`
3. Vercel will provide DNS records to add to your domain registrar
4. Add the DNS records (A record or CNAME) in your domain provider

---

### Step 4: Configure Domain DNS

**At Your Domain Registrar** (Cloudflare, Namecheap, etc.):

**For Vercel:**
- Type: `CNAME`
- Name: `@` (or root domain)
- Value: `cname.vercel-dns.com`

OR

- Type: `A`
- Name: `@`
- Value: `76.76.21.21` (Vercel's IP)

**For Backend Subdomain** (optional, if you want api.yourdomain.com):
- Type: `CNAME`
- Name: `api`
- Value: `your-backend.railway.app`

Wait 5-30 minutes for DNS propagation.

---

### Step 5: Update Stripe Webhooks

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Webhooks
2. Add endpoint: `https://your-backend.railway.app/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `charge.succeeded`
4. Copy the webhook secret → Update `STRIPE_WEBHOOK_SECRET` in Railway

---

### Step 6: Run Database Migrations

**On your local machine:**
```bash
# Update DATABASE_URL in .env to point to Railway database
DATABASE_URL=postgresql://postgres:password@railway-host:5432/railway

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

**OR use Railway's console:**
1. Open Railway → PostgreSQL service
2. Click "Connect" → "Query"
3. Run migrations manually (copy from `prisma/migrations/*/migration.sql`)

---

### Step 7: Update CORS in Backend

Update `apps/backend/src/main.ts`:

```typescript
app.enableCors({
  origin: [
    'http://localhost:3000',
    'https://yourdomain.com',
    'https://www.yourdomain.com',
  ],
  credentials: true,
});
```

Redeploy backend after this change.

---

## 📋 Option 2: Full VPS Deployment (DigitalOcean, AWS, etc.)

### Step 1: Set Up VPS

1. Create a VPS (recommended: 2GB RAM minimum)
2. Install Docker & Docker Compose
3. SSH into your server

### Step 2: Clone Repository

```bash
git clone https://github.com/yourusername/Voyage.git
cd Voyage
```

### Step 3: Update docker-compose.yml

Add your backend and frontend services to docker-compose.yml.

### Step 4: Set Up Environment Variables

Create `.env` file with all production values.

### Step 5: Configure Nginx

Set up reverse proxy for domain → backend and frontend.

### Step 6: Set Up SSL

Use Certbot (Let's Encrypt) for free SSL certificates.

---

## 🔧 Important Configuration Updates

### 1. Update Backend Port & CORS

Ensure backend listens on correct port and allows your domain.

### 2. Update Clerk Production Keys

1. Go to Clerk Dashboard → API Keys
2. Switch to "Production" environment
3. Copy keys to Vercel environment variables

### 3. Update Stripe Production Keys

1. Switch Stripe to "Live Mode"
2. Get live API keys
3. Update in Railway environment variables

### 4. Verify Resend Domain

1. Go to Resend Dashboard
2. Add and verify your domain
3. Update `EMAIL_FROM` to use verified domain

---

## ✅ Post-Deployment Checklist

- [ ] Database migrations run successfully
- [ ] Backend API accessible at `https://api.yourdomain.com/api` (or Railway URL)
- [ ] Frontend accessible at `https://yourdomain.com`
- [ ] Stripe webhooks configured and tested
- [ ] Clerk authentication working
- [ ] Email sending working (test with Resend)
- [ ] Admin panel accessible with admin email
- [ ] SSL certificates active (HTTPS)
- [ ] All environment variables set correctly
- [ ] Test purchase flow end-to-end

---

## 🐛 Troubleshooting

**Backend not accessible:**
- Check Railway deployment logs
- Verify CORS settings
- Check environment variables

**Frontend can't connect to backend:**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS allows your frontend domain
- Test backend URL directly in browser

**Database connection errors:**
- Verify `DATABASE_URL` format
- Check Railway PostgreSQL service is running
- Run migrations: `npx prisma migrate deploy`

**Stripe webhooks failing:**
- Verify webhook URL is correct
- Check webhook secret matches
- View webhook logs in Stripe dashboard

---

## 📚 Additional Resources

- [Vercel Deployment Docs](https://vercel.com/docs)
- [Railway Deployment Docs](https://docs.railway.app)
- [Clerk Production Guide](https://clerk.com/docs)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)

---

## 💰 Estimated Costs

- **Vercel**: Free tier (hobby) or $20/month (pro)
- **Railway**: ~$5-20/month (depends on usage)
- **Domain**: $10-15/year
- **Stripe**: 2.9% + $0.30 per transaction
- **Resend**: Free tier (3,000 emails/month)

**Total**: ~$25-40/month for hosting
