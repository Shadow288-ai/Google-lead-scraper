# Why Vercel Won't Work

## Summary

**Vercel is not suitable for this application** because:

1. **Execution Time Limits**
   - Free tier: 10 seconds max per function
   - Pro tier: 60 seconds max per function
   - Your scraper runs continuously and jobs can take minutes

2. **Serverless Architecture**
   - Functions are stateless and short-lived
   - Your app needs a persistent server running continuously
   - Background worker checks for jobs every second

3. **Playwright Requirements**
   - Needs browser binaries (~500MB+)
   - Requires system dependencies
   - Not suitable for serverless functions

4. **Persistent Storage**
   - Vercel functions have no persistent filesystem
   - Your app uses SQLite and CSV files that need to persist

## Recommended Alternatives

Use one of these platforms instead:

1. **Railway** ⭐ (Already configured in this repo)
   - Docker support
   - Persistent storage
   - Free tier available

2. **Render.com**
   - Docker support
   - Free tier available
   - Persistent disks

3. **Fly.io**
   - Docker support
   - Global distribution
   - Persistent volumes

4. **DigitalOcean App Platform**
   - Docker support
   - $5/month starting price
   - Persistent storage

5. **VPS** (DigitalOcean, Linode, Vultr)
   - Full control
   - $5-10/month
   - Use Docker Compose (already configured)

