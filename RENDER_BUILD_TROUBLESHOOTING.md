# Render Build Troubleshooting: "nest: not found"

## The Problem

Build fails with:
```
sh: 1: nest: not found
npm error Lifecycle script `build` failed with error
```

## Root Cause

The `nest` CLI command isn't found because:
- `@nestjs/cli` is in `devDependencies`
- Render needs to install devDependencies during build
- The build command needs to use `npx` to find the local binary

## Solutions

### ✅ Solution 1: Use `npx nest build` (Already Fixed)

The build script now uses `npx nest build` instead of `nest build`:
- `npx` will find the local `nest` binary in `node_modules/.bin/nest`
- This works even if `nest` isn't in PATH

**Current build script** (in `apps/backend/package.json`):
```json
{
  "scripts": {
    "build": "npx nest build",
    "postbuild": "npx prisma generate"
  }
}
```

### ✅ Solution 2: Ensure DevDependencies Install

In Render, make sure your build command is:
```bash
npm install && npm run build
```

NOT:
```bash
npm install --production && npm run build  # ❌ This skips devDependencies
```

Render should install devDependencies by default during build, but verify in the build logs.

### ✅ Solution 3: Verify Root Directory

In Render backend service settings:
- **Root Directory**: Must be `apps/backend`
- This ensures npm runs from the correct location

### ✅ Solution 4: Alternative Build (if above doesn't work)

If `npx nest build` still fails, you can use TypeScript compiler directly:

```json
{
  "scripts": {
    "build": "tsc && npx prisma generate"
  }
}
```

But this requires proper TypeScript configuration. The `npx nest build` approach is preferred.

## Check Render Build Logs

Look for these in the build logs:
1. ✅ `npm install` should install both dependencies and devDependencies
2. ✅ Should see `@nestjs/cli` being installed
3. ✅ `npx nest build` should find and run the CLI
4. ✅ `npx prisma generate` should run after build

## Verification Steps

1. **Check package.json**: Build script should be `npx nest build`
2. **Check Render settings**: Root Directory = `apps/backend`
3. **Check build command**: Should be `npm install && npm run build`
4. **Check build logs**: Look for NestJS CLI installation

## If Still Failing

1. **Check if monorepo is causing issues**: Render should build from `apps/backend` root
2. **Try installing from monorepo root**: 
   - Root Directory: `.` (root)
   - Build Command: `cd apps/backend && npm install && npm run build`
3. **Move @nestjs/cli to dependencies** (last resort):
   - Not recommended, but ensures it's always available

## Current Status

✅ **Already Fixed**: The build script now uses `npx nest build`
✅ **Already Fixed**: Prisma generate runs after build via `postbuild` script

Just commit and push, then retry the Render deployment!

