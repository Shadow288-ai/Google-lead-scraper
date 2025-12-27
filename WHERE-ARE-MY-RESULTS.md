# Where Are My Results?

## Web UI Mode vs Command Line Mode

When you use the **Web UI mode**, results are saved differently than command line mode:

### Web UI Mode (What you're using):
- Results are saved in: `gmapsdata/{job-id}.csv`
- Each job gets its own CSV file named by job ID
- To download: Go to http://localhost:8080 and click "Download" on the job
- Or access directly: `google-maps-scraper-main/gmapsdata/908adcd8-865b-4878-b9e5-2a295acf01e7.csv`

### Command Line Mode:
- Results are saved to: The file you specify with `-results` flag
- Example: `-results /results.csv` saves to `results.csv`

## Your Current Results

**Latest job:** `908adcd8-865b-4878-b9e5-2a295acf01e7.csv`

**Location:** `google-maps-scraper-main/gmapsdata/908adcd8-865b-4878-b9e5-2a295acf01e7.csv`

**Found:** 3 businesses (but they're in India, not Florida!)

## Viewing Your Results

```bash
# View the latest results
cd google-maps-scraper-main
cat gmapsdata/908adcd8-865b-4878-b9e5-2a295acf01e7.csv

# Or open in Excel/Numbers
open gmapsdata/908adcd8-865b-4878-b9e5-2a295acf01e7.csv

# List all result files
ls -lh gmapsdata/*.csv
```

## Download from Web UI

1. Open http://localhost:8080
2. Find your job in the list
3. Click the "Download" button next to the job
4. CSV will download to your Downloads folder

## Important: Email Extraction

I noticed your results have `emails` column but it's empty (`null`). To extract emails:

1. **In Web UI:** Make sure "Extract Emails" checkbox is checked when creating a job
2. **In Command Line:** Add the `-email` flag

## Next Steps

1. **Check your results** - They're in `gmapsdata/` folder
2. **Fix the search location** - The query found businesses in India instead of Florida
3. **Enable email extraction** - If you want emails, make sure `-email` flag is used

