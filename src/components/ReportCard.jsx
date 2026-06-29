import React from 'react';

export default function ReportCard({ bug, onClick, url }) {
  const getSeverityClass = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'critical': return 'badge-critical';
      case 'high': return 'badge-high';
      case 'medium': return 'badge-medium';
      case 'low': return 'badge-low';
      default: return 'badge-medium';
    }
  };

  return (
    <div className="report-card" onClick={onClick}>
      <div className="report-info">
        <div className="report-meta">
          <span className={`badge ${getSeverityClass(bug.severity)}`}>{bug.severity}</span>
          <span className="badge badge-type">{bug.type}</span>
          {url && <span className="report-url">{url}</span>}
        </div>
        <div className="report-title" style={{ marginTop: '0.5rem' }}>{bug.title}</div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {bug.description}
        </p>
      </div>
      <div style={{ color: 'var(--primary)', paddingLeft: '1rem' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 5l7 7-7 7"></path>
        </svg>
      </div>
    </div>
  );
}
