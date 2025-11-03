import React from 'react';
import { useAppContext } from '../context/app-context.jsx';

const NAV_LINKS = [
  { label: '欢迎页', hash: '#/welcome' },
  { label: '登录', hash: '#/login' },
  { label: '视频浏览', hash: '#/gallery' },
  { label: '商城', hash: '#/shop' },
  { label: '购物车', hash: '#/cart' },
  { label: '控制台', hash: '#/console' }
];

export default function Header() {
  const { navigate, currentHash, user, setUser } = useAppContext();

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    navigate('#/login');
  };

  return (
    <header
      className="glass-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        position: 'sticky',
        top: '0',
        zIndex: 20,
        backdropFilter: 'blur(18px)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button
          aria-label="toggle sidebar"
          className="button-ghost"
          onClick={() => document.body.dispatchEvent(new CustomEvent('toggle-sidebar'))}
        >
          ☰
        </button>
        <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>HuiCloud OS</span>
        <nav style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {NAV_LINKS.map((link) => (
            <button
              key={link.hash}
              onClick={() => navigate(link.hash)}
              className="button-ghost"
              style={{
                background: currentHash.startsWith(link.hash) ? 'rgba(59, 130, 246, 0.25)' : undefined,
                color: currentHash.startsWith(link.hash) ? '#1d4ed8' : undefined
              }}
            >
              {link.label}
            </button>
          ))}
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user ? (
          <>
            <span style={{ fontWeight: 600 }}>欢迎，{user.name}</span>
            <button className="button-ghost" onClick={handleLogout}>
              退出登录
            </button>
          </>
        ) : (
          <button className="button-primary" onClick={() => navigate('#/login')}>
            登录控制台
          </button>
        )}
      </div>
    </header>
  );
}
