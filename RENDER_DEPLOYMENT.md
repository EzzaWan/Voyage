# Render Deployment Guide for Voyage

Complete step-by-step guide to deploy Voyage backend to Render.

---

## 🎯 Why Render?

- **Free tier available** (with limitations)
- **Simple setup** - similar to Heroku
- **Automatic HTTPS** for all services
- **Built-in PostgreSQL & Redis**
- **GitHub integration** - auto-deploy on push

---

## 📋 Step-by-Step: Deploy Backend to Render

### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

---

### Step 2: Create PostgreSQL Database

1. In Render Dashboard, click **"New +"** → **"PostgreSQL"**

2. Fill in the form:
   - **Name**: `voyage-db`
   - **Database**: `voyage` (or leave default)
   - **User**: `voyage` (or leave default)
   - **Region**: Choose closest to your users
   - **PostgreSQL Version**: 18 (latest available on Render) or 15-17 (all work fine)
   - **Plan**: 
     - **Free**: Good for testing (90 days, then $7/month)
     - **Starter**: $7/month (recommended for production)

3. Click **"Create Database"**

4. **Save the connection details:**
   - Wait for database to provision (~2 minutes)
   - Go to Database → **"Connect"** tab
   - Copy the **Internal Database URL** (format: `postgresql://user:password@host:port/dbname`)
   - This is your `DATABASE_URL` - save it!

---

### Step 3: Create Redis Instance

1. In Render Dashboard, click **"New +"** → **"Redis"**

2. Fill in the form:
   - **Name**: `voyage-redis`
   - **Region**: Same as database (for lower latency)
   - **Plan**: 
     - **Free**: Good for testing
     - **Starter**: $10/month (recommended for production)

3. Click **"Create Redis"**

4. **Save the connection details:**
   - Wait for Redis to provision (~1 minute)
   - Go to Redis → **"Connect"** tab
   - Copy the **Internal Redis URL** (format: `redis://:password@host:port`)
   - This is your `REDIS_URL` - save it!

---

### Step 4: Deploy Backend Web Service

1. In Render Dashboard, click **"New +"** → **"Web Service"**

2. **Connect Repository:**
   - Choose **"Build and deploy from a Git repository"**
   - Select your Voyage GitHub repository
   - Click **"Connect"**

3. **Configure Service:**
   - **Name**: `voyage-backend`
   - **Region**: Same as database/Redis
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: `apps/backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Plan**: 
     - **Free**: Good for testing (spins down after 15 min inactivity)
     - **Starter**: $7/month (always on, recommended)

4. **Add Environment Variables:**
   Scroll down to "Environment Variables" section and add:

   ```bash
   # Database (use Internal Database URL from Step 2)
   DATABASE_URL=postgresql://user:password@dpg-xxxxx-a/voyage
   
   # Redis (use Internal Redis URL from Step 3)
   REDIS_URL=redis://:password@red-xxxxx:6379
   
   # Server
   PORT=3001
   NODE_ENV=production
   
   # App URLs (UPDATE WITH YOUR ACTUAL DOMAIN)
   WEB_URL=https://yourdomain.com
   APP_URL=https://yourdomain.com
   WEBHOOK_URL=https://voyage-backend.onrender.com/api/webhooks/esim
   
   # eSIM Access API
   ESIM_ACCESS_CODE=your_access_code_here
   ESIM_SECRET_KEY=your_secret_key_here
   ESIM_API_BASE=https://api.esimaccess.com/api/v1/open
   
   # Stripe (USE LIVE KEYS FOR PRODUCTION)
   STRIPE_SECRET=sk_live_xxxxxxxxxxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   
   # Admin
   ADMIN_EMAILS=youremail@gmail.com,admin@gmail.com
   NEXT_PUBLIC_ADMIN_EMAILS=youremail@gmail.com,admin@gmail.com
   
   # Email (Resend)
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   EMAIL_FROM=noreply@yourdomain.com
   
   # Currency API
   EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key
   ```

5. Click **"Create Web Service"**

6. **Wait for Deployment:**
   - Render will clone your repo
   - Install dependencies
   - Build your backend
   - Start the service
   - This takes ~5-10 minutes for first deploy

7. **Get Your Backend URL:**
   - Once deployed, Render gives you: `https://voyage-backend.onrender.com`
   - Or you can set a custom domain: `api.yourdomain.com`
   - Copy this URL - you'll need it for frontend!

---

### Step 5: Set Up Custom Domain (Optional)

1. In your Web Service → **"Settings"** tab
2. Scroll to **"Custom Domains"**
3. Add your domain: `api.yourdomain.com`
4. Render will show DNS records to add:
   - Type: `CNAME`
   - Name: `api`
   - Value: `voyage-backend.onrender.com`
5. Add this DNS record at your domain registrar
6. Wait 5-30 minutes for DNS propagation
7. Render automatically provisions SSL certificate

---

### Step 6: Run Database Migrations

**Option A: Using Prisma CLI locally** (Recommended)

1. Create a temporary `.env` file:
   ```bash
   DATABASE_URL=postgresql://user:password@host:port/dbname  # From Render
   ```

2. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

**Option B: Using Render Shell**

1. Go to your Web Service → **"Shell"** tab
2. Run:
   ```bash
   npx prisma migrate deploy
   ```

**Option C: Manual SQL**

1. Go to PostgreSQL → **"Connect"** tab
2. Use the connection string with any PostgreSQL client (pgAdmin, DBeaver, etc.)
3. Run SQL from `prisma/migrations/*/migration.sql` files in order

---

### Step 7: Configure Stripe Webhooks

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Webhooks**

2. Click **"Add endpoint"**

3. Enter endpoint URL:
   ```
   https://voyage-backend.onrender.com/api/webhooks/stripe
   ```
   (Or your custom domain: `https://api.yourdomain.com/api/webhooks/stripe`)

4. Select events to listen to:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `charge.succeeded`
   - ✅ `payment_intent.created`

5. Click **"Add endpoint"**

6. **Copy the webhook signing secret:**
   - Starts with `whsec_...`
   - Update `STRIPE_WEBHOOK_SECRET` in Render environment variables

---

## 🔧 Render-Specific Configuration

### Auto-Deploy Settings

1. Go to Web Service → **"Settings"**
2. **Auto-Deploy**: Enabled (default)
   - Automatically deploys when you push to `main` branch
3. **Manual Deploy**: You can trigger deployments manually if needed

### Health Checks

Render automatically checks if your service is responding:
- Default path: `/` or `/health`
- Make sure your backend responds on the root path or add a health endpoint

### Environment Variables

**To update environment variables:**
1. Go to Web Service → **"Environment"** tab
2. Add/Edit/Delete variables
3. Service will automatically restart with new variables

**Protected Variables:**
- Mark sensitive variables as "Secret" (they won't show in logs)
- Click the lock icon 🔒 next to the variable

---

## 💰 Render Pricing

**Free Tier:**
- ✅ PostgreSQL: 90 days free, then $7/month
- ✅ Redis: Free (limited)
- ✅ Web Service: Free (spins down after 15 min inactivity)
- ⚠️ **Cold starts**: First request after inactivity takes ~30 seconds

**Starter Plans (Recommended for Production):**
- Web Service: **$7/month** (always on, no cold starts)
- PostgreSQL: **$7/month** (persistent, backups)
- Redis: **$10/month** (persistent)

**Total**: ~$24/month for always-on production setup

---

## 🆚 Render vs Railway Comparison

| Feature | Render | Railway |
|---------|--------|---------|
| Free Tier | ✅ Yes (with limitations) | ✅ Yes ($5 credit/month) |
| Always-On Free | ❌ No (spins down) | ✅ Yes |
| PostgreSQL | ✅ Included | ✅ Included |
| Redis | ✅ Included | ✅ Included |
| Auto-Deploy | ✅ Yes | ✅ Yes |
| Custom Domains | ✅ Free SSL | ✅ Free SSL |
| Dashboard | Clean & Simple | Modern UI |
| Pricing | $7-24/month | Pay-as-you-go |

**Recommendation**: 
- Use **Render** if you want simple pricing and don't mind cold starts on free tier
- Use **Railway** if you need always-on free tier or prefer pay-as-you-go

---

## ✅ Post-Deployment Checklist

- [ ] Backend accessible at `https://voyage-backend.onrender.com/api/countries`
- [ ] Database migrations completed successfully
- [ ] Redis connection working
- [ ] All environment variables set correctly
- [ ] Stripe webhooks configured and tested
- [ ] Custom domain working (if set up)
- [ ] SSL certificate active (automatic on Render)
- [ ] Test purchase flow end-to-end
- [ ] Monitor logs for any errors

---

## 🐛 Troubleshooting

**Service won't start:**
- Check deployment logs in Render dashboard
- Verify all environment variables are set
- Ensure `DATABASE_URL` and `REDIS_URL` use internal URLs
- Check build command completes successfully

**Database connection errors:**
- Use **Internal Database URL** (not external)
- Verify database service is running
- Check `DATABASE_URL` format is correct

**Cold starts (Free tier):**
- First request after 15 min inactivity takes ~30s
- Upgrade to Starter plan ($7/month) for always-on

**Build failures:**
- Check Root Directory is set to `apps/backend`
- Verify Build Command: `npm install && npm run build`
- Check Start Command: `npm run start:prod`
- View build logs for specific errors

---

## 📚 Resources

- [Render Docs](https://render.com/docs)
- [Render PostgreSQL Guide](https://render.com/docs/databases)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Render Custom Domains](https://render.com/docs/custom-domains)

---

## 🎉 Next Steps

After backend is deployed:
1. Continue with **Step 2** in `DEPLOY_QUICK_START.md` (Deploy Frontend to Vercel)
2. Update `NEXT_PUBLIC_API_URL` in Vercel to point to your Render backend
3. Test the full flow!

