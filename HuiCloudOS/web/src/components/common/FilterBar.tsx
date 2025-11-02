import { useMemo, useState } from 'react';
import { dropdownFields, multiChoiceFields } from '../video/filterConfig';

export type FiltersState = Record<string, string | string[]>;

interface FilterBarProps {
  filters: FiltersState;
  onChange: (filters: FiltersState) => void;
}

const productFieldMap: Record<string, string[]> = {
  灌装机: ['productType', 'fillingModel', 'capType', 'capacity', 'feed', 'explosionProof', 'fillingHeads', 'lidPlacement', 'capping', 'convey', 'buffer', 'voc'],
  自动线: [
    'productType',
    'autoLine',
    'capType',
    'capacity',
    'feed',
    'explosionProof',
    'barrelSplit',
    'fillingHeads',
    'cappingGuide',
    'lidPlacement',
    'capping',
    'convey',
    'buffer',
    'voc',
    'barrelPosition',
    'palletizing'
  ],
  码垛机: ['productType', 'capType', 'capacity', 'explosionProof', 'palletizing']
};

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);
  const productType = filters.productType as string;

  const dropdowns = useMemo(() => {
    if (!productType || !productFieldMap[productType]) {
      return dropdownFields;
    }
    const keys = new Set(productFieldMap[productType]);
    return dropdownFields.filter((field) => keys.has(field.key));
  }, [productType]);

  const multiChoice = useMemo(() => {
    if (productType === '自动线') {
      return multiChoiceFields;
    }
    return productType === '灌装机' ? multiChoiceFields.slice(0, 1) : [];
  }, [productType]);

  const visibleDropdowns = expanded ? dropdowns : dropdowns.slice(0, 8);

  const updateValue = (key: string, value: string | string[]) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleMulti = (key: string, option: string) => {
    const current = Array.isArray(filters[key]) ? (filters[key] as string[]) : [];
    const exists = current.includes(option);
    const next = exists ? current.filter((item) => item !== option) : [...current, option];
    updateValue(key, next);
  };

  return (
    <div className="glass-card space-y-6 p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {visibleDropdowns.map((field) => (
          <label key={field.key} className="flex flex-col gap-2 text-sm text-slate-200">
            <span>{field.label}</span>
            <select
              value={(filters[field.key] as string) ?? ''}
              onChange={(event) => updateValue(field.key, event.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {field.options.map((option) => (
                <option key={option} value={option}>
                  {option === '' ? '全部' : option}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {dropdowns.length > visibleDropdowns.length && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mx-auto block rounded-full bg-white/10 px-6 py-2 text-sm text-slate-100 hover:bg-white/20"
        >
          {expanded ? '收起筛选' : '展开更多'}
        </button>
      )}
      {multiChoice.length > 0 && (
        <div className="space-y-4">
          {multiChoice.map((group) => (
            <div key={group.key} className="flex flex-col gap-3 rounded-2xl bg-white/5 p-4 text-slate-100">
              <span className="text-sm font-medium text-sky-200">{group.label}</span>
              <div className="flex flex-wrap gap-3">
                {group.options.map((option) => {
                  const active = Array.isArray(filters[group.key]) && (filters[group.key] as string[]).includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleMulti(group.key, option)}
                      className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                        active ? 'bg-sky-500/40 shadow-glow text-white' : 'bg-white/10 text-slate-200 hover:bg-white/20'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
