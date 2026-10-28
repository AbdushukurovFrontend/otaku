import { useSyncExternalStore } from 'react';
import type { Topic } from './types';

export type FeedKind = 'all' | 'news' | 'collection' | 'review';
export type HubTab = 'posts' | 'episodes' | 'reviews' | 'about';
export type ProfileTab = 'posts' | 'reviews' | 'bookmarks' | 'drafts' | 'about';
export type HubsTab = 'all' | 'anime' | 'topic' | 'mine';

export type Route =
  | { name: 'feed'; kind: FeedKind; topic?: Topic }
  | { name: 'hubs'; tab: HubsTab }
  | { name: 'hub'; id: string; tab: HubTab }
  | { name: 'post'; id: string }
  | { name: 'profile'; handle: string | null; tab: ProfileTab }
  | { name: 'mod' };

const TOPICS: Topic[] = ['anime', 'manga', 'theory', 'fanart', 'memes', 'industry'];

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/\/+$/, '') || '/';
  const parts = path.split('/').filter(Boolean);
  const [a, b, c] = parts;
  switch (a) {
    case undefined:
      return { name: 'feed', kind: 'all' };
    case 'news':
      return { name: 'feed', kind: 'news' };
    case 'collections':
      return { name: 'feed', kind: 'collection' };
    case 'reviews':
      return { name: 'feed', kind: 'review' };
    case 'topic':
      return { name: 'feed', kind: 'all', topic: TOPICS.includes(b as Topic) ? (b as Topic) : undefined };
    case 'hubs':
      return { name: 'hubs', tab: (['all', 'anime', 'topic', 'mine'].includes(b) ? b : 'all') as HubsTab };
    case 'h':
      return { name: 'hub', id: b ?? '', tab: (['posts', 'episodes', 'reviews', 'about'].includes(c) ? c : 'posts') as HubTab };
    case 'p':
      return { name: 'post', id: b ?? '' };
    case 'me':
      return { name: 'profile', handle: null, tab: asProfileTab(b) };
    case 'u':
      return { name: 'profile', handle: b ?? null, tab: asProfileTab(c) };
    case 'mod':
      return { name: 'mod' };
    default:
      return { name: 'feed', kind: 'all' };
  }
}

function asProfileTab(t: string | undefined): ProfileTab {
  return (['posts', 'reviews', 'bookmarks', 'drafts', 'about'].includes(t ?? '') ? t : 'posts') as ProfileTab;
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useHash(): string {
  return useSyncExternalStore(subscribe, () => window.location.hash, () => '');
}

export function useRoute(): Route {
  const hash = useHash();
  return parseHash(hash);
}

export function navigate(to: string) {
  const target = to.startsWith('#') ? to : `#${to}`;
  if (window.location.hash === target) window.scrollTo({ top: 0, behavior: 'smooth' });
  else window.location.hash = target;
}

export const href = (to: string) => `#${to}`;
