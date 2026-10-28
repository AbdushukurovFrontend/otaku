import { LogIn, Moon, Search, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { setTheme } from '@/lib/theme';
import { OtakuMark } from '../ui/Brand';
import { IconButton, btn } from '../ui/primitives';
import { CreateButton, FilterPopover, LivePill, NotificationBell, UserMenu } from './HeaderWidgets';
import { SearchBar } from './SearchBar';

export function Header() {
  const theme = useStore((s) => s.theme);
  const authed = useStore((s) => s.authed);
  const openModal = useStore((s) => s.openModal);
  const [mobileSearch, setMobileSearch] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center gap-2 px-4 sm:gap-3 lg:px-6 3xl:max-w-[1920px] 3xl:px-8">
        <a href="#/" className="flex shrink-0 items-center gap-2 lg:min-w-[240px] 3xl:min-w-[264px]" aria-label="Otaku — bosh sahifa">
          <OtakuMark className="h-7 w-7" />
          <span className="text-[17px] font-semibold tracking-tight text-fg">Otaku</span>
          <span className="rounded-md border border-line px-1.5 py-[1px] text-[9.5px] font-semibold tracking-wider text-fg-3">BETA</span>
        </a>

        <div className="hidden min-w-0 flex-1 items-center justify-center gap-2 md:flex">
          <SearchBar />
          <FilterPopover />
        </div>
        <div className="flex-1 md:hidden" />

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <IconButton label="Qidiruv" className="md:hidden" onClick={() => setMobileSearch((v) => !v)}>
            {mobileSearch ? <X className="h-[18px] w-[18px]" /> : <Search className="h-[18px] w-[18px]" />}
          </IconButton>
          <div className="hidden sm:block">
            <LivePill />
          </div>
          <IconButton label={theme === 'dark' ? 'Kunduzgi rejim' : 'Tungi rejim'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} />}
          </IconButton>
          {authed ? (
            <>
              <NotificationBell />
              <div className="hidden sm:block">
                <CreateButton />
              </div>
              <div className="ml-1">
                <UserMenu />
              </div>
            </>
          ) : (
            <button type="button" className={btn('contrast', 'sm', 'ml-1')} onClick={() => openModal({ type: 'auth' })}>
              <LogIn className="h-4 w-4" /> Kirish
            </button>
          )}
        </div>
      </div>
      {mobileSearch && (
        <div className="flex animate-pop-in items-center gap-2 border-t border-line px-4 py-2.5 md:hidden">
          <SearchBar autoFocus onDone={() => setMobileSearch(false)} />
          <FilterPopover />
        </div>
      )}
    </header>
  );
}
