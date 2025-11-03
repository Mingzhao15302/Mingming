import React from 'react';

export const SpecsTable = ({ specs = {} }) => {
  const entries = Object.entries(specs);
  if (!entries.length) return null;
  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <h3 style={{ marginTop: 0 }}>技术参数</h3>
      <table className="table">
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key}>
              <th style={{ width: '160px' }}>{key}</th>
              <td>{Array.isArray(value) ? value.join(' / ') : value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SpecsTable;
