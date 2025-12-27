import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ProcessPage() {
  const [scraperFiles, setScraperFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [originalResults, setOriginalResults] = useState([]); // Store unfiltered results
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    excludeNoEmail: true,
    minReviews: 0,
    location: ''
  });
  const [usePlaywright, setUsePlaywright] = useState(false);

  // Load scraper files on mount
  useEffect(() => {
    loadScraperFiles();
  }, []);

  const loadScraperFiles = async () => {
    try {
      const response = await fetch(`${API_URL}/api/scraper-files`);
      const data = await response.json();
      setScraperFiles(data.files || []);
    } catch (err) {
      console.error('Error loading scraper files:', err);
      setError('Failed to load scraper files');
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) {
      setError('Please select a CSV file to process');
      return;
    }

    setProcessing(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch(`${API_URL}/api/process-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputFile: selectedFile,
          usePlaywright,
          filters: {}
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Processing failed');
      }

      // Store original results for filtering
      setOriginalResults(data.results);
      
      // Apply filters to results
      const hasActiveFilters = filters.excludeNoEmail || filters.minReviews > 0 || filters.location.trim() !== '';
      
      if (hasActiveFilters) {
        const filterResponse = await fetch(`${API_URL}/api/filter-results`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            results: data.results,
            filters
          }),
        });
        const filterData = await filterResponse.json();
        setResults(filterData.results);
      } else {
        setResults(data.results);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleFilterChange = async () => {
    if (originalResults.length === 0) return;

    try {
      const response = await fetch(`${API_URL}/api/filter-results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results: originalResults,
          filters
        }),
      });

      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      console.error('Error filtering results:', err);
    }
  };

  const handleExportCSV = async () => {
    if (results.length === 0) {
      setError('No results to export');
      return;
    }

    try {
      // Convert results to CSV
      const headers = ['forename', 'company_name', 'company_location', 'google_reviews', 'email', 'phone_number'];
      const csvContent = [
        headers.join(','),
        ...results.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enriched_leads_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export CSV');
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Process & Extract Emails</h1>
        <p className="subtitle">Extract contact emails from scraped business data</p>
      </header>

      <nav style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ color: '#4a90e2', textDecoration: 'none' }}>
          ← Back to Scraping
        </Link>
      </nav>

      <main>
        <div className="search-form" style={{ marginBottom: '2rem' }}>
          <div className="form-group">
            <label htmlFor="fileSelect">
              Select CSV File to Process *
            </label>
            <select
              id="fileSelect"
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              disabled={processing}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            >
              <option value="">-- Select a file --</option>
              {scraperFiles.map((file) => (
                <option key={file.filename} value={file.path}>
                  {file.filename} ({(file.size / 1024).toFixed(1)} KB, {new Date(file.modified).toLocaleDateString()})
                </option>
              ))}
            </select>
            {scraperFiles.length === 0 && (
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                No CSV files found. Run a scrape job first.
              </p>
            )}
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={usePlaywright}
                onChange={(e) => setUsePlaywright(e.target.checked)}
                disabled={processing}
                style={{ marginRight: '0.5rem' }}
              />
              Use Playwright (slower but handles JavaScript-heavy sites)
            </label>
          </div>

          <button
            onClick={handleProcess}
            disabled={processing || !selectedFile}
            className="btn-primary"
          >
            {processing ? 'Processing...' : 'Process & Extract Emails'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <>
            <div className="results-section">
              <div className="results-header">
                <h2>Results ({results.length})</h2>
                <div className="results-actions">
                  <button onClick={handleExportCSV} className="btn-secondary">
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div style={{ 
                background: '#f9f9f9', 
                padding: '1rem', 
                borderRadius: '4px',
                marginBottom: '1rem'
              }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Filters</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={filters.excludeNoEmail}
                      onChange={(e) => {
                        const newFilters = { ...filters, excludeNoEmail: e.target.checked };
                        setFilters(newFilters);
                        // Apply filter immediately
                        fetch(`${API_URL}/api/filter-results`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ results: originalResults, filters: newFilters }),
                        })
                          .then(res => res.json())
                          .then(data => setResults(data.results))
                          .catch(err => console.error('Filter error:', err));
                      }}
                      style={{ marginRight: '0.5rem' }}
                    />
                    Exclude businesses without email
                  </label>
                  <div>
                    <label htmlFor="minReviews" style={{ display: 'block', marginBottom: '0.25rem' }}>
                      Min Reviews:
                    </label>
                    <input
                      id="minReviews"
                      type="number"
                      value={filters.minReviews}
                      onChange={(e) => {
                        const newFilters = { ...filters, minReviews: parseInt(e.target.value) || 0 };
                        setFilters(newFilters);
                        fetch(`${API_URL}/api/filter-results`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ results: originalResults, filters: newFilters }),
                        })
                          .then(res => res.json())
                          .then(data => setResults(data.results))
                          .catch(err => console.error('Filter error:', err));
                      }}
                      min="0"
                      style={{ width: '100px', padding: '0.5rem' }}
                    />
                  </div>
                  <div>
                    <label htmlFor="locationFilter" style={{ display: 'block', marginBottom: '0.25rem' }}>
                      Location contains:
                    </label>
                    <input
                      id="locationFilter"
                      type="text"
                      value={filters.location}
                      onChange={(e) => {
                        const newFilters = { ...filters, location: e.target.value };
                        setFilters(newFilters);
                        // Debounce location filter
                        clearTimeout(window.locationFilterTimeout);
                        window.locationFilterTimeout = setTimeout(() => {
                          fetch(`${API_URL}/api/filter-results`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ results: originalResults, filters: newFilters }),
                          })
                            .then(res => res.json())
                            .then(data => setResults(data.results))
                            .catch(err => console.error('Filter error:', err));
                        }, 300);
                      }}
                      placeholder="e.g., Miami"
                      style={{ width: '150px', padding: '0.5rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Forename</th>
                      <th>Company Name</th>
                      <th>Location</th>
                      <th>Reviews</th>
                      <th>Email</th>
                      <th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, index) => (
                      <tr key={index}>
                        <td>{result.forename || '-'}</td>
                        <td>{result.company_name}</td>
                        <td>{result.company_location || '-'}</td>
                        <td>{result.google_reviews || '0'}</td>
                        <td>
                          {result.email ? (
                            <a href={`mailto:${result.email}`}>{result.email}</a>
                          ) : (
                            <span style={{ color: '#999' }}>No email</span>
                          )}
                        </td>
                        <td>{result.phone_number || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

