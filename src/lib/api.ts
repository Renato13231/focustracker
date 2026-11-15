import { Config, Pattern } from './analysis';
import { Session } from './data';

export interface RemoteClass {
  label: Pattern;
  reasons: string[];
  method: 'random_forest' | 'rules';
  probabilities: Record<string, number>;
}

export const DEFAULT_API = process.env.EXPO_PUBLIC_API_URL ?? '';

const clean = (u: string) => u.trim().replace(/\/+$/, '');

async function req(url: string, init?: RequestInit, ms = 8000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { ...init, signal: ctl.signal, headers: { 'Content-Type': 'application/json' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  } finally {
    clearTimeout(t);
  }
}

// RF11 + RF5 etapa 2: envía registros al backend y recibe la clasificación del modelo.
export async function syncRemote(apiUrl: string, userId: string, cfg: Config, sessions: Session[]): Promise<Record<string, RemoteClass>> {
  const body = {
    userId,
    consent: true,
    config: { goals: cfg.goals, nightStart: cfg.nightStart, nightEnd: cfg.nightEnd, monitored: cfg.monitored, overrides: cfg.overrides },
    sessions,
  };
  const res = await req(`${clean(apiUrl)}/v1/sync`, { method: 'POST', body: JSON.stringify(body) }, 20000);
  const out: Record<string, RemoteClass> = {};
  for (const d of res.days) out[d.day] = d.classification;
  return out;
}

export const deleteRemote = (apiUrl: string, userId: string) => req(`${clean(apiUrl)}/v1/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
export const pingRemote = (apiUrl: string) => req(`${clean(apiUrl)}/health`);
