import { ArrowUpRight, House, ListOrdered, Newspaper, Star, Users } from 'lucide-react';
import { useMemo } from 'react';
import type { Route } from '@/lib/router';
import { useStore } from '@/lib/store';
import { cn, DAY } from '@/lib/utils';
import { AniBlaMark } from '../ui/Brand';
import { SectionLabel, btn } from '../ui/primitives';
import { TOPICS } from '../ui/topics';
import { ANIBLA_URL } from './HeaderWidgets';

export const MAIN_NAV = [
  { id: 'feed', label: 'Tasma', href: '/', icon: House },
  { id: 'news', label: 'Yangiliklar', href: '/news', icon: Newspaper },
  { id: 'collection', label: "To'plamlar", href: '/collections', icon: ListOrdered },
  { id: 'review', label: 'Sharhlar', href: '/reviews', icon: Star },
  { id: 'hubs', label: 'Jamiyatlar', href: '/hubs', icon: Users },
] as const;

export function activeNavId(route: Route): string | null {
  if (route.name === 'feed') return route.topic ? null : route.kind === 'all' ? 'feed' : route.kind;
  if (route.name === 'hubs' || route.name === 'hub') return 'hubs';
  return null;
}

const item = 'group flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13.5px] transition-colors duration-100';

export function LeftNav({ route }: { route: Route }) {
  const posts = useStore((s) => s.posts);
  const active = activeNavId(route);
  const activeTopic = route.name === 'feed' ? route.topic : undefined;

  const fresh = useMemo(() => {
    const now = Date.now();
    const count = (k: string) => posts.filter((p) => p.kind === k && p.status === 'public' && now - p.createdAt < DAY).length;
    return { news: count('news'), collection: count('collection'), review: count('review') } as Record<string, number>;
  }, [posts]);

  return (
    <nav className="no-scrollbar h-full overflow-y-auto pb-6" aria-label="Asosiy navigatsiya">
      <div className="space-y-px">
        {MAIN_NAV.map((n) => {
          const isActive = active === n.id;
          const Icon = n.icon;
          return (
            <a
              key={n.id}
              href={`#${n.href}`}
              className={cn(item, 'font-medium', isActive ? 'bg-hover text-fg' : 'text-fg-2 hover:bg-hover hover:text-fg')}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-fg' : 'text-fg-3 group-hover:text-fg')} strokeWidth={1.5} />
              <span className="flex-1">{n.label}</span>
              {fresh[n.id] > 0 && <span className="text-xs font-medium tabular-nums text-fg-3">{fresh[n.id]}</span>}
            </a>
          );
        })}
      </div>

      <div className="mt-6">
        <SectionLabel>Mavzular</SectionLabel>
        <div className="space-y-px">
          {TOPICS.map((t) => {
            const isActive = activeTopic === t.id;
            return (
              <a
                key={t.id}
                href={isActive ? '#/' : `#/topic/${t.id}`}
                className={cn(item, isActive ? 'bg-hover font-medium text-fg' : 'text-fg-2 hover:bg-hover hover:text-fg')}
              >
                <t.icon className={cn('h-4 w-4', isActive ? 'text-fg' : 'text-fg-3 group-hover:text-fg')} strokeWidth={1.5} />
                <span className="flex-1 truncate">{t.label}</span>
              </a>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-chip/80 p-4 dark:bg-zinc-900/70">
        <div className="flex items-center gap-2.5">
          <AniBlaMark size={28} />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-fg">AniBla.uz</p>
            <p className="text-[11.5px] text-fg-3">Rasmiy striming</p>
          </div>
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-fg-2">O'zbek tilida sifatli anime — 1080p, dublyaj va oflayn rejim.</p>
        <a href={ANIBLA_URL} target="_blank" rel="noreferrer" className={btn('contrast', 'sm', 'mt-3 w-full')}>
          Tomosha qilish <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <p className="mt-5 px-2 text-[11px] leading-relaxed text-fg-3">
        Otaku © 2026 · AniBla Ecosystem
        <br />
        Qoidalar · Maxfiylik · Yordam
      </p>
    </nav>
  );
}
