import {
  Bell,
  Bookmark,
  ChartColumnBig,
  CheckCheck,
  ChevronDown,
  FilePen,
  Gavel,
  ListOrdered,
  Lock,
  LogOut,
  MessageSquare,
  MessageSquareReply,
  Newspaper,
  PenLine,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  Sparkles,
  SquarePlus,
  Star,
  User as UserIcon,
} from 'lucide-react';
import { useState } from 'react';
import { ALL_GENRES, ANIME_BY_ID } from '@/lib/catalog';
import { rankFor, xpForLevel } from '@/lib/gamification';
import { navigate } from '@/lib/router';
import { commentCount, useLiveEpisodes } from '@/lib/selectors';
import { ME, useMe, useStore } from '@/lib/store';
import type { ComposerKind, NotificationType, PostKind } from '@/lib/types';
import { cn, compact, fmt, timeAgo } from '@/lib/utils';
import { XpRingAvatar } from '../ui/Avatar';
import { KIND_META } from '../ui/Badges';
import { Chip, MenuItem, Popover, ProgressBar, Switch, btn } from '../ui/primitives';
import { SmartPoster } from '../ui/SmartPoster';
import { TOPICS } from '../ui/topics';

export const ANIBLA_URL = 'https://anibla.uz';

/* ------------------------------------------------------------------ */
/* Advanced filter                                                     */
/* ------------------------------------------------------------------ */

export function FilterPopover() {
  const filters = useStore((s) => s.filters);
  const setFilters = useStore((s) => s.setFilters);
  const reset = useStore((s) => s.resetFilters);
  const count = filters.topics.length + filters.kinds.length + filters.genres.length + (filters.hideSpoilers ? 1 : 0) + (filters.showNsfw ? 1 : 0);
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <Popover
      align="end"
      panelClassName="w-[min(92vw,380px)] p-0"
      trigger={({ open, toggle: t }) => (
        <button
          type="button"
          onClick={t}
          aria-label="Kengaytirilgan filtr"
          title="Kengaytirilgan filtr"
          className={cn(
            'relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition-card duration-150',
            open || count ? 'border-line-strong bg-panel text-fg' : 'border-line bg-panel text-fg-3 hover:text-fg',
          )}
        >
          <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} />
          {count > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-contrast px-1 text-[10px] font-semibold text-contrast-fg">{count}</span>}
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-[14px] font-semibold text-fg">Filtr</p>
              <p className="text-[12px] text-fg-3">Tasmaga jonli qo'llanadi</p>
            </div>
            {count > 0 && (
              <button type="button" onClick={reset} className="text-[12px] font-medium text-fg-2 hover:text-fg">
                Tozalash
              </button>
            )}
          </div>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto px-4 py-3.5">
            <FilterGroup title="Mavzu">
              {TOPICS.map((t) => (
                <Chip key={t.id} active={filters.topics.includes(t.id)} onClick={() => setFilters({ topics: toggle(filters.topics, t.id) })} icon={<t.icon strokeWidth={1.75} />}>
                  {t.label}
                </Chip>
              ))}
            </FilterGroup>
            <FilterGroup title="Kontent turi">
              {(Object.keys(KIND_META) as PostKind[]).map((k) => {
                const M = KIND_META[k];
                return (
                  <Chip key={k} active={filters.kinds.includes(k)} onClick={() => setFilters({ kinds: toggle(filters.kinds, k) })} icon={<M.icon strokeWidth={1.75} />}>
                    {M.label}
                  </Chip>
                );
              })}
            </FilterGroup>
            <FilterGroup title="Janr">
              {ALL_GENRES.map((g) => (
                <Chip key={g} active={filters.genres.includes(g)} onClick={() => setFilters({ genres: toggle(filters.genres, g) })}>
                  {g}
                </Chip>
              ))}
            </FilterGroup>
            <div className="divide-y divide-line rounded-xl border border-line bg-sunken">
              <label className="flex items-center justify-between gap-3 p-3">
                <span>
                  <span className="block text-[13px] font-medium text-fg">Spoylerlarni yashirish</span>
                  <span className="block text-[11.5px] text-fg-3">Darvoza ortidagi postlar tasmadan olinadi</span>
                </span>
                <Switch checked={filters.hideSpoilers} onChange={(v) => setFilters({ hideSpoilers: v })} label="Spoylerlarni yashirish" />
              </label>
              <label className="flex items-center justify-between gap-3 p-3">
                <span>
                  <span className="block text-[13px] font-medium text-fg">NSFW 18+</span>
                  <span className="block text-[11.5px] text-fg-3">18+ postlarni pardasiz ko'rsatish</span>
                </span>
                <Switch checked={filters.showNsfw} onChange={(v) => setFilters({ showNsfw: v })} label="NSFW 18+" />
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
            <button type="button" className={btn('ghost', 'sm')} onClick={close}>
              Yopish
            </button>
            <button
              type="button"
              className={btn('contrast', 'sm')}
              onClick={() => {
                close();
                if (!/^#\/?$|^$/.test(window.location.hash)) navigate('/');
              }}
            >
              Tasmada ko'rish
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-fg-3">{title}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AniBla Live pill — neutral glass, only the dot is red               */
/* ------------------------------------------------------------------ */

export function LivePill() {
  const live = useLiveEpisodes();
  const comments = useStore((s) => s.comments);
  const watch = useStore((s) => s.watch);
  return (
    <Popover
      align="end"
      panelClassName="w-[min(92vw,380px)] p-1.5"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          className={cn(
            'flex h-8 shrink-0 items-center gap-2 rounded-full border bg-chip px-3 text-[12px] font-medium text-fg-2 transition-card duration-150 hover:text-fg',
            open ? 'border-line-strong text-fg' : 'border-line',
          )}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
          </span>
          <span className="hidden 2xl:inline">AniBla Live:</span>
          <span className="tabular-nums">
            {live.length} <span className="hidden md:inline">yangi qism</span>
          </span>
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between px-2.5 pb-2 pt-1.5">
            <p className="text-[13px] font-semibold text-fg">AniBla Live</p>
            <span className="text-[11.5px] text-fg-3">Bugun va kecha</span>
          </div>
          {live.map(({ post, animeId, episode }) => {
            const a = ANIME_BY_ID[animeId];
            const locked = watch[animeId] !== undefined && watch[animeId] < episode;
            return (
              <div key={post.id} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-hover">
                <SmartPoster animeId={animeId} emblem="mini" className="h-[52px] w-9 shrink-0 rounded-lg" />
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    close();
                    navigate(`/p/${post.id}`);
                  }}
                >
                  <p className="truncate text-[13px] font-medium text-fg">{a.title}</p>
                  <p className="truncate text-[11.5px] text-fg-3">
                    {a.season ? `${a.season}, ` : ''}
                    {episode}-qism · {timeAgo(post.createdAt)}
                  </p>
                </button>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-chip px-2 py-1 text-[11.5px] font-medium tabular-nums text-fg-2">
                  {locked ? <Lock className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                  {compact(commentCount(post, comments))}
                </span>
                <a href={ANIBLA_URL} target="_blank" rel="noreferrer" aria-label={`${a.title} — AniBla'da ko'rish`} className={btn('contrast', 'xs', 'h-7 w-7 px-0')}>
                  <Play className="h-3 w-3 fill-current" />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </Popover>
  );
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export function NotificationBell() {
  const notifications = useStore((s) => s.notifications);
  const markRead = useStore((s) => s.markNotificationRead);
  const markAll = useStore((s) => s.markAllRead);
  const [tab, setTab] = useState<'all' | NotificationType>('all');
  const unread = notifications.filter((n) => !n.read).length;
  const list = [...notifications].filter((n) => tab === 'all' || n.type === tab).sort((a, b) => b.createdAt - a.createdAt);
  const tabs: { id: 'all' | NotificationType; label: string }[] = [
    { id: 'all', label: 'Hammasi' },
    { id: 'edt', label: 'Epizodlar (EDT)' },
    { id: 'reply', label: 'Javoblar' },
    { id: 'system', label: 'Tizim' },
  ];
  const iconFor = (t: NotificationType) => (t === 'edt' ? <Radio className="h-4 w-4" /> : t === 'reply' ? <MessageSquareReply className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />);

  return (
    <Popover
      align="end"
      panelClassName="w-[min(94vw,400px)] p-0 overflow-hidden"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-label={`Bildirishnomalar, ${unread} ta o'qilmagan`}
          className={cn('relative grid h-9 w-9 place-items-center rounded-xl text-fg-2 transition-card duration-150 hover:bg-hover hover:text-fg', open && 'bg-hover text-fg')}
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full border-2 border-[var(--bg)] bg-rose-500 px-0.5 text-[9px] font-bold text-white">{unread}</span>
          )}
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
            <p className="text-[14px] font-semibold text-fg">Bildirishnomalar</p>
            <button
              type="button"
              disabled={unread === 0}
              onClick={markAll}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-fg-2 transition-colors hover:bg-hover hover:text-fg disabled:opacity-40"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Hammasini o'qilgan deb belgilash
            </button>
          </div>
          <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line px-3">
            {tabs.map((t) => {
              const n = notifications.filter((x) => !x.read && (t.id === 'all' || x.type === t.id)).length;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn('relative flex shrink-0 items-center gap-1.5 px-2 pb-2.5 pt-1 text-[12.5px] font-medium transition-colors', tab === t.id ? 'text-fg' : 'text-fg-3 hover:text-fg-2')}
                >
                  {t.label}
                  {n > 0 && <span className="text-[11px] tabular-nums text-fg-3">{n}</span>}
                  {tab === t.id && <span className="absolute inset-x-1 bottom-0 h-0.5 origin-center transform-gpu animate-underline-in rounded-full bg-fg" />}
                </button>
              );
            })}
          </div>
          <div className="max-h-[420px] overflow-y-auto p-1.5">
            {list.length === 0 && <p className="py-10 text-center text-[13px] text-fg-3">Bu bo'limda bildirishnoma yo'q</p>}
            {list.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  markRead(n.id);
                  close();
                  navigate(n.link);
                }}
                className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-hover"
              >
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-sunken text-fg-2">{iconFor(n.type)}</span>
                <div className="min-w-0 flex-1">
                  <p className={cn('text-[13px] leading-snug', n.read ? 'text-fg-2' : 'font-semibold text-fg')}>{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-fg-3">{n.body}</p>
                  <p className="mt-1 text-[11px] text-fg-3">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </Popover>
  );
}

/* ------------------------------------------------------------------ */
/* + Yaratish split button                                             */
/* ------------------------------------------------------------------ */

export function CreateButton() {
  const openModal = useStore((s) => s.openModal);
  const formats: { kind: ComposerKind; label: string; desc: string; icon: React.ReactNode }[] = [
    { kind: 'post', label: 'Xabar', desc: 'Fikr, nazariya yoki rasm', icon: <PenLine className="h-4 w-4" /> },
    { kind: 'collection', label: "To'plam", desc: "Top ro'yxat: #1, #2, #3...", icon: <ListOrdered className="h-4 w-4" /> },
    { kind: 'review', label: 'Sharh', desc: '10 ballik batafsil taqriz', icon: <Star className="h-4 w-4" /> },
    { kind: 'poll', label: "So'rovnoma", desc: 'Jamiyat fikrini bilish', icon: <ChartColumnBig className="h-4 w-4" /> },
    { kind: 'news', label: 'Yangilik', desc: 'Sanoat va AniBla xabarlari', icon: <Newspaper className="h-4 w-4" /> },
  ];
  return (
    <div className="flex shrink-0 items-center">
      <button type="button" onClick={() => openModal({ type: 'composer' })} className={btn('primary', 'md', 'h-8 rounded-r-none pl-2.5 pr-3')}>
        <Plus className="h-4 w-4" strokeWidth={2.4} />
        <span className="hidden sm:inline">Yaratish</span>
      </button>
      <Popover
        align="end"
        panelClassName="w-[270px] p-1.5"
        trigger={({ toggle }) => (
          <button type="button" aria-label="Format tanlash" onClick={toggle} className={btn('primary', 'md', 'h-8 rounded-l-none border-l border-white/20 px-1.5')}>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        )}
      >
        {(close) => (
          <div>
            <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-3">Tezkor format</p>
            {formats.map((f) => (
              <button
                key={f.kind}
                type="button"
                onClick={() => {
                  close();
                  openModal({ type: 'composer', kind: f.kind });
                }}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-hover"
              >
                <span className="text-fg-3">{f.icon}</span>
                <span>
                  <span className="block text-[13px] font-medium text-fg">{f.label}</span>
                  <span className="block text-[11.5px] text-fg-3">{f.desc}</span>
                </span>
              </button>
            ))}
            <div className="my-1 h-px bg-line" />
            <button
              type="button"
              onClick={() => {
                close();
                openModal({ type: 'createHub' });
              }}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-hover"
            >
              <SquarePlus className="h-4 w-4 text-fg-3" />
              <span>
                <span className="block text-[13px] font-medium text-fg">Yangi Hub ochish</span>
                <span className="block text-[11.5px] text-fg-3">O'z jamiyatingiz · +25 XP</span>
              </span>
            </button>
          </div>
        )}
      </Popover>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* User menu                                                           */
/* ------------------------------------------------------------------ */

export function UserMenu() {
  const me = useMe();
  const posts = useStore((s) => s.posts);
  const reports = useStore((s) => s.reports);
  const bookmarks = useStore((s) => s.bookmarks);
  const openModal = useStore((s) => s.openModal);
  const resetDemo = useStore((s) => s.resetDemo);
  const logout = useStore((s) => s.logout);
  const [confirmReset, setConfirmReset] = useState(false);
  const drafts = posts.filter((p) => p.authorId === ME && p.status === 'draft').length;
  const openReports = reports.filter((r) => r.status === 'open').length;
  const rank = rankFor(me.level);
  const need = xpForLevel(me.level);

  return (
    <Popover
      align="end"
      panelClassName="w-[290px] p-1.5"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={() => {
            setConfirmReset(false);
            toggle();
          }}
          aria-label="Profil menyusi"
          className="shrink-0 rounded-full transition-transform hover:scale-105"
        >
          <XpRingAvatar user={me} size={28} />
        </button>
      )}
    >
      {(close) => {
        const go = (to: string) => {
          close();
          navigate(to);
        };
        return (
          <div>
            <div className="mb-1 rounded-xl p-2.5">
              <div className="flex items-center gap-3">
                <XpRingAvatar user={me} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-fg">{me.name}</p>
                  <p className="truncate text-[12px] text-fg-3">@{me.handle}</p>
                </div>
                <span className="rounded-md bg-chip px-2 py-0.5 text-[11px] font-medium text-fg-2">
                  Lv. {me.level} · {rank.name}
                </span>
              </div>
              <div className="mt-3">
                <ProgressBar value={(me.xp / need) * 100} />
                <p className="mt-1.5 text-[11px] tabular-nums text-fg-3">
                  {fmt(me.xp)} / {fmt(need)} XP
                </p>
              </div>
            </div>
            <div className="h-px bg-line" />
            <div className="py-1">
              <MenuItem icon={<UserIcon className="h-4 w-4" />} onClick={() => go('/me')}>Mening Profilim</MenuItem>
              <MenuItem icon={<Bookmark className="h-4 w-4" />} hint={bookmarks.length} onClick={() => go('/me/bookmarks')}>Xatcho'plar</MenuItem>
              <MenuItem icon={<FilePen className="h-4 w-4" />} hint={drafts || undefined} onClick={() => go('/me/drafts')}>Qoralamalar</MenuItem>
              <MenuItem icon={<Gavel className="h-4 w-4" />} hint={openReports || undefined} onClick={() => go('/mod')}>Moderator Paneli</MenuItem>
              <MenuItem
                icon={<Settings className="h-4 w-4" />}
                onClick={() => {
                  close();
                  openModal({ type: 'settings' });
                }}
              >
                Sozlamalar
              </MenuItem>
            </div>
            <div className="h-px bg-line" />
            <div className="pt-1">
              <MenuItem
                icon={<RotateCcw className="h-4 w-4" />}
                danger={confirmReset}
                onClick={() => {
                  if (!confirmReset) return setConfirmReset(true);
                  close();
                  setConfirmReset(false);
                  resetDemo();
                  navigate('/');
                }}
              >
                {confirmReset ? 'Tasdiqlang: hammasini tiklash' : "Demo ma'lumotlarni tiklash"}
              </MenuItem>
              <MenuItem
                icon={<LogOut className="h-4 w-4" />}
                onClick={() => {
                  close();
                  logout();
                }}
              >
                Chiqish
              </MenuItem>
            </div>
          </div>
        );
      }}
    </Popover>
  );
}
