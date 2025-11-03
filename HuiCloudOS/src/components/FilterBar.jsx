import React, { useMemo, useState } from 'react';

const FIELDS = {
  productType: { label: '产品类型', options: ['灌装机', '自动线', '码垛机'] },
  fillerModel: { label: '灌装机型号', options: ['30A', '30B/BG', '30G/GY', 'ZSQ', 'HX200', '2T'] },
  capType: { label: '桶盖', options: ['塑料盖', '花篮盖', '小口桶盖', '圆形铁盖', '内外盖', '偏心口桶盖'] },
  capacity: { label: '容量', options: ['0.5~5L', '15~25L', '50L', '200L', '1000L'] },
  feedMode: {
    label: '来料方式',
    options: ['直接供料', '泵送', '过滤', '螺杆增压', '压料机', '拉缸', '角座阀', '手阀控制']
  },
  explosionProof: { label: '防爆要求', options: ['防爆', '不防爆'] },
  fillingHead: { label: '灌装方式', options: ['单头', '双头', '三头', '四头', '五头', '六头', '八头'] },
  capping: {
    label: '压盖方式',
    options: ['5L平板压', '20L平板压', '花篮压盖', '自动辊压', '自动拧盖', '助力拧盖', '自动封盖', '自动捶盖', '自动封袋', '人工压盖']
  },
  placing: {
    label: '放盖方式',
    options: ['单吸盘', '双吸盘', '小口桶自动落盖', '自动追踪放盖', '人工放盖']
  },
  conveyor: { label: '输送方式', options: ['滚筒', '板链', '步进'] },
  buffer: {
    label: '缓存方式',
    options: ['不锈钢面板', '无动力滚筒', '无动力滚筒延长架', '重托盘缓存输送']
  },
  voc: { label: 'VOC要求', options: ['一体式集气', '灌装阀集气'] },
  autoLine: {
    label: '灌装自动线',
    options: [
      '1~5L方桶灌装自动线',
      '1~5L圆桶灌装自动线',
      '15~25L铁桶灌装自动线',
      '15~25L塑料桶灌装自动线',
      '15~25L偏心口桶灌装自动线',
      '50~200L桶灌装自动线',
      'IBC桶灌装自动线',
      '袋式灌装线'
    ]
  },
  bucketSort: {
    label: '分桶方式',
    options: ['卧式分桶', '立式分桶', '抽底式分桶', '理桶平台', '自动卸桶', '人工上空桶']
  },
  capArrange: { label: '理盖方式', options: ['自动补盖', '转盘式理盖', '振动盘理盖'] },
  palletizing: {
    label: '码垛方式',
    options: ['机器人码垛', '悬臂式码垛', '龙门式码垛', '双工位机器人码垛', '双工位悬臂式码垛', '双工位龙门码垛']
  }
};

const MULTI_FIELDS = {
  weighing: { label: '检重方式', options: ['动态检重', '静态检重', '检重剔除'] },
  labeling: { label: '贴标方式', options: ['空桶贴标', '重桶贴标', '顶部贴标', '在线打印贴标'] },
  pallet: { label: '托盘方式', options: ['托盘库', '托盘分离', '空托盘换线输送', '重托盘换线输送'] },
  boxing: { label: '装箱方式', options: ['自动开箱', '自动装箱', '自动封箱', '自动码箱'] },
  extra: { label: '其他功能', options: ['自动充氮', '自动套内袋', '皮带输盖', '自动喷码', '自动缠绕', '自动捆扎', '180°翻桶'] }
};

function MultiToggle({ fieldKey, value = [], options, onChange }) {
  return (
    <div className="glass-card" style={{ padding: '0.75rem', borderRadius: '16px', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      <span style={{ fontWeight: 600, minWidth: '90px' }}>{MULTI_FIELDS[fieldKey].label}</span>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {options.map((option) => {
          const active = value.includes(option);
          return (
            <button
              key={option}
              className="button-ghost"
              style={{ background: active ? 'rgba(59,130,246,0.25)' : undefined, color: active ? '#1d4ed8' : undefined }}
              onClick={() => {
                const next = active ? value.filter((item) => item !== option) : [...value, option];
                onChange(next);
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FilterBar({ value = {}, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const productType = value.productType || '灌装机';

  const fieldsToRender = useMemo(() => {
    if (productType === '灌装机') {
      return ['productType', 'fillerModel', 'capType', 'capacity', 'feedMode', 'explosionProof', 'fillingHead', 'placing', 'capping', 'conveyor', 'buffer', 'voc'];
    }
    if (productType === '自动线') {
      return [
        'productType',
        'autoLine',
        'capType',
        'capacity',
        'feedMode',
        'explosionProof',
        'bucketSort',
        'fillingHead',
        'capArrange',
        'placing',
        'capping',
        'conveyor',
        'buffer',
        'voc',
        'palletizing'
      ];
    }
    return ['productType', 'capType', 'capacity', 'explosionProof', 'palletizing'];
  }, [productType]);

  const multiFields = useMemo(() => {
    if (productType === '自动线') {
      return ['weighing', 'labeling', 'pallet', 'boxing', 'extra'];
    }
    return [];
  }, [productType]);

  const handleSelect = (key, newValue) => {
    onChange?.({ ...value, [key]: newValue });
  };

  const rows = expanded ? fieldsToRender : fieldsToRender.slice(0, 8);

  return (
    <section className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>筛选条件</h3>
        <button className="button-ghost" onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? '收起' : '展开'}
        </button>
      </div>
      <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {rows.map((key) => (
          <label key={key} className="glass-card" style={{ padding: '0.75rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontWeight: 600 }}>{FIELDS[key].label}</span>
            <select
              value={value[key] || ''}
              onChange={(event) => handleSelect(key, event.target.value)}
              style={{
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.6)',
                padding: '0.5rem',
                background: 'rgba(255,255,255,0.4)'
              }}
            >
              <option value="">全部</option>
              {FIELDS[key].options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {multiFields.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {multiFields.map((multiKey) => (
            <MultiToggle
              key={multiKey}
              fieldKey={multiKey}
              value={value[multiKey] || []}
              options={MULTI_FIELDS[multiKey].options}
              onChange={(next) => handleSelect(multiKey, next)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
