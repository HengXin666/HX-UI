# Agent Note: 文本动效族的指针意图 (surface/text/pointer)

Status: implemented

Decision-ID: surface-text-pointer

## Code

- `src/surface/text/pointer/tokens.ts`
- `src/surface/text/pointer/parts/extrude.ts`
- `src/surface/text/pointer/ExtrudeText.tsx`
- `src/surface/text/pointer/parts/wake.ts`
- `src/surface/text/pointer/WakeText.tsx`
- `src/surface/text/pointer/parts/draft.ts`
- `src/surface/text/pointer/DraftText.tsx`
- `src/surface/text/pointer/parts/stamp.ts`
- `src/surface/text/pointer/StampTrail.tsx`
- `src/surface/text/pointer/index.ts`
- `tests/surface/text/pointer-{extrude,wake,draft,stamp}.test.tsx`

## Problem

docs/research/catalog/textanimations.md 余下四个条目都由指针驱动: DepthText (叠层厚字随指针倾斜), EchoText (残影跟随指针), TechText (画布字形可拖, 带辅助线), TextCursor (跟随指针盖章的字). 上游许可是 MIT 加 Commons Clause, 只把条目的常数, props 和行为描述当规格, 用本库引擎重写, 自命名.

## Decision

条目到落点 (本段 4 件已齐):

| 条目 | 落点 | 参数 |
| --- | --- | --- |
| DepthText | `ExtrudeText` | 层数上限 64 (`layers` 默认 34), 层距 `depth` 2.4px, 入场 1200ms 三次缓出, 推深弹簧 260 / 17 (`stepSpringExact`), 悬停 `hoverPush`, 按下另加 0.25, `tilt` 7.5 度, `smoothing` 0.14 (按 60Hz 折成与帧率无关的指数), `perspective` 900, `autoOrbit` 自转 0.35 rad/s, `float` (幅度随推深的跟随比例 0.7), `gradientDepth`, `shadow`, `outline`, `intro` |
| EchoText | `WakeText` | `echoes` 12 (上限 32), `lag` 0.24 (每 60Hz 帧留下的比例, 链式一阶跟随), `offset` 36px, `direction`, `fade` 0.72, `blur` 3px, `tint` / `echoColors` (语义 token), `echoStyle` solid / outline, `echoScale`, `mode` drift / pointer / both (指针停 2600ms 回漂移), 漂移一周 7200ms, `clickBurst` (每层 1100ms, 层间隔 80ms), `cursorRadius` 320, `duration` 900ms 回位, `ease` |
| TechText | `DraftText` | DOM + SVG (不用画布): 回弹刚度 320, 阻尼 2√k (1 - 0.96 x `bounce` 0.4), 入场延迟 0.15s (`intro` none / type), 点击踢开向两侧每格 x 0.62 (`clickKick`), 描边量分 8 档, `reach` 200, `softness` 0.7, `dashLength` 4, `dashGap` 2, `strokeWidth` 1.5, `guides`, `selection`, `labels`, `draggable`; 跟随时间常数: 拖动 0.03s, 选框 0.08 / 0.1s, 描边 0.09s, 辅助线 0.14s |
| TextCursor | `StampTrail` | 区域组件 (包 children): `mode` stamp / trail, `spacing` 88px, `maxPoints` 7, `followMouseDirection`, `keepUpright`, `randomFloat`, `exitDuration` 0.5s, `removalInterval` 30ms (停下 0.12s 后起收), `shrink` 0.5, `fade` 0.6, `smoothing` 0.3 (x 0.1s 为跟随时间常数), `popIn` (0.18s), `hideCursor`, 帧长上限 0.05s |

做法:

- ExtrudeText 每帧只写舞台 (rig) 的 transform 与自定义属性 `--hx-extrude`; 各层的 `translateZ(calc(var(--hx-extrude) * -Npx))` 在 CSS 里算, 不重渲染. 倾角与推深都落定且不自转不漂浮时帧循环停下, `usePointerField` 的事件唤醒.
- WakeText 每帧只写各层 transform (残影 ≤ 32 层); 模糊与不透明度在渲染时定, 不逐帧改 filter.
- DraftText 用 DOM 字格与 SVG 辅助线, 不走画布: 字格天然可读, 选框能直接取 offsetLeft / offsetWidth, 描边用 -webkit-text-stroke 与 color-mix, 比例写在 --hx-fill / --hx-edge 两个自定义属性里.
- StampTrail 预渲染 maxPoints + 1 个槽位循环复用, 新章只写一次 textContent; 章整体 aria-hidden (装饰), 区域正文照常可读. 帧循环按需起停 (TEXT_CLOCK), 没有活章且指针不在时停.
- pointercancel 与 pointerleave 一样收尾 (内核 `usePointerField`), 触屏被系统手势打断不会卡在推深态.
- 颜色: `faceTone` / `depthTone` 只收语义 token 名, 落成 `var(--name)`; 渐变深度与投影用 `color-mix(... transparent)`, 不写色值, 亮暗两套皮肤各自生效.
- 减弱动效: 首帧同步查 `prefersReducedMotion()`, 厚度直接到位, 不倾斜不漂浮, 帧循环不起.
- 读屏: 一份 sr-only 原文 (内核 `TextShell`), 叠层整体 aria-hidden.

## Alternatives considered

- 用 text-shadow 叠出厚度: 否决, text-shadow 只能平移不能沿 Z 后退, 倾斜时侧面不跟透视变形.
- 每帧逐层写 transform: 否决, 64 层每帧 64 次写样式; 改一个自定义属性由 CSS 算.

## Consequences

- 没有落的视觉: DepthText 的紫色默认深度色 (改为 `var(--primary)`), 字体主题; EchoText 的写死浅蓝 tint (改为 `accent-2`), `trail` prop (与 `mode` 重叠, 未收), 滚动触发; TechText 的 specks 星点, sweep 扫线, reveal=area, 画布字体参数 (fontFamily, letterSpacing, align).
- 未接 IntersectionObserver: 静止时本来就停帧, 自转或漂浮时离屏仍会跑, 由 TEXT_FRAME 在页面隐藏时停.
- 本段 4 件齐之前只维护族 index.ts, 不接 src/surface/index.ts, 不动 api 快照与版本 (用户 2026-11-10 裁定), 齐了一次性接入并升一次版本.
