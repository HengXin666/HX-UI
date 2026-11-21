# Agent Note: 数据可视化自研轻内核, 先落 scale / axis / format 纯函数

Status: implemented

Decision-ID: omni-data-kernel

## Code

- `src/viz/kernel-scale.ts`
- `src/viz/kernel-axis.ts`
- `src/viz/kernel-format.ts`
- `src/viz/data.ts`
- `src/constants/data-scale.ts`
- `src/constants/data-stage.ts`
- `src/viz/kernel-stage.tsx`
- `src/viz/charts/Line.tsx`
- `src/viz/charts/Bar.tsx`
- `src/viz/charts/Trend.tsx`
- `src/viz/charts/BarChart.tsx`
- `src/viz/charts/Scatter.tsx`
- `src/viz/charts/Area.tsx`
- `src/viz/charts/Heatmap.tsx`
- `src/entry/data-recharts.ts`
- `package.json`

## Problem

现有 `src/viz/scale.ts` 只有线性比例尺, 图种只有 BarChart, Trend, Ring; 其余图依赖 Recharts, 体积大且动效与运动内核 (omni-motion-recipe-clock) 不统一. omni 1.0 第一批要 14 个图种 (docs/architecture/omni-1.0.md), 需要一套共用的比例尺, 坐标轴与格式化.

## Decision

- 新入口 `@hx/ui/data` (`src/viz/data.ts`, 与 viz 同目录: 共用 `scale.ts` 的 nice 算法, 文件名带 kernel- 前缀与旧的 viz 组件区分). 连续比例尺 linear / log / sqrt / time 共用 `ContinuousScale` 接口 (调用, domain, range, ticks, invert, nice), 离散的 band / point 用 `BandScale` (未知键返回 undefined). 线性 nice 算法复用 `src/viz/scale.ts`, 不复制.
- log 定义域含 ≤ 0 时抛 RangeError, 不静默截断; sqrt 负值按 0.
- 时间刻度按 "跨度 / 刻度数" 在档表里选档, 秒到日按毫秒步进, 月与年按日历步进, 全部以 UTC 对齐, 标签也按 UTC 格式化, 结果与运行时区无关.
- `axisTicks` 只返回 `{ value, px, label }`, 不画; 标签用等宽估算抽稀 (隔一取一, 保留首尾), 服务端可跑. `axisRescale` 包 `punchDomain`, 返回 shocked 给 axis-rescale-shock.
- 格式化统一 `Intl.NumberFormat` / `Intl.DateTimeFormat`, 按参数缓存格式器.
- 档表, 默认刻度数, band 留白, 标签估算宽度收在 `src/constants/data-scale.ts`.

- 批 9: `DataStage` 量宽 (复用 `hooks/dom/useResizeObserver`), 算绘图区, 决定 svg / canvas (auto 按合计点数, 阈值 `CANVAS_THRESHOLD`), 给绘图区 `role="img"` 与读屏摘要. 图种只在绘图区里画.
- `Line` (多序列, 类目或时间轴, 受控进度, 面积) 与 `Bar` (分组 / 堆叠, 纵 / 横, 只出 SVG) 复用 `useVizStage` 的视口, 减弱动效与发牌错峰, 不另起时钟. 越界只用 `axisRescale` 打 `data-shock` 标记, 冲击动画仍归 viz 的 Trend / BarChart.
- viz 的 Trend 改用 Line 导出的 `seriesGeometry`, BarChart 改用 Bar 导出的 `barFill`; 两者 props, 冲击时序, 键盘交互不变, 现有测试一行未改.
- 批 10: `Scatter` (两条线性轴, size 按面积 sqrt 映射半径, 分组色阶, 超阈值走 canvas), `Area` (堆叠, offset zero / expand, 负值与缺值按 0, 横轴与 Line 共用 `xPositions`), `Heatmap` (行 × 列, 单色阶透明度, 下限 0.08 让最小格可见, 缺格不画, 摘要说出最大格). 纯函数 `placePoints`, `radiusScale`, `stackSeries`, `bandPath`, `heatOpacity`, `heatPeak` 一并从 `@hx/ui/data` 导出.
- 批 11: Recharts 套壳图降为适配器入口 `@hx/ui/data/recharts` (`src/entry/data-recharts.ts`, 因不能新建 `src/data/` 目录放在已有的 `src/entry/`). 入口转发 `src/charts` 的 HxLineChart 等与 ChartFrame / 主题 / 动画, 不复制实现; 新增 `toRechartsRows` (序列 → 每个横轴位置一行, 以序列 id 为键, 日期按 UTC 档格式化) 与 `barRowsToRecharts` (单序列键 "value", 多序列按 series id 展开, 缺 series 抛 TypeError). recharts 从 dependencies 移到 peerDependencies (不标 optional: npm 7+ 自动装 peer, 主入口的过渡转发仍可用, 现有项目不断) 并进 devDependencies; 1.0 主入口去掉转发后再标 optional.

## Alternatives considered

- 依赖 d3-scale / d3-time: 最强理由是成熟, 边界情况全. 否决: 多两个依赖与 ESM 子包, 我们只需要其中一小块, 且要与 viz 现有 nice 算法一致.
- 继续让 Recharts 留在主包: 最强理由是图种现成. 否决: 体积与动效不可控, omni 1.0 定为降级成 `@hx/ui/data/recharts` 适配器.
- 时间刻度用本地时区: 最强理由是贴近用户. 否决: 测试与 SSR 结果随机器时区变化; 需要本地时区时由调用方传 format.

- 每个图种自带 ResizeObserver: 最强理由是组件独立. 否决: 尺寸, 内边距, 读屏结构会各写一份, 14 个图种难以一致.
- Trend / BarChart 整体换成 Line / Bar: 最强理由是只留一套组件. 否决: 冲击三拍与 roving tabindex 是它们独有的, 整体替换会改变已发布行为; 先共享几何, 行为不动.
- 热力图用多色色阶 (viridis 等): 最强理由是区分度高. 否决: 与主题色不协调, 且违背去 AI 味的配色约束; 单色阶加读屏摘要已够读.
- 散点半径按值线性映射: 最强理由是直观. 否决: 人按面积读大小, 线性半径会把大值夸大成平方.
- recharts 这一版就标 optional peer: 最强理由是主包立刻瘦身. 否决: 主入口仍静态 import 套壳图, 没装 recharts 的项目会在导入主包时报错; 等 1.0 移出转发再标.
- 适配器里重写一套 Recharts 组件: 最强理由是可以换新 API. 否决: 存量用法要原样能跑, 转发同一份实现, 测试锁住引用相同.

## Consequences

`package.json` exports 新增 `./data` (指向 dist/viz/data.js), 需要补 api 快照. 批 9 在此之上做 DataStage 与 Line / Bar, 并把 `viz` 的 Trend / BarChart 改为内部转发. 批 9 已完成: `@hx/ui/data` 导出 DataStage, Line, Bar 与几何纯函数; 需补 `./data` api 快照. 批 10 已完成 Scatter / Area / Heatmap; Recharts 适配器 (`@hx/ui/data/recharts`) 移到批 11. 批 11 已完成: exports 新增 `./data/recharts`, 需补其 api 快照, 并重建 lock 文件 (recharts 改为 peer).
