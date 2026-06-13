import { motion } from 'framer-motion';

export function calcImpact(kwhSaved) {
  const co2 = kwhSaved * 0.233;
  return {
    co2:    +co2.toFixed(3),
    car:    +(co2 / 0.21).toFixed(2),
    flight: +(co2 / 255 * 100).toFixed(3),
    trees:  +(co2 / 0.0575).toFixed(2),
    bulb:   +(kwhSaved / 0.01).toFixed(1),
  };
}

const items = [
  { key: 'co2',    icon: '🌫️', label: 'CO₂ Saved',        fmt: v => `${v} kg`,              color: '#06d6a0' },
  { key: 'car',    icon: '🚗', label: 'Car Distance',      fmt: v => `${v} km`,              color: '#4cc9f0' },
  { key: 'flight', icon: '✈️', label: 'Flight Equivalent', fmt: v => `${v}% of 1h flight`,   color: '#a855f7' },
  { key: 'trees',  icon: '🌳', label: 'Tree-Days',         fmt: v => `${v}`,                 color: '#06d6a0' },
  { key: 'bulb',   icon: '💡', label: 'LED Hours Saved',   fmt: v => `${v} hrs`,             color: '#f9c74f' },
];

export default function ImpactCard({ kwhSaved = 0 }) {
  const impact = calcImpact(kwhSaved);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(6,214,160,0.12)', border: '1px solid rgba(6,214,160,0.2)' }}>🌍</div>
        <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>Real-World Impact</span>
        <motion.span
          key={kwhSaved.toFixed(4)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="ml-auto text-xs px-2 py-0.5 rounded-full font-mono font-medium"
          style={{ background: 'rgba(6,214,160,0.1)', color: '#06d6a0', border: '1px solid rgba(6,214,160,0.2)' }}
        >
          {kwhSaved.toFixed(5)} kWh
        </motion.span>
      </div>

      <div className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ x: 4 }}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${item.color}12` }}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">{item.icon}</span>
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>{item.label}</span>
            </div>
            <motion.span
              key={String(impact[item.key])}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-sm font-bold"
              style={{ color: item.color }}
            >
              {item.fmt(impact[item.key])}
            </motion.span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
