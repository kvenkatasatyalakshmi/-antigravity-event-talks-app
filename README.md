# BigQuery Release Notes Explorer

A premium, glassmorphic dark-themed web application built using **Python Flask** and vanilla **HTML, CSS, and JavaScript** that fetches, parses, and visualizes the latest release notes for Google Cloud BigQuery.

👉 Live Local URL: [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## Features

- **Live RSS/Atom Parser**: Dynamically pulls feed updates directly from the official Google Cloud Feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`).
- **Interactive UI & Filtering**: 
  - **Category Pills**: Toggle quickly between *Features*, *Changes*, *Issues*, and *Deprecations*.
  - **Dynamic Search**: Live search through release notes using keywords (e.g., Gemini, SQL, quota).
- **Draft & Share (Tweet)**: 
  - Click any card's **Tweet** button to open the draft composition drawer.
  - Automatically generates a formatted summary tweet and checks it against X/Twitter's **280-character limit**.
  - Direct integration via **Twitter Web Intent** for instant sharing.
- **Premium Aesthetics**: Developed with a dark-space theme, custom Google fonts (`Outfit` & `Plus Jakarta Sans`), subtle glow animations, and hover scaling.

---

## Tech Stack

- **Backend**: Python 3.x, Flask (3.0.3)
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)

---

## Setup & Running Locally

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/kvenkatasatyalakshmi/-antigravity-event-talks-app.git
   cd -antigravity-event-talks-app
   ```

2. **Create a Virtual Environment**:
   ```bash
   python -m venv venv
   ```

3. **Activate Environment & Install Dependencies**:
   - **Windows**:
     ```powershell
     .\venv\Scripts\activate
     pip install -r requirements.txt
     ```
   - **macOS/Linux**:
     ```bash
     source venv/bin/activate
     pip install -r requirements.txt
     ```

4. **Run the Server**:
   ```bash
   python app.py
   ```

5. **Open Browser**:
   Visit [http://127.0.0.1:5000](http://127.0.0.1:5000) to view the application.

---

## License

This project is open-source and available under the MIT License.
