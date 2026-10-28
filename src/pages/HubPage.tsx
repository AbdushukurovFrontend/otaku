import { ArrowRight, CalendarDays, Check, Lock, Play, RefreshCw, ShieldCheck, Star, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ANIME_BY_ID, episodeRange } from '@/lib/catalog';
import { rankFor } from '@/lib/gamification';
import { navigate, type HubTab } from '@/lib/router';
import { commentCount, latestEdtIds, postScore, useFeed, useHub } from '@/lib/selectors';
import { edtId } from '@/lib/seed';
import { ME, useStore } from '@/lib/store';
import type { Hub } from '@/lib/types';
import { cn, compact, fmt, formatDate, hashString } from '@/lib/utils';
import { PostList, SortControls } from '@/components/feed/FeedParts';
import { ANIBLA_URL } from '@/components/shell/HeaderWidgets';
import { HubAvatar, UserAvatar } from '@/components/ui/Avatar';
import { LevelBadge } from '@/components/ui/Badges';
import { DynIcon } from '@/components/ui/Icon';
import { Card, EmptyState, MetaChip, ReadingColumn, Segmented, btn } from '@/components/ui/primitives';
import { SmartPoster } from '@/components/ui/SmartPoster';

export function HubPage({ id, tab }: { id: string; tab: HubTab }) {
  const hub = useHub(id);
  const visitHub = useStore((s) => s.visitHub);
  useEffect(() => {
    if (hub) visitHub(hub.id);
  }, [hub?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hub) {
    return (
      <EmptyState
        icon={<Users className="h-5 w-5" />}
        title="Hub topilmadi"
        description={`@${id} manzilida Hub mavjud emas. Balki uni siz ochishingiz kerakdir?`}
        action={
          <a href="#/hubs" className={btn('contrast', 'md')}>
            Jamiyatlar katalogi
          </a>
        }
      />
    );
  }
  const anime = hub.animeId ? ANIME_BY_ID[hub.animeId] : undefined;
  const hasEpisodes = !!anime?.epEnd;

  const tabs: { value: HubTab; label: string }[] = [
    { value: 'posts', label: 'Yozuvlar' },
    ...(hasEpisodes ? [{ value: 'episodes' as HubTab, label: 'Epizodlar (EDT)' }] : []),
    { value: 'reviews', label: 'Sharhlar' },
    { value: 'about', label: 'Haqida' },
  ];

  return (
    <div>
      <HubBanner hub={hub} />
      {hasEpisodes && <HubControlPanel hub={hub} />}
      {/* The About tab is a dashboard and may use the full width; feeds stay in the reading column. */}
      <ReadingColumn className={tab === 'about' ? 'max-w-none' : undefined}>
        <div className="sticky top-14 z-20 -mx-1 mb-3 flex flex-wrap items-center justify-between gap-2 bg-[color-mix(in_srgb,var(--bg)_85%,transparent)] px-1 py-2.5 backdrop-blur-xl">
          <Segmented value={tab} onChange={(v) => navigate(`/h/${hub.id}${v === 'posts' ? '' : `/${v}`}`)} options={tabs} />
          {tab === 'posts' && <SortControls hideFollowing />}
        </div>
        {tab === 'posts' && <HubPosts hub={hub} />}
        {tab === 'episodes' && hasEpisodes && <HubEpisodes hub={hub} />}
        {tab === 'reviews' && <HubReviews hub={hub} />}
        {tab === 'about' && <HubAbout hub={hub} />}
      </ReadingColumn>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cinematic banner — always a dark film gradient, text always legible */
/* ------------------------------------------------------------------ */

function HubBanner({ hub }: { hub: Hub }) {
  const subscribed = useStore((s) => s.subscriptions.includes(hub.id));
  const toggle = useStore((s) => s.toggleSubscribe);
  const [hover, setHover] = useState(false);
  const anime = hub.animeId ? ANIME_BY_ID[hub.animeId] : undefined;
  const [a, b] = hub.palette;

  return (
    <div className="relative mb-3 overflow-hidden rounded-[20px] border border-line bg-zinc-950">
      <div className="relative h-[280px] sm:h-[264px]">
        {anime ? (
          <SmartPoster animeId={anime.id} banner emblem="none" className="absolute inset-0 h-full w-full" />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `radial-gradient(70% 120% at 15% 0%, color-mix(in srgb, ${a} 38%, transparent), transparent 65%), radial-gradient(60% 120% at 100% 0%, color-mix(in srgb, ${b} 26%, transparent), transparent 60%), #0b0c10` }}
          >
            <DynIcon name={hub.icon} className="absolute -bottom-10 right-10 h-60 w-60 text-white/[0.06]" strokeWidth={1} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/60 to-transparent" />
        {/* On phones the text block is taller, so the whole still is dimmed for contrast */}
        <div className="absolute inset-0 bg-zinc-950/35 sm:hidden" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 items-end gap-4">
            {anime ? (
              <SmartPoster animeId={anime.id} emblem="mini" className="hidden h-[116px] w-[82px] shrink-0 rounded-xl ring-1 ring-white/15 sm:block" />
            ) : (
              <HubAvatar hub={hub} size={64} className="ring-2 ring-white/15" />
            )}
            <div className="min-w-0">
              <p className="text-[11.5px] font-medium text-zinc-400">
                {hub.official ? (anime ? 'Rasmiy Anime Hub' : 'Rasmiy Hub') : "Mavzu Hub'i"}
                {anime ? ` · ${anime.status}` : ''}
              </p>
              <h1 className="mt-0.5 truncate text-[26px] font-semibold tracking-tight text-white sm:text-[30px]">{hub.name}</h1>
              <p className="truncate text-[13px] text-zinc-300">
                @{hub.id}
                {anime ? ` · ${anime.studio}` : ''}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-zinc-300">
                <span>
                  <b className="font-semibold tabular-nums text-white">{fmt(hub.members)}</b> obunachi
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <b className="font-semibold tabular-nums text-white">{fmt(hub.online)}</b> onlayn
                </span>
                {anime && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <b className="font-semibold tabular-nums text-white">{anime.score}</b>
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              onClick={() => toggle(hub.id)}
              className="inline-flex h-10 min-w-[136px] items-center justify-center gap-1.5 rounded-xl bg-white/10 px-4 text-[13px] font-semibold text-white ring-1 ring-inset ring-white/20 backdrop-blur-md transition-colors hover:bg-white/15 active:scale-[0.97]"
            >
              {subscribed ? (
                hover ? (
                  'Obunani bekor qilish'
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Obunasiz
                  </>
                )
              ) : (
                "Obuna bo'lish"
              )}
            </button>
            {anime && (
              <a
                href={ANIBLA_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-[13px] font-semibold text-zinc-900 transition-colors hover:bg-zinc-200 active:scale-[0.97]"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> AniBla'da tomosha qilish
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* One control panel: inline spoiler gate + episode discussion strip   */
/* ------------------------------------------------------------------ */

function HubControlPanel({ hub }: { hub: Hub }) {
  const anime = ANIME_BY_ID[hub.animeId!];
  const [start, end] = episodeRange(anime);
  const watched = useStore((s) => s.watch[anime.id]);
  const setWatch = useStore((s) => s.setWatch);
  const posts = useStore((s) => s.posts);
  const comments = useStore((s) => s.comments);
  const toast = useStore((s) => s.toast);
  const [syncing, setSyncing] = useState(false);
  const all = watched === undefined;
  const value = all ? end : watched;
  const min = start - 1;

  const hidden = useMemo(
    () => posts.filter((p) => p.status === 'public' && !p.removed && p.animeId === anime.id && p.episode !== undefined && !all && p.episode > value).length,
    [posts, anime.id, value, all],
  );
  const fill = ((value - min) / (end - min)) * 100;

  const episodes = useMemo(() => {
    const list = [];
    for (let ep = end; ep >= start; ep--) {
      const p = posts.find((x) => x.id === edtId(anime.id, ep));
      if (p) list.push(p);
    }
    return list;
  }, [posts, anime.id, start, end]);

  const syncFromAniBla = () => {
    setSyncing(true);
    window.setTimeout(() => {
      const ep = Math.max(min, end - 1 - (hashString(anime.id) % 2));
      setWatch(anime.id, ep);
      setSyncing(false);
      toast({ tone: 'success', title: 'AniBla bilan sinxronlandi', description: `Ko'rish tarixingiz: ${anime.title} — ${ep}-qism` });
    }, 900);
  };

  const label = value >= end ? 'barcha qismlar' : value < start ? 'boshlanmagan' : `${value}-qismgacha`;

  return (
    <Card className="mb-4 p-3.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <span className="flex shrink-0 items-center gap-2 text-[13px] text-fg-2">
          <ShieldCheck className="h-4 w-4 text-fg-3" strokeWidth={1.75} />
          Spoyler himoyasi: <span className="font-semibold tabular-nums text-fg">{label}</span>
        </span>
        <input
          type="range"
          min={min}
          max={end}
          step={1}
          value={value}
          onChange={(e) => setWatch(anime.id, Number(e.target.value))}
          aria-label="Ko'rilgan qism"
          className="otaku-range min-w-[140px] flex-1"
          style={{ ['--fill' as string]: `${fill}%` }}
        />
        <div className="flex shrink-0 items-center gap-2">
          {hidden > 0 ? <MetaChip icon={<Lock />}>{hidden} ta post yopildi</MetaChip> : <MetaChip icon={<Check />}>Hammasi ochiq</MetaChip>}
          <button type="button" onClick={syncFromAniBla} disabled={syncing} className={btn('secondary', 'xs')}>
            <RefreshCw className={cn('h-3 w-3', syncing && 'animate-spin')} />
            {syncing ? 'Sinxronlanmoqda' : 'AniBla sinxron'}
          </button>
        </div>
      </div>
      <div className="mt-3 border-t border-line-subtle pt-3">
        <div className="no-scrollbar -mx-1 flex snap-x items-center gap-1.5 overflow-x-auto px-1">
          {episodes.map((p, i) => {
            const ep = p.edt!.episode;
            const locked = !all && value < ep;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => navigate(`/p/${p.id}`)}
                className="inline-flex h-8 shrink-0 snap-start items-center gap-1.5 rounded-full border border-line bg-panel px-3 text-[12px] font-medium text-fg transition-colors hover:border-line-strong hover:bg-hover"
              >
                {locked ? <Lock className="h-3 w-3 text-fg-3" /> : i === 0 ? <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> : null}
                {ep}-qism
                <span className="tabular-nums text-fg-3">· {compact(commentCount(p, comments))}</span>
              </button>
            );
          })}
          <a href={`#/h/${hub.id}/episodes`} className="inline-flex h-8 shrink-0 items-center gap-1 px-2 text-[12px] font-medium text-fg-3 hover:text-fg">
            Barcha EDT <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

function HubPosts({ hub }: { hub: Hub }) {
  const sort = useStore((s) => s.feedSort);
  const period = useStore((s) => s.topPeriod);
  const posts = useFeed({ hubId: hub.id, sort: sort === 'following' ? 'hot' : sort, period, pinnedFirst: true });
  return <PostList posts={posts} empty={{ title: "Bu Hub'da hali post yo'q", description: 'Birinchi postni siz yozing va +15 XP oling.' }} />;
}

function HubEpisodes({ hub }: { hub: Hub }) {
  const posts = useFeed({ hubId: hub.id, kind: 'edt', sort: 'new', includeAllEdts: true });
  return <PostList posts={posts} />;
}

function HubReviews({ hub }: { hub: Hub }) {
  const posts = useFeed({ hubId: hub.id, kind: 'review', sort: 'top', period: 'year' });
  const openModal = useStore((s) => s.openModal);
  return (
    <PostList
      posts={posts}
      empty={{
        title: 'Hali sharh yozilmagan',
        description: 'Ushbu anime haqida birinchi 10 ballik taqrizni yozing.',
        action: (
          <button type="button" className={btn('contrast', 'md')} onClick={() => openModal({ type: 'composer', kind: 'review', hubId: hub.id })}>
            Sharh yozish
          </button>
        ),
      }}
    />
  );
}

function HubAbout({ hub }: { hub: Hub }) {
  const users = useStore((s) => s.users);
  const posts = useStore((s) => s.posts);
  const votes = useStore((s) => s.votes);
  const anime = hub.animeId ? ANIME_BY_ID[hub.animeId] : undefined;

  const leaderboard = useMemo(() => {
    const karma: Record<string, number> = {};
    const latest = latestEdtIds(posts);
    for (const p of posts) {
      if (p.hubId !== hub.id || p.status !== 'public' || p.authorId === 'u_bot' || (p.kind === 'edt' && !latest.has(p.id))) continue;
      karma[p.authorId] = (karma[p.authorId] ?? 0) + postScore(p, votes);
    }
    for (const m of hub.moderators) karma[m] = (karma[m] ?? 0) + 120;
    return Object.entries(karma)
      .map(([id, k]) => ({ user: users.find((u) => u.id === id)!, karma: k }))
      .filter((x) => x.user && !x.user.bot)
      .sort((a, b) => b.karma - a.karma)
      .slice(0, 7);
  }, [posts, votes, users, hub]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <Card className="p-5">
          <h3 className="text-[15px] font-semibold text-fg">Hub haqida</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-fg-2">{hub.description}</p>
          <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-xl border border-line-subtle bg-sunken sm:grid-cols-4 sm:divide-x sm:divide-line">
            <Info label="Obunachilar" value={compact(hub.members)} />
            <Info label="Onlayn" value={fmt(hub.online)} />
            <Info label="Ochilgan" value={formatDate(hub.createdAt).replace(/^\d+-yil /, '')} icon={<CalendarDays className="h-3 w-3" />} />
            <Info label={anime ? 'Studiya' : 'Turi'} value={anime ? anime.studio : 'Mavzu'} />
          </div>
          {hub.genres.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {hub.genres.map((g) => (
                <MetaChip key={g}>{g}</MetaChip>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="text-[15px] font-semibold text-fg">Hub qoidalari</h3>
          <ol className="mt-3 divide-y divide-line-subtle">
            {hub.rules.map((r, i) => (
              <li key={i} className="flex gap-3 py-2.5 text-[13.5px] text-fg-2">
                <span className="w-4 shrink-0 text-right font-medium tabular-nums text-fg-3">{i + 1}.</span>
                {r}
              </li>
            ))}
          </ol>
        </Card>
      </div>
      <div className="space-y-4">
        <Card className="p-2">
          <h3 className="px-2 pb-1 pt-2 text-[13px] font-semibold text-fg">Top Otakular</h3>
          <ol>
            {leaderboard.map(({ user, karma }, i) => (
              <li key={user.id}>
                <a href={user.id === ME ? '#/me' : `#/u/${user.handle}`} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-hover">
                  <span className="w-4 text-right text-[12px] font-medium tabular-nums text-fg-3">{i + 1}</span>
                  <UserAvatar user={user} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-fg">@{user.handle}</span>
                    <span className="block text-[11px] text-fg-3">
                      Lv.{user.level} {rankFor(user.level).name}
                    </span>
                  </span>
                  <span className="text-[12px] font-medium tabular-nums text-fg-2">{fmt(karma)}</span>
                </a>
              </li>
            ))}
          </ol>
        </Card>
        <Card className="p-2">
          <h3 className="px-2 pb-1 pt-2 text-[13px] font-semibold text-fg">Moderatorlar</h3>
          {hub.moderators.map((m) => {
            const u = users.find((x) => x.id === m);
            return (
              <a key={m} href={m === ME ? '#/me' : `#/u/${u?.handle}`} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-hover">
                <UserAvatar user={u} size={28} />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-fg">@{u?.handle}</span>
                <LevelBadge user={u} />
              </a>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="px-3 py-2.5">
      <p className="flex items-center gap-1 text-[11px] text-fg-3">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 truncate text-[14px] font-semibold text-fg">{value}</p>
    </div>
  );
}
