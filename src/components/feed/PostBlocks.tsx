import { ArrowUpRight, Check, Play, Star, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import { ANIME_BY_ID } from '@/lib/catalog';
import { useStore } from '@/lib/store';
import type { Post } from '@/lib/types';
import { cn, fmt } from '@/lib/utils';
import { ANIBLA_URL } from '../shell/HeaderWidgets';
import { btn } from '../ui/primitives';
import { SmartPoster } from '../ui/SmartPoster';

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

/* ------------------------------------------------------------------ */
/* EDT                                                                 */
/* ------------------------------------------------------------------ */

/** Editorial EDT title without the "rasmiy muhokamasi" suffix stored in seed data. */
export function edtTitle(post: Post): string {
  const a = post.animeId ? ANIME_BY_ID[post.animeId] : undefined;
  if (!a || !post.edt) return post.title;
  return `${a.title} — ${a.season ? `${a.season}, ` : ''}${post.edt.episode}-qism: «${post.edt.episodeTitle}»`;
}

export function StarRating({ post }: { post: Post }) {
  const mine = useStore((s) => s.edtRatings[post.id]);
  const rate = useStore((s) => s.rateEdt);
  const [hover, setHover] = useState(0);
  if (!post.edt) return null;
  const votes = post.edt.ratingVotes + (mine ? 1 : 0);
  const avg = mine ? (post.edt.rating * post.edt.ratingVotes + mine) / votes : post.edt.rating;
  const shown = hover || mine || 0;
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1" onClick={stop}>
      <div className="flex items-center" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Qismga baho bering">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={mine === n}
            aria-label={`${n} yulduz`}
            onMouseEnter={() => setHover(n)}
            onClick={() => rate(post.id, n)}
            className="p-[3px] transition-transform duration-150 hover:scale-110"
          >
            <Star className={cn('h-3.5 w-3.5', n <= shown ? 'fill-amber-400 text-amber-400' : 'text-fg-3')} strokeWidth={1.75} />
          </button>
        ))}
      </div>
      <span className="text-[12px] tabular-nums text-fg-2">
        <span className="font-semibold text-fg">{avg.toFixed(1)}</span> · {fmt(votes)} ovoz
        {mine ? <span className="text-fg-3"> · sizniki {mine}</span> : null}
      </span>
    </div>
  );
}

/** Episode media tile: still + meta + rating on the left, compact watch button on the right. */
export function EdtBlock({ post }: { post: Post }) {
  if (!post.edt || !post.animeId) return null;
  const a = ANIME_BY_ID[post.animeId];
  return (
    <div
      className="mt-3 flex flex-col justify-between gap-4 rounded-2xl border border-line-subtle bg-sunken p-3.5 sm:flex-row sm:items-center"
      onClick={stop}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <SmartPoster src={a.banner} animeId={a.id} emblem="mini" className="h-16 w-28 shrink-0 rounded-xl" />
        <div className="min-w-0 space-y-1.5">
          <p className="truncate text-[12px] text-fg-2">
            {a.season ? `${a.season} · ` : ''}
            {post.edt.episode}-qism · 24 daq · O'zbekcha dublyaj
          </p>
          <StarRating post={post} />
        </div>
      </div>
      <a href={ANIBLA_URL} target="_blank" rel="noreferrer" onClick={stop} className={btn('contrast', 'md', 'h-10 shrink-0 px-4 text-xs')}>
        <Play className="h-3.5 w-3.5 fill-current" /> AniBla'da ko'rish
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Review                                                              */
/* ------------------------------------------------------------------ */

/** Monochrome score ring (composer preview). */
export function ScoreRing({ value, size = 76 }: { value: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-grid place-items-center text-fg" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--chip)" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 10)} />
      </svg>
      <span className="text-center leading-none">
        <span className="block text-[20px] font-semibold tabular-nums">{value.toFixed(1)}</span>
        <span className="text-[10px] text-fg-3">/ 10</span>
      </span>
    </span>
  );
}

const CRITERIA: { key: 'plot' | 'animation' | 'music' | 'characters'; label: string }[] = [
  { key: 'plot', label: 'Syujet' },
  { key: 'animation', label: 'Animatsiya' },
  { key: 'music', label: 'Musiqa' },
  { key: 'characters', label: 'Personajlar' },
];

export function ReviewBlock({ post }: { post: Post }) {
  const r = post.review;
  if (!r) return null;
  return (
    <div className="mt-3 flex gap-4 rounded-2xl border border-line-subtle bg-sunken p-3.5">
      {post.animeId && <SmartPoster animeId={post.animeId} emblem="mini" className="hidden h-[108px] w-[76px] shrink-0 rounded-xl sm:block" />}
      <div className="grid min-w-0 flex-1 content-center gap-2">
        {CRITERIA.map((c) => (
          <div key={c.key} className="grid grid-cols-[78px_1fr_28px] items-center gap-2.5">
            <span className="text-[12px] text-fg-2">{c.label}</span>
            <span className="h-1 overflow-hidden rounded-full bg-chip">
              <span className="block h-full origin-left transform-gpu animate-grow-x rounded-full bg-fg" style={{ transform: `scaleX(${r[c.key] / 10})` }} />
            </span>
            <span className="text-right text-[12px] font-medium tabular-nums text-fg">{r[c.key].toFixed(1)}</span>
          </div>
        ))}
      </div>
      <div className="flex shrink-0 flex-col items-center justify-center border-l border-line-subtle pl-4">
        <span className="flex items-center gap-1.5 text-[26px] font-semibold leading-none tabular-nums text-fg">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          {r.overall.toFixed(1)}
        </span>
        <span className="mt-1 text-[11px] text-fg-3">/ 10</span>
        {r.recommended && (
          <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-medium text-fg-2">
            <ThumbsUp className="h-3 w-3" /> Tavsiya
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Collection                                                          */
/* ------------------------------------------------------------------ */

export function CollectionBlock({ post, expanded }: { post: Post; expanded?: boolean }) {
  const items = post.collection ?? [];
  if (!items.length) return null;
  if (expanded) {
    return (
      <ol className="mt-4 divide-y divide-line-subtle overflow-hidden rounded-2xl border border-line-subtle">
        {items.map((it, i) => {
          const a = it.animeId ? ANIME_BY_ID[it.animeId] : undefined;
          return (
            <li key={i} className="flex items-center gap-4 bg-sunken p-3">
              <span className="w-7 shrink-0 text-right text-[15px] font-semibold tabular-nums text-fg-3">{i + 1}</span>
              <SmartPoster animeId={it.animeId} seed={it.title} alt={it.title} emblem="mini" className="h-[72px] w-[50px] shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-fg">{it.title}</p>
                {a && (
                  <p className="text-[11.5px] text-fg-3">
                    {a.year} · {a.studio} · ★ {a.score}
                  </p>
                )}
                <p className="mt-1 text-[13px] leading-snug text-fg-2">{it.note}</p>
              </div>
              {a && (
                <a href={ANIBLA_URL} target="_blank" rel="noreferrer" className={btn('secondary', 'xs', 'hidden sm:inline-flex')}>
                  AniBla <ArrowUpRight className="h-3 w-3" />
                </a>
              )}
            </li>
          );
        })}
      </ol>
    );
  }
  return (
    <div className="no-scrollbar -mx-5 mt-3 flex snap-x gap-2.5 overflow-x-auto px-5 pb-1" onClick={stop}>
      {items.map((it, i) => (
        <a key={i} href={`#/p/${post.id}`} className="group w-[112px] shrink-0 snap-start">
          <SmartPoster animeId={it.animeId} seed={it.title} alt={it.title} emblem="mini" className="aspect-[2/3] w-full rounded-xl" imgClassName="group-hover:scale-105">
            <span className="absolute left-1.5 top-1.5 rounded-full border border-white/15 bg-black/60 px-2 py-0.5 text-[10.5px] font-semibold tabular-nums text-white backdrop-blur-md">
              #{i + 1}
            </span>
          </SmartPoster>
          <p className="mt-1.5 truncate text-[12.5px] font-medium text-fg">{it.title}</p>
          <p className="line-clamp-2 text-[11.5px] leading-snug text-fg-3">{it.note}</p>
        </a>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Poll                                                                */
/* ------------------------------------------------------------------ */

export function PollBlock({ post }: { post: Post }) {
  const mine = useStore((s) => s.pollVotes[post.id]);
  const vote = useStore((s) => s.votePoll);
  if (!post.poll) return null;
  const total = post.poll.options.reduce((s, o) => s + o.votes, 0) + (mine ? 1 : 0);
  const daysLeft = Math.max(0, Math.ceil((post.poll.endsAt - Date.now()) / 86_400_000));
  return (
    <div className="mt-3 space-y-1.5" onClick={stop}>
      {post.poll.options.map((o) => {
        const v = o.votes + (mine === o.id ? 1 : 0);
        const pct = total ? Math.round((v / total) * 100) : 0;
        const isMine = mine === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => vote(post.id, o.id)}
            className={cn(
              'relative flex h-10 w-full items-center gap-3 overflow-hidden rounded-xl border px-3.5 text-left text-[13px] transition-colors duration-150',
              isMine ? 'border-indigo-500/40' : 'border-line',
              !mine && 'hover:bg-hover',
            )}
          >
            {mine && (
              <span
                className={cn('absolute inset-0 origin-left transform-gpu animate-grow-x transition-gpu duration-700', isMine ? 'bg-indigo-500/12' : 'bg-chip')}
                style={{ transform: `scaleX(${pct / 100})` }}
              />
            )}
            {!mine && <span className="relative h-3.5 w-3.5 shrink-0 rounded-full border-[1.5px] border-line-strong" />}
            {isMine && (
              <span className="relative grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full bg-indigo-600">
                <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />
              </span>
            )}
            <span className={cn('relative flex-1 truncate', isMine ? 'font-semibold text-fg' : 'text-fg')}>{o.text}</span>
            {mine && <span className="relative text-[12.5px] font-semibold tabular-nums text-fg-2">{pct}%</span>}
          </button>
        );
      })}
      <p className="pt-1 text-[12px] text-fg-3">
        <span className="tabular-nums">{fmt(total)} ovoz</span> · {daysLeft > 0 ? `${daysLeft} kun qoldi` : 'Yakunlandi'} ·{' '}
        {mine ? "Ovozni o'zgartirish mumkin" : 'Natijani ko\'rish uchun ovoz bering'}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

export function PostMedia({ post, detail }: { post: Post; detail?: boolean }) {
  if (!post.image) return null;
  return (
    <SmartPoster
      src={post.image}
      animeId={post.animeId}
      seed={post.id}
      alt={post.title}
      className={cn('mt-3 w-full rounded-2xl border border-line-subtle', post.meme ? 'aspect-square max-h-[520px] sm:aspect-[4/3]' : detail ? 'aspect-video' : 'aspect-[16/8.5]')}
    >
      {post.meme && (
        <>
          <div className="absolute inset-0 bg-black/15" />
          <p className="meme-text absolute inset-x-3 top-3 text-center text-[clamp(18px,4.2vw,34px)] leading-[1.05]">{post.meme.top}</p>
          <p className="meme-text absolute inset-x-3 bottom-3 text-center text-[clamp(18px,4.2vw,34px)] leading-[1.05]">{post.meme.bottom}</p>
        </>
      )}
    </SmartPoster>
  );
}
