/**
 * Creates CSV content from results array
 */
function createCSV(results) {
  if (results.length === 0) {
    return '';
  }
  
  // CSV headers
  const headers = [
    'business_name',
    'website',
    'email',
    'email_source_page',
    'city',
    'category'
  ];
  
  // Create header row
  let csv = headers.join(',') + '\n';
  
  // Add data rows
  results.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape commas and quotes in CSV
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csv += values.join(',') + '\n';
  });
  
  return csv;
}

module.exports = { createCSV };

