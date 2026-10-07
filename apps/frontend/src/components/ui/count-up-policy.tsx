'use client';

import { createContext, useContext, type ReactNode } from 'react';

const CountUpAllowed = createContext(true);

// Wrap a part of a page to switch the count-ups inside it off for everything
// that mounts while `animate` is false. Without it they always play.
export function CountUpPolicy({
  animate,
  children,
}: Readonly<{ animate: boolean; children: ReactNode }>) {
  return <CountUpAllowed.Provider value={animate}>{children}</CountUpAllowed.Provider>;
}

export function useCountUpAllowed(): boolean {
  return useContext(CountUpAllowed);
}
