# Miami, Florida Coordinates

## Latitude and Longitude

**Miami, Florida:**
- **Latitude:** `25.7617`
- **Longitude:** `-80.1918`
- **Format:** `25.7617,-80.1918` (for the scraper)

## Using with Google Maps Scraper

### In Web UI:
1. Go to http://localhost:8080
2. When creating a job, use:
   - **Query:** `HVAC contractor` (or your search term)
   - **Latitude:** `25.7617`
   - **Longitude:** `-80.1918`
   - **Zoom:** `15` (default, good for city-level)
   - **Radius:** `10000` meters (10km, default)

### In Command Line:
```bash
docker run -v $(pwd)/my-queries.txt:/queries -v $(pwd)/results.csv:/results.csv \
  gosom/google-maps-scraper \
  -depth 1 \
  -input /queries \
  -results /results.csv \
  -exit-on-inactivity 5m \
  -email \
  -c 1 \
  -geo "25.7617,-80.1918" \
  -zoom 15 \
  -radius 10000
```

## Other Florida Cities

**Fort Lauderdale:**
- `26.1224,-80.1373`

**Tampa:**
- `27.9506,-82.4572`

**Orlando:**
- `28.5383,-81.3792`

**Jacksonville:**
- `30.3322,-81.6557`

**West Palm Beach:**
- `26.7153,-80.0534`

## Zoom Levels

- `10-12`: State/Region level
- `13-15`: City level (recommended for Miami)
- `16-17`: Neighborhood level
- `18-21`: Street level

## Radius

- `5000` meters = 5km (neighborhood)
- `10000` meters = 10km (city area) - **Recommended**
- `20000` meters = 20km (larger area)
- `50000` meters = 50km (metropolitan area)

