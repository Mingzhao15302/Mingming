import { Link } from 'react-router-dom';

export function OrderSuccessPage() {
  return (
    <section style={{ display: 'grid', placeItems: 'center', minHeight: 'calc(100vh - 160px)' }}>
      <div className="glass" style={{ padding: '3rem', textAlign: 'center', display: 'grid', gap: '1.5rem' }}>
        <div
          style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'rgba(59,130,246,0.18)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto',
          }}
        >
          <span style={{ fontSize: '2.5rem', color: '#2563eb' }}>✔</span>
        </div>
        <h2 style={{ margin: 0 }}>下单成功</h2>
        <p style={{ margin: 0, color: 'rgba(15,23,42,0.6)' }}>我们的团队将在 1 个工作日内与您联系，确认订单详情。</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/shop" className="btn secondary">
            返回商城
          </Link>
          <Link to="/console" className="btn">
            查看订单
          </Link>
        </div>
      </div>
    </section>
  );
}
