import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def sess(day, app_name, cat, hour, dur, group="Redes sociales"):
    return {"day": day, "app": app_name, "group": group, "category": cat, "startHour": hour, "durationMin": dur}


def payload(sessions, consent=True, uid="user-test-1", **cfg):
    return {"userId": uid, "consent": consent, "config": cfg, "sessions": sessions}


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["model"] == "random_forest"


def test_consent_required():
    r = client.post("/v1/sync", json=payload([sess("2026-11-01", "X", "distractiva", 10, 20)], consent=False))
    assert r.status_code == 403


def test_kpis_and_risk_pattern():
    day = "2026-11-02"
    s = [
        sess(day, "TikTok", "distractiva", 23, 70),  # nocturna + larga
        sess(day, "Instagram", "distractiva", 0, 60),  # nocturna + larga
        sess(day, "Notion", "productiva", 10, 20, "Productividad"),
    ]
    r = client.post("/v1/sync", json=payload(s))
    assert r.status_code == 200
    d = r.json()["days"][0]
    assert d["total"] == 150 and d["distractive"] == 130 and d["night"] == 130
    assert d["longSessions"] == 2 and d["opens"] == 3
    assert d["classification"]["label"] == "Patrón de riesgo"
    assert d["classification"]["method"] == "random_forest"
    assert abs(sum(d["classification"]["probabilities"].values()) - 1) < 0.01


def test_productive_pattern():
    day = "2026-11-03"
    s = [sess(day, "Notion", "productiva", 9, 60, "Productividad"), sess(day, "Gmail", "productiva", 14, 40, "Comunicación"), sess(day, "YouTube", "recreativa", 20, 20, "Entretenimiento")]
    d = client.post("/v1/sync", json=payload(s)).json()["days"][0]
    assert d["classification"]["label"] == "Uso productivo"
    assert d["productiveRatio"] == 83


def test_overrides_and_monitored():
    day = "2026-11-04"
    s = [sess(day, "YouTube", "recreativa", 10, 100, "Entretenimiento"), sess(day, "Notion", "productiva", 11, 30, "Productividad")]
    d = client.post("/v1/sync", json=payload(s, overrides={"YouTube": "productiva"})).json()["days"][0]
    assert d["productive"] == 130
    d = client.post("/v1/sync", json=payload(s, monitored=["Productividad"])).json()["days"][0]
    assert d["total"] == 30


def test_history_and_delete():
    uid = "user-hist-1"
    s = [sess("2026-11-05", "X", "distractiva", 10, 10), sess("2026-11-06", "X", "distractiva", 10, 10)]
    client.post("/v1/sync", json=payload(s, uid=uid))
    h = client.get(f"/v1/users/{uid}/history").json()
    assert [d["day"] for d in h["days"]] == ["2026-11-06", "2026-11-05"]
    r = client.delete(f"/v1/users/{uid}").json()
    assert r["deletedSessions"] == 2 and r["deletedDays"] == 2
    assert client.get(f"/v1/users/{uid}/history").json()["days"] == []


def test_validation_error():
    r = client.post("/v1/sync", json=payload([sess("2026-11-05", "X", "distractiva", 30, 10)]))
    assert r.status_code == 422
