# 门禁证据 (分片 Z)

运行环境: Hark 沙箱里从映射目录下载的副本, 根 node_modules 用 npm install --ignore-scripts --legacy-peer-deps 装 (npm ci 因 package-lock.json 与 package.json 不同步失败: Missing @iconify-json/mdi@1.2.3, @iconify-json/solar@1.2.13, @iconify/types@2.0.0, 属既有问题). 副本用本地 git 建基线 (Z 之前的原文件), 改动 11 个文件. docs/node_modules 未安装.

## npm run build
退出码: 0
```

> @hx/ui@0.5.0 build
> node scripts/gates/run.mjs --group lib

== 门禁 (root=<副本根>) <指定: lib> ==
  [1/8] typecheck      PASS  (12.74s)
  [2/8] ui-rules       PASS  (2.79s)
  [3/8] economy        PASS  (0.13s)
  [4/8] api-snapshot   PASS  (0.05s)
  [5/8] api-version    PASS  (0.04s)
  [6/8] weight         PASS  (0.04s)
  [7/8] motion         PASS  (0.09s)
  [8/8] blueprint      PASS  (0.04s)
门禁: ALL PASS (8 条, 15.93s)
```

## npm run verify
退出码: 1
```

> @hx/ui@0.5.0 verify
> node scripts/gates/run.mjs --checkpoint pre-push

== 门禁 (root=<副本根>) <检查点 pre-push: 推送前 (完整但仍在分钟以内)> ==
   本次改动 11 个文件 → lane (无命中); 其中 11 个路径未认领 (请登记进 lanes.mjs)
  [1/19] typecheck      PASS  (16.89s)
  [2/19] ui-rules       PASS  (4.11s)
  [3/19] economy        PASS  (0.15s)
  [4/19] api-snapshot   PASS  (0.06s)
  [5/19] api-version    PASS  (0.05s)
  [6/19] weight         PASS  (0.04s)
  [7/19] motion         PASS  (0.09s)
  [8/19] blueprint      PASS  (0.04s)
  [9/19] docs-typecheck FAIL  (exit 2, 22.35s)
      文档站类型检查 (tsc -p docs/tsconfig.json --noEmit)
      docs/src/pages/parity/form.tsx(2,29): error TS2307: Cannot find module '@hookform/resolvers/zod' or its corresponding type declarations.
      docs/src/pages/parity/form.tsx(4,19): error TS2307: Cannot find module 'zod' or its corresponding type declarations.
      复现: cd <副本根> && node_modules/.bin/tsc -p docs/tsconfig.json --noEmit
门禁: FAILED — docs-typecheck (总耗时 43.80s)
```
判断: docs-typecheck 失败是因为副本没装 docs 的依赖 (zod, @hookform/resolvers 在 docs/node_modules), 环境问题, 与 Z 改动无关; 9/19 之后的门禁因此未执行, 未验证. 前一次运行还报过 docs/src/pages/gallery/*.tsx, 那是副本下载时把 404 JSON 存成了文件, 已删, 仓库里没有 gallery 目录.

## npm run quality:done
退出码: 1
```

> @hx/ui@0.5.0 quality:done
> node scripts/quality/index.ts done

Quality: 117 项问题
类型: HC-DIR=4, HC-DOC-REVIEW=1, HC-DOCSYNC=1, HC-REUSE=1, HC-TEXT=99, HC-TYPE=2, HC-WHY=7, PROJECT-CONST-DUP=2
完整报告: <副本根>/scripts/.hx_code_quality/reports/review.json
新增 Error: 3, Warning: 14, 历史: 100
测试计划: docs:icons, docs:shell, docs:smoke, hxbrowser:unit, pr-gif:unit, quality:probes [全量]
error [HC-CI] scripts/quality/ci.json:1 [task] docs:shell: Command exited 1
error [HC-CI] scripts/quality/ci.json:1 [task] docs:smoke: Command exited 1
Quality: 2 项问题
类型: HC-CI=2
完整报告: <副本根>/scripts/.hx_code_quality/reports/tests.json
```
判断: 静态检查报 新增 Error 3, 未逐条定位 (报告在副本的 scripts/.hx_code_quality/reports/review.json). 测试阶段两条 HC-CI 失败: docs:shell 和 docs:smoke 都要构建并打开文档站, 副本没装 docs/node_modules (docs-typecheck 同样因缺 zod 失败), 判断为环境原因, 未验证. 接手者应在装齐依赖的工作区重跑.

## 新增 Error 处理

来源: 映射目录里的 scripts/.hx_code_quality/reports/review.json (errors: 3, mode: worktree). 本轮换了沙箱, 副本从映射目录重新下载, 依赖重装 (npm install --ignore-scripts --legacy-peer-deps), docs/node_modules 仍未装.

### 三条定位

| # | 规则 | 位置 | 规则原文 | 证据 |
|---|---|---|---|---|
| 1 | PROJECT-UI-ICON-DECLARED | src/constants/docs.ts:217 | @iconify-json/solar 未在根 package.json 的 dependencies/peerDependencies 声明, 下游安装后图标为空 | icon-[solar--alt-arrow-down-linear] |
| 2 | PROJECT-UI-ICON-DECLARED | src/constants/docs.ts:218 | 同上 | icon-[solar--widget-2-linear] |
| 3 | PROJECT-UI-ICON-DECLARED | src/constants/docs.ts:219 | 同上 | icon-[solar--clock-circle-linear] |

触发原因: 规则 (scripts/quality/checks/ui.ts 的 iconDeclared) 扫 src/ 下所有 icon-[<set>--<name>] 类名, 用快照里的根 package.json 核对 @iconify-json/<set> 是否在 dependencies 或 peerDependencies. 三处是 src/constants/docs.ts 的 NAV_ICON 常量. 产生这份报告时快照里的 package.json 没有声明 @iconify-json/solar.

### 修法与现状

三条都不需要再改代码: 当前 package.json 的 peerDependencies 已有 "@iconify-json/solar": "^1.2.13" (HEAD 8ed4dea 起就有, quality 基线树 14e90bb 里也有), 规则按当前文件重跑已不报. 判断是那份 review.json 生成于 package.json 被改写, peer 声明暂缺的时刻, 已过时. 未改 baseline.json, 未改 coverage.json, 未碰 docs/src/pages/gallery/.

单规则重跑 (副本, 当前文件):
```
$ node scripts/quality/index.ts check --mode worktree --rule PROJECT-UI-ICON-DECLARED,PROJECT-NO-ABS-PATH
Quality: 11 项问题
类型: PROJECT-NO-ABS-PATH=11
新增 Error: 3, Warning: 0, 历史: 8
```
PROJECT-UI-ICON-DECLARED 为 0 条. 剩下 3 条新增是 PROJECT-NO-ABS-PATH, 在 scripts/constants/enrichment.ts:213 与 :215 (两处), 证据是两条匹配 effects.css 导入语句的正则字面量. 这是验收判据里的正则, 不是文件系统路径, 判断为误报. 该文件不在 Z 的 owns 里, 本轮没改, rules.md 的豁免条目未核对.

本轮顺手修的: 本文件此前写进了副本的绝对路径 (5 处, 触发 PROJECT-NO-ABS-PATH), 已统一换成 <副本根>, 其余原文未动.

### 新的一行汇总 (副本上完整 npm run quality:done)

```
新增 Error: 122, Warning: 362, 历史: 251
```
没有达到 新增 Error: 0. 原因: 新副本里质量工具用的基线树是 14e90bb, 它早于 phase 1 所有分片 (日志里 src/motion/*, src/widgets/* 均报 "exists on disk, but not in '14e90bb...'"), 所以六个分片的全部代码都被算成新增, 与你本机报告的口径 (3 条) 不同. 122 条里属于 Z owns 的只有 1 条: PROJECT-CONST-DUP docs/src/App.tsx:130, 字面量 "motion" 出现 3 次 (case "motion"). 修它需要在 src/constants/docs.ts 的 DOC_PAGE_ID 加 motion 键再写 case DOC_PAGE_ID.motion, 而该文件不在 Z owns, 本轮未改. 其余为 HC-TYPE (docs 缺 zod, 环境) 与其他分片文件里的条目, 不在 Z 范围.

需要你本机确认: 在你的工作区重跑 npm run quality:done, 看 新增 Error 是否已为 0 (三条 ICON-DECLARED 应已消失); 如出现 enrichment.ts 的 NO-ABS-PATH 或 App.tsx:130 的 CONST-DUP, 告诉我是否允许改 owns 外的文件.

## 收尾

### docs/src/App.tsx:130 PROJECT-CONST-DUP ("motion" 出现 3 次)

- 修法 (常量提取): src/constants/docs.ts 的 DOC_PAGE_ID 只新增一个键 `motion: "motion"` (diff 仅 +1 行, 该文件其余未动); docs/src/App.tsx 的 `case "motion":` 改为 `case DOC_PAGE_ID.motion:` (DOC_PAGE_ID 此前已从 @hx/ui 导入). 写入前重新拉取了映射里的 App.tsx, 保留了另一执行体刚加的 GalleryPage import 与 case "gallery" 两行, 未改动.
- 重跑: `node scripts/quality/index.ts check --mode worktree --rule PROJECT-CONST-DUP` 后, docs/src/App.tsx 的 Error 只剩 1 条, 为 historical 的 number:3 (Toaster maxVisible={3}, 第 275 行), App.tsx:130 那条已消.
- docs 注册表对账 (`node scripts/gates/frontend/check-docs-registry.mjs`) 认常量式 case, motion 分支对账正常; 该检查本轮退出 1, 唯一违规是 `[case-without-nav] docs/src/App.tsx 的 case "gallery"`, 属另一执行体在写的 gallery, 未处理.

### 最终状态 (本人复核)

| 条目 | 状态 | 理由 |
|---|---|---|
| PROJECT-UI-ICON-DECLARED src/constants/docs.ts:217/218/219 | 已消 | 根 package.json 的 peerDependencies 早有 @iconify-json/solar, 报告是过时快照, 按当前文件重跑 0 条 |
| PROJECT-CONST-DUP docs/src/App.tsx:130 | 已消 | 提取到 DOC_PAGE_ID.motion |
| PROJECT-NO-ABS-PATH docs/reference/gate-evidence.md (5 处) | 已消 | 本文件里的副本绝对路径已换掉, 本节只写仓库相对路径 |
| PROJECT-NO-ABS-PATH scripts/constants/enrichment.ts:213, :215 (2 处) | 误报, 不修 | 是验收判据里匹配 CSS import 的正则字面量, 不是文件系统路径; 按 .agents/notes/implemented/process/2026-11-01-ui-enrichment-acceptance.md, 合入后该脚本与清单整份删除 |

baseline.json 与 coverage.json 未改, docs/src/pages/gallery/ 未碰.

### 复核中发现的新问题 (未修, 待定)

`node scripts/check-enrichment.ts --shard Z` 现报 1 项未满足: src/styles.css 里匹配 effects.css 导入语句的判据命中 0 次 (要求至少 1 次). 映射目录当前的 src/styles.css 里没有 `@import "./effects.css";` (Z 当初写入并通过判据, 之后被覆盖), 其余 Z 改动 (表面分层与动效令牌桥接) 还在. 本轮只授权改 App.tsx 与 DOC_PAGE_ID, 所以没动 styles.css; 恢复只需在 `@import "./native-select.css";` 后补回这一行.

补记: 本节初稿里引用的判据正则自身触发了 PROJECT-NO-ABS-PATH (第 95 行), 已改成文字描述; 重跑 `--rule PROJECT-NO-ABS-PATH` 新增只剩 scripts/constants/enrichment.ts 的 3 条误报.

### 最终门禁 (改造文件范围内)

基线口径: 质量工具 worktree 模式的基线就是 git HEAD 的树. `git rev-parse HEAD^{tree}` = 14e90bb061472202aa82bafa21239182fe362f6e, 即 HEAD 8ed4dea 的树, 不是另一棵旧树 (scope 由 .agents/skills/hx-agent-code/scripts/core/scope.ts 的 collectScope 取 resolveTree(root, "HEAD"), 非 range 模式不接受指定基线). 改造全部未提交, 所以对 HEAD 而言六个分片与 gallery 的代码都算新增. 副本本轮从映射目录重新下载 (823 个文件), HEAD 相同.

$ npm run quality:done
退出码: 1
```

> @hx/ui@0.5.0 quality:done
> node scripts/quality/index.ts done

Quality: 820 项问题
类型: HC-COMMENT-SPACE=1, HC-DIR=7, HC-DOC-REVIEW=4, HC-DOCSYNC=2, HC-REUSE=1, HC-TEXT=131, HC-TYPE=2, HC-WHY=364, PROJECT-CONST-DUP=294, PROJECT-NO-ABS-PATH=11, PROJECT-UI-BW=1, PROJECT-UI-LINE-1PX=1, PROJECT-UI-RGB=1
完整报告: <副本根>/scripts/.hx_code_quality/reports/review.json
新增 Error: 191, Warning: 378, 历史: 251
测试计划: docs:icons, docs:shell, docs:smoke, hxbrowser:unit, pr-gif:unit, quality:probes [全量]
error [HC-CI] scripts/quality/ci.json:1 [task] docs:shell: Command exited 1
error [HC-CI] scripts/quality/ci.json:1 [task] docs:smoke: Command exited 1
Quality: 2 项问题
类型: HC-CI=2
完整报告: <副本根>/scripts/.hx_code_quality/reports/tests.json
```

$ npm run build
退出码: 0
```

> @hx/ui@0.5.0 build
> node scripts/gates/run.mjs --group lib

== 门禁 (root=<副本根>) <指定: lib> ==
  [1/8] typecheck      PASS  (11.36s)
  [2/8] ui-rules       PASS  (2.78s)
  [3/8] economy        PASS  (0.09s)
  [4/8] api-snapshot   PASS  (0.04s)
  [5/8] api-version    PASS  (0.05s)
  [6/8] weight         PASS  (0.04s)
  [7/8] motion         PASS  (0.10s)
  [8/8] blueprint      PASS  (0.05s)
门禁: ALL PASS (8 条, 14.51s)
```

#### 结论

改造文件范围内新增 Error 182 条, 不是 0 条: PROJECT-CONST-DUP 181 条, HC-COMMENT-SPACE 1 条 (src/effects/SpotlightCard.tsx:39, 块注释 * 后多空格). 全部为本次改造引入 (基线是 HEAD, 这些行在 HEAD 中不存在或被改写). 范围外新增 9 条: scripts/constants/enrichment.ts 3 条 (NO-ABS-PATH 误报, 已判), scripts/check-enrichment.ts 3 条 (CONST-DUP), docs/src/pages/parity/form.tsx 2 条 (HC-TYPE, 副本缺 zod), 本文件 1 条 (HC-TEXT 顿号, 已改为逗号).

按文件: docs/src/pages/gallery/DashboardShowcase.tsx 37, docs/src/pages/gallery/GalleryPage.tsx 28, docs/src/pages/CardPage.tsx 22, src/layout/StatCard.tsx 22, docs/src/pages/TabsPage.tsx 18, docs/src/pages/motion/MotionPage.tsx 15, docs/src/pages/effects/EffectsPage.tsx 9, docs/src/pages/ButtonPage.tsx 8, src/motion/presets.ts 7, docs/src/pages/TokensPage.tsx 4, src/primitives/tabs.tsx 4, src/motion/AnimatedNumber.tsx 3, docs/src/navIcons.ts 2, docs/src/pages/box/BoxPage.tsx 1, docs/src/pages/widgets/WidgetsPage.tsx 1, src/effects/SpotlightCard.tsx 1.

build: lib 组 8 条门禁全 PASS.

与你本机口径的差异: 你本机此前报 新增 Error 3, 副本按 HEAD 基线是 191. 若你本机 HEAD 也是 8ed4dea 且改动未提交, 两边应一致; 不一致说明本机 HEAD 已含改造提交, 或 scripts/.hx_code_quality/state 下另有状态. 本节不拿副本数字下最终结论, 以你本机同一命令为准.

另: 映射目录当前的 src/styles.css 里仍没有 effects.css 的导入行 (本轮下载后 grep 只有 tailwindcss, tw-animate-css, tokens.css, spin-variants.css, motion.css, native-select.css, @xyflow, markstream 八条 import). 你本机若已写回, 映射这一份还没同步.

#### 改造范围内新增 Error 全表 (182 条)
```
PROJECT-CONST-DUP docs/src/navIcons.ts:44 | 字面量 string:icon-[solar--shield-warning-linear] 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/navIcons.ts:57 | 字面量 string:icon-[solar--shield-warning-linear] 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/ButtonPage.tsx:43 | 字面量 string:lg 出现 5 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/ButtonPage.tsx:57 | 字面量 string:lg 出现 5 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/ButtonPage.tsx:70 | 字面量 string:center 出现 19 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/ButtonPage.tsx:73 | 字面量 string:outline 出现 80 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/ButtonPage.tsx:82 | 字面量 string:true 出现 28 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/ButtonPage.tsx:82 | 字面量 string:boolean 出现 56 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/ButtonPage.tsx:83 | 字面量 string:false 出现 30 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/ButtonPage.tsx:83 | 字面量 string:boolean 出现 56 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/CardPage.tsx:46 | 字面量 string:stretch 出现 49 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/CardPage.tsx:72 | 字面量 string:stretch 出现 49 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/CardPage.tsx:82 | 字面量 string:w-full 出现 30 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/CardPage.tsx:82 | 字面量 number:3 出现 18 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/CardPage.tsx:83 | 字面量 number:11 出现 8 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/CardPage.tsx:83 | 字面量 number:8 出现 21 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/CardPage.tsx:83 | 字面量 number:7 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/CardPage.tsx:83 | 字面量 number:12 出现 15 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/CardPage.tsx:83 | 字面量 number:10 出现 9 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/CardPage.tsx:83 | 字面量 number:12.4 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/CardPage.tsx:83 | 字面量 number:14 出现 8 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/CardPage.tsx:83 | 字面量 number:9 出现 8 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/CardPage.tsx:87 | 字面量 string:down 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/CardPage.tsx:87 | 字面量 string:较上周 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/CardPage.tsx:88 | 字面量 number:182 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/CardPage.tsx:88 | 字面量 number:150 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/CardPage.tsx:90 | 字面量 number:36 出现 16 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/CardPage.tsx:90 | 字面量 number:37 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/CardPage.tsx:90 | 字面量 number:37 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/CardPage.tsx:109 | 字面量 string:solid 出现 7 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/CardPage.tsx:130 | 字面量 string:false 出现 30 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/CardPage.tsx:130 | 字面量 string:boolean 出现 56 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/TabsPage.tsx:37 | 字面量 string:runs 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/TabsPage.tsx:38 | 字面量 string:config 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/TabsPage.tsx:43 | 字面量 string:runs 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/TabsPage.tsx:46 | 字面量 string:config 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/TabsPage.tsx:64 | 字面量 string:pill 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/TabsPage.tsx:94 | 字面量 string:flex flex-col gap-4 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/TabsPage.tsx:95 | 字面量 string:overview 出现 5 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/TabsPage.tsx:97 | 字面量 string:overview 出现 5 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/TabsPage.tsx:98 | 字面量 string:runs 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/TabsPage.tsx:99 | 字面量 string:config 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/TabsPage.tsx:102 | 字面量 string:a 出现 20 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/TabsPage.tsx:103 | 字面量 string:pill 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/TabsPage.tsx:104 | 字面量 string:a 出现 20 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/TabsPage.tsx:105 | 字面量 string:b 出现 15 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/TabsPage.tsx:106 | 字面量 string:c 出现 10 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/TabsPage.tsx:114 | 字面量 string:start 出现 70 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/TabsPage.tsx:146 | 字面量 string:false 出现 30 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/TabsPage.tsx:146 | 字面量 string:boolean 出现 56 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/TokensPage.tsx:166 | 字面量 string:button 出现 43 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/TokensPage.tsx:190 | 字面量 string:button 出现 43 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/TokensPage.tsx:204 | 字面量 string:space-y-2 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/TokensPage.tsx:227 | 字面量 string:p-4 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/box/BoxPage.tsx:139 | 字面量 string:概览 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/effects/EffectsPage.tsx:78 | 字面量 number:8 出现 21 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/effects/EffectsPage.tsx:90 | 字面量 string:stretch 出现 49 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/effects/EffectsPage.tsx:96 | 字面量 string:flex w-full flex-col gap-3 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/effects/EffectsPage.tsx:97 | 字面量 string:技术栈 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/effects/EffectsPage.tsx:112 | 字面量 string:stretch 出现 49 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/effects/EffectsPage.tsx:132 | 字面量 string:stretch 出现 49 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/effects/EffectsPage.tsx:139 | 字面量 string:p-4 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/effects/EffectsPage.tsx:142 | 字面量 string:lg 出现 5 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/effects/EffectsPage.tsx:142 | 字面量 string:p-4 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:32 | 字面量 number:42 出现 5 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:32 | 字面量 number:48 出现 5 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:33 | 字面量 number:176 出现 7 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:40 | 字面量 number:320 出现 5 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:40 | 字面量 number:180 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:41 | 字面量 number:410 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:41 | 字面量 number:220 出现 6 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:42 | 字面量 number:260 出现 14 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:42 | 字面量 number:520 出现 5 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:43 | 字面量 number:300 出现 7 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:47 | 字面量 number:420 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:51 | 字面量 number:700 出现 5 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:51 | 字面量 number:410 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:60 | 字面量 number:410 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:65 | 字面量 number:182 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:67 | 字面量 number:410 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:68 | 字面量 number:128 出现 5 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:71 | 字面量 number:10 出现 9 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:72 | 字面量 number:100 出现 18 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:90 | 字面量 number:9 出现 8 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:98 | 字面量 number:18 出现 8 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:99 | 字面量 string:md 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:99 | 字面量 string:primary 出现 23 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:108 | 字面量 string:flex items-center gap-2 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:113 | 字面量 string:bg-warning 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:113 | 字面量 string:bg-success 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:131 | 字面量 string:flex flex-col gap-0.5 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:139 | 字面量 string:li 出现 5 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:144 | 字面量 string:较上周 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:148 | 字面量 string:li 出现 5 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:153 | 字面量 string:较上周 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:153 | 字面量 string:down 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:157 | 字面量 string:li 出现 5 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:159 | 字面量 string:错误率 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:161 | 字面量 string:icon-[solar--shield-warning-linear] 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:162 | 字面量 string:down 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/DashboardShowcase.tsx:166 | 字面量 string:li 出现 5 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:40 | 字面量 string:+ 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:40 | 字面量 number:182 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:42 | 字面量 number:8 出现 21 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:43 | 字面量 number:2 出现 75 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:55 | 字面量 number:48 出现 5 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:55 | 字面量 number:56 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:55 | 字面量 number:80 出现 6 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:55 | 字面量 number:62 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:75 | 字面量 string:flex flex-col gap-2 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:107 | 字面量 string:size-4 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:117 | 字面量 string:lg 出现 5 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:118 | 字面量 number:9 出现 8 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:120 | 字面量 string:flex flex-col gap-1.5 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:142 | 字面量 string:技术栈 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:142 | 字面量 number:36 出现 16 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:152 | 字面量 number:0.1 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:153 | 字面量 number:4 出现 18 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:153 | 字面量 string:md 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:153 | 字面量 string:md 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:154 | 字面量 number:2 出现 75 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:154 | 字面量 number:2 出现 75 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:159 | 字面量 number:2 出现 75 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:162 | 字面量 string:muted 出现 8 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:162 | 字面量 string:full 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:190 | 字面量 number:0.1 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:196 | 字面量 number:28 出现 7 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:196 | 字面量 string:grid 出现 6 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/gallery/GalleryPage.tsx:197 | 字面量 number:12 出现 15 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/motion/MotionPage.tsx:19 | 字面量 string:概览 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/motion/MotionPage.tsx:50 | 字面量 string:li 出现 5 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/motion/MotionPage.tsx:71 | 字面量 string:zh-CN 出现 9 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/motion/MotionPage.tsx:89 | 字面量 string:flex flex-wrap gap-2 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/motion/MotionPage.tsx:91 | 字面量 string:primary 出现 23 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/motion/MotionPage.tsx:91 | 字面量 string:ghost 出现 25 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/motion/MotionPage.tsx:96 | 字面量 string:w-full 出现 30 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/motion/MotionPage.tsx:100 | 字面量 string:outline 出现 80 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/motion/MotionPage.tsx:137 | 字面量 string:w-full 出现 30 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/motion/MotionPage.tsx:145 | 字面量 string:0 出现 18 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/motion/MotionPage.tsx:146 | 字面量 string:true 出现 28 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/motion/MotionPage.tsx:146 | 字面量 string:boolean 出现 56 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/motion/MotionPage.tsx:148 | 字面量 string:div 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/motion/MotionPage.tsx:175 | 字面量 string:value 出现 17 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/motion/MotionPage.tsx:177 | 字面量 string:spring 出现 5 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP docs/src/pages/widgets/WidgetsPage.tsx:101 | 字面量 string:技术栈 出现 3 次, 提取到 src/constants/ 后引用
HC-COMMENT-SPACE src/effects/SpotlightCard.tsx:39 | 块注释的 * 后需要恰好一个空格
PROJECT-CONST-DUP src/layout/StatCard.tsx:68 | 字面量 number:100 出现 18 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/layout/StatCard.tsx:69 | 字面量 number:28 出现 7 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/layout/StatCard.tsx:74 | 字面量 string:up 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/layout/StatCard.tsx:75 | 字面量 string:flat 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/layout/StatCard.tsx:75 | 字面量 string:down 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/layout/StatCard.tsx:80 | 字面量 string:flat 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/layout/StatCard.tsx:80 | 字面量 string:flat 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/layout/StatCard.tsx:81 | 字面量 string:up 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/layout/StatCard.tsx:81 | 字面量 string:good 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/layout/StatCard.tsx:81 | 字面量 string:bad 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/layout/StatCard.tsx:85 | 字面量 string:bad 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/layout/StatCard.tsx:85 | 字面量 string:good 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/layout/StatCard.tsx:85 | 字面量 string:flat 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/layout/StatCard.tsx:89 | 字面量 number:2 出现 75 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/layout/StatCard.tsx:93 | 字面量 number:2 出现 75 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/layout/StatCard.tsx:94 | 字面量 number:2 出现 75 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/layout/StatCard.tsx:94 | 字面量 number:2 出现 75 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/layout/StatCard.tsx:107 | 字面量 string:none 出现 9 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/layout/StatCard.tsx:111 | 字面量 string:currentColor 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/layout/StatCard.tsx:111 | 字面量 string:non-scaling-stroke 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/layout/StatCard.tsx:111 | 字面量 string:none 出现 9 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/layout/StatCard.tsx:144 | 字面量 string:number 出现 57 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/motion/AnimatedNumber.tsx:25 | 字面量 string:. 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/motion/AnimatedNumber.tsx:65 | 字面量 string:tabular-nums 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/motion/AnimatedNumber.tsx:68 | 字面量 string:sr-only 出现 5 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/motion/presets.ts:26 | 字面量 number:120 出现 10 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/motion/presets.ts:26 | 字面量 number:20 出现 7 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/motion/presets.ts:27 | 字面量 number:0.8 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/motion/presets.ts:27 | 字面量 number:36 出现 16 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/motion/presets.ts:27 | 字面量 number:420 出现 4 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/motion/presets.ts:28 | 字面量 number:260 出现 14 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/motion/presets.ts:101 | 字面量 string:, 出现 5 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/primitives/tabs.tsx:40 | 字面量 string:spring 出现 5 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/primitives/tabs.tsx:40 | 字面量 number:36 出现 16 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/primitives/tabs.tsx:40 | 字面量 number:480 出现 3 次, 提取到 src/constants/ 后引用
PROJECT-CONST-DUP src/primitives/tabs.tsx:40 | 字面量 number:0.8 出现 3 次, 提取到 src/constants/ 后引用
```

### 本执行体 (分片 Z) 改动的文件清单

- src/index.ts
- src/constants/index.ts
- src/styles.css
- src/constants/docs.ts (只在 DOC_PAGE_ID 加了 motion 一行)
- scripts/build-lib.ts
- scripts/gates/baselines/api-surface.txt (只新增 85 行)
- scripts/gates/baselines/api-surface.version (0.5.0)
- package.json
- README.md
- docs/src/nav.ts
- docs/src/App.tsx
- docs/src/navIcons.ts
- docs/reference/gate-evidence.md (新建)
- CHECKPOINT.md (新建)

未改: scripts/quality/baseline.json, scripts/quality/coverage.json, docs/src/pages/gallery/ 下任何文件. 每次写回映射会在目标目录生成 .hark-bak/, 不属于产物.
