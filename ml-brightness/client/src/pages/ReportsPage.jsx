import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import reportData from '../data/reports.json';
import ModelCard from '../components/reports/ModelCard';
import { 
  MetricsBarChart, 
  PerformancePieChart, 
  ErrorTrendChart, 
  ModelRadarChart 
} from '../components/reports/ReportCharts';

// --- Professional "Midnight Glass" Theme ---
const THEME = {
  bg: '#020617', // Deep Midnight Navy (Standard for Pro Dev Tools)
  glass: 'rgba(255, 255, 255, 0.03)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  accent: '#22c55e', // Emerald
  textMain: '#f8fafc',
  textMuted: '#64748b',
  fontUI: "'Inter', sans-serif",
  fontMono: "'JetBrains Mono', monospace"
};

const best = reportData.metrics.find(m => m.name === reportData.best);

const SUMMARY = [
  { label: 'Best Model',    value: reportData.best,                 icon: '🏆', color: '#4ade80' },
  { label: 'Best R² Score', value: best?.r2.toFixed(6) ?? '--',         icon: '🎯', color: '#60a5fa' },
  { label: 'Best MAE',      value: best?.mae.toFixed(6) ?? '--',        icon: '📉', color: '#2dd4bf' },
  { label: 'Best RMSE',     value: best?.rmse.toFixed(6) ?? '--',       icon: '📊', color: '#a78bfa' },
  { label: 'Models Tested', value: reportData.metrics.length,           icon: '🧪', color: '#fbbf24' },
  { label: 'Avg R²',        value: (reportData.metrics.reduce((s,m) => s + m.r2, 0) / reportData.metrics.length).toFixed(4), icon: '📈', color: '#f472b6' },
];

const CHARTS = [
  { title: 'Metrics Comparison',    sub: 'Cross-model architecture analysis',          Component: MetricsBarChart },
  { title: 'Performance Weight',    sub: 'R² score distribution',                      Component: PerformancePieChart },
  { title: 'Error Progression',     sub: 'MAE/RMSE trend lines',                       Component: ErrorTrendChart },
  { title: 'Model Radar',           sub: 'Multi-dimensional capability map',           Component: ModelRadarChart },
];

export default function ReportsPage() {
  return (
    <div className="min-h-screen" style={{ background: THEME.bg, color: THEME.textMain, fontFamily: THEME.fontUI, paddingBottom: '80px' }}>
      
      {/* ── Midnight Glass Navigation ── */}
      <nav style={{ 
        borderBottom: `1px solid ${THEME.glassBorder}`, 
        background: 'rgba(2, 6, 23, 0.8)', 
        backdropFilter: 'blur(20px)', 
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky', 
        top: 0, 
        zIndex: 100 
      }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px', 
              background: `linear-gradient(135deg, ${THEME.accent}, #15803d)`, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '20px', 
              boxShadow: `0 0 20px ${THEME.accent}44` 
            }}>💡</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.5px' }}>MoodSense</div>
              <div style={{ fontSize: '10px', color: THEME.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Analytics Lab</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link to="/" style={{ color: THEME.textMuted, textDecoration: 'none', fontSize: '13px', fontWeight: 600, padding: '8px 16px' }}>Back</Link>
            <div style={{ background: THEME.accent, color: '#020617', padding: '8px 20px', borderRadius: '10px', fontSize: '12px', fontWeight: 900, letterSpacing: '0.5px' }}>REPORTS</div>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '48px 40px' }}>
        
        {/* ── Header ── */}
        <header style={{ marginBottom: '56px' }}>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: '52px', fontWeight: 900, letterSpacing: '-2.5px', marginBottom: '8px' }}>
            Model <span style={{ color: THEME.accent }}>Intelligence</span>
          </motion.h1>
          <p style={{ color: THEME.textMuted, fontSize: '17px' }}>Evaluative telemetry for adaptive IoT lighting systems.</p>
        </header>

        {/* ── KPI Grid (Enhanced Emoji Contrast) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '20px', marginBottom: '56px' }}>
          {SUMMARY.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -6, border: `1px solid ${THEME.accent}44`, transition: { duration: 0.2 } }}
              style={{
                background: THEME.glass,
                backdropFilter: 'blur(16px)',
                border: `1px solid ${THEME.glassBorder}`,
                borderRadius: '20px',
                padding: '28px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ 
                width: '60px', 
                height: '60px', 
                background: 'rgba(255,255,255,0.04)', 
                borderRadius: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '30px', 
                marginBottom: '20px'
              }}>{s.icon}</div>

              <div style={{ fontSize: '10px', color: THEME.textMuted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '6px' }}>{s.label}</div>
              <div style={{ 
                fontSize: s.label === 'Best Model' ? '20px' : '26px', 
                fontWeight: 900, 
                color: s.color, 
                fontFamily: THEME.fontMono, 
                letterSpacing: '-1px' 
              }}>{s.value}</div>

              {/* Accent Shine Effect */}
              <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '80px', height: '80px', background: s.color, filter: 'blur(50px)', opacity: 0.08 }} />
            </motion.div>
          ))}
        </div>

        {/* ── Visual Analysis Section ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '56px' }}>
          {CHARTS.map(({ title, sub, Component }, i) => (
            <div key={title} style={{ 
              background: THEME.glass, 
              border: `1px solid ${THEME.glassBorder}`, 
              borderRadius: '24px', 
              padding: '32px' 
            }}>
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800 }}>{title}</h3>
                <p style={{ fontSize: '13px', color: THEME.textMuted, marginTop: '4px' }}>{sub}</p>
              </div>
              <div style={{ height: '300px', width: '100%' }}>
                <Component data={reportData.metrics} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Table Section ── */}
        <div style={{ 
          background: THEME.glass, 
          border: `1px solid ${THEME.glassBorder}`, 
          borderRadius: '24px', 
          overflow: 'hidden' 
        }}>
          <div style={{ padding: '24px 32px', borderBottom: `1px solid ${THEME.glassBorder}`, background: 'rgba(255,255,255,0.01)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Full Metric Telemetry</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Architecture', 'R² Accuracy', 'MAE', 'RMSE', 'Rank'].map(h => (
                    <th key={h} style={{ padding: '16px 32px', fontSize: '11px', color: THEME.textMuted, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...reportData.metrics].sort((a, b) => b.r2 - a.r2).map((m, i) => (
                  <tr key={m.name} style={{ borderBottom: `1px solid ${THEME.glassBorder}`, transition: 'background 0.2s' }}>
                    <td style={{ padding: '20px 32px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.name === reportData.best ? THEME.accent : '#334155' }} />
                        <span style={{ fontWeight: 800, fontSize: '15px' }}>{m.name}</span>
                        {m.name === reportData.best && <span style={{ fontSize: '9px', background: `${THEME.accent}22`, color: THEME.accent, padding: '3px 8px', borderRadius: '5px', fontWeight: 900, marginLeft: '8px', border: `1px solid ${THEME.accent}44` }}>WINNER</span>}
                      </div>
                    </td>
                    <td style={{ padding: '20px 32px', fontFamily: THEME.fontMono, color: THEME.accent, fontWeight: 700 }}>{m.r2.toFixed(8)}</td>
                    <td style={{ padding: '20px 32px', fontFamily: THEME.fontMono, color: THEME.textMuted }}>{m.mae.toFixed(8)}</td>
                    <td style={{ padding: '20px 32px', fontFamily: THEME.fontMono, color: THEME.textMuted }}>{m.rmse.toFixed(8)}</td>
                    <td style={{ padding: '20px 32px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 900, color: i === 0 ? THEME.accent : THEME.textMuted }}>#{i + 1}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <footer style={{ marginTop: '80px', textAlign: 'center', opacity: 0.3, fontSize: '12px', letterSpacing: '2px', fontWeight: 800 }}>
          MOODSENSE ANALYTICS &bull; {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}