const express = require('express');
const cors = require('cors');
const db = require('./db');
const { scrapeGoogleMaps } = require('./scrapers/mapsScraper');
const { scrapeEmailsFromWebsite } = require('./scrapers/emailScraper');
const { createCSV } = require('./utils/csvExporter');
const locations = require('./data/locations.json');
const categories = require('./data/categories.json');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory queue for scraping jobs (simple queue for MVP, replace with BullMQ if needed)
const scrapingQueue = [];
let isProcessing = false;

/**
 * Process scraping jobs from the queue
 */
async function processQueue() {
  if (isProcessing || scrapingQueue.length === 0) {
    return;
  }

  isProcessing = true;
  const job = scrapingQueue.shift();

  try {
    const { keyword, city, maxResults } = job;
    
    console.log(`Processing: ${keyword} in ${city}`);
    
    // Step 1: Scrape Google Maps
    const businesses = await scrapeGoogleMaps(keyword, city, maxResults || 50);
    console.log(`Found ${businesses.length} businesses from Google Maps`);
    
    // Step 2: Save businesses to database and scrape emails
    let processedCount = 0;
    let emailCount = 0;
    
    for (const business of businesses) {
      try {
        // Check if business already exists (deduplication by name + website + city)
        const existing = db.prepare(`
          SELECT id FROM businesses 
          WHERE business_name = ? AND website = ? AND city = ?
        `).get(business.business_name, business.website || '', city);
        
        let businessId;
        
        if (existing) {
          businessId = existing.id;
          // Check if we already have emails for this business
          const existingEmails = db.prepare(`
            SELECT COUNT(*) as count FROM emails WHERE business_id = ?
          `).get(businessId);
          
          if (existingEmails.count > 0) {
            processedCount++;
            continue; // Skip if we already have emails
          }
        } else {
          // Insert business
          const insert = db.prepare(`
            INSERT INTO businesses (business_name, website, category, address, phone, city, keyword)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          const result = insert.run(
            business.business_name,
            business.website || null,
            business.category || null,
            business.address || null,
            business.phone || null,
            city,
            keyword
          );
          businessId = result.lastInsertRowid;
        }
        
        // Scrape emails if website exists
        if (business.website) {
          const emails = await scrapeEmailsFromWebsite(business.website);
          
          // Save emails to database
          if (emails.length > 0) {
            const emailInsert = db.prepare(`
              INSERT OR IGNORE INTO emails (business_id, email, source_page)
              VALUES (?, ?, ?)
            `);
            
            emails.forEach(({ email, sourcePage }) => {
              emailInsert.run(businessId, email, sourcePage);
              emailCount++;
            });
          }
        }
        
        processedCount++;
        
        // Rate limiting: delay between websites
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Error processing business ${business.business_name}:`, error.message);
        continue;
      }
    }
    
    console.log(`Job completed: ${processedCount} businesses processed, ${emailCount} emails found`);
    
  } catch (error) {
    console.error('Error processing scraping job:', error);
  } finally {
    isProcessing = false;
    
    // Process next job in queue
    if (scrapingQueue.length > 0) {
      setTimeout(processQueue, 1000);
    }
  }
}

/**
 * API endpoint to start scraping
 */
app.post('/api/scrape', async (req, res) => {
  const { keyword, city, maxResults = 50 } = req.body;
  
  if (!keyword || !city) {
    return res.status(400).json({ error: 'Keyword and city are required' });
  }
  
  // Add job to queue
  const job = {
    keyword,
    city,
    maxResults
  };
  
  scrapingQueue.push(job);
  processQueue();
  
  // Return immediately (async processing - frontend will poll /api/results)
  res.json({ 
    message: 'Scraping started', 
    queuePosition: scrapingQueue.length,
    keyword,
    city
  });
});

/**
 * API endpoint to get results from database
 */
app.get('/api/results', (req, res) => {
  const { keyword, city } = req.query;
  
  let query = `
    SELECT DISTINCT
      b.business_name,
      b.website,
      e.email,
      e.source_page as email_source_page,
      b.city,
      b.category
    FROM businesses b
    INNER JOIN emails e ON b.id = e.business_id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (keyword) {
    query += ' AND b.keyword = ?';
    params.push(keyword);
  }
  
  if (city) {
    query += ' AND b.city = ?';
    params.push(city);
  }
  
  query += ' ORDER BY b.created_at DESC';
  
  const results = db.prepare(query).all(...params);
  res.json({ results, count: results.length });
});

/**
 * API endpoint to export CSV
 */
app.get('/api/export', (req, res) => {
  const { keyword, city } = req.query;
  
  let query = `
    SELECT DISTINCT
      b.business_name,
      b.website,
      e.email,
      e.source_page as email_source_page,
      b.city,
      b.category
    FROM businesses b
    INNER JOIN emails e ON b.id = e.business_id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (keyword) {
    query += ' AND b.keyword = ?';
    params.push(keyword);
  }
  
  if (city) {
    query += ' AND b.city = ?';
    params.push(city);
  }
  
  query += ' ORDER BY b.created_at DESC';
  
  const results = db.prepare(query).all(...params);
  
  // Convert to CSV
  const csv = createCSV(results);
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="leads-${keyword || 'all'}-${city || 'all'}-${Date.now()}.csv"`);
  res.send(csv);
});

/**
 * API endpoint to clear database (for testing)
 */
app.delete('/api/results', (req, res) => {
  db.exec('DELETE FROM emails; DELETE FROM businesses;');
  res.json({ message: 'Database cleared' });
});

/**
 * API endpoint for location autosuggestions
 */
app.get('/api/suggestions/locations', (req, res) => {
  const { q } = req.query;
  const query = (q || '').toLowerCase().trim();
  
  if (!query) {
    return res.json({ suggestions: locations.common.slice(0, 20) });
  }
  
  const suggestions = [];
  
  // Search common cities
  locations.common.forEach(location => {
    if (location.toLowerCase().includes(query)) {
      suggestions.push(location);
    }
  });
  
  // Search US states and cities
  if (locations.US && locations.US.states) {
    locations.US.states.forEach(state => {
      // Match state name or code
      if (state.name.toLowerCase().includes(query) || 
          state.code.toLowerCase().includes(query)) {
        state.cities.forEach(city => {
          suggestions.push(`${city}, ${state.code}`);
        });
        
        // Also add postal codes if query matches
        if (query.length >= 3) {
          state.postalCodes.slice(0, 10).forEach(zip => {
            if (zip.includes(query)) {
              suggestions.push(`${zip}, ${state.name}`);
            }
          });
        }
      } else {
        // Check cities in state
        state.cities.forEach(city => {
          if (city.toLowerCase().includes(query)) {
            suggestions.push(`${city}, ${state.code}`);
          }
        });
      }
    });
  }
  
  res.json({ suggestions: suggestions.slice(0, 50) });
});

/**
 * API endpoint for category/keyword autosuggestions
 */
app.get('/api/suggestions/categories', (req, res) => {
  const { q } = req.query;
  const query = (q || '').toLowerCase().trim();
  
  if (!query) {
    return res.json({ suggestions: categories.categories.slice(0, 20) });
  }
  
  const suggestions = categories.categories.filter(category =>
    category.toLowerCase().includes(query)
  );
  
  res.json({ suggestions: suggestions.slice(0, 50) });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

