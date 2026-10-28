import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ANIME_BY_ID } from '@/lib/catalog';
import { cn, paletteFromSeed } from '@/lib/utils';

interface SmartPosterProps {
  src?: string;
  animeId?: string;
  /** Use the anime banner instead of the cover when available. */
  banner?: boolean;
  seed?: string;
  alt?: string;
  glyph?: string;
  palette?: [string, string, string];
  className?: string;
  imgClassName?: string;
  emblem?: 'full' | 'mini' | 'none';
  children?: ReactNode;
}

/**
 * Zero-broken-image media primitive.
 * A rich mesh-gradient + SVG emblem layer is always painted first; the real
 * artwork fades in on top only after it has fully decoded. If the network
 * fails, the art layer simply stays — the UI never shows a broken image.
 */
export function SmartPoster({
  src,
  animeId,
  banner,
  seed,
  alt,
  glyph,
  palette: paletteOverride,
  className,
  imgClassName,
  emblem = 'full',
  children,
}: SmartPosterProps) {
  const anime = animeId ? ANIME_BY_ID[animeId] : undefined;
  const url = src ?? (banner ? anime?.banner ?? anime?.cover : anime?.cover);
  const palette = paletteOverride ?? anime?.palette ?? paletteFromSeed(seed ?? alt ?? 'otaku');
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>(url ? 'loading' : 'error');
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setState(url ? 'loading' : 'error');
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) setState('loaded');
  }, [url]);

  return (
    <div className={cn('@container relative isolate overflow-hidden bg-[#07080c]', className)}>
      <MeshArt
        palette={palette}
        glyph={glyph ?? anime?.glyph ?? 'オタク'}
        title={anime?.title ?? alt}
        emblem={state === 'loaded' ? 'none' : emblem}
      />
      {url && state !== 'error' && (
        <img
          ref={imgRef}
          src={url}
          alt={alt ?? anime?.title ?? ''}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-gpu duration-700 ease-out',
            state === 'loaded' ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
        />
      )}
      {children}
    </div>
  );
}

function MeshArt({
  palette,
  glyph,
  title,
  emblem,
}: {
  palette: [string, string, string];
  glyph: string;
  title?: string;
  emblem: 'full' | 'mini' | 'none';
}) {
  const [a, b, deep] = palette;
  const mix = (c: string, p: number) => `color-mix(in srgb, ${c} ${p}%, transparent)`;
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        background: [
          `radial-gradient(110% 85% at 12% 8%, ${mix(a, 78)} 0%, transparent 55%)`,
          `radial-gradient(85% 75% at 92% 18%, ${mix(b, 62)} 0%, transparent 52%)`,
          `radial-gradient(120% 90% at 55% 115%, ${mix(a, 45)} 0%, transparent 62%)`,
          `linear-gradient(160deg, ${deep} 0%, #05060a 100%)`,
        ].join(','),
      }}
    >
      <div className="noise absolute inset-0 opacity-[0.09] mix-blend-overlay" />
      {emblem !== 'none' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2 transition-opacity duration-500">
          <svg viewBox="0 0 200 200" className={cn('aspect-square', emblem === 'full' ? 'h-[62%] max-h-56' : 'h-[78%]')}>
            <defs>
              <radialGradient id="emb-core" cx="50%" cy="45%" r="60%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="92" fill="url(#emb-core)" />
            {emblem === 'full' && (
              <>
                <circle cx="100" cy="100" r="88" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="1" />
                <circle cx="100" cy="100" r="74" fill="none" stroke="#fff" strokeOpacity="0.32" strokeWidth="1.5" strokeDasharray="2 6" />
                <circle cx="100" cy="100" r="60" fill="none" stroke="#fff" strokeOpacity="0.14" strokeWidth="10" />
                {Array.from({ length: 24 }).map((_, i) => {
                  const ang = (i / 24) * Math.PI * 2;
                  const r1 = i % 6 === 0 ? 78 : 82;
                  return (
                    <line
                      key={i}
                      x1={100 + Math.cos(ang) * r1}
                      y1={100 + Math.sin(ang) * r1}
                      x2={100 + Math.cos(ang) * 88}
                      y2={100 + Math.sin(ang) * 88}
                      stroke="#fff"
                      strokeOpacity={i % 6 === 0 ? 0.55 : 0.22}
                      strokeWidth={i % 6 === 0 ? 2 : 1}
                    />
                  );
                })}
                <path d="M100 18 L104 30 L100 26 L96 30 Z" fill="#fff" fillOpacity="0.6" />
              </>
            )}
            <text
              x="100"
              y="100"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#fff"
              fillOpacity="0.92"
              style={{ fontFamily: 'var(--font-jp)', fontWeight: 700 }}
              fontSize={glyph.length > 2 ? (glyph.length > 3 ? 30 : 40) : 56}
            >
              {glyph}
            </text>
          </svg>
          {emblem === 'full' && title && (
            <span className="hidden max-w-[90%] truncate text-center text-[10px] font-semibold uppercase tracking-[0.32em] text-white/75 @[160px]:block">
              {title}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
