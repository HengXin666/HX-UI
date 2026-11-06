/**
 * Runtime theme layer (src/provider) literals: attribute names, CSS variable names,
 * oklch color math coefficients and the per-mode lightness plan used by createTheme.
 */

/**
 * Theme modes accepted by HxProvider; system follows prefers-color-scheme.
 *
 * .agents/notes/implemented/feature/2026-11-02-runtime-theme-provider.md
 */
export const HX_MODE = {
  light: "light",
  dark: "dark",
  system: "system",
} as const;

/** Density levels; compact shrinks the Tailwind spacing unit for the scope. */
export const HX_DENSITY = {
  comfortable: "comfortable",
  compact: "compact",
} as const;

/** Tailwind v4 spacing unit per density (comfortable equals the Tailwind default). */
export const HX_SPACING = {
  comfortable: "0.25rem",
  compact: "0.21875rem",
} as const;

/** Event fired by MediaQueryList when the scheme flips. */
export const HX_CHANGE_EVENT = "change";

/** Media query matching the light scheme: tokens.css treats dark as the default. */
export const HX_LIGHT_QUERY = "(prefers-color-scheme: light)";

/** Attributes written on the scope element (or documentElement for the root scope). */
export const HX_ATTR = {
  mode: "data-mode",
  density: "data-density",
  reducedMotion: "data-reduced-motion",
  provider: "data-hx-provider",
} as const;

/** Inheritable text color so a locally re-themed subtree also recolors plain text. */
export const HX_SCOPE_COLOR = "var(--foreground)";

/** Default class of the local scope wrapper: no box of its own, layout is unaffected. */
export const HX_SCOPE_CLASS = "contents";

/** Scope kinds: root writes on documentElement (portals included), local renders a wrapper. */
export const HX_SCOPE = {
  root: "root",
  local: "local",
} as const;

/** CSS variables produced by createTheme; existing token names are kept for compatibility. */
export const HX_VAR = {
  primary: "--primary",
  primaryHover: "--primary-hover",
  primaryActive: "--primary-active",
  primaryForeground: "--primary-foreground",
  onPrimary: "--on-primary",
  ring: "--ring",
  link: "--link",
  primarySubtle: "--primary-subtle",
  primaryGlow: "--primary-glow",
  alphaPrefix: "--primary-a",
  radius: "--radius",
  spacing: "--spacing",
} as const;

/** Alpha steps (percent) emitted as --primary-a5 ... --primary-a50. */
export const HX_ALPHA_STEPS = [5, 10, 15, 20, 30, 40, 50] as const;

/** Unit suffix for numeric radius values. */
export const HX_PX = "px";

/** Percent divisor for alpha steps. */
export const HX_PERCENT = 100;

/** Motion tokens forced to zero when reducedMotion is true (mirrors the tokens.css media query). */
export const HX_MOTION_REDUCED: Record<string, string> = {
  "--duration-instant": "0ms",
  "--duration-fast": "0ms",
  "--duration-base": "0ms",
  "--duration-slow": "0ms",
  "--duration-emphasized": "0ms",
  "--duration-ripple": "0ms",
  "--motion-distance-sm": "0px",
  "--motion-distance": "0px",
  "--motion-distance-lg": "0px",
  "--motion-scale-from": "1",
  "--ease-spring": "var(--ease-out)",
};

/** Motion tokens restored when reducedMotion is false, equal to the tokens.css defaults. */
export const HX_MOTION_FULL: Record<string, string> = {
  "--duration-instant": "80ms",
  "--duration-fast": "120ms",
  "--duration-base": "200ms",
  "--duration-slow": "300ms",
  "--duration-emphasized": "500ms",
  "--duration-ripple": "500ms",
  "--motion-distance-sm": "4px",
  "--motion-distance": "8px",
  "--motion-distance-lg": "24px",
  "--motion-scale-from": "0.95",
  "--ease-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
};

/** Radix and digit count of a JS unicode escape, used when inlining JSON into a script tag. */
export const HX_UNICODE_ESCAPE = { radix: 16, width: 4 } as const;

/** Boolean attribute values. */
export const HX_BOOL = { true: "true", false: "false" } as const;

/** CSS function name of the perceptual color space used by createTheme. */
export const HX_OKLCH = "oklch";

/** Default seed: hue of the stock GitHub blue primary, chroma close to it. */
export const HX_SEED_DEFAULT = { hue: 255, chroma: 0.16 } as const;

/** Full turn in degrees and the degree to radian factor. */
export const HX_TURN = 360;
export const HX_DEG_TO_RAD = Math.PI / (HX_TURN / 2);

/** Decimal places when serializing lightness / chroma, and hue. */
export const HX_PRECISION = { lc: 3, hue: 1 } as const;

/** Bisection steps when pulling chroma back into the sRGB gamut, and the channel tolerance. */
export const HX_GAMUT = { steps: 24, epsilon: 0.0005 } as const;

/** OKLab to LMS' (cube root space) matrix rows, coefficients from Bjorn Ottosson. */
export const HX_OKLAB_TO_LMS = [
  [0.3963377774, 0.2158037573],
  [-0.1055613458, -0.0638541728],
  [-0.0894841775, -1.291485548],
] as const;

/** Linear LMS to linear sRGB matrix. */
export const HX_LMS_TO_SRGB = [
  [4.0767416621, -3.3077115913, 0.2309699292],
  [-1.2684380046, 2.6097574011, -0.3413193965],
  [-0.0041960863, -0.7034186147, 1.707614701],
] as const;

/** Relative luminance weights of linear sRGB channels (WCAG). */
export const HX_LUMA = [0.2126, 0.7152, 0.0722] as const;

/** WCAG contrast offset. */
export const HX_CONTRAST_OFFSET = 0.05;

/** Foreground candidates on a primary fill: near white and a hue tinted near black. */
export const HX_ON_PRIMARY = { lightL: 1, darkL: 0.22, darkChromaRatio: 0.15 } as const;

/**
 * Lightness plan per mode. Light mode darkens the fill to keep contrast on white and
 * hover goes darker; dark mode uses a brighter link and hover goes lighter.
 */
export const HX_LIGHTNESS = {
  light: { primary: 0.54, hover: 0.49, active: 0.44, link: 0.54, subtle: 0.95 },
  dark: { primary: 0.55, hover: 0.6, active: 0.5, link: 0.7, subtle: 0.55 },
} as const;

/** Chroma ratio of the subtle fill, alpha of the subtle fill in dark mode and of the glow. */
export const HX_SUBTLE = { chromaRatio: 0.3, darkAlpha: 0.15 } as const;
export const HX_GLOW_ALPHA = { light: 0.24, dark: 0.38 } as const;

/** Selectors used by createTheme().toCss() when the caller gives none. */
export const HX_CSS_SELECTOR = {
  light: "[data-mode=\"light\"]",
  dark: ":root, [data-mode=\"dark\"]",
} as const;

/** Text pieces of generated CSS. */
export const HX_CSS = { open: " {", close: "}", colon: ": ", semi: ";", indent: "  ", newline: "\n", space: " ", slash: " / " } as const;

/** True when a DOM is available (browser), false during SSR. */
export const hasDom = (): boolean => typeof window !== "undefined" && typeof document !== "undefined";

/** Number guard; typeof narrowing needs the literal, so it lives here once. */
export const isNumber = (value: unknown): value is number => typeof value === "number";

/** Non-null object guard. */
export const isObject = (value: unknown): value is object => typeof value === "object" && value !== null;
