import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ open, onClose, routes }) {
  const location = useLocation();

  return (
    <aside
      className="hc-card"
      style={{
        position: 'fixed',
        top: '0',
        left: open ? '1.5rem' : '-320px',
        width: '260px',
        height: 'calc(100vh - 3rem)',
        marginTop: '1.5rem',
        padding: '1.2rem',
        transition: 'left 0.3s ease',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: '1.1rem' }}>导航</strong>
        <button type="button" onClick={onClose} aria-label="关闭导航" style={{ width: '36px', height: '36px' }}>
          ✕
        </button>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.75rem' }}>
        {routes.map((route) => {
          const active = location.pathname === route.to;
          return (
            <Link
              key={route.to}
              to={route.to}
              onClick={onClose}
              className={`hc-tab${active ? ' active' : ''}`}
              style={{ justifyContent: 'flex-start' }}
            >
              {route.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
