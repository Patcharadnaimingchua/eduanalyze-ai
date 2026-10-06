import { isLeavingNavigation, shouldReseedScoreForm } from './score-form-guard';

const plain = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };
const here = 'http://localhost:3000/instructor/courses/abc?tab=evidence&def=d1';
const link = (href: string, extra: Partial<{ target: string | null; download: boolean }> = {}) => ({
  href,
  target: null,
  download: false,
  ...extra,
});

describe('isLeavingNavigation', () => {
  it('warns for a plain click to another tab, course or page', () => {
    expect(isLeavingNavigation(plain, link('/instructor/courses/abc?tab=overview'), here)).toBe(true);
    expect(isLeavingNavigation(plain, link('/instructor/courses/xyz?tab=evidence'), here)).toBe(true);
    expect(isLeavingNavigation(plain, link('/instructor/dashboard'), here)).toBe(true);
    expect(isLeavingNavigation(plain, link('http://localhost:3000/instructor/students'), here)).toBe(true);
  });

  it('does not warn when the link stays on the same page', () => {
    expect(isLeavingNavigation(plain, link('/instructor/courses/abc?tab=evidence&def=d1'), here)).toBe(false);
    expect(isLeavingNavigation(plain, link('#scores'), here)).toBe(false);
  });

  it('does not warn when the form stays open: new tab, modifier keys, download, other origin', () => {
    expect(isLeavingNavigation(plain, link('/instructor/dashboard', { target: '_blank' }), here)).toBe(false);
    expect(isLeavingNavigation({ ...plain, ctrlKey: true }, link('/instructor/dashboard'), here)).toBe(false);
    expect(isLeavingNavigation({ ...plain, metaKey: true }, link('/instructor/dashboard'), here)).toBe(false);
    expect(isLeavingNavigation({ ...plain, button: 1 }, link('/instructor/dashboard'), here)).toBe(false);
    expect(isLeavingNavigation(plain, link('/files/template.csv', { download: true }), here)).toBe(false);
    expect(isLeavingNavigation(plain, link('https://example.com/'), here)).toBe(false);
  });

  it('treats an unparsable address as not leaving', () => {
    expect(isLeavingNavigation(plain, link('http://['), here)).toBe(false);
  });
});

describe('shouldReseedScoreForm', () => {
  it('never reseeds over unsaved edits unless a save or import asked for it', () => {
    expect(shouldReseedScoreForm(true, false)).toBe(false);
    expect(shouldReseedScoreForm(true, true)).toBe(true);
    expect(shouldReseedScoreForm(false, false)).toBe(true);
  });
});
