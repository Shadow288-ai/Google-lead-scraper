# Railway Root Directory Configuration

## The Issue

Railway is building from the repository root, but all your application files (Dockerfile, go.mod, go.sum) are in the `google-maps-scraper-main` subdirectory.

## Solution: Set Root Directory in Railway UI

You need to tell Railway to use `google-maps-scraper-main` as the root directory:

### Steps:

1. **Go to Railway Dashboard**
   - Click on your service

2. **Open Settings**
   - Click the **"Settings"** tab
   - Scroll down to find **"Root Directory"** or **"Working Directory"**

3. **Set Root Directory**
   - Enter: `google-maps-scraper-main`
   - Or use the file picker to select the `google-maps-scraper-main` folder
   - Click **"Save"**

4. **Redeploy**
   - Railway will automatically trigger a new build
   - Or manually click **"Redeploy"**

## Alternative: Use Railway CLI

If you have Railway CLI installed:

```bash
railway link
railway variables set RAILWAY_SERVICE_ROOT_DIR=google-maps-scraper-main
```

## Why This Is Needed

The Dockerfile does:
```dockerfile
COPY go.mod go.sum ./
```

This expects `go.mod` and `go.sum` to be in the **build context root**. When Railway builds from the repo root, the build context is the repo root, so it can't find these files (they're in the subdirectory).

By setting the root directory to `google-maps-scraper-main`, Railway will:
- Use `google-maps-scraper-main` as the build context
- Find `go.mod` and `go.sum` correctly
- Build successfully

## Files Created

- ✅ `railway.toml` in repo root - Points Railway to the Dockerfile
- ✅ `google-maps-scraper-main/railway.toml` - For if Railway builds from that directory

**The key is setting the Root Directory in Railway's UI to `google-maps-scraper-main`.**

