/**
 * getThemeScript: inline script for SSR and first paint. Put it in head before any styles
 * render so data-mode and the theme variables are on documentElement before the first paint.
 */
import { PAD_CHAR } from "../constants";
import { HX_ATTR, HX_LIGHT_QUERY, HX_MODE, HX_UNICODE_ESCAPE } from "../constants/provider";
import { createTheme, isHxTheme, type HxSeed, type HxTheme } from "./create-theme";
import type { HxDensity, HxMode } from "./context";
import { buildScope, normalizeRadius } from "./scope";

/** Options of getThemeScript; mirror the root HxProvider props so both write the same values. */
export interface HxThemeScriptOptions {
  /** Mode when storage holds nothing; defaults to system. */
  mode?: HxMode;
  /** localStorage key holding a saved light / dark / system choice; read only when given. */
  storageKey?: string;
  accent?: HxSeed;
  theme?: HxTheme;
  radius?: number | string;
  density?: HxDensity;
  reducedMotion?: boolean;
}

/** Characters that could close the surrounding script tag when JSON is inlined. */
const UNSAFE_SCRIPT_CHARS = /[<>\u2028\u2029]/g;

function escapeForScript(json: string): string {
  return json.replace(UNSAFE_SCRIPT_CHARS, (ch) => `\\u${ch.charCodeAt(0).toString(HX_UNICODE_ESCAPE.radix).padStart(HX_UNICODE_ESCAPE.width, PAD_CHAR)}`);
}

/**
 * Returns a self-contained IIFE string. It resolves the mode (saved choice, then the given
 * mode, system through prefers-color-scheme), sets data-mode, then writes the theme variables
 * of that mode plus radius / density / motion. Failures (storage blocked) are swallowed so the
 * page falls back to the tokens.css defaults.
 */
export function getThemeScript(options: HxThemeScriptOptions = {}): string {
  const theme = isHxTheme(options.theme) ? options.theme : options.accent === undefined ? undefined : createTheme(options.accent);
  const common = buildScope({
    radius: normalizeRadius(options.radius),
    density: options.density,
    reducedMotion: options.reducedMotion,
  });
  const payload = {
    mode: options.mode ?? HX_MODE.system,
    key: options.storageKey ?? null,
    light: theme?.light ?? {},
    dark: theme?.dark ?? {},
    vars: common.vars,
    attrs: common.attrs,
    attr: HX_ATTR.mode,
    query: HX_LIGHT_QUERY,
    modes: HX_MODE,
  };
  const data = escapeForScript(JSON.stringify(payload));
  return `(function(){try{var p=${data},r=document.documentElement,M=p.modes,m=p.mode;`
    + `if(p.key){var s=null;try{s=localStorage.getItem(p.key);}catch(e){}`
    + `if(s===M.light||s===M.dark||s===M.system){m=s;}}`
    + `if(m===M.system){m=window.matchMedia&&window.matchMedia(p.query).matches?M.light:M.dark;}`
    + `r.setAttribute(p.attr,m);var v=m===M.light?p.light:p.dark,n;`
    + `for(n in p.vars){r.style.setProperty(n,p.vars[n]);}`
    + `for(n in v){r.style.setProperty(n,v[n]);}`
    + `for(n in p.attrs){r.setAttribute(n,p.attrs[n]);}`
    + `}catch(e){}})();`;
}
