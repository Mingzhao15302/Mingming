import React from 'react';

export default function DropdownField({ label, options = [], value, onChange, style }) {
  return (
    <label style={{ display: 'grid', gap: '0.35rem', flex: '1 1 22%', minWidth: '200px', ...(style || {}) }}>
      <span style={{ opacity: 0.75 }}>{label}</span>
      <select value={value || ''} onChange={(event) => onChange(event.target.value || undefined)}>
        <option value="">全部</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
