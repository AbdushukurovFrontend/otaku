import { Ban, Copyright, EyeOff, Flag, Gavel, MessageCircleWarning, ShieldAlert, Skull, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import type { ReportReason } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Modal, ModalHeader, btn } from '../ui/primitives';

export const REPORT_REASONS: { id: ReportReason; label: string; desc: string; icon: LucideIcon }[] = [
  { id: 'spam', label: 'Spam', desc: 'Reklama, firibgarlik havolalari', icon: Ban },
  { id: 'harassment', label: 'Haqorat qilish', desc: 'Kamsitish, shaxsiy hujum', icon: MessageCircleWarning },
  { id: 'spoiler', label: 'Belgilanmagan spoyler', desc: 'Spoyler pardasiz yozilgan', icon: EyeOff },
  { id: 'nsfw', label: 'Pornografik kontent (18+)', desc: 'Belgilanmagan 18+ material', icon: ShieldAlert },
  { id: 'violence', label: "Zo'ravonlik", desc: "Zo'ravonlikka chaqiruv yoki tahdid", icon: Skull },
  { id: 'copyright', label: 'Mualliflik huquqi', desc: "Pirat havola, o'g'irlangan ijod", icon: Copyright },
  { id: 'illegal', label: 'Qonunni buzish', desc: "O'zbekiston qonunchiligiga zid", icon: Gavel },
  { id: 'other', label: 'Boshqa', desc: 'Tafsilotda yozing', icon: Flag },
];

export function ReportModal({ targetType, targetId }: { targetType: 'post' | 'comment'; targetId: string }) {
  const close = useStore((s) => s.closeModal);
  const report = useStore((s) => s.report);
  const target = useStore((s) =>
    targetType === 'post' ? s.posts.find((p) => p.id === targetId)?.title : s.comments.find((c) => c.id === targetId)?.body,
  );
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');

  return (
    <Modal onClose={close} label="Shikoyat yuborish" size="md">
      <ModalHeader
        icon={<Flag className="h-4 w-4" />}
        title={targetType === 'post' ? 'Postga shikoyat' : 'Izohga shikoyat'}
        subtitle={target ? `«${target.slice(0, 70)}${target.length > 70 ? '…' : ''}»` : undefined}
        onClose={close}
      />
      <div className="p-5 sm:p-6">
        <p className="mb-3 text-[13px] text-fg-2">Sababni tanlang — shikoyat anonim tarzda Moderator Paneliga (Mod Queue) tushadi.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {REPORT_REASONS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setReason(r.id)}
              className={cn(
                'flex items-center gap-3 rounded-2xl border p-3 text-left transition-gpu',
                reason === r.id ? 'border-fg bg-panel ring-1 ring-fg' : 'border-line bg-sunken hover:border-line-strong',
              )}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-panel text-fg-2">
                <r.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-fg">{r.label}</span>
                <span className="block truncate text-[11.5px] text-fg-3">{r.desc}</span>
              </span>
            </button>
          ))}
        </div>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-[12.5px] font-medium text-fg-2">Tafsilot (ixtiyoriy)</span>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Moderatorlarga yordam beradigan qo'shimcha ma'lumot..."
            className="w-full resize-none rounded-2xl border border-line bg-sunken px-3.5 py-3 text-[14px] text-fg outline-none placeholder:text-fg-3 focus:border-line-strong"
          />
        </label>
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-5 py-4 sm:px-6">
        <button type="button" className={btn('ghost', 'md')} onClick={close}>
          Bekor qilish
        </button>
        <button type="button" disabled={!reason} className={btn('contrast', 'md')} onClick={() => reason && report(targetType, targetId, reason, details.trim())}>
          Yuborish
        </button>
      </div>
    </Modal>
  );
}
