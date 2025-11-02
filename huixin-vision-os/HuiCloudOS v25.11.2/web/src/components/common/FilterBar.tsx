import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface SelectFilter {
  id: string;
  label: string;
  options: string[];
}

export interface ToggleFilterGroup {
  id: string;
  label: string;
  options: { id: string; label: string }[];
}

interface FilterBarProps {
  selectFilters: SelectFilter[];
  toggleGroups?: ToggleFilterGroup[];
  selectValues: Record<string, string>;
  toggleValues: Record<string, string[]>;
  onSelectChange: (id: string, value: string) => void;
  onToggleChange: (groupId: string, optionId: string) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  selectFilters,
  toggleGroups = [],
  selectValues,
  toggleValues,
  onSelectChange,
  onToggleChange,
  expanded,
  onToggleExpand,
}) => {
  const visibleSelects = expanded ? selectFilters : selectFilters.slice(0, 8);
  const visibleToggles = expanded ? toggleGroups : toggleGroups.slice(0, 1);

  return (
    <section className="glass-card mb-6 space-y-4 p-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {visibleSelects.map((filter) => (
          <label key={filter.id} className="text-sm text-white/80">
            <span className="mb-2 block font-medium">{filter.label}</span>
            <select
              value={selectValues[filter.id] ?? ''}
              onChange={(event) => onSelectChange(filter.id, event.target.value)}
              className="glass-input w-full bg-white/10"
            >
              <option value="">全部</option>
              {filter.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {visibleToggles.length > 0 && (
        <div className="space-y-4">
          {visibleToggles.map((group) => (
            <div key={group.id} className="rounded-2xl bg-white/5 p-4">
              <p className="mb-2 text-sm font-semibold text-white/80">{group.label}</p>
              <div className="flex flex-wrap gap-3">
                {group.options.map((option) => {
                  const active = toggleValues[group.id]?.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onToggleChange(group.id, option.id)}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        active ? 'bg-cyan-500/40 text-white shadow-glow' : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      <button type="button" className="glass-button flex items-center gap-2" onClick={onToggleExpand}>
        {expanded ? (
          <>
            收起筛选
            <ChevronUp size={18} />
          </>
        ) : (
          <>
            展开更多
            <ChevronDown size={18} />
          </>
        )}
      </button>
    </section>
  );
};

export default FilterBar;
