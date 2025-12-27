# Quick Start: Email Extraction

## Install Dependencies

```bash
cd /Users/alessandrogualtieri/Downloads/Google-lead-scraper

# Install Python packages
pip3 install -r requirements.txt

# (Optional) If you want to use Playwright for JS-heavy sites
playwright install chromium
```

## Run Email Extraction

### Basic Usage (Fast)

```bash
python3 extract_contact_emails.py google-maps-scraper-main/gmapsdata/86400a84-7f31-4dd3-ac4e-96520cb4822b.csv -o enriched_leads.csv
```

### With Playwright (for JavaScript-heavy sites)

```bash
python3 extract_contact_emails.py google-maps-scraper-main/gmapsdata/86400a84-7f31-4dd3-ac4e-96520cb4822b.csv -o enriched_leads.csv --playwright
```

## Output Format

The output CSV will have these columns:

- **forename**: First name of contact person (if found)
- **company_name**: Business name
- **company_location**: City, State (e.g., "Miami, Florida")
- **google_reviews**: Number of Google reviews
- **email**: Contact email address
- **phone_number**: Phone number

## Example

```bash
# Process your latest results
python3 extract_contact_emails.py \
  google-maps-scraper-main/gmapsdata/86400a84-7f31-4dd3-ac4e-96520cb4822b.csv \
  -o miami_hvac_leads.csv

# View results
cat miami_hvac_leads.csv
```

## Notes

- Filters out generic emails (gmail, yahoo, noreply, etc.)
- Tries to find contact person names near emails
- Creates one row per email found
- Includes rate limiting (2 seconds between businesses)

