/**
 * Theme context: what the nearest HxProvider resolved, read through useTheme and useDefaults.
 * Without a provider the hooks return an inert value, so components behave as before.
 */
import { createContext, useContext, useMemo } from "react";
import { HX_MODE } from "../constants/provider";
import type { HxResolvedMode, HxTheme } from "./create-theme";

/** Mode prop of HxProvider. */
export type HxMode = typeof HX_MODE.light | typeof HX_MODE.dark | typeof HX_MODE.system;

/** Density prop of HxProvider. */
export type HxDensity = "comfortable" | "compact";

/** Global default props keyed by component name (Button, Card, ...). */
export type HxDefaults = Record<string, Record<string, unknown>>;

/** Value exposed by useTheme for the current scope. */
export interface HxThemeValue {
  /** False when no HxProvider is above: every other field is then unset. */
  inProvider: boolean;
  /** Depth of nesting, 0 outside any provider, 1 for the outermost one. */
  depth: number;
  mode?: HxMode;
  /** Mode after resolving system against prefers-color-scheme. */
  resolvedMode?: HxResolvedMode;
  theme?: HxTheme;
  radius?: string;
  density?: HxDensity;
  reducedMotion?: boolean;
  defaults: HxDefaults;
  /** CSS variables this scope writes, merged over the inherited ones. */
  vars: Record<string, string>;
}

const EMPTY_DEFAULTS: HxDefaults = {};

/** The value seen outside any provider. */
export const HX_NO_THEME: HxThemeValue = { inProvider: false, depth: 0, defaults: EMPTY_DEFAULTS, vars: {} };

/** Context carrying the nearest provider's resolved theme. */
export const HxThemeContext = createContext<HxThemeValue>(HX_NO_THEME);

/** Reads the theme of the current scope (the nearest HxProvider). */
export function useTheme(): HxThemeValue {
  return useContext(HxThemeContext);
}

/** Merges defaults with actual props; props win, an explicit undefined does not erase a default. */
export function mergeDefaults<P extends object>(defaults: Partial<P> | undefined, props: P): P {
  if (!defaults) {
    return props;
  }
  const merged: Record<string, unknown> = { ...defaults };
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) {
      merged[key] = value;
    }
  }
  return merged as P;
}

/**
 * Returns props with the provider defaults for componentName filled in.
 * Outside a provider the same props object is returned unchanged.
 */
export function useDefaults<P extends object>(componentName: string, props: P): P {
  const { defaults } = useTheme();
  const own = defaults[componentName] as Partial<P> | undefined;
  return useMemo(() => mergeDefaults(own, props), [own, props]);
}

/** Nested defaults: per component, child keys override parent keys. */
export function combineDefaults(parent: HxDefaults, child: HxDefaults | undefined): HxDefaults {
  if (!child) {
    return parent;
  }
  const out: HxDefaults = { ...parent };
  for (const [name, props] of Object.entries(child)) {
    out[name] = { ...parent[name], ...props };
  }
  return out;
}
