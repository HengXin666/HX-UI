# Agent Note: ./controls 与 ./kits 子路径入口, 0.10.0

Status: implemented

Decision-ID: controls-kits-entries

## Code

- `src/controls/index.ts`, `src/kits/index.ts`
- `package.json` (exports `./controls`, `./kits`; version 0.10.0), `package-lock.json`
- `src/motion/index.ts` (转出 `CURVE`, `cssCurve`, `CurveName`)
- `scripts/docs-props.ts` (SUBPATH_FULL 加 `./controls`, `./kits`), `docs/face/docs/props/props.gen.json`
- `scripts/gates/baselines/api-surface.txt`, `scripts/gates/baselines/api-surface.version`
- `CHANGELOG.md`

## Problem

react-bits Components 余量里的 controls 15 件与 kits 33 件按族落在 src/controls/<族> 与 src/kits/<族>, 施工期间只维护各族 index.ts, 没有总出口也没有发布路径, 公共 API 快照与 props 文档都不覆盖它们 (见 2026-11-08-layered-entries 的分层入口约定).

## Decision

照 surface 层的做法, 两层各自只从子路径发布, 根入口 src/index.ts 不收: src/controls/index.ts 与 src/kits/index.ts 用 `export *` 汇各族 index (根入口禁 export *, 子路径入口不受限; tsc 已确认族间无重名). package.json exports 加两项, 产物路径 dist/controls/index.js 与 dist/kits/index.js 由现有 tsc 构建按目录生成, 无需改 build-lib. check-api-snapshot 按 exports 自动分段, 新增两段; docs-props 把两条子路径列进全量抽取. 曲线表 CURVE 进 motion 公共出口. 公共符号增加, 按 check-api-version 的规则升 minor 到 0.10.0 并重记哈希.

各族 tokens 合并进 src/motion, 测试支持合并, 老控件 ring-1 换 FOCUS_RING 等收尾项不在本次, 留在 .agents/CHECKPOINT.md 的收口待办.
