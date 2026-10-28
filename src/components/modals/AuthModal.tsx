import { Gamepad2, LoaderCircle, Lock, Mail, Radio, ShieldCheck, Users, X } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { AniBlaMark, GoogleIcon, OtakuMark, TelegramIcon } from '../ui/Brand';
import { Modal, Segmented, btn } from '../ui/primitives';
import { SmartPoster } from '../ui/SmartPoster';

const FEATURES = [
  { icon: Users, title: "Avtomatik Hub'lar", desc: 'Har bir AniBla animesi uchun tayyor jamiyat' },
  { icon: Radio, title: 'Epizod muhokamalari (EDT)', desc: 'Qism chiqishi bilan rasmiy muhokama ochiladi' },
  { icon: ShieldCheck, title: 'Aqlli Spoyler Darvozasi', desc: "Ko'rish tarixingiz bilan sinxron himoya" },
  { icon: Gamepad2, title: 'Otaku darajalari', desc: 'XP, unvonlar, nishonlar va reyting' },
];

const MOSAIC = ['frieren', 'solo_leveling', 'one_piece', 'jujutsu_kaisen', 'sakamoto_days', 'dandadan', 'vinland_saga', 'chainsaw_man', 'spy_family'];

export function AuthModal() {
  const authed = useStore((s) => s.authed);
  const close = useStore((s) => s.closeModal);
  const login = useStore((s) => s.login);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [pending, setPending] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const run = (provider: string) => {
    setPending(provider);
    window.setTimeout(() => {
      setPending(null);
      login();
    }, 900);
  };

  const canSubmit = /\S+@\S+\.\S+/.test(email) && password.length >= 6;

  return (
    <Modal onClose={close} label="Otaku'ga kirish" size="xl" dismissable={authed} className="overflow-hidden">
      <div className="grid md:grid-cols-[1.05fr_1fr]">
        {/* Art side: a quiet poster mosaic under a dark film gradient */}
        <div className="relative hidden overflow-hidden bg-zinc-950 p-8 md:block">
          <div className="absolute inset-0 grid rotate-[-6deg] scale-125 grid-cols-3 gap-2 opacity-40">
            {MOSAIC.map((id) => (
              <SmartPoster key={id} animeId={id} emblem="none" className="aspect-[2/3] rounded-xl" />
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-zinc-950/40" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center gap-2">
              <OtakuMark className="h-8 w-8" />
              <span className="text-[18px] font-semibold tracking-tight text-white">Otaku</span>
              <span className="rounded-md border border-white/15 px-1.5 py-[1px] text-[9.5px] font-semibold tracking-wider text-zinc-400">BETA</span>
            </div>
            <h2 className="mt-auto pt-16 text-[28px] font-semibold leading-[1.15] tracking-tight text-white">
              O'zbek otakulari
              <br />
              <span className="text-zinc-400">bitta makonda.</span>
            </h2>
            <p className="mt-3 max-w-sm text-[13.5px] leading-relaxed text-zinc-400">AniBla ekotizimiga ulangan anime ijtimoiy tarmog'i: muhokama qiling, baho bering, daraja oshiring.</p>
            <div className="mt-6 divide-y divide-white/[0.07] rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-center gap-3 px-3.5 py-2.5">
                  <f.icon className="h-4 w-4 shrink-0 text-zinc-400" strokeWidth={1.75} />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-white">{f.title}</span>
                    <span className="block truncate text-[11.5px] text-zinc-500">{f.desc}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form side */}
        <div className="relative p-6 sm:p-8">
          {authed && (
            <button type="button" aria-label="Yopish" onClick={close} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-fg-3 transition-colors hover:bg-hover hover:text-fg">
              <X className="h-4 w-4" />
            </button>
          )}
          <h3 className="text-[20px] font-semibold tracking-tight text-fg">{mode === 'login' ? 'Xush kelibsiz' : "Otaku'ga qo'shiling"}</h3>
          <p className="mt-1 text-[13px] text-fg-3">{mode === 'login' ? 'Davom etish uchun akkauntingizga kiring' : "Beta davrida qo'shilganlarga «Beta Otaku» nishoni"}</p>
          <Segmented
            className="mt-5 w-fit"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'login', label: 'Kirish' },
              { value: 'signup', label: "Ro'yxatdan o'tish" },
            ]}
          />

          <button
            type="button"
            disabled={!!pending}
            onClick={() => run('anibla')}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-contrast text-[14px] font-semibold text-contrast-fg transition-colors hover:bg-contrast-hover active:scale-[0.99] disabled:opacity-60"
          >
            {pending === 'anibla' ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <AniBlaMark size={22} />}
            AniBla akkaunti bilan kirish
            <span className="rounded-md border border-current/20 px-1.5 py-px text-[10px] font-semibold opacity-60">1-Click SSO</span>
          </button>

          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <button type="button" disabled={!!pending} onClick={() => run('google')} className={btn('secondary', 'lg', 'w-full')}>
              {pending === 'google' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-4 w-4" />} Google
            </button>
            <button type="button" disabled={!!pending} onClick={() => run('telegram')} className={btn('secondary', 'lg', 'w-full')}>
              {pending === 'telegram' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <TelegramIcon className="h-4 w-4" />} Telegram
            </button>
          </div>

          <div className="my-5 flex items-center gap-3 text-[12px] text-fg-3">
            <span className="h-px flex-1 bg-line" /> yoki email orqali <span className="h-px flex-1 bg-line" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmit) run('email');
            }}
            className="space-y-2.5"
          >
            <label className="flex h-11 items-center gap-2.5 rounded-xl border border-line bg-sunken px-3.5 transition-colors focus-within:border-line-strong">
              <Mail className="h-4 w-4 text-fg-3" strokeWidth={1.75} />
              <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@misol.uz" className="h-full flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-fg-3" />
            </label>
            <label className="flex h-11 items-center gap-2.5 rounded-xl border border-line bg-sunken px-3.5 transition-colors focus-within:border-line-strong">
              <Lock className="h-4 w-4 text-fg-3" strokeWidth={1.75} />
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parol (kamida 6 belgi)"
                className="h-full flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-fg-3"
              />
            </label>
            <button type="submit" disabled={!canSubmit || !!pending} className={btn('primary', 'lg', 'w-full')}>
              {pending === 'email' && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {mode === 'login' ? 'Kirish' : 'Akkaunt yaratish'}
            </button>
          </form>
          <p className="mt-4 text-center text-[11.5px] leading-relaxed text-fg-3">
            Davom etish orqali Otaku foydalanish shartlari va maxfiylik siyosatiga rozilik bildirasiz. Demo rejimda istalgan usul sizni @gintoku_uz sifatida kiritadi.
          </p>
        </div>
      </div>
    </Modal>
  );
}
