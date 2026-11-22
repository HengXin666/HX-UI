/**
 * @hx/ui 2 公共入口.
 * components/ui (shadcn 基础件, 按文件引), motion, effects, data, hooks, interactions.
 */
export { cn } from "./lib/utils";
export { ThemeProvider, useTheme, themeScript } from "./hooks/use-theme";
export type { ThemeMode, ThemeAccent } from "./hooks/use-theme";
export * as Motion from "./motion";
export * as Effects from "./effects";
export * as Data from "./data";
export * from "./interactions";
