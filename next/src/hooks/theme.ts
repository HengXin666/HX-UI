/**
 * "@hx/ui/theme" 入口. 桶文件, 不写 "use client":
 * ThemeProvider / useTheme 来自客户端模块, themeScript / THEME_STORAGE_KEY 来自服务端安全模块,
 * 所以 Next.js 的 layout (服务端组件) 既能渲染 <ThemeProvider>, 也能把 themeScript 内联进 <head>.
 */
export { ThemeProvider, useTheme } from "./use-theme";
export { themeScript, THEME_STORAGE_KEY } from "./theme-script";
export type { ThemeMode, ThemeAccent } from "./theme-script";
