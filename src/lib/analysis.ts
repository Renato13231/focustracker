import { APPS, Category, Group, Session } from './data';

export interface Goals {
  dailyLimitMin: number;
  maxDistractiveMin: number;
  maxNightMin: number;
  minProductivePct: number;
}

export interface Config {
  goals: Goals;
  nightStart: number;
  nightEnd: number;
  monitored: Group[];
  overrides: Record<string, Category>;
}

export const isNight = (h: number, s: number, e: number) => (s > e ? h >= s || h < e : h >= s && h < e);

export interface GoalResult {
  key: keyof Goals;
  label: string;
  ok: boolean;
  value: number;
  target: number;
  unit: 'min' | '%';
  direction: 'max' | 'min';
}

export interface DayKpis {
  day: string;
  total: number;
  productive: number;
  recreational: number;
  distractive: number;
  night: number;
  opens: number;
  longSessions: number;
  productiveRatio: number; // 0-100
  interruptionIndex: number; // 0-100
  goalCompliance: number; // 0-100
  goals: GoalResult[];
}

export function applyConfig(sessions: Session[], cfg: Config): Session[] {
  return sessions
    .filter((s) => cfg.monitored.includes(s.group))
    .map((s) => (cfg.overrides[s.app] ? { ...s, category: cfg.overrides[s.app] } : s));
}

export function computeDays(sessions: Session[], cfg: Config): DayKpis[] {
  const byDay = new Map<string, Session[]>();
  sessions.forEach((s) => byDay.set(s.day, [...(byDay.get(s.day) ?? []), s]));
  const days = Array.from(byDay.keys()).sort();
  return days.map((day) => {
    const ss = applyConfig(byDay.get(day)!, cfg);
    const sum = (f: (s: Session) => boolean) => ss.filter(f).reduce((a, s) => a + s.durationMin, 0);
    const total = sum(() => true);
    const productive = sum((s) => s.category === 'productiva');
    const recreational = sum((s) => s.category === 'recreativa');
    const distractive = sum((s) => s.category === 'distractiva');
    const night = sum((s) => isNight(s.startHour, cfg.nightStart, cfg.nightEnd));
    const opens = ss.length;
    const longSessions = ss.filter((s) => s.durationMin >= 45).length;
    const productiveRatio = total ? Math.round((productive / total) * 100) : 0;
    const opensPerHour = total ? opens / (total / 60) : 0;
    const interruptionIndex = Math.min(100, Math.round(opensPerHour * 14));
    const g = cfg.goals;
    const goals: GoalResult[] = [
      { key: 'dailyLimitMin', label: 'Tiempo total diario', ok: total <= g.dailyLimitMin, value: total, target: g.dailyLimitMin, unit: 'min', direction: 'max' },
      { key: 'maxDistractiveMin', label: 'Tiempo distractivo', ok: distractive <= g.maxDistractiveMin, value: distractive, target: g.maxDistractiveMin, unit: 'min', direction: 'max' },
      { key: 'maxNightMin', label: 'Uso nocturno', ok: night <= g.maxNightMin, value: night, target: g.maxNightMin, unit: 'min', direction: 'max' },
      { key: 'minProductivePct', label: 'Uso productivo', ok: productiveRatio >= g.minProductivePct, value: productiveRatio, target: g.minProductivePct, unit: '%', direction: 'min' },
    ];
    const goalCompliance = Math.round((goals.filter((x) => x.ok).length / goals.length) * 100);
    return { day, total, productive, recreational, distractive, night, opens, longSessions, productiveRatio, interruptionIndex, goalCompliance, goals };
  });
}

// ---------- Clasificación de patrones (RF5) ----------
// Etapa 1 de la tesis: reglas por umbrales, interpretables (RNF9).
// Etapa 2 (trabajo futuro): Árbol de Decisión / Random Forest supervisado.
export type Pattern = 'Uso productivo' | 'Uso recreativo controlado' | 'Uso distractivo' | 'Patrón de riesgo';

export interface Classification {
  label: Pattern;
  reasons: string[];
  riskScore: number;
}

export function classify(k: DayKpis, cfg: Config): Classification {
  const reasons: string[] = [];
  let risk = 0;
  const dRatio = k.total ? k.distractive / k.total : 0;
  if (k.night >= Math.max(cfg.goals.maxNightMin, 40)) {
    risk += 2;
    reasons.push(`${k.night} min de uso nocturno (${cfg.nightStart}:00–${String(cfg.nightEnd).padStart(2, '0')}:00)`);
  }
  if (k.longSessions >= 2) {
    risk += 2;
    reasons.push(`${k.longSessions} sesiones prolongadas (≥ 45 min)`);
  }
  if (dRatio >= 0.45) {
    risk += 2;
    reasons.push(`${Math.round(dRatio * 100)}% del tiempo en apps distractivas`);
  }
  if (k.interruptionIndex >= 70) {
    risk += 1;
    reasons.push(`índice de interrupción alto (${k.interruptionIndex}/100)`);
  }
  let label: Pattern;
  if (risk >= 4) label = 'Patrón de riesgo';
  else if (dRatio >= 0.3 || risk >= 2) label = 'Uso distractivo';
  else if (k.productiveRatio >= 40) label = 'Uso productivo';
  else label = 'Uso recreativo controlado';

  if (reasons.length === 0) {
    reasons.push(
      label === 'Uso productivo'
        ? `${k.productiveRatio}% del tiempo en apps productivas y sin señales de riesgo`
        : 'Tiempo distractivo y uso nocturno dentro de rangos normales',
    );
  }
  return { label, reasons, riskScore: risk };
}

export const patternStyle: Record<Pattern, { color: string; soft: string; icon: string }> = {
  'Uso productivo': { color: '#16A34A', soft: '#DCFCE7', icon: 'checkmark-circle-outline' },
  'Uso recreativo controlado': { color: '#2563EB', soft: '#DBEAFE', icon: 'happy-outline' },
  'Uso distractivo': { color: '#D97706', soft: '#FEF3C7', icon: 'alert-circle-outline' },
  'Patrón de riesgo': { color: '#DC2626', soft: '#FEE2E2', icon: 'warning-outline' },
};

// ---------- Recomendaciones (RF7) y alertas (RF8) ----------
export interface Tip {
  id: string;
  icon: string;
  tone: 'purple' | 'orange' | 'green' | 'blue' | 'amber';
  title: string;
  text: string;
}

export function recommendations(today: DayKpis, recent: DayKpis[], cfg: Config): Tip[] {
  const tips: Tip[] = [];
  const g = cfg.goals;
  if (today.night > g.maxNightMin) {
    tips.push({ id: 'night', icon: 'moon-outline', tone: 'purple', title: 'Reduce tu uso nocturno', text: `Hoy usaste el móvil ${today.night} min en tu horario de descanso. Intenta desconectarte 30 min antes de dormir.` });
  }
  if (today.distractive > g.maxDistractiveMin) {
    tips.push({ id: 'scroll', icon: 'infinite-outline', tone: 'orange', title: 'Controla el scrolling infinito', text: `Pasaste ${today.distractive} min en apps distractivas (meta: ${g.maxDistractiveMin} min). Considera usar temporizadores o bloques sin redes.` });
  }
  if (today.interruptionIndex >= 60) {
    tips.push({ id: 'focus', icon: 'locate-outline', tone: 'green', title: 'Aumenta tu enfoque', text: `Tu índice de interrupción es ${today.interruptionIndex}/100. Agrupa revisiones del móvil en horarios fijos durante estudio o trabajo.` });
  }
  if (today.longSessions >= 2) {
    tips.push({ id: 'breaks', icon: 'cafe-outline', tone: 'amber', title: 'Haz pausas activas', text: `Tuviste ${today.longSessions} sesiones de más de 45 min. Una pausa cada 30–40 min reduce el uso compulsivo.` });
  }
  if (today.productiveRatio < g.minProductivePct) {
    tips.push({ id: 'prod', icon: 'rocket-outline', tone: 'blue', title: 'Planifica bloques productivos', text: `Tu uso productivo fue ${today.productiveRatio}% (meta: ${g.minProductivePct}%). Reserva un bloque fijo para tareas importantes.` });
  }
  const weekAvg = recent.length ? recent.reduce((a, d) => a + d.distractive, 0) / recent.length : 0;
  if (recent.length >= 7 && today.distractive < weekAvg * 0.85) {
    tips.push({ id: 'progress', icon: 'trending-down-outline', tone: 'green', title: 'Vas mejorando', text: `Tu tiempo distractivo de hoy está ${Math.round((1 - today.distractive / weekAvg) * 100)}% bajo tu promedio de 7 días. ¡Sigue así!` });
  }
  if (tips.length === 0) {
    tips.push({ id: 'ok', icon: 'sparkles-outline', tone: 'green', title: '¡Buen trabajo!', text: 'Hoy cumpliste todas tus metas. Considera subir un poco la exigencia de tus metas de forma progresiva.' });
  }
  return tips;
}

export interface Alert {
  id: string;
  severity: 'alta' | 'media';
  title: string;
  text: string;
}

export function alerts(today: DayKpis, recent: DayKpis[], cfg: Config): Alert[] {
  const out: Alert[] = [];
  if (today.night >= 60) out.push({ id: 'a-night', severity: 'alta', title: 'Uso nocturno elevado', text: `Llevas ${today.night} min de uso en tu horario de descanso.` });
  else if (today.night > cfg.goals.maxNightMin) out.push({ id: 'a-night', severity: 'media', title: 'Uso nocturno sobre tu meta', text: `${today.night} min de uso nocturno (meta: ${cfg.goals.maxNightMin} min).` });
  if (today.longSessions >= 2) out.push({ id: 'a-long', severity: 'media', title: 'Sesiones prolongadas', text: `Detectamos ${today.longSessions} sesiones de más de 45 minutos hoy.` });
  if (today.interruptionIndex >= 75) out.push({ id: 'a-int', severity: 'media', title: 'Muchas interrupciones', text: `Abriste apps ${today.opens} veces hoy (índice ${today.interruptionIndex}/100).` });
  const nightDays = recent.filter((d) => d.night > cfg.goals.maxNightMin).length;
  if (recent.length >= 7 && nightDays >= 4) out.push({ id: 'a-rec', severity: 'alta', title: 'Patrón nocturno recurrente', text: `Superaste tu meta nocturna ${nightDays} de los últimos 7 días.` });
  return out;
}

export const defaultGoals: Goals = { dailyLimitMin: 300, maxDistractiveMin: 120, maxNightMin: 30, minProductivePct: 35 };
export const groupOfApp = (name: string) => APPS.find((a) => a.name === name)?.group;
