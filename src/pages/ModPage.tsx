import { Check, EyeOff, Inbox, MessageSquare, Trash } from 'lucide-react';
import { useMemo, useState } from 'react';
import { REPORT_REASONS } from '@/components/modals/ReportModal';
import { UserAvatar } from '@/components/ui/Avatar';
import { KindChip } from '@/components/ui/Badges';
import { Card, EmptyState, MetaChip, Segmented, btn } from '@/components/ui/primitives';
import { useStore } from '@/lib/store';
import type { Report } from '@/lib/types';
import { cn, timeAgo } from '@/lib/utils';
import { PageHero } from './FeedPage';

type ModTab = 'queue' | 'resolved' | 'log';

export function ModPage() {
  const reports = useStore((s) => s.reports);
  const modLog = useStore((s) => s.modLog);
  const [tab, setTab] = useState<ModTab>('queue');

  // Several reports on the same target collapse into one queue item.
  const grouped = useMemo(() => {
    const map = new Map<string, Report[]>();
    for (const r of reports) {
      const k = `${r.targetType}:${r.targetId}:${r.status === 'open' ? 'open' : r.id}`;
      map.set(k, [...(map.get(k) ?? []), r]);
    }
    return [...map.values()].sort((a, b) => b[0].createdAt - a[0].createdAt);
  }, [reports]);
  const open = grouped.filter((g) => g[0].status === 'open');
  const resolved = grouped.filter((g) => g[0].status !== 'open');
  const today = reports.filter((r) => r.resolvedAt && Date.now() - r.resolvedAt < 86_400_000).length;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHero title="Moderator Paneli" description="Shikoyatlar navbati (Mod Queue), harakatlar va Mod Log tarixi" />
      <Card className="mb-4 grid grid-cols-3 divide-x divide-line">
        <Stat label="Ochiq shikoyatlar" value={open.length} />
        <Stat label="Bugun hal qilindi" value={today} />
        <Stat label="Mod Log yozuvlari" value={modLog.length} />
      </Card>
      <Segmented
        className="mb-4 w-fit"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'queue', label: 'Navbat', count: open.length },
          { value: 'resolved', label: 'Hal qilingan', count: resolved.length },
          { value: 'log', label: 'Mod Log', count: modLog.length },
        ]}
      />
      {tab === 'queue' &&
        (open.length ? (
          <div className="space-y-3">
            {open.map((g) => (
              <ReportItem key={g[0].id} group={g} />
            ))}
          </div>
        ) : (
          <EmptyState icon={<Inbox className="h-5 w-5" />} title="Navbat bo'sh" description="Barcha shikoyatlar ko'rib chiqildi. Jamiyat toza!" />
        ))}
      {tab === 'resolved' &&
        (resolved.length ? (
          <div className="space-y-3">
            {resolved.map((g) => (
              <ReportItem key={g[0].id} group={g} />
            ))}
          </div>
        ) : (
          <EmptyState icon={<Inbox className="h-5 w-5" />} title="Hali hal qilingan shikoyat yo'q" />
        ))}
      {tab === 'log' && (
        <Card className="divide-y divide-line-subtle">
          {modLog.map((m) => (
            <div key={m.id} className="flex items-start gap-3 px-4 py-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-sunken text-fg-2">
                {m.action === 'removed' ? <Trash className="h-4 w-4" /> : m.action === 'spoilered' ? <EyeOff className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] text-fg">{m.summary}</p>
                <p className="text-[12px] text-fg-3">
                  @{m.moderator} · {timeAgo(m.at)} · {m.targetType === 'post' ? 'Post' : 'Izoh'}
                </p>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 py-3.5 text-center">
      <p className="text-[22px] font-bold tabular-nums text-fg">{value}</p>
      <p className="text-[11.5px] text-fg-3">{label}</p>
    </div>
  );
}

function ReportItem({ group }: { group: Report[] }) {
  const r = group[0];
  const posts = useStore((s) => s.posts);
  const comments = useStore((s) => s.comments);
  const users = useStore((s) => s.users);
  const resolve = useStore((s) => s.resolveReport);
  const reason = REPORT_REASONS.find((x) => x.id === r.reason)!;
  const reporter = users.find((u) => u.id === r.reporterId);

  const post = r.targetType === 'post' ? posts.find((p) => p.id === r.targetId) : undefined;
  const comment = r.targetType === 'comment' ? comments.find((c) => c.id === r.targetId) : undefined;
  const parentPost = comment ? posts.find((p) => p.id === comment.postId) : undefined;
  const author = users.find((u) => u.id === (post?.authorId ?? comment?.authorId));
  const statusLabel = { open: 'Ochiq', kept: 'Qoldirildi', spoilered: 'Spoyler qilindi', removed: 'Yashirildi' }[r.status];

  return (
    <Card className={cn('overflow-hidden', r.status !== 'open' && 'opacity-80')}>
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <MetaChip icon={<reason.icon />} className="text-fg">
          {reason.label}
        </MetaChip>
        <MetaChip>{r.targetType === 'post' ? 'Post' : 'Izoh'}</MetaChip>
        {group.length > 1 && <MetaChip className="text-rose-600 dark:text-rose-400">{group.length} ta shikoyat</MetaChip>}
        <span className="ml-auto text-[12px] text-fg-3">
          @{reporter?.handle} · {timeAgo(r.createdAt)}
        </span>
        {r.status !== 'open' && <MetaChip icon={<Check />}>{statusLabel}</MetaChip>}
      </div>
      <div className="px-4 py-3.5">
        <div className="rounded-xl border border-line-subtle bg-sunken p-3.5">
          <div className="flex items-center gap-2 text-[12.5px]">
            <UserAvatar user={author} size={22} />
            <span className="font-semibold text-fg">@{author?.handle}</span>
            <span className="text-fg-3">
              {post ? `@${post.hubId ?? 'profil'}` : parentPost ? `«${parentPost.title.slice(0, 48)}${parentPost.title.length > 48 ? '…' : ''}» ostida` : ''}
            </span>
            {post && (
              <span className="ml-auto">
                <KindChip post={post} showPinned={false} />
              </span>
            )}
          </div>
          {post && (
            <a href={`#/p/${post.id}`} className="mt-2 block">
              <p className="text-[14.5px] font-semibold text-fg hover:underline">{post.title}</p>
              <p className="mt-1 line-clamp-2 text-[13px] text-fg-2">{post.body.replace(/[*|>]/g, '')}</p>
            </a>
          )}
          {comment && (
            <a href={`#/p/${comment.postId}`} className="mt-2 flex items-start gap-2 text-[13.5px] text-fg">
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-fg-3" />
              <span className={cn(comment.removed && 'line-through opacity-60')}>{comment.body}</span>
            </a>
          )}
        </div>
        {r.details && (
          <p className="mt-2.5 text-[13px] text-fg-2">
            <span className="font-semibold text-fg">Tafsilot:</span> {r.details}
          </p>
        )}
      </div>
      {r.status === 'open' && (
        <div className="flex flex-wrap gap-2 border-t border-line-subtle px-4 py-3">
          <button type="button" className={btn('secondary', 'sm')} onClick={() => resolve(r.id, 'kept')}>
            <Check className="h-3.5 w-3.5" /> Tasdiqlash (Qoldirish)
          </button>
          <button type="button" className={btn('secondary', 'sm')} onClick={() => resolve(r.id, 'spoilered')}>
            <EyeOff className="h-3.5 w-3.5" /> Spoyler deb belgilash
          </button>
          <button type="button" className={btn('danger', 'sm')} onClick={() => resolve(r.id, 'removed')}>
            <Trash className="h-3.5 w-3.5" /> Yashirish / O'chirish
          </button>
        </div>
      )}
    </Card>
  );
}
