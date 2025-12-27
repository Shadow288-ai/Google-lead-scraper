# Railway Deployment Guide

## Quick Fix for Python Detection Issue

Railway is detecting Python instead of Docker. Here's how to fix it:

### Option 1: Force Docker Build (Recommended)

1. **In Railway Dashboard:**
   - Go to your service settings
   - Click on "Settings" tab
   - Under "Build & Deploy", change "Build Command" to: (leave empty)
   - Change "Start Command" to: (leave empty)
   - Under "Builder", select **"Dockerfile"** (not Nixpacks)

2. **Or use the railway.toml file** (already created in the repo):
   - Railway should automatically detect `railway.toml`
   - If not, manually select Dockerfile builder in settings

### Option 2: Rename Python Files (Temporary Workaround)

If Railway keeps detecting Python, temporarily rename:

```bash
# Rename these files (Railway will ignore them)
mv requirements.txt requirements.txt.bak
mv extract_contact_emails.py extract_contact_emails.py.bak
```

Then after Railway detects Docker, you can restore them. The Dockerfile copies them anyway.

### Option 3: Manual Dockerfile Selection

1. Go to Railway service settings
2. Scroll to "Build & Deploy"
3. Under "Builder", click "Change"
4. Select **"Dockerfile"** instead of "Nixpacks"
5. Save

## Environment Variables

Add these in Railway dashboard under "Variables":

- `PORT` - Railway sets this automatically, but the app uses it via `-addr ":$PORT"`
- `DISABLE_TELEMETRY=1` (optional)

## Update Dockerfile for Railway

The Dockerfile needs a small update for Railway's PORT environment variable. Update the CMD:

```dockerfile
# At the end of Dockerfile, replace ENTRYPOINT with:
CMD ["google-maps-scraper", "-data-folder", "/gmapsdata", "-addr", ":$PORT"]
```

Actually, let me check the current Dockerfile setup...

