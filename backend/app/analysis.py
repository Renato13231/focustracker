"""Cálculo de KPIs y clasificación por reglas. Espejo de src/lib/analysis.ts."""
from collections import defaultdict

from .schemas import ConfigIn, SessionIn

LABELS = ["Uso productivo", "Uso recreativo controlado", "Uso distractivo", "Patrón de riesgo"]
FEATURES = [
    "total_min",
    "productive_ratio",
    "distractive_ratio",
    "night_min",
    "opens",
    "long_sessions",
    "interruption_index",
]


def is_night(h: int, start: int, end: int) -> bool:
    return (h >= start or h < end) if start > end else (start <= h < end)


def compute_days(sessions: list[SessionIn], cfg: ConfigIn) -> list[dict]:
    by_day: dict[str, list[SessionIn]] = defaultdict(list)
    for s in sessions:
        if cfg.monitored is not None and s.group not in cfg.monitored:
            continue
        by_day[s.day].append(s)
    out = []
    g = cfg.goals
    for day in sorted(by_day):
        ss = by_day[day]
        cat = lambda s: cfg.overrides.get(s.app, s.category)  # noqa: E731
        total = sum(s.duration_min for s in ss)
        prod = sum(s.duration_min for s in ss if cat(s) == "productiva")
        rec = sum(s.duration_min for s in ss if cat(s) == "recreativa")
        dis = sum(s.duration_min for s in ss if cat(s) == "distractiva")
        night = sum(s.duration_min for s in ss if is_night(s.start_hour, cfg.night_start, cfg.night_end))
        opens = len(ss)
        long_s = sum(1 for s in ss if s.duration_min >= 45)
        prod_ratio = round(prod / total * 100) if total else 0
        per_hour = opens / (total / 60) if total else 0
        interruption = min(100, round(per_hour * 14))
        goals_ok = [
            total <= g.daily_limit_min,
            dis <= g.max_distractive_min,
            night <= g.max_night_min,
            prod_ratio >= g.min_productive_pct,
        ]
        out.append(
            {
                "day": day,
                "total": total,
                "productive": prod,
                "recreational": rec,
                "distractive": dis,
                "night": night,
                "opens": opens,
                "long_sessions": long_s,
                "productive_ratio": prod_ratio,
                "interruption_index": interruption,
                "goal_compliance": round(sum(goals_ok) / len(goals_ok) * 100),
            }
        )
    return out


def features_of(k: dict) -> dict:
    total = k["total"] or 0
    return {
        "total_min": total,
        "productive_ratio": (k["productive"] / total) if total else 0.0,
        "distractive_ratio": (k["distractive"] / total) if total else 0.0,
        "night_min": k["night"],
        "opens": k["opens"],
        "long_sessions": k["long_sessions"],
        "interruption_index": k["interruption_index"],
    }


def rule_classify(f: dict, night_threshold: int = 40) -> tuple[str, list[str], int]:
    """Etapa 1 de la tesis: reglas por umbrales, interpretables (RNF9)."""
    reasons: list[str] = []
    risk = 0
    if f["night_min"] >= night_threshold:
        risk += 2
        reasons.append(f"{int(f['night_min'])} min de uso nocturno")
    if f["long_sessions"] >= 2:
        risk += 2
        reasons.append(f"{int(f['long_sessions'])} sesiones prolongadas (≥ 45 min)")
    if f["distractive_ratio"] >= 0.45:
        risk += 2
        reasons.append(f"{round(f['distractive_ratio'] * 100)}% del tiempo en apps distractivas")
    if f["interruption_index"] >= 70:
        risk += 1
        reasons.append(f"índice de interrupción alto ({int(f['interruption_index'])}/100)")
    if risk >= 4:
        label = "Patrón de riesgo"
    elif f["distractive_ratio"] >= 0.3 or risk >= 2:
        label = "Uso distractivo"
    elif f["productive_ratio"] >= 0.4:
        label = "Uso productivo"
    else:
        label = "Uso recreativo controlado"
    if not reasons:
        reasons.append("Sin señales de riesgo en los indicadores del día")
    return label, reasons, risk
