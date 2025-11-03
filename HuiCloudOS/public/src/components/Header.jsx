import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../hooks/useApp.js';

const NAV_LINKS = [
  { to: '/', label: '欢迎页' },
  { to: '/login', label: '登录' },
  { to: '/gallery', label: '视频浏览' },
  { to: '/shop', label: '商城' },
  { to: '/cart', label: '购物车' },
  { to: '/console', label: '控制台' }
];

export const Header = () => {
  const location = useLocation();
  const { toggle } = useSidebar();

  return (
    <header className="global-header glass-card" role="banner">
      <button className="hamburger" aria-label="Toggle menu" onClick={toggle}>
        ☰
      </button>
      <div className="brand">
        <span>辉云易达 OS</span>
      </div>
      <nav className="desktop-nav" aria-label="Primary">
        {NAV_LINKS.map((item) => (
          <Link key={item.to} to={item.to} className={location.pathname === item.to ? 'active' : ''}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
};

export default Header;
