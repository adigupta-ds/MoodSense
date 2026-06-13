import React from 'react';
import { motion } from 'framer-motion';

/**
 * INTELLIGENCE LAB COLOR SYSTEM
 */
function getBadge(score) {
  if (score >= 80) return { label: 'EXCELLENT', color: '#22c55e', bg: '#22c55e12', icon: '🏆', desc: 'Peak system efficiency' };
  if (score >= 60) return { label: 'OPTIMAL',   color: '#38bdf8', bg: '#38bdf812', icon: '⭐', desc: 'Above baseline performance' };
  if (score >= 40) return { label: 'NOMINAL',   color: '#f59e0b', bg: '#f59e0b12', icon: '📈', desc: 'Standard operating range' };
  return                  { label: 'CRITICAL',  color: '#f43f5e', bg: '#f43f5e12', icon: '⚠️', desc: 'Efficiency threshold low' };
}

export default function EfficiencyBadge({ score = 0 }) {
  const badge = getBadge(score);
  const R = 48; // Radius
  const circ = 2 * Math.PI * R;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '32px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '28px',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        minHeight: '340px',
        justifyContent: 'space-between'
      }}
    >
      {/* Top Accent Glow */}
      <div className="absolute top-0 left-8 right-8 h-px" style={{ 
        background: `linear-gradient(90deg, transparent, ${badge.color}44, transparent)` 
      }}/>

      {/* Header Readout */}
      <div className="w-full flex items-center justify-between">
        <span style={{ 
          fontSize: '10px', fontWeight: 900, color: '#64748b', 
          textTransform: 'uppercase', letterSpacing: '2px' 
        }}>
          ML Analytics
        </span>
        <div style={{ 
          fontSize: '9px', fontWeight: 950, color: badge.color, 
          background: badge.bg, padding: '4px 10px', borderRadius: '8px',
          border: `1px solid ${badge.color}25`, letterSpacing: '1px'
        }}>
          {badge.icon} {badge.label}
        </div>
      </div>

      {/* Primary Circular Gauge */}
      <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
        {/* Deep Diffusion Glow */}
        <div className="absolute inset-4 rounded-full" style={{ 
          background: badge.color, opacity: 0.03, filter: 'blur(20px)' 
        }}/>

        <svg width="140" height="140" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
          {/* Inner Decorative Ring */}
          <circle cx="70" cy="70" r={R - 8} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1"/>
          
          {/* Main Track */}
          <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10"/>
          
          {/* Animated Progress Stroke */}
          <motion.circle
            cx="70" cy="70" r={R}
            fill="none"
            stroke={badge.color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - (score / 100) * circ }}
            transition={{ duration: 1.5, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ filter: `drop-shadow(0 0 8px ${badge.color}44)` }}
          />
        </svg>

        {/* Center Value Text */}
        <div className="flex flex-col items-center z-10">
          <motion.span
            key={score}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ 
              fontSize: '28px', fontWeight: 950, color: '#f8fafc',
              fontFamily: "'Inter', sans-serif", letterSpacing: '-1.5px',
              lineHeight: '1'
            }}
          >
            {score}%
          </motion.span>
          <span style={{ 
            fontSize: '8px', fontWeight: 900, color: '#c7cdd7ff', 
            textTransform: 'uppercase', letterSpacing: '1.5px',
            marginTop: '4px' 
          }}>
            efficiency
          </span>
        </div>
      </div>

      {/* Technical Log Readout */}
      <div className="w-full flex flex-col gap-3">
        <p style={{ 
          fontSize: '11px', color: '#64748b', textAlign: 'center', 
          lineHeight: '1.5', fontWeight: 500 
        }}>
          {badge.desc}
        </p>
        
        {/* Visual Consistency Bar */}
        <div className="relative w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${badge.color}, ${badge.color}66)` }}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1.2, ease: 'circOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}