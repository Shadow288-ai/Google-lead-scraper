# Troubleshooting Guide

## Google Maps Returns 0 Results

This is the #1 issue with Google Maps scraping. Here's how to diagnose and fix it:

### Step 1: Debug What's Actually Happening

Run the debug script to see what Google Maps is showing:

```bash
npm run debug-maps "HVAC" "Florida"
```

This will:
- Open a visible browser window
- Show you what Google Maps is actually rendering
- Create `debug-screenshot.png` and `debug-page.html`
- Print detailed information about what elements exist

### Step 2: Interpret the Results

#### If you see "Sorry" or CAPTCHA:
**Problem:** Google detected automated access and blocked you.

**Solutions:**
1. **Use a VPN** - Change your IP address
2. **Use residential proxies** - Services like Bright Data, Smartproxy
3. **Wait and retry** - Google may have rate-limited your IP
4. **Use Google Maps API** - Official API (paid, but reliable)

#### If page loads but no elements found:
**Problem:** Google Maps DOM structure changed or is different than expected.

**Solutions:**
1. Open `debug-page.html` in a browser
2. Use browser DevTools to inspect the page structure
3. Find the actual selectors for business listings
4. Update `server/scrapers/mapsScraper.js` with new selectors

#### If selectors exist but extraction fails:
**Problem:** The extraction logic needs adjustment.

**Solutions:**
1. Check the console output for which selector worked
2. Verify the extraction logic matches the actual DOM structure
3. Test selectors manually in browser DevTools

### Step 3: Alternative Approaches

If scraping Google Maps directly is too unreliable:

1. **Google Maps API (Official)**
   - Paid service but very reliable
   - Get API key from Google Cloud Console
   - Rate limits but no blocking
   - Cost: ~$5-7 per 1000 requests

2. **Scraping Services**
   - ScraperAPI - Handles blocking and CAPTCHAs
   - Bright Data - Enterprise scraping platform
   - Apify - Pre-built Google Maps scrapers

3. **Manual/Automated Hybrid**
   - Use browser extensions to export data
   - Use tools like Outscraper, Maps Extractor
   - Then use this tool to extract emails from websites

### Step 4: Optimize Your Scraper

If you want to continue scraping directly:

1. **Slow down requests** - Add longer delays
2. **Use residential proxies** - Rotate IPs
3. **Randomize user agents** - Vary browser fingerprints
4. **Handle CAPTCHAs** - Use 2Captcha or similar services
5. **Use headless: false** - Sometimes non-headless works better

### Expected Results

Even with a working scraper:
- **30-60% email coverage** is realistic
- Not all businesses have websites
- Not all websites have public emails
- Some websites block scrapers

## Still Having Issues?

1. Check the server logs for detailed error messages
2. Run the debug script and examine the output
3. Try with a simple query first ("restaurants Miami")
4. Verify your network connection
5. Check if Google Maps is accessible in your browser

## Legal Considerations

Remember:
- Scraping public data is generally legal
- But respect robots.txt and rate limits
- Google's Terms of Service prohibit scraping
- Use responsibly and ethically
- Consider using official APIs for production use

