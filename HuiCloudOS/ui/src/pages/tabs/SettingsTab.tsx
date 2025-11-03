import { FormEvent, useState } from 'react';
import { useApp } from '../../app/AppContext';
import { api } from '../../app/api';

export function SettingsTab() {
  const { settings, refreshSettings } = useApp();
  const [form, setForm] = useState(() => ({
    company: settings?.company ?? { name: '', contact: '', address: '' },
    agents: settings?.agents ?? [],
  }));

  function updateCompany(key: string, value: string) {
    setForm((prev) => ({ ...prev, company: { ...prev.company, [key]: value } }));
  }

  function updateAgents(value: string) {
    const list = value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
    setForm((prev) => ({ ...prev, agents: list }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await api.updateSettings({ ...settings, ...form });
    await refreshSettings();
  }

  return (
    <form className="glass" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }} onSubmit={handleSubmit}>
      <h3 style={{ margin: 0 }}>公司配置</h3>
      <label style={{ display: 'grid', gap: '0.4rem' }}>
        <span style={{ fontWeight: 600 }}>公司名称</span>
        <input className="input" value={form.company.name} onChange={(event) => updateCompany('name', event.target.value)} />
      </label>
      <label style={{ display: 'grid', gap: '0.4rem' }}>
        <span style={{ fontWeight: 600 }}>联系方式</span>
        <input className="input" value={form.company.contact} onChange={(event) => updateCompany('contact', event.target.value)} />
      </label>
      <label style={{ display: 'grid', gap: '0.4rem' }}>
        <span style={{ fontWeight: 600 }}>地址</span>
        <input className="input" value={form.company.address} onChange={(event) => updateCompany('address', event.target.value)} />
      </label>
      <label style={{ display: 'grid', gap: '0.4rem' }}>
        <span style={{ fontWeight: 600 }}>业务员名单（用逗号或换行分隔）</span>
        <textarea
          className="textarea"
          rows={4}
          value={form.agents.join('\n')}
          onChange={(event) => updateAgents(event.target.value)}
        />
      </label>
      <button className="btn" type="submit">
        保存配置
      </button>
    </form>
  );
}
