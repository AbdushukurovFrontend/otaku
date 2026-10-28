import { Eye, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import type { Gate } from '@/lib/selectors';
import { useStore } from '@/lib/store';
import type { Post } from '@/lib/types';
import { cn } from '@/lib/utils';

/** Neutral frosted curtain over spoiler / progress-gated / NSFW content. Dissolves on reveal. */
export function SpoilerGate({ gate, post, top }: { gate: Gate; post: Post; top?: boolean }) {
  const reveal = useStore((s) => s.reveal);
  const setWatch = useStore((s) => s.setWatch);
  const setFilters = useStore((s) => s.setFilters);
  const [leaving, setLeaving] = useState(false);

  // The curtain dissolves (opacity + a hair of scale) before the gate unmounts.
  const open = (fn: () => void) => {
    setLeaving(true);
    window.setTimeout(fn, 320);
  };

  const isNsfw = gate.reason === 'nsfw';

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'absolute inset-0 z-10 flex transform-gpu flex-col items-center gap-2 overflow-hidden rounded-2xl bg-zinc-950/80 p-4 text-center ring-1 ring-white/[0.06] backdrop-blur-xl transition-gpu duration-300 will-change-[opacity,transform]',
        top ? 'justify-start pt-14' : 'justify-center',
        leaving && 'pointer-events-none scale-[1.03] opacity-0',
      )}
    >
      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.08] text-zinc-200 ring-1 ring-white/10">
        {isNsfw ? <TriangleAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
      </span>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          {isNsfw ? '18+ kontent' : gate.reason === 'progress' ? 'Spoyler himoyasi · AniBla sinxron' : 'Spoyler himoyasi'}
        </p>
        <p className="mt-1 text-[14px] font-semibold text-white">{isNsfw ? "Zo'ravonlik yoki qon sahnalari" : gate.label}</p>
        {gate.reason === 'progress' && (
          <p className="mt-0.5 text-[12px] text-zinc-400">
            Siz {gate.watched}-qismgacha ko'rgansiz — post {gate.episode}-qism haqida
          </p>
        )}
      </div>
      <div className="mt-1.5 flex flex-wrap justify-center gap-2">
        {gate.reason === 'progress' && post.animeId && gate.episode !== undefined && (
          <button
            type="button"
            onClick={() => open(() => setWatch(post.animeId!, gate.episode!))}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12px] font-semibold text-zinc-900 transition-colors hover:bg-zinc-200"
          >
            Men {gate.episode}-qismni ko'rdim
          </button>
        )}
        <button
          type="button"
          onClick={() => open(() => reveal(post.id))}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-semibold transition-colors',
            gate.reason === 'progress' ? 'text-zinc-300 ring-1 ring-white/15 hover:bg-white/10' : 'bg-white text-zinc-900 hover:bg-zinc-200',
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          {isNsfw ? "Yoshim 18+ — ko'rsatish" : "Baribir ko'rsatish"}
        </button>
        {isNsfw && (
          <button type="button" onClick={() => open(() => setFilters({ showNsfw: true }))} className="inline-flex h-8 items-center px-2 text-[12px] font-medium text-zinc-400 hover:text-white">
            NSFW filtrini yoqish
          </button>
        )}
      </div>
    </div>
  );
}
