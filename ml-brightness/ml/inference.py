"""
FastAPI inference server
─────────────────────────
Endpoints:
  GET  /status          → model info + current state
  POST /predict         → run ML inference
  POST /camera-lux      → receive lux from browser camera
  POST /brightness      → set screen brightness
  GET  /weather         → fetch temp + humidity from OpenWeather
  GET  /report          → model evaluation report
  GET  /history         → last 100 inference records
"""

import os, json, time, math
from datetime import datetime
from collections import deque
from typing import Optional

import joblib
import numpy as np
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

MODEL_DIR   = os.path.join(os.path.dirname(__file__), 'model')
WEATHER_CITY = os.getenv('CITY', 'London')

# ── Load model + scaler ───────────────────────────────────────
model_path  = os.path.join(MODEL_DIR, 'best_model.pkl')
scaler_path = os.path.join(MODEL_DIR, 'scaler.pkl')

if not os.path.exists(model_path):
    raise RuntimeError("Model not found. Run: python train.py")

model  = joblib.load(model_path)
scaler = joblib.load(scaler_path)

with open(os.path.join(MODEL_DIR, 'report.json')) as f:
    report = json.load(f)

# ── App state ─────────────────────────────────────────────────
app = FastAPI(title="ML Brightness API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

state = {
    "lux":              300.0,
    "temperature":      22.0,
    "humidity":         50.0,
    "hour":             datetime.now().hour,
    "time_of_day":      1,
    "predicted":        50.0,
    "actual":           50.0,
    "manual_override":  False,
    "manual_level":     50.0,
    "auto_mode":        True,
    "weather_cached":   None,
    "weather_ts":       0,
}

history = deque(maxlen=100)

# ── Helpers ───────────────────────────────────────────────────
def time_of_day(hour: int) -> int:
    if 5  <= hour < 12: return 1
    if 12 <= hour < 17: return 2
    if 17 <= hour < 21: return 3
    return 0

LUX_MIN = 50
LUX_MAX = 999
OUT_MIN = 5     # brightness % at max lux (999)
OUT_MAX = 100   # brightness % at min lux (50)

def predict_brightness(lux, temp, humidity, hour):
    tod = time_of_day(hour)

    # Clamp lux to fixed sensor range
    lux_clamped = float(np.clip(lux, LUX_MIN, LUX_MAX))

    # Above 800 lux → brightness 0
    if lux_clamped > 800:
        return 0.0, tod

    # Below 150 lux → brightness 80%
    if lux_clamped < 150:
        return 80.0, tod

    # Remap [150–800] → [80–5]
    t = (lux_clamped - 150) / (800 - 150)
    direct = OUT_MAX - t * (OUT_MAX - OUT_MIN)            # 100% → 5%

    # Optional modifiers
    if temp > 30:
        direct -= (temp - 30) * 0.8   # heat penalty
    if tod == 0:
        direct *= 0.6                  # night dimming

    # ML model as secondary signal (keeps ML in the loop)
    raw    = np.array([[lux_clamped, temp, humidity, hour, tod]], dtype=float)
    ml_out = float(model.predict(scaler.transform(raw))[0])

    # 30% ML + 70% direct mapping so output stays volatile with lux
    blended = 0.3 * ml_out + 0.7 * direct
    return round(float(np.clip(blended, OUT_MIN, OUT_MAX)), 1), tod

def set_screen_brightness(level: float):
    """Fire-and-forget POST to Node brightness worker — non-blocking."""
    import threading
    def _send():
        try:
            requests.post(
                'http://127.0.0.1:7777/brightness',
                json={'level': round(float(level), 1)},
                timeout=2
            )
        except Exception as e:
            print(f"[BRIGHTNESS] {e}")
    threading.Thread(target=_send, daemon=True).start()

def energy_saving(predicted: float, baseline: float = 100.0) -> float:
    """% energy saved vs baseline brightness"""
    return round((baseline - predicted) / baseline * 100, 1)

# ── Weather fetch via wttr.in (free, no key, global cities) ──
def fetch_weather():
    now = time.time()
    if state['weather_cached'] and (now - state['weather_ts']) < 600:
        return state['weather_cached']
    try:
        r = requests.get(
            f'https://wttr.in/{WEATHER_CITY}?format=j1',
            headers={'User-Agent': 'ml-brightness/1.0'},
            timeout=5
        )
        data    = r.json()
        current = data['current_condition'][0]
        area    = data['nearest_area'][0]
        city    = area['areaName'][0]['value']
        country = area['country'][0]['value']
        result  = {
            'temperature': float(current['temp_C']),
            'humidity':    float(current['humidity']),
            'city':        f"{city}, {country}",
        }
        state['weather_cached'] = result
        state['weather_ts']     = now
        return result
    except Exception as e:
        print(f"[WEATHER] {e}")
        return None

# ── Routes ────────────────────────────────────────────────────

@app.get("/status")
def get_status():
    return {
        "model":    report['best'],
        "state":    state,
        "uptime":   time.time(),
    }

@app.get("/report")
def get_report():
    return report

@app.get("/history")
def get_history():
    return list(history)

@app.get("/weather")
def get_weather():
    w = fetch_weather()
    if w:
        state['temperature'] = w['temperature']
        state['humidity']    = w['humidity']
    return w or {"error": "No API key or request failed", "temperature": state['temperature'], "humidity": state['humidity']}

class LuxPayload(BaseModel):
    lux: float

class BrightnessPayload(BaseModel):
    level: float

class PredictPayload(BaseModel):
    lux:         Optional[float] = None
    temperature: Optional[float] = None
    humidity:    Optional[float] = None
    hour:        Optional[int]   = None

@app.post("/camera-lux")
def receive_lux(payload: LuxPayload):
    state['lux'] = round(float(np.clip(payload.lux, LUX_MIN, LUX_MAX)), 1)
    return {"ok": True, "lux": state['lux']}

@app.post("/brightness")
def set_brightness(payload: BrightnessPayload):
    level = float(np.clip(payload.level, 0, 100))
    state['actual'] = round(level, 1)
    set_screen_brightness(level)
    return {"ok": True, "level": state['actual']}

@app.post("/predict")
def predict(payload: PredictPayload):
    # Merge payload with current state
    lux   = payload.lux         if payload.lux         is not None else state['lux']
    temp  = payload.temperature if payload.temperature is not None else state['temperature']
    hum   = payload.humidity    if payload.humidity    is not None else state['humidity']
    hour  = payload.hour        if payload.hour        is not None else datetime.now().hour

    # Try to refresh weather
    w = fetch_weather()
    if w:
        temp = w['temperature']
        hum  = w['humidity']

    predicted, tod = predict_brightness(lux, temp, hum, hour)

    state.update({
        'lux': lux, 'temperature': temp, 'humidity': hum,
        'hour': hour, 'time_of_day': tod, 'predicted': predicted,
    })

    # Apply brightness if in auto mode
    if state['auto_mode'] and not state['manual_override']:
        state['actual'] = predicted
        set_screen_brightness(predicted)

    saving = energy_saving(predicted)

    record = {
        "ts":          datetime.now().isoformat(),
        "lux":         lux,
        "temperature": temp,
        "humidity":    hum,
        "hour":        hour,
        "time_of_day": tod,
        "predicted":   predicted,
        "actual":      state['actual'],
        "saving_pct":  saving,
    }
    history.appendleft(record)

    return {**record, "model": report['best']}

class ModePayload(BaseModel):
    auto_mode:       Optional[bool]  = None
    manual_override: Optional[bool]  = None
    manual_level:    Optional[float] = None

@app.post("/mode")
def set_mode(payload: ModePayload):
    if payload.auto_mode       is not None: state['auto_mode']       = payload.auto_mode
    if payload.manual_override is not None: state['manual_override'] = payload.manual_override
    if payload.manual_level    is not None:
        state['manual_level'] = float(np.clip(payload.manual_level, 0, 100))
        if state['manual_override']:
            state['actual'] = state['manual_level']
            set_screen_brightness(state['manual_level'])
    return state
