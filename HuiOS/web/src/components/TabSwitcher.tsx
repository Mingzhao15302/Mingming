import { ReactNode } from 'react'

interface TabItem {
  key: string
  label: string
  content: ReactNode
}

interface TabSwitcherProps {
  active: string
  onChange: (key: string) => void
  tabs: TabItem[]
}

const TabSwitcher = ({ active, onChange, tabs }: TabSwitcherProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`glass-button ${active === tab.key ? 'border-white/70 shadow-glow' : ''}`}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="glass-card p-6 min-h-[320px]">{tabs.find((tab) => tab.key === active)?.content}</div>
    </div>
  )
}

export default TabSwitcher
