const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const csv = require('csv-parser');

const execPromise = util.promisify(exec);

/**
 * Process CSV file using the Python email extraction script
 */
async function processCSVWithEmailExtraction(inputFile, usePlaywright = false) {
  const outputFile = path.join(__dirname, '../../temp', `enriched_${Date.now()}.csv`);
  const outputDir = path.dirname(outputFile);
  
  // Ensure temp directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const scriptPath = path.join(__dirname, '../../extract_contact_emails.py');
  const playwrightFlag = usePlaywright ? '--playwright' : '';
  
  try {
    // Run the Python script
    const { stdout, stderr } = await execPromise(
      `python3 "${scriptPath}" "${inputFile}" -o "${outputFile}" ${playwrightFlag}`.trim()
    );
    
    if (stderr && !stderr.includes('Scraping')) {
      console.error('Python script stderr:', stderr);
    }
    
    // Read the output CSV
    const results = await readCSV(outputFile);
    
    // Clean up temp file after a delay (keep it for download)
    // fs.unlinkSync(outputFile); // Commented out - keep file for download
    
    return {
      success: true,
      outputFile,
      results,
      count: results.length
    };
  } catch (error) {
    console.error('Error running email extraction:', error);
    return {
      success: false,
      error: error.message,
      results: [],
      count: 0
    };
  }
}

/**
 * Read CSV file and return array of objects
 */
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    if (!fs.existsSync(filePath)) {
      resolve([]);
      return;
    }
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

/**
 * Filter results based on criteria
 */
function filterResults(results, filters) {
  let filtered = [...results];
  
  // Filter out businesses without emails
  if (filters.excludeNoEmail) {
    filtered = filtered.filter(row => row.email && row.email.trim() !== '');
  }
  
  // Filter by minimum reviews
  if (filters.minReviews) {
    filtered = filtered.filter(row => {
      const reviews = parseInt(row.google_reviews) || 0;
      return reviews >= filters.minReviews;
    });
  }
  
  // Filter by location (contains text)
  if (filters.location) {
    const locationLower = filters.location.toLowerCase();
    filtered = filtered.filter(row => {
      const location = (row.company_location || '').toLowerCase();
      return location.includes(locationLower);
    });
  }
  
  return filtered;
}

module.exports = {
  processCSVWithEmailExtraction,
  readCSV,
  filterResults
};

