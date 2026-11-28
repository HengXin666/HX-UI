"use client";

import { useReducer } from "react";

/**
 * A module loaded on demand, without React.lazy: Suspense holds freshly loaded content back for a
 * moment, which a context menu cannot afford. `use()` returns the module once it is there (and
 * re-renders the caller when it arrives); `load()` starts fetching it early.
 */
export function lazyPart<T>(loader: () => Promise<T>) {
  let mod: T | undefined;
  let pending: Promise<T> | undefined;
  const load = () => (pending ??= loader().then((m) => (mod = m)));
  return {
    load,
    /** The module, or undefined while it loads. Fetches it only when `want` (hooks run unconditionally). */
    use(want: boolean): T | undefined {
      const [, rerender] = useReducer((x: number) => x + 1, 0);
      if (!mod && want) void load().then(() => rerender());
      return mod;
    },
  };
}
