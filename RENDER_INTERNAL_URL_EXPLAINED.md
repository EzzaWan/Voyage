# What is "Internal Database URL" in Render?

## Quick Answer

**Internal Database URL** is the connection string you use to connect to your PostgreSQL database **from services inside Render** (like your backend service).

---

## 🔍 Detailed Explanation

When you create a PostgreSQL database on Render, they give you **two connection URLs**:

### 1. **Internal Database URL** (Use This!)

**Format:**
```
postgresql://user:password@dpg-xxxxx-a.oregon-postgres.render.com:5432/voyage_dbname
```

**Where to find it:**
- Render Dashboard → Your PostgreSQL service
- Click on **"Connect"** tab
- Look for **"Internal Database URL"**

**Use it when:**
- ✅ Connecting from your **backend service** (also on Render)
- ✅ Connecting from other Render services
- ✅ It's faster and more secure (uses Render's internal network)

---

### 2. **External Database URL** (Use for Local Development)

**Format:**
```
postgresql://user:password@dpg-xxxxx-a.oregon-postgres.render.com:5432/voyage_dbname?sslmode=require
```

**Where to find it:**
- Same place: PostgreSQL service → "Connect" tab
- Look for **"External Database URL"** or **"Connection Pooling URL"**

**Use it when:**
- ✅ Connecting from your **local machine** (for migrations, testing)
- ✅ Connecting from outside Render's network
- ⚠️ Requires SSL (has `?sslmode=require` at the end)

---

## 🎯 For Your Voyage Deployment

### On Render (Backend Service):

Use **Internal Database URL** in your backend environment variables:

```bash
DATABASE_URL=postgresql://user:pass@dpg-xxxxx-a.oregon-postgres.render.com:5432/voyage
```

**Why?**
- Your backend service is on Render
- It can use Render's internal network
- Faster and more secure

---

### From Your Local Machine (Running Migrations):

Use **External Database URL** (or Connection Pooling URL) temporarily:

```bash
# In your local .env file (for migrations only)
DATABASE_URL=postgresql://user:pass@dpg-xxxxx-a.oregon-postgres.render.com:5432/voyage?sslmode=require
```

**Why?**
- Your local machine is outside Render's network
- Needs SSL connection
- Only use this for running migrations, then remove it

---

## 📝 How to Get the URL

### Step-by-Step:

1. **Go to Render Dashboard**
   - Navigate to your PostgreSQL database service

2. **Click "Connect" Tab**
   - You'll see multiple connection options

3. **Look for "Internal Database URL"**
   - Copy the entire connection string
   - It looks like: `postgresql://user:password@host:port/database`

4. **Paste into Environment Variables**
   - Go to your Backend service → Environment tab
   - Add: `DATABASE_URL=<paste-internal-url-here>`

---

## 🔒 Security Notes

- **Internal URLs** are only accessible from within Render's network
- **External URLs** require SSL (secure connection)
- Never commit these URLs to Git (they're in environment variables)

---

## ✅ Quick Checklist

- [ ] Created PostgreSQL database on Render
- [ ] Opened database service → "Connect" tab
- [ ] Copied **Internal Database URL**
- [ ] Pasted into Backend service environment variables as `DATABASE_URL`
- [ ] For local migrations: Use External URL temporarily (with SSL)

---

## 🆘 Still Confused?

**Think of it this way:**
- **Internal URL** = "Use this to talk to the database from Render services"
- **External URL** = "Use this to talk to the database from outside Render"

For your Voyage app deployed on Render → **Always use Internal URL!**

---

## 📸 Where to Find It (Visual Guide)

```
Render Dashboard
└── voyage-db (PostgreSQL service)
    └── Connect tab
        ├── Internal Database URL ← USE THIS for Render services
        ├── External Database URL ← Use for local dev only
        └── Connection Pooling URL ← Alternative for production
```

That's it! The **Internal Database URL** is just the connection string to your database, optimized for use within Render's network. 🎉

