# Quick Deployment Checklist

## 🚀 Fastest Path to Production

### Prerequisites
- [ ] Domain purchased and DNS access
- [ ] GitHub repository with your code
- [ ] Stripe account (live mode keys ready)
- [ ] Clerk account (production keys ready)
- [ ] Resend account (domain verified)

---

## Step 1: Deploy Backend (Render or Railway) - 15 minutes

### Option A: Using Render (Recommended Alternative)

1. **Go to [render.com](https://render.com)** → Sign up with GitHub

2. **Create PostgreSQL Database**
   - Dashboard → "New +" → "PostgreSQL"
   - Name: `voyage-db`
   - Plan: Free (or Starter for production)
   - Click "Create Database"
   - Copy the **Internal Database URL** (starts with `postgresql://...`)

3. **Create Redis**
   - Dashboard → "New +" → "Redis"
   - Name: `voyage-redis`
   - Plan: Free (or Starter)
   - Click "Create Redis"
   - Copy the **Internal Redis URL** (starts with `redis://...`)

4. **Deploy Backend Service**
   - Dashboard → "New +" → "Web Service"
   - Connect your Voyage GitHub repository
   - Settings:
     - **Name**: `voyage-backend`
     - **Root Directory**: `apps/backend`
     - **Environment**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm run start:prod`
     - **Plan**: Free (or Starter for production)

5. **Add Environment Variables** (in Render → Environment tab):
   ```
   DATABASE_URL=<from-postgres-internal-url>
   REDIS_URL=<from-redis-internal-url>
   PORT=3001
   NODE_ENV=production
   
   WEB_URL=https://yourdomain.com
   APP_URL=https://yourdomain.com
   WEBHOOK_URL=https://voyage-backend.onrender.com/api/webhooks/esim
   
   ESIM_ACCESS_CODE=your_code
   ESIM_SECRET_KEY=your_key
   ESIM_API_BASE=https://api.esimaccess.com/api/v1/open
   
   STRIPE_SECRET=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   ADMIN_EMAILS=you@email.com
   NEXT_PUBLIC_ADMIN_EMAILS=you@email.com
   
   RESEND_API_KEY=re_...
   EMAIL_FROM=noreply@yourdomain.com
   
   EXCHANGE_RATE_API_KEY=your_key
   ```

6. **Get Backend URL**
   - Render gives you: `https://voyage-backend.onrender.com`
   - Copy this as `NEXT_PUBLIC_API_URL`

---

### Option B: Using Railway

1. **Go to [railway.app](https://railway.app)** → Sign up with GitHub

2. **Create PostgreSQL Database**
   - Click "+ New" → "Database" → "PostgreSQL"
   - Copy the `DATABASE_URL` (starts with `postgresql://...`)

3. **Create Redis**
   - Click "+ New" → "Database" → "Redis"
   - Copy the `REDIS_URL`

4. **Deploy Backend Service**
   - Click "+ New" → "GitHub Repo" → Select Voyage repo
   - Set **Root Directory**: `apps/backend`
   - Railway auto-detects NestJS

5. **Add Environment Variables** (in Railway → Variables tab):
   ```
   DATABASE_URL=<from-postgres>
   REDIS_URL=<from-redis>
   PORT=3001
   NODE_ENV=production
   
   WEB_URL=https://yourdomain.com
   APP_URL=https://yourdomain.com
   WEBHOOK_URL=https://your-backend.railway.app/api/webhooks/esim
   
   ESIM_ACCESS_CODE=your_code
   ESIM_SECRET_KEY=your_key
   ESIM_API_BASE=https://api.esimaccess.com/api/v1/open
   
   STRIPE_SECRET=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   ADMIN_EMAILS=you@email.com
   NEXT_PUBLIC_ADMIN_EMAILS=you@email.com
   
   RESEND_API_KEY=re_...
   EMAIL_FROM=noreply@yourdomain.com
   
   EXCHANGE_RATE_API_KEY=your_key
   ```

6. **Get Backend URL**
   - Railway gives you: `https://your-project.railway.app`
   - Copy this as `NEXT_PUBLIC_API_URL`

---

## Step 2: Deploy Frontend - 10 minutes

### Option A: Deploy to Render (Recommended - Both on Render)

1. **Render Dashboard → "New +" → "Web Service"**

2. **Connect Repository:**
   - Select your Voyage GitHub repository
   - Click "Connect"

3. **Configure Frontend Service:**
   - **Name**: `voyage-frontend`
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: Starter ($7/month) - recommended

4. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://voyage-backend.onrender.com/api
   
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   
   NEXT_PUBLIC_ADMIN_EMAILS=youremail@gmail.com
   NEXT_PUBLIC_WEB_URL=https://voyage-data.com
   
   NODE_ENV=production
   ```

5. Click **"Create Web Service"**
   - Wait for deployment (~5-10 minutes)
   - Frontend URL: `https://voyage-frontend.onrender.com`

---

### Option B: Deploy to Vercel (Alternative)

1. **Go to [vercel.com](https://vercel.com)** → Sign up with GitHub

2. **Import Repository**
   - "Add New Project" → Import Voyage repo
   - Set **Root Directory**: `apps/web`
   - Framework: Next.js (auto-detected)

3. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://voyage-backend.onrender.com/api
   
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   
   NEXT_PUBLIC_ADMIN_EMAILS=youremail@gmail.com
   NEXT_PUBLIC_WEB_URL=https://voyage-data.com
   ```

4. **Connect Domain**
   - Project Settings → Domains → Add `voyage-data.com`
   - Vercel shows DNS records to add at Cloudflare

---

## Step 3: Configure DNS (Cloudflare) - 5 minutes

**Your domain is on Cloudflare!** Here's how to configure it:

### If Using Render for Frontend:

1. **In Render:** Go to Frontend Service → Settings → Custom Domains
2. **Add domain:** `voyage-data.com`
3. **Render shows DNS records** - Add these in Cloudflare:

**In Cloudflare Dashboard:**
- Go to your domain `voyage-data.com`
- DNS → Records → Add record

**Add CNAME record:**
- Type: `CNAME`
- Name: `@` (or leave blank for root domain)
- Target: `voyage-frontend.onrender.com`
- ✅ **Proxy** enabled (orange cloud icon)
- TTL: Auto

**Note:** If Cloudflare doesn't allow CNAME on root, use A record:
- Type: `A`
- Name: `@`
- IPv4 address: `76.76.21.21` (check Render docs for latest IP)
- Proxy enabled

**For www subdomain (optional):**
- Type: `CNAME`
- Name: `www`
- Target: `voyage-frontend.onrender.com`
- ✅ **Proxy** enabled

### If Using Vercel for Frontend:

**In Cloudflare:**
- Type: `CNAME`
- Name: `@`
- Target: `cname.vercel-dns.com`
- ✅ **Proxy** enabled (orange cloud icon)

**Wait 5-30 minutes** for DNS propagation. Render/Vercel will automatically provision SSL certificates.

---

## 🌐 Cloudflare SSL/TLS Settings

After adding DNS records:

1. Go to **SSL/TLS** tab in Cloudflare
2. Set encryption mode to **"Full"** or **"Full (strict)"**
3. This ensures HTTPS works correctly with Render/Vercel

**Enable Automatic HTTPS Rewrites** (optional):
- SSL/TLS → Edge Certificates → Always Use HTTPS → On

---

## Step 4: Run Database Migrations - 5 minutes

**Option A: Using Prisma CLI locally**
```bash
# Update .env with Railway DATABASE_URL
DATABASE_URL=postgresql://postgres:password@host:port/railway

# Run migrations
npx prisma migrate deploy
```

**Option B: Using Render Console**
1. Render Dashboard → PostgreSQL service → "Connect"
2. Copy connection details
3. Use `psql` or any PostgreSQL client to connect and run migrations

**Option C: Using Railway Console** (if using Railway)
1. Railway → PostgreSQL → "Connect" → "Query"
2. Copy SQL from `prisma/migrations/*/migration.sql`
3. Run in Railway's SQL console

---

## Step 5: Configure Stripe Webhooks - 5 minutes

1. Stripe Dashboard → Webhooks → "Add endpoint"
2. URL: `https://voyage-backend.onrender.com/api/webhooks/stripe`
   # OR if using Railway: https://your-project.railway.app/api/webhooks/stripe
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `charge.succeeded`
4. Copy webhook secret → Update `STRIPE_WEBHOOK_SECRET` in Render/Railway

---

## Step 6: Verify Everything Works

- [ ] Frontend loads at `https://yourdomain.com`
- [ ] Backend API responds at `https://voyage-backend.onrender.com/api/countries` (or Railway URL)
- [ ] Can sign in with Clerk
- [ ] Admin panel accessible (with admin email)
- [ ] Test purchase flow (in Stripe test mode first!)

---

## 🎯 Total Time: ~40 minutes

---

## 💡 Pro Tips

1. **Start with Stripe test mode** - test everything before going live
2. **Use Render/Railway metrics** to monitor backend performance
3. **Set up Vercel analytics** to track frontend performance
4. **Backup your database** regularly (Render/Railway have automatic backups on paid plans)
5. **Monitor logs** in Render/Railway and Vercel dashboards
6. **Render free tier**: Services spin down after 15 min inactivity (first request takes ~30s)

---

## 🆘 Need Help?

- Render Docs: https://render.com/docs
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Check deployment logs in both platforms for errors
