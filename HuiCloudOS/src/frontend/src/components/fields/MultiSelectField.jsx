import React from 'react';

export default function MultiSelectField({ label, options = [], values = [], onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
      <span style={{ width: '120px', opacity: 0.8 }}>{label}</span>
      <div className="hc-tag-group">
        {options.map((option) => {
          const active = values.includes(option);
          return (
            <button
              key={option}
              type="button"
              className="hc-tab"
              onClick={() => {
                if (active) {
                  onChange(values.filter((item) => item !== option));
                } else {
                  onChange([...values, option]);
                }
              }}
              style={{
                background: active ? 'rgba(120,200,255,0.35)' : 'rgba(255,255,255,0.12)',
                borderColor: active ? 'rgba(160,220,255,0.9)' : 'transparent'
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
