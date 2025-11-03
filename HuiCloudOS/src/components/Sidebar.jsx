import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/app-context.jsx';

const LINKS = [
  { label: '欢迎页', hash: '#/welcome' },
  { label: '登录', hash: '#/login' },
  { label: '视频浏览', hash: '#/gallery' },
  { label: '商城首页', hash: '#/shop' },
  { label: '购物车', hash: '#/cart' },
  { label: '控制台', hash: '#/console' }
];

export default function Sidebar() {
  const { currentHash, navigate } = useAppContext();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const toggle = () => setOpen((prev) => !prev);
    document.body.addEventListener('toggle-sidebar', toggle);
    return () => document.body.removeEventListener('toggle-sidebar', toggle);
  }, []);

  return (
    <aside
      className="glass-card"
      style={{
        width: open ? '240px' : '0',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        padding: open ? '1rem' : '0',
        margin: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}
    >
      {LINKS.map((link) => (
        <button
          key={link.hash}
          onClick={() => navigate(link.hash)}
          className="button-ghost"
          style={{
            justifyContent: 'flex-start',
            background: currentHash.startsWith(link.hash) ? 'rgba(59, 130, 246, 0.25)' : undefined,
            color: currentHash.startsWith(link.hash) ? '#1d4ed8' : undefined
          }}
        >
          {link.label}
        </button>
      ))}
    </aside>
  );
}
