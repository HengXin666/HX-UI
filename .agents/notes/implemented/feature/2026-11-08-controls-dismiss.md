# Agent Note: 丢弃与躲闪族控件 (controls/dismiss) 用 craft 弹簧自写

Status: implemented

Decision-ID: controls-dismiss

## Code

- `src/controls/dismiss/feel.ts`
- `src/controls/dismiss/discard/ShredBin.tsx`
- `src/controls/dismiss/evade/EvadeZone.tsx`
- `src/controls/dismiss/swipe/DrawerRow.tsx`

## Problem

L2 controls 层缺一组丢弃, 滑开与躲闪类控件: 碎纸机, 揉纸, 撕票根, 躲闪按钮, 文件夹浮出, 侧滑抽屉行, 甩开通知. 行为规格在 docs/research/catalog/micro.md 的 Shredder, PaperCrumple, TearTicket, DodgeField, FolderFloat, SwipeRow, SwipeToast 七个条目里. 上游是 MIT 加 Commons Clause, 不能移植再分发, 所以只把条目里的常数, props 和行为描述当规格, 用本库引擎重写, 组件名换成本库自己的.

## Decision

七件放在 `src/controls/dismiss/` 下, 按意图分三个子目录: discard (ShredBin, CrushSheet, RipStub), evade (EvadeZone, StashFolder), swipe (DrawerRow, FlickNotice). 每个组件文件头写明规格参照的条目原名.

手感数学集中在 `src/controls/dismiss/feel.ts`: 时长加 bounce 与趋近时间常数两种写法到 stiffness / damping / mass 的换算, 单轴弹簧推进 (交给 craft 的 stepSpring), 指数趋近, 甩出投影, 橡皮筋阻尼与最近 100ms 的速度估计. 各子族的纯函数放在 discard-math.ts, evade-math.ts, swipe-math.ts, 便于单测. 按需帧循环在 use-frame.ts. 每个数字只在 tokens.ts 写一次, 注释写原规格名便于对照.

颜色只用语义 token, 线条 1px. 减弱动效时去掉飞散, 揉皱, 躲闪与漂移, 只保留状态变化; 躲闪场在键盘聚焦或减弱动效时目标不动, 回车总能点中. 引擎缺口用 ENGINE-GAP 标出.

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是库里已有 Toast, ContextMenu 与列表行, 能满足关闭和删除. 否决: 它们没有拖动阈值, 甩出速度判定, 撕裂与碎纸这些丢弃手感, 加进基础件会改变既有视觉与行为.
- 直接用 motion/react: 最强理由是规格原本就是 motion 写法. 否决: 物理只走 craft/spring, 不另起第二套引擎.
- 常数放进 `src/constants/`: 最强理由是字面量规则豁免常量目录. 否决: 本族常数按组件分块放在本族 tokens.ts 更好找, 不牵动已有决策.

## Consequences

主线接入时从 `src/controls/dismiss/index.ts` 导出, 本次不改 src/index.ts. feel.ts 与 use-frame.ts 和其它三族的换算, 帧循环重复, 下一步统一并进 src/motion 后删掉族内副本.
