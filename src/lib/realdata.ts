import { Platform } from 'react-native';
import { RawInterval, hasPermission, isAvailable, openSettings, queryIntervals } from '../../modules/usage-stats';
import { Category, Group, Session, isoDay } from './data';

export { hasPermission, isAvailable, openSettings };
export const realDataSupported = () => Platform.OS === 'android' && isAvailable();

// Paquetes conocidos -> (grupo, categoría). Lo demás se resuelve por la categoría del sistema Android.
const KNOWN: Record<string, [Group, Category]> = {
  'com.instagram.android': ['Redes sociales', 'distractiva'],
  'com.zhiliaoapp.musically': ['Redes sociales', 'distractiva'],
  'com.twitter.android': ['Redes sociales', 'distractiva'],
  'com.facebook.katana': ['Redes sociales', 'distractiva'],
  'com.reddit.frontpage': ['Redes sociales', 'distractiva'],
  'com.google.android.youtube': ['Entretenimiento', 'recreativa'],
  'com.spotify.music': ['Entretenimiento', 'recreativa'],
  'com.netflix.mediaclient': ['Entretenimiento', 'recreativa'],
  'com.whatsapp': ['Comunicación', 'recreativa'],
  'org.telegram.messenger': ['Comunicación', 'recreativa'],
  'com.google.android.gm': ['Comunicación', 'productiva'],
  'com.google.android.apps.docs.editors.docs': ['Productividad', 'productiva'],
  'com.notion.id': ['Productividad', 'productiva'],
  'com.google.android.apps.classroom': ['Productividad', 'productiva'],
  'com.microsoft.teams': ['Productividad', 'productiva'],
  'com.mercadolibre': ['Compras', 'recreativa'],
};

// ApplicationInfo.CATEGORY_*: GAME 0, AUDIO 1, VIDEO 2, IMAGE 3, SOCIAL 4, NEWS 5, MAPS 6, PRODUCTIVITY 7
const BY_SYSTEM: Record<number, [Group, Category]> = {
  0: ['Juegos', 'distractiva'],
  1: ['Entretenimiento', 'recreativa'],
  2: ['Entretenimiento', 'recreativa'],
  4: ['Redes sociales', 'distractiva'],
  7: ['Productividad', 'productiva'],
};

function classifyApp(r: RawInterval): [Group, Category] | null {
  return KNOWN[r.package] ?? BY_SYSTEM[r.category] ?? null; // apps sin categoría conocida no se monitorean
}

export function toSessions(raw: RawInterval[]): Session[] {
  const out: Session[] = [];
  for (const r of raw) {
    const c = classifyApp(r);
    if (!c) continue;
    const start = new Date(r.startMs);
    const dur = Math.max(1, Math.round((r.endMs - r.startMs) / 60000));
    out.push({ day: isoDay(start), app: r.label, group: c[0], category: c[1], startHour: start.getHours(), durationMin: dur });
  }
  return out;
}

export async function loadRealSessions(days = 14): Promise<Session[]> {
  const end = Date.now();
  const startD = new Date();
  startD.setHours(0, 0, 0, 0);
  startD.setDate(startD.getDate() - (days - 1));
  return toSessions(await queryIntervals(startD.getTime(), end));
}
