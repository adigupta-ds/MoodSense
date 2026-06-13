import { motion } from 'framer-motion';

function StabilityIndicator({ predicted, actual }) {
  const diff    = Math.abs((predicted ?? 0) - (actual ?? 0));
  const stable  = diff < 5;
  const color   = diff < 5 ? '#06d6a0' : diff < 15 ? '#f9c74f' : '#e63946';
  const label   = diff < 5 ? 'Stable' : diff < 15 ? 'Drifting' : 'Unstable';
  return (
    <div className="flex items-center gap-1.5">
      <motion.div
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-2 h-2 rounded-full"
        style={{ background: color }}
      />
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

export default function MLInsight({ report, predicted, actual, lux }) {
  const accuracy = predicted > 0 && actual > 0
    ? Math.max(0, 100 - Math.abs(predicted - actual)).toFixed(1)
    : '--';

  const kpis = [
    { label: 'Predicted',  value: `${predicted ?? '--'}%`, color: '#a855f7', icon: '🤖' },
    { label: 'Actual',     value: `${actual    ?? '--'}%`, color: '#4cc9f0', icon: '🖥️' },
    { label: 'Accuracy',   value: `${accuracy}%`,          color: '#06d6a0', icon: '🎯' },
    { label: 'Input Lux',  value: `${lux       ?? '--'}`,  color: '#f9c74f', icon: '☀️' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass flex flex-col gap-4">

      {/* header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.2)' }}>🧠</div>
        <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>ML Insight</span>
        <div className="ml-auto flex items-center gap-2">
          <StabilityIndicator predicted={predicted} actual={actual}/>
          {report && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}>
              {report.best}
            </span>
          )}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-2">
        {kpis.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ scale: 1.02 }}
            className="rounded-xl p-3 flex flex-col gap-1.5 relative overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${item.color}18` }}
          >
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${item.color}40, transparent)` }}/>
            <div className="flex items-center gap-1.5">
              <span className="text-xs">{item.icon}</span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.label}</span>
            </div>
            <motion.span
              key={item.value}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-black"
              style={{ color: item.color }}
            >
              {item.value}
            </motion.span>
          </motion.div>
        ))}
      </div>

      {/* model comparison bars */}
      {report?.metrics && (
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>Model Comparison</div>
          {report.metrics.map((m, i) => {
            const isBest = m.name === report.best;
            return (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3"
              >
                <div className="text-xs w-28 truncate font-medium" style={{ color: isBest ? '#06d6a0' : 'rgba(255,255,255,0.35)' }}>
                  {isBest && <span className="mr-1">✓</span>}{m.name}
                </div>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: isBest ? 'linear-gradient(90deg,#06d6a0,#4cc9f0)' : 'rgba(255,255,255,0.12)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${m.r2 * 100}%` }}
                    transition={{ duration: 1.1, ease: 'easeOut', delay: i * 0.1 }}
                  />
                </div>
                <div className="text-xs w-14 text-right font-mono" style={{ color: isBest ? '#06d6a0' : 'rgba(255,255,255,0.3)' }}>
                  {m.r2.toFixed(4)}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
