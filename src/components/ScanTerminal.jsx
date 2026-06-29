import React, { useEffect, useState, useRef } from 'react';

export default function ScanTerminal({ isScanning, scanConfig, logs = [] }) {
  const [terminalLogs, setTerminalLogs] = useState([]);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    if (!isScanning) {
      setTerminalLogs([]);
      return;
    }

    setTerminalLogs([]);
    let timerIds = [];

    const addLine = (text, type = 'info', delay = 0) => {
      const id = setTimeout(() => {
        setTerminalLogs((prev) => [...prev, { text, type, timestamp: new Date().toLocaleTimeString() }]);
      }, delay);
      timerIds.push(id);
    };

    if (scanConfig.type === 'url') {
      const urlText = scanConfig.url;
      addLine('🚀 Starting Chrome automation scanner...', 'info', 0);
      addLine(`🖥️ Setting viewport bounds to ${scanConfig.viewportWidth}x${scanConfig.viewportHeight}`, 'info', 800);
      addLine(`🌐 Launching headless browser instance...`, 'info', 1600);
      addLine(`🔍 Navigating to ${urlText}`, 'info', 2400);
      addLine('📡 Hooking network traffic logs...', 'info', 3200);
      addLine('📢 Registering window.onerror & console interceptors...', 'info', 3800);
      
      if (scanConfig.demoId) {
        // Mock demo logs
        addLine('⌛ Waiting for page load to settle (DOMContentLoaded)...', 'info', 4500);
        addLine('⚠️ Console Warning: [Deprecation] Synchronous XMLHttpRequest on the main thread is deprecated.', 'warn', 5500);
        
        if (scanConfig.demoId === 'zorastore-checkout') {
          addLine('❌ Console Error: TypeError: Cannot read properties of undefined (reading \'applyDiscount\') at checkout.js:210', 'error', 6200);
          addLine('❌ Network Failure: POST https://api.zorastore.com/v1/checkout/apply-coupon -> 500 Internal Server Error', 'error', 6800);
        } else {
          addLine('❌ Network Failure: GET https://ldatastream.analytics/api/v1/session-data -> 403 Forbidden', 'error', 6200);
          addLine('❌ Console Error: Uncaught (in promise) Error: Access denied for analytics data at dashboard.js:84', 'error', 6800);
        }

        addLine('📸 Taking screenshot capture of viewport...', 'info', 7500);
        addLine('✅ Browser session closed. Audit package successfully compiled.', 'success', 8200);
        addLine('🤖 Dispatching audit payload to Gemini AI (gemini-2.5-flash)...', 'ai', 9000);
        addLine('🧠 Gemini AI: Analyzing image context and comparing console exceptions...', 'ai', 9800);
        addLine('🧠 Gemini AI: Spotting visual clipping coordinates and formatting markdown report...', 'ai', 10800);
        addLine('🎉 Audit completed! Displaying findings.', 'success', 11500);
      } else {
        // Real-world scan progress (which gets logs dynamically or runs steps)
        addLine('⌛ Waiting for server response...', 'info', 4500);
        addLine('📸 Capturing screenshot layout...', 'info', 7000);
        addLine('🤖 Sending visual frames & logs to Gemini AI...', 'ai', 9000);
        addLine('🧠 Gemini AI: Mapping visual errors to console traces...', 'ai', 10500);
      }
    } else {
      // Swagger spec logs
      addLine('📁 Initializing OpenAPI specification parser...', 'info', 0);
      if (scanConfig.swaggerUrl) {
        addLine(`🌐 Fetching spec from: ${scanConfig.swaggerUrl}`, 'info', 800);
      } else {
        addLine('📝 Reading pasted specification data...', 'info', 800);
      }
      addLine('🔍 Validating YAML/JSON structural tokens...', 'info', 1600);
      addLine('✅ Parse successful! Discovered REST paths.', 'success', 2400);
      addLine('🤖 Submitting API schemas to Gemini AI (gemini-2.5-flash) for threat modeling...', 'ai', 3200);
      addLine('🧠 Gemini AI: Auditing authorization blocks and validation schemas...', 'ai', 4200);
      addLine('🧠 Gemini AI: Compiling API patch recommendations...', 'ai', 5200);
      addLine('🎉 Audit completed! Displaying findings.', 'success', 6000);
    }

    return () => {
      timerIds.forEach(id => clearTimeout(id));
    };
  }, [isScanning, scanConfig]);

  // Append backend real logs if they are fed into this component
  useEffect(() => {
    if (logs && logs.length > 0) {
      setTerminalLogs(prev => {
        // Deduplicate or append safely
        const newLogs = logs.map(l => ({
          text: l.text,
          type: l.type || 'info',
          timestamp: new Date().toLocaleTimeString()
        }));
        return [...prev, ...newLogs];
      });
    }
  }, [logs]);

  // Scroll to bottom of terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  if (!isScanning) return null;

  return (
    <div className="terminal-card" style={{ marginBottom: '2.5rem' }}>
      <div className="terminal-header">
        <div className="terminal-dots">
          <div className="terminal-dot red" />
          <div className="terminal-dot yellow" />
          <div className="terminal-dot green" />
        </div>
        <div className="terminal-title">Active Scan Monitor</div>
        <div style={{ width: '42px' }} /> {/* Spacing */}
      </div>
      <div className="terminal-body">
        {terminalLogs.map((log, index) => (
          <div key={index} className={`terminal-line ${log.type}`}>
            <span style={{ color: '#4b5563', marginRight: '0.75rem', userSelect: 'none' }}>[{log.timestamp}]</span>
            {log.text}
          </div>
        ))}
        {terminalLogs.length === 0 && (
          <div className="terminal-line info">Warming engine...</div>
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
