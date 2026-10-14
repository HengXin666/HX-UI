# Agent Note: 质量门禁的单一入口

Status: implemented

Decision-ID: quality-single-entry

## Code

- `scripts/quality/index.ts`

## Problem

同一套判据要被人手 (npm scripts)、git 钩子 (.githooks) 与 CI (workflow 分组) 三处调用。三处各自拼命令行, 参数解析迟早分叉, 症状是"本地绿、CI 红"这种最难查的偏差; 门禁还要按改动路径分流该跑哪几组, 并在工具自身故障时保存完整诊断而不是当成"代码有问题", 这两件事都不能散在调用方。

## Decision

`scripts/quality/index.ts` 是唯一入口: 命令 (check / baseline / graph / tests / push / done / hooks / audit / build / layer) 与检查点都在这里解析, 钩子、npm scripts 与 CI 都调它。参数与常量来自 `scripts/constants/quality.ts`, 实际检查在 `checks/` 与 `runtime/`。退出码 0 表示没有新增问题, 1 表示存在新增问题, 2 表示工具或参数错误; 报告写到 `scripts/.hx_code_quality/reports/`。

## Alternatives considered

- 什么都不做 / 复用现有: 每个调用方各自拼命令行最省事, 但三处参数解析必然分叉, 分流与故障诊断逻辑也要重复三遍
- 直接调用 vendored skill 的入口: 复用现成实现, 但 `.agents/` 由上游维护, 本仓的门禁接线与规则会随上游漂移, 且 `.agents/` 不参与本仓的 AST 双链
- 每条检查各自成 CLI: 便于单独跑, 但钩子与 CI 要维护一份命令清单, 漏挂一条就等于那条门禁消失
- 把入口放进 `docs/package.json` 的脚本: 少一个文件, 但文档站与组件库的依赖面不同, 门禁会随文档站构建一起被拖慢

## Consequences

一处解析、一处诊断、一处退出码, 本地与 CI 的行为可以对齐, 分流与容错策略只需要维护一份; 代价是 index.ts 要同时容纳命令表与分流, 新增命令必须改这里, 而不是加在各自的检查文件里。
