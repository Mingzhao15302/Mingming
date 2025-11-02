import { Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import Button from '../components/common/Button';

export default function Home() {
  return (
    <AppShell>
      <section
        className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-cover bg-center p-10 text-center"
        style={{ backgroundImage: 'url(/static/assets/backgrounds/home-hero.jpg)' }}
      >
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
        <div className="relative z-10 flex max-w-3xl flex-col items-center gap-6 text-white">
          <img src="/static/assets/logos/huixin-logo.png" alt="辉云易达" className="h-16 w-auto" />
          <h1 className="text-4xl font-bold md:text-5xl">辉云易达 OS · 智能业务中台</h1>
          <p className="text-lg text-slate-200">
            集成视频演示、智能报价、商城订购与后台运维的全链路平台，助力灌装自动化解决方案的快速交付。
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/gallery">
              <Button className="px-8 py-3 text-base">进入视频浏览</Button>
            </Link>
            <Link to="/login">
              <Button className="bg-white/20 px-8 py-3 text-base text-white hover:bg-white/40">登录控制台</Button>
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
