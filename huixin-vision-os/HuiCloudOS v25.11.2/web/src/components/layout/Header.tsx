import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../common/AuthProvider';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const navItems = [
  { to: '/', label: '欢迎页' },
  { to: '/login', label: '登录' },
  { to: '/gallery', label: '视频浏览' },
  { to: '/shop', label: '商城' },
  { to: '/cart', label: '购物车' },
  { to: '/console', label: '控制台' },
];

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-glass-medium/60 px-6 py-4 backdrop-blur-md shadow-lg">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="glass-button flex items-center gap-2 px-4 py-2 text-sm"
        aria-label="切换侧边栏"
      >
        <Menu size={18} />
        菜单
      </button>
      <Link to="/" className="flex items-center gap-3 text-lg font-semibold tracking-wide">
        <img src="/assets/logos/huixin-logo.png" alt="辉云易达" className="h-10 w-10 rounded-full border border-white/20" />
        辉云易达 OS
      </Link>
      <nav className="hidden items-center gap-4 text-sm lg:flex">
        {navItems.map((item) => (
          <Link key={item.to} to={item.to} className="text-white/80 transition hover:text-white">
            {item.label}
          </Link>
        ))}
      </nav>
      {isAuthenticated ? (
        <button type="button" className="glass-button" onClick={logout}>
          退出登录
        </button>
      ) : (
        <Link to="/login" className="glass-button">
          登录
        </Link>
      )}
    </header>
  );
};

export default Header;
