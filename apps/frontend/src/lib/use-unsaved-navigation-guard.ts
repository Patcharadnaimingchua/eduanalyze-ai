'use client';

import { useEffect, useRef } from 'react';
import { isLeavingNavigation } from './score-form-guard';

// While `enabled` (unsaved scores), a click on any in-app link that would leave
// the page asks first, and cancelling keeps the page and the typed values.
// beforeunload cannot cover client-side navigation, so the shell's links, the
// course switcher and the back link are caught here at the document, in the
// capture phase, before the router's own click handler runs. The dialog is
// asynchronous, so a leaving click is always held back and, once confirmed,
// replayed on the same link. Browser Back/Forward cannot be cancelled from a
// page and stay uncovered.
export function useUnsavedNavigationGuard(enabled: boolean, askToLeave: () => Promise<boolean>) {
  const ask = useRef(askToLeave);
  ask.current = askToLeave;

  useEffect(() => {
    if (!enabled) return;
    let replaying = false;
    const onClick = (event: MouseEvent) => {
      if (replaying) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const leaving = isLeavingNavigation(
        event,
        {
          href: anchor.href,
          target: anchor.getAttribute('target'),
          download: anchor.hasAttribute('download'),
        },
        window.location.href,
      );
      if (!leaving) return;
      event.preventDefault();
      event.stopPropagation();
      void ask.current().then((leave) => {
        if (!leave) return;
        replaying = true;
        try {
          anchor.click();
        } finally {
          replaying = false;
        }
      });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [enabled]);
}
