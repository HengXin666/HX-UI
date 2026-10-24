# Agent Note: 库与文档站共用的常量库

Status: implemented

Decision-ID: src-constants

## Code

- `src/constants/index.ts`
- `src/public-constants.ts`

## Problem

PROJECT-CONST-DUP 要求同一字面量在 src 与 docs/src 里出现三次以上就抽成常量。库与文档站是两个构建目标, 各自定义一份就会漂移: 文档站表格的列名必须与 ChatStream 的 role 同值, 组件用的 class 串也必须同值。另一条硬约束是 `typeof` 收窄: TS 只在比较对象是字面量时收窄, 把 `"string"` 抽成普通常量会让 `fmtTime` 的 `string | number` 收窄失效 (实测 TS2322)。

## Decision

`src/constants/index.ts` 是库与文档站唯一的字面量来源: 值用 `export const` 导出 (`USER`, `ERROR`, `PAD_WIDTH`, `PAD_CHAR`, `STICK_TOLERANCE`, `CLASSES`, 状态文字色 `TONE`, 组件变体名 `VARIANT`, `ARIA`, `KEY`, 按钮 type `BUTTON_TYPE`, `HALF_DIVISOR`, 水波纹 `RIPPLE`, 分页形状 `PAGINATION`), 需要收窄的判据用 type guard 导出 (`isString`)。对标 shadcn/ui 的组件与文档站新增的取值 (方向 `ORIENTATION`, 方位 `SIDE`, 对齐 `ALIGN`, 角色 `ROLE`, 标签名 `TAG`, 状态名, 尺寸与时长 `UI_NUMBERS`, 常用类名 `UI_CLASSES` 等) 按主题放在 `src/constants/ui.ts`, 文档站专用的取值放在 `src/constants/docs.ts` (示例取值 DOC / DOC_SAMPLE / DOC_TAB, 页导航等文档站自有排版的类串 DOC.caption / DOC.strongLine, 以及进度条示例宽度 DOC.barWidth / DOC.barWidthWide 与演示数值 DOC_SAMPLE.progressFail / scrollRows / skeletonLines), 都由 `src/constants/index.ts` 汇总。文档站只经 `@hx/ui` 入口引用, 所以 `src/index.ts` 转发 `USER`, `TONE` 与文档站示例用到的那几组取值。常量池无副作用, 不 import 任何模块。

## Alternatives considered

- 每个使用处各留一份字面量: 最省事, 但 PROJECT-CONST-DUP 报 Error, 且库与文档站两份值迟早漂移
- 什么都不做 / 复用现有: 收窄能在使用处内联 `"string"` 通过, 但同一字面量在 src 与 docs/src 反复出现, 门禁持续报 Error, 文档站也只能各写一份
- 把 `"string"` 抽成普通常量 `TYPE_STRING` 再比较: 满足 PROJECT-CONST-DUP, 但 TS 不认变量做 `typeof` 收窄, 直接报 TS2322, 所以判据必须是 type guard
- 常量直接写在 `src/index.ts`: 少一个文件, 但 index 是入口清单, 混入常量后文档站与库都绕不开入口, 且新增常量要动入口文件

## Consequences

字面量与判据只有一处来源, 库与文档站不会各写一份; 代价是多一层 `src/constants` 目录和一次 import, 且判据必须保持 type guard 形式 (写成普通常量会静默失去收窄)。
