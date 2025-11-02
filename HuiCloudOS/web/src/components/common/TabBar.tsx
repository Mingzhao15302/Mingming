interface TabBarProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

export default function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`tab-button ${active === tab ? 'bg-sky-500/40 shadow-glow' : ''}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
