# Agent Note: PR 3 质量门禁在 CI 上可运行

Status: implemented

Decision-ID: pr3-quality-gates-ci-fixes

## Code

- `scripts/quality/checks/code.ts`
- `scripts/quality/runtime/run.ts`
- `scripts/gates/shared/check-fingerprint.mjs`
- `scripts/check-blueprint.mjs`
- `scripts/e2e/run.mjs`
- `docs/src/blueprint-demo-fallback/dsh.ts`

## Problem

PR 3 的四个 workflow 全红. 原因不在单条违规: (1) 基线只从可信 base 读, 而 main 上还没有 baseline.json, 引入基线的 PR 自身永远拿不到基线, 全部存量违规都按新增 Error 计; (2) src/index.ts 导出从未入库的 ./layout/ChatStream, 类型检查与文档站构建都失败; (3) 兄弟目录 HX-Blueprint-Demo 不在公开父仓里, quality job 在拉取步骤就失败; (4) 接线指纹读本机 .git/hooks, 干净 checkout 必然漂移; (5) bp-e2e 要求事先起好 dev server

## Decision

- 改动自带的基线条目只有在 base tree 上用同一 checker 复现出同一 finding 时才生效, 新引入的违规仍不能自批. PR 的可信基线读 pull.base.sha, diff 仍从 merge-base 算
- 新分支首推取与默认分支的 merge-base, 拿不到才用空树
- 删除悬空的 ChatStream 导出. 兄弟目录缺席时文档站与 check-blueprint 退到仓内替身; --strict 下必须由 HX_BLUEPRINT_DEMO_OPTIONAL=1 显式放行, 并逐组打印 SKIP
- 钩子指纹改为仓库内受版本控制的钩子源文件
- HC-COMMENT-SPACE 的块注释续行与规则表一致: * 后恰好一个空格. HC-DEPS 补上仅 lockfile 的传递依赖变化 (review-only)
- 推送检查的 affected tests 在待推送提交的独立工作树里建图, 构建与执行

## Alternatives considered

- 直接信任 PR 里的 baseline.json: 最省事, 但等于允许自批新违规
- 先单独合入基线再合本 PR: 符合原设计, 但需要维护者额外操作, 且下一个首次接入的仓库会再踩一次
- 把 HX-Blueprint-Demo 复制进本仓: 能保留全部断言, 但拿不到源码, 且会出现两份权威
- 什么都不做 / 复用现有 workflow: 不需要维护者额外操作, 但四个 workflow 继续全红, 等于引入基线的 PR 永远拿不到基线, 下一个首次接入的仓库还会再踩一次

## Consequences

四个 workflow 在干净 checkout 上可运行, 引入基线的 PR 不再自己判自己, 接线指纹只覆盖受版本控制的钩子源文件. 代价是首次推送必须能算出 merge-base, 兄弟目录缺席时文档站与 check-blueprint 退到仓内替身, 那几组断言只能打印 SKIP, 强度低于真实实体图; --strict 下还要靠 HX_BLUEPRINT_DEMO_OPTIONAL=1 显式放行. 本次落地 Agent Notes v2 时把接线指纹快照刷到当前接线 (check-fingerprint.mjs --update), 干净 checkout 上该门禁恢复为绿; 严格度组的哈希未变, 只有 wiring:checkpoints 一条跟着接线走.
