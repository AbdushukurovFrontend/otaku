import {
  BadgeCheck,
  ChartColumnBig,
  ListOrdered,
  MessageSquareText,
  Newspaper,
  Pin,
  Radio,
  Star,
} from 'lucide-react';
import { BADGES, rankFor } from '@/lib/gamification';
import type { Post, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DynIcon } from './Icon';
import { MetaChip } from './primitives';
import { TOPIC_BY_ID } from './topics';

/** Quiet monochrome rank label ("Senpai"). Bots get nothing, official accounts a single check. */
export function LevelBadge({ user, className }: { user?: User; className?: string }) {
  if (!user || user.bot) return null;
  if (user.verified)
    return (
      <span className={cn('inline-flex items-center gap-1 rounded-md bg-chip px-2 py-0.5 text-[11px] font-medium text-fg-2', className)}>
        <BadgeCheck className="h-3 w-3 text-indigo-500" /> Rasmiy
      </span>
    );
  const rank = rankFor(user.level);
  return (
    <span className={cn('inline-flex items-center rounded-md bg-chip px-2 py-0.5 text-[11px] font-medium text-fg-2', className)} title={`Lv.${user.level} ${rank.name}`}>
      {rank.name}
    </span>
  );
}

/** Monochrome hexagon medal: earned = solid contrast, locked = dashed outline. */
export function BadgeMedal({ id, size = 56, locked }: { id: string; size?: number; locked?: boolean }) {
  const badge = BADGES[id];
  if (!badge) return null;
  const hex = 'M32 3 L57 17.5 L57 46.5 L32 61 L7 46.5 L7 17.5 Z';
  return (
    <span className={cn('relative inline-grid shrink-0 place-items-center', locked ? 'text-fg-3' : 'text-contrast-fg')} style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full">
        {locked ? (
          <path d={hex} fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="4 4" />
        ) : (
          <>
            <path d={hex} className="fill-contrast" />
            <path d="M32 9 L52 20.5 L52 43.5 L32 55 L12 43.5 L12 20.5 Z" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1" />
          </>
        )}
      </svg>
      <DynIcon name={badge.icon} className="relative" style={{ width: size * 0.36, height: size * 0.36 }} strokeWidth={1.8} />
    </span>
  );
}

export const KIND_META: Record<Post['kind'], { label: string; icon: typeof Star }> = {
  post: { label: 'Xabar', icon: MessageSquareText },
  edt: { label: 'EDT', icon: Radio },
  review: { label: 'Sharh', icon: Star },
  collection: { label: "To'plam", icon: ListOrdered },
  poll: { label: "So'rovnoma", icon: ChartColumnBig },
  news: { label: 'Yangilik', icon: Newspaper },
};

/** The one meta chip a card is allowed: "Qadalgan · 12-qism EDT", "Sharh ★ 9.5", "Rasmiy yangilik"... */
export function KindChip({ post, showPinned = true }: { post: Post; showPinned?: boolean }) {
  const pinned = post.pinned && showPinned;
  let label: React.ReactNode;
  let icon: React.ReactNode = pinned ? <Pin /> : null;
  switch (post.kind) {
    case 'edt':
      label = `${pinned ? 'Qadalgan · ' : ''}${post.edt?.episode}-qism EDT`;
      break;
    case 'review':
      label = (
        <>
          Sharh <Star className="!h-3 !w-3 fill-amber-400 text-amber-400" /> <span className="tabular-nums">{post.review?.overall.toFixed(1)}</span>
        </>
      );
      icon = pinned ? icon : null;
      break;
    case 'collection':
      label = `To'plam · ${post.collection?.length ?? 0} ta`;
      break;
    case 'poll':
      label = "So'rovnoma";
      break;
    case 'news':
      label = `${pinned ? 'Qadalgan · ' : ''}${post.news?.official ? 'Rasmiy yangilik' : 'Yangilik'}`;
      break;
    default:
      label = `${pinned ? 'Qadalgan · ' : ''}${TOPIC_BY_ID[post.topic]?.label ?? 'Xabar'}`;
  }
  return <MetaChip icon={icon}>{label}</MetaChip>;
}
