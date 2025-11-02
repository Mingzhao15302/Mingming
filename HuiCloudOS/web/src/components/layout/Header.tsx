import { Link, NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';

const links = [
  { to: '/', label: '欢迎页' },
  { to: '/login', label: '登录' },
  { to: '/gallery', label: '视频浏览' },
  { to: '/shop', label: '商城' },
  { to: '/cart', label: '购物车' },
  { to: '/console', label: '控制台' }
];

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-glass bg-slate-900/70 border-b border-white/10">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 shadow hover:shadow-glow"
        >
          <Menu className="h-5 w-5" />
          导航
        </button>
        <Link to="/" className="flex items-center gap-3 text-lg font-semibold tracking-wide">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20 text-sky-300">HX</span>
          <span>辉云易达 OS</span>
        </Link>
        <nav className="hidden items-center gap-4 text-sm font-medium md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 transition ${
                  isActive ? 'bg-sky-500/30 text-white shadow-glow' : 'hover:bg-white/10 text-slate-200'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
