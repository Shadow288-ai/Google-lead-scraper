import { useState, useEffect, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Home() {
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');
  const [maxResults, setMaxResults] = useState(50);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scrapingStatus, setScrapingStatus] = useState(null);
  
  // Autocomplete states
  const [keywordSuggestions, setKeywordSuggestions] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showKeywordSuggestions, setShowKeywordSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const keywordInputRef = useRef(null);
  const cityInputRef = useRef(null);
  const keywordSuggestionsRef = useRef(null);
  const citySuggestionsRef = useRef(null);

  // Fetch keyword suggestions
  useEffect(() => {
    if (keyword.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const response = await fetch(`${API_URL}/api/suggestions/categories?q=${encodeURIComponent(keyword)}`);
          const data = await response.json();
          setKeywordSuggestions(data.suggestions || []);
          setShowKeywordSuggestions(true);
        } catch (err) {
          console.error('Error fetching keyword suggestions:', err);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setKeywordSuggestions([]);
      setShowKeywordSuggestions(false);
    }
  }, [keyword]);

  // Fetch city suggestions
  useEffect(() => {
    if (city.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const response = await fetch(`${API_URL}/api/suggestions/locations?q=${encodeURIComponent(city)}`);
          const data = await response.json();
          setCitySuggestions(data.suggestions || []);
          setShowCitySuggestions(true);
        } catch (err) {
          console.error('Error fetching city suggestions:', err);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
    }
  }, [city]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (keywordSuggestionsRef.current && !keywordSuggestionsRef.current.contains(event.target) && 
          keywordInputRef.current && !keywordInputRef.current.contains(event.target)) {
        setShowKeywordSuggestions(false);
      }
      if (citySuggestionsRef.current && !citySuggestionsRef.current.contains(event.target) &&
          cityInputRef.current && !cityInputRef.current.contains(event.target)) {
        setShowCitySuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeywordSelect = (value) => {
    setKeyword(value);
    setShowKeywordSuggestions(false);
  };

  const handleCitySelect = (value) => {
    setCity(value);
    setShowCitySuggestions(false);
  };

  const handleScrape = async (e) => {
    e.preventDefault();
    
    if (!keyword.trim() || !city.trim()) {
      setError('Please enter both keyword and city');
      return;
    }

    setLoading(true);
    setError(null);
    setScrapingStatus('Starting scrape... Fetching businesses from Google Maps...');
    setResults([]);

    try {
      const response = await fetch(`${API_URL}/api/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: keyword.trim(),
          city: city.trim(),
          maxResults: maxResults || 0
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Scraping failed');
      }

      setScrapingStatus('Scraping in progress... Fetching businesses from Google Maps, then extracting emails from websites. This may take several minutes.');

      // Poll for results (since scraping is async)
      const searchKeyword = keyword.trim();
      const searchCity = city.trim();
      pollForResults(searchKeyword, searchCity);

    } catch (err) {
      setError(err.message);
      setLoading(false);
      setScrapingStatus(null);
    }
  };

  const pollForResults = async (searchKeyword, searchCity) => {
    const maxAttempts = 120; // 10 minutes max (120 attempts * 5 seconds)
    let attempts = 0;
    let lastCount = 0;

    const poll = setInterval(async () => {
      attempts++;
      
      try {
        const response = await fetch(
          `${API_URL}/api/results?keyword=${encodeURIComponent(searchKeyword)}&city=${encodeURIComponent(searchCity)}`
        );
        const data = await response.json();

        const currentCount = data.results ? data.results.length : 0;
        
        // Update results if we have any
        if (currentCount > 0) {
          setResults(data.results);
          
          // If count increased, we're still processing
          if (currentCount > lastCount) {
            lastCount = currentCount;
            setScrapingStatus(`Found ${currentCount} result${currentCount !== 1 ? 's' : ''} with emails (still scraping... ${Math.floor(attempts * 5 / 60)} minutes)`);
          } else if (attempts > 10) {
            // If count hasn't changed in a while and we have results, likely done
            setLoading(false);
            setScrapingStatus(`Scraping completed! Found ${currentCount} result${currentCount !== 1 ? 's' : ''} with emails.`);
            clearInterval(poll);
          }
        } else if (attempts >= maxAttempts) {
          setScrapingStatus('Scraping completed. No results found with emails.');
          setLoading(false);
          clearInterval(poll);
        } else if (attempts % 6 === 0) {
          // Update status every 30 seconds to show we're still working
          setScrapingStatus(`Still scraping... (${Math.floor(attempts * 5 / 60)} minutes elapsed)`);
        }
      } catch (err) {
        console.error('Error polling results:', err);
        if (attempts >= maxAttempts) {
          setError('Failed to fetch results');
          setLoading(false);
          clearInterval(poll);
        }
      }
    }, 5000); // Poll every 5 seconds
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (city) params.append('city', city);

      const response = await fetch(`${API_URL}/api/export?${params.toString()}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${keyword || 'all'}-${city || 'all'}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export CSV');
    }
  };

  const handleClearResults = async () => {
    if (confirm('Clear all results from database?')) {
      try {
        await fetch(`${API_URL}/api/results`, { method: 'DELETE' });
        setResults([]);
        setError(null);
      } catch (err) {
        setError('Failed to clear results');
      }
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Google Maps → Website → Email Extractor</h1>
        <p className="subtitle">Extract business emails from Google Maps listings</p>
      </header>

      <main>
        <form onSubmit={handleScrape} className="search-form">
          <div className="form-group">
            <label htmlFor="keyword">
              Category / Keyword *
            </label>
            <div className="autocomplete-wrapper" ref={keywordSuggestionsRef}>
              <input
                ref={keywordInputRef}
                id="keyword"
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onFocus={() => keyword.length >= 2 && setShowKeywordSuggestions(true)}
                placeholder="e.g., HVAC contractor, Restaurant, Doctor"
                required
                disabled={loading}
                autoComplete="off"
              />
              {showKeywordSuggestions && keywordSuggestions.length > 0 && (
                <ul className="suggestions-list">
                  {keywordSuggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      onClick={() => handleKeywordSelect(suggestion)}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="city">
              Location / City / Postal Code *
            </label>
            <div className="autocomplete-wrapper" ref={citySuggestionsRef}>
              <input
                ref={cityInputRef}
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onFocus={() => city.length >= 2 && setShowCitySuggestions(true)}
                placeholder="e.g., Florida, Miami, FL, 33101"
                required
                disabled={loading}
                autoComplete="off"
              />
              {showCitySuggestions && citySuggestions.length > 0 && (
                <ul className="suggestions-list">
                  {citySuggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      onClick={() => handleCitySelect(suggestion)}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="maxResults">
              Max Results (0 = unlimited)
            </label>
            <input
              id="maxResults"
              type="number"
              value={maxResults}
              onChange={(e) => setMaxResults(parseInt(e.target.value) || 0)}
              min="0"
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Fetching...' : 'Start Fetching'}
          </button>
        </form>

        {scrapingStatus && (
          <div className="status-message">
            {scrapingStatus}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="results-section">
            <div className="results-header">
              <h2>Results ({results.length})</h2>
              <div className="results-actions">
                <button onClick={handleExportCSV} className="btn-secondary">
                  Export CSV
                </button>
                <button onClick={handleClearResults} className="btn-danger">
                  Clear All
                </button>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Business Name</th>
                    <th>Website</th>
                    <th>Email</th>
                    <th>Category</th>
                    <th>City</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index}>
                      <td>{result.business_name}</td>
                      <td>
                        <a 
                          href={result.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {result.website}
                        </a>
                      </td>
                      <td>{result.email}</td>
                      <td>{result.category || '-'}</td>
                      <td>{result.city}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer>
        <p className="disclaimer">
          <strong>Disclaimer:</strong> Users are responsible for compliance with all applicable laws and regulations, 
          including GDPR, CAN-SPAM, and other data protection and email marketing laws. This tool is for legitimate 
          business purposes only.
        </p>
      </footer>
    </div>
  );
}
