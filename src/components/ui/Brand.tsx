import { cn } from '@/lib/utils';

/** Monochrome Otaku mark: inverted tile with the orbit glyph and a single rose "live" dot. */
export function OtakuMark({ className }: { className?: string }) {
  return (
    <span className={cn('relative grid shrink-0 place-items-center rounded-[10px] bg-contrast text-contrast-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]', className)}>
      <svg viewBox="0 0 32 32" className="h-[60%] w-[60%]" aria-hidden>
        <circle cx="15" cy="17" r="8.5" fill="none" stroke="currentColor" strokeWidth="3.6" />
        <circle cx="23.5" cy="8.5" r="3.4" fill="#F43F5E" />
      </svg>
    </span>
  );
}

/** AniBla emblem used as the avatar of the official account and hub (no pink squares). */
export function AniBlaMark({ className, size }: { className?: string; size?: number }) {
  return (
    <span
      className={cn('relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-zinc-950 ring-1 ring-inset ring-white/10', className)}
      style={size ? { width: size, height: size } : undefined}
      aria-label="AniBla"
    >
      <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden>
        <defs>
          <radialGradient id="anibla-sheen" cx="30%" cy="20%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="40" height="40" fill="url(#anibla-sheen)" />
        <circle cx="20" cy="20" r="11.5" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1" />
        <path d="M17 14.2 L26.2 20 L17 25.8 Z" fill="#ffffff" stroke="#ffffff" strokeLinejoin="round" strokeWidth="1.4" />
        <circle cx="29.5" cy="10.5" r="2.2" fill="#F43F5E" />
      </svg>
    </span>
  );
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.8Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3.02c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.11A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.28a12 12 0 0 0 0 10.78l4.01-3.11Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.28 6.61l4.01 3.11C6.23 6.88 8.88 4.77 12 4.77Z" />
    </svg>
  );
}

export function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#229ED9" />
      <path
        fill="#fff"
        d="M5.4 11.8 16.9 7.3c.53-.2 1 .13.83.95l-1.96 9.23c-.14.66-.53.82-1.08.51l-3-2.21-1.44 1.39c-.16.16-.3.3-.6.3l.21-3.05 5.55-5.01c.24-.21-.05-.33-.38-.12l-6.86 4.32-2.96-.92c-.64-.2-.66-.64.13-.95Z"
      />
    </svg>
  );
}
