from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class SessionIn(CamelModel):
    day: str  # YYYY-MM-DD
    app: str
    group: str
    category: str  # productiva | recreativa | distractiva
    start_hour: int = Field(ge=0, le=23)
    duration_min: int = Field(ge=0, le=1440)


class GoalsIn(CamelModel):
    daily_limit_min: int = 300
    max_distractive_min: int = 120
    max_night_min: int = 30
    min_productive_pct: int = 35


class ConfigIn(CamelModel):
    goals: GoalsIn = GoalsIn()
    night_start: int = 22
    night_end: int = 7
    monitored: list[str] | None = None  # None = todas las categorías
    overrides: dict[str, str] = {}


class SyncIn(CamelModel):
    user_id: str = Field(min_length=3, max_length=64)
    consent: bool
    config: ConfigIn = ConfigIn()
    sessions: list[SessionIn] = Field(max_length=20000)


class Classification(CamelModel):
    label: str
    reasons: list[str]
    method: str  # "random_forest" | "rules"
    probabilities: dict[str, float] = {}


class DayOut(CamelModel):
    day: str
    total: int
    productive: int
    recreational: int
    distractive: int
    night: int
    opens: int
    long_sessions: int
    productive_ratio: int
    interruption_index: int
    goal_compliance: int
    classification: Classification


class SyncOut(CamelModel):
    user_id: str
    stored_sessions: int
    days: list[DayOut]
