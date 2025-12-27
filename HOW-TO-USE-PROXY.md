# How to Use a Proxy with the Google Maps Scraper

Google Maps is blocking the scraper, which is why results.csv is empty. Using a proxy helps bypass this.

## Quick Start: Getting a Proxy

You have several options:

### Option 1: Free/Quick Test Proxies

**Warning:** Free proxies are often unreliable and slow, but good for testing.

You can find free proxy lists at:
- https://www.proxy-list.download/
- https://free-proxy-list.net/
- https://www.proxyscrape.com/free-proxy-list

**Format needed:** `http://ip:port` or `http://username:password@ip:port`

### Option 2: Paid Proxy Services (Recommended)

The scraper authors recommend these services:

1. **Decodo** - Fast response times, 125M+ IP pool
   - Link: https://visit.decodo.com/APVbbx
   - 3-day free trial with 100MB
   - See: `google-maps-scraper-main/decodo.md` for setup

2. **Evomi** - Swiss quality, $0.49/GB
   - Link: https://evomi.com
   - Free trial available

3. **Bright Data** - Enterprise grade
   - Most reliable but expensive
   - https://brightdata.com

## How to Use Proxy with Docker Command

### Basic Syntax

```bash
docker run -v $(pwd)/my-queries.txt:/queries -v $(pwd)/results.csv:/results.csv \
  gosom/google-maps-scraper \
  -depth 1 \
  -input /queries \
  -results /results.csv \
  -exit-on-inactivity 5m \
  -email \
  -proxies 'http://username:password@proxy-host:port'
```

### Example 1: HTTP Proxy (No Authentication)

```bash
cd google-maps-scraper-main
touch results.csv

docker run -v $(pwd)/my-queries.txt:/queries -v $(pwd)/results.csv:/results.csv \
  gosom/google-maps-scraper \
  -depth 1 \
  -input /queries \
  -results /results.csv \
  -exit-on-inactivity 5m \
  -email \
  -c 1 \
  -proxies 'http://123.45.67.89:8080'
```

### Example 2: HTTP Proxy (With Authentication)

```bash
docker run -v $(pwd)/my-queries.txt:/queries -v $(pwd)/results.csv:/results.csv \
  gosom/google-maps-scraper \
  -depth 1 \
  -input /queries \
  -results /results.csv \
  -exit-on-inactivity 5m \
  -email \
  -c 1 \
  -proxies 'http://myusername:mypassword@proxy.example.com:8080'
```

### Example 3: SOCKS5 Proxy

```bash
docker run -v $(pwd)/my-queries.txt:/queries -v $(pwd)/results.csv:/results.csv \
  gosom/google-maps-scraper \
  -depth 1 \
  -input /queries \
  -results /results.csv \
  -exit-on-inactivity 5m \
  -email \
  -c 1 \
  -proxies 'socks5://username:password@proxy.example.com:1080'
```

### Example 4: Multiple Proxies (Rotate Between Them)

```bash
docker run -v $(pwd)/my-queries.txt:/queries -v $(pwd)/results.csv:/results.csv \
  gosom/google-maps-scraper \
  -depth 1 \
  -input /queries \
  -results /results.csv \
  -exit-on-inactivity 5m \
  -email \
  -c 1 \
  -proxies 'http://proxy1.example.com:8080,http://proxy2.example.com:8080,http://proxy3.example.com:8080'
```

## Using Proxy with Web UI

You can also set proxy in the Web UI:

1. Start the web UI:
```bash
cd google-maps-scraper-main
mkdir -p gmapsdata

docker run -v $(pwd)/gmapsdata:/gmapsdata -p 8080:8080 \
  gosom/google-maps-scraper \
  -data-folder /gmapsdata
```

2. Open http://localhost:8080
3. In the web interface, you'll find proxy settings where you can enter:
   - Proxy URL
   - Username (if needed)
   - Password (if needed)

## Recommended: Decodo Proxy Setup

If you sign up for Decodo (recommended by scraper authors):

1. Sign up at: https://visit.decodo.com/APVbbx (3-day free trial)
2. Get your proxy credentials from the dashboard
3. Use format: `http://username:password@proxy.decodo.com:8080`

Example:
```bash
docker run -v $(pwd)/my-queries.txt:/queries -v $(pwd)/results.csv:/results.csv \
  gosom/google-maps-scraper \
  -depth 1 \
  -input /queries \
  -results /results.csv \
  -exit-on-inactivity 5m \
  -email \
  -c 1 \
  -proxies 'http://YOUR_DECODO_USERNAME:YOUR_DECODO_PASSWORD@proxy.decodo.com:8080'
```

## Testing Your Proxy

Before using with the scraper, test if your proxy works:

```bash
# Test HTTP proxy
curl -x http://proxy-ip:port https://api.ipify.org

# Test authenticated proxy
curl -x http://username:password@proxy-ip:port https://api.ipify.org
```

This should return your proxy's IP address, not your real IP.

## Important Notes

1. **Residential proxies are best** - They're less likely to be blocked than datacenter proxies
2. **Rate limiting** - Even with proxies, don't scrape too aggressively
3. **Keep `-c 1`** - Low concurrency helps avoid detection
4. **Cost** - Good proxies cost money, but they're essential for reliable scraping

## Troubleshooting

**Proxy not working?**
- Check proxy credentials are correct
- Verify proxy is accessible from your network
- Try a different proxy
- Test proxy with curl first

**Still getting empty results?**
- Try a different proxy provider
- Lower concurrency further (already at -c 1)
- Try simpler queries first
- Wait a bit and retry

## Quick Test Command

Once you have a proxy, test it:

```bash
cd google-maps-scraper-main
echo "restaurants in Miami" > test-queries.txt
touch test-results.csv

docker run -v $(pwd)/test-queries.txt:/queries -v $(pwd)/test-results.csv:/results.csv \
  gosom/google-maps-scraper \
  -depth 1 \
  -input /queries \
  -results /results.csv \
  -exit-on-inactivity 5m \
  -c 1 \
  -proxies 'YOUR_PROXY_URL_HERE'

# Check results
cat test-results.csv
```

If test-results.csv has data, your proxy is working!

