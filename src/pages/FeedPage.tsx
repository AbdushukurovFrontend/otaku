import type { FeedKind } from '@/lib/router';
import { useFeed } from '@/lib/selectors';
import { useStore } from '@/lib/store';
import type { Topic } from '@/lib/types';
import { ActiveFilters, ComposerBar, FeedHeaderBar, PostList, SortBar, TrendingBento } from '@/components/feed/FeedParts';
import { LiveStrip } from '@/components/shell/RightRail';
import { ReadingColumn, btn } from '@/components/ui/primitives';
import { TOPIC_BY_ID } from '@/components/ui/topics';

const KIND_HEADERS: Record<Exclude<FeedKind, 'all'>, { title: string; description: string }> = {
  news: { title: 'Yangiliklar', description: "AniBla e'lonlari va anime sanoati" },
  collection: { title: "To'plamlar", description: "Jamiyat tuzgan tartiblangan ro'yxatlar" },
  review: { title: 'Sharhlar', description: '10 ballik batafsil taqrizlar' },
};

export function FeedPage({ kind, topic }: { kind: FeedKind; topic?: Topic }) {
  const sort = useStore((s) => s.feedSort);
  const period = useStore((s) => s.topPeriod);
  const posts = useFeed({ kind, topic, sort, period, applyFilters: true });
  const isHome = kind === 'all' && !topic;
  const header = kind !== 'all' ? KIND_HEADERS[kind] : undefined;
  const topicMeta = topic ? TOPIC_BY_ID[topic] : undefined;

  return (
    <div>
      {isHome && <TrendingBento />}
      {isHome && <LiveStrip />}
      <ReadingColumn>
        {header && <FeedHeaderBar title={header.title} description={header.description} count={posts.length} />}
        {topicMeta && (
          <FeedHeaderBar
            title={topicMeta.label}
            description="Mavzu bo'yicha tasma"
            count={posts.length}
            action={
              <a href="#/" className={btn('ghost', 'sm')}>
                Filtrni olib tashlash
              </a>
            }
          />
        )}
        {isHome && (
          <>
            <ComposerBar />
            <SortBar count={posts.length} />
          </>
        )}
        <ActiveFilters />
        <PostList
          posts={posts}
          empty={
            sort === 'following'
              ? {
                  title: "Obunalaringizda hali post yo'q",
                  description: "Ko'proq Hub'larga obuna bo'ling yoki mualliflarni kuzating.",
                  action: (
                    <a href="#/hubs" className={btn('contrast', 'md')}>
                      Jamiyatlarni ko'rish
                    </a>
                  ),
                }
              : undefined
          }
        />
      </ReadingColumn>
    </div>
  );
}

/** Quiet page title used by catalog-style pages (Jamiyatlar, Mod). */
export function PageHero({ title, description, action }: { title: string; description: string; action?: React.ReactNode; icon?: React.ReactNode; tone?: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
      <div className="min-w-0">
        <h1 className="text-[20px] font-semibold tracking-tight text-fg">{title}</h1>
        <p className="mt-0.5 text-[13px] text-fg-3">{description}</p>
      </div>
      {action}
    </div>
  );
}
