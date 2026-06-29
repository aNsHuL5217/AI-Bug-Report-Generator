import React, { useState, useEffect } from 'react';

export default function Settings({ apiKey, onApiKeyChange, serverStatus, onClearReports }) {
  const [showKey, setShowKey] = useState(false);
  const [inputKey, setInputKey] = useState(apiKey || '');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setInputKey(apiKey || '');
  }, [apiKey]);

  const handleSave = (e) => {
    e.preventDefault();
    onApiKeyChange(inputKey.trim());
    setSuccessMsg('Settings saved successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="settings-section">
      {successMsg && (
        <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--low)', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {/* Gemini API Key */}
      <div className="glass-panel">
        <h3>Google Gemini API Configuration</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          To perform real-time scanning analysis on custom websites, this tool uses Google Gemini AI. 
          Your API key is stored <strong>locally in your browser</strong> (localStorage) and is never transmitted to any third-party server besides Google's official endpoints.
        </p>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="gemini-key">Gemini API Key</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input 
                className="form-control"
                id="gemini-key"
                placeholder="AIzaSy..."
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                style={{ flexGrow: 1 }}
              />
              <button 
                className="btn btn-secondary"
                onClick={() => setShowKey(!showKey)}
                type="button"
                style={{ padding: '0 1rem' }}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Don't have a key? Get one for free at <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--secondary)' }}>Google AI Studio</a>.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button className="btn btn-primary" type="submit">
              Save Settings
            </button>
          </div>
        </form>
      </div>

      {/* Backend Server Status */}
      <div className="glass-panel">
        <h3>Browser Crawler Status</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
          Real site browser crawling requires the local Node server to be running in the background. If the server is not detected, 
          the application operates in <strong>High-Fidelity Demo Mode</strong>.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(9,13,22,0.4)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              background: serverStatus === 'online' ? 'var(--low)' : 'var(--critical)',
              boxShadow: serverStatus === 'online' ? '0 0 8px var(--low)' : '0 0 8px var(--critical)'
            }} />
            <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem' }}>
              {serverStatus === 'online' ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {serverStatus === 'online' ? (
              <span>Local Playwright scan runner is <strong>Active</strong> on port 3001. Custom scans will navigate live.</span>
            ) : (
              <span>Local scan server (port 3001) is <strong>Offline</strong>. Runs will execute in simulation fallback.</span>
            )}
          </div>
        </div>

        {serverStatus !== 'online' && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 700, color: 'var(--critical)', display: 'block', marginBottom: '0.25rem' }}>HOW TO ENABLE LIVE BROWSER AUDITS:</span>
            1. Open a new terminal tab.<br />
            2. Run: <code>npm run start</code> inside the <code>server/</code> folder.<br />
            3. Run: <code>npx playwright install chromium</code> if browser binaries are missing.
          </div>
        )}
      </div>

      {/* Local Storage Reset */}
      <div className="glass-panel">
        <h3>Maintenance & Data</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Delete all generated reports and reset the application back to its default state.
        </p>
        <button className="btn btn-danger" onClick={onClearReports} style={{ width: 'fit-content' }}>
          Clear All Reports
        </button>
      </div>
    </div>
  );
}
