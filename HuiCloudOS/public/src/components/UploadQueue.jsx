import React from 'react';

export const UploadQueue = ({ items, onRetry }) => {
  if (!items.length) return null;
  return (
    <div className="glass-card" style={{ padding: '1rem', marginTop: '1rem' }}>
      <h3 style={{ marginTop: 0 }}>上传队列</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
        {items.map((item) => (
          <li key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{item.name}</div>
              <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.3)', overflow: 'hidden', marginTop: '0.35rem' }}>
                <div
                  style={{
                    width: `${item.progress}%`,
                    height: '100%',
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.9), rgba(14,165,233,0.8))'
                  }}
                />
              </div>
            </div>
            <div className="status-pill">{item.status}</div>
            {item.status === '失败' && (
              <button className="button secondary" onClick={() => onRetry?.(item.id)}>
                重试
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UploadQueue;
