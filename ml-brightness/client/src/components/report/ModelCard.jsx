import { motion } from 'framer-motion';

const MODEL_META = {
  'Linear Regression': {
    icon: '📈',
    theme: { accent: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', badge: '#dbeafe', badgeText: '#1d4ed8' },
    desc: 'Classic statistical model fitting a linear relationship between features and brightness output.',
    tag: 'Statistical',
  },
  'Random Forest': {
    icon: '🌲',
    theme: { accent: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badge: '#dcfce7', badgeText: '#15803d' },
    desc: 'Ensemble of decision trees achieving near-perfect accuracy on the brightness prediction task.',
    tag: 'Ensemble',
  },
  'XGBoost': {
    icon: '⚡',
    theme: { accent: '#d97706', bg: '#fffbeb', border: '#fde68a', badge: '#fef3c7', badgeText: '#b45309' },
    desc: 'Gradient boosted trees with high speed and strong generalization across lux ranges.',
    tag: 'Boosting',
  },
  'Neural Network': {
    icon: '🧠',
    theme: { accent: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe', badge: '#ede9fe', badgeText: '#6d28d9' },
    desc: 'Multi-layer perceptron learning complex non-linear patterns between environment and brightness.',
    tag: 'Deep Learning',
  },
};

export default function ModelCard({ model, isBest, index }) {
  const meta  = MODEL_META[model.name] ?? MODEL_META['Linear Regression'];
  const { theme } = meta;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, boxShadow: `0 20px 40px ${theme.accent}22` }}
      className="relative rounded-2xl p-6 flex flex-col gap-4 transition-shadow duration-300"
      style={{
        background: theme.bg,
        border: `1.5px solid ${isBest ? theme.accent : theme.border}`,
        boxShadow: isBest ? `0 8px 32px ${theme.accent}28` : '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* Best badge */}
      {isBest && (
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: index * 0.08 + 0.3, type: 'spring', stiffness: 300 }}
          className="absolute -top-3 -right-3 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shadow-lg"
          style={{ background: theme.accent, color: '#fff' }}
        >
          🏆 Best Model
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: theme.badge, border: `1px solid ${theme.border}` }}>
          {meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 text-base leading-tight">{model.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: theme.badge, color: theme.badgeText }}>
              {meta.tag}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{meta.desc}</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'R² Score', value: model.r2.toFixed(4),  good: model.r2 > 0.99,  fmt: v => v },
          { label: 'MAE',      value: model.mae.toFixed(4), good: model.mae < 1,    fmt: v => v },
          { label: 'RMSE',     value: model.rmse.toFixed(4),good: model.rmse < 1,   fmt: v => v },
        ].map(m => (
          <div key={m.label} className="rounded-xl p-3 text-center"
            style={{ background: '#fff', border: '1px solid #f1f5f9' }}>
            <div className="text-xs text-gray-400 font-medium mb-1">{m.label}</div>
            <div className="font-black text-sm" style={{ color: m.good ? theme.accent : '#ef4444' }}>
              {m.value}
            </div>
            <div className="mt-1 w-full h-1 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: m.good ? theme.accent : '#ef4444' }}
                initial={{ width: 0 }}
                animate={{ width: m.label === 'R² Score' ? `${m.value * 100}%` : `${Math.max(5, 100 - m.value * 10)}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: index * 0.08 + 0.2 }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* R² bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>R² Accuracy</span>
          <span className="font-bold" style={{ color: theme.accent }}>{(model.r2 * 100).toFixed(3)}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${theme.accent}88, ${theme.accent})` }}
            initial={{ width: 0 }}
            animate={{ width: `${model.r2 * 100}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: index * 0.08 + 0.1 }}
          />
        </div>
      </div>
    </motion.div>
  );
}
