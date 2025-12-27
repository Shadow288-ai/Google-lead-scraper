/**
 * Debug script to see what Google Maps is actually showing
 * Run with: node server/scrapers/debugMaps.js "HVAC" "Florida"
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function debugGoogleMaps(keyword, city) {
  const browser = await chromium.launch({ 
    headless: false, // Run in visible mode so you can see what's happening
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage'
    ]
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
    permissions: ['geolocation']
  });
  
  const page = await context.newPage();
  
  // Remove webdriver property
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });
  });
  
  try {
    const query = `${keyword} ${city}`;
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    
    console.log(`Navigating to: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for page to load
    await page.waitForTimeout(10000);
    
    // Get page info
    const pageTitle = await page.title();
    const pageUrl = page.url();
    console.log(`\n=== PAGE INFO ===`);
    console.log(`Title: ${pageTitle}`);
    console.log(`URL: ${pageUrl}`);
    
    // Check if blocked
    if (pageUrl.includes('sorry/index') || pageTitle.includes('Sorry') || pageUrl.includes('accounts.google.com')) {
      console.log('\n❌ BLOCKED: Google is showing CAPTCHA or blocking the request');
      console.log('You may need to:');
      console.log('1. Use a VPN or proxy');
      console.log('2. Use Google Maps API (paid)');
      console.log('3. Try again later');
      return;
    }
    
    // Take screenshot
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    console.log('\n✅ Screenshot saved to: debug-screenshot.png');
    
    // Check what selectors exist
    const pageInfo = await page.evaluate(() => {
      const info = {
        title: document.title,
        url: window.location.href,
        hasRoleArticle: document.querySelectorAll('[role="article"]').length,
        hasRoleFeed: document.querySelectorAll('[role="feed"]').length,
        hasNv2PK: document.querySelectorAll('.Nv2PK').length,
        hasPlaceLinks: document.querySelectorAll('a[href*="/maps/place/"]').length,
        hasM6QErb: document.querySelectorAll('.m6QErb').length,
        allLinks: Array.from(document.querySelectorAll('a[href*="/maps"]')).slice(0, 10).map(a => ({
          href: a.href,
          text: a.textContent?.trim().substring(0, 50)
        })),
        bodyText: document.body.innerText.substring(0, 1000),
        scripts: Array.from(document.querySelectorAll('script')).length
      };
      return info;
    });
    
    console.log('\n=== ELEMENT COUNTS ===');
    console.log(`[role="article"]: ${pageInfo.hasRoleArticle}`);
    console.log(`[role="feed"]: ${pageInfo.hasRoleFeed}`);
    console.log(`.Nv2PK: ${pageInfo.hasNv2PK}`);
    console.log(`a[href*="/maps/place/"]: ${pageInfo.hasPlaceLinks}`);
    console.log(`.m6QErb: ${pageInfo.hasM6QErb}`);
    
    console.log('\n=== FIRST 10 LINKS ===');
    pageInfo.allLinks.forEach((link, i) => {
      console.log(`${i + 1}. ${link.text} -> ${link.href}`);
    });
    
    console.log('\n=== PAGE TEXT (first 1000 chars) ===');
    console.log(pageInfo.bodyText);
    
    // Save full HTML for inspection
    const html = await page.content();
    fs.writeFileSync('debug-page.html', html);
    console.log('\n✅ Full HTML saved to: debug-page.html');
    
    // Keep browser open for manual inspection
    console.log('\n⏸️  Browser will stay open for 60 seconds for manual inspection...');
    console.log('Press Ctrl+C to close early');
    await page.waitForTimeout(60000);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await browser.close();
  }
}

// Get command line arguments
const keyword = process.argv[2] || 'HVAC';
const city = process.argv[3] || 'Florida';

console.log(`Debugging Google Maps search for: "${keyword}" in "${city}"\n`);
debugGoogleMaps(keyword, city).catch(console.error);

