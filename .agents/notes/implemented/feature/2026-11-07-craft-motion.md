# Agent Note: 控件按下, 拇指和数字位使用可中断弹簧

Status: implemented

Decision-ID: craft-motion

## Code

- `src/craft/spring.ts`

## Problem

按钮的按下以前是 CSS active 的 1px 下沉或可选的 scale-97, 松开从 0 重播, 不保留速度. 数字是一个总数在跳, 没有位, 也没有停格. 分段拇指没有按下再滑的因果. 这些差距在 90ms 里就能看出来.

## Decision

弹簧积分放在 `src/craft/spring.ts`. `stepSpring` 用 stiffness, damping, mass 自己积分, dt 钳在 8ms 到 34ms. 目标变了不把速度清零. `digitEase` 把过冲钳在 0.06 并在 t=1 时落到 1. 按钮, 开关, 标签条, 数字槽和分段拇指都引用 `src/craft/tokens.ts` 里的同一组名字, 不在组件里写裸的 cubic-bezier. 减弱动效时直接写终值.

曲线同样只用名字: `src/craft/tokens.ts` 的 `EASE` 收 out / in / overshoot / punch / settle 五条 (docs/research/craft.md); 其中 out 与 in 不另起取值, 直接引用库动效合同 `MOTION_EASE_FALLBACK` 的同名值, 与 CSS 的 --ease-out / --ease-in 一致, 外加三条镜头卡原值: crane (crane-rise-reveal 拉升), dive (deck-deal-flyin 单卡飞行), stamp (paper-title-card 压印). `src/craft/ease.ts` 用牛顿迭代加二分解 cubic-bezier, 首尾严格落在 0 和 1. 数字槽的位数跟终值走, 多出来的高位直接卸下, 每位与千分位同一行高, 不再出现前导 0 或裁切.

分段拇指 (`src/craft/SegmentedThumb.tsx`) 的拇指只跟 value 走: 不论 value 来自点击还是外部 (首页镜 4 用滚动进度驱动), 都用 thumb 弹簧滑到新档, 滑动钳在 `THUMB_MIN_MS` 160 到 `THUMB_MAX_MS` 420; 挂载时先量一次, 不再出现首帧没有拇指. 键盘可选: 选中项是唯一的 Tab 停靠点 (其余 tabIndex 为 `STEP_BACK`), 方向键与 Home / End 移到相邻档并选中, 跳过禁用项, 两端回绕, Enter / Space 选中当前档; 减弱动效判断用库的 `prefersReducedMotion`. 按下走 `PRESS_MS` 90 缩到 `SEGMENT_PRESS_SCALE` 0.94 (内层单独缩放, 不干扰弹簧位移); 点击点一圈 1px 线 `RING_MS` 200 内半径 `RING_FROM_PX` 4 到 `RING_TO_PX` 18, 透明度 `RING_ALPHA` 0.35 到 0, 只改直径不缩放, 线宽始终 1px. 数字槽 (`src/craft/NumberRoll.tsx`) 多一个可选 `progress`: 给了就不走自己的时钟, 每位从 0 滚到终值的 progress 处, 同一进度同一帧, 供滚动驱动的镜头倒放; 不给时行为不变.

重复字面量按文件计数. `src/studio/num.ts` 用 1 相加伪造整数的做法删掉, 明写在 `src/studio/figures.ts`.

## Alternatives considered

- 什么都不做 / 复用现有 CSS transition 和 motion 的 layout 弹簧: 最强理由是按钮已经有 active 位移, 标签条已经有 layoutId. 否决: CSS transition 不能在按下 40ms 时带着当前速度松开, layout 弹簧的默认刚度会让指示器鼓出文字.
- 把常数放进 `src/constants/`: 最强理由是字面量规则本来就把常量目录豁免掉. 否决: 那个目录同时属于十几篇已实现决策, 加一个文件就要在同一次 diff 里改写每一篇并碰到它们名下的每个目录.

## Consequences

`Button` 默认走这套按下弹簧, `press={false}` 回到只有颜色变化的旧路径. 下游如果对默认按钮做像素对比, 按下时会看到 0.97 的缩放和随后收到 1 的过冲. 焦点环仍是 1px, 因为线宽规则不允许 2px 的环.
