// A refetch must not overwrite what the instructor is typing; only an
// explicit action that changes the server data (save, CSV import) may.
export function shouldReseedScoreForm(isDirty: boolean, forceReseed: boolean): boolean {
  return !isDirty || forceReseed;
}

export const UNSAVED_SCORES_CONFIRM_MESSAGE =
  'มีคะแนนที่ยังไม่ได้บันทึก หากเปลี่ยนไปที่อื่นคะแนนที่แก้ไว้จะหายไป ต้องการดำเนินการต่อหรือไม่?';

export const UNSAVED_SCORES_CONFIRM = {
  title: 'มีคะแนนที่ยังไม่ได้บันทึก',
  description: UNSAVED_SCORES_CONFIRM_MESSAGE,
  confirmLabel: 'ทิ้งคะแนนและไปต่อ',
};

export interface GuardClick {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

export interface GuardAnchor {
  href: string;
  target: string | null;
  download: boolean;
}

// Whether a click on a link would leave the page the instructor is typing on.
// Opening in a new tab/window, downloads, other origins and same-page hash
// jumps leave the form alone, so they are not worth a warning.
export function isLeavingNavigation(
  click: GuardClick,
  anchor: GuardAnchor,
  currentUrl: string,
): boolean {
  if (click.button !== 0 || click.metaKey || click.ctrlKey || click.shiftKey || click.altKey) {
    return false;
  }
  if (anchor.download || (anchor.target && anchor.target !== '_self')) return false;
  let from: URL;
  let to: URL;
  try {
    from = new URL(currentUrl);
    to = new URL(anchor.href, currentUrl);
  } catch {
    return false;
  }
  if (to.origin !== from.origin) return false;
  return to.pathname !== from.pathname || to.search !== from.search;
}
