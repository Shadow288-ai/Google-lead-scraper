#!/usr/bin/env python3
"""
Extract contact emails from business websites and create enriched CSV
Reads Google Maps scraper CSV output and extracts emails from business websites
"""

import csv
import re
import sys
import time
import argparse
import json
from urllib.parse import urlparse, urljoin
from typing import List, Dict, Optional, Tuple
import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

# Email regex pattern
EMAIL_REGEX = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}', re.IGNORECASE)

# Excluded email domains
EXCLUDED_DOMAINS = {
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
    'msn.com', 'aol.com', 'icloud.com', 'protonmail.com', 'mail.com'
}

# Excluded email patterns
EXCLUDED_PATTERNS = [
    re.compile(r'noreply', re.IGNORECASE),
    re.compile(r'no-reply', re.IGNORECASE),
    re.compile(r'donotreply', re.IGNORECASE),
    re.compile(r'support@', re.IGNORECASE),
    re.compile(r'info@', re.IGNORECASE),
    re.compile(r'contact@', re.IGNORECASE),
    re.compile(r'hello@', re.IGNORECASE),
    re.compile(r'admin@', re.IGNORECASE),
    re.compile(r'sales@', re.IGNORECASE),
]

# Pages to check for contact information
CONTACT_PAGES = ['', '/contact', '/contact-us', '/about', '/about-us', '/team', '/staff']


def is_valid_url(url: str) -> bool:
    """Check if URL is valid"""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False


def clean_email(email: str) -> str:
    """Clean and validate email"""
    email = email.lower().strip()
    if not email or len(email) > 100:
        return None
    
    domain = email.split('@')[1] if '@' in email else ''
    if domain in EXCLUDED_DOMAINS:
        return None
    
    for pattern in EXCLUDED_PATTERNS:
        if pattern.search(email):
            return None
    
    return email if EMAIL_REGEX.match(email) else None


def extract_emails_from_html(html: str, base_url: str) -> List[Tuple[str, Optional[str]]]:
    """
    Extract emails from HTML content
    Returns list of (email, potential_name) tuples
    """
    emails_found = set()
    email_name_pairs = []
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # Extract emails from mailto links
    for link in soup.find_all('a', href=True):
        href = link.get('href', '')
        if href.startswith('mailto:'):
            email_match = re.search(EMAIL_REGEX, href)
            if email_match:
                email = clean_email(email_match.group(0))
                if email:
                    # Try to get name from link text or nearby text
                    name = extract_name_near_email(link)
                    emails_found.add(email)
                    email_name_pairs.append((email, name))
    
    # Extract emails from text content
    text_content = soup.get_text()
    for email_match in EMAIL_REGEX.finditer(text_content):
        email = clean_email(email_match.group(0))
        if email and email not in emails_found:
            emails_found.add(email)
            # Try to extract name near the email
            name = extract_name_from_context(text_content, email_match.start(), email_match.end())
            email_name_pairs.append((email, name))
    
    return email_name_pairs


def extract_name_near_email(element) -> Optional[str]:
    """Try to extract a name from an element containing an email"""
    # Check link text
    link_text = element.get_text(strip=True)
    if link_text and '@' not in link_text:
        # Might be a name
        words = link_text.split()
        if 1 <= len(words) <= 3:
            return link_text
    
    # Check parent elements
    parent = element.parent
    for _ in range(3):  # Check up to 3 levels up
        if parent:
            parent_text = parent.get_text(strip=True)
            name = extract_name_from_text(parent_text)
            if name:
                return name
            parent = parent.parent
    
    return None


def extract_name_from_context(text: str, start_pos: int, end_pos: int) -> Optional[str]:
    """Extract a potential name from text context around an email"""
    # Get context around email (100 chars before and after)
    context_start = max(0, start_pos - 100)
    context_end = min(len(text), end_pos + 100)
    context = text[context_start:context_end]
    
    # Try to find name patterns before the email
    lines = context.split('\n')
    for i, line in enumerate(lines):
        if '@' in line:
            # Check previous lines for names
            for j in range(max(0, i-2), i):
                name = extract_name_from_text(lines[j])
                if name:
                    return name
    
    return None


def extract_name_from_text(text: str) -> Optional[str]:
    """Try to extract a name from text"""
    text = text.strip()
    if not text or len(text) > 50:
        return None
    
    # Skip if contains email or URL
    if '@' in text or 'http' in text or len(text.split()) > 5:
        return None
    
    # Common name patterns
    # Look for "Name: John Doe" or "Contact: Jane Smith"
    name_patterns = [
        re.compile(r'(?:name|contact|email|reach|call)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)', re.IGNORECASE),
        re.compile(r'([A-Z][a-z]+\s+[A-Z][a-z]+)',),  # First Last
    ]
    
    for pattern in name_patterns:
        match = pattern.search(text)
        if match:
            name = match.group(1).strip()
            # Basic validation
            if 2 <= len(name) <= 30 and name.isalpha() or ' ' in name:
                return name
    
    # If text looks like a name (2-3 capitalized words)
    words = text.split()
    if 1 <= len(words) <= 3:
        if all(word[0].isupper() if word else False for word in words if word):
            return text
    
    return None


def scrape_website_for_emails(url: str, use_playwright: bool = False) -> List[Tuple[str, Optional[str]]]:
    """
    Scrape a website for contact emails
    Returns list of (email, name) tuples
    """
    if not url or not is_valid_url(url):
        return []
    
    all_emails = []
    
    try:
        if use_playwright:
            # Use Playwright for JavaScript-heavy sites
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context()
                page = context.new_page()
                
                for page_path in CONTACT_PAGES[:3]:  # Limit to first 3 pages
                    try:
                        full_url = urljoin(url, page_path)
                        page.goto(full_url, wait_until='domcontentloaded', timeout=10000)
                        time.sleep(1)  # Wait for JS to render
                        html = page.content()
                        emails = extract_emails_from_html(html, full_url)
                        all_emails.extend(emails)
                        time.sleep(1)  # Rate limiting
                    except Exception as e:
                        continue
                
                browser.close()
        else:
            # Use requests + BeautifulSoup (faster, but no JS execution)
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            
            for page_path in CONTACT_PAGES[:3]:  # Limit to first 3 pages
                try:
                    full_url = urljoin(url, page_path)
                    response = requests.get(full_url, headers=headers, timeout=10, allow_redirects=True)
                    if response.status_code == 200:
                        emails = extract_emails_from_html(response.text, full_url)
                        all_emails.extend(emails)
                    time.sleep(1)  # Rate limiting
                except Exception as e:
                    continue
    
    except Exception as e:
        print(f"Error scraping {url}: {e}", file=sys.stderr)
        return []
    
    # Deduplicate emails, keeping the first name found for each email
    email_dict = {}
    for email, name in all_emails:
        if email and email not in email_dict:
            email_dict[email] = name
    
    return [(email, email_dict[email]) for email in email_dict]


def extract_location(row: Dict) -> str:
    """Extract approximate location from CSV row"""
    parts = []
    
    # Try complete_address first (it's a JSON string)
    complete_address = row.get('complete_address', '')
    if complete_address:
        try:
            # Parse JSON structure
            addr_dict = json.loads(complete_address)
            city = addr_dict.get('city', '')
            state = addr_dict.get('state', '')
            if city:
                parts.append(city)
            if state:
                parts.append(state)
        except (json.JSONDecodeError, TypeError, AttributeError):
            pass
    
    # Fallback to address field
    if not parts:
        address = row.get('address', '')
        if address:
            # Format: "929 SW 5th St, Miami, FL 33130, United States"
            addr_parts = [p.strip() for p in address.split(',')]
            if len(addr_parts) >= 2:
                # Usually: street, city, state zip, country
                city = addr_parts[1] if len(addr_parts) > 1 else addr_parts[0]
                # Extract state from the part that has zip code (usually 3rd part)
                state = ''
                if len(addr_parts) >= 3:
                    state_zip = addr_parts[2].strip()
                    # Extract state abbreviation or full name (usually first word)
                    state_words = state_zip.split()
                    if state_words:
                        state = state_words[0]  # Usually "FL" or "Florida"
                
                if city and city not in ['United States', 'USA', 'US']:
                    parts.append(city)
                if state and state not in ['United States', 'USA', 'US']:
                    parts.append(state)
    
    return ', '.join(parts) if parts else ''


def process_csv(input_file: str, output_file: str, use_playwright: bool = False):
    """Process the input CSV and create enriched output CSV"""
    
    rows_processed = []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            company_name = row.get('title', '').strip()
            website = row.get('website', '').strip()
            phone = row.get('phone', '').strip()
            review_count = row.get('review_count', '0').strip()
            
            # Extract location
            location = extract_location(row)
            
            # Scrape website for emails
            emails_with_names = []
            if website:
                print(f"Scraping {company_name}: {website}", file=sys.stderr)
                emails_with_names = scrape_website_for_emails(website, use_playwright)
                time.sleep(2)  # Rate limiting between businesses
            
            # If no emails found, create one row with empty email
            if not emails_with_names:
                rows_processed.append({
                    'forename': '',
                    'company_name': company_name,
                    'company_location': location,
                    'google_reviews': review_count,
                    'email': '',
                    'phone_number': phone
                })
            else:
                # Create one row per email found
                for email, name in emails_with_names:
                    # Split name into forename and surname if possible
                    forename = ''
                    if name:
                        name_parts = name.split()
                        forename = name_parts[0] if name_parts else ''
                    
                    rows_processed.append({
                        'forename': forename,
                        'company_name': company_name,
                        'company_location': location,
                        'google_reviews': review_count,
                        'email': email,
                        'phone_number': phone
                    })
    
    # Write output CSV
    fieldnames = ['forename', 'company_name', 'company_location', 'google_reviews', 'email', 'phone_number']
    
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows_processed)
    
    print(f"\nProcessed {len(rows_processed)} rows", file=sys.stderr)
    print(f"Output saved to: {output_file}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(description='Extract contact emails from business websites')
    parser.add_argument('input', help='Input CSV file from Google Maps scraper')
    parser.add_argument('-o', '--output', default='enriched_leads.csv', help='Output CSV file (default: enriched_leads.csv)')
    parser.add_argument('--playwright', action='store_true', help='Use Playwright for JavaScript-heavy sites (slower but more thorough)')
    
    args = parser.parse_args()
    
    process_csv(args.input, args.output, args.playwright)


if __name__ == '__main__':
    main()

