// Shared hover-lift treatment for primary submit/action buttons across the
// landing page, login, and register — small vertical lift + shadow on
// pointer-capable devices, never triggered on touch (md:hover:).
//
// Uses motion-safe: (not motion-reduce:) specifically because that's the
// only way to guarantee the hover-lift rule is never emitted when
// reduced-motion is requested — canceling via motion-reduce: afterward
// risks Tailwind CSS-order/specificity issues between two prefixed hover
// rules.
export const HOVER_LIFT =
  'transition-[transform,box-shadow] duration-200 ease-out motion-safe:md:hover:-translate-y-0.5 md:hover:shadow-md';
