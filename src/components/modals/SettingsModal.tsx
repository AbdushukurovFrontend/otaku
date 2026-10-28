import { Moon, Settings, Sun } from 'lucide-react';
import { useState } from 'react';
import { useMe, useStore } from '@/lib/store';
import { setTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { Modal, ModalHeader, Switch, btn } from '../ui/primitives';

export function SettingsModal() {
  const close = useStore((s) => s.closeModal);
  const me = useMe();
  const theme = useStore((s) => s.theme);
  const filters = useStore((s) => s.filters);
  const setFilters = useStore((s) => s.setFilters);
  const updateProfile = useStore((s) => s.updateProfile);
  const [name, setName] = useState(me.name);
  const [bio, setBio] = useState(me.bio);
  const dirty = name !== me.name || bio !== me.bio;

  return (
    <Modal onClose={close} label="Sozlamalar" size="md">
      <ModalHeader icon={<Settings className="h-[18px] w-[18px]" />} title="Sozlamalar" subtitle="Barcha o'zgarishlar avtomatik saqlanadi" onClose={close} />
      <div className="space-y-6 p-5 sm:p-6">
        <section>
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">Ko'rinish</p>
          <div className="grid grid-cols-2 gap-2.5">
            {(
              [
                { id: 'dark', label: 'Obsidian Zinc', sub: 'Tungi rejim', icon: Moon, preview: 'bg-[#090A0D]' },
                { id: 'light', label: 'Apple Alabaster', sub: 'Kunduzgi rejim', icon: Sun, preview: 'bg-[#F4F5F9]' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => theme !== t.id && setTheme(t.id)}
                className={cn('overflow-hidden rounded-2xl border text-left transition-gpu', theme === t.id ? 'border-fg ring-1 ring-fg' : 'border-line hover:border-line-strong')}
              >
                <div className={cn('relative h-16', t.preview)}>
                  <div className={cn('absolute left-3 top-3 h-10 w-24 rounded-lg border', t.id === 'dark' ? 'border-white/10 bg-[#111318]' : 'border-slate-200 bg-white')} />
                  <div className="absolute right-3 top-3 h-3 w-10 rounded-full bg-indigo-500" />
                </div>
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <t.icon className="h-4 w-4 text-fg-2" />
                  <span>
                    <span className="block text-[13px] font-semibold text-fg">{t.label}</span>
                    <span className="block text-[11.5px] text-fg-3">{t.sub}</span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
        <section className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">Kontent</p>
          <Row title="Spoylerlarni tasmadan yashirish" desc="Darvoza ortidagi postlar umuman ko'rsatilmaydi">
            <Switch checked={filters.hideSpoilers} onChange={(v) => setFilters({ hideSpoilers: v })} />
          </Row>
          <Row title="NSFW 18+ kontentni ko'rsatish" desc="O'chirilgan bo'lsa, 18+ postlar parda ortida">
            <Switch tone="rose" checked={filters.showNsfw} onChange={(v) => setFilters({ showNsfw: v })} />
          </Row>
        </section>
        <section className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">Profil</p>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium text-fg-2">Ism</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="h-11 w-full rounded-xl border border-line bg-sunken px-3.5 text-[14px] text-fg outline-none focus:border-line-strong" />
          </label>
          <label className="block">
            <span className="mb-1.5 flex justify-between text-[12.5px] font-medium text-fg-2">
              Bio <span className="text-fg-3">{bio.length}/200</span>
            </span>
            <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 200))} rows={3} className="w-full resize-none rounded-xl border border-line bg-sunken px-3.5 py-3 text-[14px] text-fg outline-none focus:border-line-strong" />
          </label>
          <p className="text-[12px] text-fg-3">@{me.handle} · Email profilingizda hech qachon ko'rsatilmaydi.</p>
        </section>
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-5 py-4 sm:px-6">
        <button type="button" className={btn('ghost', 'md')} onClick={close}>
          Yopish
        </button>
        <button
          type="button"
          disabled={!dirty}
          className={btn('primary', 'md')}
          onClick={() => {
            updateProfile({ name, bio });
            close();
          }}
        >
          Profilni saqlash
        </button>
      </div>
    </Modal>
  );
}

function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-sunken p-3.5">
      <span>
        <span className="block text-[13.5px] font-medium text-fg">{title}</span>
        <span className="block text-[12px] text-fg-3">{desc}</span>
      </span>
      {children}
    </div>
  );
}
