import { useEffect, useRef, useState } from 'react';

// One-shot "has this element been reached by scrolling?" flag. It also counts
// an element that is already ABOVE the viewport as reached — otherwise a
// reload with a restored mid-page scroll position, or a fast scroll, would
// leave every earlier block hidden for good. Without IntersectionObserver
// there is nothing to wait for, so everything is simply visible.
export function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const rootBottom = entry.rootBounds?.bottom ?? window.innerHeight;
        if (entry.isIntersecting || entry.boundingClientRect.top < rootBottom) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, seen };
}
