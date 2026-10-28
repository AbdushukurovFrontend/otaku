export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export function timeAgo(ts: number, now: number = Date.now()): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 45) return 'hozirgina';
  const m = Math.floor(s / 60);
  if (m < 60) return `${Math.max(1, m)} daqiqa oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} kun oldin`;
  const w = Math.floor(d / 7);
  if (d < 30) return `${w} hafta oldin`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} oy oldin`;
  return `${Math.floor(d / 365)} yil oldin`;
}

export function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export function compact(n: number): string {
  if (Math.abs(n) < 1000) return String(n);
  if (Math.abs(n) < 10_000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  if (Math.abs(n) < 1_000_000) return Math.round(n / 1000) + 'K';
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
}

const UZ_MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
];

export function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-yil ${d.getDate()}-${UZ_MONTHS[d.getMonth()]}`;
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small deterministic PRNG so generated content is stable across reloads. */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function paletteFromSeed(seed: string): [string, string, string] {
  const h = hashString(seed) % 360;
  return [
    `hsl(${h} 85% 62%)`,
    `hsl(${(h + 48) % 360} 80% 58%)`,
    `hsl(${(h + 220) % 360} 60% 14%)`,
  ];
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function slugify(s: string): string {
  const map: Record<string, string> = { "o'": 'o', "g'": 'g', 'sh': 'sh', 'ch': 'ch' };
  let out = s.toLowerCase();
  for (const k of Object.keys(map)) out = out.split(k).join(map[k]);
  return out
    .replace(/[ʻʼ'`’]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
