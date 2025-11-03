import React from 'react';
import HeroSection from '../components/HeroSection.jsx';
import { useAppContext } from '../context/app-context.jsx';

export default function WelcomePage() {
  const { navigate } = useAppContext();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <HeroSection
        title="辉云易达 HuiCloud OS"
        description="面向数字工厂的一体化业务中台，汇集视频演示、智能报价、订单履约与商城管理。"
        primaryAction={
          <button className="button-primary" onClick={() => navigate('#/gallery')}>
            进入视频浏览
          </button>
        }
        secondaryAction={
          <button className="button-ghost" onClick={() => navigate('#/login')}>
            登录控制台
          </button>
        }
      />
      <section className="glass-card" style={{ padding: '2rem', display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {[
          { title: '视频库管理', description: '批量上传、分类、首帧生成、CSV 导入导出与大规模分页浏览。' },
          { title: '报价系统', description: '模板化配置、优惠计算、报价单打印视图一键导出 PDF。' },
          { title: '商城&订单', description: '全流程商城体验，支持购物车、结算、合同与订单维护。' },
          { title: '维护中心', description: '系统日志、数据备份与设置维护，保障运行稳定。' }
        ].map((card) => (
          <div key={card.title} className="glass-card" style={{ padding: '1.25rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>{card.title}</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{card.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
