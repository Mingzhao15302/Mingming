import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <section style={{ display: 'grid', placeItems: 'center', flex: 1 }}>
      <div
        className="hc-card"
        style={{
          width: 'min(840px, 95vw)',
          padding: '4rem 3.5rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 55%), radial-gradient(circle at 80% 30%, rgba(120,180,255,0.15), transparent 65%)',
            zIndex: 0
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '3.2rem', marginBottom: '1.25rem' }}>辉云易达 HuiCloud OS</h1>
            <p style={{ fontSize: '1.1rem', lineHeight: 1.7, maxWidth: '640px', margin: '0 auto', opacity: 0.85 }}>
              一个集视频演示、商城运营、报价下单与多维分类于一体的液态玻璃风格业务中台。
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => navigate('/gallery')}>
              进入视频浏览
            </button>
            <button type="button" onClick={() => navigate('/login')}>
              登录控制台
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
