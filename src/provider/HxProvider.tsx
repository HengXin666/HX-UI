"use client";

import * as React from "react";
import { HX_ATTR, HX_SCOPE, HX_SCOPE_CLASS, HX_SCOPE_COLOR } from "../constants/provider";
import { createTheme, isHxTheme, type HxSeed, type HxTheme } from "./create-theme";
import { combineDefaults, HxThemeContext, useTheme, type HxDefaults, type HxDensity, type HxMode, type HxThemeValue } from "./context";
import { buildScope, normalizeRadius, useDocumentMode, useResolvedMode, useRootScope } from "./scope";

/** Props of HxProvider. Every prop is optional and an omitted prop writes nothing. */
export interface HxProviderProps {
  /** light / dark, or system to follow prefers-color-scheme live. */
  mode?: HxMode;
  /** Seed for createTheme: a hue in degrees, or { hue, chroma }. Ignored when theme is given. */
  accent?: HxSeed;
  /** A precomputed createTheme result. */
  theme?: HxTheme;
  /** Base radius: a number is pixels, a string is any CSS length. Drives --radius. */
  radius?: number | string;
  /** compact shrinks the spacing unit of the scope; comfortable restores the default. */
  density?: HxDensity;
  /** true forces reduced motion, false forces full motion, omitted follows the OS. */
  reducedMotion?: boolean;
  /** Default props per component name, read by useDefaults; nested providers merge per component. */
  defaults?: HxDefaults;
  /**
   * root writes onto documentElement (portals included) and renders no element;
   * local renders a display: contents wrapper and only affects its subtree.
   * Defaults to root for the outermost provider and local when nested.
   */
  scope?: typeof HX_SCOPE.root | typeof HX_SCOPE.local;
  /** Class of the local wrapper; replaces the default contents class. */
  className?: string;
  children?: React.ReactNode;
}

/**
 * Runtime theme provider. Writes CSS variables and data attributes for mode, accent,
 * radius, density and motion; nested providers re-theme only their subtree.
 * With no provider at all, nothing is written and components render exactly as before.
 *
 * .agents/notes/implemented/feature/2026-11-02-runtime-theme-provider.md
 */
export function HxProvider({
  mode,
  accent,
  theme,
  radius,
  density,
  reducedMotion,
  defaults,
  scope,
  className,
  children,
}: HxProviderProps): React.JSX.Element {
  const parent = useTheme();
  const kind = scope ?? (parent.inProvider ? HX_SCOPE.local : HX_SCOPE.root);
  const ownMode = useResolvedMode(mode);
  const resolvedTheme = React.useMemo(
    () => (isHxTheme(theme) ? theme : accent === undefined ? undefined : createTheme(accent)),
    [theme, accent],
  );
  const needsDocument = !ownMode && !parent.resolvedMode && resolvedTheme !== undefined;
  const documentMode = useDocumentMode(needsDocument);
  const resolvedMode = ownMode ?? parent.resolvedMode ?? (resolvedTheme ? documentMode : undefined);
  const radiusValue = normalizeRadius(radius);

  const output = React.useMemo(
    () => buildScope({
      resolvedMode: ownMode,
      themeMode: resolvedMode,
      theme: resolvedTheme,
      radius: radiusValue,
      density,
      reducedMotion,
    }),
    [ownMode, resolvedMode, resolvedTheme, radiusValue, density, reducedMotion],
  );
  useRootScope(output, kind === HX_SCOPE.root);

  const value = React.useMemo<HxThemeValue>(
    () => ({
      inProvider: true,
      depth: parent.depth + 1,
      mode: mode ?? parent.mode,
      resolvedMode,
      theme: resolvedTheme ?? parent.theme,
      radius: radiusValue ?? parent.radius,
      density: density ?? parent.density,
      reducedMotion: reducedMotion ?? parent.reducedMotion,
      defaults: combineDefaults(parent.defaults, defaults),
      vars: { ...parent.vars, ...output.vars },
    }),
    [parent, mode, resolvedMode, resolvedTheme, radiusValue, density, reducedMotion, defaults, output],
  );

  if (kind === HX_SCOPE.root) {
    return <HxThemeContext.Provider value={value}>{children}</HxThemeContext.Provider>;
  }

  const style = { ...output.vars, color: HX_SCOPE_COLOR } as React.CSSProperties;
  const attrs = { ...output.attrs, [HX_ATTR.provider]: String(value.depth) };
  return (
    <HxThemeContext.Provider value={value}>
      <div {...attrs} className={className ?? HX_SCOPE_CLASS} style={style}>
        {children}
      </div>
    </HxThemeContext.Provider>
  );
}
