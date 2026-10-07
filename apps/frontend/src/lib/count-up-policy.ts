// "Play once per page visit": figures count up for the first thing shown, and
// everything shown after a switch (another course, say) appears at its value.
export interface PlayState {
  firstId: string | null;
  animate: boolean;
}

export const INITIAL_PLAY: PlayState = { firstId: null, animate: true };

// Once the view has moved away from the first id, counting stays off, also when
// the user comes back to it.
export function advancePlay(state: PlayState, id: string | null): PlayState {
  if (id === null) return state;
  if (state.firstId === null) return { firstId: id, animate: true };
  if (!state.animate || id === state.firstId) return state;
  return { ...state, animate: false };
}
