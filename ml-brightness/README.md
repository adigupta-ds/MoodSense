# BrightML — Intelligent Brightness Control System

An ML-powered screen brightness controller that uses your webcam as a light sensor, weather API for temperature/humidity, and a trained regression model to predict and apply optimal screen brightness in real time.

---

## Project Structure

```
ml-brightness/
├── ml/                     # Python ML backend (FastAPI)
│   ├── preprocess.py       # Data pipeline — loads CSVs, derives features, normalizes
│   ├── train.py            # Trains 4 models, selects best by R², saves artifacts
│   ├── inference.py        # FastAPI server — prediction, weather, brightness control
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Environment config template
│   └── model/
│       ├── best_model.pkl  # Trained model (Random Forest)
│       ├── scaler.pkl      # MinMaxScaler fitted on training data
│       ├── processed.csv   # Preprocessed dataset
│       └── report.json     # Model comparison results
│
├── brightness-worker/      # Node.js brightness control service
│   ├── index.js            # Express server — sets OS screen brightness
│   └── package.json
│
├── client/                 # React dashboard (Vite + Tailwind v4)
│   ├── src/
│   │   ├── App.jsx                        # Main app, tabs, state management
│   │   ├── index.css                      # Global styles, glassmorphism
│   │   └── components/
│   │       ├── CameraLux.jsx              # Webcam → lux estimation
│   │       ├── BrightnessLever.jsx        # Draggable brightness control
│   │       ├── KpiCard.jsx                # Animated stat cards
│   │       ├── EnergyChart.jsx            # Recharts area/line charts
│   │       ├── ImpactCard.jsx             # Real-world CO₂/car/tree equivalents
│   │       ├── EfficiencyBadge.jsx        # Animated efficiency ring
│   │       ├── MLInsight.jsx              # Model comparison + prediction display
│   │       ├── ControlPanel.jsx           # Auto/Manual toggle + lever
│   │       ├── EnvPanel.jsx               # Weather + time of day
│   │       └── ExportButton.jsx           # PDF report export
│   └── package.json
└── README.md
```

---

## Prerequisites

- Python 3.11+ (tested on 3.13)
- Node.js 18+
- Windows laptop with internal display (brightness control via WMI)

---

## Setup

### Step 1 — Configure environment

```bash
cd ml-brightness/ml
copy .env.example .env
```

Edit `.env`:
```
CITY=Karachi
```

No API key needed. Weather is fetched from [wttr.in](https://wttr.in) — free, no signup.

---

### Step 2 — Install Python dependencies

```bash
cd ml-brightness/ml
python -m pip install -r requirements.txt
```

---

### Step 3 — Train the model (run once)

```bash
python preprocess.py
python train.py
```

`preprocess.py` loads 14 floor CSV files from `raw/`, derives lux from lighting power (kW), generates synthetic temperature/humidity curves, and saves `model/processed.csv`.

`train.py` compares 4 models and saves the best:

| Model             | R²       | MAE    | RMSE   |
|-------------------|----------|--------|--------|
| Linear Regression | 0.9577   | 4.89   | 6.03   |
| **Random Forest** | **1.000**| **0.0002** | **0.005** |
| XGBoost           | 0.9999   | 0.034  | 0.149  |
| Neural Network    | 0.9999   | 0.007  | 0.013  |

Best model: **Random Forest** (R² = 0.9999)

---

### Step 4 — Start the FastAPI server

```bash
cd ml-brightness/ml
uvicorn inference:app --host 127.0.0.1 --port 8000 --reload
```

---

### Step 5 — Start the brightness worker

```bash
cd ml-brightness/brightness-worker
npm install
npm start
```

Runs on `http://127.0.0.1:7777`. Accepts `POST /brightness { level: 0-100 }` and sets OS screen brightness using the `brightness` npm package.

---

### Step 6 — Start the React dashboard

```bash
cd ml-brightness/client
npm install
npm run dev
```

Open `http://localhost:5174`

---

## How It Works

### Brightness pipeline (per camera frame, every 200ms)

```
Camera frame
  → ITU-R BT.709 luminance → gamma correction → lux estimate (50–999)
  → luxToBrightness() → direct brightness (immediate, <5ms)
      → POST 127.0.0.1:7777/brightness  ← screen updates
  → POST /camera-lux → POST /predict
      → ML model (Random Forest, ~30ms)
      → blend(40% ML + 60% direct)
      → POST 127.0.0.1:7777/brightness  ← ML fine-tune
```

Brightness only changes when lux shifts by more than 30 units, with a 6-second debounce to prevent flickering from camera noise.

### Lux → Brightness rules

| Lux range   | Brightness output         |
|-------------|---------------------------|
| < 150 lux   | Fixed 80%                 |
| 150–800 lux | Linear 80% → 5%           |
| > 800 lux   | Fixed 0% (screen off)     |

### ML model inputs

| Feature      | Source              | Range     |
|--------------|---------------------|-----------|
| lux          | Webcam              | 50–999    |
| temperature  | wttr.in weather API | °C        |
| humidity     | wttr.in weather API | %         |
| hour         | System clock        | 0–23      |
| time_of_day  | Derived from hour   | 0–3       |

---

## API Reference

### FastAPI — `http://127.0.0.1:8000`

| Method | Endpoint        | Description                          |
|--------|-----------------|--------------------------------------|
| GET    | `/status`       | Current system state                 |
| POST   | `/predict`      | Run ML inference `{ lux? }`          |
| POST   | `/camera-lux`   | Push lux value `{ lux: number }`     |
| POST   | `/brightness`   | Set brightness `{ level: 0-100 }`    |
| POST   | `/mode`         | Toggle auto/manual                   |
| GET    | `/weather`      | Fetch temperature + humidity         |
| GET    | `/report`       | Model comparison results             |
| GET    | `/history`      | Last 100 prediction records          |

### Brightness Worker — `http://127.0.0.1:7777`

| Method | Endpoint      | Description                        |
|--------|---------------|------------------------------------|
| POST   | `/brightness` | Set brightness `{ level: 0-100 }` |
| GET    | `/brightness` | Get current brightness level       |

---

## Dashboard Tabs

| Tab         | Content                                                              |
|-------------|----------------------------------------------------------------------|
| Overview    | KPI cards, live charts, camera feed, control panel, impact card      |
| Energy      | kWh math, savings over time, CO₂/car/tree/flight equivalents         |
| Environment | Temperature & humidity trends, lux history, weather panel            |
| ML          | Model comparison bars, prediction vs actual, efficiency score ring   |

---

## Energy Calculations

Assumes a 5W screen at 100% brightness (proportional scaling).

- kWh per second = `(brightness / 100 × 5W) / 3600`
- CO₂ per kWh = 0.233 kg (global average grid)
- Car equivalent = CO₂ saved / 0.21 kg per km
- Tree-days = CO₂ saved / 0.0575 kg per tree per day
- LED hours = kWh saved / 0.01 kWh per hour (10W bulb)

---

## Notes

- Brightness control only works on internal laptop displays (Windows WMI). External monitors via HDMI/DisplayPort are not supported.
- Weather is cached for 10 minutes to avoid rate limiting.
- The model is retrained from scratch each time `train.py` runs. Existing `best_model.pkl` is overwritten.
