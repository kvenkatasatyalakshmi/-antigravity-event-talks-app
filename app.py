import re
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_notes():
    try:
        # Request with User-Agent to avoid getting blocked
        req = urllib.request.Request(
            FEED_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req) as response:
            xml_data = response.read()
            
        # Parse Atom Feed XML
        root = ET.fromstring(xml_data)
        
        # Atom Namespace
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        all_updates = []
        
        for entry in root.findall('atom:entry', ns):
            # Title is typically the date in this feed, e.g., "June 15, 2026"
            date = entry.find('atom:title', ns).text
            
            # Alternative Link for the entry
            link_elem = entry.find("atom:link[@rel='alternate']", ns)
            link = link_elem.attrib.get('href') if link_elem is not None else "https://cloud.google.com/bigquery/docs/release-notes"
            
            # HTML Content containing h3 (type) and details
            content_elem = entry.find('atom:content', ns)
            if content_elem is not None and content_elem.text:
                content_html = content_elem.text
                
                # Regex to find all <h3>(Type)</h3> and followed by elements until next <h3> or end of string
                # DOTALL allows dot (.) to match newlines
                pattern = re.compile(r'<h3>(.*?)</h3>(.*?)(?=<h3>|$)', re.DOTALL)
                matches = pattern.findall(content_html)
                
                for idx, (update_type, update_body) in enumerate(matches):
                    # Clean up spaces
                    update_type = update_type.strip()
                    update_body = update_body.strip()
                    
                    # Generate a unique ID for referencing/selecting
                    safe_date = re.sub(r'[^a-zA-Z0-9]', '_', date)
                    unique_id = f"{safe_date}_{idx}"
                    
                    all_updates.append({
                        'id': unique_id,
                        'date': date,
                        'type': update_type,
                        'content': update_body,
                        'link': link
                    })
        return all_updates, None
    except Exception as e:
        return [], str(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes')
def get_notes():
    updates, error = fetch_and_parse_notes()
    if error:
        return jsonify({'success': False, 'error': error}), 500
    return jsonify({'success': True, 'updates': updates})

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)

