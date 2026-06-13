import { motion } from 'framer-motion';

const LUX_MIN = 50;
const LUX_MAX = 999;

function luxLabel(lux) {
  if (!lux)       return { text: 'No Signal',    color: '#555' };
  if (lux < 150)  return { text: 'Very Dark',    color: '#4cc9f0' };
  if (lux < 300)  return { text: 'Dim',          color: '#7dd3fc' };
  if (lux < 500)  return { text: 'Indoor',       color: '#06d6a0' };
  if (lux < 700)  return { text: 'Bright',       color: '#f9c74f' };
  if (lux < 800)  return { text: 'Very Bright',  color: '#fb923c' };
  return                  { text: 'Intense',     color: '#e63946' };
}

export default function LuxGauge({ lux, prevLux }) {
  const pct   = lux ? Math.min(100, ((lux - LUX_MIN) / (LUX_MAX - LUX_MIN)) * 100) : 0;
  const info  = luxLabel(lux);
  const trend = prevLux && lux ? lux - prevLux : 0;
  const R     = 52;
  const circ  = Math.PI * R;   // half circle

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className="glass glow-yellow flex flex-col items-center gap-2 relative overflow-hidden"
    >
      <div className="absolute top-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg, transparent, ${info.color}55, transparent)` }}/>

      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(249,199,79,0.12)', border: '1px solid rgba(249,199,79,0.2)' }}>☀️</div>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Ambient Light</span>
        </div>
        {trend !== 0 && (
          <span className="text-xs font-bold" style={{ color: trend > 0 ? '#f9c74f' : '#4cc9f0' }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}
          </span>
        )}
      </div>

      {/* half-circle gauge */}
      <div className="relative flex items-end justify-center" style={{ width: 130, height: 70 }}>
        <svg width="130" height="70" viewBox="0 0 130 70" style={{ position: 'absolute', bottom: 0 }}>
          {/* track */}
          <path d="M 10 65 A 55 55 0 0 1 120 65" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" strokeLinecap="round"/>
          {/* fill */}
          <motion.path
            d="M 10 65 A 55 55 0 0 1 120 65"
            fill="none"
            stroke={`url(#luxGrad)`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id="luxGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#4cc9f0"/>
              <stop offset="50%"  stopColor="#f9c74f"/>
              <stop offset="100%" stopColor="#e63946"/>
            </linearGradient>
          </defs>
        </svg>
        <div className="relative z-10 flex flex-col items-center pb-1">
          <motion.span
            key={lux}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-black"
            style={{ color: info.color }}
          >
            {lux ?? '--'}
          </motion.span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>lux</span>
        </div>
      </div>

      <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: info.color + '18', color: info.color }}>
        {info.text}
      </span>
    </motion.div>
  );
}
