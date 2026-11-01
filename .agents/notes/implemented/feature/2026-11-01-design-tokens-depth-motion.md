# Agent Note: 令牌层补齐深度, 品牌辅色与表现型动效

Status: implemented

Decision-ID: design-tokens-depth-motion

## Code

- `docs/src/pages/TokensPage.tsx`

## Problem

界面看起来平, 没动效, 根因在令牌层太薄: `--shadow-xs..xl` 五档几乎同值 (同一个 0.18 透明度, 最大模糊 10px, 亮暗同值); 表面只有 background / card / popover, card 与页面同底; 品牌色只有一支 primary; 动效只有 3 档时长与 ease-out / ease-in 两条曲线; 关键帧只有 5 条必需品. S1 到 S4 并行分片要直接写 `var(--ease-spring)`, `shadow-2xl`, `bg-surface-raised` 这类名字, 需要令牌层先把契约给出来.

## Decision

令牌本体在 `src/tokens.css` 与 `src/motion.css`. 两者是受保护的非 AST 资源, 不当 Code 锚点, 改动按 resource-review 走人工核对; Code 段只列能放声明锚点的演示页.

- `src/tokens.css` 新增 "深度与品牌" 一节, 亮暗各一套: `--surface-sunken / raised / overlay / glass`, `--glass-border`, `--primary-subtle`, `--primary-glow`, `--accent-2` (含 foreground / subtle), `--gradient-brand` (含 subtle 版), `--shadow-xs..2xl`, `--shadow-glow`, `--shadow-inner`, `--ring-glow`. 主题无关的 `--blur-glass`, `--glass-saturate` 只在 `:root` 定义一次.
- 阴影全部重写为双层 (近处锐影 + 远处柔影, 档位越高拉得越开). 亮色透明度更低并带蓝灰色相, 纯黑阴影在白底上发脏.
- 表面三级在暗色下越高越亮; 亮色下底已纯白, raised / overlay 同为白, 高度差交给阴影.
- `--accent-2` 取青而不是紫: 紫已经是 `--done` 的语义色.
- 动效刻度新增 `--duration-instant` (80ms), `--duration-emphasized` (500ms, 唯一允许超过 300ms 的进入档), 循环周期 `--duration-loop` / `--duration-ambient`; 曲线新增 `--ease-in-out`, `--ease-emphasized` (M3 emphasized-decelerate) 与配对的 accelerate, `--ease-spring`; 入场位移 `--motion-distance*` 与起始缩放 `--motion-scale-from`.
- `--ease-spring` 先给 `cubic-bezier(0.34, 1.56, 0.64, 1)` 回退, 再在 `@supports (transition-timing-function: linear(0, 1))` 里换成欠阻尼弹簧 (阻尼比 0.55) 的 37 点 `linear()` 采样, 峰值 1.126.
- 减弱动效: 令牌层把所有时长档, 位移距离归零, `--motion-scale-from` 归 1, `--ease-spring` 退回 `--ease-out`. 循环周期不归零 (0ms 的 infinite 动画在部分引擎会疯狂触发 iteration 事件), 由 `src/motion.css` 对循环类显式 `animation: none`.
- `src/styles.css` 的 `@theme inline` 桥接新颜色 / 阴影 / 曲线 / `--blur-glass`, 加 `--radius-2xl`, 登记 14 个 `--animate-*` 工具类, 时长与曲线全部取令牌.
- `src/motion.css` 新增 14 条 `hx-` 关键帧 (fade-in/out, fade-up/down, scale-in/out, blur-in, slide-in-left/right, pop, float, glow-pulse, gradient-pan, skeleton-sweep), `.hx-skeleton`, `.hx-gradient-pan`, `[data-hx-stagger]` 交错延迟; 每组后跟一段 reduced-motion 兜底. 退场类在减弱动效时保留 1ms 淡出, 让依赖 animationend 的调用方仍收到事件.
- 默认组件一个类名不改: 新令牌只给可选变体 (S6) 与新组件 (S1 到 S5) 用. `TokensPage` 增加表面, 玻璃, 品牌, 阴影, 曲线对比与关键帧演示.

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是上游 open-vetta 的 "零阴影, 只靠 1px 边框" 风格本身一致, 改令牌有视觉漂移风险. 否决: 默认组件不引用新令牌, 唯一的存量变化是 `--shadow-xs..xl` 的取值, 而它们本来只在浮层与拖拽中出现, 双层化正是要修的 "浮层看不出高度"; 不补令牌, S1 到 S4 只能各自在组件里写死阴影和曲线.
- 直接用 Tailwind 默认的 shadow / ease 刻度: 最强理由是零维护. 否决: Tailwind 默认阴影亮暗同值, 在 Dimmed 深灰底上几乎不可见, 且颜色不经 tokens.css, 违反 "颜色只有一个来源".
- 弹簧只用 cubic-bezier 近似: 最强理由是兼容性满分. 否决: 单段贝塞尔只能过冲一次且没有衰减振荡, 手感明显假; 用 `@supports` 让新浏览器拿真曲线, 旧浏览器拿近似, 两头都不坏.
- 关键帧放进 `@theme` 里随工具类 tree-shake: 最强理由是产物更小. 否决: S3 等分片的 css 与 `.hx-skeleton` 这类普通类也要引用同一批关键帧, 放在 motion.css 才能保证总是存在.

## Consequences

`--shadow-xs..xl` 的取值变了, 现有浮层 (popover / dropdown / dialog) 会比之前更有高度感; 这是本次唯一的存量视觉变化, PR 需附亮暗两套的 GIF. `linear()` 弹簧在不支持的浏览器上退化为 cubic-bezier 近似. 减弱动效下所有入场直接落到终态, 循环类停住, 骨架只留静态底色. 新的 `--animate-*` 名字与 `--color-surface-*` 等是 S1 到 S6 的契约, 改名需同步各分片.
