import React from 'react';

export default function ModelReport({ report }) {
  if (!report) return <div style={s.card}><div style={s.label}>Model Report</div><div style={s.muted}>Loading…</div></div>;

  return (
    <div style={s.card}>
      <div style={s.label}>🧠 Model Comparison</div>
      <div style={s.best}>Best: <span style={{ color: '#06d6a0' }}>{report.best}</span></div>
      <table style={s.table}>
        <thead>
          <tr>{['Model','R²','MAE','RMSE'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {report.metrics?.map(m => (
            <tr key={m.name} style={{ background: m.name === report.best ? '#06d6a010' : 'transparent' }}>
              <td style={s.td}>{m.name === report.best ? '✓ ' : ''}{m.name}</td>
              <td style={{ ...s.td, color: '#06d6a0' }}>{m.r2.toFixed(4)}</td>
              <td style={s.td}>{m.mae.toFixed(2)}</td>
              <td style={s.td}>{m.rmse.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const s = {
  card:  { background: '#161616', border: '1px solid #2a2a2a', borderRadius: 12, padding: '14px 18px' },
  label: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#555', marginBottom: 8 },
  best:  { fontSize: '0.82rem', color: '#aaa', marginBottom: 10 },
  muted: { color: '#444', fontSize: '0.82rem' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' },
  th:    { color: '#555', textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #2a2a2a', fontWeight: 500 },
  td:    { padding: '5px 8px', borderBottom: '1px solid #1e1e1e', color: '#ccc' },
};
