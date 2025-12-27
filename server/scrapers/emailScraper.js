const cheerio = require('cheerio');
const { chromium } = require('playwright');

// Email regex pattern
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/gi;

// Domains and patterns to exclude
const EXCLUDED_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'aol.com',
  'icloud.com'
];

const EXCLUDED_PATTERNS = [
  /noreply/i,
  /no-reply/i,
  /donotreply/i,
  /support@/i,
  /info@/i,
  /contact@/i,
  /hello@/i,
  /admin@/i
];

/**
 * Scrapes emails from a business website
 * @param {string} websiteUrl - Website URL to scrape
 * @returns {Promise<Array>} Array of {email, sourcePage} objects
 */
async function scrapeEmailsFromWebsite(websiteUrl) {
  if (!websiteUrl || !isValidUrl(websiteUrl)) {
    return [];
  }

  const emails = new Set();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Pages to check for emails
    const pagesToCheck = [
      '', // Homepage
      '/contact',
      '/about',
      '/about-us',
      '/impressum',
      '/legal',
      '/imprint',
      '/kontakt'
    ];

    for (const pagePath of pagesToCheck) {
      try {
        const fullUrl = new URL(pagePath, websiteUrl).href;
        console.log(`Checking: ${fullUrl}`);
        
        const response = await page.goto(fullUrl, { 
          waitUntil: 'domcontentloaded', 
          timeout: 10000 
        });
        
        if (response && response.status() >= 400) {
          continue;
        }

        const html = await page.content();
        const foundEmails = extractEmailsFromHTML(html, fullUrl);
        
        foundEmails.forEach(email => emails.add(email));
        
        // Add delay between requests
        await page.waitForTimeout(1000);
      } catch (error) {
        // Page doesn't exist or failed to load, continue
        continue;
      }
    }

    // Filter emails
    const filteredEmails = filterEmails(Array.from(emails));
    
    return filteredEmails.map(email => ({
      email,
      sourcePage: websiteUrl // Track the website URL where email was found
    }));
  } catch (error) {
    console.error(`Error scraping emails from ${websiteUrl}:`, error.message);
    return [];
  } finally {
    await browser.close();
  }
}

/**
 * Extracts emails from HTML content
 */
function extractEmailsFromHTML(html, sourceUrl) {
  const emails = new Set();
  
  // Extract from HTML content
  const matches = html.match(EMAIL_REGEX);
  if (matches) {
    matches.forEach(email => {
      emails.add(email.toLowerCase());
    });
  }
  
  // Also check with Cheerio for better parsing
  try {
    const $ = cheerio.load(html);
    
    // Check common email-containing elements
    $('a[href^="mailto:"]').each((i, el) => {
      const href = $(el).attr('href');
      const emailMatch = href.match(/mailto:([^\?]+)/i);
      if (emailMatch) {
        emails.add(emailMatch[1].toLowerCase());
      }
    });
    
    // Check text content
    $('body').find('*').each((i, el) => {
      const text = $(el).text();
      const textMatches = text.match(EMAIL_REGEX);
      if (textMatches) {
        textMatches.forEach(email => {
          emails.add(email.toLowerCase());
        });
      }
    });
  } catch (error) {
    // If Cheerio fails, we still have regex matches
  }
  
  return Array.from(emails);
}

/**
 * Filters emails to exclude generic/personal ones
 */
function filterEmails(emails) {
  return emails.filter(email => {
    // Extract domain
    const domain = email.split('@')[1];
    if (!domain) return false;
    
    // Check excluded domains
    if (EXCLUDED_DOMAINS.some(excluded => domain === excluded)) {
      return false;
    }
    
    // Check excluded patterns
    if (EXCLUDED_PATTERNS.some(pattern => pattern.test(email))) {
      return false;
    }
    
    return true;
  });
}

/**
 * Validates if a string is a valid URL
 */
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

module.exports = { scrapeEmailsFromWebsite, filterEmails };
