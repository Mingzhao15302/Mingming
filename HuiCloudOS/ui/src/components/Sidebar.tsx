import { NavLink } from 'react-router-dom';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { to: '/', label: '欢迎页' },
  { to: '/login', label: '登录' },
  { to: '/gallery', label: '视频浏览' },
  { to: '/shop', label: '商城首页' },
  { to: '/cart', label: '购物车' },
  { to: '/console', label: '控制台' },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <aside className={`sidebar glass-soft ${open ? 'open' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1rem', letterSpacing: '0.08em', color: 'rgba(15,23,42,0.65)' }}>
          导航菜单
        </h2>
        <button
          style={{
            background: 'rgba(255,255,255,0.35)',
            width: '38px',
            height: '38px',
            borderRadius: '12px',
          }}
          onClick={onClose}
          aria-label="关闭导航"
        >
          ✕
        </button>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'active' : '')}
            onClick={onClose}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div style={{ marginTop: 'auto', paddingTop: '1.5rem', fontSize: '0.8rem', color: 'rgba(15,23,42,0.55)' }}>
        <p style={{ margin: '0 0 0.5rem' }}>辉云易达 OS</p>
        <p style={{ margin: 0 }}>全面业务中台 · 视频管理 · 报价系统 · 智能商城</p>
      </div>
    </aside>
  );
}
