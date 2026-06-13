import React, { useRef, useState, useEffect } from 'react';

const EMA_ALPHA  = 0.35;
const WARMUP     = 6;
const LUX_MIN    = 50;
const LUX_MAX    = 999;
const BRIGHT_MIN = 5;
const BRIGHT_MAX = 100;

// Map lux [50–999] → brightness [100–5] directly, no server round-trip
function luxToBrightness(lux) {
  if (lux > 800) return 0;
  if (lux < 150) return 80;
  const clamped = Math.max(150, Math.min(800, lux));
  const t = (clamped - 150) / (800 - 150);
  return Math.round(BRIGHT_MAX - t * (BRIGHT_MAX - BRIGHT_MIN));
}

export default function CameraLux({ onLux }) {  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const emaRef    = useRef(null);
  const frameRef  = useRef(0);
  const timerRef        = useRef(null);
  const brightnessTimer = useRef(null);
  const lastLuxSent     = useRef(null);   // last lux value that triggered a brightness update

  const [lux,    setLux]    = useState(null);
  const [status, setStatus] = useState('Camera off');
  const [active, setActive] = useState(false);

  async function start() {
    try {
      const constraints = { video: { width: 320, height: 240, exposureMode: 'manual' } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      const caps  = track.getCapabilities?.() || {};
      const adv   = {};
      if (caps.exposureMode?.includes('manual'))     adv.exposureMode     = 'manual';
      if (caps.whiteBalanceMode?.includes('manual')) adv.whiteBalanceMode = 'manual';
      if (caps.exposureTime) {
        adv.exposureTime = Math.round((caps.exposureTime.min + caps.exposureTime.max) / 2);
      }
      if (Object.keys(adv).length) await track.applyConstraints({ advanced: [adv] }).catch(() => {});

      videoRef.current.srcObject = stream;
      emaRef.current   = null;
      frameRef.current = 0;
      lastLuxSent.current = null;
      setActive(true);
      setStatus(adv.exposureMode ? 'Manual exposure locked' : 'Auto-exposure (EMA smoothing)');
      timerRef.current = setInterval(readFrame, 200);
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  }

  function stop() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    clearInterval(timerRef.current);
    clearTimeout(brightnessTimer.current);
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
    setStatus('Camera off');
  }

  function readFrame() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video?.videoWidth) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    let lum = 0;
    for (let i = 0; i < px.length; i += 4)
      lum += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
    const avg    = lum / (px.length / 4);
    const linear = Math.pow(avg / 255, 2.2);
    const raw    = Math.round(Math.sqrt(linear) * 1000);

    frameRef.current++;
    if (frameRef.current <= WARMUP) {
      setStatus(`Stabilising ${frameRef.current}/${WARMUP}…`);
      return;
    }
    setStatus(active ? 'Live' : 'Camera off');

    emaRef.current = emaRef.current === null
      ? raw
      : EMA_ALPHA * raw + (1 - EMA_ALPHA) * emaRef.current;

    const smoothed = Math.round(emaRef.current);
    const directBrightness = luxToBrightness(smoothed);
    setLux(smoothed);
    onLux(smoothed);

    // Only restart the timer if lux changed by more than 30 units
    // Small fluctuations (camera noise) won't reset the 6s window
    const prev = lastLuxSent.current;
    const significantChange = prev === null || Math.abs(smoothed - prev) > 30;

    if (significantChange) {
      lastLuxSent.current = smoothed;
      clearTimeout(brightnessTimer.current);
      brightnessTimer.current = setTimeout(() => {

        // Step 1 — direct lux→brightness
        fetch('http://127.0.0.1:7777/brightness', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: directBrightness }),
        }).catch(() => {});

        // Step 2 — ML fine-tune
        fetch('/camera-lux', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lux: smoothed }),
        }).then(() =>
          fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lux: smoothed }),
          })
        ).then(r => r.json()).then(data => {
          const mlBlended = Math.round(0.4 * data.predicted + 0.6 * directBrightness);
          fetch('http://127.0.0.1:7777/brightness', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ level: mlBlended }),
          }).catch(() => {});
          onLux(smoothed, mlBlended);
        }).catch(() => {});

      }, 6000);
    }
  }

  useEffect(() => () => { stop(); }, []);

  return (
    <div style={s.wrap}>
      <div style={s.label}>📷 Camera Light Sensor</div>
      <video ref={videoRef} autoPlay playsInline muted style={s.video} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={s.luxRow}>
        <span style={s.luxVal}>{lux ?? '--'}</span>
        <span style={s.luxUnit}>lux</span>
      </div>
      <div style={s.status}>{status}</div>
      <div style={s.btnRow}>
        {!active
          ? <button style={s.btnOn}  onClick={start}>Start Camera</button>
          : <button style={s.btnOff} onClick={stop}>Stop</button>
        }
      </div>
    </div>
  );
}

const s = {
  wrap:    { background: '#161616', border: '1px solid #2a2a2a', borderRadius: 12, padding: 16 },
  label:   { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#555', marginBottom: 8 },
  video:   { width: '100%', borderRadius: 8, background: '#000', display: 'block' },
  luxRow:  { display: 'flex', alignItems: 'flex-end', gap: 4, marginTop: 10 },
  luxVal:  { fontSize: '2.2rem', fontWeight: 700, color: '#f9c74f', lineHeight: 1 },
  luxUnit: { fontSize: '0.9rem', color: '#666', marginBottom: 4 },
  status:  { fontSize: '0.72rem', color: '#555', marginTop: 4 },
  btnRow:  { marginTop: 10, display: 'flex', gap: 8 },
  btnOn:   { padding: '7px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.82rem' },
  btnOff:  { padding: '7px 16px', background: '#c62828', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.82rem' },
};
