import { useMemo } from 'react';
import { ANIME_BY_ID } from './catalog';
import { EDT_ANIME, generateArchiveComments } from './seed';
import { ME, useStore } from './store';
import type { Comment, Filters, Hub, Post, PostKind, SortMode, Topic, TopPeriod, User } from './types';
import { DAY, HOUR } from './utils';

export function postScore(p: Post, votes: Record<string, 1 | -1>): number {
  return p.score + (votes[`p:${p.id}`] ?? 0);
}

export function commentScore(c: Comment, votes: Record<string, 1 | -1>): number {
  return c.score + (votes[`c:${c.id}`] ?? 0);
}

export function commentCount(p: Post, comments: Comment[]): number {
  let n = p.commentBase;
  for (const c of comments) if (c.postId === p.id) n++;
  return n;
}

export interface Gate {
  reason: 'progress' | 'spoiler' | 'nsfw';
  label: string;
  episode?: number;
  watched?: number;
}

/**
 * Smart Spoiler Gate.
 * 1. Progress-aware: posts about an episode beyond the user's AniBla watch progress are gated.
 * 2. Manual spoilers are lifted automatically once the user has watched the referenced episode.
 * 3. NSFW posts are gated unless the 18+ filter is enabled.
 */
export function gateFor(post: Post, watch: Record<string, number>, revealed: string[], showNsfw: boolean): Gate | null {
  if (revealed.includes(post.id)) return null;
  const anime = post.animeId ? ANIME_BY_ID[post.animeId] : undefined;
  const watched = post.animeId !== undefined ? watch[post.animeId] : undefined;
  if (post.episode !== undefined && anime && watched !== undefined && watched < post.episode) {
    return { reason: 'progress', label: `${anime.title} — ${post.episode}-qism`, episode: post.episode, watched };
  }
  if (post.spoiler) {
    const caughtUp = post.episode !== undefined && watched !== undefined && watched >= post.episode;
    if (!caughtUp) {
      return {
        reason: 'spoiler',
        label: anime ? `${anime.title}${post.episode ? ` — ${post.episode}-qism` : ''}` : 'Belgilangan spoyler',
        episode: post.episode,
        watched,
      };
    }
  }
  if (post.nsfw && !showNsfw) return { reason: 'nsfw', label: '18+ kontent' };
  return null;
}

export function useGate(post: Post): Gate | null {
  const watch = useStore((s) => s.watch);
  const revealed = useStore((s) => s.revealed);
  const showNsfw = useStore((s) => s.filters.showNsfw);
  return useMemo(() => gateFor(post, watch, revealed, showNsfw), [post, watch, revealed, showNsfw]);
}

export function hotRank(score: number, createdAt: number, now: number): number {
  const hours = Math.max(0, (now - createdAt) / HOUR);
  return (score + 8) / Math.pow(hours + 2, 1.45);
}

const PERIOD_MS: Record<TopPeriod, number> = { day: DAY, week: 7 * DAY, month: 30 * DAY, year: 365 * DAY };

/** Only the newest EDT per anime is shown outside its Hub's Episodes tab. */
export function latestEdtIds(posts: Post[]): Set<string> {
  const best: Record<string, Post> = {};
  for (const p of posts) {
    if (p.kind !== 'edt' || !p.animeId || p.status !== 'public') continue;
    if (!best[p.animeId] || (p.edt?.episode ?? 0) > (best[p.animeId].edt?.episode ?? 0)) best[p.animeId] = p;
  }
  return new Set(Object.values(best).map((p) => p.id));
}

export interface FeedOptions {
  kind?: PostKind | 'all';
  topic?: Topic;
  hubId?: string;
  authorId?: string;
  sort: SortMode;
  period?: TopPeriod;
  applyFilters?: boolean;
  includeAllEdts?: boolean;
  pinnedFirst?: boolean;
}

export function selectFeed(
  posts: Post[],
  opts: FeedOptions,
  ctx: {
    votes: Record<string, 1 | -1>;
    subscriptions: string[];
    following: string[];
    filters: Filters;
    watch: Record<string, number>;
    revealed: string[];
    now: number;
  },
): Post[] {
  const latest = latestEdtIds(posts);
  const { filters } = ctx;
  let list = posts.filter((p) => {
    if (p.status !== 'public' || p.removed) return false;
    if (p.kind === 'edt' && !opts.includeAllEdts && !latest.has(p.id)) return false;
    if (opts.kind && opts.kind !== 'all' && p.kind !== opts.kind) return false;
    if (opts.topic && p.topic !== opts.topic) return false;
    if (opts.hubId && p.hubId !== opts.hubId) return false;
    if (opts.authorId && p.authorId !== opts.authorId) return false;
    if (opts.sort === 'following' && !(p.hubId && ctx.subscriptions.includes(p.hubId)) && !ctx.following.includes(p.authorId) && p.authorId !== ME)
      return false;
    if (opts.applyFilters) {
      if (filters.topics.length && !filters.topics.includes(p.topic)) return false;
      if (filters.kinds.length && !filters.kinds.includes(p.kind)) return false;
      if (filters.genres.length) {
        const g = p.animeId ? ANIME_BY_ID[p.animeId]?.genres ?? [] : [];
        if (!filters.genres.some((x) => g.includes(x))) return false;
      }
      if (filters.hideSpoilers) {
        const gate = gateFor(p, ctx.watch, [], true);
        if (gate) return false;
      }
    }
    if (opts.sort === 'top' && opts.period && ctx.now - p.createdAt > PERIOD_MS[opts.period]) return false;
    return true;
  });

  const score = (p: Post) => postScore(p, ctx.votes);
  if (opts.sort === 'new') list = [...list].sort((a, b) => b.createdAt - a.createdAt);
  else if (opts.sort === 'top') list = [...list].sort((a, b) => score(b) - score(a));
  else list = [...list].sort((a, b) => hotRank(score(b), b.createdAt, ctx.now) - hotRank(score(a), a.createdAt, ctx.now));

  if (opts.pinnedFirst) list = [...list.filter((p) => p.pinned), ...list.filter((p) => !p.pinned)];
  return list;
}

export function useFeed(opts: FeedOptions): Post[] {
  const posts = useStore((s) => s.posts);
  const votes = useStore((s) => s.votes);
  const subscriptions = useStore((s) => s.subscriptions);
  const following = useStore((s) => s.following);
  const filters = useStore((s) => s.filters);
  const watch = useStore((s) => s.watch);
  const revealed = useStore((s) => s.revealed);
  const key = JSON.stringify(opts);
  return useMemo(
    () => selectFeed(posts, opts, { votes, subscriptions, following, filters, watch, revealed, now: Date.now() }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posts, votes, subscriptions, following, filters, watch, revealed, key],
  );
}

export type TrendSlot = { post: Post; badge: string };

/**
 * 24-hour trending: one strongest post per format so the bento reads like a
 * newsroom front page. Six slots are returned; the grid reveals 4 → 5 → 6 of
 * them as the screen widens (xl → 2xl → 3xl), so no row ever has a hole.
 */
export function useTrending(): TrendSlot[] {
  const posts = useStore((s) => s.posts);
  const votes = useStore((s) => s.votes);
  return useMemo(() => {
    const now = Date.now();
    const fresh = posts.filter((p) => p.status === 'public' && !p.removed && !p.nsfw);
    const within = (h: number) => fresh.filter((p) => now - p.createdAt <= h * HOUR);
    const rank = (list: Post[]) =>
      [...list].sort((a, b) => hotRank(postScore(b, votes), b.createdAt, now) - hotRank(postScore(a, votes), a.createdAt, now));
    const pick = (pred: (p: Post) => boolean, used: Set<string>) =>
      rank(within(24).filter(pred)).find((p) => !used.has(p.id)) ??
      rank(within(96).filter(pred)).find((p) => !used.has(p.id)) ??
      rank(fresh.filter(pred)).find((p) => !used.has(p.id));

    const used = new Set<string>();
    const slots: TrendSlot[] = [];
    const add = (p: Post | undefined, badge: (p: Post) => string) => {
      if (!p) return;
      used.add(p.id);
      slots.push({ post: p, badge: badge(p) });
    };
    add(pick((p) => ['post', 'news', 'poll'].includes(p.kind), used), () => 'TREND #1');
    add(pick((p) => p.kind === 'edt', used), (p) => `${p.edt?.episode}-QISM EDT`);
    add(pick((p) => p.kind === 'review', used), (p) => `SHARH ${p.review?.overall.toFixed(1)}`);
    add(pick((p) => p.kind === 'collection', used), () => "TOP TO'PLAM");
    add(pick((p) => p.kind === 'poll', used), () => "SO'ROVNOMA");
    add(pick((p) => p.topic === 'memes' || p.topic === 'fanart', used), (p) => (p.topic === 'memes' ? 'MEM #1' : 'FAN-ART'));
    return slots;
  }, [posts, votes]);
}

export function useUser(id: string | undefined): User | undefined {
  return useStore((s) => (id ? s.users.find((u) => u.id === id) : undefined));
}

export function useHub(id: string | null | undefined): Hub | undefined {
  return useStore((s) => (id ? s.hubs.find((h) => h.id === id) : undefined));
}

/** Seeded + user comments + deterministically "loaded" archive comments. */
export function usePostComments(post: Post | undefined): { comments: Comment[]; archiveRemaining: number } {
  const all = useStore((s) => s.comments);
  const loaded = useStore((s) => (post ? s.archiveLoaded[post.id] ?? 0 : 0));
  const users = useStore((s) => s.users);
  return useMemo(() => {
    if (!post) return { comments: [], archiveRemaining: 0 };
    const own = all.filter((c) => c.postId === post.id);
    const take = Math.min(loaded, post.commentBase);
    const pool = users.filter((u) => !u.bot && u.id !== ME && u.karma > 0).map((u) => u.id);
    const archive = take > 0 ? generateArchiveComments(post, take, pool, Date.now()) : [];
    return { comments: [...own, ...archive], archiveRemaining: post.commentBase - take };
  }, [post, all, loaded, users]);
}

export interface LiveEpisode {
  post: Post;
  animeId: string;
  episode: number;
}

export function useLiveEpisodes(): LiveEpisode[] {
  const posts = useStore((s) => s.posts);
  return useMemo(() => {
    const latest = latestEdtIds(posts);
    return posts
      .filter((p) => latest.has(p.id) && p.animeId && EDT_ANIME.includes(p.animeId))
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((p) => ({ post: p, animeId: p.animeId!, episode: p.edt!.episode }));
  }, [posts]);
}
