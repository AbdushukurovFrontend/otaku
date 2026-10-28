import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { BADGES, XP_REWARDS, xpForLevel } from './gamification';
import {
  INITIAL_BOOKMARKS,
  INITIAL_PINNED,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_WATCH,
  createSeed,
} from './seed';
import type {
  Comment,
  Filters,
  Hub,
  ModLogEntry,
  ModalState,
  Notification,
  Post,
  Report,
  ReportReason,
  SortMode,
  Theme,
  Toast,
  TopPeriod,
  User,
} from './types';
import { uid } from './utils';

export const ME = 'u_me';

export const DEFAULT_FILTERS: Filters = {
  topics: [],
  kinds: [],
  genres: [],
  hideSpoilers: false,
  showNsfw: false,
};

interface DataState {
  theme: Theme;
  authed: boolean;
  clock: number;
  users: User[];
  hubs: Hub[];
  posts: Post[];
  comments: Comment[];
  notifications: Notification[];
  reports: Report[];
  modLog: ModLogEntry[];
  votes: Record<string, 1 | -1>;
  bookmarks: string[];
  subscriptions: string[];
  pinnedHubs: string[];
  watch: Record<string, number>;
  revealed: string[];
  pollVotes: Record<string, string>;
  edtRatings: Record<string, number>;
  filters: Filters;
  hubVisits: Record<string, number>;
  following: string[];
  archiveLoaded: Record<string, number>;
  feedSort: SortMode;
  topPeriod: TopPeriod;
}

interface UiState {
  modal: ModalState;
  toasts: Toast[];
}

export interface PostInput {
  kind: Post['kind'];
  hubId: string | null;
  title: string;
  body: string;
  image?: string;
  animeId?: string;
  topic: Post['topic'];
  tags: string[];
  spoiler: boolean;
  episode?: number;
  nsfw: boolean;
  review?: Post['review'];
  collection?: Post['collection'];
  pollOptions?: string[];
  pollDays?: number;
  newsSource?: string;
}

interface Actions {
  toggleTheme: () => void;
  requireAuth: () => boolean;
  vote: (key: string, dir: 1 | -1) => void;
  toggleBookmark: (postId: string) => void;
  toggleSubscribe: (hubId: string) => void;
  togglePin: (hubId: string) => void;
  setWatch: (animeId: string, ep: number | null) => void;
  reveal: (postId: string) => void;
  votePoll: (postId: string, optionId: string) => void;
  rateEdt: (postId: string, stars: number) => void;
  addComment: (postId: string, parentId: string | null, body: string) => string | null;
  savePost: (input: PostInput, asDraft: boolean, existingId?: string) => string | null;
  deleteDraft: (postId: string) => void;
  markSpoiler: (postId: string) => void;
  report: (targetType: 'post' | 'comment', targetId: string, reason: ReportReason, details: string) => void;
  resolveReport: (reportId: string, action: 'kept' | 'spoilered' | 'removed') => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  createHub: (input: { name: string; slug: string; description: string; topic: Post['topic']; icon: string; palette: [string, string, string]; rules: string[] }) => string | null;
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
  setFeedSort: (s: SortMode) => void;
  setTopPeriod: (p: TopPeriod) => void;
  visitHub: (hubId: string) => void;
  toggleFollow: (userId: string) => void;
  loadMoreArchive: (postId: string, step?: number) => void;
  updateProfile: (patch: { name: string; bio: string }) => void;
  gainXp: (amount: number, reason: string) => void;
  openModal: (m: ModalState) => void;
  closeModal: () => void;
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  login: () => void;
  logout: () => void;
  resetDemo: () => void;
  syncClock: () => void;
}

export type Store = DataState & UiState & Actions;

function initialData(): DataState {
  const now = Date.now();
  const seed = createSeed(now);
  return {
    theme: 'dark',
    authed: true,
    clock: now,
    users: seed.users,
    hubs: seed.hubs,
    posts: seed.posts,
    comments: seed.comments,
    notifications: seed.notifications,
    reports: seed.reports,
    modLog: seed.modLog,
    votes: { 'p:n3': 1, 'p:c1': 1, 'p:p1': 1 },
    bookmarks: INITIAL_BOOKMARKS,
    subscriptions: INITIAL_SUBSCRIPTIONS,
    pinnedHubs: INITIAL_PINNED,
    watch: INITIAL_WATCH,
    revealed: [],
    pollVotes: {},
    edtRatings: {},
    filters: DEFAULT_FILTERS,
    hubVisits: { frieren: now - 3 * 3_600_000, solo_leveling: now - 12 * 3_600_000, anibla: now },
    following: ['u_umid', 'u_kamola', 'u_sardor'],
    archiveLoaded: {},
    feedSort: 'hot',
    topPeriod: 'week',
  };
}

const toggleIn = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialData(),
      modal: null,
      toasts: [],

      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      requireAuth: () => {
        if (get().authed) return true;
        set({ modal: { type: 'auth' } });
        return false;
      },

      vote: (key, dir) => {
        if (!get().requireAuth()) return;
        set((s) => {
          const votes = { ...s.votes };
          if (votes[key] === dir) delete votes[key];
          else votes[key] = dir;
          return { votes };
        });
      },

      toggleBookmark: (postId) => {
        if (!get().requireAuth()) return;
        const had = get().bookmarks.includes(postId);
        set((s) => ({ bookmarks: toggleIn(s.bookmarks, postId) }));
        get().toast({
          tone: 'success',
          title: had ? "Xatcho'plardan olib tashlandi" : "Xatcho'plarga saqlandi",
          action: had ? undefined : { label: "Ko'rish", href: '/me/bookmarks' },
        });
      },

      toggleSubscribe: (hubId) => {
        if (!get().requireAuth()) return;
        const was = get().subscriptions.includes(hubId);
        set((s) => ({
          subscriptions: toggleIn(s.subscriptions, hubId),
          pinnedHubs: was ? s.pinnedHubs.filter((h) => h !== hubId) : s.pinnedHubs,
          hubs: s.hubs.map((h) => (h.id === hubId ? { ...h, members: h.members + (was ? -1 : 1) } : h)),
        }));
        const hub = get().hubs.find((h) => h.id === hubId);
        get().toast({
          tone: was ? 'info' : 'success',
          title: was ? `@${hubId} obunasi bekor qilindi` : `@${hubId} ga obuna bo'ldingiz`,
          description: was ? undefined : hub?.kind === 'anime' ? "Yangi qismlar EDT'si bildirishnomalarda chiqadi" : undefined,
        });
      },

      togglePin: (hubId) => set((s) => ({ pinnedHubs: toggleIn(s.pinnedHubs, hubId) })),

      setWatch: (animeId, ep) =>
        set((s) => {
          const watch = { ...s.watch };
          if (ep === null) delete watch[animeId];
          else watch[animeId] = ep;
          const related = new Set(s.posts.filter((p) => p.animeId === animeId).map((p) => p.id));
          return { watch, revealed: s.revealed.filter((id) => !related.has(id)) };
        }),

      reveal: (postId) => set((s) => ({ revealed: s.revealed.includes(postId) ? s.revealed : [...s.revealed, postId] })),

      votePoll: (postId, optionId) => {
        if (!get().requireAuth()) return;
        const first = !get().pollVotes[postId];
        set((s) => ({ pollVotes: { ...s.pollVotes, [postId]: optionId } }));
        if (first) get().gainXp(XP_REWARDS.poll, 'Ovoz berildi');
      },

      rateEdt: (postId, stars) => {
        if (!get().requireAuth()) return;
        const first = !get().edtRatings[postId];
        set((s) => ({ edtRatings: { ...s.edtRatings, [postId]: stars } }));
        if (first) get().gainXp(XP_REWARDS.rating, `Qismga ${stars} yulduz berildi`);
      },

      addComment: (postId, parentId, body) => {
        if (!get().requireAuth()) return null;
        const text = body.trim();
        if (!text) return null;
        const id = uid('c');
        const comment: Comment = { id, postId, parentId, authorId: ME, body: text, createdAt: Date.now(), score: 0 };
        set((s) => ({ comments: [...s.comments, comment], votes: { ...s.votes, [`c:${id}`]: 1 } }));
        get().gainXp(XP_REWARDS.comment, parentId ? 'Javob yozildi' : 'Izoh yozildi');
        return id;
      },

      savePost: (input, asDraft, existingId) => {
        if (!get().requireAuth()) return null;
        const now = Date.now();
        const id = existingId ?? uid('p');
        const post: Post = {
          id,
          kind: input.kind,
          hubId: input.hubId,
          authorId: ME,
          title: input.title.trim(),
          body: input.body,
          image: input.image?.trim() || undefined,
          animeId: input.animeId,
          topic: input.topic,
          tags: input.tags,
          createdAt: now,
          score: 0,
          commentBase: 0,
          episode: input.spoiler && input.episode ? input.episode : undefined,
          spoiler: input.spoiler,
          nsfw: input.nsfw,
          status: asDraft ? 'draft' : 'public',
          review: input.kind === 'review' ? input.review : undefined,
          collection: input.kind === 'collection' ? input.collection : undefined,
          poll:
            input.kind === 'poll'
              ? {
                  endsAt: now + (input.pollDays ?? 3) * 86_400_000,
                  options: (input.pollOptions ?? []).filter((o) => o.trim()).map((text, i) => ({ id: `o${i}`, text: text.trim(), votes: 0 })),
                }
              : undefined,
          news: input.kind === 'news' ? { source: input.newsSource?.trim() || 'Otaku muallifi', official: false } : undefined,
        };
        set((s) => ({
          posts: existingId ? s.posts.map((p) => (p.id === existingId ? post : p)) : [post, ...s.posts],
          votes: asDraft ? s.votes : { ...s.votes, [`p:${id}`]: 1 },
        }));
        if (asDraft) {
          get().toast({ tone: 'info', title: 'Qoralamaga saqlandi', description: 'Profil → Qoralamalar bo\'limidan davom ettirishingiz mumkin', action: { label: 'Ochish', href: '/me/drafts' } });
        } else {
          get().gainXp(XP_REWARDS.post, 'Post nashr qilindi');
        }
        return id;
      },

      deleteDraft: (postId) => {
        set((s) => ({ posts: s.posts.filter((p) => p.id !== postId) }));
        get().toast({ tone: 'info', title: "Qoralama o'chirildi" });
      },

      markSpoiler: (postId) => {
        set((s) => ({
          posts: s.posts.map((p) => (p.id === postId ? { ...p, spoiler: true } : p)),
          revealed: s.revealed.filter((r) => r !== postId),
        }));
        get().toast({ tone: 'success', title: 'Post spoyler deb belgilandi', description: 'Endi u Spoyler Darvozasi ortida ko\'rinadi' });
      },

      report: (targetType, targetId, reason, details) => {
        if (!get().requireAuth()) return;
        const r: Report = { id: uid('rep'), targetType, targetId, reason, details, reporterId: ME, createdAt: Date.now(), status: 'open' };
        set((s) => ({ reports: [r, ...s.reports], modal: null }));
        get().toast({
          tone: 'success',
          title: 'Shikoyat yuborildi',
          description: 'Moderatorlar uni Mod Queue navbatida ko\'rib chiqadi',
          action: { label: 'Mod Queue', href: '/mod' },
        });
      },

      resolveReport: (reportId, action) => {
        const s = get();
        const r = s.reports.find((x) => x.id === reportId);
        if (!r) return;
        const now = Date.now();
        let summary = '';
        let posts = s.posts;
        let comments = s.comments;
        if (r.targetType === 'post') {
          const p = s.posts.find((x) => x.id === r.targetId);
          summary = `«${p?.title ?? 'Post'}»`;
          posts = s.posts.map((x) =>
            x.id === r.targetId
              ? { ...x, spoiler: action === 'spoilered' ? true : x.spoiler, removed: action === 'removed' ? true : x.removed }
              : x,
          );
        } else {
          const c = s.comments.find((x) => x.id === r.targetId);
          const author = s.users.find((u) => u.id === c?.authorId);
          summary = `@${author?.handle ?? 'user'} izohi: «${(c?.body ?? '').slice(0, 60)}${(c?.body.length ?? 0) > 60 ? '…' : ''}»`;
          comments = s.comments.map((x) =>
            x.id === r.targetId
              ? {
                  ...x,
                  removed: action === 'removed' ? true : x.removed,
                  body: action === 'spoilered' && !x.body.startsWith('||') ? `||${x.body}||` : x.body,
                }
              : x,
          );
        }
        const labels = { kept: 'Qoldirildi', spoilered: 'Spoyler deb belgilandi', removed: 'Yashirildi' } as const;
        const entry: ModLogEntry = {
          id: uid('ml'),
          action,
          targetType: r.targetType,
          targetId: r.targetId,
          summary: `${labels[action]}: ${summary}`,
          moderator: s.users.find((u) => u.id === ME)?.handle ?? 'gintoku_uz',
          at: now,
        };
        set({
          posts,
          comments,
          reports: s.reports.map((x) =>
            x.targetId === r.targetId && x.status === 'open' ? { ...x, status: action, resolvedAt: now } : x,
          ),
          modLog: [entry, ...s.modLog],
        });
        get().toast({ tone: 'success', title: labels[action], description: "Harakat Mod Log'ga yozildi" });
      },

      markNotificationRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),

      markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      createHub: (input) => {
        if (!get().requireAuth()) return null;
        const s = get();
        if (s.hubs.some((h) => h.id === input.slug)) {
          get().toast({ tone: 'error', title: `@${input.slug} band`, description: 'Boshqa manzil tanlang' });
          return null;
        }
        const hub: Hub = {
          id: input.slug,
          name: input.name.trim(),
          kind: 'topic',
          topic: input.topic,
          description: input.description.trim(),
          members: 1,
          online: 1,
          rules: input.rules.filter((r) => r.trim()),
          genres: [],
          official: false,
          icon: input.icon,
          palette: input.palette,
          createdAt: Date.now(),
          moderators: [ME],
        };
        const me = s.users.find((u) => u.id === ME)!;
        const newBadge = !me.badges.includes('founder');
        set({
          hubs: [...s.hubs, hub],
          subscriptions: [...s.subscriptions, hub.id],
          pinnedHubs: [...s.pinnedHubs, hub.id],
          users: newBadge ? s.users.map((u) => (u.id === ME ? { ...u, badges: [...u.badges, 'founder'] } : u)) : s.users,
        });
        get().gainXp(XP_REWARDS.hub, `@${hub.id} Hub'i ochildi`);
        if (newBadge) {
          get().toast({ tone: 'level', title: `Yangi nishon: ${BADGES.founder.name}`, description: BADGES.founder.description });
        }
        return hub.id;
      },

      setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
      setFeedSort: (feedSort) => set({ feedSort }),
      setTopPeriod: (topPeriod) => set({ topPeriod }),
      visitHub: (hubId) => set((s) => ({ hubVisits: { ...s.hubVisits, [hubId]: Date.now() } })),

      toggleFollow: (userId) => {
        if (!get().requireAuth()) return;
        const was = get().following.includes(userId);
        set((s) => ({
          following: toggleIn(s.following, userId),
          users: s.users.map((u) => (u.id === userId ? { ...u, followers: u.followers + (was ? -1 : 1) } : u)),
        }));
      },

      loadMoreArchive: (postId, step = 8) =>
        set((s) => ({ archiveLoaded: { ...s.archiveLoaded, [postId]: (s.archiveLoaded[postId] ?? 0) + step } })),

      updateProfile: ({ name, bio }) => {
        set((s) => ({ users: s.users.map((u) => (u.id === ME ? { ...u, name: name.trim() || u.name, bio: bio.trim() } : u)) }));
        get().toast({ tone: 'success', title: 'Profil yangilandi' });
      },

      gainXp: (amount, reason) => {
        const s = get();
        const me = s.users.find((u) => u.id === ME)!;
        let { xp, level } = me;
        xp += amount;
        let leveled = false;
        while (xp >= xpForLevel(level)) {
          xp -= xpForLevel(level);
          level += 1;
          leveled = true;
        }
        set({ users: s.users.map((u) => (u.id === ME ? { ...u, xp, level, karma: u.karma + (amount >= 10 ? 1 : 0) } : u)) });
        get().toast({ tone: 'xp', title: `+${amount} XP`, description: reason });
        if (leveled) get().toast({ tone: 'level', title: `Yangi daraja: Lv.${level}!`, description: 'Tabriklaymiz, otaku!' });
      },

      openModal: (modal) => {
        if (modal && modal.type !== 'auth' && modal.type !== 'settings' && !get().authed) {
          set({ modal: { type: 'auth' } });
          return;
        }
        set({ modal });
      },
      closeModal: () => set({ modal: null }),

      toast: (t) => set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id: uid('t') }] })),
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      login: () => {
        set({ authed: true, modal: null });
        get().toast({ tone: 'success', title: 'Xush kelibsiz, Gintoku!', description: 'AniBla akkauntingiz Otaku bilan sinxronlandi' });
      },
      logout: () => {
        set({ authed: false, modal: { type: 'auth' } });
      },

      resetDemo: () => {
        const theme = get().theme;
        set({ ...initialData(), theme, modal: null, toasts: [] });
        get().toast({ tone: 'success', title: "Demo ma'lumotlar tiklandi", description: "Barcha postlar, ovozlar va sozlamalar boshlang'ich holatda" });
      },

      /**
       * Keeps the demo feeling live: time spent away from the app is "paused",
       * so "2 soat oldin" stays meaningful when the demo is reopened days later.
       */
      syncClock: () => {
        const s = get();
        const now = Date.now();
        const gap = now - s.clock;
        if (gap < 30 * 60_000) {
          set({ clock: now });
          return;
        }
        const sh = (t: number) => t + gap;
        set({
          clock: now,
          posts: s.posts.map((p) => ({ ...p, createdAt: sh(p.createdAt), poll: p.poll ? { ...p.poll, endsAt: sh(p.poll.endsAt) } : undefined })),
          comments: s.comments.map((c) => ({ ...c, createdAt: sh(c.createdAt) })),
          notifications: s.notifications.map((n) => ({ ...n, createdAt: sh(n.createdAt) })),
          reports: s.reports.map((r) => ({ ...r, createdAt: sh(r.createdAt), resolvedAt: r.resolvedAt ? sh(r.resolvedAt) : undefined })),
          modLog: s.modLog.map((m) => ({ ...m, at: sh(m.at) })),
          hubVisits: Object.fromEntries(Object.entries(s.hubVisits).map(([k, v]) => [k, sh(v)])),
        });
      },
    }),
    {
      name: 'otaku-store',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ modal, toasts, ...rest }) => {
        void modal;
        void toasts;
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')) as Partial<Store>;
      },
    },
  ),
);

export const useMe = () => useStore((s) => s.users.find((u) => u.id === ME)!);
