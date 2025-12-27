# Troubleshooting the Go Google Maps Scraper

## Problem: "empty business list" Error

If you're seeing errors like:
```
"error":"failed to parse search results: empty business list"
```

This means Google Maps is blocking the scraper or not returning results. Here's how to fix it:

## Solution 1: Use Debug Mode (See What's Happening)

Run the scraper with debug mode to see what Google Maps is actually showing:

```bash
cd google-maps-scraper-main

# Create queries file
echo "HVAC contractor in Florida" > my-queries.txt
touch results.csv

# Run with debug mode (opens browser window)
docker run -v $(pwd)/my-queries.txt:/queries -v $(pwd)/results.csv:/results.csv gosom/google-maps-scraper -depth 1 -input /queries -results /results.csv -exit-on-inactivity 5m -email -debug
```

The `-debug` flag will open a visible browser window so you can see if:
- Google is showing a CAPTCHA
- The page is loading but empty
- Results are loading but the scraper can't parse them

## Solution 2: Use a Proxy (Recommended)

Google Maps blocks automated browsers. Using a proxy helps bypass this:

```bash
# Example with a proxy (replace with your proxy details)
docker run -v $(pwd)/my-queries.txt:/queries -v $(pwd)/results.csv:/results.csv \
  gosom/google-maps-scraper \
  -depth 1 \
  -input /queries \
  -results /results.csv \
  -exit-on-inactivity 5m \
  -email \
  -proxies 'http://username:password@proxy-host:port'
```

**Proxy Services:**
- **Decodo** - Recommended by the scraper authors (see README for link)
- **Evomi** - $0.49/GB residential proxies
- Any residential proxy service

## Solution 3: Try Different Queries

Some queries work better than others. Try:

```bash
# Simpler query
echo "restaurants in Miami" > my-queries.txt

# Run again
docker run -v $(pwd)/my-queries.txt:/queries -v $(pwd)/results.csv:/results.csv \
  gosom/google-maps-scraper \
  -depth 1 \
  -input /queries \
  -results /results.csv \
  -exit-on-inactivity 5m
```

## Solution 4: Use Fast Mode (Beta)

Fast mode uses a different approach that might bypass some blocking:

```bash
docker run -v $(pwd)/my-queries.txt:/queries -v $(pwd)/results.csv:/results.csv \
  gosom/google-maps-scraper \
  -fast-mode \
  -zoom 15 \
  -radius 10000 \
  -geo "25.7617,-80.1918" \
  -input /queries \
  -results /results.csv \
  -exit-on-inactivity 5m
```

**Note:** Fast mode requires:
- `-geo`: Latitude,longitude (e.g., "25.7617,-80.1918" for Miami)
- `-zoom`: Zoom level (0-21, default 15)
- `-radius`: Radius in meters (default 10000)

## Solution 5: Lower Concurrency

Reduce the number of concurrent requests:

```bash
docker run -v $(pwd)/my-queries.txt:/queries -v $(pwd)/results.csv:/results.csv \
  gosom/google-maps-scraper \
  -c 1 \
  -depth 1 \
  -input /queries \
  -results /results.csv \
  -exit-on-inactivity 5m
```

The `-c 1` flag limits to 1 concurrent request (slower but less likely to be blocked).

## Solution 6: Try the Web UI with Proxies

The web UI allows you to set proxy settings:

```bash
# Start web UI
docker run -v $(pwd)/gmapsdata:/gmapsdata -p 8080:8080 \
  gosom/google-maps-scraper \
  -data-folder /gmapsdata
```

Then in the web UI at http://localhost:8080, you can:
1. Set proxy URL, username, and password
2. Add queries
3. Monitor jobs

## Solution 7: Wait and Retry

Sometimes Google temporarily blocks IPs. Try:
1. Wait 1-2 hours
2. Use a different network/VPN
3. Try again

## Most Likely Solutions

1. **Use a proxy** - This is the most reliable solution
2. **Use debug mode** - To see what Google is actually showing
3. **Lower concurrency** - Use `-c 1` to be less aggressive

## Alternative: Use the API Services

If scraping keeps failing, consider:
- **Google Maps API** (official, paid but reliable)
- **SerpApi** (Google Maps API service)
- **G Maps Extractor** (no-code solution)

These services handle the blocking for you but cost money.

