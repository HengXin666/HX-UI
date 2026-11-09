# Agent Note: 取值与状态族控件 (controls/range) 用 craft 弹簧自写

Status: implemented

Decision-ID: controls-range

## Code

- `src/controls/range/motion.ts`
- `src/controls/range/input/keys.ts`
- `src/controls/range/meter/tank-sim.ts`
- `src/controls/range/status/grid-patterns.ts`
- `src/controls/range/meter/TallyRoll.tsx`, `src/controls/range/meter/tally-digits.ts` (react-bits Components/Counter)

## Problem

L2 controls 层缺一组取值, 刻度与状态类控件: 圆弧刻度盘, 可拖动数值框, 验证码格子, 竖条滑杆, 液位计, 点阵加载, 任务状态图标. 行为规格在 docs/research/catalog/micro.md 的 CometDial, ScrubField, CodeSlots, WakeSlider, SloshGauge, LatticeLoader, StatusMark 七个条目里. 上游是 MIT 加 Commons Clause, 不能移植再分发, HX-UI 以 Apache-2.0 发包, 所以只把条目里的常数, props 和行为描述当规格, 用本库引擎重写, 组件名换成本库自己的.

## Decision

七件放在 `src/controls/range/` 下, 按意图分三个子目录: input (ArcKnob, NudgeField, PinCells, SwellSlider), meter (TankGauge), status (GridPulse, TaskGlyph). 每个组件文件头写明规格参照的条目原名.

族内共用数学集中在 `src/controls/range/motion.ts`: 时长加 bounce 到 stiffness / damping / mass 的换算, 一阶指数跟随, 松手速度估计, 以及 omega 偏高的弹簧在 stepSpring 的 8ms 最小帧下会发散时用的细步积分. 命名弹簧通道在 channels.ts, 按需帧循环在 use-frame-loop.ts. 键盘取值规则 (方向键, PageUp/Down, Home/End 的步长) 写在 input/keys.ts, 四件 input 共用. 液位计的两个耦合振子用 meter/tank-sim.ts 的 240Hz 子步积分. 点阵加载的图案序列写在 status/grid-patterns.ts.

颜色 props 只收语义 token, 线条只画 1px, 时长取 tokens.css 的 --duration-* 令牌, 减弱动效时归零, 取值类信息照常更新. 引擎缺口在代码里用 ENGINE-GAP 标出, 等 L1 合并时统一收进 src/motion.

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是库里已有 Slider, Input 与 Spinner, 能满足基本取值和加载. 否决: 它们没有刻度盘拖拽与甩动, 拖动改数, 验证码分格与粘贴分发, 液面晃动这些带物理的交互, 往基础件里加会让基础件背上七种手感.
- 直接用 motion/react 的 spring 与 animate: 最强理由是规格原本就是 motion 的写法, 抄过来零换算. 否决: 物理只走 craft/spring, 不另起第二套引擎, 混用会让同一个数在两处手感不同.
- 常数放进 `src/constants/`: 最强理由是字面量规则豁免常量目录. 否决: 那个目录归已有决策所有, 本族常数放在本族 tokens.ts 更好找.

## Consequences

主线接入时从 `src/controls/range/index.ts` 导出, 本次不改 src/index.ts. motion.ts, channels.ts, use-frame-loop.ts 与 press, dismiss, compose 三族各自的换算和帧循环是重复实现, 下一步统一并进 src/motion 后删掉族内副本.

## TallyRoll (规格 Components/Counter)

每位一条 0 到 9 的条带, 高位先动, 停在整数格; 千分位与小数点是静止槽, 位的键按右侧位数定, 改值时同一位从当前小数位置继续滚, 不从 0 重播. 外层时钟线性, 曲线用 craft 的 digitEase, 时长 DIGIT_MS 700, 位间错峰 min(stagger, 时长 40% / (n-1)).
过冲合同 0.06 位不放宽. digitEase 的参数是阻尼振荡的名义过冲, 尾段补偿项会把实际峰值抬高 (参数 0.06 时实测峰值 0.086), 所以 tallyOvershoot 按实际峰值二分反解参数 (粗扫 400 点, 峰值附近三分细化), bounce 线性映射到目标峰值, 上限 0.06; 结果按目标值缓存. 读屏只读终值, 条带 aria-hidden; 减弱动效不建条带, 直接写终值.
