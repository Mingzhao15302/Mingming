import React from 'react';
import { useAppContext } from '../context/app-context.jsx';

export default function OrderSuccessPage() {
  const { navigate } = useAppContext();
  return (
    <div className="glass-card" style={{ padding: '3rem', maxWidth: '520px', margin: '3rem auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ fontSize: '3rem' }}>✅</div>
      <h2 style={{ margin: 0 }}>下单成功</h2>
      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>我们已收到您的订单，将尽快安排跟进。</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <button className="button-primary" onClick={() => navigate('#/shop')}>
          返回商城
        </button>
        <button className="button-ghost" onClick={() => navigate('#/console')}>
          查看订单
        </button>
      </div>
    </div>
  );
}
