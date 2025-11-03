import React from 'react';

export const Tabs = ({ tabs, activeKey, onChange }) => {
  return (
    <div>
      <div className="tab-bar">
        {tabs.map((tab) => (
          <button key={tab.key} className={tab.key === activeKey ? 'active' : ''} onClick={() => onChange(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        {tabs.find((tab) => tab.key === activeKey)?.content}
      </div>
    </div>
  );
};

export default Tabs;
