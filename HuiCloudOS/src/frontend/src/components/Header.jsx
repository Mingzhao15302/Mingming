import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header({ onToggleSidebar, routes }) {
  const location = useLocation();

  return (
    <header
      className="hc-card"
      style={{
        position: 'fixed',
        top: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(1100px, 94vw)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.2rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        <button
          type="button"
          aria-label="切换导航"
          onClick={onToggleSidebar}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '46px',
            height: '46px',
            borderRadius: '16px',
            fontSize: '1.35rem'
          }}
        >
          ☰
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <strong style={{ fontSize: '1.2rem', letterSpacing: '0.02em' }}>HuiCloud OS</strong>
          <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>辉云易达业务中台</span>
        </div>
      </div>
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {routes.map((route) => {
          const active = location.pathname === route.to;
          return (
            <Link key={route.to} to={route.to} className={`hc-tab${active ? ' active' : ''}`}>
              {route.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
