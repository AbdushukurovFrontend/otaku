import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import type { ModalState } from '@/lib/types';
import { ModalClosingContext } from '../ui/primitives';
import { AuthModal } from './AuthModal';
import { ComposerStudio } from './ComposerStudio';
import { CreateHubModal } from './CreateHubModal';
import { ReportModal } from './ReportModal';
import { SettingsModal } from './SettingsModal';

const EXIT_MS = 170;

/** Keeps the last modal mounted for a short exit animation (scale + fade) after the store clears it. */
export function ModalHost() {
  const modal = useStore((s) => s.modal);
  const [shown, setShown] = useState<ModalState>(modal);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (modal) {
      setShown(modal);
      setClosing(false);
      return;
    }
    if (!shown) return;
    setClosing(true);
    const id = window.setTimeout(() => {
      setShown(null);
      setClosing(false);
    }, EXIT_MS);
    return () => window.clearTimeout(id);
  }, [modal]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!shown) return null;
  return <ModalClosingContext.Provider value={closing}>{renderModal(shown)}</ModalClosingContext.Provider>;
}

function renderModal(modal: NonNullable<ModalState>) {
  switch (modal.type) {
    case 'composer':
      return <ComposerStudio key={modal.draftId ?? `${modal.kind ?? 'post'}-${modal.hubId ?? ''}`} kind={modal.kind} hubId={modal.hubId} draftId={modal.draftId} />;
    case 'report':
      return <ReportModal targetType={modal.targetType} targetId={modal.targetId} />;
    case 'auth':
      return <AuthModal />;
    case 'createHub':
      return <CreateHubModal />;
    case 'settings':
      return <SettingsModal />;
  }
}
