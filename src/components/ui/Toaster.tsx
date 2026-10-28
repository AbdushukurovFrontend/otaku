import { CircleCheck, Crown, Info, Sparkles, TriangleAlert, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { navigate } from '@/lib/router';
import { useStore } from '@/lib/store';
import type { Toast } from '@/lib/types';

function ToastItem({ t }: { t: Toast }) {
  const dismiss = useStore((s) => s.dismissToast);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const ms = t.tone === 'xp' ? 2200 : 3600;
    const id = window.setTimeout(() => setLeaving(true), ms);
    return () => window.clearTimeout(id);
  }, [t.id, t.tone]);
  useEffect(() => {
    if (!leaving) return;
    const id = window.setTimeout(() => dismiss(t.id), 200);
    return () => window.clearTimeout(id);
  }, [leaving, t.id, dismiss]);

  const icon = {
    success: <CircleCheck className="h-4 w-4 text-emerald-500" />,
    info: <Info className="h-4 w-4 text-fg-3" />,
    error: <TriangleAlert className="h-4 w-4 text-rose-500" />,
    xp: <Sparkles className="h-4 w-4 text-indigo-500" />,
    level: <Crown className="h-4 w-4 text-amber-500" />,
  }[t.tone];

  return (
    <div
      role="status"
      className={`popover pointer-events-auto flex w-full transform-gpu items-start gap-3 rounded-2xl px-3.5 py-3 text-fg will-change-transform sm:w-[340px] ${leaving ? 'animate-toast-out' : 'animate-modal-in'}`}
    >
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-snug">{t.title}</p>
        {t.description && <p className="mt-0.5 text-[12px] leading-snug text-fg-3">{t.description}</p>}
      </div>
      {t.action && (
        <button
          type="button"
          onClick={() => {
            navigate(t.action!.href);
            dismiss(t.id);
          }}
          className="mt-0.5 shrink-0 rounded-lg px-2 py-1 text-[12px] font-semibold text-fg transition-colors hover:bg-hover"
        >
          {t.action.label}
        </button>
      )}
      <button type="button" aria-label="Yopish" onClick={() => setLeaving(true)} className="mt-0.5 shrink-0 rounded-md p-1 text-fg-3 hover:text-fg">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-20 z-[90] flex flex-col items-end gap-2 lg:inset-x-auto lg:right-6 lg:bottom-6">
      {toasts.map((t) => (
        <ToastItem key={t.id} t={t} />
      ))}
    </div>
  );
}
