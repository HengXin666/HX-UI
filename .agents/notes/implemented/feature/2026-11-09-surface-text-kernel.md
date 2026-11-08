# Agent Note: 文本动效族 (surface/text) 的共用内核

Status: implemented

Decision-ID: surface-text-kernel

## Code

- `src/surface/text/kernel/tokens.ts`
- `src/surface/text/kernel/split.ts`
- `src/surface/text/kernel/stagger.ts`
- `src/surface/text/kernel/curve.ts`
- `src/surface/text/kernel/settle.ts`
- `src/surface/text/kernel/use-playhead.ts`
- `src/surface/text/kernel/scroll.ts`
- `src/surface/text/kernel/pointer.ts`
- `src/surface/text/kernel/canvas.ts`
- `src/surface/text/kernel/TextShell.tsx`
- `tests/surface/text/kernel.test.tsx`

## Problem

L3 surface 层要落 docs/research/catalog/textanimations.md 的全部 33 个条目. 这些条目各自带一套拆字, 错峰, 乱码停格, 滚动进度和指针距离的写法, 常数不同但机制相同. 上游许可是 MIT 加 Commons Clause, HX-UI 以 Apache-2.0 发包, 不能移植, 只能把条目的常数, props 和行为描述当规格, 用本库引擎重写. 如果每件各写一遍, 同一个机制会出现 33 份细节不一的实现, 而且容易各自起 rAF 和弹簧.

## Decision

先抽一层内核, 各件只换参数:

- 拆分 `splitText` / `splitCells`: 按字 (Intl.Segmenter 字素, 退到码点) 或按词, 空白原样保留不编号.
- 错峰 `staggerRanks`: start / end / center / edges / random / evenodd 六种名次; `cappedStep` 取 CountUp 条目的封顶规则 (间隔不超过 0.07s, 总量不超过整段 40%), `unitSpan` / `unitProgress` 按名次切单元进度.
- 曲线 `midpoint` (BlurText 的模糊中点: 前半段降到 mid, 后半段才清晰), `smoothstep`, `falloff` (linear / exponential / gaussian, VariableProximity 与 TextPressure 的距离衰减), `hash01` 确定性伪随机.
- 按位停格 `lockTimes` / `settleAt` / `rollGlyph`: 纯函数, 时间进字串出, 同一时刻同一帧; 乱码与翻牌, 打字共用.
- 播放头 `usePlayhead`: mount / view / hover / click / manual 五种触发, 循环与循环间隔, 走 `motion/frame/use-frame-loop`; 减弱动效时首帧就在终点.
- 滚动 `viewProgress` 与 `useScrollFrame`: 纯函数算进度, 滚动事件唤醒帧循环, 同时给出滚动速度 (像素/秒).
- 指针 `usePointerField`: 元素局部坐标, pointercancel 与 pointerleave 一样收尾, 可在窗口上听移动.
- 画布底座 `useCanvasText`: 用不可见但占位的原文量尺寸, 读它的计算颜色与字体 (颜色来自语义 token 类), 像素比封顶 2; 没有 2d 上下文时什么都不画.
- 外壳 `TextShell`: 读屏读一份 sr-only 原文, 视觉层整体 aria-hidden.

本内核不起自己的 rAF, 也不写弹簧积分: 帧循环一律 `useFrameLoop`, 弹簧在各件里用 `motion/spring/fit` 换算, `motion/spring/step` 或 `motion/drive/*` 推进.

## Alternatives considered

- 直接复用 src/motion 的 SplitText / Stagger: 最强理由是已有 motion/react 的 staggerChildren. 否决: 那是声明式变体, 只有入场, 拿不到单元进度, 做不了滚动刮擦, 按位停格和指针邻近.
- 内核放进 src/motion: 最强理由是 motion 是引擎层. 否决: 拆字, 乱码字符表和外壳是文本语义, 不是通用动效; 本批也不改 src/motion 的现有件.
- 每件自带工具函数: 否决, 正是要避免的 33 份重复.

## Consequences

后续各批 (stagger / glyph / scroll / pointer) 只依赖本内核和 src/motion. 本批不改 src/index.ts, 也不建 src/surface/index.ts, 导出入口由主线统一接. 播放头每帧 setState 重渲染, 对一行标题量级的单元数足够; 若以后要上百个单元的长段落, 应换成直接写 DOM 的通道.
