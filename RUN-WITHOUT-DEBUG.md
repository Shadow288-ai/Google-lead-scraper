# Running Without Debug Mode

The `-debug` flag doesn't work in Docker because containers don't have a display server. Run in headless mode instead:

## Run Without Debug (Headless Mode)

```bash
cd google-maps-scraper-main

# Create queries file if it doesn't exist
echo "HVAC contractor in Florida" > my-queries.txt

# Create output file
touch results.csv

# Run WITHOUT debug flag (headless mode)
docker run -v $(pwd)/my-queries.txt:/queries -v $(pwd)/results.csv:/results.csv \
  gosom/google-maps-scraper \
  -depth 1 \
  -input /queries \
  -results /results.csv \
  -exit-on-inactivity 5m \
  -email
```

## Try Lower Concurrency

If you're still getting "empty business list", try with lower concurrency:

```bash
docker run -v $(pwd)/my-queries.txt:/queries -v $(pwd)/results.csv:/results.csv \
  gosom/google-maps-scraper \
  -c 1 \
  -depth 1 \
  -input /queries \
  -results /results.csv \
  -exit-on-inactivity 5m \
  -email
```

## Check Results

After it runs, check the results:

```bash
cat results.csv
```

If the CSV is empty or only has headers, Google Maps is likely blocking the scraper.

## Next Steps if Still Failing

1. **Use a proxy** - Most reliable solution
2. **Try the Web UI** - Sometimes works better
3. **Try different queries** - Some work better than others
4. **Wait and retry** - Google may have temporarily blocked your IP

