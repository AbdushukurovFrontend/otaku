import { flushSync } from 'react-dom';
import { useStore } from './store';
import type { Theme } from './types';

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => unknown };

/**
 * Switches the colour theme through the View Transitions API: the browser
 * snapshots the old and new page and cross-fades them on the compositor
 * (opacity only), instead of transitioning every background colour.
 */
export function setTheme(next: Theme) {
  const apply = () => {
    document.documentElement.classList.toggle('dark', next === 'dark');
    flushSync(() => {
      if (useStore.getState().theme !== next) useStore.getState().toggleTheme();
    });
  };
  const doc = document as ViewTransitionDocument;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (doc.startViewTransition && !reduce) doc.startViewTransition(apply);
  else apply();
}
