interface TopBarProps {
  onMenuClick: () => void
}

const TopBar = ({ onMenuClick }: TopBarProps) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-4 bg-white/10 backdrop-blur-xl border-b border-white/20">
      <button className="lg:hidden glass-button" onClick={onMenuClick}>
        菜单
      </button>
      <div className="hidden lg:flex items-center gap-3">
        <button className="glass-button" onClick={onMenuClick}>
          ☰
        </button>
        <span className="text-sm uppercase tracking-widest text-white/80">Sidebar</span>
      </div>
      <h1 className="text-xl md:text-2xl font-semibold tracking-wide text-white drop-shadow">
        辉云易达 OS
      </h1>
      <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30" />
    </header>
  )
}

export default TopBar
