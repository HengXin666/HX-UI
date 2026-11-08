# Agent Note: choice 族 (开关, 选择, 评分) 作为 L2 controls 一等组件按规格重写

Status: implemented

Decision-ID: controls-choice

## Code

- `src/controls/choice/physics.ts`
- `src/controls/choice/toggle/PlushSwitch.tsx`
- `src/controls/choice/pick/GelRadio.tsx`
- `src/controls/choice/rate/LiftRating.tsx`

## Problem

库里的开关, 单选, 复选, 分段, 下拉和评分 (`src/primitives/switch.tsx`, `radio-group.tsx`, `checkbox.tsx`, `toggle-group.tsx`, `select.tsx`, `src/widgets/Rating.tsx`) 只有状态和样式, 手感停在 CSS 过渡或一根 thumb 弹簧. `docs/research/catalog/micro.md` 收了七件 choice 意图的控件教材 (BellToggle, SquishSwitch, JellyRadio, SpringCheck, RubberSegment, GlideSelect, PeekRating), 常数和行为可以直接当规格, 但源码是 MIT + Commons Clause, 不能移植进 Apache-2.0 的包.

## Decision

在 `src/controls/choice/` 用 HX 自己的引擎按规格重写七件, 组件名全部自起, 文件头只写一行出处说明:

- `toggle/`: `ChimeToggle` (BellToggle), `PlushSwitch` (SquishSwitch), `TallyCheck` (SpringCheck).
- `pick/`: `GelRadio` (JellyRadio), `ElasticSegment` (RubberSegment), `DriftSelect` (GlideSelect).
- `rate/`: `LiftRating` (PeekRating).

规格常数逐项写成具名常量并导出, 测试直接断言. 颜色 props 只收 `tone.ts` 的语义 token 名, 不收色值. 规格里 "时长 + bounce" 的弹簧由 `physics.ts` 的 `springFromDuration` 换成 stiffness / damping / mass: 阻尼比取 1 - bounce 保留过冲, 刚度按包络 (1 + wd) e^(-zeta wd) 衰减到千分之一的时刻等于规格时长求出. `stiffness + mass + bounce` 写法 (JellyRadio) 走 `springFromBounce`. 所有弹簧经 `SpringDriver` 推进, 换目标保留位置与速度, 中途反向不跳变; 减弱动效时一律直接落终值, CSS 过渡归零或缩到规格给的 1ms.

两处引擎缺口先在 `physics.ts` 局部实现并标 `ENGINE-GAP`: 缺 "时长 + bounce" 到物理参数的换算; 缺共享 rAF 弹簧驱动, 且 craft `stepSpring` 的半隐式欧拉加 8ms 步长下限在 16ms 帧长下会把 bounce 0.2 的过冲吃光, 所以驱动改用阻尼振子解析解 `stepExact`, dt 上限与落定阈值仍取 `src/craft/tokens.ts`.

本次只新增, 不改现有件, 不进根桶与子路径入口 (主线统一接).

## Alternatives considered

- 什么都不做 / 复用现有 primitives 与 Rating: 最强理由是它们已经有 radix 的 aria, 键盘漫游和测试, 视觉也对齐 open-vetta. 否决: 现有件的运动只有 CSS 过渡和一根 thumb 弹簧, 加不进规格要求的拉伸, 错峰多层, 头尾分离, 衰减摆动和弹出滑行; 直接改它们又越过本任务 "只新增" 的边界, 会改变已发布组件的默认行为.
- 把七件做成现有件的变体 prop (例如 `Switch variant="plush"`): 最强理由是同一能力族只留一个入口, 使用方好找. 否决: 变体会把 radix 的结构和规格的 DOM 结构 (多层指示块, 宽度跟弹簧的标签, 解析弹簧驱动) 绑在一个文件里, 超过 HC-SIZE, 也让 primitives 依赖 controls 的驱动形成反向分层; 合并方式留给主线在报告里裁决.
- 直接用 motion 的 `animate` / `useSpring`: 最强理由是 switch.tsx 已经依赖 motion, 规格原本也是 motion 写法. 否决: brief 规定物理只用库内引擎, 且 motion 的时间轴动画中途不保留速度, 与可中断要求冲突.
- 驱动沿用 craft `stepSpring`: 最强理由是不新增积分器. 否决: 16ms 帧长下过冲被数值阻尼吃掉, 测试里有佐证, 规格回弹无法保留.

## Consequences

`src/controls/choice` 对外导出七件和换算函数, 但还没有入口, 文档站暂不展示. `physics.ts` 的 `springFromDuration`, `stepExact` 与 `SpringDriver` 等 L1 并入后应删掉本地实现改为引用. 规格里只给名字未给数值的项 (GlideSelect 与 RubberSegment 的尺寸档, JellyRadio 的默认 bounce 与压扁目标, PlushSwitch 的拇指留白) 用具名常量补了自定值, 文件注释写明出处为自定. 动效只在 happy-dom 里测到状态与关键帧, 真实帧率下的观感需要浏览器录屏核对.
