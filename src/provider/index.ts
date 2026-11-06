/**
 * Public API of the runtime theme layer. src/index.ts re-exports it in the integration task.
 */
export { HxProvider, type HxProviderProps } from "./HxProvider";
export {
  createTheme, varsToCss, isHxTheme,
  type HxSeed, type HxTheme, type HxThemeVars, type HxThemeCssSelectors, type HxResolvedMode,
} from "./create-theme";
export {
  useTheme, useDefaults, mergeDefaults, HxThemeContext,
  type HxMode, type HxDensity, type HxDefaults, type HxThemeValue,
} from "./context";
export { getThemeScript, type HxThemeScriptOptions } from "./theme-script";
