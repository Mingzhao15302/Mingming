import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const links = [
  { to: '/', label: '欢迎页' },
  { to: '/login', label: '登录控制台' },
  { to: '/gallery', label: '视频浏览' },
  { to: '/shop', label: '商城首页' },
  { to: '/cart', label: '购物车' },
  { to: '/console', label: '控制台' },
];

interface SidebarProps {
  open: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const location = useLocation();
  return (
    <aside
      className={`fixed left-0 top-0 z-30 h-full w-72 transform bg-slate-900/70 p-6 text-white backdrop-blur-xl transition-transform duration-300 ease-out ${
        open ? 'translate-x-0' : '-translate-x-full'
      } lg:static lg:translate-x-0`}
    >
      <div className="mb-8 flex items-center gap-3">
        <img src="/assets/logos/huixin-logo.png" alt="辉云易达" className="h-12 w-12 rounded-full border border-white/20" />
        <div>
          <p className="text-sm text-white/60">业务中台</p>
          <h2 className="text-lg font-semibold">辉云易达 OS</h2>
        </div>
      </div>
      <nav className="space-y-2">
        {links.map((link) => {
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`block rounded-2xl px-4 py-3 transition ${
                active ? 'bg-cyan-500/30 text-white shadow-glow' : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
