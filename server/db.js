const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data', 'leads.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_name TEXT NOT NULL,
    website TEXT,
    category TEXT,
    address TEXT,
    phone TEXT,
    city TEXT,
    keyword TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_name, website, city)
  );

  CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER,
    email TEXT NOT NULL,
    source_page TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id),
    UNIQUE(business_id, email)
  );

  CREATE INDEX IF NOT EXISTS idx_businesses_website ON businesses(website);
  CREATE INDEX IF NOT EXISTS idx_businesses_keyword ON businesses(keyword, city);
`);

module.exports = db;

