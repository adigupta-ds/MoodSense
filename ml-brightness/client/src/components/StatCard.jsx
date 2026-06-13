import React from 'react';

export default function StatCard({ label, value, unit, color = '#4cc9f0', sub }) {
  return (
    <div style={s.card}>
      <div style={s.label}>{label}</div>
      <div style={{ ...s.value, color }}>{value}<span style={s.unit}>{unit}</span></div>
      {sub && <div style={s.sub}>{sub}</div>}
    </div>
  );
}

const s = {
  card:  { background: '#161616', border: '1px solid #2a2a2a', borderRadius: 12, padding: '14px 18px' },
  label: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#555', marginBottom: 6 },
  value: { fontSize: '1.8rem', fontWeight: 700, lineHeight: 1 },
  unit:  { fontSize: '0.85rem', marginLeft: 4, color: '#666' },
  sub:   { fontSize: '0.72rem', color: '#555', marginTop: 4 },
};
