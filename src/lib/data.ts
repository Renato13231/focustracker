// Datos simulados de uso digital (RF3). En el sistema completo estos registros
// provienen del dispositivo y se envían al backend FastAPI / MongoDB Atlas.
export type Category = 'productiva' | 'recreativa' | 'distractiva';
export type Group = 'Redes sociales' | 'Entretenimiento' | 'Productividad' | 'Comunicación' | 'Juegos' | 'Compras';

export const GROUPS: Group[] = ['Redes sociales', 'Entretenimiento', 'Productividad', 'Comunicación', 'Juegos', 'Compras'];

export interface AppInfo {
  name: string;
  group: Group;
  category: Category; // clasificación inicial definida por el sistema (RF4)
}

export const APPS: AppInfo[] = [
  { name: 'Instagram', group: 'Redes sociales', category: 'distractiva' },
  { name: 'TikTok', group: 'Redes sociales', category: 'distractiva' },
  { name: 'X', group: 'Redes sociales', category: 'distractiva' },
  { name: 'YouTube', group: 'Entretenimiento', category: 'recreativa' },
  { name: 'Spotify', group: 'Entretenimiento', category: 'recreativa' },
  { name: 'Netflix', group: 'Entretenimiento', category: 'recreativa' },
  { name: 'Notion', group: 'Productividad', category: 'productiva' },
  { name: 'Google Docs', group: 'Productividad', category: 'productiva' },
  { name: 'Aula virtual', group: 'Productividad', category: 'productiva' },
  { name: 'WhatsApp', group: 'Comunicación', category: 'recreativa' },
  { name: 'Gmail', group: 'Comunicación', category: 'productiva' },
  { name: 'Juego móvil', group: 'Juegos', category: 'distractiva' },
  { name: 'Tienda online', group: 'Compras', category: 'recreativa' },
];

export interface Session {
  day: string; // YYYY-MM-DD
  app: string;
  group: Group;
  category: Category;
  startHour: number;
  durationMin: number;
}

export const isoDay = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function simulate(seed: number, days = 28): Session[] {
  const out: Session[] = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const day = isoDay(date);
    const rnd = mulberry32(seed + (days - i) * 7919);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const mood = rnd(); // propensión a la distracción del día
    const n = 15 + Math.floor(rnd() * 12);
    for (let j = 0; j < n; j++) {
      const r = rnd();
      const pDis = 0.24 + 0.34 * mood;
      const pProd = weekend ? 0.15 : 0.3 - 0.1 * mood;
      const cat: Category = r < pDis ? 'distractiva' : r < pDis + pProd ? 'productiva' : 'recreativa';
      const pool = APPS.filter((a) => a.category === cat);
      const app = pool[Math.floor(rnd() * pool.length)];
      const nightProne = cat !== 'productiva' && rnd() < 0.05 + 0.28 * mood;
      const startHour = nightProne ? [22, 23, 0, 1][Math.floor(rnd() * 4)] : 7 + Math.floor(rnd() * 15);
      let dur: number;
      if (cat === 'productiva') dur = 5 + rnd() * 20;
      else if (cat === 'recreativa') dur = 4 + rnd() * 16;
      else dur = 1 + rnd() * 11;
      if (cat === 'distractiva' && rnd() < 0.03 + 0.1 * mood) dur = 45 + rnd() * 35;
      out.push({ day, app: app.name, group: app.group, category: cat, startHour, durationMin: Math.round(dur) });
    }
  }
  return out;
}
