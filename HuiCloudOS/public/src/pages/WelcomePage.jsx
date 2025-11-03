import React from 'react';
import HeroSection from '../components/HeroSection.jsx';

const WelcomePage = () => {
  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <HeroSection />
      <section className="glass-card" style={{ padding: '2rem' }}>
        <h2>统一的业务中台体验</h2>
        <p>
          辉云易达 OS 将视频展示、商城购物、报价合同、订单管理与系统维护整合在一个浏览器页面中。多端自适应界面保证电脑、平板、手机均可流畅使用。
        </p>
        <div className="grid cols-3" style={{ marginTop: '1.5rem' }}>
          {[
            { title: '视频演示库', desc: '上传 2000+ 视频，分类筛选、首帧自动生成、CSV 批量导入导出。' },
            { title: '商城交易', desc: '产品目录、购物车、结算下单全流程闭环，支持报价单 PDF 导出。' },
            { title: '控制台', desc: '多标签后台：视频库、报价、订单、商品、合同、导出、设置、维护。' }
          ].map((item) => (
            <article key={item.title} className="glass-card" style={{ padding: '1.5rem' }}>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default WelcomePage;
