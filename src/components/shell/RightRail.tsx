import { Lock, MessageSquare, Pin } from 'lucide-react';
import { useMemo } from 'react';
import { ANIME_BY_ID } from '@/lib/catalog';
import { BADGES, rankFor, xpForLevel } from '@/lib/gamification';
import { navigate } from '@/lib/router';
import { commentCount, useLiveEpisodes } from '@/lib/selectors';
import { useMe, useStore } from '@/lib/store';
import { cn, compact, fmt, timeAgo } from '@/lib/utils';
import { HubAvatar, UserAvatar } from '../ui/Avatar';
import { Card, ProgressBar, btn } from '../ui/primitives';
import { SmartPoster } from '../ui/SmartPoster';

/** iOS-style summary card: identity, XP line and one divided stat strip. */
export function OtakuPassport() {
  const me = useMe();
  const rank = rankFor(me.level);
  const need = xpForLevel(me.level);
  const badges = me.badges.filter((b) => BADGES[b]).length;
  return (
    <Card className="p-4">
      <button type="button" onClick={() => navigate('/me')} className="block w-full text-left">
        <div className="flex items-center gap-3">
          <UserAvatar user={me} size={44} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-fg">{me.name}</p>
            <p className="truncate text-xs text-fg-3">@{me.handle}</p>
          </div>
          <span className="shrink-0 rounded-full border border-line-subtle bg-chip px-2.5 py-1 text-[11px] font-medium text-fg-2">
            Lv. {me.level} · {rank.name}
          </span>
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-[11px] tabular-nums text-fg-3">
            <span>
              {fmt(me.xp)} / {fmt(need)} XP
            </span>
            <span>{fmt(need - me.xp)} qoldi</span>
          </div>
          <ProgressBar value={(me.xp / need) * 100} />
        </div>
        <div className="mt-3 grid grid-cols-3 divide-x divide-line border-t border-line-subtle pt-3 text-center">
          <Stat value={fmt(me.karma)} label="Karma" />
          <Stat value={`${me.streak} kun`} label="Streak" />
          <Stat value={`${badges} ta`} label="Nishonlar" />
        </div>
      </button>
    </Card>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-1">
      <p className="text-base font-bold tabular-nums text-fg">{value}</p>
      <p className="text-[11px] text-fg-3">{label}</p>
    </div>
  );
}

export function EdtWidget() {
  const live = useLiveEpisodes();
  const comments = useStore((s) => s.comments);
  const watch = useStore((s) => s.watch);
  return (
    <Card className="p-2">
      <div className="flex items-center justify-between px-2 pb-1.5 pt-2">
        <p className="text-[13px] font-semibold text-fg">AniBla: Yangi epizodlar</p>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-fg-3">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" /> Live
        </span>
      </div>
      {live.map(({ post, animeId, episode }) => {
        const a = ANIME_BY_ID[animeId];
        const locked = watch[animeId] !== undefined && watch[animeId] < episode;
        return (
          <button
            key={post.id}
            type="button"
            onClick={() => navigate(`/p/${post.id}`)}
            className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl p-2 text-left transition-colors hover:bg-hover"
          >
            <span className="flex min-w-0 items-center gap-3">
              <SmartPoster animeId={animeId} emblem="mini" className="h-[52px] w-10 shrink-0 rounded-lg" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-fg">{a.title}</span>
                <span className="block truncate text-xs text-fg-3">
                  {a.season ? `${a.season}, ` : ''}
                  {episode}-qism · {timeAgo(post.createdAt)}
                </span>
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-chip px-2 py-1 text-xs font-medium tabular-nums text-fg-2">
              {locked ? <Lock className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
              {compact(commentCount(post, comments))}
            </span>
          </button>
        );
      })}
    </Card>
  );
}

/** Compact horizontal EDT strip for widths where the right rail is hidden. */
export function LiveStrip() {
  const live = useLiveEpisodes();
  const comments = useStore((s) => s.comments);
  const watch = useStore((s) => s.watch);
  return (
    <div className="mb-4 xl:hidden">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">AniBla Live · Yangi epizodlar</span>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1">
        {live.map(({ post, animeId, episode }) => {
          const a = ANIME_BY_ID[animeId];
          const locked = watch[animeId] !== undefined && watch[animeId] < episode;
          return (
            <button
              key={post.id}
              type="button"
              onClick={() => navigate(`/p/${post.id}`)}
              className="glass flex w-[228px] shrink-0 snap-start items-center gap-2.5 rounded-2xl p-2 text-left"
            >
              <SmartPoster animeId={animeId} emblem="mini" className="h-12 w-9 shrink-0 rounded-lg" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-fg">{a.title}</span>
                <span className="block text-[11.5px] text-fg-3">
                  {episode}-qism · {timeAgo(post.createdAt)}
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-[11.5px] font-medium tabular-nums text-fg-3">
                {locked ? <Lock className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                {compact(commentCount(post, comments))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SubscriptionsWidget() {
  const hubs = useStore((s) => s.hubs);
  const subs = useStore((s) => s.subscriptions);
  const pinned = useStore((s) => s.pinnedHubs);
  const posts = useStore((s) => s.posts);
  const visits = useStore((s) => s.hubVisits);
  const togglePin = useStore((s) => s.togglePin);

  const list = useMemo(() => {
    const latestBy: Record<string, number> = {};
    for (const p of posts) if (p.hubId && p.status === 'public') latestBy[p.hubId] = Math.max(latestBy[p.hubId] ?? 0, p.createdAt);
    return hubs
      .filter((h) => subs.includes(h.id))
      .map((h) => ({ hub: h, isNew: (latestBy[h.id] ?? 0) > (visits[h.id] ?? 0), isPinned: pinned.includes(h.id) }))
      .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || b.hub.members - a.hub.members);
  }, [hubs, subs, pinned, posts, visits]);

  return (
    <Card className="p-2">
      <div className="flex items-center justify-between px-2 pb-1.5 pt-2">
        <p className="text-[13px] font-semibold text-fg">Mening obunalarim</p>
        <a href="#/hubs/mine" className="text-[12px] font-medium text-fg-3 hover:text-fg">
          Barchasi · {list.length}
        </a>
      </div>
      {list.slice(0, 7).map(({ hub, isNew, isPinned }) => (
        <div key={hub.id} className="group flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-hover">
          <a href={`#/h/${hub.id}`} className="flex min-w-0 flex-1 items-center gap-2.5">
            <HubAvatar hub={hub} size={30} />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-fg">@{hub.id}</span>
              <span className="block truncate text-[11.5px] text-fg-3">{compact(hub.members)} obunachi</span>
            </span>
          </a>
          {isNew && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" aria-label="Yangi postlar bor" />}
          <button
            type="button"
            aria-label={isPinned ? 'Qadashni bekor qilish' : 'Qadash'}
            title={isPinned ? 'Qadashni bekor qilish' : 'Tepaga qadash'}
            onClick={() => togglePin(hub.id)}
            className={cn('grid h-7 w-7 place-items-center rounded-lg transition-card duration-150', isPinned ? 'text-fg' : 'text-fg-3 opacity-0 hover:text-fg group-hover:opacity-100')}
          >
            <Pin className={cn('h-3.5 w-3.5', isPinned && 'fill-current')} strokeWidth={1.75} />
          </button>
        </div>
      ))}
      {list.length === 0 && (
        <div className="px-2 py-6 text-center">
          <p className="text-[13px] text-fg-2">Hali hech qaysi Hub'ga obuna emassiz</p>
          <a href="#/hubs" className={btn('secondary', 'sm', 'mt-3')}>
            Jamiyatlarni ko'rish
          </a>
        </div>
      )}
    </Card>
  );
}

export function RightRail() {
  return (
    <aside className="h-full space-y-3 overflow-y-auto pb-6 pr-1 [scrollbar-gutter:stable]" aria-label="Ekotizim paneli">
      <OtakuPassport />
      <EdtWidget />
      <SubscriptionsWidget />
    </aside>
  );
}
