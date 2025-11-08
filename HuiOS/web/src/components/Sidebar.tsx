import { NavLink } from 'react-router-dom'

const menuItems = [
  { path: '/', label: 'HOME' },
  { path: '/login', label: '登录' },
  { path: '/videos', label: '视频浏览' },
  { path: '/shop', label: '商城' },
  { path: '/cart', label: '购物车' },
  { path: '/console', label: '控制台' }
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white/10 backdrop-blur-xl border-r border-white/20 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/30 backdrop-blur-md" />
          <span className="font-semibold tracking-widest text-white">辉云易达</span>
        </div>
        <button className="lg:hidden glass-button" onClick={onClose}>
          关闭
        </button>
      </div>
      <nav className="flex flex-col p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `glass-card px-4 py-3 transition-all duration-200 ${
                isActive ? 'border-white/60 shadow-glow' : 'hover:shadow-glow'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
