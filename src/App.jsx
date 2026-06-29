import React, { useState, useEffect } from 'react';
import ScannerForm from './components/ScannerForm';
import ScanTerminal from './components/ScanTerminal';
import ReportCard from './components/ReportCard';
import ReportDetail from './components/ReportDetail';
import Settings from './components/Settings';
import { analyzeBrowserScan, analyzeSwaggerSpec } from './services/gemini';
import { DEMO_WEBSITES, MOCK_SWAGGER_SPECS } from './services/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ai_bug_report_gemini_key') || '');
  const [reports, setReports] = useState(() => {
    const saved = localStorage.getItem('ai_bug_reports');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedBug, setSelectedBug] = useState(null);

  // Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [scanConfig, setScanConfig] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');

  // Check backend server health
  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: '' }) // Empty URL triggers 400, but proves server is online
        });
        if (res.status === 400 || res.ok) {
          setServerStatus('online');
        } else {
          setServerStatus('offline');
        }
      } catch (e) {
        setServerStatus('offline');
      }
    };
    checkServer();
    // Re-check periodically
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

  // Save reports to localStorage
  useEffect(() => {
    localStorage.setItem('ai_bug_reports', JSON.stringify(reports));
  }, [reports]);

  const handleApiKeyChange = (newKey) => {
    setApiKey(newKey);
    localStorage.setItem('ai_bug_report_gemini_key', newKey);
  };

  const handleClearReports = () => {
    if (window.confirm('Are you sure you want to delete all reports?')) {
      setReports([]);
      localStorage.removeItem('ai_bug_reports');
      setSelectedReport(null);
      setSelectedBug(null);
      setActiveTab('dashboard');
    }
  };

  // Convert image URL from public directory into base64 to send to Gemini
  const fetchImageAsBase64 = async (url) => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startScan = async (config) => {
    setIsScanning(true);
    setScanConfig(config);
    setActiveTab('new-scan');

    // Scenario A: Swagger spec analysis
    if (config.type === 'swagger') {
      try {
        let specJson = null;
        let title = 'API Spec';
        
        if (config.demoId) {
          const demoSpec = MOCK_SWAGGER_SPECS.find(s => s.id === config.demoId);
          specJson = demoSpec.rawSpec;
          title = demoSpec.name;
        } else {
          // If custom spec
          if (config.rawSpec) {
            specJson = JSON.parse(config.rawSpec);
          } else if (config.swaggerUrl) {
            // Trigger server parser
            const res = await fetch('http://localhost:3001/api/parse-swagger', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ swaggerUrl: config.swaggerUrl })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            specJson = data.rawSpec;
            title = data.title;
          }
        }

        if (!specJson) throw new Error('API specification is empty.');

        // Mimic terminal parsing delay
        await new Promise(r => setTimeout(r, 6000));

        let bugs = [];
        if (apiKey) {
          // Perform real Gemini analysis on Swagger JSON
          bugs = await analyzeSwaggerSpec(apiKey, specJson);
        } else {
          // Load demo preset bugs
          if (config.demoId) {
            const demoSpec = MOCK_SWAGGER_SPECS.find(s => s.id === config.demoId);
            bugs = demoSpec.preAnalyzedBugs;
          } else {
            throw new Error('Please add a Gemini API Key in the settings to analyze custom OpenAPI specifications.');
          }
        }

        const newReport = {
          id: `rep-${Date.now()}`,
          type: 'swagger',
          title: `API Spec Scan: ${title}`,
          date: new Date().toLocaleString(),
          targetUrl: config.swaggerUrl || 'Raw JSON Spec',
          bugs
        };

        setReports(prev => [newReport, ...prev]);
        setSelectedReport(newReport);
        setSelectedBug(newReport.bugs[0] || null);
        setActiveTab('report-detail');

      } catch (err) {
        alert(err.message || 'Error occurred during spec analysis');
      } finally {
        setIsScanning(false);
      }
      return;
    }

    // Scenario B: URL visual scan
    try {
      // 1. Check if mock/demo website is targeted or if backend is offline
      if (config.demoId || serverStatus !== 'online') {
        // If offline and custom URL was input
        if (!config.demoId && serverStatus !== 'online') {
          // Attempt online request anyway, which will trigger catch block with details
          // but we can catch it early or let it attempt
        }

        // Run mock website crawler simulation
        await new Promise(r => setTimeout(r, 11500)); // Length of terminal animation

        let bugs = [];
        let screenshot = '';
        let consoleLogs = [];
        let networkRequests = [];
        const demo = DEMO_WEBSITES.find(d => d.id === config.demoId) || DEMO_WEBSITES[0];

        screenshot = demo.screenshot;
        consoleLogs = demo.consoleLogs;
        networkRequests = demo.networkRequests;

        if (apiKey) {
          // Use real Gemini API to audit the static demo screen + logs
          const base64Screenshot = await fetchImageAsBase64(demo.screenshot);
          bugs = await analyzeBrowserScan(apiKey, base64Screenshot, consoleLogs, networkRequests, config.url);
        } else {
          // Offline mock presets fallback
          bugs = demo.preAnalyzedBugs;
        }

        const newReport = {
          id: `rep-${Date.now()}`,
          type: 'url',
          title: `Web Audit: ${demo.name}`,
          date: new Date().toLocaleString(),
          targetUrl: config.url,
          screenshot,
          consoleLogs,
          networkRequests,
          bugs
        };

        setReports(prev => [newReport, ...prev]);
        setSelectedReport(newReport);
        setSelectedBug(newReport.bugs[0] || null);
        setActiveTab('report-detail');

      } else {
        // Real-world URL scan (Backend online)
        const serverRes = await fetch('http://localhost:3001/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: config.url,
            viewportWidth: config.viewportWidth,
            viewportHeight: config.viewportHeight
          })
        });

        const scanData = await serverRes.json();
        if (!scanData.success) {
          throw new Error(scanData.error);
        }

        if (!apiKey) {
          throw new Error('Scan successful but Gemini API Key is missing. Please save your API Key in Settings to generate the report.');
        }

        // Send backend logs and screenshot to Gemini
        const bugs = await analyzeBrowserScan(
          apiKey,
          scanData.screenshot,
          scanData.consoleLogs,
          scanData.networkRequests,
          config.url
        );

        const newReport = {
          id: `rep-${Date.now()}`,
          type: 'url',
          title: `Web Audit: ${scanData.title || config.url}`,
          date: new Date().toLocaleString(),
          targetUrl: config.url,
          screenshot: scanData.screenshot,
          consoleLogs: scanData.consoleLogs,
          networkRequests: scanData.networkRequests,
          bugs
        };

        setReports(prev => [newReport, ...prev]);
        setSelectedReport(newReport);
        setSelectedBug(newReport.bugs[0] || null);
        setActiveTab('report-detail');
      }

    } catch (err) {
      alert(err.message || 'Audit execution encountered a terminal error.');
    } finally {
      setIsScanning(false);
    }
  };

  // Compile statistics for dashboard counters
  const getStats = () => {
    let totalBugs = 0;
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    reports.forEach(r => {
      r.bugs?.forEach(b => {
        totalBugs++;
        const sev = b.severity?.toLowerCase();
        if (sev === 'critical') critical++;
        else if (sev === 'high') high++;
        else if (sev === 'medium') medium++;
        else if (sev === 'low') low++;
      });
    });

    return { totalAudits: reports.length, totalBugs, critical, high, medium, low };
  };

  const stats = getStats();

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="brand">
            <div className="brand-logo">🐞</div>
            <div className="brand-name">BugRadar AI</div>
          </div>

          <nav>
            <ul className="nav-list">
              <li>
                <a 
                  className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('dashboard'); setSelectedReport(null); }}
                  href="#"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="9" rx="1"></rect>
                    <rect x="14" y="3" width="7" height="5" rx="1"></rect>
                    <rect x="14" y="12" width="7" height="9" rx="1"></rect>
                    <rect x="3" y="16" width="7" height="5" rx="1"></rect>
                  </svg>
                  Dashboard
                </a>
              </li>
              <li>
                <a 
                  className={`nav-item ${activeTab === 'new-scan' ? 'active' : ''}`}
                  onClick={() => { if (!isScanning) setActiveTab('new-scan'); }}
                  href="#"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                  Launch New Scan
                </a>
              </li>
              <li>
                <a 
                  className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('reports'); setSelectedReport(null); }}
                  href="#"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  Bug Feeds ({reports.reduce((acc, r) => acc + (r.bugs?.length || 0), 0)})
                </a>
              </li>
              <li>
                <a 
                  className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('settings'); }}
                  href="#"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  Settings
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div>Engine status: {serverStatus === 'online' ? '🟢 Node Active' : '🔴 Standalone'}</div>
          <div>Gemini Integration: {apiKey ? '🟢 Configured' : '🟡 Demo Mode'}</div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="main-content">
        <header className="top-header">
          <div className="page-title">
            <h1>
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'new-scan' && 'Scanner Suite'}
              {activeTab === 'reports' && 'Bug Feeds'}
              {activeTab === 'settings' && 'Configuration Console'}
              {activeTab === 'report-detail' && 'Audit Report Details'}
            </h1>
            <p>
              {activeTab === 'dashboard' && 'Analyze security risks, code discrepancies, and visual bugs.'}
              {activeTab === 'new-scan' && 'Enter parameters below to scan a browser UI or OpenAPI definition.'}
              {activeTab === 'reports' && 'Feed of aggregated bugs classified by AI reasoning.'}
              {activeTab === 'settings' && 'Manage credentials and browser scanner connection hooks.'}
              {activeTab === 'report-detail' && `Scan completed: ${selectedReport?.title}`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {apiKey ? (
              <span className="api-key-badge"> Gemini AI Active</span>
            ) : (
              <span className="api-key-badge missing" onClick={() => setActiveTab('settings')} style={{ cursor: 'pointer' }}>
                ⚠️ Running in Mock Mode
              </span>
            )}
          </div>
        </header>

        {/* Content routing */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Quick Demo Mode Notice */}
            {!apiKey && (
              <div className="demo-banner">
                <span>⚡ You are currently browsing in demo mode. Add your Gemini API Key in Settings to run live custom scans!</span>
                <span className="demo-banner-action" onClick={() => setActiveTab('settings')}>Go to Settings</span>
              </div>
            )}

            {/* Statistics */}
            <div className="stats-grid">
              <div className="glass-panel stat-card">
                <div className="stat-num">{stats.totalAudits}</div>
                <div className="stat-label">Total Audits</div>
              </div>
              <div className="glass-panel stat-card">
                <div className="stat-num critical">{stats.critical}</div>
                <div className="stat-label">Critical Bugs</div>
              </div>
              <div className="glass-panel stat-card">
                <div className="stat-num high">{stats.high}</div>
                <div className="stat-label">High Severity</div>
              </div>
              <div className="glass-panel stat-card">
                <div className="stat-num">{stats.totalBugs}</div>
                <div className="stat-label">Total Bugs Identified</div>
              </div>
            </div>

            <div className="grid-1-2">
              {/* Scan Form on Left */}
              <div>
                <h2 style={{ marginBottom: '1.25rem', fontSize: '1.25rem', fontWeight: 700 }}>Run Analysis</h2>
                <ScannerForm onStartScan={startScan} isScanning={isScanning} />
              </div>

              {/* Feed Preview on Right */}
              <div>
                <div className="section-header">
                  <h2>Recent Bug Reports</h2>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('reports')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    View All
                  </button>
                </div>
                <div className="reports-feed">
                  {reports.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No reports generated yet. Launch a scanner audit to populate details.
                    </div>
                  ) : (
                    reports.slice(0, 3).map(rep => (
                      <div key={rep.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(9,13,22,0.3)', border: '1px solid rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{rep.title}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rep.date}</span>
                        </div>
                        {rep.bugs.map((bug, bIdx) => (
                          <ReportCard 
                            key={bIdx} 
                            bug={bug} 
                            onClick={() => {
                              setSelectedReport(rep);
                              setSelectedBug(bug);
                              setActiveTab('report-detail');
                            }}
                          />
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'new-scan' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <ScannerForm onStartScan={startScan} isScanning={isScanning} />
            <ScanTerminal isScanning={isScanning} scanConfig={scanConfig} />
          </div>
        )}

        {activeTab === 'reports' && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }} className="reports-feed">
            {reports.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No audits have been executed yet. Launch a new browser/swagger scan to create bug reports.
              </div>
            ) : (
              reports.map(rep => (
                <div key={rep.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>{rep.title}</h2>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--secondary)' }}>{rep.targetUrl}</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{rep.date}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {rep.bugs.map((bug, bIdx) => (
                      <ReportCard 
                        key={bIdx} 
                        bug={bug} 
                        onClick={() => {
                          setSelectedReport(rep);
                          setSelectedBug(bug);
                          setActiveTab('report-detail');
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'report-detail' && selectedReport && selectedBug && (
          <ReportDetail 
            bug={selectedBug} 
            scanData={selectedReport} 
            onBack={() => {
              // Check if report came from a list or new scan and return gracefully
              setActiveTab('reports');
            }} 
          />
        )}

        {activeTab === 'settings' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Settings 
              apiKey={apiKey}
              onApiKeyChange={handleApiKeyChange}
              serverStatus={serverStatus}
              onClearReports={handleClearReports}
            />
          </div>
        )}
      </main>
    </div>
  );
}
