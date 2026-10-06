'use client';

import { useEffect } from 'react';
import { UNSAVED_SCORES_CONFIRM_MESSAGE, isLeavingNavigation } from './score-form-guard';

// While `enabled` (unsaved scores), a click on any in-app link that would leave
// the page asks first, and cancelling keeps the page and the typed values.
// beforeunload cannot cover client-side navigation, so the shell's links, the
// course switcher and the back link are caught here at the document, in the
// capture phase, before the router's own click handler runs. Browser
// Back/Forward cannot be cancelled from a page and stay uncovered.
export function useUnsavedNavigationGuard(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const leaving = isLeavingNavigation(
        event,
        { href: anchor.href, target: anchor.getAttribute('target'), download: anchor.hasAttribute('download') },
        window.location.href,
      );
      if (!leaving || window.confirm(UNSAVED_SCORES_CONFIRM_MESSAGE)) return;
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [enabled]);
}
