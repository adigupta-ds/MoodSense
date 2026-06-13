"""
Model training + comparison
────────────────────────────
Compares: Linear Regression, Random Forest, XGBoost, Neural Network (MLP)
Selects best by R² on test set.
Saves best model + scaler to model/
"""

import os, json
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection    import train_test_split
from sklearn.linear_model       import LinearRegression
from sklearn.ensemble           import RandomForestRegressor
from sklearn.neural_network     import MLPRegressor
from sklearn.metrics            import r2_score, mean_absolute_error, mean_squared_error
from xgboost                    import XGBRegressor

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')
DATA_PATH = os.path.join(MODEL_DIR, 'processed.csv')

def rmse(y_true, y_pred):
    return float(np.sqrt(mean_squared_error(y_true, y_pred)))

def evaluate(name, model, X_train, X_test, y_train, y_test):
    model.fit(X_train, y_train)
    pred  = model.predict(X_test)
    r2    = float(r2_score(y_test, pred))
    mae   = float(mean_absolute_error(y_test, pred))
    rmse_ = rmse(y_test, pred)
    print(f"  {name:<22} R²={r2:.4f}  MAE={mae:.2f}  RMSE={rmse_:.2f}")
    return {'name': name, 'model': model, 'r2': r2, 'mae': mae, 'rmse': rmse_}

def train():
    if not os.path.exists(DATA_PATH):
        print("processed.csv not found — running preprocess first...")
        from preprocess import preprocess
        preprocess()

    df = pd.read_csv(DATA_PATH)
    features = ['lux', 'temperature', 'humidity', 'hour', 'time_of_day']
    X = df[features].values
    y = df['brightness'].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    candidates = [
        ('Linear Regression',  LinearRegression()),
        ('Random Forest',      RandomForestRegressor(n_estimators=100, n_jobs=-1, random_state=42)),
        ('XGBoost',            XGBRegressor(n_estimators=200, learning_rate=0.05,
                                            max_depth=6, random_state=42, verbosity=0)),
        ('Neural Network',     MLPRegressor(hidden_layer_sizes=(64, 32), max_iter=500,
                                            random_state=42, early_stopping=True)),
    ]

    print("\n── Model Comparison ─────────────────────────────────────")
    results = [evaluate(n, m, X_train, X_test, y_train, y_test) for n, m in candidates]

    # Pick best by R²
    best = max(results, key=lambda r: r['r2'])
    print(f"\n✓ Best model: {best['name']}  (R²={best['r2']:.4f})")

    # Save best model
    joblib.dump(best['model'], os.path.join(MODEL_DIR, 'best_model.pkl'))

    # Save evaluation report
    report = {
        'best': best['name'],
        'metrics': [
            {'name': r['name'], 'r2': r['r2'], 'mae': r['mae'], 'rmse': r['rmse']}
            for r in results
        ]
    }
    with open(os.path.join(MODEL_DIR, 'report.json'), 'w') as f:
        json.dump(report, f, indent=2)

    print(f"Model saved → {MODEL_DIR}/best_model.pkl")
    print(f"Report saved → {MODEL_DIR}/report.json")
    return best

if __name__ == '__main__':
    train()
