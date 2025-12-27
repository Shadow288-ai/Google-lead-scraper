# Railway Setup Instructions

## Important: Set Root Directory in Railway

Since Railway is building from your repository root, but all files are in `google-maps-scraper-main`, you need to configure Railway's root directory.

## Step-by-Step:

### 1. In Railway Dashboard:

1. Go to your Railway project
2. Click on your service
3. Click **"Settings"** tab
4. Look for **"Root Directory"** field (might be under "Build" or "Deploy" section)
5. Set it to: `google-maps-scraper-main`
6. Click **"Save"**

### 2. Verify Files Are Committed:

Make sure these files are in git and pushed:

```bash
cd google-maps-scraper-main
git add Dockerfile go.mod go.sum railway.toml .dockerignore
git commit -m "Add Railway deployment configuration"
git push
```

### 3. Trigger New Build:

After setting the root directory, Railway should automatically rebuild. If not:
- Click **"Deployments"** tab
- Click **"Redeploy"**

## What This Does

By setting Root Directory to `google-maps-scraper-main`:
- Railway will use that directory as the build context
- Dockerfile will find `go.mod` and `go.sum` correctly
- All files will be in the expected locations

## Files in This Directory

All necessary files are here in `google-maps-scraper-main/`:
- ✅ `Dockerfile` - Docker build configuration
- ✅ `go.mod` and `go.sum` - Go dependencies
- ✅ `railway.toml` - Railway configuration
- ✅ `.dockerignore` - Docker ignore rules
- ✅ `extract_contact_emails.py` - Python script for email extraction
- ✅ `requirements.txt` - Python dependencies

Everything Railway needs is in this directory!

