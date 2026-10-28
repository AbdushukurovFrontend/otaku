import { ArrowUpRight, CornerDownLeft, Hash, Search, Sparkles, Users, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ANIME_BY_ID } from '@/lib/catalog';
import { navigate } from '@/lib/router';
import { useStore } from '@/lib/store';
import { cn, compact, isMac } from '@/lib/utils';
import { HubAvatar, UserAvatar } from '../ui/Avatar';
import { KindChip } from '../ui/Badges';
import { SmartPoster } from '../ui/SmartPoster';

type Item = { key: string; href: string; section: string; node: ReactNode };

const norm = (s: string) => s.toLowerCase().replace(/[ʻʼ'`’]/g, '');

const TRENDING_TAGS = ['frieren', 'edt', 'sololeveling', 'nazariya', 'onepiece', 'sharh'];

export function SearchBar({ className, autoFocus, onDone }: { className?: string; autoFocus?: boolean; onDone?: () => void }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const posts = useStore((s) => s.posts);
  const hubs = useStore((s) => s.hubs);
  const users = useStore((s) => s.users);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, []);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const items = useMemo<Item[]>(() => {
    const raw = norm(q.trim());
    if (!raw) return [];
    const term = raw.replace(/^[@#]/, '');
    const out: Item[] = [];

    if (!raw.startsWith('#')) {
      hubs
        .filter((h) => h.kind === 'anime' && h.animeId)
        .filter((h) => {
          const a = ANIME_BY_ID[h.animeId!];
          return [a.title, a.titleEn, ...a.genres].some((x) => norm(x).includes(term));
        })
        .slice(0, 3)
        .forEach((h) => {
          const a = ANIME_BY_ID[h.animeId!];
          out.push({
            key: `a-${a.id}`,
            href: `/h/${h.id}`,
            section: 'Animelar',
            node: (
              <>
                <SmartPoster animeId={a.id} emblem="mini" className="h-11 w-8 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-fg">{a.title}</p>
                  <p className="truncate text-[12px] text-fg-3">
                    {a.year} • {a.studio} • ★ {a.score}
                  </p>
                </div>
                <span className="rounded-md bg-chip px-1.5 py-0.5 text-[10.5px] font-medium text-fg-2">{a.status}</span>
              </>
            ),
          });
        });

      hubs
        .filter((h) => norm(h.name).includes(term) || h.id.includes(term))
        .slice(0, 4)
        .forEach((h) =>
          out.push({
            key: `h-${h.id}`,
            href: `/h/${h.id}`,
            section: "Hub'lar",
            node: (
              <>
                <HubAvatar hub={h} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-fg">@{h.id}</p>
                  <p className="truncate text-[12px] text-fg-3">
                    {h.name} • {compact(h.members)} obunachi
                  </p>
                </div>
              </>
            ),
          }),
        );
    }

    posts
      .filter((p) => p.status === 'public' && !p.removed)
      .filter((p) =>
        raw.startsWith('#') ? p.tags.some((t) => t.includes(term)) : norm(p.title).includes(term) || p.tags.some((t) => t.includes(term)),
      )
      .slice(0, 5)
      .forEach((p) =>
        out.push({
          key: `p-${p.id}`,
          href: `/p/${p.id}`,
          section: 'Postlar',
          node: (
            <>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sunken text-fg-3">
                <Hash className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-fg">{p.title}</p>
                <p className="truncate text-[12px] text-fg-3">{p.hubId ? `@${p.hubId}` : 'Profil'} • #{p.tags.slice(0, 2).join(' #')}</p>
              </div>
              <span className="hidden sm:block">
                <KindChip post={p} showPinned={false} />
              </span>
            </>
          ),
        }),
      );

    if (!raw.startsWith('#')) {
      users
        .filter((u) => !u.bot && (u.handle.includes(term) || norm(u.name).includes(term)))
        .slice(0, 3)
        .forEach((u) =>
          out.push({
            key: `u-${u.id}`,
            href: u.id === 'u_me' ? '/me' : `/u/${u.handle}`,
            section: 'Mualliflar',
            node: (
              <>
                <UserAvatar user={u} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-fg">@{u.handle}</p>
                  <p className="truncate text-[12px] text-fg-3">
                    {u.name} • {compact(u.karma)} karma
                  </p>
                </div>
              </>
            ),
          }),
        );
    }
    return out;
  }, [q, posts, hubs, users]);

  useEffect(() => setActive(0), [q]);

  const go = (href: string) => {
    navigate(href);
    setOpen(false);
    setQ('');
    inputRef.current?.blur();
    onDone?.();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter' && items[active]) {
      go(items[active].href);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  let lastSection = '';

  return (
    <div ref={wrapRef} className={cn('relative w-full max-w-[560px] 3xl:max-w-[680px]', className)}>
      <div
        className={cn(
          'group flex h-9 items-center gap-2.5 rounded-xl border px-3 transition-card duration-150',
          open ? 'border-line-strong bg-panel shadow-[0_0_0_3px_rgba(99,102,241,0.12)]' : 'border-line bg-panel hover:border-line-strong',
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-fg-3" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Anime, @hub, post, #teg yoki muallifni qidiring..."
          className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-fg outline-none placeholder:text-fg-3"
          aria-label="Global qidiruv"
        />
        {q ? (
          <button type="button" aria-label="Tozalash" onClick={() => setQ('')} className="rounded-md p-1 text-fg-3 hover:text-fg">
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <span className="kbd hidden sm:inline-block">{isMac ? '⌘K' : 'Ctrl K'}</span>
        )}
      </div>

      {open && (
        <div className="popover absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(70vh,560px)] transform-gpu animate-pop-in overflow-y-auto rounded-2xl p-2 will-change-transform">
          {!q.trim() ? (
            <div className="p-2">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">
                <Sparkles className="h-3 w-3" /> Trend teglar
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TRENDING_TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setQ(`#${t}`)}
                    className="rounded-full border border-line bg-panel px-2.5 py-1 text-[12px] text-fg-2 transition-colors hover:border-line-strong hover:text-fg"
                  >
                    #{t}
                  </button>
                ))}
              </div>
              <p className="mb-1.5 mt-4 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">
                <Users className="h-3 w-3" /> Tezkor o'tish
              </p>
              {[
                { label: "Barcha Hub'lar katalogi", href: '/hubs' },
                { label: 'Frieren — 12-qism EDT', href: '/p/edt-frieren-12' },
                { label: 'Moderator Paneli', href: '/mod' },
              ].map((l) => (
                <button key={l.href} type="button" onClick={() => go(l.href)} className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-[13.5px] text-fg hover:bg-hover">
                  {l.label}
                  <ArrowUpRight className="h-3.5 w-3.5 text-fg-3" />
                </button>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-[14px] font-medium text-fg">«{q}» bo'yicha hech narsa topilmadi</p>
              <p className="mt-1 text-[12.5px] text-fg-3">Boshqa so'z yoki #teg bilan urinib ko'ring</p>
            </div>
          ) : (
            items.map((it, i) => {
              const header = it.section !== lastSection;
              lastSection = it.section;
              return (
                <div key={it.key}>
                  {header && <p className="px-2.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">{it.section}</p>}
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(it.href)}
                    className={cn('flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left', i === active ? 'bg-hover' : '')}
                  >
                    {it.node}
                    {i === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-fg-3" />}
                  </button>
                </div>
              );
            })
          )}
          <div className="mt-1 flex items-center gap-3 border-t border-line px-3 pb-1 pt-2.5 text-[11px] text-fg-3">
            <span className="flex items-center gap-1"><span className="kbd">↑</span><span className="kbd">↓</span> tanlash</span>
            <span className="flex items-center gap-1"><span className="kbd">Enter</span> ochish</span>
            <span className="flex items-center gap-1"><span className="kbd">Esc</span> yopish</span>
          </div>
        </div>
      )}
    </div>
  );
}
