/**
 * @hx/ui 2 公共入口. 三层定位见 docs/positioning.md.
 * L1 控件: components/ui (shadcn 基础件, 按文件引), motion, data, hooks.
 * L2 交互: interactions (一件一个产品瞬间, 按名字引, 可摇树).
 * L3 成品: 仓库根的 sites/, 不进 npm, 走 registry 拷贝.
 * effects/ 是旧特效, R2 逐个审: 能变成交互的迁入 interactions, 其余删除.
 */
export { cn } from "./lib/utils";
export { ThemeProvider, useTheme, themeScript } from "./hooks/use-theme";
export type { ThemeMode, ThemeAccent } from "./hooks/use-theme";
export * as Motion from "./motion";
export * as Effects from "./effects";
export * as Data from "./data";
export * from "./interactions";
