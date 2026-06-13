# MoodSense — Full Technical Report

> Intelligent ML-powered screen brightness control system using real-time ambient light sensing, weather data, and a trained regression model to adaptively manage display brightness and track energy savings.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Raw Data Sources](#3-raw-data-sources)
4. [Data Cleaning and Preprocessing](#4-data-cleaning-and-preprocessing)
5. [Feature Engineering](#5-feature-engineering)
6. [Target Variable Construction](#6-target-variable-construction)
7. [Model Training and Comparison](#7-model-training-and-comparison)
8. [Model Selection — Why Random Forest Won](#8-model-selection--why-random-forest-won)
9. [Inference Pipeline](#9-inference-pipeline)
10. [Why FastAPI and Uvicorn](#10-why-fastapi-and-uvicorn)
11. [Brightness Worker — Node.js Service](#11-brightness-worker--nodejs-service)
12. [React Dashboard — UI Architecture](#12-react-dashboard--ui-architecture)
13. [Camera Lux Estimation](#13-camera-lux-estimation)
14. [Energy and Environmental Impact Calculations](#14-energy-and-environmental-impact-calculations)
15. [API Reference](#15-api-reference)
16. [How to Run](#16-how-to-run)
17. [Results Summary](#17-results-summary)

---

## 1. Project Overview

MoodSense is a three-service system that automatically adjusts your laptop screen brightness based on the ambient light in your environment. It uses:

- A webcam as a lux sensor (no hardware required)
- Real-time weather data for temperature and humidity context
- A machine learning regression model trained on real building energy datasets
- A Node.js microservice to physically set OS-level screen brightness via WMI
- A React dashboard to visualize predictions, energy savings, and environmental impact in real time

The core idea: instead of a fixed brightness setting, the system continuously reads ambient light, feeds it through an ML model, and applies the optimal brightness — saving energy and reducing eye strain.

---

## 2. System Architecture

The system is composed of three independent services that communicate over localhost HTTP:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (React)                          │
│                     http://localhost:5174                       │
│                                                                 │
│  Camera → lux estimate → POST /camera-lux → POST /predict      │
│  Charts, KPI cards, energy tracking, PDF export                 │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP (proxied by Vite)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FastAPI (Python / Uvicorn)                     │
│                    http://127.0.0.1:8000                        │
│                                                                 │
│  /predict  → ML inference (Random Forest)                       │
│  /weather  → wttr.in fetch (temp + humidity)                    │
│  /status   → current system state                               │
│  /history  → last 100 prediction records                        │
│  /mode     → toggle auto / manual                               │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP (fire-and-forget thread)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              Brightness Worker (Node.js / Express)              │
│                    http://127.0.0.1:7777                        │
│                                                                 │
│  POST /brightness { level: 0-100 }                              │
│  → brightness npm package → WMI → OS display driver            │
└─────────────────────────────────────────────────────────────────┘
```

The React client never talks directly to the OS. It sends lux readings to FastAPI, which runs inference and then fires a non-blocking POST to the brightness worker. The worker is the only service with OS-level access.

Vite's dev server proxy forwards all API calls (`/predict`, `/weather`, `/status`, etc.) from port 5174 to port 8000, so the frontend never needs to hardcode the backend URL.

---

## 3. Raw Data Sources

Two datasets were used, both containing real building energy monitoring data from a multi-floor commercial building:

**archive(1) — 2018 data**
```
raw/archive(1)/2018Floor1.csv  through  2018Floor7.csv
```

**archive (2) — 2019 data**
```
raw/archive (2)/2019Floor1.csv  through  2019Floor6.csv
```

Each CSV contains timestamped energy readings per zone, including columns for lighting power consumption in kilowatts (kW). Column names follow the pattern `*Light*` (e.g., `Zone1 Light (kW)`). Each file represents one floor of the building, with readings at 15-minute or hourly intervals.

The ASHRAE database (`raw/ashrae-db-II-master/`) was also present in the workspace but was not used in the final pipeline — the floor-level CSVs provided sufficient volume and structure.

Total rows after merging all 13 CSV files: tens of thousands of timestamped energy readings spanning two full years across seven floors.

---

## 4. Data Cleaning and Preprocessing

All preprocessing is handled in `ml/preprocess.py`.

**Step 1 — Load and merge**

All CSV files from both archive directories are loaded with `pd.read_csv()`. The `Date` column is parsed with `pd.to_datetime(..., errors='coerce')` to handle any malformed timestamps gracefully. All `*Light*` columns are averaged per row into a single `light_kw` column representing mean lighting power across zones. All 13 files are concatenated into one DataFrame.

**Step 2 — Drop nulls and outliers**

```python
df = df.dropna()
df = df[df['light_kw'] >= 0]                              # remove negative readings (sensor errors)
df = df[df['light_kw'] < df['light_kw'].quantile(0.999)]  # remove top 0.1% extreme values
```

Negative kW values are physically impossible and indicate sensor faults. The 99.9th percentile cap removes extreme spikes that would distort the lux conversion and skew the model.

**Step 3 — Normalize features**

After feature derivation (see Section 5), all five input features are scaled to [0, 1] using `sklearn.preprocessing.MinMaxScaler`. The fitted scaler is saved to `model/scaler.pkl` with `joblib.dump()` so inference uses the exact same scaling parameters as training — a critical requirement for consistent predictions.

The processed dataset is saved to `model/processed.csv`.

---

## 5. Feature Engineering

Five features are derived from the raw data:

**lux** — Converted from lighting power using a physics-based approximation:
```
lux = light_kw × 1000 × 80 / 50
```
This converts kilowatts to watts (×1000), applies a fluorescent lamp efficacy of ~80 lux per watt, and divides by an assumed zone area of 50 m². The result is clipped to [0, 1000] lux, matching the range of a typical indoor light sensor.

**hour** — Extracted from the timestamp's hour component (0–23). Captures the time-of-day pattern in energy usage.

**time_of_day** — A categorical encoding derived from hour:
```
0 = Night     (21:00 – 04:59)
1 = Morning   (05:00 – 11:59)
2 = Afternoon (12:00 – 16:59)
3 = Evening   (17:00 – 20:59)
```
This gives the model a coarser time signal that aligns with human activity patterns and natural light cycles.

**temperature** — Synthetic, generated deterministically per row using a sinusoidal curve:
```python
base = 22 + 8 × sin(π × (hour - 6) / 12)
```
This produces a realistic daily temperature curve: cooler at night (~14°C), peaking around 14:00 (~30°C). Gaussian noise (σ=1.5°C) is added for realism. Seeded by row index for full reproducibility.

**humidity** — Synthetic, inversely correlated with temperature (higher at night, lower in the afternoon):
```python
base = 60 - 20 × sin(π × (hour - 6) / 12)
```
Gaussian noise (σ=5%) is added. Also seeded by row index.

The synthetic weather features exist because the raw building dataset contains no weather columns. They allow the model to learn the relationship between environmental conditions and optimal brightness, which is then applied at inference time using real weather from wttr.in.

---

## 6. Target Variable Construction

The target variable `brightness` (0–100%) is constructed using a rule-based function applied to each row:

```python
def brightness_target(lux, tod, temp):
    base = 100 - clip(lux / 10, 0, 80)   # lux 0 → 100%, lux 1000 → 20%
    if tod == 0: base *= 0.70             # night: reduce by 30%
    if temp > 30: base -= (temp - 30) × 0.8  # heat penalty
    return clip(base, 5, 100)
```

This is a physics-informed ground truth: high ambient light means the screen needs less brightness (the room is already bright), night-time warrants dimmer screens, and high temperatures suggest a preference for lower brightness to reduce heat output. The 5% floor prevents the screen from going completely dark.

This rule-based target is what the ML models learn to replicate. At inference time, the model generalizes this relationship to unseen lux/temperature/humidity/hour combinations.

---

## 7. Model Training and Comparison

Training is handled in `ml/train.py`. The processed dataset is split 80/20 (train/test) with `random_state=42` for reproducibility.

Four candidate models are trained and evaluated:

**Linear Regression** (`sklearn.linear_model.LinearRegression`)
A baseline statistical model. Fits a linear hyperplane through the feature space. Fast to train, fully interpretable, but cannot capture the non-linear interactions between lux, time of day, and temperature.

**Random Forest** (`sklearn.ensemble.RandomForestRegressor`, 100 trees, `n_jobs=-1`)
An ensemble of 100 decision trees, each trained on a random bootstrap sample of the data with a random subset of features at each split. Predictions are averaged across all trees. Naturally handles non-linearity, feature interactions, and is robust to outliers. Parallelized across all CPU cores.

**XGBoost** (`xgboost.XGBRegressor`, 200 estimators, learning rate 0.05, max depth 6)
Gradient boosted trees. Builds trees sequentially, each correcting the residual errors of the previous. More regularized than Random Forest, often better on tabular data with noise. 200 estimators with a low learning rate provides strong generalization.

**Neural Network** (`sklearn.neural_network.MLPRegressor`, layers: 64→32, max 500 iterations, early stopping)
A two-layer multi-layer perceptron. Learns non-linear mappings through backpropagation. Early stopping prevents overfitting. Slower to train than tree-based models and requires careful hyperparameter tuning, but can approximate any continuous function given enough data.

**Evaluation metrics:**

| Model             | R²           | MAE          | RMSE         |
|-------------------|--------------|--------------|--------------|
| Linear Regression | 0.9577       | 4.8891       | 6.0261       |
| Random Forest     | 0.9999999678 | 0.0001995    | 0.0052590    |
| XGBoost           | 0.9999741015 | 0.0343885    | 0.1490980    |
| Neural Network    | 0.9999998143 | 0.0070116    | 0.0126247    |

All metrics computed on the held-out 20% test set. Best model selected by highest R².

---

## 8. Model Selection — Why Random Forest Won

Random Forest achieved R² = 0.9999999678 — essentially perfect reconstruction of the target on unseen data. MAE of 0.0002% and RMSE of 0.005% mean the model's brightness predictions are off by less than a hundredth of a percent on average.

Why does it perform this well? The target variable (`brightness`) is a deterministic function of the input features — it was generated by `brightness_target(lux, tod, temp)`. Decision trees are extremely well-suited to learning piecewise-constant functions with sharp boundaries (like the `if tod == 0` and `if temp > 30` conditions). An ensemble of 100 trees can perfectly partition the feature space to match these rules.

Linear Regression's lower R² (0.9577) confirms the relationship is non-linear — a straight line cannot capture the conditional dimming rules. XGBoost and Neural Network both achieve near-perfect scores too, but Random Forest edges them out on all three metrics.

The best model is saved to `model/best_model.pkl` and the full comparison is written to `model/report.json`, which the frontend fetches at startup to display in the ML tab and Reports page.

---

## 9. Inference Pipeline

The inference server (`ml/inference.py`) loads the saved model and scaler at startup:

```python
model  = joblib.load('model/best_model.pkl')
scaler = joblib.load('model/scaler.pkl')
```

When a prediction is requested via `POST /predict`, the pipeline is:

1. Merge the incoming payload with the current server state (lux, temperature, humidity, hour)
2. Attempt to refresh weather from wttr.in (cached for 10 minutes)
3. Run `predict_brightness(lux, temp, humidity, hour)`:
   - Clamp lux to [50, 999]
   - Apply hard rules: lux > 800 → return 0%, lux < 150 → return 80%
   - For lux in [150, 800]: linearly remap to brightness [80%, 5%]
   - Apply modifiers: heat penalty if temp > 30°C, night dimming if hour is 21–4
   - Run the ML model: `model.predict(scaler.transform([[lux, temp, humidity, hour, tod]]))`
   - Blend: `0.3 × ML output + 0.7 × direct mapping`
4. If auto mode is active and no manual override, fire `set_screen_brightness(predicted)` in a background thread
5. Append the full record to the in-memory `history` deque (max 100 entries)
6. Return the prediction, inputs, energy saving %, and model name

The 30/70 blend keeps the ML model in the loop (it contributes 30% of the final value) while ensuring the output stays responsive to lux changes. A pure ML output could be sluggish if the model's learned mapping doesn't perfectly track the direct lux→brightness curve at inference time.

**Weather fetching** uses wttr.in's JSON API (`https://wttr.in/{CITY}?format=j1`) — free, no API key, works globally. Results are cached in server state for 10 minutes to avoid rate limiting.

**Energy saving** is computed as:
```python
saving_pct = (100 - predicted) / 100 × 100
```
A brightness of 60% means 40% energy saved vs. running at full brightness.

---

## 10. Why FastAPI and Uvicorn

**FastAPI** was chosen as the Python web framework for several reasons:

- Automatic request/response validation via Pydantic models — no manual JSON parsing or type checking
- Auto-generated OpenAPI docs at `/docs` with zero configuration
- Async-capable by design, which matters for the non-blocking brightness worker calls
- Minimal boilerplate: a route is a decorated function, a request body is a Pydantic class
- Native CORS middleware support, needed because the React client on port 5174 calls the API on port 8000

**Uvicorn** is the ASGI server that runs FastAPI. It is:

- An ASGI (Asynchronous Server Gateway Interface) server, required for FastAPI's async capabilities
- Significantly faster than WSGI servers like Gunicorn for I/O-bound workloads
- Supports hot reload (`--reload` flag) during development — the server restarts automatically when `inference.py` changes
- Lightweight: single process, no configuration file needed, starts with one command

The combination of FastAPI + Uvicorn is the standard production-grade Python API stack. For this project specifically, Uvicorn's async I/O means the brightness worker POST (which can take up to 2 seconds) never blocks the prediction endpoint — it runs in a daemon thread and the `/predict` response returns immediately.

The server is started with:
```bash
uvicorn inference:app --host 127.0.0.1 --port 8000 --reload
```
`inference:app` means "the `app` object inside `inference.py`". `--host 127.0.0.1` binds only to localhost for security — the API is not exposed on the network.

---

## 11. Brightness Worker — Node.js Service

The brightness worker (`brightness-worker/index.js`) is a minimal Express server that acts as the OS bridge. It exists as a separate service because Python has no reliable cross-platform library for setting screen brightness on Windows laptops. The `brightness` npm package uses native Windows WMI (Windows Management Instrumentation) calls through `pywin32`-equivalent Node bindings.

**Why a separate service instead of calling WMI from Python?**

The Python side does use `wmi` and `pywin32` (listed in `requirements.txt`), but the Node.js worker provides a cleaner separation: the ML server handles prediction logic, the worker handles hardware I/O. This also means the brightness worker can be replaced or extended (e.g., to support DDC/CI for external monitors) without touching the ML code.

**How it works:**

```javascript
const _b  = require('brightness');
const set = promisify(_b.set.bind(_b));

app.post('/brightness', async (req, res) => {
    const level = parseFloat(req.body.level);
    await set(level / 100);   // brightness package expects 0.0–1.0
    res.json({ ok: true, level });
});
```

The `brightness` npm package normalizes the value to 0.0–1.0 and calls the appropriate OS API. On Windows, this goes through WMI's `WmiMonitorBrightnessMethods` class, which controls the internal display backlight. External monitors connected via HDMI or DisplayPort are not supported — they require DDC/CI protocol which is a separate implementation.

The worker runs on port 7777, bound to 127.0.0.1. CORS headers are set manually to allow direct calls from the browser (the React client calls the worker directly for immediate brightness feedback before the ML response arrives).

---

## 12. React Dashboard — UI Architecture

The frontend is a React 18 single-page application built with Vite 5 and styled with Tailwind CSS v4. The design language is "midnight glass" — dark navy background, glassmorphism cards, animated gradients, and monospace typography for data readouts.

**Routing** (`main.jsx`):
Two routes via React Router v6:
- `/` → `App.jsx` — the main real-time dashboard
- `/ml-reports` → `ReportsPage.jsx` — the static model analytics page

An `ErrorBoundary` class component wraps the entire app to catch runtime errors and display a readable stack trace instead of a blank screen.

**State management** (`App.jsx`):
All state lives in `App.jsx` using `useState` hooks. A `setInterval` polling loop runs every 1 second, calling `GET /status` to pull the latest prediction, lux, temperature, and humidity from the FastAPI server. Each poll appends an entry to the `history` array (capped at 60 entries for chart performance) and accumulates `kwhSaved` and `kwhBaseline` counters.

**Tab structure:**
The dashboard has four tabs managed by an `activeTab` state string:

- `overview` — The main view. Six KPI cards across the top (lux gauge, ML target %, live output %, efficiency %, CO₂ saved, temperature). Below: camera feed + control panel on the left, two live charts in the center, efficiency ring + impact card + environment panel on the right.
- `energy` — Accumulated kWh savings, baseline vs. ML comparison in large monospace typography, five environmental impact metrics.
- `environment` — Temperature/humidity trend chart, lux/brightness correlation chart, environment panel with live weather.
- `ml` — Efficiency badge, ML insight panel with model comparison bars, prediction vs. actual chart.

**Key components:**

`CameraLux.jsx` — Manages the webcam stream, pixel luminance calculation, EMA smoothing, and the two-step brightness update (direct lux→brightness immediately, then ML-blended after 6 seconds). Detailed in Section 13.

`ControlPanel.jsx` — Auto/Manual toggle with an animated sliding pill indicator. In manual mode, exposes a draggable `BrightnessLever` (vertical canvas-based slider) and a horizontal range input with a custom visual knob. Debounced at 80ms to avoid flooding the brightness worker.

`EnergyChart.jsx` — Four Recharts chart components: `LiveEnergyChart` (area chart, ML% vs baseline 100%), `SavingsChart` (area chart, energy saved %), `LuxBrightnessChart` (dual-axis line chart, lux on left, brightness % on right), `EnvChart` (line chart, temperature and humidity over time).

`EfficiencyBadge.jsx` — Animated SVG circular gauge showing the current efficiency score (0–100%). Color-coded: green (≥80%), blue (≥60%), amber (≥40%), red (<40%). Uses Framer Motion for the stroke-dashoffset animation.

`LuxGauge.jsx` — Half-circle SVG gauge showing current lux with a gradient fill (blue → yellow → red). Displays a text label (Very Dark / Dim / Indoor / Bright / Very Bright / Intense) and a trend arrow when lux changes.

`ImpactCard.jsx` — Converts accumulated kWh saved into five real-world equivalents: CO₂ avoided (kg), car distance offset (km), flight equivalent (% of 1-hour flight), tree-days of carbon sequestration, and LED bulb hours saved.

`ExportButton.jsx` — Generates a PDF report using jsPDF and jspdf-autotable. The PDF includes a summary table (kWh saved, CO₂, efficiency score, best model, total readings) and a table of the last 30 readings with timestamps, lux, ML%, actual%, saving%, and temperature.

`MLInsight.jsx` — Shows predicted vs. actual brightness, accuracy (100 - |predicted - actual|), input lux, a stability indicator (Stable / Drifting / Unstable based on prediction drift), and animated R² comparison bars for all four models.

`EnvPanel.jsx` — Displays temperature, humidity, time of day, and city name with animated progress bars and live indicator dot.

**ReportsPage.jsx** — A separate static analytics page that reads from `src/data/reports.json` (a copy of `model/report.json`). Displays six KPI summary cards, four Recharts visualizations (bar chart, pie chart, line chart, radar chart), and a full sortable metrics table. The radar chart adds two qualitative dimensions — Speed and Simplicity — to give a multi-dimensional view of each model's profile beyond just accuracy metrics.

---

## 13. Camera Lux Estimation

The webcam-based lux sensor is implemented entirely in the browser using the Canvas API. No server round-trip is needed for the lux calculation itself.

**Luminance calculation:**

Each frame (every 200ms), the video frame is drawn to a hidden canvas and the raw pixel data is extracted with `getImageData()`. Per-pixel luminance is computed using the ITU-R BT.709 standard coefficients:

```
luminance = 0.2126 × R + 0.7152 × G + 0.0722 × B
```

The average luminance across all pixels is computed, then gamma-corrected to convert from display gamma (≈2.2) to linear light:

```javascript
const linear = Math.pow(avg / 255, 2.2);
const raw    = Math.round(Math.sqrt(linear) * 1000);
```

The square root maps the linear value to a lux-like scale of 0–1000.

**Stabilization:**

The first 6 frames after camera start are discarded (warmup period) to allow auto-exposure to settle. After warmup, an Exponential Moving Average (EMA) with α=0.35 smooths the raw lux values:

```
ema = 0.35 × raw + 0.65 × previous_ema
```

This filters out frame-to-frame noise while still responding to genuine light changes within a few seconds.

**Exposure lock:**

If the browser supports the MediaDevices Constraints API, the camera is set to manual exposure mode with a mid-range exposure time. This prevents the auto-exposure algorithm from compensating for brightness changes — which would make the lux readings constant regardless of actual light levels.

**Two-step brightness update:**

When lux changes by more than 30 units (significant change threshold), a 6-second debounce timer starts:

1. Immediately: `luxToBrightness(lux)` maps lux to brightness using the same hard rules as the server (lux < 150 → 80%, lux > 800 → 0%, linear in between). This is sent directly to the brightness worker for instant screen response.

2. After 6 seconds: The lux value is sent to `/camera-lux`, then `/predict` is called. The ML-blended result (40% ML + 60% direct) is sent to the brightness worker as a fine-tuned correction.

The 30-unit threshold and 6-second debounce prevent the screen from flickering due to camera noise or minor lighting fluctuations.

---

## 14. Energy and Environmental Impact Calculations

All energy math assumes a 5W screen at 100% brightness, scaling proportionally:

```
kWh per second = (brightness / 100 × 5W) / 3600
```

This is accumulated every second in the frontend polling loop. Two counters run in parallel: `kwhSaved` (difference between baseline and ML) and `kwhBaseline` (what 100% brightness would have consumed).

**Environmental conversions** (from `ImpactCard.jsx`):

| Metric | Formula | Source factor |
|--------|---------|---------------|
| CO₂ saved | kwhSaved × 0.233 kg/kWh | Global average grid emission factor |
| Car distance | CO₂ / 0.21 kg/km | Average car CO₂ per km |
| Flight equivalent | CO₂ / 255 kg × 100% | 1-hour flight ≈ 255 kg CO₂ |
| Tree-days | CO₂ / 0.0575 kg/day | Average tree CO₂ absorption per day |
| LED hours | kwhSaved / 0.01 kWh/hr | 10W LED bulb |

These are session-level accumulators — they reset when the page is refreshed. They are also exported in the PDF report.

---

## 15. API Reference

### FastAPI — `http://127.0.0.1:8000`

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/status` | — | Returns current model name, full state object (lux, temp, humidity, predicted, actual, mode), and server uptime |
| GET | `/report` | — | Returns `model/report.json` — best model name and all four models' R², MAE, RMSE |
| GET | `/history` | — | Returns last 100 prediction records as a list, newest first |
| GET | `/weather` | — | Fetches temperature, humidity, and city from wttr.in; updates server state |
| POST | `/predict` | `{ lux?, temperature?, humidity?, hour? }` | Runs ML inference; all fields optional (uses server state as defaults); returns full prediction record |
| POST | `/camera-lux` | `{ lux: number }` | Updates server's current lux value; used before calling /predict |
| POST | `/brightness` | `{ level: 0-100 }` | Sets actual brightness in server state and fires brightness worker |
| POST | `/mode` | `{ auto_mode?, manual_override?, manual_level? }` | Toggles auto/manual mode; if manual_override + manual_level, applies brightness immediately |

### Brightness Worker — `http://127.0.0.1:7777`

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/brightness` | `{ level: 0-100 }` | Converts to 0.0–1.0 and calls OS brightness API |
| GET | `/brightness` | — | Returns current OS brightness level as `{ level: 0-100 }` |

---

## 16. How to Run

**Prerequisites:** Python 3.11+, Node.js 18+, Windows with internal display.

**Option A — One-click launcher:**
```
ml-brightness/start.bat
```
Checks for `.env` and trained model, runs preprocessing and training if needed, starts all three services in separate terminal windows, and opens the browser.

**Option B — Manual:**

```bash
# 1. Configure city
cd ml-brightness/ml
copy .env.example .env
# Edit .env: CITY=YourCity

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Train the model (run once)
python preprocess.py
python train.py

# 4. Start FastAPI
uvicorn inference:app --host 127.0.0.1 --port 8000 --reload

# 5. Start brightness worker (new terminal)
cd ml-brightness/brightness-worker
npm install && npm start

# 6. Start React dashboard (new terminal)
cd ml-brightness/client
npm install && npm run dev
```

Open `http://localhost:5174`.

---

## 17. Results Summary

The system achieves near-perfect ML accuracy on the training task (R² = 0.9999999678, MAE = 0.0002%) because the target variable is a deterministic function of the input features. In production, the model contributes 30% of the final brightness value, blended with a direct lux-to-brightness mapping that provides immediate, reliable response.

The camera-based lux sensor works without any additional hardware — just the built-in webcam. EMA smoothing and a 30-unit change threshold make the system stable under typical indoor lighting conditions.

Energy savings are proportional to how far below 100% the ML-predicted brightness sits. In a typical indoor environment (300–600 lux), the system targets 40–70% brightness, saving 30–60% of screen energy compared to running at full brightness.

The three-service architecture (FastAPI + Node.js worker + React) keeps concerns cleanly separated: ML logic in Python, OS hardware access in Node.js, and visualization in the browser. Each service can be updated or replaced independently.
