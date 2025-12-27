# Railway Dockerfile Fix

## What Was Done

Created a wrapper `Dockerfile` at the repository root that properly handles the subdirectory structure.

### Problem
- Railway builds from the repository root
- All application files are in `google-maps-scraper-main/` subdirectory
- When `dockerfilePath` pointed to a subdirectory, the build context was still the repo root
- Dockerfile couldn't find `go.mod` and `go.sum` because they're in the subdirectory

### Solution
Created a `Dockerfile` at the repo root that:
1. Copies files from `google-maps-scraper-main/` subdirectory using `COPY google-maps-scraper-main/...`
2. Builds the Go application correctly
3. Includes all the same stages (Playwright dependencies, Python for email extraction)
4. Uses the same CMD to run the web server

### Files Created
- ✅ `Dockerfile` (at repo root) - Wrapper that handles subdirectory structure
- ✅ `railway.toml` (at repo root) - Points to `Dockerfile` in root

### Next Steps

1. **Commit and push these files:**
   ```bash
   git add Dockerfile railway.toml
   git commit -m "Add Railway Dockerfile at root for deployment"
   git push
   ```

2. **Railway will automatically:**
   - Find `Dockerfile` at the repo root
   - Build successfully with all files from `google-maps-scraper-main/`
   - Deploy your application

No Railway UI configuration needed - the files at the root will be used automatically!

