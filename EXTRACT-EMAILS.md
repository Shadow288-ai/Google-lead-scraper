# Extract Contact Emails from Business Websites

This script reads the CSV output from the Google Maps scraper and extracts contact emails from business websites.

## Installation

```bash
# Install Python dependencies
pip install -r requirements.txt

# If using --playwright flag, install browsers
playwright install chromium
```

## Usage

### Basic Usage (Fast - uses requests)

```bash
python extract_contact_emails.py input.csv -o output.csv
```

### With Playwright (Slower but handles JavaScript-heavy sites)

```bash
python extract_contact_emails.py input.csv -o output.csv --playwright
```

### Example

```bash
cd google-maps-scraper-main

# Process a results file
python ../extract_contact_emails.py gmapsdata/86400a84-7f31-4dd3-ac4e-96520cb4822b.csv -o enriched_leads.csv
```

## Output Format

The output CSV will have these columns:

- **forename**: First name of contact person (if found)
- **company_name**: Business name from Google Maps
- **company_location**: Approximate location (city, state)
- **google_reviews**: Number of Google reviews
- **email**: Contact email address
- **phone_number**: Phone number from Google Maps

## Features

- ✅ Extracts emails from business websites
- ✅ Tries to find contact person names near emails
- ✅ Filters out generic emails (gmail, yahoo, noreply, etc.)
- ✅ Checks multiple pages (homepage, /contact, /about, etc.)
- ✅ Handles JavaScript-heavy sites with Playwright option
- ✅ Rate limiting to avoid overwhelming servers
- ✅ Deduplicates emails

## Notes

- The script automatically filters out personal email domains (gmail, yahoo, etc.)
- It filters out generic addresses (noreply, support, info, etc.)
- If multiple emails are found, it creates one row per email
- If no email is found, it creates a row with empty email field
- Name extraction is not 100% accurate - it tries to find names near email addresses

## Rate Limiting

The script includes delays between requests to be respectful:
- 1-2 seconds between page requests
- 2 seconds between businesses

For large batches, consider running overnight or in smaller chunks.

