import { Check, Search, SquarePlus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ALL_GENRES, ANIME_BY_ID } from '@/lib/catalog';
import { rankFor } from '@/lib/gamification';
import { navigate, type HubsTab } from '@/lib/router';
import { ME, useStore } from '@/lib/store';
import type { Hub } from '@/lib/types';
import { cn, compact, fmt } from '@/lib/utils';
import { HubAvatar, UserAvatar } from '@/components/ui/Avatar';
import { Card, Chip, EmptyState, Segmented, btn } from '@/components/ui/primitives';
import { SmartPoster } from '@/components/ui/SmartPoster';
import { PageHero } from './FeedPage';

export function HubsPage({ tab }: { tab: HubsTab }) {
  const hubs = useStore((s) => s.hubs);
  const subs = useStore((s) => s.subscriptions);
  const openModal = useStore((s) => s.openModal);
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState<string | null>(null);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase().replace(/^@/, '');
    return hubs
      .filter((h) => (tab === 'anime' ? h.kind === 'anime' : tab === 'topic' ? h.kind === 'topic' : tab === 'mine' ? subs.includes(h.id) : true))
      .filter((h) => !term || h.name.toLowerCase().includes(term) || h.id.includes(term) || h.description.toLowerCase().includes(term))
      .filter((h) => !genre || h.genres.includes(genre))
      .sort((a, b) => b.members - a.members);
  }, [hubs, subs, tab, q, genre]);

  const genres = ALL_GENRES.filter((g) => hubs.some((h) => h.genres.includes(g)));

  return (
    <div>
      <PageHero
        title="Jamiyatlar"
        description={`${hubs.length} ta Hub · har bir AniBla animesi uchun avtomatik Hub va EDT`}
        action={
          <button type="button" className={btn('contrast', 'sm')} onClick={() => openModal({ type: 'createHub' })}>
            <SquarePlus className="h-4 w-4" /> Yangi Hub ochish
          </button>
        }
      />

      <div className="grid gap-5 2xl:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-line bg-panel px-3 transition-colors focus-within:border-line-strong">
              <Search className="h-4 w-4 text-fg-3" strokeWidth={1.75} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hub nomi yoki @manzil..." className="h-full flex-1 bg-transparent text-[13px] text-fg outline-none placeholder:text-fg-3" />
            </div>
            <Segmented
              value={tab}
              onChange={(v) => navigate(`/hubs/${v}`)}
              options={[
                { value: 'all', label: 'Barchasi' },
                { value: 'anime', label: 'Rasmiy anime' },
                { value: 'topic', label: 'Mavzu' },
                { value: 'mine', label: 'Obunalarim', count: subs.length },
              ]}
            />
          </div>
          {tab !== 'topic' && (
            <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto pb-1">
              <Chip active={!genre} onClick={() => setGenre(null)}>
                Barcha janrlar
              </Chip>
              {genres.map((g) => (
                <Chip key={g} active={genre === g} onClick={() => setGenre(genre === g ? null : g)}>
                  {g}
                </Chip>
              ))}
            </div>
          )}
          {list.length === 0 ? (
            <EmptyState icon={<Users className="h-5 w-5" />} title="Hub topilmadi" description="Qidiruvni o'zgartiring yoki o'z Hub'ingizni oching." />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,250px),1fr))] gap-3">
              {list.map((h) => (
                <HubCard key={h.id} hub={h} />
              ))}
            </div>
          )}
        </div>
        <Leaderboard />
      </div>
    </div>
  );
}

function HubCard({ hub }: { hub: Hub }) {
  const subscribed = useStore((s) => s.subscriptions.includes(hub.id));
  const toggle = useStore((s) => s.toggleSubscribe);
  const anime = hub.animeId ? ANIME_BY_ID[hub.animeId] : undefined;
  const [a] = hub.palette;
  return (
    <div className="group relative flex transform-gpu flex-col overflow-hidden rounded-[18px] border border-line bg-panel shadow-panel transition-card duration-300 hover:z-10 hover:-translate-y-1 hover:border-line-strong">
      <a href={`#/h/${hub.id}`} className="block flex-1">
        <div className="relative h-20 overflow-hidden bg-zinc-900">
          {anime ? (
            <SmartPoster animeId={anime.id} banner emblem="none" className="absolute inset-0 h-full w-full" imgClassName="group-hover:scale-105" />
          ) : (
            <div className="absolute inset-0" style={{ background: `radial-gradient(80% 160% at 0% 0%, color-mix(in srgb, ${a} 35%, transparent), transparent 65%), #111318` }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
        <div className="relative px-4">
          <HubAvatar hub={hub} size={44} className="-mt-6 ring-[3px] ring-[var(--panel)]" />
          <p className="mt-2 truncate text-[14.5px] font-semibold text-fg">{hub.name}</p>
          <p className="truncate text-[12px] text-fg-3">
            @{hub.id} · {compact(hub.members)} obunachi
          </p>
          <p className="mt-2 line-clamp-2 text-[12.5px] leading-snug text-fg-2">{hub.description}</p>
        </div>
      </a>
      <div className="mt-3 flex items-center gap-3 px-4 pb-4">
        <span className="flex items-center gap-1.5 text-[12px] text-fg-3">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="tabular-nums">{fmt(hub.online)}</span> onlayn
        </span>
        <button type="button" onClick={() => toggle(hub.id)} className={btn(subscribed ? 'secondary' : 'contrast', 'xs', 'ml-auto h-8 px-3')}>
          {subscribed ? (
            <>
              <Check className="h-3.5 w-3.5" /> Obunasiz
            </>
          ) : (
            "Obuna bo'lish"
          )}
        </button>
      </div>
    </div>
  );
}

function Leaderboard() {
  const users = useStore((s) => s.users);
  const [mode, setMode] = useState<'karma' | 'level'>('karma');
  const list = useMemo(
    () =>
      users
        .filter((u) => !u.bot && !u.verified && u.karma > 0)
        .sort((a, b) => (mode === 'karma' ? b.karma - a.karma : b.level - a.level || b.xp - a.xp))
        .slice(0, 10),
    [users, mode],
  );
  const myRank =
    users
      .filter((u) => !u.bot && !u.verified && u.karma > 0)
      .sort((a, b) => b.karma - a.karma)
      .findIndex((u) => u.id === ME) + 1;
  return (
    <Card className="h-fit p-2 2xl:sticky 2xl:top-20">
      <div className="flex items-center justify-between gap-2 px-2 pb-2 pt-2">
        <div>
          <p className="text-[13.5px] font-semibold text-fg">Global Otaku reytingi</p>
          <p className="text-[11.5px] text-fg-3">Siz #{myRank} o'rindasiz</p>
        </div>
        <Segmented
          size="sm"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'karma', label: 'Karma' },
            { value: 'level', label: 'Daraja' },
          ]}
        />
      </div>
      <ol>
        {list.map((u, i) => (
          <li key={u.id}>
            <a
              href={u.id === ME ? '#/me' : `#/u/${u.handle}`}
              className={cn('flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-hover', u.id === ME && 'bg-hover')}
            >
              <span className="w-5 text-right text-[12px] font-medium tabular-nums text-fg-3">{i + 1}</span>
              <UserAvatar user={u} size={28} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-fg">@{u.handle}</span>
                <span className="block text-[11px] text-fg-3">
                  Lv.{u.level} {rankFor(u.level).name}
                </span>
              </span>
              <span className="text-right text-[12.5px] font-semibold tabular-nums text-fg">{mode === 'karma' ? compact(u.karma) : `Lv.${u.level}`}</span>
            </a>
          </li>
        ))}
      </ol>
    </Card>
  );
}
