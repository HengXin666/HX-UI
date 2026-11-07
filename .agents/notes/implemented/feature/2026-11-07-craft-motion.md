# Agent Note: 控件按下, 拇指和数字位使用可中断弹簧

Status: implemented

Decision-ID: craft-motion

## Code

- `src/craft/spring.ts`

## Problem

按钮的按下以前是 CSS active 的 1px 下沉或可选的 scale-97, 松开从 0 重播, 不保留速度. 数字是一个总数在跳, 没有位, 也没有停格. 分段拇指没有按下再滑的因果. 这些差距在 90ms 里就能看出来.

## Decision

弹簧积分放在 `src/craft/spring.ts`. `stepSpring` 用 stiffness, damping, mass 自己积分, dt 钳在 8ms 到 34ms. 目标变了不把速度清零. `digitEase` 把过冲钳在 0.06 并在 t=1 时落到 1. 按钮, 开关, 标签条, 数字槽和分段拇指都引用 `src/craft/tokens.ts` 里的同一组名字, 不在组件里写裸的 cubic-bezier. 减弱动效时直接写终值.

重复字面量按文件计数. `src/studio/num.ts` 用 1 相加伪造整数的做法删掉, 明写在 `src/studio/figures.ts`.

## Alternatives considered

- 什么都不做 / 复用现有 CSS transition 和 motion 的 layout 弹簧: 最强理由是按钮已经有 active 位移, 标签条已经有 layoutId. 否决: CSS transition 不能在按下 40ms 时带着当前速度松开, layout 弹簧的默认刚度会让指示器鼓出文字.
- 把常数放进 `src/constants/`: 最强理由是字面量规则本来就把常量目录豁免掉. 否决: 那个目录同时属于十几篇已实现决策, 加一个文件就要在同一次 diff 里改写每一篇并碰到它们名下的每个目录.

## Consequences

`Button` 默认走这套按下弹簧, `press={false}` 回到只有颜色变化的旧路径. 下游如果对默认按钮做像素对比, 按下时会看到 0.97 的缩放和随后收到 1 的过冲. 焦点环仍是 1px, 因为线宽规则不允许 2px 的环.
