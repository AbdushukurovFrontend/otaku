import { Castle, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { navigate } from '@/lib/router';
import { useStore } from '@/lib/store';
import type { Topic } from '@/lib/types';
import { cn, slugify } from '@/lib/utils';
import { DynIcon, HUB_ICON_CHOICES } from '../ui/Icon';
import { Chip, Modal, ModalHeader, btn } from '../ui/primitives';
import { TOPICS } from '../ui/topics';

const PALETTES: [string, string, string][] = [
  ['#6366F1', '#8B5CF6', '#0B0A1F'],
  ['#F43F5E', '#FB923C', '#1A0710'],
  ['#10B981', '#22D3EE', '#06140F'],
  ['#F59E0B', '#EF4444', '#1A1206'],
  ['#EC4899', '#A855F7', '#160812'],
  ['#0EA5E9', '#6366F1', '#071318'],
];

export function CreateHubModal() {
  const close = useStore((s) => s.closeModal);
  const createHub = useStore((s) => s.createHub);
  const hubs = useStore((s) => s.hubs);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState<Topic>('anime');
  const [icon, setIcon] = useState(HUB_ICON_CHOICES[0]);
  const [palette, setPalette] = useState(PALETTES[0]);
  const [rules, setRules] = useState(['Bir-biringizni hurmat qiling', "Spoylerlarni ||...|| ichida yozing", 'Spam va reklama taqiqlanadi']);

  const finalSlug = slugTouched ? slug : slugify(name);
  const taken = hubs.some((h) => h.id === finalSlug);
  const valid = name.trim().length >= 3 && finalSlug.length >= 3 && !taken && description.trim().length >= 10;

  const submit = () => {
    const id = createHub({ name, slug: finalSlug, description, topic, icon, palette, rules });
    if (id) {
      close();
      navigate(`/h/${id}`);
    }
  };

  return (
    <Modal onClose={close} label="Yangi Hub ochish" size="lg">
      <ModalHeader icon={<Castle className="h-4 w-4" />} title="Yangi Hub ochish" subtitle="O'z mavzu jamiyatingizni yarating · +25 XP va «Hub Asoschisi» nishoni" onClose={close} />
      <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[1fr_240px]">
        <div className="space-y-4">
          <Field label="Hub nomi">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Masalan: Isekai Muxlislari" className={inputCls} />
          </Field>
          <Field label="Manzil (@slug)" hint={taken ? 'Bu manzil band' : undefined}>
            <div className={cn(inputCls, 'flex items-center gap-1 p-0 pl-3.5', taken && 'border-rose-500/60')}>
              <span className="text-fg-3">@</span>
              <input
                value={finalSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="isekai_uz"
                className="h-full flex-1 bg-transparent pr-3.5 outline-none"
              />
            </div>
          </Field>
          <Field label="Tavsif">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={280} placeholder="Hub nima haqida? Kimlar uchun?" className={cn(inputCls, 'h-auto resize-none py-3')} />
          </Field>
          <Field label="Mavzu">
            <div className="flex flex-wrap gap-1.5">
              {TOPICS.map((t) => (
                <Chip key={t.id} active={topic === t.id} onClick={() => setTopic(t.id)} icon={<t.icon className="h-3.5 w-3.5" />}>
                  {t.label}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Qoidalar">
            <div className="space-y-2">
              {rules.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-right text-[12px] font-medium tabular-nums text-fg-3">{i + 1}.</span>
                  <input value={r} onChange={(e) => setRules(rules.map((x, j) => (j === i ? e.target.value : x)))} className={cn(inputCls, 'h-9')} />
                  <button type="button" aria-label="Qoidani o'chirish" onClick={() => setRules(rules.filter((_, j) => j !== i))} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-fg-3 hover:bg-hover hover:text-rose-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {rules.length < 8 && (
                <button type="button" onClick={() => setRules([...rules, ''])} className={btn('ghost', 'sm')}>
                  <Plus className="h-3.5 w-3.5" /> Qoida qo'shish
                </button>
              )}
            </div>
          </Field>
        </div>
        <div className="space-y-4">
          <Field label="Ikonka">
            <div className="grid grid-cols-5 gap-1.5">
              {HUB_ICON_CHOICES.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  aria-label={ic}
                  onClick={() => setIcon(ic)}
                  className={cn('grid h-10 place-items-center rounded-xl border transition-gpu', icon === ic ? 'border-transparent bg-contrast text-contrast-fg' : 'border-line bg-sunken text-fg-2 hover:text-fg')}
                >
                  <DynIcon name={ic} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </Field>
          <Field label="Rang">
            <div className="flex flex-wrap gap-2">
              {PALETTES.map((p) => (
                <button
                  key={p[0]}
                  type="button"
                  aria-label={`Rang ${p[0]}`}
                  onClick={() => setPalette(p)}
                  className={cn('h-8 w-8 rounded-full ring-offset-2 ring-offset-[var(--panel-solid)] transition-gpu', palette === p && 'ring-2 ring-fg')}
                  style={{ backgroundImage: `linear-gradient(135deg, ${p[0]}, ${p[1]})` }}
                />
              ))}
            </div>
          </Field>
          <div>
            <p className="mb-1.5 text-[12.5px] font-medium text-fg-2">Ko'rinish</p>
            <div className="overflow-hidden rounded-2xl border border-line">
              <div className="h-16" style={{ background: `radial-gradient(90% 140% at 0% 0%, ${palette[0]}cc, transparent 60%), radial-gradient(80% 140% at 100% 0%, ${palette[1]}99, transparent 55%), linear-gradient(160deg, ${palette[2]}, #05060a)` }} />
              <div className="-mt-6 px-3 pb-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl text-white ring-2 ring-[var(--panel-solid)]" style={{ backgroundImage: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})` }}>
                  <DynIcon name={icon} className="h-6 w-6" />
                </span>
                <p className="mt-2 truncate text-[14px] font-semibold text-fg">{name || 'Hub nomi'}</p>
                <p className="truncate text-[12px] text-fg-3">@{finalSlug || 'manzil'} · 1 obunachi</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-5 py-4 sm:px-6">
        <button type="button" className={btn('ghost', 'md')} onClick={close}>
          Bekor qilish
        </button>
        <button type="button" disabled={!valid} onClick={submit} className={btn('primary', 'md')}>
          Hub'ni ochish
        </button>
      </div>
    </Modal>
  );
}

const inputCls = 'h-11 w-full rounded-xl border border-line bg-sunken px-3.5 text-[14px] text-fg outline-none placeholder:text-fg-3 focus:border-line-strong focus-within:border-line-strong';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[12.5px] font-medium text-fg-2">{label}</span>
        {hint && <span className="text-[11.5px] font-medium text-rose-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
