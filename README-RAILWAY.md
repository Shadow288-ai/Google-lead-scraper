# Railway Deployment - Root Directory Setup

## Quick Setup

Railway needs to know that your app is in the `google-maps-scraper-main` subdirectory.

### In Railway Dashboard:

1. **Service Settings**
   - Go to your Railway service
   - Click **Settings** tab

2. **Find Root Directory**
   - Look for **"Root Directory"** or **"Source Root"** 
   - It might be under **"Build"** section or **"General"** section

3. **Set the Path**
   - Enter: `google-maps-scraper-main`
   - Click **Save**

4. **Redeploy**
   - Railway will automatically rebuild
   - Or go to **Deployments** → **Redeploy**

## Why This Is Needed

Your repository structure:
```
your-repo/
├── railway.toml (if any)
└── google-maps-scraper-main/
    ├── Dockerfile
    ├── go.mod
    ├── go.sum
    └── railway.toml
```

Railway builds from the repo root by default, but your Dockerfile expects to build from `google-maps-scraper-main/`. Setting the Root Directory tells Railway where to find everything.

## After Setting Root Directory

Railway will:
- ✅ Use `google-maps-scraper-main/Dockerfile`
- ✅ Find `go.mod` and `go.sum` in the build context
- ✅ Build successfully
- ✅ Deploy your application

The `railway.toml` file in this directory is already configured correctly - you just need to tell Railway to use this directory as the root!

