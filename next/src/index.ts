/**
 * @hx/ui 2 公共入口.
 * 分层: components/ui (shadcn 基础件) → motion (动效) → effects (特效) → data (图表 / 表格) → blocks (整段区块).
 * 基础件直接从 "@hx/ui/components/ui/<name>" 引, 与 shadcn 用法一致; 这里转出上层.
 */
export { cn } from "./lib/utils";
export { ThemeProvider, useTheme, themeScript } from "./hooks/use-theme";
export type { ThemeMode, ThemeAccent } from "./hooks/use-theme";
export * as Motion from "./motion";
export * as Effects from "./effects";
export * as Data from "./data";
