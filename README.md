# BugRadar AI - AI Bug Report Generator 🐞

BugRadar AI is a modern web audit and diagnostic tool that automatically detects visual, console, and network errors on websites, and identifies security vulnerabilities and structure flaws in OpenAPI/Swagger specifications. 

By combining **Playwright** browser automation, **OpenAPI Spec analysis**, and **Google Gemini AI**, it converts raw UI exceptions, console logs, and visual glitches into developer-ready bug reports with detailed replication steps and AI-suggested code corrections.

---

## 🌟 Key Features

1. **Dual Scanner System**:
   - **Browser Web Audit**: Spawns a headless browser to navigate live sites, captures a screenshot, logs console messages, records network status codes, and highlights UI defects.
   - **Swagger OpenAPI Scan**: Parses OpenAPI specifications (URL or raw copy-paste JSON) to locate security loopholes and data model design issues.
2. **Visual Bug Finder**: Draws glowing annotation boxes on the screenshot where visual mismatches or broken elements are detected by the AI.
3. **AI-Driven Remediation**: Automatically compiles descriptive remediation plans and suggestible code/CSS patches.
4. **Markdown Export**: Copy reports directly in a format styled for GitHub Issues, Jira tickets, or Linear tickets.
5. **Standalone Simulation Mode**: Runs fully offline with pre-configured mock environments if no API keys or local browsers are active.

---

## 📋 Prerequisites

Before setting up the app, make sure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher recommended)
- **NPM** (v9.0.0 or higher)
- **Git**
- **Google Gemini API Key** (Get one for free at [Google AI Studio](https://aistudio.google.com/))

---

## 🚀 Getting Started

Follow these steps to clone, download, and run the project locally on your machine.

### 1. Clone the Repository
```bash
git clone https://github.com/aNsHuL5217/AI-Bug-Report-Generator.git
cd AI-Bug-Report-Generator
```

### 2. Setup the Playwright Backend Server
Open a terminal tab to install and run the crawler server:
```bash
# Navigate to the server folder
cd server

# Install dependencies
npm install

# Download Playwright browser binaries
npx playwright install chromium

# Start the server (runs on port 3001)
npm start
```

### 3. Setup the React Frontend Client
Open a second terminal tab to launch the dashboard:
```bash
# From the project root folder
npm install

# Start the Vite development server (runs on port 5173)
npm run dev
```

---

## ⚙️ Configuration & Usage

1. Open your browser and navigate to **`http://localhost:5173/`**.
2. Click on **Settings** in the sidebar.
3. Paste your **Google Gemini API Key** and click **Save Settings** (this key is stored locally in your browser's `localStorage` and never leaves your machine).
4. Run your first audit:
   - **Custom Scan**: Navigate to **Launch New Scan**, input a URL (e.g. `https://example.com`), select desktop/mobile viewport, and click **Launch Audit**.
   - **Demo Scan**: Select one of the pre-loaded websites from the dropdown menu (e.g., ZoraStore Checkout or Datastream Dashboard) to test the app out-of-the-box.
   - **API Scan**: Paste your OpenAPI YAML/JSON schema to run threat modeling scans.
