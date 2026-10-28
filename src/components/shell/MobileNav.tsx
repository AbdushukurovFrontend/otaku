import { House, Plus, Star, User, Users } from 'lucide-react';
import type { Route } from '@/lib/router';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { activeNavId } from './LeftNav';

export function MobileNav({ route }: { route: Route }) {
  const openModal = useStore((s) => s.openModal);
  const active = activeNavId(route);
  const isProfile = route.name === 'profile' && route.handle === null;
  const item = (href: string, label: string, Icon: typeof House, on: boolean) => (
    <a href={`#${href}`} className={cn('flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10.5px] font-medium', on ? 'text-fg' : 'text-fg-3')}>
      <Icon className="h-5 w-5" strokeWidth={on ? 2 : 1.5} />
      {label}
    </a>
  );
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl lg:hidden">
      <div className="mx-auto flex max-w-lg items-center px-2">
        {item('/', 'Tasma', House, active === 'feed')}
        {item('/hubs', 'Jamiyatlar', Users, active === 'hubs')}
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            aria-label="Post yaratish"
            onClick={() => openModal({ type: 'composer' })}
            className="-mt-4 grid h-11 w-11 place-items-center rounded-2xl bg-contrast text-contrast-fg shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)] transition-transform active:scale-95"
          >
            <Plus className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>
        {item('/reviews', 'Sharhlar', Star, active === 'review')}
        {item('/me', 'Profil', User, isProfile)}
      </div>
    </nav>
  );
}
