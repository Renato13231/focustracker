import os

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import model
from .analysis import compute_days, features_of, rule_classify
from .db import get_db
from .schemas import Classification, DayOut, SyncIn, SyncOut

app = FastAPI(title="FocusTracker API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    bundle = model.load()
    return {"status": "ok", "model": "random_forest" if bundle else "rules", "accuracy": bundle["accuracy"] if bundle else None}


def classify_day(k: dict, night_threshold: int) -> Classification:
    f = features_of(k)
    rule_label, reasons, _ = rule_classify(f, night_threshold)
    pred = model.predict(f)
    if pred is None:
        return Classification(label=rule_label, reasons=reasons, method="rules")
    label, probs = pred
    return Classification(label=label, reasons=reasons, method="random_forest", probabilities=probs)


@app.post("/v1/sync", response_model=SyncOut)
def sync(body: SyncIn, db=Depends(get_db)):
    # RF2: sin consentimiento no se registra ni procesa información.
    if not body.consent:
        raise HTTPException(status_code=403, detail="Se requiere consentimiento informado")
    days = compute_days(body.sessions, body.config)
    night_threshold = max(body.config.goals.max_night_min, 40)
    results = []
    for k in days:
        c = classify_day(k, night_threshold)
        results.append(DayOut(**k, classification=c))

    # RF11: trazabilidad — se reemplaza el historial del usuario por el último sync.
    db.sessions.delete_many({"user_id": body.user_id})
    if body.sessions:
        db.sessions.insert_many([{"user_id": body.user_id, **s.model_dump()} for s in body.sessions])
    for r in results:
        db.days.replace_one(
            {"user_id": body.user_id, "day": r.day},
            {"user_id": body.user_id, **r.model_dump()},
            upsert=True,
        )
    return SyncOut(user_id=body.user_id, stored_sessions=len(body.sessions), days=results)


@app.get("/v1/users/{user_id}/history")
def history(user_id: str, limit: int = 30, db=Depends(get_db)):
    rows = list(db.days.find({"user_id": user_id}, {"_id": 0, "user_id": 0}).sort("day", -1).limit(min(limit, 365)))
    return {"userId": user_id, "days": rows}


@app.delete("/v1/users/{user_id}")
def delete_user(user_id: str, db=Depends(get_db)):
    """Revocación de consentimiento: borra todos los datos del usuario."""
    a = db.sessions.delete_many({"user_id": user_id}).deleted_count
    b = db.days.delete_many({"user_id": user_id}).deleted_count
    return {"deletedSessions": a, "deletedDays": b}
