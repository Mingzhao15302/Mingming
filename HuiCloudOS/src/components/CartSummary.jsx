import React from 'react';

export default function CartSummary({ subtotal, onCheckout }) {
  return (
    <div className="glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span style={{ color: 'var(--text-secondary)' }}>合计金额</span>
        <strong style={{ fontSize: '1.6rem', color: '#2563eb' }}>￥{subtotal.toLocaleString()}</strong>
      </div>
      <button className="button-primary" onClick={onCheckout}>
        去结算
      </button>
    </div>
  );
}
