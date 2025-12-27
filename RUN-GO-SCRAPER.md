# Running the Go Google Maps Scraper

This is a Go-based Google Maps scraper that works better than our Node.js version. Here's how to run it:

## Option 1: Web UI (Recommended - Easiest)

This provides a nice web interface where you can add queries and see results:

```bash
cd google-maps-scraper-main

# Create data folder for the scraper
mkdir -p gmapsdata

# Run the web UI
docker run -v $(pwd)/gmapsdata:/gmapsdata -p 8080:8080 gosom/google-maps-scraper -data-folder /gmapsdata
```

Then open your browser to: **http://localhost:8080**

You can add queries directly in the web interface!

**Note:** Results take at least 3 minutes to appear (minimum configured runtime).

## Option 2: Command Line with CSV Output

For command-line usage with a CSV file:

```bash
cd google-maps-scraper-main

# Create a queries file (if you want to customize it)
cat > my-queries.txt << EOF
HVAC contractor in Florida
restaurants in Miami
EOF

# Create output file
touch results.csv

# Run the scraper
docker run -v $(pwd)/my-queries.txt:/example-queries -v $(pwd)/results.csv:/results.csv gosom/google-maps-scraper -depth 1 -input /example-queries -results /results.csv -exit-on-inactivity 3m -email
```

**Note:** The `-email` flag enables email extraction from business websites.

## Option 3: Use the Example Queries File

The scraper comes with an example queries file:

```bash
cd google-maps-scraper-main

# Create output file
touch results.csv

# Run with example queries
docker run -v $(pwd)/example-queries.txt:/example-queries -v $(pwd)/results.csv:/results.csv gosom/google-maps-scraper -depth 1 -input /example-queries -results /results.csv -exit-on-inactivity 3m -email
```

## Parameters Explained

- `-depth 1`: Scroll depth in search results (1 = first page, higher = more results)
- `-input /example-queries`: Input file with queries (one per line)
- `-results /results.csv`: Output CSV file
- `-exit-on-inactivity 3m`: Exit after 3 minutes of inactivity
- `-email`: Enable email extraction from business websites
- `-data-folder /gmapsdata`: Data folder for web UI mode

## Integration with Our Node.js App

You could:
1. Run this Go scraper to get business data
2. Import the CSV into your Node.js app's database
3. Use your Node.js email scraper on the websites

Or better yet:
1. Use the Go scraper's REST API (runs on port 8080)
2. Integrate it with your Node.js frontend
3. Get the best of both worlds!

## REST API

When running in web UI mode, the scraper also provides a REST API:

- `POST /api/v1/jobs`: Create a new scraping job
- `GET /api/v1/jobs`: List all jobs  
- `GET /api/v1/jobs/{id}`: Get details of a specific job
- `GET /api/v1/jobs/{id}/download`: Download job results as CSV

API docs are available at: http://localhost:8080/api/docs

## Next Steps

1. **Try the Web UI first** (Option 1) - it's the easiest way to get started
2. **Check the results** - see what data it extracts
3. **Customize queries** - create your own query file
4. **Enable email extraction** - add the `-email` flag

This Go scraper is much more robust and battle-tested than our Node.js version!

