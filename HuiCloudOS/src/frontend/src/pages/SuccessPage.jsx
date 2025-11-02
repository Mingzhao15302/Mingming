import React from 'react';
import { Link } from 'react-router-dom';

export default function SuccessPage() {
  return (
    <section style={{ display: 'grid', placeItems: 'center', flex: 1 }}>
      <div className="hc-card" style={{ padding: '3rem 4rem', textAlign: 'center', display: 'grid', gap: '1rem' }}>
        <span style={{ fontSize: '3rem' }}>✅</span>
        <h2 style={{ margin: 0 }}>下单成功</h2>
        <p style={{ opacity: 0.75 }}>感谢您的提交，我们会尽快与您联系。</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <Link to="/shop" className="hc-tab" style={{ padding: '0.75rem 1.5rem' }}>
            返回商城
          </Link>
          <Link to="/console" className="hc-tab" style={{ padding: '0.75rem 1.5rem' }}>
            查看订单
          </Link>
        </div>
      </div>
    </section>
  );
}
