# Branch Strategy & Deployment Guide

## 🌿 Current Branches

- **`main`**: Production branch (currently hosting live site)
- **`dev`**: Development branch (for new features and testing)

## ✅ Deployment Behavior

### **YES - Your production site is SAFE! 🛡️**

Changes pushed to the `dev` branch will **NOT** affect your production site because:

1. **Vercel (Frontend)**: By default, Vercel only deploys from the `main` branch automatically. Unless you specifically configure it to deploy from `dev`, only pushes to `main` will trigger deployments.

2. **Railway (Backend)**: Railway also defaults to deploying from `main` branch. Your current production backend is connected to `main`, so changes to `dev` won't trigger redeployments.

## 🔒 How to Ensure Production Safety

### Option 1: Verify Deployment Branch Settings (Recommended)

**Vercel:**
1. Go to your Vercel project dashboard
2. Settings → Git → Production Branch
3. Confirm it's set to `main`
4. If there's a "Branch Protection" option, enable it

**Railway:**
1. Go to your Railway project dashboard
2. Click on your backend service
3. Settings → Source → Branch
4. Confirm it's set to `main`

### Option 2: Manual Production Deploys (Safest)

1. Work on `dev` branch freely
2. Test everything on `dev`
3. When ready for production:
   ```bash
   git checkout main
   git merge dev
   git push origin main
   ```
4. Or create a Pull Request: `dev` → `main` for review before merging

## 🚀 Current Setup

- ✅ `dev` branch created from `main`
- ✅ Both branches exist on GitHub (origin)
- ✅ You're currently on `dev` branch
- ✅ Production (`main`) is unchanged

## 📝 Workflow Going Forward

1. **Daily development**: Work on `dev` branch
   ```bash
   git checkout dev
   git add .
   git commit -m "Your changes"
   git push origin dev
   ```

2. **When ready for production**: Merge `dev` → `main`
   ```bash
   git checkout main
   git merge dev
   git push origin main
   ```

3. **Start new feature**: Create feature branch from `dev`
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/new-feature
   # ... make changes ...
   git push origin feature/new-feature
   ```

## ⚠️ Important Notes

- Always verify your deployment settings in Vercel/Railway to confirm they're set to `main`
- Never push directly to `main` from your local machine if you want extra safety
- Consider enabling branch protection rules on GitHub for `main` branch


