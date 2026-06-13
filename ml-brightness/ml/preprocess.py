"""
Preprocessing pipeline
─────────────────────
Sources used:
  - raw/archive(1)/*.csv  (2018 floor lighting data)
  - raw/archive (2)/*.csv (2019 floor lighting data)

Derived features:
  lux          ← zone light power (kW) × 1000 × efficacy factor
  hour         ← from timestamp
  time_of_day  ← 0=night 1=morning 2=afternoon 3=evening
  temperature  ← synthetic (seeded from hour, realistic range 18–35°C)
  humidity     ← synthetic (seeded from hour, realistic range 30–80%)
  brightness   ← target: optimal brightness % derived from lux + time
"""

import os, glob
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import joblib

RAW_DIRS  = [
    os.path.join(os.path.dirname(__file__), '..', '..', 'raw', 'archive(1)'),
    os.path.join(os.path.dirname(__file__), '..', '..', 'raw', 'archive (2)'),
]
OUT_DIR   = os.path.join(os.path.dirname(__file__), 'model')
os.makedirs(OUT_DIR, exist_ok=True)

# kW → lux conversion factor (approximate: 1W fluorescent ≈ 80 lux/m², zone ~50m²)
KW_TO_LUX = 1000 * 80 / 50

def time_of_day(hour):
    if 5  <= hour < 12: return 1   # morning
    if 12 <= hour < 17: return 2   # afternoon
    if 17 <= hour < 21: return 3   # evening
    return 0                        # night

def synthetic_temp(hour, seed):
    """Realistic temperature curve: cooler at night, peak ~14:00"""
    np.random.seed(seed)
    base = 22 + 8 * np.sin(np.pi * (hour - 6) / 12)
    return float(np.clip(base + np.random.normal(0, 1.5), 15, 40))

def synthetic_humidity(hour, seed):
    np.random.seed(seed + 1000)
    base = 60 - 20 * np.sin(np.pi * (hour - 6) / 12)
    return float(np.clip(base + np.random.normal(0, 5), 20, 95))

def brightness_target(lux, tod, temp):
    """
    Rule-based ground truth for training:
      - Low lux  → high brightness
      - High lux → low brightness
      - High temp penalty (>30°C)
      - Night: reduce by 15%
    """
    base = 100 - np.clip(lux / 10, 0, 80)          # lux 0→0%, 1000→80% reduction
    if tod == 0: base *= 0.70                        # night dimming
    if temp > 30: base -= (temp - 30) * 0.8         # heat penalty
    return float(np.clip(base, 5, 100))

def load_and_merge():
    frames = []
    for d in RAW_DIRS:
        for f in sorted(glob.glob(os.path.join(d, '*.csv'))):
            df = pd.read_csv(f)
            # Force datetime parse after read
            df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
            light_cols = [c for c in df.columns if 'Light' in c]
            df['light_kw'] = df[light_cols].mean(axis=1)
            df = df[['Date', 'light_kw']].copy()
            frames.append(df)
    merged = pd.concat(frames, ignore_index=True)
    # Ensure datetime dtype survives concat
    merged['Date'] = pd.to_datetime(merged['Date'], errors='coerce')
    merged = merged.dropna(subset=['Date'])
    return merged

def preprocess():
    print("Loading raw data...")
    df = load_and_merge()

    # Drop nulls and obvious outliers
    df = df.dropna()
    df = df[df['light_kw'] >= 0]
    df = df[df['light_kw'] < df['light_kw'].quantile(0.999)]
    df = df.reset_index(drop=True)

    # Derive features
    df['hour']        = df['Date'].dt.hour
    df['lux']         = (df['light_kw'] * KW_TO_LUX).clip(0, 1000).round(1)
    df['time_of_day'] = df['hour'].apply(time_of_day)

    # Synthetic weather (deterministic per row index for reproducibility)
    df['temperature'] = [synthetic_temp(h, i)     for i, h in enumerate(df['hour'])]
    df['humidity']    = [synthetic_humidity(h, i)  for i, h in enumerate(df['hour'])]

    # Target
    df['brightness']  = df.apply(
        lambda r: brightness_target(r['lux'], r['time_of_day'], r['temperature']), axis=1
    )

    features = ['lux', 'temperature', 'humidity', 'hour', 'time_of_day']
    target   = 'brightness'

    X = df[features]
    y = df[target]

    # Normalise features
    scaler = MinMaxScaler()
    X_scaled = pd.DataFrame(scaler.fit_transform(X), columns=features)

    # Save
    out_csv = os.path.join(OUT_DIR, 'processed.csv')
    full = X_scaled.copy()
    full['brightness'] = y.values
    full.to_csv(out_csv, index=False)
    joblib.dump(scaler, os.path.join(OUT_DIR, 'scaler.pkl'))

    print(f"Processed {len(full):,} rows → {out_csv}")
    print(full.describe().round(2))
    return full

if __name__ == '__main__':
    preprocess()
