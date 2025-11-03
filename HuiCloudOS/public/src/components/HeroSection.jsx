import React from 'react';
import { Link } from 'react-router-dom';

export const HeroSection = () => {
  return (
    <section
      className="glass-card fade-in"
      style={{
        padding: '3rem',
        textAlign: 'center',
        color: 'white',
        display: 'grid',
        gap: '1.5rem',
        justifyItems: 'center'
      }}
    >
      <div style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 700 }}>辉云易达 OS</div>
      <p style={{ maxWidth: '600px', fontSize: '1.1rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.75)' }}>
        在一个浏览器页面内完成企业视频演示、商城下单、报价合同与中后台维护。液态玻璃风格界面让复杂流程清晰可见。
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/gallery" className="button">
          进入视频浏览
        </Link>
        <Link to="/login" className="button secondary">
          登录控制台
        </Link>
      </div>
    </section>
  );
};

export default HeroSection;
