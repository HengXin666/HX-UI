# Agent Note: next/ (HX-UI 2) 是独立包, 旧门禁不扫它, 由 next.yml 把关

Status: implemented

Decision-ID: next-separate-package-gates

## Code

- `scripts/constants/gates.ts`
- `scripts/constants/quality.ts`
- `scripts/gates/lanes.ts`
- `scripts/gates/frontend/check-line-budget.ts`
- `scripts/gates/shared/check-lanes.ts`
- `.github/workflows/next.yml`

## Problem

2.0.0 发布后 main 上 quality / quality-code / quality-docs 全红, 原因都是旧门禁在扫 `next/`:
`line-budget` 把 next/src 的 6 个文件按 0.18 的 tsx<=250 判超标; `PROJECT-NO-ABS-PATH` 把 next 的 `@/` 别名当绝对路径;
`HC-DIR` 数 next/ 的目录宽度; quality-docs 的 HC-TEXT / HC-CONTEXT 读 next/README.md. 这些规则是按 0.18 的 src/ 与 docs/ 定的,
next/ 有自己的 package.json, lockfile, tsconfig 和自己的检查 (tsc -b, vite build, bp-check, check-client, verify-pack), 却没有任何 CI 跑它们.
另外标签推送 (v2.0.0) 触发了 quality-build / quality-code / quality-docs: 注解标签的 event.after 是标签对象, ci.ts 报 "Checkout does not match the event head".

## Decision

- `SEPARATE_PACKAGES = ["next/"]` (两份常量文件各一份): `scripts/quality` 的快照把它当 IGNORED_PREFIXES, line-budget 不量它, lane 表把它登记进 NO_GATE_ENTRIES 并写理由.
- 新增 `.github/workflows/next.yml`, 在 next/ 里跑 npm ci, tsc -b, npm run check (体积预算 + "use client" 边界), check:bp, vite build, pack:check (build:lib 内含 check-client --dist, 再 npm pack + verify-pack).
- quality-build / quality-code / quality-docs 只在分支推送上跑 (`branches: ["**"]`), 标签交给 release.yml.
- `check-lanes.ts` 的 stale-exemption 改用与认领判定相同的 `matches()`: 目录型免检 "next/" 原来对不上顶层条目 "next", 会被误报为失效.
- 根目录 README / CHANGELOG / release.yml 留在旧门禁里: 文案里的全角标点 (HC-TEXT) 改成 ASCII, 没有放松规则.

规则和阈值一条没改; 门禁严格度指纹因为常量, lane 表与 check-lanes 的改动而变化, 本次按流程显式 `--update`.

## Alternatives considered

- 给 next/ 的超标文件登记 line-budget 基线: 否决, 基线是 0.18 的存量棘轮, 把另一个包的文件塞进去等于两套代码共用一个错误的上限.
- 在 workflow 上用 paths-ignore 跳过 next/: 否决, 判据会分散到 YAML 里, 本地钩子与 CI 不再是同一份定义.
- 直接关掉 quality-code / quality-docs: 否决, 它们对 0.18 根目录仍然有效.

## Consequences

只改 next/ 的提交不会触发旧门禁的任何 finding; next.yml 对 next/ 的改动必跑. 以后在仓库里再加独立包, 把它加进两份 SEPARATE_PACKAGES 并给它一个自己的 workflow.
