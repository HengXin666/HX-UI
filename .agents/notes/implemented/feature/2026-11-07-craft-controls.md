# Agent Note: 控件手感单独成一套, 数字写在运动合同里

Status: implemented

Decision-ID: craft-controls

## Code

- `src/craft/spring.ts`
- `scripts/tests/craft/spring.test.ts`

## Problem

按钮, 开关, 标签条, 数字和分段拇指如果继续各写一条 CSS transition, 按下到一半松开就会从 0 重播, 连点会排队, 指示条的宽会跟着过冲鼓出文字. 这些时间写在 `docs/research/plan.md` 里, 旧的 `src/primitives` 默认外观被另一篇决策锁住, 而且那个目录同时被多篇决策认领.

## Decision

新增 `src/craft`, 从 `@hx/ui/craft` 进入. 积分是半隐式欧拉, 弹簧分 press / thumb / follow / digit / width. 按下与松开是两段目标, 速度保留. 减弱动效不积分, 直接写终值.

`src/craft/` 同时被 PROJECT-CONST-DUP 当成常量池. 刚度, 毫秒和画出这一下的类名留在这里, 读得见. 不把 520 或 0.97 拆成从 1 累加的别名.

首页和 `#/craft` 道具台只用这套控件. 旧 Button 仍留给已经接上的文档页, 不在这次改它的默认类名.

## Alternatives considered

- 什么都不做 / 复用现有 Button 的 press 变体: 最强理由是按压缩放已经有一个可选类, 少一个目录. 否决: 那个类是一条 CSS transition, 松手会重播, 没有 1.012 的收回, 也没有速度.
- 直接改 `src/primitives/button.tsx` 的默认按下: 最强理由是使用方不用学第二个按钮. 否决: 该文件的目录同时属于多篇已实现决策, 改默认外观还推翻了 "默认逐字节不变" 那一条. 同一次 diff 得改写那些 note 并碰到它们名下的每个目录.
- 把弹簧数字放进 `src/constants/motion.ts`: 最强理由是常量池本来就在那里. 否决: 那个文件属于动效引擎决策, 改它就要同步改 `src/index.ts` 和文档页. 运动合同跟令牌回退不是同一件事.

## Consequences

使用方从 `@hx/ui/craft` 引入这五件和发牌, 跟随, 引语, 坐标轴重标. 根入口的符号表不变. 旧按钮的默认外观不变, 所以已有页面的截图不跟着变. 道具台改数值不会重挂载, 中断才看得见.
