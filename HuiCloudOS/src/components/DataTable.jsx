import React from 'react';

export default function DataTable({ columns, data, actions }) {
  return (
    <div className="glass-card" style={{ overflow: 'hidden', borderRadius: '18px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  textAlign: 'left',
                  padding: '0.75rem 1rem',
                  background: 'rgba(59,130,246,0.1)',
                  color: '#0f172a',
                  fontWeight: 600
                }}
              >
                {column.title}
              </th>
            ))}
            {actions && <th style={{ width: '160px', padding: '0.75rem 1rem' }}>操作</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} style={{ borderTop: '1px solid rgba(148,163,184,0.2)' }}>
              {columns.map((column) => (
                <td key={column.key} style={{ padding: '0.75rem 1rem' }}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
              {actions && (
                <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
                  {actions.map((action) => (
                    <button key={action.label} className="button-ghost" onClick={() => action.onClick(row)}>
                      {action.label}
                    </button>
                  ))}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
