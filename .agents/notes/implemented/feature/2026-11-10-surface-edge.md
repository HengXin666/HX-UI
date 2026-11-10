# Agent Note: 沿边框行进或放电的描边 (surface/edge)

Status: implemented

Decision-ID: surface-edge

## Code

- `src/surface/edge/tokens.ts`
- `src/surface/edge/parts/comet.ts`
- `src/surface/edge/CometBorder.tsx`
- `src/surface/edge/index.ts`
- `tests/surface/edge/comet.test.tsx`

## Problem

docs/research/catalog/animations.md 的 StarBorder 与 ElectricBorder 都是包住内容的边框, 光点或电弧沿边行进, 画在向外多出的画布上. 上游许可是 MIT 加 Commons Clause, 只把条目的常数, props 和行为描述当规格, 用本库引擎重写, 自命名.

## Decision

| 条目 | 落点 | 参数 |
| --- | --- | --- |
| StarBorder | `CometBorder` | 画布外扩 `BLEED` 48px, 悬停加跑一圈 `LAP` 0.9s (三次缓入缓出), 一圈下限 0.3s, 帧长 0.001 到 0.05s, 速度跟随 0.45s, 显现 0.16 / 0.45s, 加亮 0.18 / 0.5s, 点击闪光衰减 0.22s, 火星发射 (2 + 6 x min(2, pace)) x stars 每秒, 火星阻力 2.2/s; props `duration` 4, `thickness` 1, `radius` 12, `trailLength` 0.3, `stars` 1, `glow` 0.6, `sparkle`, `direction`, `hover` lap / boost / none, `clickPulse`, `tone` |

做法:

- CometBorder 内容在 DOM 里照常可读可交互, 1px 底边走 `border-border`; 画布 aria-hidden, pointer-events none, 向外扩 48px 画彗星, 尾巴 28 段按 (1 - i/n)^2 渐隐, 光晕用 shadowBlur.
- 圆角矩形按弧长取点 (`roundRectPoint`), 多颗彗星沿周长均分. 火星沿法向外飘, 同屏上限 160.
- 颜色: 色调只收语义 token (`SurfaceTone`), 由一个隐藏的探针 span 挂 text-* 类, 读计算后的 color 交给画布; 不写色值, 换皮肤后重配画布时重读.
- 悬停与键盘聚焦同样触发 hover 行为. 帧循环 `active` = 在视口内且不减弱动效, 页面隐藏停帧.
- 减弱动效: 首帧同步查 `prefersReducedMotion()`, 彗星停在起点只画一帧, 不洒火星.

## Alternatives considered

- SVG stroke-dashoffset 跑光: 否决, 沿路径的渐隐尾巴与光晕火星做不出.

## Consequences

- 没有落的: StarBorder 的 THEMES 视觉主题 (theme, backgroundColor, textColor, borderColor, color, trailColor 改为语义 token 与 tone), 速度慢时的 still 系数.
