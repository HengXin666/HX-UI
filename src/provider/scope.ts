/**
 * Scope plumbing for HxProvider: resolve the mode, build the CSS variable map and attributes,
 * follow prefers-color-scheme, and write onto documentElement for the root scope.
 */
import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";
import {
  HX_ATTR, HX_BOOL, HX_DENSITY, HX_LIGHT_QUERY, HX_MODE, HX_MOTION_FULL, HX_MOTION_REDUCED, HX_PX, HX_SPACING, HX_VAR,
  HX_CHANGE_EVENT, hasDom, isNumber,
} from "../constants/provider";
import type { HxResolvedMode, HxTheme } from "./create-theme";
import type { HxDensity, HxMode } from "./context";

/** Inputs that turn into variables and attributes. */
export interface HxScopeInput {
  /** Mode written as data-mode; only set when the provider was given a mode itself. */
  resolvedMode?: HxResolvedMode;
  /** Mode whose theme variables are written; falls back to resolvedMode. */
  themeMode?: HxResolvedMode;
  theme?: HxTheme;
  radius?: string;
  density?: HxDensity;
  reducedMotion?: boolean;
}

/** What a scope writes: CSS custom properties and data attributes. */
export interface HxScopeOutput {
  vars: Record<string, string>;
  attrs: Record<string, string>;
}

/** Normalizes the radius prop: numbers are pixels, strings pass through. */
export function normalizeRadius(radius: number | string | undefined): string | undefined {
  return isNumber(radius) ? radius + HX_PX : radius;
}

/** Only props that were given produce output, so an empty provider writes nothing. */
export function buildScope(input: HxScopeInput): HxScopeOutput {
  const vars: Record<string, string> = {};
  const attrs: Record<string, string> = {};
  if (input.resolvedMode) {
    attrs[HX_ATTR.mode] = input.resolvedMode;
  }
  const themeMode = input.themeMode ?? input.resolvedMode;
  if (input.theme && themeMode) {
    Object.assign(vars, input.theme[themeMode]);
  }
  if (input.radius !== undefined) {
    vars[HX_VAR.radius] = input.radius;
  }
  if (input.density) {
    attrs[HX_ATTR.density] = input.density;
    vars[HX_VAR.spacing] = input.density === HX_DENSITY.compact ? HX_SPACING.compact : HX_SPACING.comfortable;
  }
  if (input.reducedMotion !== undefined) {
    attrs[HX_ATTR.reducedMotion] = input.reducedMotion ? HX_BOOL.true : HX_BOOL.false;
    Object.assign(vars, input.reducedMotion ? HX_MOTION_REDUCED : HX_MOTION_FULL);
  }
  return { vars, attrs };
}

function systemSnapshot(): HxResolvedMode {
  return hasDom() && window.matchMedia?.(HX_LIGHT_QUERY).matches ? HX_MODE.light : HX_MODE.dark;
}

/** Server snapshot: dark, the tokens.css default, so SSR output matches an unthemed page. */
function serverSnapshot(): HxResolvedMode {
  return HX_MODE.dark;
}

function subscribeSystem(onChange: () => void): () => void {
  if (!hasDom() || !window.matchMedia) {
    return () => undefined;
  }
  const query = window.matchMedia(HX_LIGHT_QUERY);
  query.addEventListener(HX_CHANGE_EVENT, onChange);
  return () => query.removeEventListener(HX_CHANGE_EVENT, onChange);
}

/**
 * Resolves a mode prop. system subscribes to prefers-color-scheme and re-renders on change;
 * light / dark never subscribe, so a manual choice does not follow the OS afterwards.
 */
export function useResolvedMode(mode: HxMode | undefined): HxResolvedMode | undefined {
  const following = mode === HX_MODE.system;
  const system = useSyncExternalStore(following ? subscribeSystem : noopSubscribe, systemSnapshot, serverSnapshot);
  if (!mode) {
    return undefined;
  }
  return following ? system : mode;
}

function noopSubscribe(): () => void {
  return () => undefined;
}

function documentSnapshot(): HxResolvedMode {
  return hasDom() && document.documentElement.getAttribute(HX_ATTR.mode) === HX_MODE.light ? HX_MODE.light : HX_MODE.dark;
}

function subscribeDocument(onChange: () => void): () => void {
  if (!hasDom() || typeof MutationObserver === typeof undefined) {
    return () => undefined;
  }
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: [HX_ATTR.mode] });
  return () => observer.disconnect();
}

/**
 * Mode currently on documentElement (set by getThemeScript, a root provider or the host app).
 * Used to pick theme variables when a provider is given a theme but no mode of its own.
 */
export function useDocumentMode(enabled: boolean): HxResolvedMode {
  return useSyncExternalStore(enabled ? subscribeDocument : noopSubscribe, documentSnapshot, serverSnapshot);
}

/** Layout effect in the browser so the root scope lands before paint; no-op on the server. */
export const useIsoLayoutEffect = hasDom() ? useLayoutEffect : useEffect;

/**
 * Writes the scope onto documentElement and restores the previous attribute and inline
 * values on change or unmount, so a root provider leaves no trace once removed.
 */
export function useRootScope(scope: HxScopeOutput, enabled: boolean): void {
  const key = JSON.stringify(scope);
  useIsoLayoutEffect(() => {
    if (!enabled || !hasDom()) {
      return undefined;
    }
    const root = document.documentElement;
    const prevAttrs = Object.keys(scope.attrs).map((name) => [name, root.getAttribute(name)] as const);
    const prevVars = Object.keys(scope.vars).map((name) => [name, root.style.getPropertyValue(name)] as const);
    for (const [name, value] of Object.entries(scope.attrs)) {
      root.setAttribute(name, value);
    }
    for (const [name, value] of Object.entries(scope.vars)) {
      root.style.setProperty(name, value);
    }
    return () => {
      for (const [name, value] of prevAttrs) {
        if (value === null) {
          root.removeAttribute(name);
        } else {
          root.setAttribute(name, value);
        }
      }
      for (const [name, value] of prevVars) {
        if (value) {
          root.style.setProperty(name, value);
        } else {
          root.style.removeProperty(name);
        }
      }
    };
    // key serializes scope, so the effect reruns exactly when what it writes changes
  }, [key, enabled]);
}
