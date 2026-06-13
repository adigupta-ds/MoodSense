# BrightML — Smart Adaptive Brightness Management System

An intelligent machine learning–driven brightness controller that automatically adjusts screen brightness based on surrounding lighting conditions, environmental factors, and user context. The system combines webcam-based ambient light sensing, live weather information, and a trained regression model to deliver optimal brightness levels in real time.

---

## Project Structure

```text
ml-brightness/
├── ml/
│   ├── preprocess.py
│   ├── train.py
│   ├── inference.py
│   ├── requirements.txt
│   ├── .env.example
│   └── model/
│       ├── best_model.pkl
│       ├── scaler.pkl
│       ├── processed.csv
│       └── report.json
│
├── brightness-worker/
│   ├── index.js
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── components/
│   └── package.json
│
└── README.md
```

---

## Overview

BrightML continuously monitors environmental conditions and predicts the most suitable display brightness level using a machine learning model. By integrating ambient light measurements, weather conditions, and time-based context, the system enhances visual comfort while improving energy efficiency.

### Key Features

- Real-time ambient light estimation using webcam input
- Automatic brightness adjustment
- Machine learning–based prediction engine
- Weather-aware optimization
- Interactive analytics dashboard
- Energy consumption tracking
- Auto and manual control modes
- Historical prediction monitoring

---

## Technology Stack

### Backend
- Python
- FastAPI
- Scikit-Learn
- Pandas
- NumPy

### Frontend
- React (Vite)
- Tailwind CSS
- Recharts

### System Services
- Node.js
- Express
- Windows Brightness Control (WMI)

### Data Sources
- Webcam-based lux estimation
- Weather API (wttr.in)
- System time and contextual features

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-username/ml-brightness.git
cd ml-brightness
```

### 2. Configure Environment

```bash
cd ml
copy .env.example .env
```

Edit `.env`:

```env
CITY=Karachi
```

### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 4. Preprocess Data

```bash
python preprocess.py
```

### 5. Train Model

```bash
python train.py
```

### 6. Start FastAPI Backend

```bash
uvicorn inference:app --host 127.0.0.1 --port 8000 --reload
```

### 7. Start Brightness Worker

```bash
cd ../brightness-worker
npm install
npm start
```

### 8. Start React Dashboard

```bash
cd ../client
npm install
npm run dev
```

Open:

```text
http://localhost:5174
```

---

## Machine Learning Workflow

### Input Features

| Feature | Source |
|----------|----------|
| Lux | Webcam |
| Temperature | Weather API |
| Humidity | Weather API |
| Hour | System Clock |
| Time of Day | Derived Feature |

### Evaluated Models

| Model | Purpose |
|---------|---------|
| Linear Regression | Baseline Model |
| Random Forest | Ensemble Regression |
| XGBoost | Boosting Regression |
| Neural Network | Deep Learning Regression |

### Best Performing Model

**Random Forest Regressor**

| Metric | Score |
|---------|---------|
| R² Score | 0.9999 |
| MAE | 0.0002 |
| RMSE | 0.005 |

---

## Prediction Pipeline

```text
Webcam Feed
      ↓
Lux Estimation
      ↓
Feature Engineering
      ↓
ML Prediction
      ↓
Brightness Optimization
      ↓
Screen Brightness Update
```

The system applies smoothing and threshold logic to prevent unnecessary brightness fluctuations and ensure a comfortable viewing experience.

---

## API Endpoints

### FastAPI Server

| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | /status | Current system status |
| POST | /predict | Generate prediction |
| POST | /camera-lux | Update lux reading |
| POST | /brightness | Set brightness |
| POST | /mode | Toggle mode |
| GET | /weather | Weather data |
| GET | /report | Model performance report |
| GET | /history | Prediction history |

### Brightness Worker

| Method | Endpoint |
|---------|-----------|
| POST | /brightness |
| GET | /brightness |

---

## Dashboard Modules

### Overview
- Live monitoring
- KPI cards
- Camera feed
- Brightness controls

### Environment
- Lux tracking
- Temperature trends
- Humidity monitoring
- Weather insights

### Machine Learning
- Model comparison
- Prediction analytics
- Performance metrics
- Efficiency visualization

### Energy Analytics
- Energy consumption estimation
- CO₂ savings calculation
- Environmental impact analysis

---

## Energy Impact Calculations

Assuming a 5W display at 100% brightness:

```text
Power Consumption = Brightness × Display Power
Energy Saved = Reduced Brightness Usage
CO₂ Reduction = Energy Saved × Grid Emission Factor
```

Equivalent metrics include:

- CO₂ emissions saved
- Vehicle travel equivalents
- Tree absorption equivalents
- LED usage comparisons

---

## Applications

- Smart workstations
- Adaptive display systems
- Sustainable computing
- Human-centered automation
- Context-aware environments

---

## Future Scope

- Personalized brightness profiles
- User behavior learning
- Multi-monitor support
- Deep learning integration
- Cross-platform compatibility
- Cloud-based synchronization

---

## Notes

- Optimized for Windows laptops with internal displays.
- Weather data is cached to reduce network requests.
- Models can be retrained using updated datasets.
- Existing model artifacts are automatically replaced during retraining.

---

## License

This project is intended for educational, research, and portfolio purposes.
