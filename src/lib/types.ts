export type Theme = 'dark' | 'light';

export type PostKind = 'post' | 'edt' | 'review' | 'collection' | 'poll' | 'news';

export type Topic = 'anime' | 'manga' | 'theory' | 'fanart' | 'memes' | 'industry';

export type SortMode = 'hot' | 'new' | 'top' | 'following';
export type TopPeriod = 'day' | 'week' | 'month' | 'year';

export interface Anime {
  id: string;
  title: string;
  titleEn: string;
  cover: string;
  banner?: string;
  /** Mesh-gradient fallback palette: [accent, secondary, deep] */
  palette: [string, string, string];
  glyph: string;
  genres: string[];
  studio: string;
  year: number;
  season?: string;
  status: 'Ongoing' | 'Tugallangan';
  score: number;
  synopsis: string;
  /** Episode window covered by Otaku EDT threads (for long runners like One Piece). */
  epStart?: number;
  epEnd?: number;
  episodeTitles?: Record<number, string>;
}

export interface Hub {
  id: string;
  name: string;
  kind: 'anime' | 'topic';
  animeId?: string;
  topic?: Topic;
  description: string;
  members: number;
  online: number;
  rules: string[];
  genres: string[];
  official: boolean;
  icon?: string;
  palette: [string, string, string];
  createdAt: number;
  moderators: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tone: 'indigo' | 'rose' | 'amber' | 'emerald' | 'sky' | 'violet' | 'orange';
}

export interface User {
  id: string;
  handle: string;
  name: string;
  bio: string;
  level: number;
  xp: number;
  karma: number;
  streak: number;
  followers: number;
  following: number;
  palette: [string, string];
  badges: string[];
  joinedAt: number;
  verified?: boolean;
  bot?: boolean;
  favoriteGenres?: string[];
}

export interface ReviewData {
  plot: number;
  animation: number;
  music: number;
  characters: number;
  overall: number;
  recommended: boolean;
}

export interface CollectionItem {
  animeId?: string;
  title: string;
  note: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface EdtData {
  episode: number;
  episodeTitle: string;
  rating: number;
  ratingVotes: number;
}

export interface Post {
  id: string;
  kind: PostKind;
  hubId: string | null;
  authorId: string;
  title: string;
  body: string;
  image?: string;
  animeId?: string;
  topic: Topic;
  tags: string[];
  createdAt: number;
  score: number;
  commentBase: number;
  /** Episode this post refers to (drives the progress-aware spoiler gate). */
  episode?: number;
  spoiler: boolean;
  nsfw: boolean;
  pinned?: boolean;
  status: 'public' | 'draft';
  removed?: boolean;
  review?: ReviewData;
  collection?: CollectionItem[];
  poll?: { options: PollOption[]; endsAt: number };
  edt?: EdtData;
  news?: { source: string; official: boolean };
  meme?: { top: string; bottom: string };
}

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  authorId: string;
  body: string;
  createdAt: number;
  score: number;
  removed?: boolean;
}

export type NotificationType = 'edt' | 'reply' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  link: string;
}

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'spoiler'
  | 'nsfw'
  | 'violence'
  | 'copyright'
  | 'illegal'
  | 'other';

export interface Report {
  id: string;
  targetType: 'post' | 'comment';
  targetId: string;
  reason: ReportReason;
  details: string;
  reporterId: string;
  createdAt: number;
  status: 'open' | 'kept' | 'spoilered' | 'removed';
  resolvedAt?: number;
}

export interface ModLogEntry {
  id: string;
  action: 'kept' | 'spoilered' | 'removed' | 'reported';
  targetType: 'post' | 'comment';
  targetId: string;
  summary: string;
  moderator: string;
  at: number;
}

export interface Filters {
  topics: Topic[];
  kinds: PostKind[];
  genres: string[];
  hideSpoilers: boolean;
  showNsfw: boolean;
}

export interface Toast {
  id: string;
  tone: 'success' | 'info' | 'xp' | 'error' | 'level';
  title: string;
  description?: string;
  action?: { label: string; href: string };
}

export type ComposerKind = 'post' | 'collection' | 'review' | 'poll' | 'news';

export type ModalState =
  | { type: 'composer'; kind?: ComposerKind; hubId?: string | null; draftId?: string }
  | { type: 'report'; targetType: 'post' | 'comment'; targetId: string }
  | { type: 'auth' }
  | { type: 'createHub' }
  | { type: 'settings' }
  | null;
