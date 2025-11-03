import { useState } from 'react';

export function ContractModuleTab() {
  const [contracts, setContracts] = useState<string[]>([]);

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setContracts((prev) => [...prev, ...files.map((file) => file.name)]);
    event.target.value = '';
  }

  return (
    <div className="glass" style={{ padding: '1.5rem', display: 'grid', gap: '1.5rem' }}>
      <div>
        <h3 style={{ marginTop: 0 }}>合同模板上传</h3>
        <label className="btn secondary" style={{ cursor: 'pointer' }}>
          上传模板
          <input type="file" accept=".html,.docx,.pdf" style={{ display: 'none' }} onChange={handleUpload} />
        </label>
      </div>
      <section>
        <h3 style={{ marginTop: 0 }}>已上传模板</h3>
        <ul style={{ display: 'grid', gap: '0.6rem' }}>
          {contracts.map((name) => (
            <li key={name} className="glass-inline" style={{ padding: '0.8rem 1rem' }}>
              {name}
            </li>
          ))}
          {contracts.length === 0 && <li style={{ color: 'rgba(15,23,42,0.55)' }}>暂无合同模板，上传后可在此展示。</li>}
        </ul>
      </section>
    </div>
  );
}
