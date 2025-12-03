# Fix for Render Build Error: "nest: not found"

## Problem

Build fails on Render with:
```
sh: 1: nest: not found
npm error Lifecycle script `build` failed with error
```

## Root Cause

The `nest` command isn't found because:
1. `@nestjs/cli` is in `devDependencies`
2. Render might skip devDependencies during production builds
3. The `nest` binary needs to be accessible

## Solution

Updated `apps/backend/package.json` to use `npx nest build` instead of `nest build`.

### Changes Made:

```json
{
  "scripts": {
    "build": "npx nest build",
    "postbuild": "npx prisma generate",
    "start:prod": "node dist/main"
  }
}
```

`npx` ensures it uses the local NestJS CLI from `node_modules/.bin/nest`.

## Render Configuration

Make sure your Render backend service has:

### Build Command:
```bash
npm install && npm run build
```

This will:
1. Install all dependencies (including devDependencies for build)
2. Run `npx nest build` which finds the local CLI
3. Run `postbuild` script to generate Prisma client

### Start Command:
```bash
npm run start:prod
```

## Alternative Fix (if above doesn't work)

If `npx nest build` still doesn't work, you can:

1. **Use TypeScript compiler directly:**
```json
{
  "scripts": {
    "build": "tsc && npx prisma generate"
  }
}
```

2. **Install NestJS CLI globally** (not recommended):
   - Add to dependencies instead of devDependencies
   - Or use a build script

3. **Ensure devDependencies are installed:**
   - In Render, make sure you're not using `npm install --production`
   - The build command should be `npm install` (installs all dependencies)

## Verification

After updating:
1. Commit and push the changes
2. Trigger a new deployment on Render
3. Check build logs - should see:
   - `nest build` running successfully
   - `prisma generate` running
   - Build completing without errors

## Additional Notes

- **Prisma Generate**: Added as `postbuild` script so it runs after the NestJS build
- **Workspace Build**: If building from monorepo root, make sure the build command includes the workspace path

