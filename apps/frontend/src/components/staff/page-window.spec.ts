import { pageWindow } from './page-window';

describe('pageWindow', () => {
  it('shows every page when there are few', () => {
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
  });

  it('keeps first, last and neighbours with gaps between', () => {
    expect(pageWindow(10, 26)).toEqual([1, null, 9, 10, 11, null, 26]);
  });

  it('does not add a gap between neighbours that touch', () => {
    expect(pageWindow(2, 26)).toEqual([1, 2, 3, null, 26]);
  });
});
