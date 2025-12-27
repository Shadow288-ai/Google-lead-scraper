# Google Maps → Website → Email Extractor

A realistic MVP for extracting business emails from Google Maps listings by discovering businesses and scraping their websites.

## ⚠️ Important Disclaimers

**Legal Notice:** Users are responsible for compliance with all applicable laws and regulations, including GDPR, CAN-SPAM, and other data protection and email marketing laws. This tool is for legitimate business purposes only.

**Reality Check:**
- Expect **30-60% email coverage**, not 100%
- Some niches have poor email availability (plumbers, solo trades)
- Corporate chains often block crawlers
- Google Maps throttles aggressive scraping

## How It Works

1. **Input with Autosuggestions**: Enter category/keyword and location (with autocomplete suggestions for cities, states, postal codes)
2. **Google Maps Discovery**: Scrapes Google Maps for business listings (name, website, category, address, phone)
3. **Website Crawling**: Visits each business website and extracts contact information (emails) from common pages
4. **Email Filtering**: Filters out generic/personal emails (gmail, yahoo, noreply, etc.)
5. **Results Display**: Shows list of businesses with emails and company info
6. **CSV Export**: Exports verified business emails with metadata

**Key Principle:** We scrape emails from business websites, NOT from Google Maps directly.

## Tech Stack

- **Backend**: Node.js + Express
- **Scraping**: Playwright (browser automation)
- **HTML Parsing**: Cheerio
- **Database**: SQLite (with deduplication)
- **Frontend**: Next.js + React
- **Queue**: Simple in-memory queue (upgrade to BullMQ for production)

## Installation

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Install Playwright browsers:**

```bash
npm run install-browsers
```

3. **Create data directory (for SQLite database):**

```bash
mkdir -p data
```

## Usage

### Development Mode

1. **Start the backend server:**

```bash
npm run server
```

The server runs on `http://localhost:3001`

2. **Start the frontend (in another terminal):**

```bash
npm run dev
```

The frontend runs on `http://localhost:3000`

3. **Open your browser and use the web interface:**
   - Enter a keyword (e.g., "HVAC contractor")
   - Enter a city (e.g., "Luxembourg")
   - Click "Start Scraping"
   - Wait for results (this may take several minutes)
   - Export results as CSV

### Production Mode

1. **Build the frontend:**

```bash
npm run build
```

2. **Start both servers:**

```bash
npm start  # Frontend (Next.js)
npm run server  # Backend (Express API)
```

## API Endpoints

### POST `/api/scrape`

Start a scraping job.

**Request:**
```json
{
  "keyword": "HVAC contractor",
  "city": "Luxembourg",
  "maxResults": 50
}
```

**Response:**
```json
{
  "message": "Scraping started",
  "queuePosition": 1
}
```

### GET `/api/results`

Get scraping results.

**Query Parameters:**
- `keyword` (optional): Filter by keyword
- `city` (optional): Filter by city

**Response:**
```json
{
  "results": [
    {
      "business_name": "ABC Company",
      "website": "https://example.com",
      "email": "contact@example.com",
      "email_source_page": "https://example.com",
      "city": "Luxembourg",
      "category": "HVAC Contractor"
    }
  ],
  "count": 1
}
```

### GET `/api/export`

Export results as CSV.

**Query Parameters:**
- `keyword` (optional): Filter by keyword
- `city` (optional): Filter by city

**Response:** CSV file download

### DELETE `/api/results`

Clear all results from database.

## CSV Output Format

The exported CSV includes the following columns:

- `business_name`: Business name from Google Maps
- `website`: Business website URL
- `email`: Extracted email address
- `email_source_page`: Page where email was found
- `city`: Search city
- `category`: Business category from Google Maps

## Email Filtering

The scraper automatically filters out:

**Excluded Domains:**
- gmail.com
- yahoo.com
- hotmail.com
- outlook.com
- live.com
- msn.com
- aol.com
- icloud.com

**Excluded Patterns:**
- noreply@, no-reply@, donotreply@
- support@, info@, contact@, hello@, admin@

Only commercial business emails are included in results.

## Configuration

### Rate Limiting

The scraper includes delays to avoid rate limiting:
- 2 seconds between website scrapes
- 1 second between page requests within a website

Adjust these in `server/index.js` and `server/scrapers/emailScraper.js` if needed.

### Pages to Check

The email scraper checks these pages on each website:
- Homepage (`/`)
- `/contact`
- `/about`
- `/about-us`

Modify the `pagesToCheck` array in `server/scrapers/emailScraper.js` to add more pages.

## Limitations

1. **Google Maps DOM**: Google Maps frequently changes its DOM structure. Selectors may need updates.
2. **Email Coverage**: Not all businesses have emails on their websites.
3. **Rate Limiting**: Aggressive scraping may trigger Google Maps rate limiting.
4. **Robot.txt**: Some websites block crawlers (respect robot.txt in production).
5. **JavaScript Sites**: Some modern sites require JavaScript execution to show emails (Playwright handles this).

## Troubleshooting

**No results found / Scraping returns 0 businesses:**

This is the most common issue. Google Maps actively detects and blocks automated browsers. Try these steps:

1. **Debug what Google is showing:**
   ```bash
   npm run debug-maps "HVAC" "Florida"
   ```
   This will open a visible browser and show you what Google Maps is actually rendering. It will create:
   - `debug-screenshot.png` - Screenshot of the page
   - `debug-page.html` - Full HTML for inspection
   - Console output showing what selectors exist

2. **If Google is blocking (CAPTCHA/sorry page):**
   - Google detected automated access
   - Solutions:
     - Use a VPN or residential proxy
     - Try again later (rate limiting)
     - Use Google Maps API (paid, but reliable)
     - Consider using a service like ScraperAPI or Bright Data

3. **If page loads but no elements found:**
   - Google Maps DOM structure may have changed
   - Check `debug-page.html` to see the actual structure
   - Update selectors in `server/scrapers/mapsScraper.js`

**Scraping fails:**
- Google Maps selectors may have changed - update `mapsScraper.js`
- Check network connectivity
- Verify Playwright browsers are installed

**Database errors:**
- Ensure `data/` directory exists
- Check file permissions

## Future Improvements (Not MVP)

- [ ] Email verification API integration
- [ ] CRM integrations (Salesforce, HubSpot)
- [ ] User authentication and multi-user support
- [ ] Advanced filtering and search
- [ ] Dashboard with analytics
- [ ] Scheduled scraping jobs
- [ ] BullMQ for production queue management
- [ ] Redis for caching
- [ ] Rate limiting per domain
- [ ] Respect robots.txt

## License

MIT

## Support

This is an MVP. For production use, consider:
- Adding proper error handling and retries
- Implementing better rate limiting
- Adding monitoring and logging
- Using a proper job queue (BullMQ + Redis)
- Adding user authentication
- Implementing API rate limits
- Adding database backups

