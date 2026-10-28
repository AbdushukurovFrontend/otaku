import { ArrowLeft, ArrowUpRight, Bold, ChevronDown, CornerDownRight, EyeOff, Flag, Italic, MessagesSquare, Play, Send, Star } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { ANIME_BY_ID } from '@/lib/catalog';
import { commentScore, useGate, useHub, usePostComments, useUser } from '@/lib/selectors';
import { ME, useMe, useStore } from '@/lib/store';
import type { Comment, Post } from '@/lib/types';
import { cn, fmt, timeAgo } from '@/lib/utils';
import { PostContent, PostFooter, PostHeader } from '@/components/feed/PostCard';
import { SpoilerGate } from '@/components/feed/SpoilerGate';
import { ANIBLA_URL } from '@/components/shell/HeaderWidgets';
import { UserAvatar } from '@/components/ui/Avatar';
import { KindChip, LevelBadge } from '@/components/ui/Badges';
import { KarmaCapsule } from '@/components/ui/KarmaCapsule';
import { Card, EmptyState, MetaChip, ReadingColumn, Segmented, btn } from '@/components/ui/primitives';
import { RichText } from '@/components/ui/RichText';
import { SmartPoster } from '@/components/ui/SmartPoster';

type CommentSort = 'best' | 'new' | 'old';

export function PostPage({ id }: { id: string }) {
  const post = useStore((s) => s.posts.find((p) => p.id === id));
  if (!post || post.removed) {
    return (
      <ReadingColumn>
        <EmptyState
          icon={<MessagesSquare className="h-5 w-5" />}
          title={post?.removed ? 'Post moderator tomonidan yashirilgan' : 'Post topilmadi'}
          description={post?.removed ? 'Bu post jamiyat qoidalarini buzgani uchun Mod Queue orqali yashirildi.' : "Havola eskirgan yoki post o'chirilgan bo'lishi mumkin."}
          action={
            <a href="#/" className={btn('contrast', 'md')}>
              Tasmaga qaytish
            </a>
          }
        />
      </ReadingColumn>
    );
  }
  return <PostDetail post={post} />;
}

function PostDetail({ post }: { post: Post }) {
  const gate = useGate(post);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const anime = post.animeId ? ANIME_BY_ID[post.animeId] : undefined;
  const hub = useHub(post.hubId);

  return (
    <ReadingColumn>
      <button type="button" onClick={() => (history.length > 1 ? history.back() : (window.location.hash = '#/'))} className={btn('ghost', 'sm', 'mb-3 -ml-2')}>
        <ArrowLeft className="h-4 w-4" /> Orqaga
      </button>

      <article className="rounded-[20px] border border-line bg-panel p-5 shadow-panel sm:p-6">
        <PostHeader post={post} large />
        <div className="mt-2 sm:hidden">
          <KindChip post={post} />
        </div>
        {post.status === 'draft' && (
          <p className="mt-4 rounded-xl border border-line bg-sunken px-3 py-2 text-[13px] text-fg-2">
            Bu qoralama — faqat siz ko'rasiz. Nashr qilish uchun Profil → Qoralamalar bo'limidan oching.
          </p>
        )}
        <div className={cn('relative mt-5', gate && 'min-h-[220px]')}>
          <div className={cn(gate && 'pointer-events-none select-none')} aria-hidden={!!gate}>
            <PostContent post={post} detail />
          </div>
          {gate && <SpoilerGate gate={gate} post={post} top />}
        </div>
        {post.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <MetaChip key={t}>#{t}</MetaChip>
            ))}
          </div>
        )}
        <div className="mt-5 border-t border-line-subtle pt-4">
          <PostFooter post={post} onComment={() => composerRef.current?.focus()} />
        </div>
      </article>

      {anime && (
        <Card className="mt-3 flex gap-4 p-4">
          <SmartPoster animeId={anime.id} className="h-[118px] w-[82px] shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-fg-3">Biriktirilgan anime</p>
            <h3 className="mt-1 text-[16px] font-semibold text-fg">{anime.title}</h3>
            <p className="flex flex-wrap items-center gap-x-1.5 text-[12.5px] text-fg-3">
              <span>
                {anime.year} · {anime.studio}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 font-medium text-fg-2">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {anime.score}
              </span>
              <span>· {anime.genres.join(', ')}</span>
            </p>
            <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-fg-2">{anime.synopsis}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={ANIBLA_URL} target="_blank" rel="noreferrer" className={btn('contrast', 'sm')}>
                <Play className="h-3.5 w-3.5 fill-current" /> AniBla'da ko'rish <ArrowUpRight className="h-3 w-3 opacity-70" />
              </a>
              {hub?.animeId !== anime.id && (
                <a href={`#/h/${anime.id}`} className={btn('secondary', 'sm')}>
                  @{anime.id} Hub'i
                </a>
              )}
            </div>
          </div>
        </Card>
      )}

      <CommentsSection post={post} composerRef={composerRef} />
    </ReadingColumn>
  );
}

/* ------------------------------------------------------------------ */
/* Comments                                                            */
/* ------------------------------------------------------------------ */

function CommentComposer({
  onSubmit,
  placeholder,
  autoFocus,
  compact,
  onCancel,
  textareaRef,
}: {
  onSubmit: (body: string) => boolean;
  placeholder: string;
  autoFocus?: boolean;
  compact?: boolean;
  onCancel?: () => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const me = useMe();
  const [text, setText] = useState('');
  const localRef = useRef<HTMLTextAreaElement>(null);
  const ref = textareaRef ?? localRef;

  const wrap = (left: string, right = left) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = text.slice(s, e) || 'matn';
    setText(text.slice(0, s) + left + selected + right + text.slice(e));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + left.length, s + left.length + selected.length);
    });
  };

  const submit = () => {
    if (onSubmit(text)) setText('');
  };

  const tool = 'grid h-7 w-7 place-items-center rounded-lg text-fg-3 transition-colors hover:bg-hover hover:text-fg';

  return (
    <div className={cn('flex gap-3', compact && 'mt-2.5')}>
      {!compact && <UserAvatar user={me} size={32} className="mt-1" />}
      <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-line bg-sunken transition-colors focus-within:border-line-strong">
        <textarea
          ref={ref}
          value={text}
          autoFocus={autoFocus}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
            if (e.key === 'Escape') onCancel?.();
          }}
          placeholder={placeholder}
          rows={compact ? 2 : 3}
          className="block w-full resize-none bg-transparent px-3.5 pt-3 text-[14px] text-fg outline-none placeholder:text-fg-3"
        />
        <div className="flex items-center gap-0.5 px-2 pb-2">
          <button type="button" title="Qalin" aria-label="Qalin" onClick={() => wrap('**')} className={tool}>
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button type="button" title="Kursiv" aria-label="Kursiv" onClick={() => wrap('*')} className={tool}>
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Spoyler ||...||"
            onClick={() => wrap('||')}
            className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-fg-3 transition-colors hover:bg-hover hover:text-fg"
          >
            <EyeOff className="h-3.5 w-3.5" /> Spoyler
          </button>
          <span className="ml-auto mr-1 hidden text-[11px] text-fg-3 sm:inline">+3 XP</span>
          {onCancel && (
            <button type="button" onClick={onCancel} className={btn('ghost', 'xs')}>
              Bekor qilish
            </button>
          )}
          <button type="button" disabled={!text.trim()} onClick={submit} className={btn('primary', 'xs')}>
            <Send className="h-3 w-3" /> Yuborish
          </button>
        </div>
      </div>
    </div>
  );
}

function CommentsSection({ post, composerRef }: { post: Post; composerRef: React.RefObject<HTMLTextAreaElement | null> }) {
  const addComment = useStore((s) => s.addComment);
  const votes = useStore((s) => s.votes);
  const loadMore = useStore((s) => s.loadMoreArchive);
  const { comments, archiveRemaining } = usePostComments(post);
  const [sort, setSort] = useState<CommentSort>('best');

  const tree = useMemo(() => {
    const byParent: Record<string, Comment[]> = {};
    for (const c of comments) (byParent[c.parentId ?? 'root'] ||= []).push(c);
    const sorter = (a: Comment, b: Comment) =>
      sort === 'new' ? b.createdAt - a.createdAt : sort === 'old' ? a.createdAt - b.createdAt : commentScore(b, votes) - commentScore(a, votes);
    for (const k of Object.keys(byParent)) byParent[k].sort(sorter);
    return byParent;
  }, [comments, sort, votes]);

  const total = post.commentBase + comments.filter((c) => !c.id.startsWith('arc:')).length;

  return (
    <section className="mt-3">
      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-[15px] font-semibold text-fg">
            <span className="tabular-nums">{fmt(total)}</span> ta izoh
          </h2>
          <Segmented
            size="sm"
            className="ml-auto"
            value={sort}
            onChange={setSort}
            options={[
              { value: 'best', label: 'Eng yaxshi' },
              { value: 'new', label: 'Yangilari' },
              { value: 'old', label: 'Eskilari' },
            ]}
          />
        </div>
        <CommentComposer
          textareaRef={composerRef}
          placeholder={post.kind === 'edt' ? `${post.edt?.episode}-qism haqida fikringiz... (spoylerlar shu yerda ruxsat etiladi)` : "Fikringizni yozing... Spoyler bo'lsa ||...|| ichiga oling"}
          onSubmit={(body) => !!addComment(post.id, null, body)}
        />
      </Card>

      {(tree.root ?? []).length > 0 ? (
        <Card className="mt-3 divide-y divide-line-subtle">
          {(tree.root ?? []).map((c) => (
            <div key={c.id} className="p-4 sm:p-5">
              <CommentNode comment={c} tree={tree} depth={1} post={post} />
            </div>
          ))}
        </Card>
      ) : (
        <div className="py-10 text-center text-[13px] text-fg-3">Hali izoh yo'q. Birinchi bo'lib fikr bildiring!</div>
      )}

      {archiveRemaining > 0 && (
        <button type="button" onClick={() => loadMore(post.id)} className={btn('secondary', 'md', 'mt-3 w-full')}>
          <ChevronDown className="h-4 w-4" /> Yana izohlarni yuklash · <span className="tabular-nums">{fmt(archiveRemaining)}</span> ta qoldi
        </button>
      )}
    </section>
  );
}

const MAX_DEPTH = 4;

function CommentNode({ comment, tree, depth, post }: { comment: Comment; tree: Record<string, Comment[]>; depth: number; post: Post }) {
  const author = useUser(comment.authorId);
  const addComment = useStore((s) => s.addComment);
  const openModal = useStore((s) => s.openModal);
  const [collapsed, setCollapsed] = useState(false);
  const [replying, setReplying] = useState(false);
  const children = tree[comment.id] ?? [];
  const isOp = comment.authorId === post.authorId;
  const isMe = comment.authorId === ME;
  const isFresh = Date.now() - comment.createdAt < 60_000;
  const size = depth === 1 ? 28 : 24;
  const authorHref = isMe ? '#/me' : `#/u/${author?.handle}`;

  const reply = (body: string) => {
    // Threads stop indenting at depth 4: deeper replies attach to the same parent with an @mention.
    const parent = depth >= MAX_DEPTH ? comment.parentId : comment.id;
    const text = depth >= MAX_DEPTH ? `@${author?.handle} ${body}` : body;
    const ok = !!addComment(post.id, parent, text);
    if (ok) setReplying(false);
    return ok;
  };

  const action = 'inline-flex h-7 items-center gap-1 rounded-full px-2 text-[12px] font-medium text-fg-3 transition-colors hover:bg-hover hover:text-fg';

  return (
    <div className={cn(isFresh && 'animate-slide-up')}>
      <div className="flex items-center gap-2">
        <a href={authorHref} className="shrink-0">
          <UserAvatar user={author} size={size} />
        </a>
        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12.5px]">
          <a href={authorHref} className="font-semibold text-fg hover:underline">
            @{author?.handle}
          </a>
          {isOp && <span className="rounded bg-chip px-1.5 py-px text-[10px] font-semibold tracking-wide text-fg-2">OP</span>}
          {isMe && !isOp && <span className="rounded bg-chip px-1.5 py-px text-[10px] font-semibold tracking-wide text-fg-2">SIZ</span>}
          <LevelBadge user={author} />
          <span className="text-fg-3">· {timeAgo(comment.createdAt)}</span>
          {collapsed && (
            <button type="button" onClick={() => setCollapsed(false)} className="ml-1 rounded-full bg-chip px-2 text-[11.5px] font-medium text-fg-2 hover:text-fg">
              +{countDescendants(comment.id, tree) + 1} yig'ilgan
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="relative" style={{ paddingLeft: size / 2 - 0.5 }}>
          <div className={cn('border-l pl-[18px]', children.length > 0 || replying ? 'border-slate-200 dark:border-white/[0.09]' : 'border-transparent')}>
            {(children.length > 0 || replying) && (
              <button
                type="button"
                aria-label="Tarmoqni yig'ish"
                onClick={() => setCollapsed(true)}
                className="group absolute bottom-0 top-0 w-3"
                style={{ left: size / 2 - 6 }}
              >
                <span className="mx-auto block h-full w-px bg-transparent transition-colors group-hover:bg-fg-3" />
              </button>
            )}
            {comment.removed ? (
              <p className="pt-1.5 text-[13.5px] italic text-fg-3">[Izoh moderator tomonidan yashirildi]</p>
            ) : (
              <RichText text={comment.body} className="pt-1.5 text-[14px] leading-relaxed text-fg" />
            )}
            <div className="mt-1.5 flex items-center gap-0.5">
              <KarmaCapsule voteKey={`c:${comment.id}`} base={comment.score} size="sm" />
              <button type="button" onClick={() => setReplying((r) => !r)} className={action}>
                <CornerDownRight className="h-3.5 w-3.5" /> Javob yozish
              </button>
              {!isMe && (
                <button type="button" onClick={() => openModal({ type: 'report', targetType: 'comment', targetId: comment.id })} className={action}>
                  <Flag className="h-3 w-3" /> <span className="hidden sm:inline">Shikoyat qiling</span>
                </button>
              )}
            </div>
            {replying && <CommentComposer compact autoFocus placeholder={`@${author?.handle} ga javob...`} onSubmit={reply} onCancel={() => setReplying(false)} />}
            {children.length > 0 && (
              <div className="mt-3 space-y-4 pb-1">
                {children.map((c) => (
                  <CommentNode key={c.id} comment={c} tree={tree} depth={depth + 1} post={post} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function countDescendants(id: string, tree: Record<string, Comment[]>): number {
  const kids = tree[id] ?? [];
  return kids.reduce((n, k) => n + 1 + countDescendants(k.id, tree), 0);
}
