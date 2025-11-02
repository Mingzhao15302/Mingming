import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';

const links = [
  { to: '/', label: '欢迎页' },
  { to: '/login', label: '登录' },
  { to: '/gallery', label: '视频浏览' },
  { to: '/shop', label: '商城' },
  { to: '/cart', label: '购物车' },
  { to: '/console', label: '控制台' }
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <div
      className={`fixed inset-0 z-50 transition ${
        open ? 'pointer-events-auto bg-slate-900/40 backdrop-blur-sm' : 'pointer-events-none bg-transparent'
      }`}
    >
      <aside
        className={`absolute left-0 top-0 h-full w-72 transform bg-slate-900/90 p-6 shadow-xl transition-transform ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-slate-100"
        >
          <X className="h-4 w-4" /> 关闭
        </button>
        <nav className="flex flex-col gap-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `rounded-xl px-4 py-3 text-base transition ${
                  isActive ? 'bg-sky-500/30 text-white shadow-glow' : 'bg-white/5 text-slate-100 hover:bg-white/10'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>
  );
}
