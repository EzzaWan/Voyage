# Render Build Fix: "could not determine executable to run"

## Problem

Render build fails with:
```
npm error could not determine executable to run
npm error command sh -c npx nest build
```

## Root Cause

The issue is that Render might:
1. Not be installing devDependencies properly
2. Building from the wrong directory context in a monorepo
3. Not finding executables in node_modules/.bin

## Solution

We need to change the Render build command to ensure devDependencies are installed and use TypeScript compiler directly.

### Update Render Build Command

In Render Dashboard → Backend Service → Settings:

**Change Build Command from:**
```bash
npm install && npm run build
```

**To:**
```bash
npm install --include=dev && npm run build
```

OR (if the above doesn't work):

```bash
cd /opt/render/project/src && npm install && cd apps/backend && npm run build
```

### Alternative: Build from Root

If building from monorepo root works better:

1. **Change Root Directory** from `apps/backend` to `.` (root)
2. **Build Command**: `npm install && cd apps/backend && npm run build`
3. **Start Command**: `cd apps/backend && npm run start:prod`

### Updated Build Script

The build script now uses TypeScript compiler directly:
```json
{
  "scripts": {
    "build": "npx tsc && npx prisma generate"
  }
}
```

This works if TypeScript is installed (which should be in devDependencies).

## Recommended Fix

**Option 1: Update Render Build Command (Easiest)**

In Render → Backend Service → Settings:
- Build Command: `npm install --include=dev && npm run build`

**Option 2: Move TypeScript to dependencies**

Move `typescript` from devDependencies to dependencies in `apps/backend/package.json`:
```json
{
  "dependencies": {
    ...
    "typescript": "^5.1.3"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    ...
  }
}
```

Then the build will work even if devDependencies aren't installed.

## Verification

After updating:
1. Check build logs for `npm install` - should see devDependencies being installed
2. Should see TypeScript compiler running
3. Should see Prisma generate running
4. Build should complete successfully

