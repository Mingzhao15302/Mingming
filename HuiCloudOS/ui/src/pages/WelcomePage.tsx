import { Link } from 'react-router-dom';

export function WelcomePage() {
  return (
    <section style={{ display: 'grid', alignItems: 'center', minHeight: 'calc(100vh - 140px)' }}>
      <div
        className="glass"
        style={{
          padding: '4rem clamp(2rem, 8vw, 6rem)',
          display: 'grid',
          gap: '2.5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ fontSize: '1rem', letterSpacing: '0.35em', color: 'rgba(15,23,42,0.55)' }}>HuiCloud OS</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', margin: 0 }}>辉云易达 · 液态玻璃业务中台</h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(15,23,42,0.65)', margin: 0 }}>
            面向灌装装备行业打造的视频素材库、商城、报价与订单一体化平台。全端自适应，助力业务快速部署。
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link to="/gallery" className="btn" style={{ minWidth: '200px' }}>
            进入视频浏览
          </Link>
          <Link to="/login" className="btn secondary" style={{ minWidth: '200px' }}>
            登录控制台
          </Link>
        </div>
        <div
          className="glass-soft"
          style={{
            padding: '1.5rem',
            borderRadius: '18px',
            display: 'grid',
            gap: '1rem',
            background: 'rgba(255,255,255,0.35)',
          }}
        >
          <div style={{ fontWeight: 600 }}>平台亮点</div>
          <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
            {[
              '多端自适应液态玻璃 UI',
              '视频库批量上传与分类',
              '多维筛选 + 懒加载',
              '商城下单 & 报价系统',
              'CSV 导入导出 + Web Worker 解析',
            ].map((feature) => (
              <div key={feature} className="glass-inline" style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
