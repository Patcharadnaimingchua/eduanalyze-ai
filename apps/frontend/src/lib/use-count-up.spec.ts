// Runs the real useCountUp hook against a minimal hooks runtime, because the
// jest environment here is plain node (no DOM, no React renderer).
interface Effect {
  create: () => void | (() => void);
  deps: unknown[] | undefined;
}

const mockRuntime = {
  slots: [] as unknown[],
  cursor: 0,
  pending: [] as Effect[],
  rerender: (() => undefined) as () => void,
};

jest.mock('react', () => ({
  useState: (initial: unknown) => {
    const rt = mockRuntime;
    const index = rt.cursor++;
    if (!(index in rt.slots)) rt.slots[index] = initial;
    const set = (next: unknown) => {
      rt.slots[index] = next;
      rt.rerender();
    };
    return [rt.slots[index], set];
  },
  useRef: (initial: unknown) => {
    const rt = mockRuntime;
    const index = rt.cursor++;
    if (!(index in rt.slots)) rt.slots[index] = { current: initial };
    return rt.slots[index];
  },
  useEffect: (create: Effect['create'], deps?: unknown[]) => {
    const rt = mockRuntime;
    const index = rt.cursor++;
    const previous = rt.slots[index] as { deps?: unknown[]; cleanup?: unknown } | undefined;
    const changed =
      !previous || !deps || !previous.deps || deps.some((d, i) => !Object.is(d, previous.deps?.[i]));
    if (changed) {
      rt.pending.push({
        create: () => {
          if (typeof previous?.cleanup === 'function') previous.cleanup();
          const cleanup = create();
          rt.slots[index] = { deps, cleanup };
          return cleanup;
        },
        deps,
      });
    }
  },
}));

import { useCountUp } from './use-count-up';

// Called through an alias: the test harness is not a component.
const hookUnderTest = useCountUp;

type Options = Parameters<typeof useCountUp>[1];

let frames: Array<(now: number) => void> = [];
let clock = 0;
let reducedMotion = false;

function renderCountUp(target: number, options?: Options) {
  let result = 0;
  let rendering = false;
  let dirty = false;
  const run = () => {
    if (rendering) {
      dirty = true;
      return;
    }
    rendering = true;
    do {
      dirty = false;
      mockRuntime.cursor = 0;
      mockRuntime.pending = [];
      result = hookUnderTest(target, options);
      for (const effect of mockRuntime.pending) effect.create();
    } while (dirty);
    rendering = false;
  };
  mockRuntime.slots = [];
  mockRuntime.rerender = run;
  run();
  return () => result;
}

// Advances the fake clock one 16ms frame at a time until nothing is scheduled.
function playAll(read: () => number): number[] {
  const seen = [read()];
  let guard = 0;
  while (frames.length > 0 && guard++ < 500) {
    const queued = frames;
    frames = [];
    clock += 16;
    for (const frame of queued) frame(clock);
    seen.push(read());
  }
  return seen;
}

beforeEach(() => {
  frames = [];
  clock = 0;
  reducedMotion = false;
  Object.assign(globalThis, {
    window: { matchMedia: () => ({ matches: reducedMotion }) },
    requestAnimationFrame: (cb: (now: number) => void) => frames.push(cb),
    cancelAnimationFrame: () => undefined,
  });
  jest.spyOn(performance, 'now').mockImplementation(() => clock);
});

afterEach(() => jest.restoreAllMocks());

describe('useCountUp', () => {
  it('under reduced motion shows the final value at once and schedules no frames', () => {
    reducedMotion = true;
    const read = renderCountUp(42, { duration: 450 });
    expect(read()).toBe(42);
    expect(frames).toHaveLength(0);
  });

  it('ends exactly on the real value, never above it', () => {
    const read = renderCountUp(87, { duration: 450 });
    const seen = playAll(read);
    expect(seen[seen.length - 1]).toBe(87);
    expect(Math.max(...seen)).toBeLessThanOrEqual(87);
  });

  it('keeps the decimals of the real value at the end', () => {
    const read = renderCountUp(2.85, { duration: 450, decimals: 2 });
    const seen = playAll(read);
    expect(seen[seen.length - 1]).toBe(2.85);
  });

  it('finishes within about half a second at 450ms', () => {
    const read = renderCountUp(10, { duration: 450 });
    playAll(read);
    expect(clock).toBeLessThanOrEqual(500);
  });

  it('does not count a value that is not a finite number', () => {
    const nan = renderCountUp(Number.NaN, { duration: 450 });
    expect(nan()).toBe(0);
    expect(frames).toHaveLength(0);
    const infinite = renderCountUp(Number.POSITIVE_INFINITY, { duration: 450 });
    expect(infinite()).toBe(0);
    expect(frames).toHaveLength(0);
  });

  it('does not animate when the target is already 0', () => {
    const read = renderCountUp(0, { duration: 450 });
    expect(read()).toBe(0);
    expect(frames).toHaveLength(0);
  });
});
