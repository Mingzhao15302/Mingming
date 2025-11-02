import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-black/40 p-12 shadow-2xl shadow-cyan-500/10">
      <div className="absolute inset-0">
        <img
          src="/assets/backgrounds/home-hero.jpg"
          alt="辉云易达背景"
          className="h-full w-full rounded-3xl object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 rounded-3xl bg-slate-900/60 backdrop-blur-md" />
      </div>
      <div className="relative z-10 max-w-3xl space-y-6">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-cyan-200">
          液态玻璃体验 · 自适应布局
        </p>
        <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
          辉云易达 OS
          <span className="block text-2xl font-medium text-cyan-200 sm:text-3xl">
            一站式业务中台 · 登录控制台 / 视频演示 / 报价签约
          </span>
        </h1>
        <p className="text-lg text-white/70">
          统一的业务控制中心，提供视频库管理、商品商城、订单报价、合同导出等多模块服务，支持电脑、平板、手机多端访问。
        </p>
        <div className="flex flex-wrap gap-4">
          <Link to="/gallery" className="glass-button">
            进入视频浏览
          </Link>
          <Link to="/login" className="glass-button bg-white/10 hover:bg-white/20">
            登录控制台
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Home;
