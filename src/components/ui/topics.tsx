import { BookOpen, Drama, Factory, Lightbulb, Palette, Sparkles, type LucideIcon } from 'lucide-react';
import type { Topic } from '@/lib/types';

export const TOPICS: { id: Topic; label: string; icon: LucideIcon }[] = [
  { id: 'anime', label: 'Anime', icon: Sparkles },
  { id: 'manga', label: 'Manga & Manhwa', icon: BookOpen },
  { id: 'theory', label: 'Nazariya & Tahlil', icon: Lightbulb },
  { id: 'fanart', label: 'Fan-art & Cosplay', icon: Palette },
  { id: 'memes', label: 'Memlar', icon: Drama },
  { id: 'industry', label: 'Sanoat', icon: Factory },
];

export const TOPIC_BY_ID = Object.fromEntries(TOPICS.map((t) => [t.id, t])) as Record<Topic, (typeof TOPICS)[number]>;
