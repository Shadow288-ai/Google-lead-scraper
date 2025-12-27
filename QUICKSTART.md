# Quick Start Guide

## 1. Install Dependencies

```bash
npm install
npm run install-browsers
```

## 2. Start Backend Server

```bash
npm run server
```

Backend runs on `http://localhost:3001`

## 3. Start Frontend (in a new terminal)

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

## 4. Use the Application

1. Open `http://localhost:3000` in your browser
2. Enter a keyword (e.g., "HVAC contractor")
3. Enter a city (e.g., "Luxembourg")
4. Click "Start Scraping"
5. Wait for results (may take 5-10 minutes depending on number of businesses)
6. Export results as CSV

## Notes

- **First run**: The `data/` directory and SQLite database will be created automatically
- **Google Maps selectors**: If scraping fails, Google Maps may have changed their DOM. Update selectors in `server/scrapers/mapsScraper.js`
- **Rate limiting**: Built-in delays prevent aggressive scraping. Adjust in code if needed.
- **Email coverage**: Expect 30-60% of businesses to have extractable emails. Not all websites list emails publicly.

## Troubleshooting

**No results?**
- Check browser console (F12) for errors
- Verify backend server is running
- Check terminal output for scraping errors
- Google Maps selectors may need updating

**Scraping too slow?**
- This is normal. Each website takes 2-5 seconds to scrape
- 50 businesses = 2-4 minutes minimum
- Reduce `maxResults` for faster testing

**Database errors?**
- Ensure `data/` directory exists and is writable
- Delete `data/leads.db` to reset database

