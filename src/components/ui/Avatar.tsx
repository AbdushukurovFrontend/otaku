import { useEffect, useId, useRef, useState } from 'react';
import { ANIBLA_ACCOUNTS, HUB_AVATARS, USER_AVATARS } from '@/lib/avatars';
import { xpForLevel } from '@/lib/gamification';
import type { Hub, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AniBlaMark } from './Brand';
import { DynIcon } from './Icon';

/**
 * Round character portrait. An SVG illustration (gradient + anime bust
 * silhouette) is painted first; the CDN portrait fades in once decoded.
 */
function AvatarArt({
  src,
  palette,
  size,
  alt,
  className,
}: {
  src?: string;
  palette: [string, string];
  size: number;
  alt: string;
  className?: string;
}) {
  const id = useId().replace(/:/g, '');
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>(src ? 'loading' : 'error');
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setState(src ? 'loading' : 'error');
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) setState('loaded');
  }, [src]);

  return (
    <span
      className={cn('relative inline-block shrink-0 overflow-hidden rounded-full bg-zinc-800 ring-1 ring-black/[0.06] dark:ring-white/10', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={alt}
    >
      <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id={`av-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette[0]} />
            <stop offset="100%" stopColor={palette[1]} />
          </linearGradient>
        </defs>
        <rect width="40" height="40" fill={`url(#av-${id})`} />
        <rect width="40" height="40" fill="#0b0c10" fillOpacity="0.35" />
        <path d="M7 41 C7 31.5 12.5 27.5 20 27.5 C27.5 27.5 33 31.5 33 41 Z" fill="#fff" fillOpacity="0.26" />
        <circle cx="20" cy="18.5" r="7" fill="#fff" fillOpacity="0.32" />
        <path
          d="M11.5 18 L13.2 9.5 L16.6 13.4 L20 7 L23.4 13.4 L26.8 9.5 L28.5 18 C26.6 13.8 23.6 12.2 20 12.2 C16.4 12.2 13.4 13.8 11.5 18 Z"
          fill="#fff"
          fillOpacity="0.5"
        />
      </svg>
      {src && state !== 'error' && (
        <img
          ref={imgRef}
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
          className={cn('absolute inset-0 h-full w-full object-cover object-[50%_14%] transition-opacity duration-300', state === 'loaded' ? 'opacity-100' : 'opacity-0')}
        />
      )}
    </span>
  );
}

export function UserAvatar({ user, size = 32, className }: { user?: User; size?: number; className?: string }) {
  if (!user) return <span className={cn('inline-block shrink-0 rounded-full bg-chip', className)} style={{ width: size, height: size }} />;
  if (ANIBLA_ACCOUNTS.has(user.id)) return <AniBlaMark size={size} className={className} />;
  return <AvatarArt src={USER_AVATARS[user.id]} palette={user.palette} size={size} alt={user.name} className={className} />;
}

/** Avatar with a hairline indigo XP ring (no level sticker). */
export function XpRingAvatar({ user, size = 36 }: { user: User; size?: number }) {
  const stroke = 1.75;
  const box = size + 8;
  const r = size / 2 + 2.25;
  const c = 2 * Math.PI * r;
  const pct = user.xp / xpForLevel(user.level);
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: box, height: box }}>
      <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${box} ${box}`} aria-hidden>
        <circle cx={box / 2} cy={box / 2} r={r} fill="none" stroke="var(--line-strong)" strokeWidth={stroke} />
        <circle
          cx={box / 2}
          cy={box / 2}
          r={r}
          fill="none"
          stroke="#6366F1"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <UserAvatar user={user} size={size} />
    </span>
  );
}

export function HubAvatar({ hub, size = 28, className }: { hub?: Hub; size?: number; className?: string }) {
  if (!hub) return <span className={cn('inline-block shrink-0 rounded-full bg-chip', className)} style={{ width: size, height: size }} />;
  if (ANIBLA_ACCOUNTS.has(hub.id)) return <AniBlaMark size={size} className={className} />;
  const src = HUB_AVATARS[hub.id];
  if (src) return <AvatarArt src={src} palette={[hub.palette[0], hub.palette[1]]} size={size} alt={hub.name} className={className} />;
  return (
    <span
      className={cn('inline-grid shrink-0 place-items-center rounded-full border border-line bg-chip text-fg-2', className)}
      style={{ width: size, height: size }}
      aria-label={hub.name}
    >
      <DynIcon name={hub.icon} style={{ width: size * 0.48, height: size * 0.48 }} strokeWidth={1.6} />
    </span>
  );
}
