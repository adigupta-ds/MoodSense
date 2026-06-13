import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

import KpiCard        from './components/KpiCard';
import ImpactCard, { calcImpact } from './components/ImpactCard';
import EfficiencyBadge from './components/EfficiencyBadge';
import { LiveEnergyChart, SavingsChart, LuxBrightnessChart, EnvChart } from './components/EnergyChart';
import ControlPanel   from './components/ControlPanel';
import MLInsight      from './components/MLInsight';
import EnvPanel       from './components/EnvPanel';
import CameraLux      from './components/CameraLux';
import ExportButton   from './components/ExportButton';
import LuxGauge       from './components/LuxGauge';

const SCREEN_WATTS = 5;
const calcKwh = (brightness) => (brightness / 100 * SCREEN_WATTS) / 3600;
const energy_saving = (predicted) => Math.max(0, Math.round(100 - predicted));

export default function App() {
  const [state,       setState]      = useState(null);
  const [report,      setReport]     = useState(null);
  const [history,     setHistory]    = useState([]);
  const [weather,     setWeather]    = useState(null);
  const [autoMode,    setAutoMode]   = useState(true);
  const [manualVal,   setManualVal]  = useState(50);
  const [lux,         setLux]        = useState(null);
  const [prevLux,     setPrevLux]    = useState(null);
  const [lastPred,    setLastPred]   = useState(null);  
  const [kwhSaved,    setKwhSaved]   = useState(0);
  const [kwhBaseline, setKwhBaseline]= useState(0);
  const [activeTab,   setActiveTab]  = useState('overview');
  const debounce = useRef(null);

  useEffect(() => {
    fetch('/report').then(r => r.json()).then(setReport).catch(() => {});
    fetch('/weather').then(r => r.json()).then(setWeather).catch(() => {});
    fetch('/status').then(r => r.json()).then(d => setState(d.state)).catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res  = await fetch('/status');
        const data = await res.json();
        if (!data.state) return;
        const s = data.state;
        setState(s);
        setLastPred({ predicted: s.predicted, actual: s.actual });

        const mlKwh   = calcKwh(s.predicted);
        const baseKwh = calcKwh(100);

        setKwhSaved(prev   => prev   + (baseKwh - mlKwh));
        setKwhBaseline(prev => prev  + baseKwh);

        setHistory(h => {
          const entry = {
            time:     new Date().toLocaleTimeString(),
            lux:      s.lux,
            ml:       s.predicted,
            actual:   s.actual,
            baseline: 100,
            saving:   energy_saving(s.predicted),
            temp:     s.temperature,
            humidity: s.humidity,
          };
          return [...h.slice(-59), entry];
        });
      } catch {}
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const onManualChange = useCallback((val) => {
    setManualVal(val);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      fetch('http://127.0.0.1:7777/brightness', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: val }),
      }).catch(() => {});
      fetch('/mode', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual_override: true, manual_level: val }),
      }).catch(() => {});
    }, 80);
  }, []);

  async function toggleMode(auto) {
    setAutoMode(auto);
    await fetch('/mode', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auto_mode: auto, manual_override: !auto }),
    }).catch(() => {});
  }

  const pred     = lastPred?.predicted ?? state?.predicted ?? 50;
  const actual   = lastPred?.actual    ?? state?.actual    ?? 50;
  const saving   = energy_saving(pred);
  const effScore = Math.round(saving);
  const impact   = calcImpact(kwhSaved);

  return (
    <div className="min-h-screen text-slate-200" style={{ background: '#020617' }}>
      
      {/* Background Radial Glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ 
        background: 'radial-gradient(circle at 50% -20%, #1e293b 0%, #020617 70%)',
        zIndex: 0 
      }} />

      {/* ── HEADER ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 60px', height: 100,
        borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
        background: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(50px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div className="flex items-center gap-6">
          <div style={{ 
            width: 48, height: 48, borderRadius: 14, 
            background: 'linear-gradient(135deg, #22c55e, #166534)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            boxShadow: '0 0 40px rgba(34, 197, 94, 0.2)' 
          }}>💡</div>
          <div>
            <div style={{ fontWeight: 950, fontSize: 22, letterSpacing: '-1.2px', color: '#f8fafc' }}>MoodSense</div>
            <div style={{ fontSize: 9, color: '#22c55e', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '4px' }}>Intelligence_Lab.v4</div>
          </div>
        </div>

        <nav style={{ 
          display: 'flex', alignItems: 'center', gap: 6, padding: '5px', 
          borderRadius: 24, background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)' 
        }}>
          {[
            { id: 'overview',    icon: '⬡', label: 'Overview' },
            { id: 'energy',      icon: '⚡', label: 'Energy' },
            { id: 'environment', icon: '🌦️', label: 'Environment' },
            { id: 'ml',          icon: '🧠', label: 'ML Models' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 28px', borderRadius: 20,
                fontSize: 11, fontWeight: 950, border: 'none', cursor: 'pointer',
                transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                background: activeTab === t.id ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                color: activeTab === t.id ? '#f8fafc' : '#475569',
                boxShadow: activeTab === t.id ? 'inset 0 0 12px rgba(255,255,255,0.02)' : 'none',
              }}
            >
              <span style={{ fontSize: 16, opacity: activeTab === t.id ? 1 : 0.4 }}>{t.icon}</span> 
              {t.label.toUpperCase()}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <ExportButton history={history} kwhSaved={kwhSaved} efficiencyScore={effScore} report={report}/>
          <Link to="/ml-reports" style={{
            padding: '14px 36px', borderRadius: 16, fontSize: 11, fontWeight: 950,
            background: '#22c55e', color: '#020617', textDecoration: 'none',
            boxShadow: '0 15px 35px rgba(34, 197, 94, 0.2)', letterSpacing: '1.5px'
          }}>ANALYTICS</Link>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto relative z-10" style={{ padding: '60px 60px 100px 60px' }}>
        <AnimatePresence mode="wait">
          
          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-10">
              <div className="grid grid-cols-6 gap-6">
                <LuxGauge lux={lux} prevLux={prevLux}/>
                <KpiCard icon="🤖" label="ML Target" value={pred} unit="%" color="#a855f7" sub={report?.best}/>
                <KpiCard icon="🖥️" label="Live Output" value={actual} unit="%" color="#0ea5e9" sub={autoMode ? 'Adaptive' : 'Manual'}/>
                <KpiCard icon="⚡" label="Efficiency" value={saving} unit="%" color="#22c55e" sub="Optimization Active"/>
                <KpiCard icon="🌫️" label="CO₂ Saved" value={impact.co2} unit="kg" color="#22c55e" sub="Total Session"/>
                <KpiCard icon="🌡️" label="Node Temp" value={weather?.temperature ?? '--'} unit="°C" color="#f43f5e" sub={weather?.city}/>
              </div>

              <div className="grid grid-cols-12 gap-10">
                <div className="col-span-3 flex flex-col gap-8">
                  <CameraLux onLux={(val) => { setPrevLux(lux); setLux(val); }}/>
                  <ControlPanel autoMode={autoMode} onToggleMode={toggleMode} manualVal={manualVal} onManualChange={onManualChange} predicted={pred}/>
                </div>
                <div className="col-span-6 flex flex-col gap-10">
                  <div className="glass p-10 rounded-[40px]" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="text-[10px] font-black uppercase tracking-[4px] mb-8 opacity-20">📈 Intelligence vs Baseline Delta</div>
                    <LiveEnergyChart data={history}/>
                  </div>
                  <div className="glass p-10 rounded-[40px]" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="text-[10px] font-black uppercase tracking-[4px] mb-8 opacity-20">☀️ Photometric Correlation Matrix</div>
                    <LuxBrightnessChart data={history}/>
                  </div>
                </div>
                <div className="col-span-3 flex flex-col gap-8">
                  <EfficiencyBadge score={effScore}/>
                  <ImpactCard kwhSaved={kwhSaved}/>
                  <EnvPanel weather={weather} state={state}/>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── ENERGY TAB ── */}
          {activeTab === 'energy' && (
            <motion.div key="energy" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-12">
              <div className="grid grid-cols-4 gap-8">
                <KpiCard icon="⚡" label="Accumulated Savings" value={kwhSaved.toFixed(5)} unit="kWh" color="#22c55e"/>
                <KpiCard icon="🔋" label="Baseline (100%)" value={kwhBaseline.toFixed(5)} unit="kWh" color="#f43f5e"/>
                <KpiCard icon="📉" label="Power Reduction" value={kwhBaseline > 0 ? ((kwhSaved/kwhBaseline)*100).toFixed(1) : 0} unit="%" color="#0ea5e9"/>
                <KpiCard icon="🌳" label="Carbon Sequestration" value={impact.trees} unit="Tree-Days" color="#22c55e"/>
              </div>

              {/* Comparison Section - The Dark monolith */}
              <div style={{ 
                background: 'rgba(2, 6, 23, 0.5)', 
                border: '1px solid rgba(255, 255, 255, 0.05)', 
                borderRadius: '56px', 
                padding: '80px', 
                backdropFilter: 'blur(30px)',
                boxShadow: '0 40px 100px rgba(0,0,0,0.4)'
              }}>
                <div className="flex items-center gap-8 mb-20">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/[0.02] border border-white/[0.05] text-3xl shadow-inner">📊</div>
                  <div className="flex flex-col gap-2">
                    <h2 className="text-[42px] font-black tracking-[-2px] text-white/95 uppercase leading-none">Efficiency Matrix</h2>
                    <p className="text-[10px] font-mono opacity-20 tracking-[5px] uppercase">Node_Analysis_B82 // Dynamic_Comparison</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-32 relative">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.03]" style={{ transform: 'translateX(-50%)' }} />
                  {[
                    { label: 'Baseline Logic', value: kwhBaseline.toFixed(5), sub: 'STATIC 100% INTENSITY', color: '#f43f5e', tag: 'SYSTEM_INEFFICIENT' },
                    { label: 'Intelligence Logic', value: (kwhBaseline - kwhSaved).toFixed(5), sub: 'NEURAL VOLTAGE SCALING', color: '#22c55e', tag: 'SYSTEM_OPTIMIZED' },
                  ].map((c) => (
                    <div key={c.label} className="flex flex-col gap-12 group">
                      <div className="flex items-center gap-5">
                        <div className="w-3.5 h-3.5 rounded-full" style={{ background: c.color, boxShadow: `0 0 25px ${c.color}` }} />
                        <span className="text-[12px] font-black tracking-[4px] opacity-60" style={{ color: c.color }}>{c.tag}</span>
                      </div>
                      <div className="flex flex-col gap-3">
                        <span className="text-[22px] font-black text-white/90 letter-spacing-tight uppercase">{c.label}</span>
                        <span className="text-[11px] font-black opacity-10 tracking-[3px]">{c.sub}</span>
                      </div>
                      <div className="flex items-baseline gap-6">
                        <span style={{ 
                            fontSize: '96px', 
                            fontWeight: 950, 
                            color: c.color, 
                            fontFamily: "'JetBrains Mono', monospace", 
                            letterSpacing: '-6px', 
                            lineHeight: 0.7 
                        }}>
                          {c.value}
                        </span>
                        <span className="text-xl font-black opacity-10 tracking-[3px]">kWh</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multi-Metric Impact Grid */}
              <div className="grid grid-cols-5 gap-8">
                {[
                  { icon: '🌫️', label: 'CO₂ Avoidance', value: `${impact.co2} kg`, color: '#22c55e' },
                  { icon: '🚗', label: 'Travel Offset', value: `${impact.car} km`, color: '#22c55e' },
                  { icon: '✈️', label: 'Air Equivalent', value: `${impact.flight}% Flight`, color: '#0ea5e9' },
                  { icon: '🌳', label: 'Sequestration', value: `${impact.trees} Days`, color: '#22c55e' },
                  { icon: '💡', label: 'LED Runtime', value: `${impact.bulb} hrs`, color: '#f59e0b' },
                ].map(item => (
                  <motion.div key={item.label} whileHover={{ y: -10, background: 'rgba(255,255,255,0.02)' }} className="glass p-10 flex flex-col items-center gap-5 text-center rounded-[32px] border-white/[0.03]">
                    <span className="text-5xl drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">{item.icon}</span>
                    <span className="text-2xl font-black text-white/90">{item.value}</span>
                    <span className="text-[10px] font-black uppercase tracking-[3px] opacity-20">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── ENVIRONMENT & ML TABS (Consolidated styling) ── */}
          {activeTab === 'environment' && (
            <motion.div key="env" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-10">
              <div className="grid grid-cols-3 gap-8">
                <KpiCard icon="🌡️" label="Node Temperature" value={weather?.temperature ?? '--'} unit="°C" color="#ff1a1aff"/>
                <KpiCard icon="💧" label="Atmospheric Humidity" value={weather?.humidity ?? '--'} unit="%" color="#15fcddff"/>
                <KpiCard icon="📍" label="Sensor Location" value={weather?.city ?? '--'} unit="" color="#f5fc33ff"/>
              </div>
              <div className="grid grid-cols-2 gap-10">
                <div className="glass p-10 rounded-[40px]">
                  <div className="text-[10px] font-black uppercase tracking-[4px] mb-8 opacity-20">🌡️ Temperature Divergence</div>
                  <EnvChart data={history}/>
                </div>
                <div className="glass p-10 rounded-[40px]">
                  <div className="text-[10px] font-black uppercase tracking-[4px] mb-8 opacity-20">☀️ Ambient Lumens</div>
                  <LuxBrightnessChart data={history}/>
                </div>
              </div>
              <EnvPanel weather={weather} state={state}/>
            </motion.div>
          )}

          {activeTab === 'ml' && (
            <motion.div key="ml" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-10">
              <div className="grid grid-cols-3 gap-10">
                <EfficiencyBadge score={effScore}/>
                <div className="relative group">
                  <div className="absolute top-6 right-10 z-10 px-4 py-1.5 rounded-full bg-[#a855f710] border border-[#a855f720] text-[9px] font-black text-[#a855f7] tracking-[2px] animate-pulse">LIVE_INFERENCE_ENGINE</div>
                  <MLInsight report={report} predicted={pred} actual={actual} lux={lux}/>
                </div>
                <ImpactCard kwhSaved={kwhSaved}/>
              </div>
              <div className="glass p-14 rounded-[56px] border-white/[0.05]">
                <div className="flex items-center justify-between mb-12">
                   <div className="text-[12px] font-black uppercase tracking-[5px] opacity-30">🤖 Neural Prediction vs Real-Time Sensor</div>
                   <div className="flex gap-6">
                      <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-[#a855f7] shadow-[0_0_10px_#a855f7]"/> <span className="text-[10px] font-black opacity-50 tracking-widest">PREDICTED</span></div>
                      <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9] shadow-[0_0_10px_#0ea5e9]"/> <span className="text-[10px] font-black opacity-50 tracking-widest">ACTUAL</span></div>
                   </div>
                </div>
                <LiveEnergyChart data={history}/>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── FOOTER ── */}
      <footer 
        style={{ 
          padding: '40px 60px', 
          borderTop: '1px solid rgba(255, 255, 255, 0.08)', // Increased visibility of the separator
          background: 'rgba(15, 23, 42, 0.4)', // Shifted to a slightly lighter Navy-Slate
          backdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 20
        }}
      >
        <div className="flex justify-between items-center max-w-[1800px] mx-auto">
          {/* Left: System Nodes Status */}
          <div 
            className="flex items-center gap-16 font-mono text-[15px] tracking-[4px]"
            style={{ color: 'rgba(255, 255, 255, 0.4)' }} // Brighter text for readability
          >
            <div className="flex items-center gap-4">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-40"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22c55e]"></span>
              </span>
              <span style={{ color: '#22c55e', fontWeight: 900 }}>CORE_MODULE_ACTIVE</span>
            </div>
            
            <div className="flex gap-10">
              <span className="flex gap-2">FASTAPI <span style={{ color: '#a855f7', fontWeight: 900 }}>:8000</span></span>
              <span className="flex gap-2">WORKER <span style={{ color: '#0ea5e9', fontWeight: 900 }}>:7777</span></span>
              <span className="flex gap-2">REACT <span style={{ color: '#f59e0b', fontWeight: 900 }}>:5174</span></span>
            </div>
          </div>

          {/* Right: Model Intelligence Badge */}
          {report && (
            <div 
              style={{ 
                padding: '10px 24px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                fontSize: '10px',
                fontWeight: 900,
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '3px',
                fontFamily: "'JetBrains Mono', monospace"
              }}
            >
              MODEL: <span style={{ color: '#22c55e' }}>{report.best.toUpperCase()}</span> 
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}