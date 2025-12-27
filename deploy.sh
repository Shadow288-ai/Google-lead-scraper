#!/bin/bash

# Deployment script for Google Maps Scraper
# This script builds and runs the Docker container

set -e

echo "🚀 Building Google Maps Scraper Docker image..."
docker build -t google-maps-scraper .

echo "📁 Creating data directory..."
mkdir -p gmapsdata

echo "🛑 Stopping existing container (if any)..."
docker stop google-maps-scraper 2>/dev/null || true
docker rm google-maps-scraper 2>/dev/null || true

echo "▶️  Starting container..."
docker run -d \
  --name google-maps-scraper \
  -p 8080:8080 \
  -v "$(pwd)/gmapsdata:/gmapsdata" \
  -v "$(pwd)/extract_contact_emails.py:/extract_contact_emails.py" \
  -v "$(pwd)/requirements.txt:/requirements.txt" \
  --restart unless-stopped \
  -e DISABLE_TELEMETRY=1 \
  google-maps-scraper \
  -data-folder /gmapsdata

echo ""
echo "✅ Google Maps Scraper is now running!"
echo ""
echo "📍 Access the web UI at: http://localhost:8080"
echo "📊 View logs: docker logs -f google-maps-scraper"
echo "🛑 Stop: docker stop google-maps-scraper"
echo "🔄 Restart: docker restart google-maps-scraper"
echo ""

