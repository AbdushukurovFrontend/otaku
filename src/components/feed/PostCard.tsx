import { Bookmark, Ellipsis, EyeOff, Flag, Link2, MessageSquare, Share } from 'lucide-react';
import { memo } from 'react';
import { navigate } from '@/lib/router';
import { commentCount, useGate, useHub, useUser } from '@/lib/selectors';
import { ME, useStore } from '@/lib/store';
import type { Post } from '@/lib/types';
import { cn, fmt, timeAgo } from '@/lib/utils';
import { HubAvatar, UserAvatar } from '../ui/Avatar';
import { KindChip, LevelBadge } from '../ui/Badges';
import { KarmaCapsule } from '../ui/KarmaCapsule';
import { MenuItem, Popover } from '../ui/primitives';
import { RichText } from '../ui/RichText';
import { CollectionBlock, EdtBlock, PollBlock, PostMedia, ReviewBlock, edtTitle } from './PostBlocks';
import { SpoilerGate } from './SpoilerGate';

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

export function postUrl(id: string) {
  return `${window.location.origin}${window.location.pathname}#/p/${id}`;
}

/** One-line meta: hub avatar · @hub · @author · rank · time — and exactly one chip on the right. */
export function PostHeader({ post, large }: { post: Post; large?: boolean }) {
  const author = useUser(post.authorId);
  const hub = useHub(post.hubId);
  const authorHref = post.authorId === ME ? '#/me' : `#/u/${author?.handle}`;
  const isBot = !!author?.bot;
  return (
    <div className="flex items-center gap-2.5">
      {hub ? (
        <a href={`#/h/${hub.id}`} onClick={stop} className="shrink-0">
          <HubAvatar hub={hub} size={large ? 36 : 28} />
        </a>
      ) : (
        <a href={authorHref} onClick={stop} className="shrink-0">
          <UserAvatar user={author} size={large ? 36 : 28} />
        </a>
      )}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] leading-5">
        {hub ? (
          <a href={`#/h/${hub.id}`} onClick={stop} className="font-semibold text-fg hover:underline">
            @{hub.id}
          </a>
        ) : (
          <a href={authorHref} onClick={stop} className="font-semibold text-fg hover:underline">
            @{author?.handle}
          </a>
        )}
        {hub && !isBot && (
          <>
            <span className="text-fg-3">·</span>
            <a href={authorHref} onClick={stop} className="text-fg-2 hover:text-fg">
              @{author?.handle}
            </a>
          </>
        )}
        {!isBot && <LevelBadge user={author} />}
        <span className="text-fg-3">·</span>
        <time className="text-[12.5px] text-fg-3" dateTime={new Date(post.createdAt).toISOString()}>
          {timeAgo(post.createdAt)}
        </time>
      </div>
      <div className="hidden shrink-0 sm:block">
        <KindChip post={post} />
      </div>
    </div>
  );
}

const pill =
  'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-fg-3 transition-colors duration-150 hover:bg-hover hover:text-fg [&_svg]:h-[15px] [&_svg]:w-[15px]';

export function PostFooter({ post, onComment }: { post: Post; onComment?: () => void }) {
  const comments = useStore((s) => s.comments);
  const saved = useStore((s) => s.bookmarks.includes(post.id));
  const toggleBookmark = useStore((s) => s.toggleBookmark);
  const openModal = useStore((s) => s.openModal);
  const markSpoiler = useStore((s) => s.markSpoiler);
  const toast = useStore((s) => s.toast);
  const n = commentCount(post, comments);

  const share = async () => {
    const url = postUrl(post.id);
    try {
      await navigator.clipboard.writeText(url);
      toast({ tone: 'success', title: 'Havola nusxalandi', description: url.replace(/^https?:\/\//, '') });
    } catch {
      toast({ tone: 'info', title: 'Havola', description: url });
    }
  };

  return (
    <div className="flex items-center gap-1" onClick={stop}>
      <KarmaCapsule voteKey={`p:${post.id}`} base={post.score} />
      <button type="button" className={pill} onClick={() => (onComment ? onComment() : navigate(`/p/${post.id}`))}>
        <MessageSquare strokeWidth={1.75} />
        <span className="tabular-nums">{fmt(n)}</span>
        <span className="hidden sm:inline">izoh</span>
      </button>
      <button type="button" className={cn(pill, saved && 'text-fg')} onClick={() => toggleBookmark(post.id)} aria-pressed={saved}>
        <Bookmark className={cn(saved && 'fill-current')} strokeWidth={1.75} />
        <span className="hidden sm:inline">{saved ? 'Saqlangan' : 'Saqlash'}</span>
      </button>
      <button type="button" className={pill} onClick={share}>
        <Share strokeWidth={1.75} />
        <span className="hidden md:inline">Ulashish</span>
      </button>
      <Popover
        className="ml-auto"
        align="end"
        panelClassName="w-[210px] p-1.5"
        trigger={({ toggle }) => (
          <button type="button" aria-label="Boshqa amallar" onClick={toggle} className="grid h-8 w-8 place-items-center rounded-full text-fg-3 transition-colors hover:bg-hover hover:text-fg">
            <Ellipsis className="h-4 w-4" />
          </button>
        )}
      >
        {(close) => (
          <>
            <MenuItem
              icon={<Link2 className="h-4 w-4" />}
              onClick={() => {
                close();
                share();
              }}
            >
              Havolani nusxalash
            </MenuItem>
            {!post.spoiler && (
              <MenuItem
                icon={<EyeOff className="h-4 w-4" />}
                onClick={() => {
                  close();
                  markSpoiler(post.id);
                }}
              >
                Spoyler deb belgilash
              </MenuItem>
            )}
            <MenuItem
              danger
              icon={<Flag className="h-4 w-4" />}
              onClick={() => {
                close();
                openModal({ type: 'report', targetType: 'post', targetId: post.id });
              }}
            >
              Shikoyat qilish
            </MenuItem>
          </>
        )}
      </Popover>
    </div>
  );
}

export function PostContent({ post, detail }: { post: Post; detail?: boolean }) {
  const isEdt = post.kind === 'edt';
  const title = isEdt ? edtTitle(post) : post.title;
  const clamp = post.kind === 'post' || post.kind === 'news' ? 3 : 2;
  return (
    <>
      <h3
        className={cn(
          'font-semibold tracking-tight text-fg',
          detail ? 'text-[22px] leading-tight sm:text-[26px]' : isEdt ? 'text-[18px] leading-snug' : 'text-[16px] leading-snug',
        )}
      >
        {title}
      </h3>
      {isEdt ? (
        detail && (
          <p className="mt-2 text-[14.5px] leading-relaxed text-fg-2">
            Rasmiy epizod muhokamasi. Qism voqealarini bemalol muhokama qiling — post {post.edt?.episode}-qismni hali ko'rmaganlar uchun Spoyler Darvozasi bilan
            himoyalangan.
          </p>
        )
      ) : (
        post.body && (
          <RichText text={post.body} clamp={detail ? undefined : clamp} className={cn('mt-1.5 text-fg-2', detail ? 'text-[15px] leading-relaxed' : 'text-[14px] leading-relaxed')} />
        )
      )}
      {isEdt && <EdtBlock post={post} />}
      {post.kind === 'review' && <ReviewBlock post={post} />}
      {post.kind === 'collection' && <CollectionBlock post={post} expanded={detail} />}
      {post.kind === 'poll' && <PollBlock post={post} />}
      <PostMedia post={post} detail={detail} />
    </>
  );
}

export const PostCard = memo(function PostCard({ post }: { post: Post }) {
  const gate = useGate(post);
  const open = () => navigate(`/p/${post.id}`);

  return (
    <article
      onClick={open}
      className="relative cursor-pointer rounded-[20px] border border-line bg-panel p-5 shadow-panel transform-gpu transition-card duration-200 hover:z-10 hover:-translate-y-1 hover:border-line-strong focus-within:z-20"
    >
      <PostHeader post={post} />
      <div className={cn('relative mt-3', gate && 'min-h-[160px]')}>
        <div className={cn(gate && 'pointer-events-none select-none')} aria-hidden={!!gate}>
          <PostContent post={post} />
        </div>
        {gate && <SpoilerGate gate={gate} post={post} />}
      </div>
      <div className="mt-4">
        <PostFooter post={post} />
      </div>
    </article>
  );
});
