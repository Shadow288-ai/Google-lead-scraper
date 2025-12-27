# Fix Railway Python Detection Issue

Railway is detecting Python instead of Docker. Here's the quick fix:

## Step-by-Step Fix

### 1. In Railway Dashboard:

1. Go to your service
2. Click **"Settings"** tab
3. Scroll to **"Build & Deploy"** section
4. Find **"Builder"** dropdown
5. Change from **"Nixpacks"** to **"Dockerfile"**
6. Click **"Save"**

### 2. The Dockerfile is already configured:

The Dockerfile now uses `CMD` instead of `ENTRYPOINT` to work with Railway's `$PORT` environment variable.

### 3. Add Volume for Persistent Storage:

1. In Railway service settings
2. Go to **"Volumes"** tab
3. Click **"Add Volume"**
4. Mount path: `/gmapsdata`
5. This ensures your scraped data persists

### 4. Environment Variables (Optional):

In Railway, add under "Variables":
- `DISABLE_TELEMETRY=1` (optional)

### 5. Redeploy:

After changing the builder to Dockerfile, Railway should automatically trigger a new build. If not:
- Click "Redeploy" button
- Or push a new commit to trigger auto-deploy

## Why This Happens

Railway's auto-detection looks for `requirements.txt` and Python files first, which triggers the Python buildpack. By explicitly selecting Dockerfile as the builder, Railway will use your Dockerfile instead.

## Verification

After deployment, check the build logs. You should see:
- ✅ "Building Docker image"
- ✅ Go build steps
- ❌ NOT "Detected Python" or "Using pip"

Your service should now build and run correctly!

