import { useApp } from '../../app/AppContext';

export function MaintenanceTab() {
  const { dashboard } = useApp();
  const logs = dashboard?.audit ?? [];

  return (
    <div className="glass" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
      <h3 style={{ marginTop: 0 }}>系统日志</h3>
      <div className="glass-soft" style={{ padding: '1rem', maxHeight: '320px', overflowY: 'auto' }}>
        <ul style={{ display: 'grid', gap: '0.6rem' }}>
          {logs.map((log: any) => (
            <li key={log.id} className="glass-inline" style={{ padding: '0.7rem 0.9rem' }}>
              <div style={{ fontWeight: 600 }}>{log.type}</div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(15,23,42,0.6)' }}>{log.message}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(15,23,42,0.5)' }}>{new Date(log.timestamp).toLocaleString()}</div>
            </li>
          ))}
          {logs.length === 0 && <li style={{ color: 'rgba(15,23,42,0.55)' }}>暂无日志记录。</li>}
        </ul>
      </div>
      <div className="glass-soft" style={{ padding: '1rem' }}>
        <h4 style={{ marginTop: 0 }}>备份策略建议</h4>
        <p style={{ margin: 0, color: 'rgba(15,23,42,0.65)' }}>
          每周至少导出一次 JSON 备份，并定期备份视频文件夹，确保 2000+ 视频素材长期安全可用。
        </p>
      </div>
    </div>
  );
}
