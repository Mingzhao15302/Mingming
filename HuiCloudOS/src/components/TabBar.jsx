import React from 'react';

export default function TabBar({ tabs, activeKey, onChange }) {
  return (
    <div className="glass-card" style={{ padding: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className="button-ghost"
          onClick={() => onChange(tab.key)}
          style={{
            background: tab.key === activeKey ? 'rgba(59,130,246,0.25)' : undefined,
            color: tab.key === activeKey ? '#1d4ed8' : undefined,
            padding: '0.65rem 1.25rem',
            borderRadius: '16px'
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
