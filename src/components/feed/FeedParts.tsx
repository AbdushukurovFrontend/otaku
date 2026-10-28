import { ArrowBigUp, ChartColumnBig, Flame, ImagePlus, ListOrdered, Lock, MessageSquare, Sparkles, Star, Trophy, Users, X } from 'lucide-react';
import { ANIME_BY_ID } from '@/lib/catalog';
import { navigate } from '@/lib/router';
import { commentCount, postScore, useGate, useHub, useTrending, type TrendSlot } from '@/lib/selectors';
import { DEFAULT_FILTERS, useMe, useStore } from '@/lib/store';
import type { ComposerKind, Post, SortMode, TopPeriod } from '@/lib/types';
import { cn, compact } from '@/lib/utils';
import { UserAvatar } from '../ui/Avatar';
import { KIND_META } from '../ui/Badges';
import { EmptyState, Segmented } from '../ui/primitives';
import { SmartPoster } from '../ui/SmartPoster';
import { TOPIC_BY_ID } from '../ui/topics';
import { edtTitle } from './PostBlocks';
import { PostCard } from './PostCard';

/* ------------------------------------------------------------------ */
/* "Hozirgi trendlar" — 24h bento                                      */
/* ------------------------------------------------------------------ */

const KIND_GLYPH: Partial<Record<Post['kind'], string>> = { news: '速報', poll: '投票', review: '批評' };
const TOPIC_GLYPH: Record<Post['topic'], string> = { anime: 'オタク', manga: '漫画', theory: '考察', fanart: '絵', memes: '笑', industry: '業界' };

function BentoCard({ slot, index }: { slot: TrendSlot; index: number }) {
  const { post, badge } = slot;
  const gate = useGate(post);
  const votes = useStore((s) => s.votes);
  const comments = useStore((s) => s.comments);
  const hub = useHub(post.hubId);
  const cover = post.kind === 'collection' ? post.collection?.[0]?.animeId : post.animeId;
  const title = post.kind === 'edt' ? edtTitle(post) : post.title;
  return (
    <button
      type="button"
      onClick={() => navigate(`/p/${post.id}`)}
      className={cn(
        'group relative h-44 transform-gpu animate-slide-up cursor-pointer overflow-hidden rounded-[18px] border border-line text-left transition-card duration-300 hover:-translate-y-1 hover:border-line-strong 3xl:h-48',
        index === 4 && 'hidden 2xl:block',
        index === 5 && 'hidden 3xl:block',
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <SmartPoster
        src={post.image ?? (cover ? ANIME_BY_ID[cover]?.banner : undefined)}
        animeId={cover}
        seed={post.id}
        alt={post.title}
        palette={cover ? undefined : hub?.palette}
        glyph={cover ? undefined : KIND_GLYPH[post.kind] ?? TOPIC_GLYPH[post.topic]}
        emblem="mini"
        className="absolute inset-0 h-full w-full"
        imgClassName={cn('group-hover:scale-[1.05]', gate && 'scale-110 blur-xl')}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/45 to-zinc-950/5" />
      <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/60 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-md">{badge}</span>
      {gate && (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-md">
          <Lock className="h-3 w-3" /> Spoyler
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-3.5">
        <p className={cn('line-clamp-2 text-[13.5px] font-semibold leading-snug text-white', gate && 'select-none blur-[5px]')}>{title}</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-zinc-400">
          <span className="truncate">@{post.hubId ?? 'profil'}</span>
          <span>·</span>
          <span className="flex items-center gap-0.5 tabular-nums text-zinc-300">
            <ArrowBigUp className="h-3.5 w-3.5" strokeWidth={1.75} />
            {compact(postScore(post, votes))}
          </span>
          <span className="hidden items-center gap-0.5 tabular-nums sm:flex">
            <MessageSquare className="h-3 w-3" strokeWidth={1.75} />
            {compact(commentCount(post, comments))}
          </span>
        </p>
      </div>
    </button>
  );
}

export function TrendingBento() {
  const slots = useTrending();
  if (!slots.length) return null;
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-3">Hozirgi trendlar</h2>
        <span className="text-[12px] text-fg-3">So'nggi 24 soat</span>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
        {slots.map((s, i) => (
          <BentoCard key={s.post.id} slot={s} index={i} />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Quick composer bar (main feed only)                                 */
/* ------------------------------------------------------------------ */

export function ComposerBar({ hubId }: { hubId?: string }) {
  const me = useMe();
  const openModal = useStore((s) => s.openModal);
  const open = (kind?: ComposerKind) => openModal({ type: 'composer', kind, hubId });
  const quick: { kind: ComposerKind; icon: React.ReactNode; label: string }[] = [
    { kind: 'post', icon: <ImagePlus className="h-4 w-4" strokeWidth={1.75} />, label: 'Rasm bilan xabar' },
    { kind: 'collection', icon: <ListOrdered className="h-4 w-4" strokeWidth={1.75} />, label: "To'plam" },
    { kind: 'review', icon: <Star className="h-4 w-4" strokeWidth={1.75} />, label: 'Sharh' },
    { kind: 'poll', icon: <ChartColumnBig className="h-4 w-4" strokeWidth={1.75} />, label: "So'rovnoma" },
  ];
  return (
    <div className="glass mb-4 flex items-center gap-3 rounded-[20px] p-2.5 pl-3">
      <UserAvatar user={me} size={32} />
      <button
        type="button"
        onClick={() => open()}
        className="h-10 min-w-0 flex-1 truncate rounded-xl border border-line-subtle bg-sunken px-3.5 text-left text-[13.5px] text-fg-3 transition-colors hover:border-line hover:text-fg-2"
      >
        Qaysi animeni ko'ryapsiz? Fikr, nazariya yoki taqriz yozing...
      </button>
      <div className="hidden items-center sm:flex">
        {quick.map((q) => (
          <button
            key={q.kind}
            type="button"
            title={q.label}
            aria-label={q.label}
            onClick={() => open(q.kind)}
            className="grid h-9 w-9 place-items-center rounded-xl text-fg-3 transition-colors hover:bg-hover hover:text-fg"
          >
            {q.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sort controls                                                       */
/* ------------------------------------------------------------------ */

export function SortControls({ hideFollowing }: { hideFollowing?: boolean }) {
  const sort = useStore((s) => s.feedSort);
  const setSort = useStore((s) => s.setFeedSort);
  const period = useStore((s) => s.topPeriod);
  const setPeriod = useStore((s) => s.setTopPeriod);
  const options: { value: SortMode; label: string; icon: React.ReactNode }[] = [
    { value: 'hot', label: 'Mashhur', icon: <Flame strokeWidth={1.75} /> },
    { value: 'new', label: 'Yangi', icon: <Sparkles strokeWidth={1.75} /> },
    { value: 'top', label: "Eng zo'ri", icon: <Trophy strokeWidth={1.75} /> },
  ];
  if (!hideFollowing) options.push({ value: 'following', label: 'Obunalar', icon: <Users strokeWidth={1.75} /> });
  const value = hideFollowing && sort === 'following' ? 'hot' : sort;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Segmented value={value} onChange={setSort} options={options} />
      {value === 'top' && (
        <Segmented
          size="sm"
          value={period}
          onChange={(v: TopPeriod) => setPeriod(v)}
          className="animate-pop-in"
          options={[
            { value: 'day', label: 'Bugun' },
            { value: 'week', label: 'Hafta' },
            { value: 'month', label: 'Oy' },
            { value: 'year', label: 'Yil' },
          ]}
        />
      )}
    </div>
  );
}

export function SortBar({ count, hideFollowing }: { count: number; hideFollowing?: boolean }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <SortControls hideFollowing={hideFollowing} />
      <span className="ml-auto text-[12px] tabular-nums text-fg-3">{count} ta post</span>
    </div>
  );
}

/** Compact page header: title + one-line description on the left, sort tabs on the right. */
export function FeedHeaderBar({ title, description, count, action }: { title: string; description?: string; count: number; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-b border-line pb-4">
      <div className="min-w-0">
        <h1 className="text-[20px] font-semibold tracking-tight text-fg">{title}</h1>
        <p className="mt-0.5 text-[13px] text-fg-3">
          {description ? `${description} · ` : ''}
          <span className="tabular-nums">{count} ta post</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {action}
        <SortControls />
      </div>
    </div>
  );
}

export function ActiveFilters() {
  const filters = useStore((s) => s.filters);
  const setFilters = useStore((s) => s.setFilters);
  const reset = useStore((s) => s.resetFilters);
  const chips: { label: string; clear: () => void }[] = [
    ...filters.topics.map((t) => ({ label: TOPIC_BY_ID[t].label, clear: () => setFilters({ topics: filters.topics.filter((x) => x !== t) }) })),
    ...filters.kinds.map((k) => ({ label: KIND_META[k].label, clear: () => setFilters({ kinds: filters.kinds.filter((x) => x !== k) }) })),
    ...filters.genres.map((g) => ({ label: g, clear: () => setFilters({ genres: filters.genres.filter((x) => x !== g) }) })),
    ...(filters.hideSpoilers ? [{ label: 'Spoylersiz', clear: () => setFilters({ hideSpoilers: false }) }] : []),
    ...(filters.showNsfw ? [{ label: "NSFW 18+ ko'rinadi", clear: () => setFilters({ showNsfw: DEFAULT_FILTERS.showNsfw }) }] : []),
  ];
  if (!chips.length) return null;
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[12px] text-fg-3">Filtr:</span>
      {chips.map((c) => (
        <button
          key={c.label}
          type="button"
          onClick={c.clear}
          className="inline-flex h-7 items-center gap-1 rounded-full border border-line bg-panel px-2.5 text-[12px] font-medium text-fg transition-colors hover:border-line-strong"
        >
          {c.label} <X className="h-3 w-3 text-fg-3" />
        </button>
      ))}
      <button type="button" onClick={reset} className="ml-auto px-2 text-[12px] font-medium text-fg-3 hover:text-fg">
        Tozalash
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* List                                                                */
/* ------------------------------------------------------------------ */

export function PostList({ posts, empty }: { posts: Post[]; empty?: { title: string; description?: string; action?: React.ReactNode } }) {
  if (!posts.length) {
    return (
      <EmptyState
        icon={<Sparkles className="h-5 w-5" strokeWidth={1.75} />}
        title={empty?.title ?? "Bu yerda hozircha post yo'q"}
        description={empty?.description ?? "Birinchi bo'lib yozing yoki filtrlarni o'zgartiring."}
        action={empty?.action}
      />
    );
  }
  return (
    <div className="space-y-3">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}

