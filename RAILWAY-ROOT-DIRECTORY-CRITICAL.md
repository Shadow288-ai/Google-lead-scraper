# ⚠️ CRITICAL: Set Railway Root Directory

## The Problem
Railway is building from your repository root, but your application is in the `google-maps-scraper-main` subdirectory. Railway cannot find the files because it's looking in the wrong place.

## Solution: Set Root Directory in Railway Dashboard

**This MUST be done in Railway's web interface - it cannot be set via code.**

### Step-by-Step Instructions:

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Log in to your account
   - Click on your project

2. **Open Your Service**
   - Click on the service that's failing to build

3. **Go to Settings**
   - Click the **"Settings"** tab at the top
   - Scroll down through the settings

4. **Find "Root Directory" Setting**
   Look for one of these options (depending on your Railway UI version):
   - **"Root Directory"** 
   - **"Source Root"**
   - **"Working Directory"**
   - **"Source Directory"**
   - **"Base Directory"**
   
   It might be in:
   - The main "Settings" page
   - Under "Build" section
   - Under "Deploy" section
   - Under "General" section

5. **Set the Value**
   - Click on the field (it might be empty or say "/" or ".")
   - Type: `google-maps-scraper-main`
   - **DO NOT** include a leading slash: use `google-maps-scraper-main` not `/google-maps-scraper-main`

6. **Save the Changes**
   - Click **"Save"**, **"Update"**, or **"Apply"** button
   - Railway will automatically trigger a new deployment

7. **Verify**
   - Go to the **"Deployments"** tab
   - You should see a new deployment starting
   - The build should now succeed

## What Happens After Setting Root Directory

Once you set the root directory to `google-maps-scraper-main`:

✅ Railway will build from `google-maps-scraper-main/` directory  
✅ Railway will use `google-maps-scraper-main/Dockerfile` (the original one)  
✅ All files (`go.mod`, `go.sum`, `requirements.txt`, etc.) will be found  
✅ The build will succeed  

**You can then delete the root `Dockerfile` and `railway.toml` files** since Railway will use the ones in `google-maps-scraper-main/`.

## If You Can't Find the Setting

If you cannot find the "Root Directory" setting:

1. **Check Railway Documentation**
   - Visit: https://docs.railway.app
   - Search for "root directory" or "source root"

2. **Contact Railway Support**
   - They can help you locate the setting
   - Or confirm if your plan supports this feature

3. **Alternative: Use Railway CLI**
   ```bash
   railway link
   railway variables set RAILWAY_SERVICE_ROOT_DIR=google-maps-scraper-main
   ```

## Why This Is Needed

Your repository structure:
```
your-repo/
├── Dockerfile (wrapper we created)
├── railway.toml (we created)
└── google-maps-scraper-main/
    ├── Dockerfile (original - correct one to use)
    ├── go.mod
    ├── go.sum
    ├── requirements.txt
    └── railway.toml
```

Railway builds from the repo root by default, but your app is in the subdirectory. Setting the root directory tells Railway: **"Build from here, not the repo root."**

