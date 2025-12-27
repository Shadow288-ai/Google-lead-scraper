# Fixing TLS/SSL Proxy Errors

## Error: "failed to handshake: tls: invalid server key share"

This error means there's a TLS/SSL issue with your proxy connection.

## Solutions

### Solution 1: Try HTTP Proxy Instead of HTTPS

If you're using `https://` in your proxy URL, try `http://` instead:

```bash
# Instead of:
-proxies 'https://username:password@proxy.com:8080'

# Try:
-proxies 'http://username:password@proxy.com:8080'
```

### Solution 2: Try SOCKS5 Proxy

Some proxies work better with SOCKS5:

```bash
docker run -v $(pwd)/my-queries.txt:/queries -v $(pwd)/results.csv:/results.csv \
  gosom/google-maps-scraper \
  -depth 1 \
  -input /queries \
  -results /results.csv \
  -exit-on-inactivity 5m \
  -email \
  -c 1 \
  -proxies 'socks5://username:password@proxy-host:1080'
```

### Solution 3: Check Proxy Format

Make sure your proxy URL format is correct:

**Correct formats:**
- `http://username:password@host:port`
- `http://host:port` (no auth)
- `socks5://username:password@host:port`
- `socks5h://username:password@host:port`

**Common mistakes:**
- Missing `http://` or `socks5://` prefix
- Wrong port number
- Special characters in password not URL-encoded
- Extra spaces

### Solution 4: Test Proxy First

Before using with the scraper, test if your proxy works:

```bash
# Test HTTP proxy
curl -x http://username:password@proxy-host:port https://www.google.com

# Test SOCKS5 proxy
curl --socks5 username:password@proxy-host:port https://www.google.com

# If proxy works, you should see HTML output
# If it fails, you'll see connection errors
```

### Solution 5: Try Different Proxy Providers

Some free proxies have TLS issues. Try:

1. **Decodo** (recommended) - https://visit.decodo.com/APVbbx
   - Better TLS support
   - Free trial available
   - Format: `http://username:password@isp.decodo.com:10001`

2. **Evomi** - https://evomi.com
   - Good TLS support
   - Format: Check their documentation

### Solution 6: Use Proxy Without TLS Verification (Advanced)

If you have access to the scraper source code, you could disable TLS verification, but this is **NOT RECOMMENDED** for security reasons.

### Solution 7: Check Proxy Documentation

Check your proxy provider's documentation for:
- Correct endpoint format
- Supported protocols (HTTP, HTTPS, SOCKS5)
- Port numbers
- Any special configuration needed

## Example: Working Proxy Command

Here's a complete example assuming you have Decodo proxy credentials:

```bash
cd google-maps-scraper-main

# Make sure files exist
echo "HVAC contractor in Florida" > my-queries.txt
touch results.csv

# Run with HTTP proxy (not HTTPS)
docker run -v $(pwd)/my-queries.txt:/queries -v $(pwd)/results.csv:/results.csv \
  gosom/google-maps-scraper \
  -depth 1 \
  -input /queries \
  -results /results.csv \
  -exit-on-inactivity 5m \
  -email \
  -c 1 \
  -proxies 'http://YOUR_USERNAME:YOUR_PASSWORD@isp.decodo.com:10001'
```

**Note:** Notice it's `http://` not `https://` in the proxy URL.

## If Nothing Works

1. **Try without proxy first** - Just to confirm the scraper works:
   ```bash
   docker run -v $(pwd)/my-queries.txt:/queries -v $(pwd)/results.csv:/results.csv \
     gosom/google-maps-scraper \
     -depth 1 \
     -input /queries \
     -results /results.csv \
     -exit-on-inactivity 5m \
     -c 1
   ```
   (This will likely still fail with empty results, but confirms the scraper itself works)

2. **Use a different proxy provider** - Try Decodo or Evomi

3. **Use the Web UI with proxy settings** - Sometimes the UI handles proxy configuration better:
   ```bash
   docker run -v $(pwd)/gmapsdata:/gmapsdata -p 8080:8080 \
     gosom/google-maps-scraper \
     -data-folder /gmapsdata
   ```
   Then configure proxy in the web UI at http://localhost:8080

## Quick Checklist

- [ ] Proxy URL starts with `http://` or `socks5://`
- [ ] Port number is correct
- [ ] Username and password are correct
- [ ] Proxy supports HTTPS connections (if using HTTPS sites)
- [ ] Tried both HTTP and SOCKS5 protocols
- [ ] Tested proxy with curl first
- [ ] Considered using a paid proxy service (Decodo, Evomi)

