# 分层与入口

本文件规定 HX-UI 从控件库到页面引擎的分层, 每层的入口, 以及新代码应该放在哪一层. 组件契约仍以 [component-contract.md](component-contract.md) 为准, 镜头词汇见 [studio.md](studio.md). 单次取舍见 `.agents/notes/implemented/architecture/2026-11-08-layered-entries.md` 与 `.agents/notes/implemented/feature/2026-11-08-viz-layer.md`.

## 1. 六层

| 层 | 入口 | 放什么 | 不放什么 |
|---|---|---|---|
| L0 令牌与皮肤 | `@hx/ui/tokens.css`, `@hx/ui/skins.css` | 颜色, 时长, 缓动, 密度 | 组件 |
| L1 原语 | `@hx/ui` | 控件与版式件 | 新增导出. 根桶冻结, 只删不增 |
| L2 运动 | `@hx/ui/motion` | 入场, 交错, 可中断弹簧, 按位数字, 分段拇指, 镜头 | 业务组件 |
| L3 可视化 | `@hx/ui/viz` | 比例尺, 柱状, 趋势, 环形, 漏斗, 时间线, 流程图, 指标 | 多轴, 堆叠, 地图 (走 `src/charts`) |
| L4 区块 | `@hx/ui/blocks` | 站点, 营销, 电商, 文档, 作品集, 仪表盘区块 | 整页 |
| L5 页面 | `@hx/ui/page` | 页面描述, 默认注册表, `Page`, `createPage` | 文案 |

依赖只向下: 页面层可以引区块和可视化, 区块不引页面层, 可视化不引区块. `@hx/ui/studio` 是兼容入口, 新代码不再从那里取.

## 2. 拼一页

```tsx
import { Page, definePage, section } from "@hx/ui/page";

const spec = definePage({
  sections: [
    { type: "hero", props: { title: "...", actions: [] } },
    section("funnel", { heading: { title: "转化" }, label: "本月", stages }),
    { type: "flow", props: { heading: { title: "履约" }, label: "履约", nodes, edges } },
    { type: "pricing", props: { plans } },
  ],
});

export default function Landing() {
  return <Page spec={spec} />;
}
```

- `type` 只能是注册表里的名字, `props` 按该组件的类型检查.
- 可视化区块由 `framed` 包上 `BlockShell`, 多出 `heading` 与 `tone`, `pad`, `width` 等外壳字段.
- 自定义区块: `const kit = createPage({ banner: Banner })`, 然后 `kit.define` 与 `kit.Page`. 同名覆盖默认注册表.

默认注册表的四组: `SITE_SECTIONS` (announcement, header, footer), `MARKETING_SECTIONS` (hero, logos, features, bento, alternating, showcase, figures, stats, testimonials, tweets, cases, pricing, matrix, faq, cta, newsletter, code, install, changelog), `COMMERCE_SECTIONS` (campaign, promo, categories, products, rail, product, search, cart, checkout), `DATA_SECTIONS` (kpis, activity, metrics, rings, bars, trend, funnel, flow, timeline, process, compare).

## 3. 可视化的动效合同

通用数字沿用 `docs/research/craft.md`, 每种图的手感对齐 `docs/research/video-shotcraft.md` 的镜头卡. 帧数按 30fps 换成秒, 集中在 `src/viz/tokens.ts` 的 `VIZ_SHOT` 与 `VIZ_SPRING`.

| 组件 | 镜头卡 | 落到库里 |
|---|---|---|
| `Trend` / `BarChart` | chart-live-moves 的 axis-rescale-shock | 越界先按旧比例冲出画框 14f, 停 18f 让人看见轴坏了, 再 200ms 重标; 旧刻度滑到新位置淡出, 新刻度从旧位置滑进来 |
| `Ring` / `RingRow` | gauge-readout-moves 的 needle-sweep-selftest | 入场 12f ease-out 甩满整圈, 回程弹簧过冲落真值, 落定后数字才滚; 一排表错峰 4f |
| `FlowGraph` | canvas-materialize-moves 的 diagram-cascade | 列间 22f, 兄弟 5f, 连线比子节点早 10f 描出 16f; 节点从左侧端口用 190 / 14 弹簧拉出, 不从中心缩放 |
| `Funnel` | gauge-readout-moves 的落定报数 | 条落定那一刻数值才滚, 转化率随之淡入 |
| `Timeline` | timeline-travel 的弹卡 | 以轨道一侧为轴从 0.6 立起, 弹簧 160 / 11 / 0.9 明显过冲, 刚露头就起弹 |

共同规则:

- 首次进入视口按发牌错峰入场, 间隔从 120ms 收到 40ms, 总长有上限.
- 入场之后的数据更新用 thumb 弹簧 (220 / 26 / 1) 从当前值继续, 不从 0 重播.
- 落定后至少 36f 真静止. 流程脉冲在当前节点变化后走两趟就停, 不无限循环.
- 只动 transform, opacity, pathLength, strokeDashoffset. 线宽 1px. 颜色只走语义令牌.
- 减弱动效: 直接终态, 不留越界那一拍, 不自检, 不播脉冲. 读屏只读终值, 柱子与节点可键盘遍历.
- 镜头卡里只属于成片的部分不进组件默认态: 成树后的整棵呼吸, 相机推近, 彗星线头.

## 4. 第二阶段

已做 (2026-11-08):

1. 镜头语言 `src/studio/moves.ts` 迁入 `src/motion/shots.ts` (L2), 字面量就地写回; 旧路径留一版 `export *` 转发, `@hx/ui/motion` 直接转出 shots.
2. `src/studio/figures.ts` 的数字别名在 studio 与 motion 里全部写回字面量. 只剩文档站首页 `docs/face` 用的六个, 那边改完后删整个文件.
3. `src/constants` 下按版本号命名的区块常量按域改名: site, marketing-hero / features / proof / pricing / developer, commerce-browse / trade, docs, dashboard, portfolio. 旧文件名留一版转发. 区块与文档页的 import 没有批量改: 质量门把被改文件的历史债按新增算, 批量改 import 会一次带出约 117 条旧 Error (常量重复, 绝对路径, 导入环, 超长文件). 各区块目录下次改动时顺手换 import, 转发清空后删除.

不做:

- `src/primitives/motion.ts` (减弱动效判断, 布局位移) 留在 L1. 原语 (presence, carousel, motion-list) 自己要用, 搬上 L2 会让依赖朝上走. `@hx/ui/motion` 只转出.

还没做:

1. `src/craft` 物理迁入 `src/motion`: 文档站首页正在改 craft, 等那边收工.
2. `scripts/gates` 下的 .mjs 迁 .ts, 清掉 HC-EXT 历史项.
3. 文档站为 viz 与 page 加舞台和道具台, 并按 PR GIF 规约录制演示.
