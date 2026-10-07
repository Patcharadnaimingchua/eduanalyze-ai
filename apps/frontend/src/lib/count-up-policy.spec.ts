import { advancePlay, INITIAL_PLAY } from './count-up-policy';

describe('advancePlay', () => {
  it('counts for the first thing shown, and while it stays on screen', () => {
    let state = advancePlay(INITIAL_PLAY, null);
    expect(state.animate).toBe(true);
    state = advancePlay(state, 'a');
    expect(state).toEqual({ firstId: 'a', animate: true });
    expect(advancePlay(state, 'a')).toBe(state);
  });

  it('stops counting once another thing is shown', () => {
    const first = advancePlay(INITIAL_PLAY, 'a');
    expect(advancePlay(first, 'b').animate).toBe(false);
  });

  it('does not count again when the first thing comes back', () => {
    const switched = advancePlay(advancePlay(INITIAL_PLAY, 'a'), 'b');
    expect(advancePlay(switched, 'a').animate).toBe(false);
  });
});
