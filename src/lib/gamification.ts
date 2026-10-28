import type { Badge } from './types';

export interface Rank {
  level: number;
  name: string;
  jp: string;
  color: string;
}

export const RANKS: Rank[] = [
  { level: 1, name: 'Shoshinsha', jp: '初心者', color: '#94A3B8' },
  { level: 5, name: 'Kohai', jp: '後輩', color: '#38BDF8' },
  { level: 10, name: 'Otaku', jp: 'オタク', color: '#34D399' },
  { level: 20, name: 'Senpai', jp: '先輩', color: '#818CF8' },
  { level: 35, name: 'Sensei', jp: '先生', color: '#A78BFA' },
  { level: 50, name: 'Shishou', jp: '師匠', color: '#F472B6' },
  { level: 75, name: 'Densetsu', jp: '伝説', color: '#F59E0B' },
];

export function rankFor(level: number): Rank {
  let r = RANKS[0];
  for (const rank of RANKS) if (level >= rank.level) r = rank;
  return r;
}

export function nextRank(level: number): Rank | null {
  return RANKS.find((r) => r.level > level) ?? null;
}

/** XP needed to finish the given level. Lv.14 → 4,000 XP. */
export function xpForLevel(level: number): number {
  return 200 * level + 1200;
}

export const XP_REWARDS = {
  post: 15,
  comment: 3,
  hub: 25,
  rating: 2,
  poll: 2,
} as const;

export const BADGES: Record<string, Badge> = {
  beta: { id: 'beta', name: 'Beta Otaku', description: "Otaku'ning yopiq beta-testida qatnashgan", icon: 'FlaskConical', tone: 'indigo' },
  debater: { id: 'debater', name: 'Muhokamachi', description: '500+ izoh yozgan', icon: 'MessagesSquare', tone: 'sky' },
  critic: { id: 'critic', name: 'Tanqidchi', description: '10 ta batafsil sharh nashr qilgan', icon: 'PenTool', tone: 'amber' },
  streak: { id: 'streak', name: 'Olovli Streak', description: '14 kun ketma-ket faol', icon: 'Flame', tone: 'orange' },
  ongoing: { id: 'ongoing', name: 'Ongoing Qahramoni', description: "Har hafta EDT muhokamalarida birinchilardan", icon: 'Radio', tone: 'rose' },
  theorist: { id: 'theorist', name: 'Nazariyachi', description: "Nazariyasi 1,000+ karma to'plagan", icon: 'Lightbulb', tone: 'violet' },
  founder: { id: 'founder', name: 'Hub Asoschisi', description: "O'z Hub'ingizni oching", icon: 'Castle', tone: 'emerald' },
  legend: { id: 'legend', name: 'Densetsu', description: 'Lv.75 ga yeting', icon: 'Crown', tone: 'amber' },
  curator: { id: 'curator', name: 'Kurator', description: "To'plamingiz 500+ marta saqlansin", icon: 'Library', tone: 'sky' },
};

export const BADGE_ORDER = ['beta', 'debater', 'critic', 'streak', 'ongoing', 'theorist', 'founder', 'curator', 'legend'];
