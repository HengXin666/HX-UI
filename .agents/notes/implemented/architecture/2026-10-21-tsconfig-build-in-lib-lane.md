# Agent Note: 把 tsconfig.build.json 归到 lib lane

## Problem

新增 `tsconfig.build.json` (库构建用) 后, `check-lanes` 报 `unclaimed-top-level`: 顶层文件没人认领,
等于改它不会触发任何门禁。同时这条改动让 `registry:lanes` 的 strictness 指纹变化,
`check-fingerprint` 要求显式确认这是有意的。

## Decision

把 `tsconfig.build.json` 加进 `scripts/gates/lanes.mjs` 里 `lib` lane 的 prefixes,
与 `tsconfig.json` 同组 (两者都只影响组件库编译, 用的都是 lib 组门禁), 然后
`node scripts/gates/shared/check-fingerprint.mjs --update` 记录新指纹。

这不是放松门禁: 新条目**增加了**被检查的路径, 没有任何检查被摘掉或阈值被放宽。

## Alternatives considered

- **什么都不做**: `check-lanes` 一直红, 且这个文件事实上游离在门禁之外, 后续改它会静默通过, 所以否决。
- **把 tsconfig.build.json 加进 NO_GATE_ENTRIES**: 等于承认它不需要门禁。但它参与库构建,
  与 `tsconfig.json` 同级, 归到 lib lane 更符合"每个顶层文件都被某条 lane 认领"的意图。
- **不新增构建配置, 直接改 tsconfig.json**: 会让 docs 与 scripts 也被纳入 emit, 产出多余文件, 否决。
