import React, { useState } from 'react';

export default function ReportDetail({ bug, scanData, onBack }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  const getSeverityClass = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'critical': return 'badge-critical';
      case 'high': return 'badge-high';
      case 'medium': return 'badge-medium';
      case 'low': return 'badge-low';
      default: return 'badge-medium';
    }
  };

  // Generate markdown representation of the bug for export
  const generateMarkdown = () => {
    return `## [${bug.severity.toUpperCase()}] ${bug.title}

### Description
${bug.description}

### Details
- **Type**: ${bug.type}
- **Severity**: ${bug.severity}
${scanData.url ? `- **Target URL**: ${scanData.url}` : ''}
${bug.affectedPaths ? `- **Affected Paths**: ${bug.affectedPaths.join(', ')}` : ''}

### Steps to Reproduce
${bug.stepsToReproduce.map((step, i) => `${i + 1}. ${step}`).join('\n')}

### AI Remediation Suggestion
${bug.remediation}
`;
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  // Extract clean code block from remediation text if any exists
  const getRemediationCode = () => {
    if (!bug.remediation) return null;
    const match = bug.remediation.match(/```(?:javascript|json|yaml|css|html)?([\s\S]*?)```/);
    return match ? match[1].trim() : null;
  };

  const cleanRemediationText = () => {
    if (!bug.remediation) return '';
    return bug.remediation.replace(/```[\s\S]*?```/g, '').trim();
  };

  const codeSnippet = getRemediationCode();
  const cleanRemediation = cleanRemediationText();

  return (
    <div className="detail-layout">
      {/* Header bar */}
      <div className="detail-header">
        <div className="detail-meta-box">
          <button className="btn btn-secondary" onClick={onBack} style={{ width: 'fit-content', padding: '0.4rem 1rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            ← Back to Feed
          </button>
          <div className="detail-meta-row">
            <span className={`badge ${getSeverityClass(bug.severity)}`}>{bug.severity} Severity</span>
            <span className="badge badge-type">{bug.type}</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem' }}>{bug.title}</h1>
        </div>

        <div className="detail-actions">
          <button className="btn btn-secondary" onClick={handleCopyMarkdown}>
            {copiedMarkdown ? 'Copied!' : 'Copy Markdown'}
          </button>
        </div>
      </div>

      <div className="report-content-grid">
        {/* Left Column: Visual Screenshot & Technical Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Visual Screenshot Overlays */}
          {scanData.screenshot && (
            <div>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 700 }}>Screenshot Analyzer</h3>
              <div className="screenshot-container">
                <img 
                  src={scanData.screenshot} 
                  className="screenshot-img" 
                  alt="Audit Viewport Capture" 
                />
                <div className="visual-overlay">
                  {bug.visualMarkers?.map((marker, index) => (
                    <div 
                      key={index} 
                      className="bug-marker"
                      style={{
                        left: `${marker.x}%`,
                        top: `${marker.y}%`,
                        width: `${marker.width}%`,
                        height: `${marker.height}%`,
                      }}
                    >
                      <div className="bug-tooltip">{marker.label || 'Bug Location'}</div>
                    </div>
                  ))}
                </div>
              </div>
              {bug.visualMarkers && bug.visualMarkers.length > 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center', fontStyle: 'italic' }}>
                  🔴 AI detected visual anomalies. Hover over highlighted regions to inspect.
                </p>
              )}
            </div>
          )}

          {/* Description */}
          <div className="glass-panel">
            <h3 style={{ marginBottom: '0.75rem', color: 'white' }}>Description</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{bug.description}</p>
          </div>

          {/* Steps to Reproduce */}
          <div className="glass-panel">
            <h3 style={{ marginBottom: '0.75rem', color: 'white' }}>Steps to Reproduce</h3>
            <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              {bug.stepsToReproduce?.map((step, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem' }}>{step}</li>
              ))}
            </ol>
          </div>

          {/* Affected Paths (API Specs) */}
          {bug.affectedPaths && bug.affectedPaths.length > 0 && (
            <div className="glass-panel">
              <h3 style={{ marginBottom: '0.75rem', color: 'white' }}>Affected API Endpoints</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {bug.affectedPaths.map((path, idx) => (
                  <span key={idx} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', padding: '0.35rem 0.65rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                    {path}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Console / Network Logs relative to this bug */}
          {(scanData.consoleLogs?.length > 0 || scanData.networkRequests?.length > 0) && (
            <div className="glass-panel">
              <h3 style={{ marginBottom: '1rem', color: 'white' }}>Associated Debug Logs</h3>
              <div className="logs-section">
                {bug.type === 'Network' && scanData.networkRequests?.map((req, idx) => (
                  <div key={idx} className="log-item error">
                    <div className="log-item-header">
                      <span style={{ color: 'var(--critical)' }}>{req.method} {req.status || 'FAILED'}</span>
                      <span>Network Tracer</span>
                    </div>
                    <div className="log-item-body" style={{ marginTop: '0.25rem' }}>
                      URL: <span style={{ color: 'white' }}>{req.url}</span>
                      {req.statusText && <div>Status Text: {req.statusText}</div>}
                      {req.error && <div style={{ color: 'var(--critical)' }}>Reason: {req.error}</div>}
                    </div>
                  </div>
                ))}
                
                {bug.type === 'Console' && scanData.consoleLogs?.map((log, idx) => (
                  <div key={idx} className={`log-item ${log.type === 'error' ? 'error' : log.type === 'warning' ? 'warn' : ''}`}>
                    <div className="log-item-header">
                      <span style={{ color: log.type === 'error' ? 'var(--critical)' : log.type === 'warning' ? 'var(--medium)' : 'var(--accent-blue)' }}>
                        {log.type.toUpperCase()}
                      </span>
                      <span>Console Linker</span>
                    </div>
                    <div className="log-item-body" style={{ marginTop: '0.25rem' }}>
                      {log.text}
                      {log.location && (
                        <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.25rem' }}>
                          at {log.location.url}:{log.location.line}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* If the bug type doesn't filter perfectly, list all critical errors */}
                {bug.type !== 'Network' && bug.type !== 'Console' && (
                  <>
                    {scanData.networkRequests?.filter(r => r.status >= 500 || r.error).map((req, idx) => (
                      <div key={`n-${idx}`} className="log-item error">
                        <div className="log-item-header">
                          <span style={{ color: 'var(--critical)' }}>{req.method} {req.status || 'FAILED'}</span>
                          <span>Failed Request</span>
                        </div>
                        <div className="log-item-body">{req.url}</div>
                      </div>
                    ))}
                    {scanData.consoleLogs?.filter(l => l.type === 'error').map((log, idx) => (
                      <div key={`c-${idx}`} className="log-item error">
                        <div className="log-item-header">
                          <span style={{ color: 'var(--critical)' }}>CONSOLE ERROR</span>
                        </div>
                        <div className="log-item-body">{log.text}</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Remediation Code */}
        <div>
          <div className="remediation-card" style={{ position: 'sticky', top: '24px' }}>
            <div className="remediation-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .4 2.2 1.5 3 1 .7 1.5 1.5 1.5 2.5"></path>
                <line x1="9" y1="18" x2="15" y2="18"></line>
                <line x1="10" y1="22" x2="14" y2="22"></line>
              </svg>
              AI REMEDIATION PLAN
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {cleanRemediation}
            </p>

            {codeSnippet && (
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>SUGGESTED CORRECTION:</span>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => handleCopyCode(codeSnippet)}
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px' }}
                  >
                    {copiedCode ? 'Copied!' : 'Copy Snippet'}
                  </button>
                </div>
                <pre className="code-block">
                  <code>{codeSnippet}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
