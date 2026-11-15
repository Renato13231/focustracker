"""Modelo de clasificación Random Forest (etapa 2 de la tesis).

Limitación importante: aún no existen datos reales etiquetados por personas.
El modelo se entrena con datos sintéticos etiquetados por las reglas de la
etapa 1, por lo que *aproxima* esas reglas con fronteras más suaves. Cuando
haya datos reales etiquetados, se reentrena con `python -m app.model --data ...`.
"""
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

from .analysis import FEATURES, LABELS, rule_classify

MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "rf.joblib"


def synth_dataset(n: int = 20000, seed: int = 7):
    rng = np.random.default_rng(seed)
    X, y = [], []
    for _ in range(n):
        total = rng.uniform(30, 720)
        shares = rng.dirichlet([1.2, 1.2, 1.0])
        prod, rec, dis = shares
        opens = int(rng.integers(5, 90))
        night = float(max(0, rng.normal(25, 35))) if rng.random() < 0.7 else 0.0
        long_s = int(rng.poisson(0.8 + 2 * dis))
        interruption = int(min(100, round(opens / (total / 60) * 14)))
        f = {
            "total_min": total,
            "productive_ratio": prod,
            "distractive_ratio": dis,
            "night_min": night,
            "opens": opens,
            "long_sessions": long_s,
            "interruption_index": interruption,
        }
        label, _, _ = rule_classify(f)
        X.append([f[k] for k in FEATURES])
        y.append(LABELS.index(label))
    return np.array(X), np.array(y)


def train(save: bool = True):
    X, y = synth_dataset()
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=1, stratify=y)
    rf = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=1, n_jobs=-1)
    rf.fit(Xtr, ytr)
    pred = rf.predict(Xte)
    acc = accuracy_score(yte, pred)
    report = classification_report(yte, pred, labels=range(len(LABELS)), target_names=LABELS, zero_division=0)
    importances = dict(zip(FEATURES, (float(v) for v in rf.feature_importances_)))
    if save:
        MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({"model": rf, "importances": importances, "accuracy": acc}, MODEL_PATH)
    return acc, report, importances


_cache: dict | None = None


def load() -> dict | None:
    global _cache
    if _cache is None and MODEL_PATH.exists():
        _cache = joblib.load(MODEL_PATH)
    return _cache


def predict(f: dict) -> tuple[str, dict[str, float]] | None:
    bundle = load()
    if bundle is None:
        return None
    x = np.array([[f[k] for k in FEATURES]])
    proba = bundle["model"].predict_proba(x)[0]
    classes = bundle["model"].classes_
    probs = {LABELS[int(c)]: round(float(p), 3) for c, p in zip(classes, proba)}
    best = max(probs, key=probs.get)
    return best, probs


if __name__ == "__main__":
    acc, report, imp = train()
    print(f"Exactitud (holdout 20%): {acc:.3f}\n{report}")
    for k, v in sorted(imp.items(), key=lambda kv: -kv[1]):
        print(f"{k:20s} {v:.3f}")
    print(f"Modelo guardado en {MODEL_PATH}")
