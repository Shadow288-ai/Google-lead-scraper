# Railway Root Directory Setup - REQUIRED

## The Problem

Railway is building from your repository root, but all your application files are in the `google-maps-scraper-main` subdirectory. Railway can't find the directory during the build.

## Solution: Set Root Directory in Railway UI

You **MUST** configure Railway to use `google-maps-scraper-main` as the root directory. This cannot be done from code - it must be set in Railway's dashboard.

### Step-by-Step Instructions:

1. **Go to Railway Dashboard**
   - Open https://railway.app
   - Navigate to your project
   - Click on your service

2. **Open Settings**
   - Click the **"Settings"** tab
   - Scroll down to find configuration options

3. **Find "Root Directory" Setting**
   - Look for **"Root Directory"**, **"Source Root"**, or **"Working Directory"**
   - This might be under:
     - **"Build"** section
     - **"General"** section  
     - **"Deploy"** section

4. **Set the Root Directory**
   - Enter: `google-maps-scraper-main`
   - Click **"Save"** or **"Update"**

5. **Trigger New Build**
   - Railway should automatically trigger a new deployment
   - Or manually go to **"Deployments"** → **"Redeploy"**

## Alternative: Move Files to Root (Not Recommended)

If you can't find the root directory setting, you could move all files from `google-maps-scraper-main/` to the repository root, but this would require significant restructuring.

## Why This Is Needed

Railway clones your repository and builds from the root by default. Since your Dockerfile references `google-maps-scraper-main/` subdirectory, Railway needs to know that's where your application lives.

**Setting the root directory tells Railway: "Build from this subdirectory, not the repo root."**

## After Setting Root Directory

Once you set the root directory to `google-maps-scraper-main`:
- Railway will use `google-maps-scraper-main/Dockerfile` (not the root one)
- The build context will be `google-maps-scraper-main/`
- All `COPY` commands in the Dockerfile will work correctly
- Files like `go.mod`, `go.sum`, `requirements.txt` will be found

You can then remove the root `Dockerfile` and use the one in `google-maps-scraper-main/` instead.

