import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Config, DayKpis, Goals, alerts as mkAlerts, classify, computeDays, defaultGoals, recommendations } from './analysis';
import { DEFAULT_API, RemoteClass, deleteRemote, syncRemote } from './api';
import { loadRealSessions, realDataSupported } from './realdata';
import { Category, GROUPS, Group, Session, simulate } from './data';

export interface PersistedState {
  onboarded: boolean;
  consent: boolean;
  name: string;
  email: string;
  goals: Goals;
  nightStart: number;
  nightEnd: number;
  monitored: Group[];
  overrides: Record<string, Category>;
  seed: number;
  userId: string;
  apiUrl: string;
  useRealData: boolean;
}

const newId = () => 'u-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const initial: PersistedState = {
  onboarded: false,
  consent: false,
  name: '',
  email: '',
  goals: defaultGoals,
  nightStart: 22,
  nightEnd: 7,
  monitored: GROUPS,
  overrides: {},
  seed: 20260,
  userId: newId(),
  apiUrl: DEFAULT_API,
  useRealData: false,
};

const KEY = 'focustracker:v1';

interface Ctx {
  ready: boolean;
  state: PersistedState;
  update: (patch: Partial<PersistedState>) => void;
  resetAll: () => void;
  regenerate: () => void;
  refreshReal: () => Promise<void>;
  realStatus: 'off' | 'loading' | 'ok' | 'empty' | 'error';
  config: Config;
  sessions: Session[];
  days: DayKpis[];
  today: DayKpis | null;
  last7: DayKpis[];
  classification: (ReturnType<typeof classify> & { method: 'random_forest' | 'rules' }) | null;
  classOf: (k: DayKpis) => ReturnType<typeof classify> & { method: 'random_forest' | 'rules' };
  syncStatus: 'off' | 'syncing' | 'ok' | 'error';
  tips: ReturnType<typeof recommendations>;
  alertList: ReturnType<typeof mkAlerts>;
}

const StoreCtx = createContext<Ctx>(null as unknown as Ctx);
export const useStore = () => useContext(StoreCtx);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) setState({ ...initial, ...JSON.parse(raw) });
      } catch {}
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const update = useCallback((patch: Partial<PersistedState>) => setState((s) => ({ ...s, ...patch })), []);
  const resetAll = useCallback(() => {
    // Revocación de consentimiento: también se borran los datos en el servidor.
    if (state.apiUrl) deleteRemote(state.apiUrl, state.userId).catch(() => {});
    setState({ ...initial, userId: newId(), apiUrl: state.apiUrl, seed: Math.floor(Math.random() * 1e6) });
  }, [state.apiUrl, state.userId]);
  const regenerate = useCallback(() => setState((s) => ({ ...s, seed: Math.floor(Math.random() * 1e6) })), []);

  const config: Config = useMemo(
    () => ({ goals: state.goals, nightStart: state.nightStart, nightEnd: state.nightEnd, monitored: state.monitored, overrides: state.overrides }),
    [state.goals, state.nightStart, state.nightEnd, state.monitored, state.overrides],
  );

  // RF2: sin consentimiento no se registra ni procesa ningún dato.
  const [real, setReal] = useState<Session[]>([]);
  const [realStatus, setRealStatus] = useState<'off' | 'loading' | 'ok' | 'empty' | 'error'>('off');
  const refreshReal = useCallback(async () => {
    if (!realDataSupported()) { setRealStatus('error'); return; }
    setRealStatus('loading');
    try {
      const r = await loadRealSessions(14);
      setReal(r);
      setRealStatus(r.length ? 'ok' : 'empty');
    } catch {
      setRealStatus('error');
    }
  }, []);
  useEffect(() => {
    if (state.consent && state.useRealData) refreshReal();
    else setRealStatus('off');
  }, [state.consent, state.useRealData, refreshReal]);

  const sessions = useMemo(() => {
    if (!state.consent) return [];
    return state.useRealData && realStatus !== 'off' ? real : simulate(state.seed);
  }, [state.consent, state.seed, state.useRealData, real, realStatus]);
  const days = useMemo(() => computeDays(sessions, config), [sessions, config]);
  const today = days.length ? days[days.length - 1] : null;
  const last7 = useMemo(() => days.slice(-7), [days]);
  const [remote, setRemote] = useState<Record<string, RemoteClass>>({});
  const [syncStatus, setSyncStatus] = useState<'off' | 'syncing' | 'ok' | 'error'>('off');

  useEffect(() => {
    if (!state.apiUrl || !state.consent || !sessions.length) {
      setRemote({});
      setSyncStatus('off');
      return;
    }
    let cancelled = false;
    setSyncStatus('syncing');
    const t = setTimeout(() => {
      syncRemote(state.apiUrl, state.userId, config, sessions)
        .then((r) => { if (!cancelled) { setRemote(r); setSyncStatus('ok'); } })
        .catch(() => { if (!cancelled) { setRemote({}); setSyncStatus('error'); } });
    }, 600);
    return () => { cancelled = true; clearTimeout(t); };
  }, [state.apiUrl, state.userId, state.consent, sessions, config]);

  const classOf = useCallback(
    (k: DayKpis) => {
      const local = classify(k, config);
      const r = remote[k.day];
      if (!r) return { ...local, method: 'rules' as const };
      return { label: r.label, reasons: local.reasons, riskScore: local.riskScore, method: r.method };
    },
    [config, remote],
  );
  const classification = useMemo(() => (today ? classOf(today) : null), [today, classOf]);
  const tips = useMemo(() => (today ? recommendations(today, last7, config) : []), [today, last7, config]);
  const alertList = useMemo(() => (today ? mkAlerts(today, last7, config) : []), [today, last7, config]);

  const value = { ready, state, update, resetAll, regenerate, refreshReal, realStatus, config, sessions, days, today, last7, classification, classOf, syncStatus, tips, alertList };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
