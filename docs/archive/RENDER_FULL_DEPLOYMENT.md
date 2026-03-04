# Full Render Deployment Guide - Frontend + Backend

Complete guide to deploy both Voyage frontend and backend to Render with your Cloudflare domain.

---

## 🎯 Architecture

- **Frontend (Next.js)**: Render Web Service
- **Backend (NestJS)**: Render Web Service  
- **Database**: Render PostgreSQL
- **Redis**: Render Redis
- **Domain**: `voyage-data.com` (Cloudflare)

---

## 📋 Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Authorize Render to access your repositories

---

## 📋 Step 2: Create PostgreSQL Database

1. Render Dashboard → **"New +"** → **"PostgreSQL"**

2. Configuration:
   - **Name**: `voyage-db`
   - **Database**: `voyage`
   - **Region**: Choose closest to your users
   - **PostgreSQL Version**: 18 (latest available on Render) or 15-17 (all work fine)
   - **Plan**: Starter ($7/month) or Free (90 days, then $7/month)

3. Click **"Create Database"**

4. Wait for provisioning (~2 minutes)

5. **Copy Connection Details**:
   - Go to Database → **"Connect"** tab
   - Copy the **Internal Database URL**: `postgresql://user:pass@host:port/dbname`
   - Save this as `DATABASE_URL`

---

## 📋 Step 3: Create Redis Instance

1. Render Dashboard → **"New +"** → **"Redis"**

2. Configuration:
   - **Name**: `voyage-redis`
   - **Region**: Same as database
   - **Plan**: Free (for testing) or Starter ($10/month for production)

3. Click **"Create Redis"**

4. Wait for provisioning (~1 minute)

5. **Copy Connection Details**:
   - Go to Redis → **"Connect"** tab
   - Copy the **Internal Redis URL**: `redis://:password@host:port`
   - Save this as `REDIS_URL`

---

## 📋 Step 4: Deploy Backend Service

1. Render Dashboard → **"New +"** → **"Web Service"**

2. **Connect Repository:**
   - Choose **"Build and deploy from a Git repository"**
   - Select your Voyage GitHub repository
   - Click **"Connect"**

3. **Configure Backend Service:**
   - **Name**: `voyage-backend`
   - **Region**: Same as database/Redis
   - **Branch**: `main`
   - **Root Directory**: `apps/backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   
   **Important:** The build script uses `npx nest build` to find the local NestJS CLI from node_modules. Make sure devDependencies are installed (Render installs them by default during build).
   - **Plan**: Starter ($7/month) - recommended for production

4. **Add Environment Variables:**
   ```
   # Database
   DATABASE_URL=<internal-postgres-url-from-step-2>
   
   # Redis
   REDIS_URL=<internal-redis-url-from-step-3>
   
   # Server
   PORT=3001
   NODE_ENV=production
   
   # App URLs
   WEB_URL=https://voyage-data.com
   APP_URL=https://voyage-data.com
   WEBHOOK_URL=https://voyage-backend.onrender.com/api/webhooks/esim
   
   # eSIM Access API
   ESIM_ACCESS_CODE=your_access_code
   ESIM_SECRET_KEY=your_secret_key
   ESIM_API_BASE=https://api.esimaccess.com/api/v1/open
   
   # Stripe (LIVE keys for production)
   STRIPE_SECRET=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   # Admin
   ADMIN_EMAILS=youremail@gmail.com
   NEXT_PUBLIC_ADMIN_EMAILS=youremail@gmail.com
   
   # Email (Resend)
   RESEND_API_KEY=re_...
   EMAIL_FROM=noreply@voyage-data.com
   
   # Currency API
   EXCHANGE_RATE_API_KEY=your_key
   ```

5. Click **"Create Web Service"**

6. Wait for deployment (~5-10 minutes)

7. **Get Backend URL:**
   - Render gives you: `https://voyage-backend.onrender.com`
   - You can also set custom domain: `api.voyage-data.com` (optional)

---

## 📋 Step 5: Deploy Frontend Service

1. Render Dashboard → **"New +"** → **"Web Service"**

2. **Connect Repository:**
   - Select the same Voyage GitHub repository
   - Click **"Connect"**

3. **Configure Frontend Service:**
   - **Name**: `voyage-frontend`
   - **Region**: Same as other services
   - **Branch**: `main`
   - **Root Directory**: `apps/web`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: Starter ($7/month) - recommended

4. **Add Environment Variables:**
   ```
   # API URL (point to backend)
   NEXT_PUBLIC_API_URL=https://voyage-backend.onrender.com/api
   
   # Clerk Authentication (PRODUCTION keys)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   
   # Domain
   NEXT_PUBLIC_WEB_URL=https://voyage-data.com
   
   # Admin
   NEXT_PUBLIC_ADMIN_EMAILS=youremail@gmail.com
   
   # Node Environment
   NODE_ENV=production
   ```

5. Click **"Create Web Service"**

6. Wait for deployment (~5-10 minutes)

7. **Get Frontend URL:**
   - Render gives you: `https://voyage-frontend.onrender.com`
   - We'll connect your domain in next step

---

## 📋 Step 6: Connect Your Domain (Cloudflare)

### For Frontend (voyage-data.com)

1. In Render → Frontend Web Service → **"Settings"** tab

2. Scroll to **"Custom Domains"** section

3. Click **"Add Custom Domain"**

4. Enter: `voyage-data.com`

5. Render will show DNS records to add:

   **Option 1: CNAME (Recommended)**
   - Type: `CNAME`
   - Name: `@`
   - Value: `voyage-frontend.onrender.com`
   - Proxy: ✅ Enabled (orange cloud)

   **Option 2: A Record (Alternative)**
   - Type: `A`
   - Name: `@`
   - Value: `76.76.21.21` (Render's IP - check Render docs for latest)

6. **Add DNS Record in Cloudflare:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Select your domain `voyage-data.com`
   - Go to **DNS** → **Records**
   - Click **"Add record"**
   - Add the CNAME record shown by Render
   - ✅ **Enable Proxy** (orange cloud) for SSL

7. **Wait for DNS Propagation** (5-30 minutes)

8. **SSL Certificate:**
   - Render automatically provisions SSL certificate
   - Takes 5-10 minutes after DNS propagates
   - Check status in Render → Custom Domains section

### For www Subdomain (Optional)

1. In Render → Frontend → Custom Domains
2. Add: `www.voyage-data.com`
3. In Cloudflare, add:
   - Type: `CNAME`
   - Name: `www`
   - Value: `voyage-frontend.onrender.com`
   - Proxy: ✅ Enabled

### For Backend Subdomain (Optional - api.voyage-data.com)

1. In Render → Backend → **"Settings"** → **"Custom Domains"**
2. Add: `api.voyage-data.com`
3. In Cloudflare, add:
   - Type: `CNAME`
   - Name: `api`
   - Value: `voyage-backend.onrender.com`
   - Proxy: ✅ Enabled

4. Update environment variables:
   - In Backend: Update `WEBHOOK_URL` to `https://api.voyage-data.com/api/webhooks/esim`
   - In Frontend: Update `NEXT_PUBLIC_API_URL` to `https://api.voyage-data.com/api`

---

## 📋 Step 7: Configure Cloudflare Settings

### SSL/TLS Settings

1. Cloudflare Dashboard → SSL/TLS
2. Set to **"Full"** or **"Full (strict)"** mode
3. This ensures HTTPS works correctly with Render

### DNS Settings

1. Make sure **Proxy** (orange cloud) is enabled on all CNAME records
2. This enables Cloudflare's CDN and DDoS protection

### Page Rules (Optional)

Create a redirect from `http://` to `https://`:
- URL: `http://voyage-data.com/*`
- Setting: Always Use HTTPS → On

---

## 📋 Step 8: Run Database Migrations

**Option A: Using Prisma CLI locally** (Recommended)

1. Create temporary `.env`:
   ```bash
   DATABASE_URL=postgresql://user:pass@render-host:5432/voyage
   ```

2. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

**Option B: Using Render Shell**

1. Go to Backend Service → **"Shell"** tab
2. Run:
   ```bash
   npx prisma migrate deploy
   ```

---

## 📋 Step 9: Update Stripe Webhooks

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Webhooks

2. Add endpoint:
   ```
   https://voyage-backend.onrender.com/api/webhooks/stripe
   ```
   (Or if you set up custom domain: `https://api.voyage-data.com/api/webhooks/stripe`)

3. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `charge.succeeded`
   - ✅ `payment_intent.created`

4. Copy webhook secret (`whsec_...`)
5. Update `STRIPE_WEBHOOK_SECRET` in Render backend environment variables

---

## 📋 Step 10: Update CORS Settings

The backend CORS is already configured to use environment variables. Make sure:

- Backend has `WEB_URL=https://voyage-data.com` set
- Backend allows your domain automatically

If you need to add more origins, the backend reads from `WEB_URL` and `APP_URL` environment variables.

---

## ✅ Post-Deployment Checklist

- [ ] Backend accessible at `https://voyage-backend.onrender.com/api/countries`
- [ ] Frontend accessible at `https://voyage-frontend.onrender.com`
- [ ] Domain `voyage-data.com` loads frontend
- [ ] SSL certificates active (automatic on Render + Cloudflare)
- [ ] Database migrations completed
- [ ] Stripe webhooks configured
- [ ] Test sign in with Clerk
- [ ] Test purchase flow end-to-end
- [ ] Admin panel accessible
- [ ] All environment variables set correctly

---

## 🔧 Render-Specific Tips

### Free Tier Limitations

**Free tier services spin down after 15 minutes of inactivity:**
- First request after spin-down: ~30 seconds (cold start)
- Solution: Upgrade to Starter plan ($7/month) for always-on

### Environment Variables

- **Internal URLs**: Use "Internal Database URL" for `DATABASE_URL` and `REDIS_URL`
- **Secret Variables**: Mark sensitive variables as "Secret" in Render
- **Updates**: Changing env vars automatically restarts the service

### Auto-Deploy

- Render automatically deploys when you push to `main` branch
- Can disable auto-deploy in Settings if needed
- Can trigger manual deploys anytime

### Monitoring

- View logs in real-time: Service → "Logs" tab
- View metrics: Service → "Metrics" tab
- Set up alerts for service downtime

---

## 💰 Estimated Monthly Cost

**Starter Plans (Recommended for Production):**
- Frontend Web Service: **$7/month**
- Backend Web Service: **$7/month**
- PostgreSQL Database: **$7/month**
- Redis: **$10/month**
- **Total: ~$31/month**

**Free Tier (Testing Only):**
- PostgreSQL: Free for 90 days, then $7/month
- Redis: Free (limited)
- Web Services: Free (spins down after 15 min)
- **Total: $0-7/month** (depending on usage)

---

## 🐛 Troubleshooting

**Domain not loading:**
- Check DNS records in Cloudflare
- Verify Proxy (orange cloud) is enabled
- Wait 30 minutes for DNS propagation
- Check SSL certificate status in Render

**Backend can't connect to database:**
- Use **Internal Database URL** (not external)
- Verify database service is running
- Check environment variables are set

**Cold starts (free tier):**
- First request takes ~30 seconds after inactivity
- Upgrade to Starter plan for always-on

**Build failures:**
- Check Root Directory is correct (`apps/web` or `apps/backend`)
- Verify Build Command is correct
- Check build logs for errors

---

## 📚 Resources

- [Render Documentation](https://render.com/docs)
- [Cloudflare DNS Guide](https://developers.cloudflare.com/dns/)
- [Next.js on Render](https://render.com/docs/deploy-nextjs)
- [NestJS on Render](https://render.com/docs/deploy-node)

---

## 🎉 You're Done!

Your Voyage app should now be live at:
- **Frontend**: https://voyage-data.com
- **Backend API**: https://voyage-backend.onrender.com/api
- **Optional Backend Domain**: https://api.voyage-data.com (if configured)

Happy deploying! 🚀
