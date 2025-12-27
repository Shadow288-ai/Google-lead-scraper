const { chromium } = require('playwright');

/**
 * Scrapes Google Maps for business listings
 * @param {string} keyword - Search keyword (e.g., "HVAC contractor")
 * @param {string} city - City name (e.g., "Luxembourg")
 * @param {number} maxResults - Maximum number of results (0 = unlimited, but be reasonable)
 * @returns {Promise<Array>} Array of business objects
 */
async function scrapeGoogleMaps(keyword, city, maxResults = 50) {
  // Use headless: 'new' for better compatibility, or false for debugging
  const browser = await chromium.launch({ 
    headless: 'new', // Use 'new' headless mode for better compatibility
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
  
  // Remove webdriver property to avoid detection
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });
  });
  
  // Set extra headers to appear more like a real browser
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  });

  try {
    // Construct search query
    const query = `${keyword} ${city}`;
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    
    console.log(`Searching Google Maps for: ${query}`);
    
    // Navigate to the page
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait a bit for the page to fully load
    await page.waitForTimeout(5000);
    
    // Check what's actually on the page
    const pageTitle = await page.title();
    const pageUrl = page.url();
    console.log(`Page loaded. Title: ${pageTitle}, URL: ${pageUrl}`);
    
    // Check if we're being blocked or redirected
    if (pageUrl.includes('sorry/index') || pageTitle.includes('Sorry') || pageUrl.includes('accounts.google.com')) {
      console.error('Google is blocking the request or showing CAPTCHA');
      throw new Error('Google Maps is blocking automated access. Please try again later or use a different approach.');
    }
    
    // Try multiple strategies to detect when results are loaded
    let resultsFound = false;
    const selectorsToTry = [
      '[role="article"]',
      '[role="feed"]',
      '.Nv2PK',
      'a[href*="/maps/place/"]',
      '[jsaction*="mouseover"]',
      '.m6QErb', // Another common Google Maps container
      '[data-value="Directions"]'
    ];
    
    // Wait for any of these selectors to appear
    for (const selector of selectorsToTry) {
      try {
        await page.waitForSelector(selector, { timeout: 8000 });
        const count = await page.$$(selector).then(el => el.length);
        console.log(`Found ${count} elements using selector: ${selector}`);
        if (count > 0) {
          resultsFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!resultsFound) {
      // Debug: Check what selectors actually exist on the page
      const debugInfo = await page.evaluate(() => {
        const info = {
          hasRoleArticle: document.querySelectorAll('[role="article"]').length,
          hasRoleFeed: document.querySelectorAll('[role="feed"]').length,
          hasNv2PK: document.querySelectorAll('.Nv2PK').length,
          hasPlaceLinks: document.querySelectorAll('a[href*="/maps/place/"]').length,
          bodyText: document.body.innerText.substring(0, 500)
        };
        return info;
      });
      console.log('Debug info:', debugInfo);
      
      // Wait a bit more and try again
      console.log('Waiting for page to load... trying alternative approach');
      await page.waitForTimeout(5000);
    }
    
    // Try scrolling to load more results (if needed)
    if (maxResults > 0 && resultsFound) {
      try {
        await scrollToLoadResults(page, maxResults);
      } catch (e) {
        console.log('Could not scroll for more results:', e.message);
      }
    }

    // Extract business data - try multiple extraction strategies
    let businesses = await extractBusinessData(page, maxResults);
    
    // If no results, try alternative extraction method
    if (businesses.length === 0) {
      console.log('Primary method found no results, trying alternative extraction method...');
      businesses = await extractBusinessDataAlternative(page, maxResults);
    }
    
    // If still no results, try one more time with a longer wait
    if (businesses.length === 0) {
      console.log('Alternative method found no results, waiting longer and retrying...');
      await page.waitForTimeout(5000);
      businesses = await extractBusinessData(page, maxResults);
    }
    
    console.log(`Found ${businesses.length} businesses`);
    return businesses;
  } catch (error) {
    console.error('Error scraping Google Maps:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Scrolls the results list to load more businesses
 */
async function scrollToLoadResults(page, maxResults) {
  const listSelector = '[role="feed"]';
  const itemSelector = '[role="article"]';
  
  let previousCount = 0;
  let currentCount = 0;
  let scrollAttempts = 0;
  const maxScrollAttempts = 10;

  do {
    previousCount = currentCount;
    currentCount = await page.$$eval(itemSelector, items => items.length);
    
    if (currentCount >= maxResults) break;
    
    // Scroll the results list
    await page.evaluate((selector) => {
      const list = document.querySelector(selector);
      if (list) {
        list.scrollTop = list.scrollHeight;
      }
    }, listSelector);
    
    // Wait for new items to load
    await page.waitForTimeout(2000);
    
    scrollAttempts++;
  } while (currentCount > previousCount && scrollAttempts < maxScrollAttempts && currentCount < maxResults);
}

/**
 * Extracts business data from the Google Maps page
 */
async function extractBusinessData(page, maxResults) {
  const businesses = [];
  
  // Try multiple selectors to find business elements
  let businessElements = [];
  const possibleSelectors = [
    '[role="article"]',
    '.Nv2PK', // Common Google Maps list item class
    'a[href*="/maps/place/"]',
    '[jsaction*="mouseover"]'
  ];
  
  for (const selector of possibleSelectors) {
    try {
      businessElements = await page.$$(selector);
      if (businessElements.length > 0) {
        console.log(`Found ${businessElements.length} businesses using selector: ${selector}`);
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (businessElements.length === 0) {
    console.log('No business elements found, trying to wait longer...');
    await page.waitForTimeout(5000);
    
    // Try all selectors again
    for (const selector of possibleSelectors) {
      try {
        businessElements = await page.$$(selector);
        if (businessElements.length > 0) {
          console.log(`Found ${businessElements.length} businesses using selector after wait: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Last resort: try to find any links to places
    if (businessElements.length === 0) {
      const placeLinks = await page.$$('a[href*="/maps/place/"]');
      console.log(`Found ${placeLinks.length} place links as last resort`);
      if (placeLinks.length > 0) {
        businessElements = placeLinks;
      }
    }
  }
  
  const limit = maxResults > 0 ? Math.min(maxResults, businessElements.length) : businessElements.length;
  
  for (let i = 0; i < limit; i++) {
    try {
      // Re-fetch elements as the DOM might have changed
      let elements = [];
      for (const selector of possibleSelectors) {
        try {
          elements = await page.$$(selector);
          if (elements.length > 0) break;
        } catch (e) {
          continue;
        }
      }
      
      if (i >= elements.length) break;
      
      const element = elements[i];
      
      // Scroll element into view
      try {
        await element.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
      } catch (e) {
        console.log(`Could not scroll element ${i}`);
      }
      
      // Click to open the business details sidebar
      try {
        await element.click({ timeout: 3000 });
        await page.waitForTimeout(2000); // Wait for sidebar to load
      } catch (e) {
        // Try clicking a link inside the element
        try {
          const link = await element.$('a');
          if (link) {
            await link.click({ timeout: 3000 });
            await page.waitForTimeout(2000);
          }
        } catch (e2) {
          console.log(`Could not click element ${i}, trying direct extraction from list`);
        }
      }
      
      // Extract business information from the sidebar/details panel
      const businessData = await page.evaluate(() => {
        const data = {};
        
        // Try multiple selectors for business name
        const nameSelectors = [
          'h1[data-attrid="title"]',
          'h1.DUwDvf',
          'h1.qrShPb',
          '[data-value="Directions"]',
          '.x3AX1-LfntMc-header-title-title'
        ];
        
        for (const selector of nameSelectors) {
          const el = document.querySelector(selector);
          if (el) {
            data.name = el.textContent?.trim() || '';
            if (data.name) break;
          }
        }
        
        // Website - look for website link
        const websiteSelectors = [
          'a[data-value="Website"]',
          'a[href*="maps/url"]',
          'a[aria-label*="Website"]',
          'a[href^="http"]:not([href*="google.com"])'
        ];
        
        for (const selector of websiteSelectors) {
          const el = document.querySelector(selector);
          if (el && el.href && !el.href.includes('google.com/maps')) {
            data.website = el.href;
            break;
          }
        }
        
        // Category
        const categorySelectors = [
          'button[data-value="Category"]',
          '[data-value="Category"]',
          'span[jsaction*="Category"]',
          '.DkE0L'
        ];
        
        for (const selector of categorySelectors) {
          const el = document.querySelector(selector);
          if (el) {
            data.category = el.textContent?.trim() || '';
            if (data.category && !data.category.includes('Category')) {
              break;
            }
          }
        }
        
        // Address
        const addressSelectors = [
          'button[data-item-id="address"]',
          '[data-item-id="address"]',
          '[data-value="Directions"] + div',
          '.Io6YTe'
        ];
        
        for (const selector of addressSelectors) {
          const el = document.querySelector(selector);
          if (el) {
            const text = el.textContent?.trim() || '';
            if (text && text.length > 10) {
              data.address = text;
              break;
            }
          }
        }
        
        // Phone
        const phoneSelectors = [
          'button[data-item-id^="phone"]',
          '[data-item-id^="phone"]',
          'a[href^="tel:"]',
          '[data-value="Phone"]'
        ];
        
        for (const selector of phoneSelectors) {
          const el = document.querySelector(selector);
          if (el) {
            const text = el.textContent?.trim() || el.href?.replace('tel:', '') || '';
            if (text && /\d/.test(text)) {
              data.phone = text;
              break;
            }
          }
        }
        
        return data;
      });
      
      // If we didn't get name from sidebar, try extracting directly from list item
      if (!businessData.name) {
        try {
          const listData = await element.evaluate((el) => {
            const getText = (selector) => {
              const elem = el.querySelector(selector);
              return elem ? elem.textContent.trim() : '';
            };
            
            const getHref = (selector) => {
              const elem = el.querySelector(selector);
              return elem ? elem.href : '';
            };
            
            // Try multiple selectors for name
            const nameSelectors = [
              'a[href*="/maps/place/"]',
              'h3',
              '.qBF1Pd',
              '[data-value="Directions"]',
              '.fontHeadlineSmall',
              'span[aria-label]'
            ];
            
            let name = '';
            for (const selector of nameSelectors) {
              name = getText(selector);
              if (name && name.length > 2) break;
            }
            
            // Try to get website from list item (rare but possible)
            const website = getHref('a[href^="http"]:not([href*="google.com"])');
            
            return {
              name: name,
              website: website,
              category: getText('.W4Efsd') || getText('.DkE0L') || getText('.fontBodyMedium'),
              address: getText('.W4Efsd') || '',
              phone: ''
            };
          });
          
          if (listData.name) {
            Object.assign(businessData, listData);
          }
        } catch (e) {
          console.log(`Error extracting from list item ${i}:`, e.message);
        }
      }
      
      // Clean website URL
      if (businessData.website) {
        // Extract actual URL from Google redirect
        if (businessData.website.includes('google.com/url?')) {
          const urlMatch = businessData.website.match(/url=([^&]+)/);
          if (urlMatch) {
            businessData.website = decodeURIComponent(urlMatch[1]);
          }
        } else if (businessData.website.includes('google.com/maps/url')) {
          // Handle Google Maps URL redirects
          try {
            const urlMatch = businessData.website.match(/url=([^&]+)/);
            if (urlMatch) {
              businessData.website = decodeURIComponent(urlMatch[1]);
            }
          } catch (e) {
            // Keep original if parsing fails
          }
        }
        
        // Ensure it's a valid URL
        if (businessData.website && !businessData.website.startsWith('http')) {
          businessData.website = 'https://' + businessData.website;
        }
      }
      
      // Only add if we have at least a name
      if (businessData.name) {
        businesses.push({
          business_name: businessData.name,
          website: businessData.website || null,
          category: businessData.category || null,
          address: businessData.address || null,
          phone: businessData.phone || null
        });
        
        console.log(`Extracted: ${businessData.name} - ${businessData.website || 'No website'}`);
      }
      
      // Small delay before next business
      await page.waitForTimeout(500);
      
    } catch (error) {
      console.error(`Error extracting business ${i}:`, error.message);
      continue;
    }
  }
  
  return businesses;
}

/**
 * Alternative extraction method for Google Maps - extracts directly from list items
 */
async function extractBusinessDataAlternative(page, maxResults) {
  const businesses = [];
  
  try {
    // Wait a bit more for page to load
    await page.waitForTimeout(5000);
    
    // Try multiple selectors - be more aggressive
    let listItems = [];
    const selectors = [
      '[role="article"]',
      '.Nv2PK',
      'a[href*="/maps/place/"]',
      '[jsaction*="mouseover"]',
      '.hfpxzc', // Another Google Maps class
      '[data-value="Directions"]'
    ];
    
    for (const selector of selectors) {
      try {
        listItems = await page.$$(selector);
        if (listItems.length > 0) {
          console.log(`Alternative method found ${listItems.length} items using: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // If still no items, try to extract from the entire page structure
    if (listItems.length === 0) {
      console.log('Trying to extract from page structure...');
      const allLinks = await page.$$('a[href*="/maps/place/"]');
      console.log(`Found ${allLinks.length} place links on page`);
      listItems = allLinks;
    }
    
    const limit = maxResults > 0 ? Math.min(maxResults, listItems.length) : listItems.length;
    
    for (let i = 0; i < limit; i++) {
      try {
        const item = listItems[i];
        await item.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        
        const data = await item.evaluate((el) => {
          const getText = (selector) => {
            try {
              const elem = el.querySelector(selector);
              return elem ? elem.textContent.trim() : '';
            } catch (e) {
              return '';
            }
          };
          
          const getHref = (selector) => {
            try {
              const elem = el.querySelector(selector);
              return elem ? elem.href : '';
            } catch (e) {
              return '';
            }
          };
          
          // If the element itself is a link, get text from it
          let name = '';
          if (el.tagName === 'A' && el.href && el.href.includes('/maps/place/')) {
            name = el.textContent?.trim() || el.innerText?.trim() || '';
          }
          
          // Try multiple selectors for business name
          if (!name || name.length < 2) {
            const nameSelectors = [
              'a[href*="/maps/place/"]',
              'h3',
              '.qBF1Pd',
              '[data-value="Directions"]',
              '.fontHeadlineSmall',
              'span[aria-label]',
              'div[aria-label]',
              '.qBF1Pd.fontHeadlineSmall',
              'div.DUwDvf'
            ];
            
            for (const selector of nameSelectors) {
              name = getText(selector);
              if (name && name.length > 2) break;
            }
          }
          
          // If still no name, try parent element
          if (!name || name.length < 2) {
            const parent = el.parentElement;
            if (parent) {
              name = parent.textContent?.trim().split('\n')[0] || '';
            }
          }
          
          // Try to find website link
          const website = getHref('a[data-value="Website"]') || 
                         getHref('a[href^="http"]:not([href*="google.com"])') || '';
          
          return {
            name: name || '',
            website: website,
            category: getText('.W4Efsd') || getText('.DkE0L') || getText('.fontBodyMedium') || '',
            address: '',
            phone: ''
          };
        });
        
        if (data.name) {
          businesses.push({
            business_name: data.name,
            website: data.website || null,
            category: data.category || null,
            address: data.address || null,
            phone: data.phone || null
          });
        }
      } catch (error) {
        continue;
      }
    }
  } catch (error) {
    console.error('Alternative extraction failed:', error.message);
  }
  
  return businesses;
}

module.exports = { scrapeGoogleMaps };

