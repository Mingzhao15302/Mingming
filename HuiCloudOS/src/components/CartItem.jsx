import React from 'react';

export default function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  return (
    <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '1rem', padding: '1rem', alignItems: 'center' }}>
      <div
        style={{
          width: '100%',
          aspectRatio: '16 / 10',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(14,165,233,0.3))',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          color: '#1d4ed8'
        }}
      >
        {item.name}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <strong>{item.name}</strong>
        <span style={{ color: 'var(--text-secondary)' }}>{item.model}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="button-ghost" onClick={onDecrease}>
            -
          </button>
          <span style={{ fontWeight: 600 }}>{item.quantity}</span>
          <button className="button-ghost" onClick={onIncrease}>
            +
          </button>
          <button className="button-ghost" onClick={onRemove}>
            删除
          </button>
        </div>
      </div>
      <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', color: '#2563eb' }}>￥{(item.price * item.quantity).toLocaleString()}</div>
    </div>
  );
}
