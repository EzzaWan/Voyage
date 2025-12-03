# Quick Deploy Guide for voyage-data.com

**Your Setup:**
- Domain: `voyage-data.com` (Cloudflare)
- Frontend: Render
- Backend: Render
- Database: Render PostgreSQL
- Redis: Render Redis

---

## 🚀 Quick Steps

### 1. Create Services on Render (15 min)

#### PostgreSQL Database
- Dashboard → "New +" → "PostgreSQL"
- Name: `voyage-db`
- **PostgreSQL Version**: 18 (latest) or 15-17 (all work fine)
- Plan: Starter ($7/month) or Free (90 days)
- Copy **Internal Database URL**

#### Redis
- Dashboard → "New +" → "Redis"
- Name: `voyage-redis`
- Plan: Starter ($10/month) or Free
- Copy **Internal Redis URL**

#### Backend Service
- Dashboard → "New +" → "Web Service"
- Connect GitHub repo
- Name: `voyage-backend`
- **Root Directory**: `.` (monorepo root - IMPORTANT!)
- **Build Command**: `npm install && npx prisma generate && cd apps/backend && npm run build`
- **Start Command**: `cd apps/backend && npm run start:prod`

**Important:** The build script uses TypeScript compiler directly (`tsc`) instead of NestJS CLI. TypeScript is in dependencies so it's always available. If build fails, try using `npx tsc` in the build script instead.
- Plan: Starter ($7/month)

**Environment Variables:**
```
DATABASE_URL=<internal-postgres-url>
REDIS_URL=<internal-redis-url>
NODE_ENV=production
# Don't set PORT - Render sets it automatically
WEB_URL=https://voyage-data.com
APP_URL=https://voyage-data.com
WEBHOOK_URL=https://voyage-backend.onrender.com/api/webhooks/esim
ESIM_ACCESS_CODE=your_code
ESIM_SECRET_KEY=your_key
ESIM_API_BASE=https://api.esimaccess.com/api/v1/open
STRIPE_SECRET=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
ADMIN_EMAILS=youremail@gmail.com
NEXT_PUBLIC_ADMIN_EMAILS=youremail@gmail.com
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@voyage-data.com
EXCHANGE_RATE_API_KEY=your_key
```

#### Frontend Service
- Dashboard → "New +" → "Web Service"
- Connect same GitHub repo
- Name: `voyage-frontend`
- Root Directory: `.` (monorepo root - IMPORTANT!)
- Build: `npm install && cd apps/web && npm run build`
- Start: `cd apps/web && npm run start`
- Plan: Starter ($7/month)

**Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://voyage-backend.onrender.com/api
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_ADMIN_EMAILS=youremail@gmail.com
NEXT_PUBLIC_WEB_URL=https://voyage-data.com
NODE_ENV=production
```

---

### 2. Connect Domain to Frontend (5 min)

1. **In Render:**
   - Go to Frontend Service → Settings → Custom Domains
   - Add: `voyage-data.com`
   - Render will show DNS instructions

2. **In Cloudflare:**
   - Go to `voyage-data.com` → DNS → Records
   - Add CNAME record:
     - Type: `CNAME`
     - Name: `@` (or leave blank)
     - Target: `voyage-frontend.onrender.com`
     - ✅ Proxy enabled (orange cloud)
     - TTL: Auto

3. **For www (optional):**
   - Add another CNAME:
     - Name: `www`
     - Target: `voyage-frontend.onrender.com`
     - ✅ Proxy enabled

4. **SSL/TLS Settings:**
   - Cloudflare → SSL/TLS
   - Set to **"Full"** mode

5. Wait 5-30 minutes for DNS propagation
   - Render automatically provisions SSL certificate

---

### 3. Run Database Migrations (5 min)

**Option A: Local (Recommended)**
```bash
# Create .env file with Render database URL
DATABASE_URL=postgresql://user:pass@render-host:5432/voyage

# Run migrations
npx prisma migrate deploy
```

**Option B: Render Shell**
- Backend Service → Shell tab
- Run: `npx prisma migrate deploy`

---

### 4. Configure Stripe Webhooks (5 min)

1. Stripe Dashboard → Webhooks → "Add endpoint"
2. URL: `https://voyage-backend.onrender.com/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `payment_intent.succeeded`, `charge.succeeded`
4. Copy webhook secret → Update `STRIPE_WEBHOOK_SECRET` in Render backend

---

### 5. Verify Email Domain in Resend

1. Resend Dashboard → Domains
2. Add domain: `voyage-data.com`
3. Add DNS records shown in Resend (in Cloudflare)
4. Wait for verification
5. Update `EMAIL_FROM=noreply@voyage-data.com` in Render backend

---

## ✅ Checklist

- [ ] Backend deployed: `https://voyage-backend.onrender.com/api/countries`
- [ ] Frontend deployed: `https://voyage-frontend.onrender.com`
- [ ] Domain connected: `https://voyage-data.com` loads frontend
- [ ] SSL certificates active (automatic)
- [ ] Database migrations completed
- [ ] Stripe webhooks configured
- [ ] Resend domain verified
- [ ] Test sign in with Clerk
- [ ] Test purchase flow

---

## 💰 Monthly Cost

**Starter Plans (Recommended):**
- Frontend: $7/month
- Backend: $7/month
- PostgreSQL: $7/month
- Redis: $10/month
- **Total: ~$31/month**

**Free Tier (Testing Only):**
- PostgreSQL: Free 90 days, then $7/month
- Redis: Free (limited)
- Services: Free (spins down after 15 min)
- **Total: $0-7/month**

---

## 🔗 Important URLs

- **Frontend**: https://voyage-data.com
- **Backend API**: https://voyage-backend.onrender.com/api
- **Admin Panel**: https://voyage-data.com/admin

---

## 📚 Detailed Guides

- **Full Render Guide**: See `RENDER_FULL_DEPLOYMENT.md`
- **Quick Start**: See `DEPLOY_QUICK_START.md`
- **Comparison**: See `RENDER_VS_RAILWAY.md`

---

## 🐛 Troubleshooting

**Domain not loading?**
- Check DNS records in Cloudflare
- Verify Proxy (orange cloud) is enabled
- Wait 30 min for DNS propagation
- Check SSL status in Render

**Backend can't connect to database?**
- Use **Internal Database URL** (not external)
- Check database service is running

**Cold starts?**
- Free tier spins down after 15 min
- Upgrade to Starter ($7/month) for always-on

---

You're all set! 🎉

Your Voyage app will be live at **https://voyage-data.com**

