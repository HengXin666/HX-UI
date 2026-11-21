# omni 1.0: 从控件库到页面导演库

本篇是 omni 1.0 重构的结论性规范: 分层目标, 运动与页面的合同, 去 AI 味的规则. 过程与取舍写在 `.agents/notes/`, 现状的分层与入口见 [layers.md](layers.md).

## 1. 目标

HX-UI 1.0 是一个页面导演库: 使用方描述 "这页讲什么, 主角是谁, 节奏如何, 数据从哪来", 库负责版式, 镜头, 数据可视化与交互的手感. 验收用五张标杆页: 电商详情页, 电商列表页, 软件产品页, 开发者工具页, 数据故事页, 每张只用公开 API 拼, 页面代码不超过 300 行 (不含文案与数据).

## 2. 目标分层

| 层 | 入口 | 内容 |
|---|---|---|
| L0 | `@hx/ui/tokens.css`, `@hx/ui/skins.css` | 令牌与皮肤, 新增 direction 令牌组 |
| L1 | `@hx/ui/core`, `@hx/ui/controls` | 原语, 布局, 带手感的控件 |
| L2 | `@hx/ui/motion`, `@hx/ui/fx` | 统一时钟, 弹簧, 曲线, 镜头配方, 编排; 背景与效果件 |
| L3 | `@hx/ui/data`, `@hx/ui/app` | 图表内核与流程可视化; 对话, 编辑器, 节点图等重件 |
| L4 | `@hx/ui/sections` | 区块: 内容模型 + 版式 + 镜头三段式 |
| L5 | `@hx/ui/page` | 页面导演: beat, direction, layout, data, meta, 校验器 |
| L6 | `@hx/ui/templates` | 标杆页模板与 Page Studio |

依赖只向下. 每个入口名字逐个写出, 不用 `export *`. 旧入口保留一个小版本的转发并标 `@deprecated`.

## 3. 运动合同

- 组件的动画只读一个 0..1 的进度. 进度来自 `useClock(ref, { driver })` (`src/motion/drive/use-clock.ts`), 驱动只有四种: `view` (进视口播一次), `scroll` (元素顶边从视口底边进入记 0, 底边离开顶边记 1), `loop` (离屏与标签页隐藏时停帧), `controlled` (外部给值).
- 进度到镜头的翻译走镜头配方 (`src/motion/recipe.ts`, 第一批配方在 `src/motion/recipe-cards.ts`): 配方是按 30fps 帧记录的段, 每段一条 craft `EASE` 名字或 linear, 末段必须是静止. 组件用 `recipeAt(recipe, progress)` 取段名, 段内进度与缓动值, 不写裸时长与裸贝塞尔.
- 配方必须过 `validateRecipe`: 帧数为正整数, 末段静止不少于 18 帧, 声明的位移幅度不低于 8px, 缩放幅度不低于 0.02. 新配方的帧数取自镜头卡原值, 卡上没给的拆分在 summary 里注明本库定.
- 减弱动效时时钟恒为 1, 组件读到末段终态, 不播脉冲, 读屏读到终值.
- 群体入场用 `dealOffsets` 的加速间隔 (`Stagger rhythm="deal"` 内部用 `dealDelayChildren`) (首张到末张线性收紧), 不用恒定间隔.

## 4. 页面合同 (P2 落地)

- 页面描述由 beat 组成, 一个 beat 有且只有一个 lead, 一个 shot (配方名), 一个 layout, 一个 pace (`slow`, `even`, `fast`, `cut`); 相邻 beat 的 pace 不得三连相同.
- direction 先做六套: editorial, industrial, retail-luxe, retail-pop, devtool, fintech. 每套规定字体阶, 栅格, 图片处理, 允许的配方与效果预算.
- `definePage` 有两种写法: 只写 `sections` 时竖排区块, 行为与 0.17 一致; 写 `story` (每拍 = beat 加这一拍的 `sections`) 时 `Page` 按拍渲染, 根节点写 `data-direction`. 只写 sections 但给了 `direction` 时由 `sectionsToBeats` (`src/page/story.ts`) 自动一区块一拍, 这是旧 spec 升级的第一步, 真正的叙事仍要手写 story.
- `PageSpec.meta` 输出 title, description, canonical, Open Graph 与 JSON-LD; 结构化数据用 `productLd`, `softwareLd`, `faqLd`, `breadcrumbLd` (`src/page/meta.ts`) 生成, 不手写 schema.org 字段.
- 校验器 `validateBeats` (`src/page/beat.ts`) 检查空页, 缺主角, id 重复, 同节奏三连, 居中三连, 方向不收的镜头, 图片 alt 与重效果预算; 区块必填内容仍由 `definePage` 的类型检查.

### 数据合同 (P3)

- 数据图从 `@hx/ui/data` 取比例尺与坐标轴: 连续型 linear / log / sqrt / time 共用 `ContinuousScale` 接口, 离散型 band / point 用 `BandScale`; 坐标轴只算 `{ value, px, label }`, 图种自己画.
- 数字与时间一律经 `formatNumber` / `formatTime` (Intl); 时间刻度与标签按 UTC 对齐, 需要本地时区时由调用方传 format.
- 图种放进 `DataStage`: 舞台负责尺寸, 内边距, svg / canvas 选择与读屏摘要, 图种只在绘图区里画. 已有图种 Line, Bar, Scatter, Area (堆叠), Heatmap; viz 的 Trend / BarChart 共享 Line / Bar 的几何. 热力图只用单色阶.
- Recharts 降为适配器 `@hx/ui/data/recharts` (`src/entry/data-recharts.ts`), recharts 改为 peer 依赖: 多轴, 饼图, 雷达等内核未覆盖的图从这里取, `toRechartsRows` / `barRowsToRecharts` 把内核的序列与柱行转成 Recharts 记录, 两套图共用一份数据. 主入口的 `HxLineChart` 等是过渡转发, 1.0 移出主包.

## 5. 去 AI 味

默认态与模板里不得出现: 紫蓝渐变光斑作默认背景, 渐变色正文, 整页统一 fade-up, 入场间隔恒定, 全部居中的首屏与特性区, emoji 当图标, 同屏两个以上 WebGL 背景, 整数凑出来的假数字. P2 起由品味门禁 (TASTE-*) 以 warning 检查, P7 转 error.

## 6. 阶段

P0 盘点, P1 运动内核统一, P2 内容模型与页面导演, P3 数据内核, P4 流程可视化, P5 区块补齐, P6 效果层整理, P7 模板与 Page Studio, P8 发布 1.0. 每阶段的退出条件, 进度与交接见 `.agents/CHECKPOINT.md`.
