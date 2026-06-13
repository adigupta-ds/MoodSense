import { motion, AnimatePresence } from 'framer-motion';
import BrightnessLever from './BrightnessLever';

export default function ControlPanel({ autoMode, onToggleMode, manualVal, onManualChange, predicted }) {
  const displayVal = autoMode ? Math.round(predicted) : manualVal;
  const THEME_ACCENT = '#22c55e'; 
  const MANUAL_ACCENT = '#f59e0b'; 
  const activeColor = autoMode ? THEME_ACCENT : MANUAL_ACCENT;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '32px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px' 
      }}
    >
      {/* Header + Fixed Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div style={{ 
            width: 32, height: 32, borderRadius: 10, 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>🎛️</div>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Logic Engine
          </span>
        </div>

        {/* Perfect Alignment Toggle */}
        <div style={{ 
          position: 'relative', 
          display: 'flex', 
          width: '160px', 
          height: '40px',
          padding: '4px', // Controlled padding
          borderRadius: '14px', 
          background: 'rgba(0,0,0,0.4)', 
          border: '1px solid rgba(255,255,255,0.08)',
          cursor: 'pointer',
          overflow: 'hidden'
        }}>
          <motion.div
            style={{ 
              position: 'absolute', 
              top: '4px', 
              bottom: '4px', 
              borderRadius: '10px',
              background: activeColor, 
              width: 'calc(50% - 4px)', // Perfect math for 50% width minus padding
              boxShadow: `0 4px 15px ${activeColor}44`,
              zIndex: 1
            }}
            animate={{ x: autoMode ? 0 : '76px' }} // Controlled X-axis slide
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
          {['AUTO', 'MANUAL'].map((m, i) => (
            <button
              key={m}
              onClick={() => onToggleMode(m === 'AUTO')}
              style={{ 
                position: 'relative', 
                zIndex: 10, 
                flex: 1, 
                height: '100%',
                fontSize: '10px', 
                fontWeight: '900', 
                border: 'none',
                background: 'transparent', 
                cursor: 'pointer',
                color: (autoMode ? i === 0 : i === 1) ? '#020617' : '#64748b',
                transition: 'color 0.2s'
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Status Banner */}
      <AnimatePresence mode="wait">
        <motion.div
          key={autoMode ? 'auto' : 'manual'}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          style={{ 
            fontSize: '10px', padding: '14px', borderRadius: '16px', 
            textAlign: 'center', fontWeight: '900', letterSpacing: '1px',
            background: `${activeColor}08`, color: activeColor, 
            border: `1px solid ${activeColor}15`,
            textTransform: 'uppercase'
          }}
        >
          {autoMode ? 'System-Adjusted Baseline' : 'Manual Override Active'}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center" style={{ filter: autoMode ? 'grayscale(1) opacity(0.5)' : 'none', transition: '0.5s' }}>
        <BrightnessLever value={displayVal} onChange={onManualChange} disabled={autoMode} label={autoMode ? 'LOCKED' : 'LEVEL'} />
      </div>

      {/* Professional Linear Slider */}
      <AnimatePresence>
        {!autoMode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-col gap-6"
          >
            <div className="relative w-full h-8 flex items-center group">
              {/* The Rail */}
              <div style={{ 
                position: 'absolute', width: '100%', height: '4px', 
                background: 'rgba(255,255,255,0.05)', borderRadius: '2px',
                border: '1px solid rgba(255,255,255,0.05)'
              }} />
              
              {/* Active Fill */}
              <div style={{ 
                position: 'absolute', width: `${manualVal}%`, height: '4px', 
                background: MANUAL_ACCENT, borderRadius: '2px',
                boxShadow: `0 0 10px ${MANUAL_ACCENT}44`
              }} />

              {/* Invisible Native Input Overlay */}
              <input
                type="range" min="0" max="100" value={manualVal}
                onChange={e => onManualChange(Number(e.target.value))}
                style={{ 
                  width: '100%', cursor: 'pointer', appearance: 'none', 
                  background: 'transparent', zIndex: 20, height: '100%',
                  position: 'relative'
                }}
                className="custom-range-input"
              />
              
              {/* Visual Knob (CSS only, tracks input value) */}
              <div style={{
                position: 'absolute',
                left: `calc(${manualVal}% - 10px)`,
                width: '20px', height: '20px', borderRadius: '50%',
                background: '#f8fafc',
                border: `4px solid ${MANUAL_ACCENT}`,
                boxShadow: `0 0 20px ${MANUAL_ACCENT}aa`,
                pointerEvents: 'none',
                zIndex: 15
              }} />
            </div>

            <div className="flex justify-between" style={{ 
              fontFamily: "'JetBrains Mono', monospace", 
              fontSize: '10px', fontWeight: '800', color: '#475569' 
            }}>
              <span>0% MIN</span>
              <span style={{ color: MANUAL_ACCENT, fontSize: '12px' }}>{manualVal.toString().padStart(3, '')}%</span>
              <span>MAX 100%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global CSS for the hidden native input thumb */}
      <style>{`
        .custom-range-input::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          cursor: pointer;
        }
        .custom-range-input::-moz-range-thumb {
          width: 24px;
          height: 24px;
          cursor: pointer;
          border: none;
          background: transparent;
        }
      `}</style>
    </motion.div>
  );
}