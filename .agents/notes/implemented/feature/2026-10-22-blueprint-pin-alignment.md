# Agent Note: 蓝图的连线端点对齐引脚圆心

Status: implemented

Decision-ID: blueprint-pin-alignment

## Code

- `src/blueprint/node-parts.tsx`

## Problem

蓝图里每根线的端点都偏离引脚圆点 (数据口约 7.5px, 执行口约 11px), 线是擦着圆点过去的。原因是两套坐标各算各的: geometry.portPos 把端点放在节点边界上, 而卡片用流式布局画引脚 —— 位置取决于内边距, 前后兄弟与负外边距, 任何一处调整都会让圆心离开边界。

## Decision

- 引脚改成绝对定位, 圆心必须落在卡片外边界上 (即 portPos 假设的位置)。偏移量由引脚尺寸与边框宽推出, 不再依赖布局: pinOffset(size) 给出水平偏移, headerPinTop(size) 给出标题条中线上的 top。
- 卡片体的上内边距取 BODY_TOP - HEADER_H - CARD_BORDER, 让第一行端口的圆心与 portPos 的公式逐像素一致。
- React Flow 版本 (rf-node) 的 Handle 落点按同一套常量推导, 但要注意 React Flow 计算连线端点时取的是 Handle 面向节点的那条边而不是中心, 所以 Handle 的边压在外边界上, 再补一个边框宽。
- 视觉引脚与 Handle 分离: Handle 只是一块透明的命中区域, 视觉引脚由 NodePin 画, 两者圆心重合。
- 卡片根节点 overflow-visible, 不再裁剪; 圆角由标题条 (data-slot="bp-title", 展开时 rounded-t-[inherit], 折叠时 rounded-[inherit]) 与底条 (rounded-b-[inherit]) 各自收边。视觉引脚 (NodePin) 是根节点的直接子元素, 不会被裁掉一半 (PR #28 review P2)。端口行的 top 由 rowPinTop(row, size) 推出, 与 portPos 的 BODY_TOP + idx * PORT_ROW + PORT_ROW / 2 同源; 水平偏移仍是 pinOffset, Handle 的 HANDLE_EDGE / HEADER_HANDLE_EDGE 不动。PortRow 的 showPin=false 让行内不再画引脚。

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是连线"基本能看出连到哪"。否决: 这是用户直接指出的错误, 差 7 到 11px 在正常缩放下一眼可见。
- 改 geometry.portPos 去适配流式布局的实际位置: 代码更少。否决: 那会让端点缩进到卡片内部, 线压在标签文字上; 而且 portPos 同时服务命中测试与手写画布, 改它等于把渲染误差变成几何真相。
- 内容另包一层 overflow-hidden rounded-[inherit] 裁剪层: 圆角一处搞定。否决: 标题条不再是根节点第一个子元素, e2e 点"节点第一个子 div"会落到卡片中心被相邻节点拦截, 按 first-child 取标题条的分色断言也会取到统一底色的裁剪层。
- 根节点继续 overflow-hidden, 只靠负偏移把引脚摆到边界上: 改动最少。否决: 圆心在边界上意味着半个引脚在卡片外, 必然被裁掉一半, 用户看到的是半个圆点 / 半个楔形。
- 给卡片与端口行写死 padding 并依赖它: 不改结构。否决: 说的是同一件事但没有人守着, 下次调整间距又会偏; 现在偏移由常量推出, 门禁能断言。

## Consequences

两个画布 (手写画布与 React Flow 画布) 的端点都与引脚圆心重合, 用 Playwright 实测偏差为 0px, 且 elementFromPoint(引脚圆心) 命中视觉引脚 (未被裁剪)。代价是引脚脱离文档流后, 标题与端口标签要显式让出半个引脚的位置; 改卡片内边距时必须同步 BODY_PAD_X 常量。
