# Quick Fix: Railway Python Detection Issue

## The Problem

Railway detected Python instead of Docker because it found `requirements.txt` in your repo.

## The Solution (2 Steps)

### Step 1: Change Builder in Railway Dashboard

1. Go to your Railway service
2. Click **"Settings"** tab
3. Scroll to **"Build & Deploy"** section  
4. Find **"Builder"** dropdown
5. Change from **"Nixpacks"** to **"Dockerfile"**
6. Click **"Save"**

### Step 2: Redeploy

After changing the builder, Railway will automatically trigger a new build, OR:
- Click the **"Redeploy"** button
- Or push a new commit to trigger auto-deploy

## That's It!

After this change, Railway will use your `Dockerfile` instead of trying to detect Python. The Dockerfile is already configured to work with Railway's `$PORT` environment variable.

## Optional: Add Volume for Data Persistence

1. In Railway service settings
2. Go to **"Volumes"** tab
3. Click **"Add Volume"**
4. Mount path: `/gmapsdata`
5. This keeps your scraped data even after redeploys

## Files Created

- ✅ `railway.toml` - Railway configuration (should auto-detect)
- ✅ `Dockerfile` - Updated to use Railway's PORT variable
- ✅ `.railwayignore` - Tells Railway what to ignore

These files should help, but the main fix is changing the Builder in the Railway dashboard!

