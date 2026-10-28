import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { cn, fmt } from '@/lib/utils';

/**
 * Minimalist karma capsule [ ⌃ 248 ⌄ ] — a single net score (U − D).
 * Upvoted = one flat indigo fill (cross-faded with opacity), the pressed
 * chevron pulses with scale and the number rolls like an odometer.
 */
export function KarmaCapsule({ voteKey, base, size = 'md' }: { voteKey: string; base: number; size?: 'sm' | 'md' }) {
  const vote = useStore((s) => s.votes[voteKey]);
  const doVote = useStore((s) => s.vote);
  const [tick, setTick] = useState<{ n: number; dir: 1 | -1; side: 1 | -1 } | null>(null);
  const score = base + (vote ?? 0);

  const click = (e: React.MouseEvent, side: 1 | -1) => {
    e.stopPropagation();
    e.preventDefault();
    const next = vote === side ? 0 : side;
    const delta = next - (vote ?? 0);
    doVote(voteKey, side);
    setTick((t) => ({ n: (t?.n ?? 0) + 1, dir: delta >= 0 ? 1 : -1, side }));
  };

  const md = size === 'md';
  const btnSize = md ? 'h-7 w-7' : 'h-6 w-6';
  const icon = md ? 'h-4 w-4' : 'h-3.5 w-3.5';
  const up = vote === 1;
  const down = vote === -1;

  return (
    <div
      className={cn(
        'relative isolate inline-flex shrink-0 items-center rounded-full border p-0.5 transition-colors duration-200',
        md ? 'h-8' : 'h-7',
        up ? 'border-indigo-500 text-white' : 'border-line-subtle bg-chip text-fg-2',
      )}
    >
      <span aria-hidden className={cn('absolute inset-0 -z-10 rounded-full bg-indigo-600 transition-gpu duration-200', up ? 'opacity-100' : 'opacity-0')} />

      <button
        type="button"
        aria-label="Yuqori ovoz"
        aria-pressed={up}
        onClick={(e) => click(e, 1)}
        className={cn('grid place-items-center rounded-full transition-colors duration-150', btnSize, up ? 'hover:bg-white/15' : 'hover:bg-hover hover:text-fg')}
      >
        <span key={tick?.side === 1 ? tick.n : 'u'} className={cn('grid transform-gpu place-items-center', tick?.side === 1 && 'animate-karma-pop')}>
          <ChevronUp className={icon} strokeWidth={2.4} />
        </span>
      </button>
      <span className={cn('relative grid h-full min-w-[2.6ch] place-items-center overflow-hidden px-0.5 font-semibold tabular-nums', md ? 'text-[12px]' : 'text-[11.5px]')}>
        <span
          key={tick?.n ?? 0}
          className={cn(
            'block transform-gpu',
            tick && (tick.dir > 0 ? 'animate-odometer-up' : 'animate-odometer-down'),
            up ? 'text-white' : down ? 'text-fg-3' : 'text-fg',
          )}
        >
          {fmt(score)}
        </span>
      </span>
      <button
        type="button"
        aria-label="Pastki ovoz"
        aria-pressed={down}
        onClick={(e) => click(e, -1)}
        className={cn(
          'grid place-items-center rounded-full transition-colors duration-150',
          btnSize,
          up ? 'hover:bg-white/15' : 'hover:bg-hover hover:text-fg',
          down && 'bg-panel text-fg shadow-[0_1px_2px_rgba(15,23,42,0.12)] dark:bg-zinc-700',
        )}
      >
        <span key={tick?.side === -1 ? tick.n : 'd'} className={cn('grid transform-gpu place-items-center', tick?.side === -1 && 'animate-karma-pop')}>
          <ChevronDown className={icon} strokeWidth={2.4} />
        </span>
      </button>
    </div>
  );
}
