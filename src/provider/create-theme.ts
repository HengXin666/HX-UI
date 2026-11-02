/**
 * createTheme: derive the primary color scale for light and dark from one seed hue in oklch.
 * Pure TS, no DOM; every value is an oklch() string pulled back into the sRGB gamut.
 */
import {
  HX_ALPHA_STEPS, HX_CONTRAST_OFFSET, HX_CSS, HX_CSS_SELECTOR, HX_DEG_TO_RAD, HX_GAMUT, HX_GLOW_ALPHA, HX_LIGHTNESS,
  HX_LMS_TO_SRGB, HX_LUMA, HX_MODE, HX_OKLAB_TO_LMS, HX_OKLCH, HX_ON_PRIMARY, HX_PERCENT, HX_PRECISION, HX_SEED_DEFAULT,
  HX_SUBTLE, HX_TURN, HX_VAR, isNumber, isObject,
} from "../constants/provider";
import { HALF_DIVISOR } from "../constants";

/** A seed is a bare hue in degrees, or a hue with an explicit chroma. */
export type HxSeed = number | { hue: number; chroma?: number };

/** CSS variable name to value. */
export type HxThemeVars = Record<string, string>;

/** Resolved light / dark modes. */
export type HxResolvedMode = typeof HX_MODE.light | typeof HX_MODE.dark;

/** Selectors for toCss; omitted keys fall back to the tokens.css mode selectors. */
export interface HxThemeCssSelectors {
  light?: string;
  dark?: string;
}

/** Output of createTheme, accepted as-is by HxProvider's theme prop. */
export interface HxTheme {
  seed: { hue: number; chroma: number };
  light: HxThemeVars;
  dark: HxThemeVars;
  toCss: (selectors?: HxThemeCssSelectors) => string;
}

interface Lch {
  l: number;
  c: number;
  h: number;
}

type Rgb = [number, number, number];

const cube = (v: number): number => v * v * v;

/** oklch to linear sRGB through OKLab and LMS. */
function toLinearRgb({ l, c, h }: Lch): Rgb {
  const a = c * Math.cos(h * HX_DEG_TO_RAD);
  const b = c * Math.sin(h * HX_DEG_TO_RAD);
  const lms = HX_OKLAB_TO_LMS.map(([ka, kb]) => cube(l + ka * a + kb * b));
  return HX_LMS_TO_SRGB.map((row) => row.reduce((sum, k, i) => sum + k * lms[i], 0)) as Rgb;
}

function inGamut(color: Lch): boolean {
  return toLinearRgb(color).every((v) => v >= -HX_GAMUT.epsilon && v <= 1 + HX_GAMUT.epsilon);
}

/** Keeps lightness and hue, lowers chroma by bisection until the color fits sRGB. */
function fitGamut(color: Lch): Lch {
  if (inGamut(color)) {
    return color;
  }
  let low = 0;
  let high = color.c;
  for (let i = 0; i < HX_GAMUT.steps; i++) {
    const mid = (low + high) / HALF_DIVISOR;
    if (inGamut({ ...color, c: mid })) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return { ...color, c: low };
}

function luminance(color: Lch): number {
  const rgb = toLinearRgb(color).map((v) => Math.min(1, Math.max(0, v)));
  return rgb.reduce((sum, v, i) => sum + v * HX_LUMA[i], 0);
}

function contrast(a: Lch, b: Lch): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + HX_CONTRAST_OFFSET) / (lo + HX_CONTRAST_OFFSET);
}

function round(value: number, digits: number): number {
  return Number(value.toFixed(digits));
}

/** Serializes to an oklch() string, with an optional alpha. */
function fmtOklch(color: Lch, alpha?: number): string {
  const { l, c, h } = fitGamut(color);
  const body = [round(l, HX_PRECISION.lc), round(c, HX_PRECISION.lc), round(h, HX_PRECISION.hue)].join(HX_CSS.space);
  const tail = alpha === undefined ? body : body + HX_CSS.slash + round(alpha, HX_PRECISION.lc);
  return `${HX_OKLCH}(${tail})`;
}

function normalizeSeed(seed: HxSeed | undefined): { hue: number; chroma: number } {
  const raw = seed === undefined ? HX_SEED_DEFAULT : isNumber(seed) ? { hue: seed } : seed;
  const hue = ((raw.hue % HX_TURN) + HX_TURN) % HX_TURN;
  return { hue, chroma: Math.max(0, raw.chroma ?? HX_SEED_DEFAULT.chroma) };
}

/** Picks the readable foreground on the primary fill: white unless the tinted dark wins. */
function onPrimary(fill: Lch): Lch {
  const white: Lch = { l: HX_ON_PRIMARY.lightL, c: 0, h: fill.h };
  const dark: Lch = { l: HX_ON_PRIMARY.darkL, c: fill.c * HX_ON_PRIMARY.darkChromaRatio, h: fill.h };
  return contrast(fill, white) >= contrast(fill, dark) ? white : dark;
}

/** Variables of one mode. */
function modeVars(mode: HxResolvedMode, hue: number, chroma: number): HxThemeVars {
  const plan = HX_LIGHTNESS[mode];
  const at = (l: number, c: number = chroma): Lch => fitGamut({ l, c, h: hue });
  const primary = at(plan.primary);
  const link = at(plan.link);
  const fg = fmtOklch(onPrimary(primary));
  const vars: HxThemeVars = {
    [HX_VAR.primary]: fmtOklch(primary),
    [HX_VAR.primaryHover]: fmtOklch(at(plan.hover)),
    [HX_VAR.primaryActive]: fmtOklch(at(plan.active)),
    [HX_VAR.primaryForeground]: fg,
    [HX_VAR.onPrimary]: fg,
    [HX_VAR.link]: fmtOklch(link),
    [HX_VAR.ring]: fmtOklch(link),
    [HX_VAR.primarySubtle]: mode === HX_MODE.light
      ? fmtOklch(at(plan.subtle, chroma * HX_SUBTLE.chromaRatio))
      : fmtOklch(primary, HX_SUBTLE.darkAlpha),
    [HX_VAR.primaryGlow]: fmtOklch(mode === HX_MODE.light ? primary : link, HX_GLOW_ALPHA[mode]),
  };
  for (const step of HX_ALPHA_STEPS) {
    vars[HX_VAR.alphaPrefix + step] = fmtOklch(primary, step / HX_PERCENT);
  }
  return vars;
}

/** Renders a variable map as one CSS rule. */
export function varsToCss(selector: string, vars: HxThemeVars): string {
  const lines = Object.entries(vars).map(([name, value]) => HX_CSS.indent + name + HX_CSS.colon + value + HX_CSS.semi);
  return [selector + HX_CSS.open, ...lines, HX_CSS.close].join(HX_CSS.newline);
}

/**
 * Derives primary, primary-hover, primary-active, on-primary (also written to
 * primary-foreground), ring, link, primary-subtle, primary-glow and primary-a5..a50
 * for both modes from one seed hue.
 */
export function createTheme(seed?: HxSeed): HxTheme {
  const { hue, chroma } = normalizeSeed(seed);
  const light = modeVars(HX_MODE.light, hue, chroma);
  const dark = modeVars(HX_MODE.dark, hue, chroma);
  return {
    seed: { hue, chroma },
    light,
    dark,
    toCss: (selectors?: HxThemeCssSelectors) => [
      varsToCss(selectors?.dark ?? HX_CSS_SELECTOR.dark, dark),
      varsToCss(selectors?.light ?? HX_CSS_SELECTOR.light, light),
    ].join(HX_CSS.newline + HX_CSS.newline),
  };
}

/** True when the value already is a createTheme result. */
export function isHxTheme(value: unknown): value is HxTheme {
  return isObject(value) && HX_MODE.light in value && HX_MODE.dark in value;
}
