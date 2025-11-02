import React, { useMemo, useState } from 'react';
import { FILTER_FIELDS, MULTI_FIELDS, PRODUCT_TYPES } from '../utils/constants.js';
import DropdownField from './fields/DropdownField.jsx';
import MultiSelectField from './fields/MultiSelectField.jsx';

export default function VideoMetaModal({ video, onClose, onSave }) {
  const [data, setData] = useState(() => ({ ...(video.meta || {}), 产品类型: video.meta?.产品类型 || video.productType }));
  const [saving, setSaving] = useState(false);
  const currentType = data.产品类型;

  const dropdownFields = useMemo(() => {
    if (currentType === '灌装机') {
      return [
        '灌装机型号',
        '桶盖',
        '容量',
        '来料方式',
        '防爆要求',
        '灌装方式',
        '放盖方式',
        '压盖方式',
        '输送方式',
        '缓存方式',
        'VOC要求'
      ];
    }
    if (currentType === '自动线') {
      return [
        '灌装自动线',
        '桶盖',
        '容量',
        '来料方式',
        '防爆要求',
        '分桶方式',
        '灌装方式',
        '理盖方式',
        '放盖方式',
        '压盖方式',
        '输送方式',
        '缓存方式',
        'VOC要求',
        '码垛方式'
      ];
    }
    if (currentType === '码垛机') {
      return ['桶盖', '容量', '防爆要求', '码垛方式'];
    }
    return [];
  }, [currentType]);

  const multiFields = useMemo(() => {
    if (currentType === '自动线') {
      return ['检重方式', '贴标方式', '托盘方式', '装箱方式', '其他功能'];
    }
    return [];
  }, [currentType]);

  const updateField = (key, value) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="hc-modal-backdrop">
      <div className="hc-card hc-modal" role="dialog" aria-modal="true">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{video.title || video.filename}</h3>
            <span style={{ opacity: 0.7 }}>{video.filename}</span>
          </div>
          <button type="button" onClick={onClose} style={{ width: '42px', height: '42px' }}>
            ✕
          </button>
        </header>
        <section style={{ display: 'grid', gap: '1rem' }}>
          <DropdownField label="产品类型" options={PRODUCT_TYPES} value={data.产品类型 || ''} onChange={(value) => updateField('产品类型', value)} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {dropdownFields.map((field) => (
              <DropdownField
                key={field}
                label={field}
                options={FILTER_FIELDS[field] || []}
                value={data[field] || ''}
                onChange={(value) => updateField(field, value)}
              />
            ))}
          </div>
          {multiFields.map((field) => (
            <MultiSelectField
              key={field}
              label={field}
              options={MULTI_FIELDS[field] || []}
              values={data[field] || []}
              onChange={(value) => updateField(field, value)}
            />
          ))}
        </section>
        <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onSave({ meta: data });
              setSaving(false);
            }}
          >
            保存
          </button>
        </footer>
      </div>
    </div>
  );
}
