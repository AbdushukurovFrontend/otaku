import { ArrowUpRight, CalendarDays, Check, FilePen, Flame, Lock, Pencil, Trash, UserPlus, UserRound } from 'lucide-react';
import { useMemo } from 'react';
import { USER_AVATARS } from '@/lib/avatars';
import { ANIME_BY_ID, episodeRange } from '@/lib/catalog';
import { BADGES, BADGE_ORDER, RANKS, nextRank, rankFor, xpForLevel } from '@/lib/gamification';
import { navigate, type ProfileTab } from '@/lib/router';
import { useFeed } from '@/lib/selectors';
import { ME, useStore } from '@/lib/store';
import type { Post, User } from '@/lib/types';
import { cn, fmt, formatDate, timeAgo } from '@/lib/utils';
import { PostList } from '@/components/feed/FeedParts';
import { ANIBLA_URL } from '@/components/shell/HeaderWidgets';
import { XpRingAvatar } from '@/components/ui/Avatar';
import { BadgeMedal, KindChip } from '@/components/ui/Badges';
import { Card, EmptyState, MetaChip, ProgressBar, ReadingColumn, Segmented, btn } from '@/components/ui/primitives';
import { SmartPoster } from '@/components/ui/SmartPoster';

export function ProfilePage({ handle, tab }: { handle: string | null; tab: ProfileTab }) {
  const user = useStore((s) => (handle ? s.users.find((u) => u.handle === handle) : s.users.find((u) => u.id === ME)));
  if (!user) {
    return (
      <ReadingColumn>
        <EmptyState
          icon={<UserRound className="h-5 w-5" />}
          title="Foydalanuvchi topilmadi"
          description={`@${handle} mavjud emas.`}
          action={
            <a href="#/" className={btn('contrast', 'md')}>
              Tasmaga qaytish
            </a>
          }
        />
      </ReadingColumn>
    );
  }
  const isMe = user.id === ME;
  return <Profile user={user} isMe={isMe} tab={!isMe && (tab === 'bookmarks' || tab === 'drafts') ? 'posts' : tab} />;
}

function Profile({ user, isMe, tab }: { user: User; isMe: boolean; tab: ProfileTab }) {
  const subs = useStore((s) => s.subscriptions);
  const following = useStore((s) => s.following.includes(user.id));
  const toggleFollow = useStore((s) => s.toggleFollow);
  const openModal = useStore((s) => s.openModal);
  const posts = useStore((s) => s.posts);
  const bookmarks = useStore((s) => s.bookmarks);
  const rank = rankFor(user.level);
  const base = isMe ? '/me' : `/u/${user.handle}`;
  const drafts = posts.filter((p) => p.authorId === ME && p.status === 'draft');
  const communities = isMe ? subs.length : 4 + (user.level % 9);
  const portrait = USER_AVATARS[user.id];

  const tabs: { value: ProfileTab; label: string; count?: number }[] = [
    { value: 'posts', label: 'Yozuvlar' },
    { value: 'reviews', label: 'Sharhlar' },
    ...(isMe
      ? [
          { value: 'bookmarks' as ProfileTab, label: "Xatcho'plar", count: bookmarks.length },
          { value: 'drafts' as ProfileTab, label: 'Qoralamalar', count: drafts.length },
        ]
      : []),
    { value: 'about', label: 'Haqida' },
  ];

  return (
    <div>
      <div className="mb-3 overflow-hidden rounded-[20px] border border-line bg-panel shadow-panel">
        {/* Cover: the user's own portrait, defocused into a neutral film still */}
        <div className="relative h-36 overflow-hidden bg-zinc-950 sm:h-44">
          {portrait && <img src={portrait} alt="" aria-hidden referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full scale-125 object-cover object-top opacity-70 blur-2xl saturate-150" />}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/30 to-transparent" />
          <span className="absolute bottom-3 right-5 font-jp text-[48px] font-bold leading-none text-white/10 sm:text-[64px]">{rank.jp}</span>
        </div>
        <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end">
          <span className="-mt-12 w-fit rounded-full bg-panel p-1">
            <XpRingAvatar user={user} size={88} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-semibold tracking-tight text-fg">{user.name}</h1>
              {!user.bot && (
                <MetaChip>
                  {user.verified ? 'Rasmiy' : `Lv. ${user.level} · ${rank.name}`}
                </MetaChip>
              )}
            </div>
            <p className="text-[13px] text-fg-3">@{user.handle}</p>
            {user.bio && <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-fg-2">{user.bio}</p>}
          </div>
          <div className="flex shrink-0 gap-2">
            {isMe ? (
              <button type="button" className={btn('secondary', 'sm')} onClick={() => openModal({ type: 'settings' })}>
                <Pencil className="h-3.5 w-3.5" /> Profilni tahrirlash
              </button>
            ) : (
              <button type="button" className={btn(following ? 'secondary' : 'contrast', 'sm')} onClick={() => toggleFollow(user.id)}>
                {following ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Kuzatilmoqda
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" /> Kuzatish
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-4 divide-x divide-line border-t border-line-subtle">
          {[
            { label: 'Obunachilar', value: fmt(user.followers) },
            { label: 'Obunalar', value: fmt(user.following) },
            { label: 'Jamiyatlar', value: fmt(communities) },
            { label: 'Karma', value: fmt(user.karma) },
          ].map((s) => (
            <div key={s.label} className="px-2 py-3 text-center">
              <p className="text-base font-bold tabular-nums text-fg">{s.value}</p>
              <p className="text-[11px] text-fg-3">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <XpCard user={user} />
      <BadgeShowcase user={user} />
      {isMe && <WatchList />}

      <ReadingColumn>
        <div className="sticky top-14 z-20 -mx-1 mb-3 bg-[color-mix(in_srgb,var(--bg)_85%,transparent)] px-1 py-2.5 backdrop-blur-xl">
          <Segmented value={tab} onChange={(v) => navigate(`${base}${v === 'posts' ? '' : `/${v}`}`)} options={tabs} />
        </div>
        <ProfileTabContent user={user} isMe={isMe} tab={tab} drafts={drafts} />
      </ReadingColumn>
    </div>
  );
}

function XpCard({ user }: { user: User }) {
  const rank = rankFor(user.level);
  const next = nextRank(user.level);
  const need = xpForLevel(user.level);
  const currentIndex = Math.max(0, RANKS.findIndex((r) => r.name === rank.name));
  return (
    <Card className="mb-3 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">Unvon va XP</p>
          <p className="mt-1 text-[17px] font-semibold text-fg">
            Lv. {user.level} — {rank.name} <span className="font-jp text-[14px] font-normal text-fg-3">{rank.jp}</span>
          </p>
          {next && (
            <p className="text-[12.5px] text-fg-3">
              Keyingi unvon: <span className="font-medium text-fg-2">{next.name}</span> (Lv.{next.level}) — {next.level - user.level} daraja qoldi
            </p>
          )}
        </div>
        <div className="flex gap-1.5">
          <MetaChip icon={<Flame />}>{user.streak} kunlik streak</MetaChip>
          <MetaChip>{fmt(user.karma)} karma</MetaChip>
        </div>
      </div>
      <div className="mt-4">
        <ProgressBar value={(user.xp / need) * 100} />
        <p className="mt-1.5 flex justify-between text-[11.5px] tabular-nums text-fg-3">
          <span>
            {fmt(user.xp)} / {fmt(need)} XP
          </span>
          <span>Post +15 · Izoh +3 · Ovoz +2 · Hub +25</span>
        </p>
      </div>
      <div className="no-scrollbar -mx-5 mt-5 overflow-x-auto px-5">
        <div className="relative flex min-w-[600px] justify-between">
          <div className="absolute left-5 right-5 top-5 h-px bg-line-strong" />
          <div
            className="absolute left-5 right-5 top-5 h-px origin-left transform-gpu animate-grow-x bg-indigo-500 transition-gpu duration-700"
            style={{ transform: `scaleX(${currentIndex / (RANKS.length - 1)})` }}
          />
          {RANKS.map((r, i) => {
            const reached = user.level >= r.level;
            const current = i === currentIndex;
            return (
              <div key={r.name} className="relative flex w-[80px] flex-col items-center text-center">
                <span
                  className={cn(
                    'grid h-10 w-10 place-items-center rounded-full font-jp text-[13px] font-semibold',
                    reached ? 'bg-contrast text-contrast-fg' : 'border border-dashed border-line-strong bg-panel text-fg-3',
                    current && 'ring-4 ring-indigo-500/20',
                  )}
                >
                  {reached ? r.jp.slice(0, 2) : <Lock className="h-3.5 w-3.5" />}
                </span>
                <span className={cn('mt-2 text-[12px] font-medium', reached ? 'text-fg' : 'text-fg-3')}>{r.name}</span>
                <span className="text-[11px] tabular-nums text-fg-3">Lv.{r.level}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function BadgeShowcase({ user }: { user: User }) {
  const earned = BADGE_ORDER.filter((b) => user.badges.includes(b));
  const locked = BADGE_ORDER.filter((b) => !user.badges.includes(b));
  return (
    <Card className="mb-3 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">Nishonlar</p>
        <span className="text-[12px] tabular-nums text-fg-3">
          {earned.length} / {BADGE_ORDER.length}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
        {[...earned, ...locked].map((id) => {
          const b = BADGES[id];
          const isLocked = !user.badges.includes(id);
          return (
            <div key={id} className="group flex flex-col items-center text-center" title={b.description}>
              <span className="transition-transform duration-200 group-hover:-translate-y-0.5">
                <BadgeMedal id={id} size={48} locked={isLocked} />
              </span>
              <span className={cn('mt-1.5 text-[11.5px] font-medium leading-tight', isLocked ? 'text-fg-3' : 'text-fg')}>{b.name}</span>
              <span className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-fg-3">{b.description}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

const FINISHED = ['vinland_saga', 'attack_on_titan', 'steins_gate', 'fmab', 'death_note', 'your_name'];

function WatchList() {
  const watch = useStore((s) => s.watch);
  const watching = ['frieren', 'solo_leveling', 'sakamoto_days', 'one_piece'];
  return (
    <Card className="mb-3 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">AniBla ko'rish ro'yxati</p>
          <p className="text-[12.5px] text-fg-3">Spoyler himoyasi shu progress bilan sinxron</p>
        </div>
        <a href={ANIBLA_URL} target="_blank" rel="noreferrer" className={btn('secondary', 'xs')}>
          AniBla profili <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
      <p className="mb-2 text-[12.5px] font-medium text-fg-2">Ko'ryapman</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {watching.map((id) => {
          const a = ANIME_BY_ID[id];
          const [start, end] = episodeRange(a);
          const w = watch[id] ?? end;
          const pct = ((w - start + 1) / (end - start + 1)) * 100;
          return (
            <a key={id} href={`#/h/${id}`} className="flex items-center gap-3 rounded-xl border border-line-subtle bg-sunken p-2.5 transition-colors hover:border-line">
              <SmartPoster animeId={id} emblem="mini" className="h-14 w-10 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-fg">{a.title}</p>
                <p className="text-[11.5px] tabular-nums text-fg-3">
                  {w >= end ? "Eng so'nggi qismgacha" : `${w}-qismgacha`} · jami {end}
                </p>
                <ProgressBar value={pct} className="mt-1.5 h-1" />
              </div>
            </a>
          );
        })}
      </div>
      <p className="mb-2 mt-5 text-[12.5px] font-medium text-fg-2">Tugatildi</p>
      <div className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1">
        {FINISHED.map((id) => {
          const a = ANIME_BY_ID[id];
          return (
            <div key={id} className="w-[84px] shrink-0">
              <SmartPoster animeId={id} emblem="mini" className="aspect-[2/3] w-full rounded-xl">
                <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              </SmartPoster>
              <p className="mt-1 truncate text-[11.5px] font-medium text-fg">{a.title}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ProfileTabContent({ user, isMe, tab, drafts }: { user: User; isMe: boolean; tab: ProfileTab; drafts: Post[] }) {
  const authored = useFeed({ authorId: user.id, sort: 'new', includeAllEdts: true });
  const allPosts = useStore((s) => s.posts);
  const bookmarks = useStore((s) => s.bookmarks);
  const openModal = useStore((s) => s.openModal);
  const deleteDraft = useStore((s) => s.deleteDraft);
  const saved = useMemo(
    () => bookmarks.map((id) => allPosts.find((p) => p.id === id)).filter((p): p is Post => !!p && p.status === 'public' && !p.removed),
    [bookmarks, allPosts],
  );

  if (tab === 'posts')
    return (
      <PostList
        posts={authored}
        empty={{
          title: isMe ? 'Siz hali post yozmagansiz' : "Hali post yo'q",
          description: isMe ? 'Birinchi postingizni nashr qiling va +15 XP oling.' : undefined,
          action: isMe ? (
            <button type="button" className={btn('contrast', 'md')} onClick={() => openModal({ type: 'composer' })}>
              Post yozish
            </button>
          ) : undefined,
        }}
      />
    );
  if (tab === 'reviews') return <PostList posts={authored.filter((p) => p.kind === 'review')} empty={{ title: "Sharhlar yo'q", description: '10 ballik taqrizlar shu yerda chiqadi.' }} />;
  if (tab === 'bookmarks') return <PostList posts={saved} empty={{ title: "Xatcho'plar bo'sh", description: 'Postlardagi «Saqlash» tugmasini bosing — ular shu yerda jamlanadi.' }} />;
  if (tab === 'drafts') {
    if (!drafts.length) return <EmptyState icon={<FilePen className="h-5 w-5" />} title="Qoralamalar yo'q" description="Post Studiyasida «Qoralamaga saqlash» tugmasini bosing." />;
    return (
      <Card className="divide-y divide-line-subtle">
        {drafts.map((d) => (
          <div key={d.id} className="flex flex-wrap items-center gap-4 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-sunken text-fg-3">
              <FilePen className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <KindChip post={d} showPinned={false} />
                <span className="text-[12px] text-fg-3">
                  {d.hubId ? `@${d.hubId}` : 'Profil'} · {timeAgo(d.createdAt)} saqlangan
                </span>
              </div>
              <p className="mt-1 truncate text-[14.5px] font-semibold text-fg">{d.title || 'Sarlavhasiz qoralama'}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className={btn('danger', 'sm')} onClick={() => deleteDraft(d.id)}>
                <Trash className="h-3.5 w-3.5" /> O'chirish
              </button>
              <button type="button" className={btn('contrast', 'sm')} onClick={() => openModal({ type: 'composer', draftId: d.id })}>
                <Pencil className="h-3.5 w-3.5" /> Davom ettirish
              </button>
            </div>
          </div>
        ))}
      </Card>
    );
  }
  return (
    <Card className="p-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">Bio</p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-fg-2">{user.bio || 'Bio yozilmagan.'}</p>
        </div>
        <div className="space-y-2.5">
          <p className="flex items-center gap-2 text-[13.5px] text-fg-2">
            <CalendarDays className="h-4 w-4 text-fg-3" strokeWidth={1.75} /> Otaku'da {formatDate(user.joinedAt)} dan beri
          </p>
          <p className="flex items-center gap-2 text-[13.5px] text-fg-2">
            <Flame className="h-4 w-4 text-fg-3" strokeWidth={1.75} /> {user.streak} kunlik faollik seriyasi
          </p>
          {user.favoriteGenres && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {user.favoriteGenres.map((g) => (
                <MetaChip key={g}>{g}</MetaChip>
              ))}
            </div>
          )}
          <p className="text-[12px] text-fg-3">Email va shaxsiy ma'lumotlar profilda ko'rsatilmaydi.</p>
        </div>
      </div>
    </Card>
  );
}
