import { useEffect, useMemo } from 'react';
import { ModalHost } from '@/components/modals/ModalHost';
import { Header } from '@/components/shell/Header';
import { LeftNav } from '@/components/shell/LeftNav';
import { MobileNav } from '@/components/shell/MobileNav';
import { RightRail } from '@/components/shell/RightRail';
import { Toaster } from '@/components/ui/Toaster';
import { useRoute, type Route } from '@/lib/router';
import { useStore } from '@/lib/store';
import { FeedPage } from '@/pages/FeedPage';
import { HubPage } from '@/pages/HubPage';
import { HubsPage } from '@/pages/HubsPage';
import { ModPage } from '@/pages/ModPage';
import { PostPage } from '@/pages/PostPage';
import { ProfilePage } from '@/pages/ProfilePage';

function routeKey(r: Route): string {
  switch (r.name) {
    case 'feed':
      return `feed:${r.kind}:${r.topic ?? ''}`;
    case 'hub':
      return `hub:${r.id}`;
    case 'post':
      return `post:${r.id}`;
    case 'profile':
      return `profile:${r.handle ?? 'me'}`;
    case 'hubs':
      return 'hubs';
    case 'mod':
      return 'mod';
  }
}

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case 'feed':
      return <FeedPage kind={route.kind} topic={route.topic} />;
    case 'hubs':
      return <HubsPage tab={route.tab} />;
    case 'hub':
      return <HubPage id={route.id} tab={route.tab} />;
    case 'post':
      return <PostPage id={route.id} />;
    case 'profile':
      return <ProfilePage handle={route.handle} tab={route.tab} />;
    case 'mod':
      return <ModPage />;
  }
}

/**
 * Full-bleed ambient mesh: one fixed layer of pure radial gradients sized in
 * viewport units, so it covers 4K / ultra-wide edge to edge with no blur filter.
 */
function AmbientGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-screen w-full"
      style={{
        background: [
          'radial-gradient(48vw 46vh at 14% -6%, var(--glow-a), transparent 72%)',
          'radial-gradient(44vw 42vh at 88% -4%, var(--glow-b), transparent 70%)',
          'radial-gradient(36vw 34vh at 52% 18%, var(--glow-c), transparent 72%)',
        ].join(','),
      }}
    />
  );
}

export default function App() {
  const route = useRoute();
  const theme = useStore((s) => s.theme);
  const authed = useStore((s) => s.authed);
  const modal = useStore((s) => s.modal);
  const openModal = useStore((s) => s.openModal);
  const syncClock = useStore((s) => s.syncClock);
  const key = useMemo(() => routeKey(route), [route]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#090A0D' : '#F5F6F9');
  }, [theme]);

  useEffect(() => {
    syncClock();
    const id = window.setInterval(syncClock, 60_000);
    return () => window.clearInterval(id);
  }, [syncClock]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [key]);

  useEffect(() => {
    if (!authed && !modal) openModal({ type: 'auth' });
  }, [authed, modal, openModal]);

  return (
    <div className="relative min-h-screen w-full overflow-x-clip">
      <AmbientGlow />
      <Header />
      {/* App shell: backgrounds stay full-bleed, content is capped and centred (1600 → 1920 on 3xl). */}
      <div className="relative mx-auto flex w-full max-w-[1600px] gap-6 px-4 pb-28 pt-5 lg:px-6 lg:pb-12 3xl:max-w-[1920px] 3xl:gap-8 3xl:px-8">
        <aside className="sticky top-[76px] hidden h-[calc(100vh-92px)] w-[240px] shrink-0 lg:block 3xl:w-[264px]">
          <LeftNav route={route} />
        </aside>
        <main key={key} className="min-w-0 flex-1 animate-page-in">
          <Page route={route} />
        </main>
        <div className="sticky top-[76px] hidden h-[calc(100vh-92px)] w-[320px] shrink-0 xl:block 3xl:w-[360px]">
          <RightRail />
        </div>
      </div>
      <MobileNav route={route} />
      <ModalHost />
      <Toaster />
    </div>
  );
}
