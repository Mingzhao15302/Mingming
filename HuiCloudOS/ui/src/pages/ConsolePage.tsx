import { useState } from 'react';
import { VideoLibraryTab } from './tabs/VideoLibraryTab';
import { QuoteModuleTab } from './tabs/QuoteModuleTab';
import { OrderModuleTab } from './tabs/OrderModuleTab';
import { ProductModuleTab } from './tabs/ProductModuleTab';
import { ContractModuleTab } from './tabs/ContractModuleTab';
import { ExportModuleTab } from './tabs/ExportModuleTab';
import { SettingsTab } from './tabs/SettingsTab';
import { MaintenanceTab } from './tabs/MaintenanceTab';

const TABS = [
  { key: 'videos', label: '视频库', component: <VideoLibraryTab /> },
  { key: 'quotes', label: '报价模块', component: <QuoteModuleTab /> },
  { key: 'orders', label: '订单模块', component: <OrderModuleTab /> },
  { key: 'products', label: '商品模块', component: <ProductModuleTab /> },
  { key: 'contracts', label: '合同模板', component: <ContractModuleTab /> },
  { key: 'export', label: '导出', component: <ExportModuleTab /> },
  { key: 'settings', label: '设置', component: <SettingsTab /> },
  { key: 'maintenance', label: '维护', component: <MaintenanceTab /> },
];

export function ConsolePage() {
  const [active, setActive] = useState(TABS[0].key);
  const current = TABS.find((tab) => tab.key === active) ?? TABS[0];

  return (
    <section style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="glass" style={{ padding: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-button ${tab.key === active ? 'active' : ''}`}
            onClick={() => setActive(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{current.component}</div>
    </section>
  );
}
