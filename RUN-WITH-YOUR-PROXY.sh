#!/bin/bash
# Run Google Maps scraper with your SOCKS5 proxy

cd google-maps-scraper-main

# Make sure files exist
echo "HVAC contractor in Florida" > my-queries.txt
touch results.csv

# Run with your SOCKS5 proxy
docker run -v $(pwd)/my-queries.txt:/queries -v $(pwd)/results.csv:/results.csv \
  gosom/google-maps-scraper \
  -depth 1 \
  -input /queries \
  -results /results.csv \
  -exit-on-inactivity 5m \
  -email \
  -c 1 \
  -proxies 'socks5://192.252.209.155:14455'

echo ""
echo "Done! Check results with:"
echo "cat google-maps-scraper-main/results.csv"

