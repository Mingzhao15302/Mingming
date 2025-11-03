import React, { useMemo, useState } from 'react';
import { CATEGORY_OPTIONS, FIELD_LABELS, FIELD_GROUPS, MULTI_GROUPS, MULTI_SELECT_FIELDS } from '../modules/categories.js';

export const FilterBar = ({ filters, onChange }) => {
  const [expanded, setExpanded] = useState(false);
  const activeFields = useMemo(() => {
    const productType = filters.productType || '灌装机';
    return FIELD_GROUPS[productType] || [];
  }, [filters.productType]);

  const multiFields = useMemo(() => {
    const productType = filters.productType || '灌装机';
    return MULTI_GROUPS[productType] || [];
  }, [filters.productType]);

  const handleChange = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  const handleMulti = (field, option) => {
    const current = new Set(filters[field] || []);
    if (current.has(option)) {
      current.delete(option);
    } else {
      current.add(option);
    }
    onChange({ ...filters, [field]: Array.from(current) });
  };

  return (
    <div className={`filter-bar glass-card ${expanded ? '' : 'collapsed'}`}>
      <div className="field">
        <label htmlFor="productType">{FIELD_LABELS.productType}</label>
        <select
          id="productType"
          className="select"
          value={filters.productType || ''}
          onChange={(event) => handleChange('productType', event.target.value)}
        >
          <option value="">全部</option>
          {CATEGORY_OPTIONS.productType.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="keyword">关键字</label>
        <input
          id="keyword"
          className="input"
          placeholder="搜索视频名称、型号、标签"
          value={filters.keyword || ''}
          onChange={(event) => handleChange('keyword', event.target.value)}
        />
      </div>
      {activeFields.map((field) => (
        <div className="field" key={field}>
          <label htmlFor={field}>{FIELD_LABELS[field]}</label>
          <select
            id={field}
            className="select"
            value={filters[field] || ''}
            onChange={(event) => handleChange(field, event.target.value)}
          >
            <option value="">全部</option>
            {CATEGORY_OPTIONS[field].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      ))}
      {multiFields.map((group) => (
        <div className="field" key={group}>
          <span>{FIELD_LABELS[group]}</span>
          <div className="multi-select">
            {MULTI_SELECT_FIELDS[group].map((option) => (
              <label key={option}>
                <input
                  type="checkbox"
                  checked={(filters[group] || []).includes(option)}
                  onChange={() => handleMulti(group, option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      <button type="button" className="button secondary" onClick={() => setExpanded((prev) => !prev)}>
        {expanded ? '收起筛选' : '展开更多'}
      </button>
    </div>
  );
};

export default FilterBar;
