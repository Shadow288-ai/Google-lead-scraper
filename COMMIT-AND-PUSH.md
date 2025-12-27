# Files to Commit and Push for Railway Deployment

## Required Files

These files need to be committed and pushed to GitHub for Railway to build successfully:

### At Repository Root:
1. ✅ `Dockerfile` - Wrapper Dockerfile for Railway
2. ✅ `railway.toml` - Railway configuration
3. ✅ `.dockerignore` - Docker ignore rules (allows required files)

### Already Committed (in google-maps-scraper-main/):
- ✅ `google-maps-scraper-main/go.mod`
- ✅ `google-maps-scraper-main/go.sum`
- ✅ `google-maps-scraper-main/extract_contact_emails.py`
- ✅ `google-maps-scraper-main/requirements.txt`
- ✅ `google-maps-scraper-main/Dockerfile` (original, not used by Railway)

## Commands to Run:

```bash
cd /Users/alessandrogualtieri/Downloads/Google-lead-scraper

# Add the new files
git add Dockerfile railway.toml .dockerignore

# Commit
git commit -m "Add Railway deployment files at root directory"

# Push to GitHub
git push origin main
```

After pushing, Railway will automatically detect the new commit and rebuild with all the required files!

## What This Fixes

The root `Dockerfile`:
- Copies files from `google-maps-scraper-main/` subdirectory
- Includes `go.mod`, `go.sum`, source files, and Python dependencies
- Builds the Go application correctly
- Includes all necessary stages (Playwright, Python, etc.)

The `.dockerignore` at root:
- Ensures required files in `google-maps-scraper-main/` are NOT excluded
- Excludes only unnecessary files (node_modules, .git, etc.)

