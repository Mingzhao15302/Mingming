import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../hooks/useApp.js';

const LINKS = [
  { to: '/', label: '欢迎页' },
  { to: '/login', label: '登录' },
  { to: '/gallery', label: '视频浏览' },
  { to: '/shop', label: '商城首页' },
  { to: '/cart', label: '购物车' },
  { to: '/console', label: '控制台' }
];

export const Sidebar = () => {
  const location = useLocation();
  const { isOpen, close } = useSidebar();

  return (
    <aside className={`sidebar glass-card ${isOpen ? 'open' : ''}`} role="complementary">
      <nav aria-label="Global">
        {LINKS.map((link) => (
          <Link key={link.to} to={link.to} className={location.pathname === link.to ? 'active' : ''} onClick={close}>
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
