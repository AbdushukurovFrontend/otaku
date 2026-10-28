import {
  ArrowDown,
  ArrowUp,
  Bold,
  ChartColumnBig,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Newspaper,
  PenLine,
  Plus,
  Quote,
  ScrollText,
  Search,
  Sparkles,
  Star,
  Tag,
  TriangleAlert,
  UserRound,
  WandSparkles,
  X,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { ANIME, ANIME_BY_ID } from '@/lib/catalog';
import { navigate, parseHash } from '@/lib/router';
import { ME, useMe, useStore, type PostInput } from '@/lib/store';
import type { CollectionItem, ComposerKind, Post, Topic } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PostCard } from '../feed/PostCard';
import { ScoreRing } from '../feed/PostBlocks';
import { HubAvatar, UserAvatar } from '../ui/Avatar';
import { Chip, Modal, Popover, Segmented, Switch, btn } from '../ui/primitives';
import { SmartPoster } from '../ui/SmartPoster';
import { TOPICS } from '../ui/topics';

const KINDS: { value: ComposerKind; label: string; icon: React.ReactNode }[] = [
  { value: 'post', label: 'Xabar', icon: <PenLine className="h-3.5 w-3.5" /> },
  { value: 'collection', label: "To'plam", icon: <ListOrdered className="h-3.5 w-3.5" /> },
  { value: 'review', label: 'Sharh', icon: <Star className="h-3.5 w-3.5" /> },
  { value: 'poll', label: "So'rovnoma", icon: <ChartColumnBig className="h-3.5 w-3.5" /> },
  { value: 'news', label: 'Yangilik', icon: <Newspaper className="h-3.5 w-3.5" /> },
];

const PLACEHOLDERS: Record<ComposerKind, { title: string; body: string }> = {
  post: { title: 'Sarlavha: fikr, nazariya yoki savol', body: "Batafsil yozing... **qalin**, *kursiv*, > iqtibos, - ro'yxat va ||spoyler|| ishlaydi" },
  collection: { title: "Masalan: Top 10 eng yaxshi isekai", body: "To'plam haqida qisqacha kirish so'zi..." },
  review: { title: "Masalan: Frieren — vaqt haqidagi eng go'zal hikoya", body: "Taqrizingiz: nimasi yoqdi, nimasi yoqmadi, kimga tavsiya qilasiz?" },
  poll: { title: "Savol: Masalan, eng kuchli soya kim?", body: "Qo'shimcha izoh (ixtiyoriy)" },
  news: { title: 'Yangilik sarlavhasi', body: 'Yangilik matni. Manbani ko\'rsatishni unutmang.' },
};

const GALLERY = ['frieren', 'solo_leveling', 'one_piece', 'jujutsu_kaisen', 'dandadan', 'chainsaw_man'];

export function ComposerStudio({ kind: initialKind, hubId: initialHub, draftId }: { kind?: ComposerKind; hubId?: string | null; draftId?: string }) {
  const close = useStore((s) => s.closeModal);
  const savePost = useStore((s) => s.savePost);
  const hubs = useStore((s) => s.hubs);
  const subs = useStore((s) => s.subscriptions);
  const draft = useStore((s) => (draftId ? s.posts.find((p) => p.id === draftId) : undefined));
  const me = useMe();

  const routeHub = useMemo(() => {
    const r = parseHash(window.location.hash);
    return r.name === 'hub' ? r.id : null;
  }, []);

  const [kind, setKind] = useState<ComposerKind>((draft?.kind as ComposerKind) ?? initialKind ?? 'post');
  const [hubId, setHubId] = useState<string | null>(draft ? draft.hubId : initialHub !== undefined ? initialHub : routeHub);
  const [title, setTitle] = useState(draft?.title ?? '');
  const [body, setBody] = useState(draft?.body ?? '');
  const [image, setImage] = useState(draft?.image ?? '');
  const [showImage, setShowImage] = useState(!!draft?.image);
  const [animeId, setAnimeId] = useState<string | undefined>(draft?.animeId ?? (hubId ? hubs.find((h) => h.id === hubId)?.animeId : undefined));
  const [topic, setTopic] = useState<Topic>(draft?.topic ?? 'anime');
  const [tags, setTags] = useState<string[]>(draft?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [spoiler, setSpoiler] = useState(draft?.spoiler ?? false);
  const [episode, setEpisode] = useState<number | ''>(draft?.episode ?? '');
  const [nsfw, setNsfw] = useState(draft?.nsfw ?? false);
  const [review, setReview] = useState(draft?.review ?? { plot: 8, animation: 8, music: 8, characters: 8, overall: 8, recommended: true });
  const [items, setItems] = useState<CollectionItem[]>(draft?.collection ?? [{ title: '', note: '' }, { title: '', note: '' }, { title: '', note: '' }]);
  const [options, setOptions] = useState<string[]>(draft?.poll?.options.map((o) => o.text) ?? ['', '']);
  const [pollDays, setPollDays] = useState(3);
  const [newsSource, setNewsSource] = useState(draft?.news?.source ?? '');
  const [preview, setPreview] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [touched, setTouched] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const hub = hubs.find((h) => h.id === hubId);
  const anime = animeId ? ANIME_BY_ID[animeId] : undefined;
  const animeHub = anime ? hubs.find((h) => h.animeId === anime.id) : undefined;

  const overall = Math.round(((review.plot + review.animation + review.music + review.characters) / 4) * 10) / 10;

  const errors = useMemo(() => {
    const e: string[] = [];
    if (title.trim().length < 5) e.push("Sarlavha kamida 5 belgidan iborat bo'lsin");
    if (kind === 'collection' && items.filter((i) => i.title.trim()).length < 2) e.push("To'plamda kamida 2 ta band bo'lsin");
    if (kind === 'review' && !animeId) e.push('Sharh uchun animeni biriktiring');
    if (kind === 'poll' && options.filter((o) => o.trim()).length < 2) e.push("So'rovnomada kamida 2 ta variant bo'lsin");
    return e;
  }, [title, kind, items, animeId, options]);

  const buildInput = (): PostInput => ({
    kind,
    hubId,
    title,
    body,
    image: showImage ? image : undefined,
    animeId,
    topic,
    tags,
    spoiler,
    episode: spoiler && episode !== '' ? Number(episode) : undefined,
    nsfw,
    review: { ...review, overall },
    collection: items.filter((i) => i.title.trim()).map((i) => ({ ...i, title: i.title.trim(), note: i.note.trim() })),
    pollOptions: options,
    pollDays,
    newsSource,
  });

  const previewPost: Post = useMemo(() => {
    const input = buildInput();
    return {
      id: 'preview',
      kind: input.kind,
      hubId: input.hubId,
      authorId: ME,
      title: input.title || 'Sarlavha',
      body: input.body,
      image: input.image,
      animeId: input.animeId,
      topic: input.topic,
      tags: input.tags,
      createdAt: Date.now(),
      score: 1,
      commentBase: 0,
      episode: input.episode,
      spoiler: false,
      nsfw: false,
      status: 'public',
      review: input.kind === 'review' ? input.review : undefined,
      collection: input.kind === 'collection' ? input.collection : undefined,
      poll: input.kind === 'poll' ? { endsAt: Date.now() + pollDays * 86_400_000, options: options.filter((o) => o.trim()).map((t, i) => ({ id: `o${i}`, text: t, votes: 0 })) } : undefined,
      news: input.kind === 'news' ? { source: newsSource || 'Otaku muallifi', official: false } : undefined,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, kind, hubId, title, body, image, showImage, animeId, topic, tags, review, items, options, pollDays, newsSource]);

  const publish = () => {
    setTouched(true);
    if (errors.length) return;
    const id = savePost(buildInput(), false, draftId);
    if (id) {
      close();
      navigate(`/p/${id}`);
    }
  };

  const saveDraft = () => {
    const id = savePost({ ...buildInput(), title: title || 'Sarlavhasiz qoralama' }, true, draftId);
    if (id) close();
  };

  /* ---------- formatting helpers ---------- */
  const wrap = (left: string, right = left, fallback = 'matn') => {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = body.slice(s, e) || fallback;
    setBody(body.slice(0, s) + left + sel + right + body.slice(e));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + left.length, s + left.length + sel.length);
    });
  };
  const prefix = (p: (i: number) => string) => {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const start = body.lastIndexOf('\n', s - 1) + 1;
    const block = body.slice(start, e) || 'band';
    const lines = block.split('\n').map((l, i) => p(i) + l);
    const before = body.slice(0, start);
    const glue = before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : '';
    setBody(before + glue + lines.join('\n') + body.slice(e));
    requestAnimationFrame(() => el.focus());
  };

  const addTag = (raw: string) => {
    const t = raw.trim().toLowerCase().replace(/^#/, '').replace(/[^a-z0-9_]/g, '');
    if (t && !tags.includes(t) && tags.length < 6) setTags([...tags, t]);
    setTagInput('');
  };

  const selectHub = (id: string | null) => {
    setHubId(id);
    const h = hubs.find((x) => x.id === id);
    if (h?.animeId && !animeId) setAnimeId(h.animeId);
    if (h?.topic) setTopic(h.topic);
  };

  const subHubs = hubs.filter((h) => subs.includes(h.id));
  const otherHubs = hubs.filter((h) => !subs.includes(h.id));

  return (
    <Modal onClose={close} label="Post Studiyasi" size="xl">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 sm:px-5">
        <span className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-sunken text-fg-2">
          <WandSparkles className="h-4 w-4" />
        </span>
        <div className="mr-auto">
          <p className="text-[16px] font-semibold leading-tight text-fg">{draft ? 'Qoralamani tahrirlash' : 'Aqlli Post Studiyasi'}</p>
          <p className="text-[12px] text-fg-3">Nashr manzili, format va sozlamalar — bitta ekranda</p>
        </div>
        <Popover
          align="end"
          panelClassName="w-[300px] p-1.5 max-h-[60vh] overflow-y-auto"
          trigger={({ toggle }) => (
            <button type="button" onClick={toggle} className={btn('secondary', 'sm', 'max-w-[220px]')}>
              {hub ? <HubAvatar hub={hub} size={20} /> : <UserAvatar user={me} size={20} />}
              <span className="truncate">{hub ? `@${hub.id}` : 'Mening Profilim'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-fg-3" />
            </button>
          )}
        >
          {(closeMenu) => (
            <DestinationList
              me={me}
              current={hubId}
              subHubs={subHubs}
              otherHubs={otherHubs}
              onSelect={(id) => {
                selectHub(id);
                closeMenu();
              }}
            />
          )}
        </Popover>
        <button type="button" onClick={() => setShowRules((v) => !v)} className={btn(showRules ? 'subtle' : 'ghost', 'sm')}>
          <ScrollText className="h-3.5 w-3.5" /> Hub qoidalari
        </button>
        <button type="button" aria-label="Yopish" onClick={close} className="grid h-9 w-9 place-items-center rounded-xl text-fg-2 hover:bg-hover hover:text-fg">
          <X className="h-[18px] w-[18px]" />
        </button>
      </div>

      {showRules && (
        <div className="animate-pop-in border-b border-line bg-sunken px-5 py-3">
          <p className="mb-1.5 text-[12px] font-semibold text-fg">{hub ? `@${hub.id} qoidalari` : 'Otaku umumiy qoidalari'}</p>
          <ol className="grid gap-1 text-[12.5px] text-fg-2 sm:grid-cols-2">
            {(hub?.rules ?? ['Hurmat va madaniyat', "Spoylerlarni ||...|| ichida yozing", 'Spam va pirat havolalar taqiqlanadi', '18+ kontentni NSFW deb belgilang']).map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-medium tabular-nums text-fg-3">{i + 1}.</span> {r}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Kind tabs */}
      <div className="flex items-center gap-3 px-4 pt-4 sm:px-5">
        <Segmented value={kind} onChange={(v) => setKind(v)} options={KINDS} />
        {preview && <span className="ml-auto rounded-full bg-chip px-2.5 py-1 text-[11.5px] font-medium text-fg-2">Ko'rib chiqish rejimi</span>}
      </div>

      {preview ? (
        <div className="p-4 sm:p-5">
          <div className="pointer-events-none mx-auto max-w-2xl">
            <PostCard post={previewPost} />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-[1fr_270px]">
          {/* Editor */}
          <div className="min-w-0 space-y-3">
            <div className="relative">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 300))}
                placeholder={PLACEHOLDERS[kind].title}
                className="h-12 w-full rounded-2xl border border-line bg-sunken px-4 pr-16 text-[17px] font-semibold text-fg outline-none placeholder:font-sans placeholder:font-normal placeholder:text-fg-3 focus:border-line-strong"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] tabular-nums text-fg-3">{title.length}/300</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-line bg-sunken focus-within:border-line-strong">
              <div className="flex flex-wrap items-center gap-0.5 border-b border-line px-2 py-1.5">
                <ToolBtn label="Qalin" onClick={() => wrap('**')}><Bold className="h-4 w-4" /></ToolBtn>
                <ToolBtn label="Kursiv" onClick={() => wrap('*')}><Italic className="h-4 w-4" /></ToolBtn>
                <ToolBtn label="Iqtibos" onClick={() => prefix(() => '> ')}><Quote className="h-4 w-4" /></ToolBtn>
                <ToolBtn label="Ro'yxat" onClick={() => prefix(() => '- ')}><List className="h-4 w-4" /></ToolBtn>
                <ToolBtn label="Raqamli ro'yxat" onClick={() => prefix((i) => `${i + 1}. `)}><ListOrdered className="h-4 w-4" /></ToolBtn>
                <ToolBtn label="Havola" onClick={() => wrap('', '', 'https://anibla.uz')}><Link2 className="h-4 w-4" /></ToolBtn>
                <span className="mx-1 h-5 w-px bg-line" />
                <button type="button" onClick={() => wrap('||')} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12px] font-medium text-fg-2 hover:bg-hover hover:text-fg">
                  <EyeOff className="h-3.5 w-3.5" /> ||Spoyler||
                </button>
                <button type="button" onClick={() => setShowImage((v) => !v)} className={cn('inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12px] font-medium hover:bg-hover', showImage ? 'bg-hover text-fg' : 'text-fg-2 hover:text-fg')}>
                  <ImageIcon className="h-3.5 w-3.5" /> Rasm
                </button>
              </div>
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={kind === 'post' || kind === 'news' ? 7 : 3}
                placeholder={PLACEHOLDERS[kind].body}
                className="block w-full resize-y bg-transparent px-4 py-3 text-[14px] leading-relaxed text-fg outline-none placeholder:text-fg-3"
              />
            </div>

            {showImage && (
              <div className="animate-pop-in rounded-2xl border border-line bg-sunken p-3">
                <div className="flex gap-2">
                  <input
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="Rasm URL manzili (https://...)"
                    className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-panel-solid px-3 text-[13px] text-fg outline-none placeholder:text-fg-3 focus:border-line-strong dark:bg-white/[0.04]"
                  />
                  {image && (
                    <button type="button" onClick={() => setImage('')} className={btn('ghost', 'sm')}>
                      Tozalash
                    </button>
                  )}
                </div>
                <p className="mb-1.5 mt-3 text-[11.5px] font-medium text-fg-3">yoki AniBla galereyasidan tanlang</p>
                <div className="no-scrollbar flex gap-2 overflow-x-auto">
                  {GALLERY.map((id) => {
                    const src = ANIME_BY_ID[id].banner!;
                    return (
                      <button key={id} type="button" onClick={() => setImage(src)} className={cn('relative shrink-0 overflow-hidden rounded-lg ring-2 transition-gpu', image === src ? 'ring-fg' : 'ring-transparent hover:ring-line-strong')}>
                        <SmartPoster src={src} animeId={id} emblem="mini" className="h-12 w-20" />
                        {image === src && (
                          <span className="absolute inset-0 grid place-items-center bg-black/50">
                            <Check className="h-4 w-4 text-white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {image && <SmartPoster src={image} seed={image} alt="Ko'rinish" className="mt-3 aspect-[16/7] w-full rounded-xl" />}
              </div>
            )}

            {kind === 'collection' && <CollectionEditor items={items} setItems={setItems} />}
            {kind === 'review' && <ReviewEditor review={review} setReview={setReview} overall={overall} anime={anime?.title} />}
            {kind === 'poll' && <PollEditor options={options} setOptions={setOptions} days={pollDays} setDays={setPollDays} />}
            {kind === 'news' && (
              <input
                value={newsSource}
                onChange={(e) => setNewsSource(e.target.value)}
                placeholder="Manba (masalan: AniBla Jamoasi, rasmiy X sahifasi)"
                className="h-11 w-full rounded-xl border border-line bg-sunken px-3.5 text-[13.5px] text-fg outline-none placeholder:text-fg-3 focus:border-line-strong"
              />
            )}
          </div>

          {/* Settings rail */}
          <div className="space-y-3">
            <Panel title="Anime biriktirish">
              <AnimePicker value={animeId} onChange={setAnimeId} />
              {anime && animeHub && hubId !== animeHub.id && (
                <button type="button" onClick={() => selectHub(animeHub.id)} className="mt-2 flex w-full items-center gap-2 rounded-xl border border-dashed border-line-strong px-2.5 py-2 text-left text-[12px] text-fg-2 transition-colors hover:bg-hover hover:text-fg">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" /> @{animeHub.id} Hub'iga joylash
                </button>
              )}
            </Panel>
            <Panel title="Mavzu">
              <div className="flex flex-wrap gap-1.5">
                {TOPICS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTopic(t.id)}
                    className={cn('inline-flex h-7 items-center gap-1 rounded-full border px-2 text-[11.5px] font-medium transition-gpu', topic === t.id ? 'border-transparent bg-contrast text-contrast-fg' : 'border-line text-fg-2 hover:text-fg')}
                  >
                    <t.icon className="h-3 w-3" /> {t.label}
                  </button>
                ))}
              </div>
            </Panel>
            <Panel title="Teglar">
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-panel-solid p-1.5 focus-within:border-line-strong dark:bg-white/[0.04]">
                {tags.map((t) => (
                  <span key={t} className="inline-flex h-6 items-center gap-1 rounded-md bg-chip pl-1.5 pr-1 text-[11.5px] font-medium text-fg-2">
                    #{t}
                    <button type="button" aria-label={`${t} tegini o'chirish`} onClick={() => setTags(tags.filter((x) => x !== t))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <span className="flex min-w-[80px] flex-1 items-center gap-1">
                  {tags.length === 0 && <Tag className="ml-1 h-3.5 w-3.5 text-fg-3" />}
                  <input
                    value={tagInput}
                    onChange={(e) => (e.target.value.endsWith(',') || e.target.value.endsWith(' ') ? addTag(e.target.value) : setTagInput(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                      if (e.key === 'Backspace' && !tagInput && tags.length) setTags(tags.slice(0, -1));
                    }}
                    placeholder={tags.length < 6 ? 'teg + Enter' : ''}
                    disabled={tags.length >= 6}
                    className="h-6 min-w-0 flex-1 bg-transparent px-1 text-[12.5px] text-fg outline-none placeholder:text-fg-3"
                  />
                </span>
              </div>
            </Panel>
            <div className="space-y-2.5 rounded-2xl border border-line bg-sunken p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[13px] font-medium text-fg">
                  <EyeOff className="h-4 w-4 text-fg-3" /> Spoyler bor
                </span>
                <Switch size="sm" checked={spoiler} onChange={setSpoiler} label="Spoyler bor" />
              </div>
              {spoiler && (
                <label className="flex animate-pop-in items-center gap-2 text-[12px] text-fg-2">
                  Epizod raqami:
                  <input
                    type="number"
                    min={1}
                    value={episode}
                    onChange={(e) => setEpisode(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                    placeholder={anime?.epEnd ? String(anime.epEnd) : '12'}
                    className="h-8 w-20 rounded-lg border border-line bg-panel-solid px-2 text-[13px] text-fg outline-none focus:border-line-strong dark:bg-white/[0.04]"
                  />
                  <span className="text-[11px] text-fg-3">{anime ? 'progress bo\'yicha yopiladi' : 'anime biriktiring'}</span>
                </label>
              )}
              <div className="h-px bg-line" />
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[13px] font-medium text-fg">
                  <TriangleAlert className="h-4 w-4 text-fg-3" /> NSFW <span className="rounded bg-chip px-1 text-[10px] font-semibold text-fg-2">18+</span>
                </span>
                <Switch size="sm" tone="rose" checked={nsfw} onChange={setNsfw} label="NSFW 18+" />
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-line-subtle bg-sunken px-3 py-2.5 text-[12px] text-fg-3">
              <Sparkles className="h-4 w-4 shrink-0 text-indigo-500" />
              Nashr qilganda <b className="text-fg">+15 XP</b> olasiz
            </div>
          </div>
        </div>
      )}

      {touched && errors.length > 0 && (
        <div className="mx-4 mb-3 flex flex-wrap gap-x-4 gap-y-1 rounded-xl border border-rose-500/30 bg-rose-500/[0.07] px-3 py-2 text-[12.5px] text-rose-600 sm:mx-5 dark:text-rose-300">
          {errors.map((e) => (
            <span key={e} className="flex items-center gap-1.5">
              <TriangleAlert className="h-3.5 w-3.5" /> {e}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3.5 sm:px-5">
        <span className="mr-auto hidden items-center gap-1.5 text-[12px] text-fg-3 sm:flex">
          {hub ? <HubAvatar hub={hub} size={18} /> : <UserRound className="h-3.5 w-3.5" />}
          {hub ? `@${hub.id} ga nashr qilinadi` : 'Profilingizga nashr qilinadi'}
        </span>
        <button type="button" className={btn('ghost', 'md')} onClick={close}>
          Bekor qilish
        </button>
        <button type="button" className={btn('secondary', 'md')} onClick={saveDraft}>
          Qoralamaga saqlash
        </button>
        <button type="button" className={btn(preview ? 'subtle' : 'secondary', 'md')} onClick={() => setPreview((v) => !v)}>
          <Eye className="h-4 w-4" /> {preview ? 'Tahrirlashga qaytish' : "Ko'rib chiqish"}
        </button>
        <button type="button" className={btn('primary', 'md')} onClick={publish}>
          Nashr qilish
        </button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */

function DestinationList({
  me,
  current,
  subHubs,
  otherHubs,
  onSelect,
}: {
  me: ReturnType<typeof useMe>;
  current: string | null;
  subHubs: ReturnType<typeof useStore.getState>['hubs'];
  otherHubs: ReturnType<typeof useStore.getState>['hubs'];
  onSelect: (id: string | null) => void;
}) {
  const [q, setQ] = useState('');
  const match = (h: { id: string; name: string }) => !q || h.id.includes(q.toLowerCase()) || h.name.toLowerCase().includes(q.toLowerCase());
  const row = (key: string, active: boolean, avatar: React.ReactNode, label: string, sub: string, id: string | null) => (
    <button key={key} type="button" onClick={() => onSelect(id)} className={cn('flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-hover', active && 'bg-hover')}>
      {avatar}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-fg">{label}</span>
        <span className="block truncate text-[11px] text-fg-3">{sub}</span>
      </span>
      {active && <Check className="h-4 w-4 text-fg" />}
    </button>
  );
  return (
    <div>
      <div className="mb-1 flex h-9 items-center gap-2 rounded-xl border border-line bg-sunken px-2.5">
        <Search className="h-3.5 w-3.5 text-fg-3" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hub qidirish..." className="h-full flex-1 bg-transparent text-[13px] text-fg outline-none placeholder:text-fg-3" />
      </div>
      {!q && row('me', current === null, <UserAvatar user={me} size={28} />, 'Mening Profilim', `u/${me.handle}`, null)}
      {subHubs.filter(match).length > 0 && <p className="px-2 pb-0.5 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-fg-3">Obunalarim</p>}
      {subHubs.filter(match).map((h) => row(h.id, current === h.id, <HubAvatar hub={h} size={28} />, `@${h.id}`, h.name, h.id))}
      {otherHubs.filter(match).length > 0 && <p className="px-2 pb-0.5 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-fg-3">Boshqa Hub'lar</p>}
      {otherHubs.filter(match).map((h) => row(h.id, current === h.id, <HubAvatar hub={h} size={28} />, `@${h.id}`, h.name, h.id))}
    </div>
  );
}

function ToolBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className="grid h-8 w-8 place-items-center rounded-lg text-fg-2 hover:bg-hover hover:text-fg">
      {children}
    </button>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-sunken p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">{title}</p>
      {children}
    </div>
  );
}

function AnimePicker({ value, onChange, compact }: { value?: string; onChange: (id: string | undefined) => void; compact?: boolean }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const a = value ? ANIME_BY_ID[value] : undefined;
  const results = ANIME.filter((x) => !q || x.title.toLowerCase().includes(q.toLowerCase()) || x.titleEn.toLowerCase().includes(q.toLowerCase())).slice(0, 6);

  if (a) {
    return (
      <div className={cn('flex items-center gap-2.5 rounded-xl border border-line bg-panel-solid p-1.5 dark:bg-white/[0.04]', compact && 'h-10 p-1')}>
        <SmartPoster animeId={a.id} emblem="mini" className={cn('shrink-0 rounded-md', compact ? 'h-8 w-6' : 'h-11 w-8')} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-semibold text-fg">{a.title}</span>
          {!compact && <span className="block truncate text-[11px] text-fg-3">{a.year} · ★ {a.score}</span>}
        </span>
        <button type="button" aria-label="Animeni olib tashlash" onClick={() => onChange(undefined)} className="grid h-7 w-7 place-items-center rounded-lg text-fg-3 hover:bg-hover hover:text-fg">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }
  return (
    <div className="relative">
      <div className="flex h-10 items-center gap-2 rounded-xl border border-line bg-panel-solid px-2.5 focus-within:border-line-strong dark:bg-white/[0.04]">
        <Search className="h-3.5 w-3.5 text-fg-3" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder="Anime nomini yozing..."
          className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-fg outline-none placeholder:text-fg-3"
        />
      </div>
      {open && (
        <div className="popover absolute left-0 right-0 top-full z-30 mt-1 max-h-64 animate-pop-in overflow-y-auto rounded-xl p-1">
          {results.length === 0 && <p className="px-3 py-4 text-center text-[12px] text-fg-3">Topilmadi</p>}
          {results.map((x) => (
            <button
              key={x.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(x.id);
                setQ('');
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-hover"
            >
              <SmartPoster animeId={x.id} emblem="mini" className="h-9 w-[26px] shrink-0 rounded" />
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-medium text-fg">{x.title}</span>
                <span className="block truncate text-[11px] text-fg-3">{x.year} · {x.studio}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionEditor({ items, setItems }: { items: CollectionItem[]; setItems: (v: CollectionItem[]) => void }) {
  const update = (i: number, patch: Partial<CollectionItem>) => setItems(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };
  return (
    <div className="rounded-2xl border border-line-subtle bg-sunken p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-fg-2">
        <ListOrdered className="h-3.5 w-3.5" /> Tartiblangan bandlar
      </p>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-start gap-2 rounded-xl border border-line bg-panel-solid p-2 dark:bg-white/[0.03]">
            <span className="mt-2.5 w-6 shrink-0 text-right text-[13px] font-semibold tabular-nums text-fg-3">{i + 1}</span>
            <div className="grid min-w-0 flex-1 gap-1.5 sm:grid-cols-2">
              <AnimePicker compact value={it.animeId} onChange={(id) => update(i, { animeId: id, title: id ? ANIME_BY_ID[id].title : it.title })} />
              {!it.animeId && (
                <input value={it.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="yoki nomini qo'lda yozing" className="h-10 rounded-xl border border-line bg-transparent px-2.5 text-[13px] text-fg outline-none placeholder:text-fg-3 focus:border-line-strong" />
              )}
              <input value={it.note} onChange={(e) => update(i, { note: e.target.value })} placeholder="Qisqa izoh: nega bu o'rinda?" className={cn('h-10 rounded-xl border border-line bg-transparent px-2.5 text-[13px] text-fg outline-none placeholder:text-fg-3 focus:border-line-strong', it.animeId && 'sm:col-span-1')} />
            </div>
            <div className="flex shrink-0 flex-col">
              <button type="button" aria-label="Yuqoriga" onClick={() => move(i, -1)} className="grid h-5 w-6 place-items-center text-fg-3 hover:text-fg"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button type="button" aria-label="Pastga" onClick={() => move(i, 1)} className="grid h-5 w-6 place-items-center text-fg-3 hover:text-fg"><ArrowDown className="h-3.5 w-3.5" /></button>
            </div>
            <button type="button" aria-label="Bandni o'chirish" onClick={() => setItems(items.filter((_, j) => j !== i))} disabled={items.length <= 1} className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-fg-3 hover:bg-hover hover:text-rose-500 disabled:opacity-30">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      {items.length < 15 && (
        <button type="button" onClick={() => setItems([...items, { title: '', note: '' }])} className={btn('ghost', 'sm', 'mt-2')}>
          <Plus className="h-3.5 w-3.5" /> #{items.length + 1} band qo'shish
        </button>
      )}
    </div>
  );
}

function ReviewEditor({
  review,
  setReview,
  overall,
  anime,
}: {
  review: NonNullable<Post['review']>;
  setReview: (r: NonNullable<Post['review']>) => void;
  overall: number;
  anime?: string;
}) {
  const crit: { key: 'plot' | 'animation' | 'music' | 'characters'; label: string }[] = [
    { key: 'plot', label: 'Syujet' },
    { key: 'animation', label: 'Animatsiya' },
    { key: 'music', label: 'Musiqa' },
    { key: 'characters', label: 'Personajlar' },
  ];
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line-subtle bg-sunken p-3.5 sm:flex-row">
      <div className="min-w-0 flex-1 space-y-2.5">
        <p className="flex items-center gap-1.5 text-[12px] font-medium text-fg-2">
          <Star className="h-3.5 w-3.5" /> 4 mezon bo'yicha baho {anime ? `· ${anime}` : ''}
        </p>
        {crit.map((c) => (
          <div key={c.key} className="grid grid-cols-[86px_1fr_36px] items-center gap-2">
            <span className="text-[12.5px] text-fg-2">{c.label}</span>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={review[c.key]}
              onChange={(e) => setReview({ ...review, [c.key]: Number(e.target.value) })}
              className="otaku-range"
              style={{ ['--fill' as string]: `${review[c.key] * 10}%`, ['--fill-from' as string]: '#6366F1', ['--fill-to' as string]: '#6366F1' }}
              aria-label={c.label}
            />
            <span className="text-right text-[13px] font-bold tabular-nums text-fg">{review[c.key].toFixed(1)}</span>
          </div>
        ))}
      </div>
      <div className="flex shrink-0 flex-col items-center justify-center gap-2 sm:w-[130px]">
        <ScoreRing value={overall} size={84} />
        <span className="text-[11px] text-fg-3">Umumiy ball (o'rtacha)</span>
        <label className="flex items-center gap-2 text-[12px] font-medium text-fg-2">
          <Switch size="sm" checked={review.recommended} onChange={(v) => setReview({ ...review, recommended: v })} /> Tavsiya qilaman
        </label>
      </div>
    </div>
  );
}

function PollEditor({ options, setOptions, days, setDays }: { options: string[]; setOptions: (v: string[]) => void; days: number; setDays: (d: number) => void }) {
  return (
    <div className="rounded-2xl border border-line-subtle bg-sunken p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-fg-2">
        <ChartColumnBig className="h-3.5 w-3.5" /> Variantlar
      </p>
      <div className="space-y-2">
        {options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-4 w-4 shrink-0 rounded-full border-2 border-fg-3" />
            <input
              value={o}
              onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder={`${i + 1}-variant`}
              maxLength={80}
              className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-panel-solid px-3 text-[13px] text-fg outline-none placeholder:text-fg-3 focus:border-line-strong dark:bg-white/[0.03]"
            />
            <button type="button" aria-label="Variantni o'chirish" disabled={options.length <= 2} onClick={() => setOptions(options.filter((_, j) => j !== i))} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-fg-3 hover:bg-hover hover:text-rose-500 disabled:opacity-30">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {options.length < 6 && (
          <button type="button" onClick={() => setOptions([...options, ''])} className={btn('ghost', 'sm')}>
            <Plus className="h-3.5 w-3.5" /> Variant qo'shish
          </button>
        )}
        <span className="ml-auto flex items-center gap-2 text-[12px] text-fg-2">
          Davomiyligi:
          {[1, 3, 7].map((d) => (
            <Chip key={d} active={days === d} onClick={() => setDays(d)} className="!h-7 !px-2.5">
              {d} kun
            </Chip>
          ))}
        </span>
      </div>
    </div>
  );
}
