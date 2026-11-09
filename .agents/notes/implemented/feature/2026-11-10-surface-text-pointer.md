# Agent Note: 文本动效族的指针意图 (surface/text/pointer)

Status: implemented

Decision-ID: surface-text-pointer

## Code

- `src/surface/text/pointer/tokens.ts`
- `src/surface/text/pointer/parts/extrude.ts`
- `src/surface/text/pointer/ExtrudeText.tsx`
- `src/surface/text/pointer/index.ts`
- `tests/surface/text/pointer.test.tsx`

## Problem

docs/research/catalog/textanimations.md 余下四个条目都由指针驱动: DepthText (叠层厚字随指针倾斜), EchoText (残影跟随指针), TechText (画布字形可拖, 带辅助线), TextCursor (跟随指针盖章的字). 上游许可是 MIT 加 Commons Clause, 只把条目的常数, props 和行为描述当规格, 用本库引擎重写, 自命名.

## Decision

条目到落点 (本段逐件补行):

| 条目 | 落点 | 参数 |
| --- | --- | --- |
| DepthText | `ExtrudeText` | 层数上限 64 (`layers` 默认 34), 层距 `depth` 2.4px, 入场 1200ms 三次缓出, 推深弹簧 260 / 17 (`stepSpringExact`), 悬停 `hoverPush`, 按下另加 0.25, `tilt` 7.5 度, `smoothing` 0.14 (按 60Hz 折成与帧率无关的指数), `perspective` 900, `autoOrbit` 自转 0.35 rad/s, `float` (幅度随推深的跟随比例 0.7), `gradientDepth`, `shadow`, `outline`, `intro` |

做法:

- ExtrudeText 每帧只写舞台 (rig) 的 transform 与自定义属性 `--hx-extrude`; 各层的 `translateZ(calc(var(--hx-extrude) * -Npx))` 在 CSS 里算, 不重渲染. 倾角与推深都落定且不自转不漂浮时帧循环停下, `usePointerField` 的事件唤醒.
- pointercancel 与 pointerleave 一样收尾 (内核 `usePointerField`), 触屏被系统手势打断不会卡在推深态.
- 颜色: `faceTone` / `depthTone` 只收语义 token 名, 落成 `var(--name)`; 渐变深度与投影用 `color-mix(... transparent)`, 不写色值, 亮暗两套皮肤各自生效.
- 减弱动效: 首帧同步查 `prefersReducedMotion()`, 厚度直接到位, 不倾斜不漂浮, 帧循环不起.
- 读屏: 一份 sr-only 原文 (内核 `TextShell`), 叠层整体 aria-hidden.

## Alternatives considered

- 用 text-shadow 叠出厚度: 否决, text-shadow 只能平移不能沿 Z 后退, 倾斜时侧面不跟透视变形.
- 每帧逐层写 transform: 否决, 64 层每帧 64 次写样式; 改一个自定义属性由 CSS 算.

## Consequences

- 没有落的视觉: 条目的紫色默认深度色 (改为 `var(--primary)`), 字体主题.
- 未接 IntersectionObserver: 静止时本来就停帧, 自转或漂浮时离屏仍会跑, 由 TEXT_FRAME 在页面隐藏时停.
- 本段 4 件齐之前只维护族 index.ts, 不接 src/surface/index.ts, 不动 api 快照与版本 (用户 2026-11-10 裁定), 齐了一次性接入并升一次版本.
