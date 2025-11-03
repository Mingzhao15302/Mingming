import { Link } from 'react-router-dom';
import { useApp } from '../app/AppContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useApp();
  return (
    <header
      className="glass"
      style={{
        position: 'fixed',
        top: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(1100px, 92vw)',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 30,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.45)',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 12px 30px rgba(59,130,246,0.25)',
          }}
          aria-label="打开导航"
        >
          <div style={{ display: 'grid', gap: '6px' }}>
            <span style={{ width: '20px', height: '2px', background: '#1e3a8a' }} />
            <span style={{ width: '20px', height: '2px', background: '#1e3a8a' }} />
            <span style={{ width: '20px', height: '2px', background: '#1e3a8a' }} />
          </div>
        </button>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(59,130,246,0.85), rgba(14,165,233,0.85))',
              display: 'grid',
              placeItems: 'center',
              color: 'white',
              fontWeight: 700,
              boxShadow: '0 16px 32px rgba(59,130,246,0.4)',
              letterSpacing: '0.02em',
            }}
          >
            Hui
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>辉云易达 OS</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(15,23,42,0.65)' }}>HuiCloud OS Business Platform</div>
          </div>
        </Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/gallery" className="btn secondary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>
          视频浏览
        </Link>
        <Link to="/shop" className="btn secondary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>
          商城
        </Link>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="tag">欢迎，{user.name}</span>
            <button className="btn secondary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }} onClick={logout}>
              退出登录
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>
            登录控制台
          </Link>
        )}
      </div>
    </header>
  );
}
