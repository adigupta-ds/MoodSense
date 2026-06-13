import { motion } from 'framer-motion';

const TOD = ['🌑 Night', '🌅 Morning', '☀️ Afternoon', '🌆 Evening'];

const rows = (weather, state) => [
  { icon: '🌡️', label: 'Temperature', value: weather?.temperature ?? state?.temperature ?? '--', unit: '°C', color: '#f87171', bar: ((weather?.temperature ?? 22) - 0) / 50 },
  { icon: '💧', label: 'Humidity',    value: weather?.humidity    ?? state?.humidity    ?? '--', unit: '%',  color: '#4cc9f0', bar: (weather?.humidity ?? 50) / 100 },
  { icon: '🕐', label: 'Time of Day', value: TOD[state?.time_of_day ?? 1],                       unit: '',   color: '#f9c74f', bar: null },
  { icon: '📍', label: 'Location',    value: weather?.city ?? 'Unknown',                         unit: '',   color: '#a855f7', bar: null },
];

export default function EnvPanel({ weather, state }) {
  const data = rows(weather, state);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(249,199,79,0.12)', border: '1px solid rgba(249,199,79,0.2)' }}>🌦️</div>
        <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>Environment</span>
        <div className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: '#06d6a0' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-current pulse-dot"/>
          Live
        </div>
      </div>

      {data.map((r, i) => (
        <motion.div
          key={r.label}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          whileHover={{ x: 3 }}
          className="flex flex-col gap-1.5 px-3 py-2.5 rounded-xl cursor-default"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">{r.icon}</span>
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{r.label}</span>
            </div>
            <motion.span
              key={String(r.value)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-bold"
              style={{ color: r.color }}
            >
              {r.value}{r.unit}
            </motion.span>
          </div>
          {r.bar !== null && (
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${r.color}88, ${r.color})` }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, r.bar * 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}
