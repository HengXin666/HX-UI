# Agent Note: 门禁分流表补齐顶层条目 (tests / vitest.config.ts / CHANGELOG.md)

Status: implemented

Decision-ID: lanes-top-level-coverage

## Code

- `scripts/gates/lanes.ts`

## Problem

`scripts/gates/shared/check-lanes.ts` 要求每个被 git 跟踪的顶层条目都落进某条 lane 或某条免检声明. `tests/`, `vitest.config.ts` 与 `CHANGELOG.md` 三个条目一直没人认领, 于是改它们时**一条门禁都不会跑**, 而运行时完全看不出异常 — 这属于"改了东西却静默放行", 比报错更危险.

## Decision

- `tests/` 与 `vitest.config.ts` 并入 `lib` lane. 理由: 测试资产影响的是库的行为契约, `lib` 组的 typecheck 与 ui-rules 已经覆盖它们, 再单开一条 lane 只会让同一批检查跑两遍.
- `CHANGELOG.md` 并入 `contract` lane (与 `README.md` 同组). 理由: 两者都是对外承诺文档, 改动都要同时接受库与文档两组检查.
- 不放 `NO_GATE_ENTRIES`. 那张表只收"改它不可能改变代码或文档行为"的纯元数据 (LICENSE, NOTICE 等); 测试与变更日志不属于这一类.

锚点只落在 `scripts/gates/lanes.ts` 的 `LANES` 声明上. `tests/` 不在 `.agents/notes.config.json` 的 guarded 范围内, 它归哪条 lane 由分流表决定而非 AST 锚点, 因此 `tests/setup.ts` 不进 Code, 也不加引用注释. `scripts/gates/shared/check-lanes.ts` 的校验逻辑本次未改, 它的目录仍由既有的 v2 接入决策承接, 本决策不在其中另设锚点.

分流表改动会让 `guard` 组的严格度指纹变化, 本次按流程显式 `--update`, 不是为过检查而放松阈值.

## Alternatives considered

- 什么都不做, 把三个条目加进 `NO_GATE_ENTRIES`: 最强理由是改动最小. 否决: 测试目录与变更日志改动确实会影响库的对外行为, 免检等于承认"改测试不用验", 与分流表存在的意义相反.
- 为 `tests/` 单开一条 `test` lane: 最强理由是职责更清楚. 否决: 现有 test 命令是 `npm run quality:done` 的一部分, 单开 lane 会让同一次提交把 typecheck 跑两遍, 收益不足以抵消时间成本.
- 只改 `lanes.ts` 不写 note: 否决, `check-fingerprint` 会拦住, 且下次有人看到指纹对不上时无法判断是否有意.

## Consequences

改 `tests/` 或 `vitest.config.ts` 会触发 `lib` + `shape` 两组, 改 `CHANGELOG.md` 会触发 `lib` + `docs`. `check-lanes` 的 20 个顶层条目全部有归属, 后续新增顶层文件时必须同时登记.
