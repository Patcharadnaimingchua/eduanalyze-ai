import { useEffect, useRef, useState } from 'react';

// One-shot "has this element been reached by scrolling?" flag. The root's top
// margin is made huge so everything ABOVE the viewport counts as intersecting
// too: an IntersectionObserver only calls back when visibility changes, so a
// block skipped entirely by a fast scroll or a restored scroll position would
// otherwise never fire and stay hidden for good. The bottom margin is a fixed
// 24px (not a percentage) so a short block at the very end of a page, sitting
// above main's 16-32px bottom padding, can still be reached at max scroll.
// Without IntersectionObserver there is nothing to wait for, so everything is
// simply visible.
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
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: '100000px 0px -24px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, seen };
}
