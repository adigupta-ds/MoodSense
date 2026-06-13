import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';

function AnimatedNumber({ value }) {
  const prev = useRef(value);
  useEffect(() => { prev.current = value; }, [value]);
  return <span>{value}</span>;
}

export default function KpiCard({ icon, label, value, unit, sub, color = '#06d6a0', glow = 'glow-green', trend }) {
  const isUp   = trend > 0;
  const isDown = trend < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`glass ${glow} flex flex-col gap-3 relative overflow-hidden`}
    >
      {/* subtle top accent line */}
      <div className="absolute top-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}55, transparent)` }}/>

      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: color + '18', border: `1px solid ${color}30` }}>
          {icon}
        </div>
        {trend !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
            style={{
              background: isUp ? '#06d6a018' : isDown ? '#e6394618' : 'rgba(255,255,255,0.06)',
              color:      isUp ? '#06d6a0'   : isDown ? '#e63946'   : 'rgba(255,255,255,0.4)',
            }}
          >
            {isUp ? '↑' : isDown ? '↓' : '–'} {Math.abs(trend)}%
          </motion.div>
        )}
      </div>

      <div>
        <div className="flex items-end gap-1.5 leading-none">
          <motion.span
            key={value}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-3xl font-black tracking-tight"
            style={{ color }}
          >
            {value}
          </motion.span>
          <span className="text-sm font-medium pb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{unit}</span>
        </div>
        <div className="text-xs font-medium mt-1.5 tracking-wide" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</div>
      </div>

      {sub && (
        <div className="text-xs px-2.5 py-1 rounded-full w-fit font-medium" style={{ background: color + '14', color, border: `1px solid ${color}25` }}>
          {sub}
        </div>
      )}
    </motion.div>
  );
}
