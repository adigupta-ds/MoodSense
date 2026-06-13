import React, { useRef, useEffect, useCallback } from 'react';

const H = 220;
const toY     = (v) => H - (v / 100) * H;
const fromY   = (y) => Math.round(Math.max(0, Math.min(100, (1 - y / H) * 100)));
const color   = (v) => v < 50
  ? `rgb(${30 + v},${144 + v * 1.4},${255 - v * 4})`
  : `rgb(${50 + (v-50)*3.6},${214 - (v-50)*3.1},${60 - (v-50)*1.2})`;

export default function BrightnessLever({ value, onChange, disabled, label = 'Brightness' }) {
  const trackRef = useRef(null);
  const drag     = useRef(false);

  const getVal = useCallback((clientY) => {
    const rect = trackRef.current.getBoundingClientRect();
    return fromY(Math.max(0, Math.min(H, clientY - rect.top)));
  }, []);

  useEffect(() => {
    const move = (e) => { if (drag.current) onChange(getVal(e.touches?.[0]?.clientY ?? e.clientY)); };
    const up   = () => { drag.current = false; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup',   up);
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend',  up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup',   up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend',  up);
    };
  }, [getVal, onChange]);

  const c     = color(value);
  const thumbY = toY(value);

  return (
    <div style={s.wrap}>
      <div style={s.label}>{label}</div>
      <div style={s.pct(c)}>{value}<span style={s.pctUnit}>%</span></div>
      <div
        ref={trackRef}
        style={{ ...s.track, cursor: disabled ? 'not-allowed' : 'pointer' }}
        onMouseDown={(e) => { if (!disabled) { drag.current = true; onChange(getVal(e.clientY)); } }}
        onTouchStart={(e) => { if (!disabled) { drag.current = true; onChange(getVal(e.touches[0].clientY)); } }}
      >
        <div style={{ ...s.fill, height: H - thumbY, top: thumbY, background: `linear-gradient(to top,${c}88,${c})` }} />
        {[0,25,50,75,100].map(t => <div key={t} style={{ ...s.tick, top: toY(t) }} />)}
        <div style={{ ...s.thumb, top: thumbY - 16, background: disabled ? '#333' : c, boxShadow: `0 0 10px ${c}88` }} />
      </div>
    </div>
  );
}

const s = {
  wrap:    { display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' },
  label:   { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#555', marginBottom: 6 },
  pct:     (c) => ({ fontSize: '2rem', fontWeight: 700, color: c, lineHeight: 1, marginBottom: 8 }),
  pctUnit: { fontSize: '0.9rem', marginLeft: 2 },
  track:   { position: 'relative', width: 44, height: H, background: '#1a1a1a', borderRadius: 22, border: '1px solid #2a2a2a' },
  fill:    { position: 'absolute', left: 0, right: 0, borderRadius: '0 0 22px 22px', pointerEvents: 'none', transition: 'height 0.1s, top 0.1s' },
  tick:    { position: 'absolute', left: 6, right: 6, height: 1, background: '#2a2a2a', pointerEvents: 'none' },
  thumb:   { position: 'absolute', left: -8, right: -8, height: 32, borderRadius: 6, transition: 'background 0.2s', zIndex: 2 },
};
