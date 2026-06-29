import React, { useState } from 'react';
import { DEMO_WEBSITES, MOCK_SWAGGER_SPECS } from '../services/mockData';

export default function ScannerForm({ onStartScan, isScanning }) {
  const [activeTab, setActiveTab] = useState('url'); // 'url' or 'swagger'
  
  // URL form state
  const [url, setUrl] = useState('');
  const [viewport, setViewport] = useState('desktop');
  const [selectedDemo, setSelectedDemo] = useState('');

  // Swagger form state
  const [swaggerUrl, setSwaggerUrl] = useState('');
  const [rawSpec, setRawSpec] = useState('');
  const [selectedDemoSpec, setSelectedDemoSpec] = useState('');

  const handleDemoSelect = (e) => {
    const demoId = e.target.value;
    setSelectedDemo(demoId);
    if (!demoId) return;

    const demo = DEMO_WEBSITES.find(d => d.id === demoId);
    if (demo) {
      setUrl(demo.url);
    }
  };

  const handleDemoSpecSelect = (e) => {
    const specId = e.target.value;
    setSelectedDemoSpec(specId);
    if (!specId) return;

    const spec = MOCK_SWAGGER_SPECS.find(s => s.id === specId);
    if (spec) {
      setSwaggerUrl(spec.name);
      setRawSpec(JSON.stringify(spec.rawSpec, null, 2));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'url') {
      if (!url) return;
      
      let width = 1280;
      let height = 800;
      if (viewport === 'mobile') {
        width = 375;
        height = 812;
      } else if (viewport === 'tablet') {
        width = 768;
        height = 1024;
      }

      onStartScan({
        type: 'url',
        url,
        viewportWidth: width,
        viewportHeight: height,
        demoId: selectedDemo || null
      });
    } else {
      if (!swaggerUrl && !rawSpec) return;
      onStartScan({
        type: 'swagger',
        swaggerUrl,
        rawSpec,
        demoId: selectedDemoSpec || null
      });
    }
  };

  return (
    <div className="glass-panel" style={{ marginBottom: '2rem' }}>
      <div className="tabs-header">
        <button 
          className={`btn-tab ${activeTab === 'url' ? 'active' : ''}`}
          onClick={() => setActiveTab('url')}
          type="button"
        >
          Browser Web Audit
        </button>
        <button 
          className={`btn-tab ${activeTab === 'swagger' ? 'active' : ''}`}
          onClick={() => setActiveTab('swagger')}
          type="button"
        >
          Swagger OpenAPI Scan
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {activeTab === 'url' ? (
          <>
            <div className="grid-2">
              <div className="form-group">
                <label htmlFor="demo-select">Load A Demo Website (Highly Recommended)</label>
                <select 
                  className="form-control"
                  id="demo-select"
                  value={selectedDemo}
                  onChange={handleDemoSelect}
                  disabled={isScanning}
                >
                  <option value="">-- Select a demo target or enter a URL below --</option>
                  {DEMO_WEBSITES.map(demo => (
                    <option key={demo.id} value={demo.id}>{demo.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="viewport-select">Viewport Resolution</label>
                <select 
                  className="form-control"
                  id="viewport-select"
                  value={viewport}
                  onChange={(e) => setViewport(e.target.value)}
                  disabled={isScanning}
                >
                  <option value="desktop">Desktop (1280 x 800)</option>
                  <option value="tablet">Tablet (768 x 1024)</option>
                  <option value="mobile">Mobile (375 x 812)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="scan-url">Target URL</label>
              <div className="input-with-icon">
                <span className="icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                </span>
                <input 
                  className="form-control"
                  id="scan-url"
                  placeholder="https://example.com"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  disabled={isScanning}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid-2">
              <div className="form-group">
                <label htmlFor="demo-spec-select">Load A Demo Spec</label>
                <select 
                  className="form-control"
                  id="demo-spec-select"
                  value={selectedDemoSpec}
                  onChange={handleDemoSpecSelect}
                  disabled={isScanning}
                >
                  <option value="">-- Choose a pre-defined OpenAPI template --</option>
                  {MOCK_SWAGGER_SPECS.map(spec => (
                    <option key={spec.id} value={spec.id}>{spec.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="swagger-url">OpenAPI Spec URL (Optional)</label>
                <input 
                  className="form-control"
                  id="swagger-url"
                  placeholder="https://petstore.swagger.io/v2/swagger.json"
                  type="url"
                  value={swaggerUrl}
                  onChange={(e) => setSwaggerUrl(e.target.value)}
                  disabled={isScanning}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="raw-spec">Raw Spec JSON/YAML (Paste Below)</label>
              <textarea 
                className="form-control"
                id="raw-spec"
                placeholder='{"openapi": "3.0.0", "info": { "title": "API", "version": "1.0.0" }, ...}'
                value={rawSpec}
                onChange={(e) => setRawSpec(e.target.value)}
                disabled={isScanning}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
              />
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button 
            className="btn btn-primary" 
            type="submit"
            disabled={isScanning || (activeTab === 'url' ? !url : (!swaggerUrl && !rawSpec))}
            style={{ minWidth: '160px' }}
          >
            {isScanning ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: '0.5rem', animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25"></circle>
                  <path d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"></path>
                </svg>
                Auditing...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                Launch Audit
              </>
            )}
          </button>
        </div>
      </form>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
