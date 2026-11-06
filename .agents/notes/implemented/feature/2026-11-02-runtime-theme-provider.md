# Agent Note: 运行时主题层 HxProvider, 只在显式包裹时写变量, 不包裹时零输出

Status: implemented

Decision-ID: runtime-theme-provider

## Code

- `src/provider/HxProvider.tsx`
- `src/constants/provider.ts`
- `src/index.ts`

## Problem

tokens.css 只能整站静态换肤, 下游需要在运行时切换明暗, 换强调色, 调圆角与密度, 强制减弱动效, 并在一块子树里局部换肤 (预览卡, 嵌入面板). 同时 AGENTS.md 要求不改现有组件默认外观, 下游截图依赖现状.

## Decision

- 新建 src/provider: HxProvider (组件), create-theme.ts (oklch 纯计算), context.ts (useTheme / useDefaults), scope.ts (变量与属性构建, system 跟随, 根作用域写入), theme-script.ts (getThemeScript), index.ts (桶).
- 所有 prop 可选, 未给的 prop 不写任何变量或属性; 不包 Provider 时没有任何代码路径被执行, 组件渲染与之前逐字节一致. 现有组件本次不接 useDefaults, 接入留给集成任务.
- 最外层 Provider 默认 root 作用域: 写到 documentElement 并在卸载时还原, 不渲染元素, 弹层 portal 也能拿到变量. 嵌套 Provider 默认 local: 渲染 display: contents 的包裹层, 在其上写 data-mode 与内联变量, 并把 color 设为 var(--foreground), 子树内普通文字也随之换色.
- createTheme 在 oklch 中按亮暗两套明度表推导 primary / hover / active / on-primary / ring / link / subtle / glow 与 primary-a5..a50, 二分降低彩度收回 sRGB 色域, on-primary 按 WCAG 对比度在白与深色间选择. 沿用现有 token 名 (primary-foreground, ring, link), 组件无需改动即可换色.
- density 通过 Tailwind v4 的 --spacing 单位实现; reducedMotion 覆盖 tokens.css 的动效令牌, false 时写回默认值以压过系统媒体查询.
- system 模式用 useSyncExternalStore 订阅 prefers-color-scheme, 服务端快照取 dark (tokens.css 默认), 水合不产生不一致.

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是 tokens.css 加 data-mode 已能整站切明暗, 文档站 ThemeToggle 已示范. 否决: 无法运行时换强调色, 无法局部换肤, 也没有全局默认 props.
- 每次换色生成并注入 style 标签: 能写选择器, 明暗都可预置. 否决: 嵌套作用域需要唯一选择器与清理, SSR 时还要同步插入, 内联变量更简单且天然只影响子树.
- 直接修改组件默认类名接入主题: 否决, 违反默认外观不变的硬约束.

## Consequences

下游可选接入, 不接入无变化. motion.css 中循环类动画在系统减弱动效时由媒体查询直接关闭, reducedMotion=false 无法恢复它们. src/index.ts 的导出由集成任务 P0-Z 完成, 之前只能从 src/provider 引用.
