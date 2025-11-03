import React from 'react';

export default function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.35)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100
      }}
    >
      <div className="glass-card" style={{ width: 'min(920px, 92vw)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button className="button-ghost" onClick={onClose}>
            关闭
          </button>
        </div>
        <div style={{ maxHeight: '65vh', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>{children}</div>
        {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>{footer}</div>}
      </div>
    </div>
  );
}
