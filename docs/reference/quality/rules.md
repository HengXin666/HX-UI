# 质量门禁规则与命令

本文是 HX-UI 质量门禁的当前事实. 规则逐项裁决 (implemented / not-applicable / blocked) 见 scripts/quality/coverage.json, 取证与推荐见 inventory.md.

## 入口与命令

单一入口 `scripts/quality/index.ts`, Git hooks, npm 脚本与 CI 都调用它. 规则注册表在 `scripts/quality/runtime/registry.ts`, 阈值与精确例外在 `scripts/constants/quality.ts`.

| 命令 | 内容 |
|---|---|
| `npm run quality` | worktree 模式: HEAD 与最终工作区之差 (含未暂存与未跟踪) |
| `npm run quality:staged` | staged 模式: 从 Git index 读取内容, pre-commit 使用 |
| `npm run quality:all` | 全仓扫描, 对照可信 baseline 区分 historical 与 new |
| `npm run quality:done` | 任务完成检查点: worktree 静态检查 + 一次受影响测试 |
| `npm run check:ui` | 只跑 PROJECT-UI-* 设计规约与注释规约, `npm run build` (gates 的 lib 组 ui-rules 门禁) 包含它 |
| `npm run quality:probes` | 门禁自测, 每条规则一对正反 fixture 加集成探针 |
| `npm run quality:audit` | vendored hx-agent-code 的 coverage audit, 有 blocked 项时失败 |
| `node scripts/quality/index.ts check --rule <ID> --mode all` | 单条规则独立运行 |
| `node scripts/quality/index.ts check --mode range --base <sha> --head <sha>` | 精确提交范围 |

退出码: 1 表示存在新增 Error, 2 表示工具或参数错误, Warning 与 historical 不改变退出码. 每次运行覆盖写入 `scripts/.hx_code_quality/reports/review.{md,json}`, 终端问题超过 10 条时只显示数量与类型统计.

## 检查点

| 检查点 | 运行内容 |
|---|---|
| pre-commit (`.githooks/pre-commit`) | staged 静态检查, 不跑测试; 本钩子自身只读 index, 不读工作区 (同时装了 gates 钩子时见下) |
| pre-push (`.githooks/pre-push`) | 每个推送 ref 的精确范围静态检查 + affected 测试; 新远程分支取与 `<remote>/HEAD` 的 merge-base, 无法确定时与空树比较 (全量) |
| post-commit (`.githooks/post-commit`) | 目前没有格式化缓存, 只委托原有 hook |
| 任务完成 | `npm run quality:done` |
| Agent 写入后格式化 | blocked: 没有 formatter (HC-FORMAT), 目标 Agent 宿主未确定 |
| CI | quality-code / quality-docs / quality-build (+ quality-tests), 见 .github/workflows |

启用: `npm run hooks:install` 设置 `core.hooksPath=.githooks` 并补可执行位; 已有其他 core.hooksPath 时不覆盖并提示.

同时执行过 `npm run gates:install-hooks` 时, `.githooks` 下的 pre-commit 与 pre-push 会先调用 `.git/hooks` 里的同名 hook. 那份 gates 钩子按 `scripts/gates` 的检查点分组运行 (类型检查, 设计规约等), 读的是工作区, 因此 "只读 index" 只描述本入口自己的检查, 未暂存的问题仍可能让 pre-commit 失败.

## 规则

| ID | 等级 | CI 分组 | 判据 |
|---|---|---|---|
| PROJECT-UI-PALETTE | Error | code | src 只用语义 token, 非语义调色盘 (slate/blue/...) 一律报错, 只放行 emerald/amber/red |
| PROJECT-UI-HEX | Error | code | src 组件内禁止 hex 色值, 颜色只来自 tokens.css |
| PROJECT-UI-RGB | Error | code | src 组件内禁止 rgb/rgba/hsl/hsla/oklch/oklab/hwb 函数色值, 包括 Tailwind 任意值里的 _rgba( |
| PROJECT-UI-LINE-1PX | Error | code | border/ring/outline/divide 线宽只允许 1px, 禁止 -2/-4/-8 与 [0.5px] 等任意值 |
| PROJECT-UI-BW | Error | code | 禁止 black/white 原色类 (bg-black/50, bg-white, text-white 等), 改用语义 token |
| PROJECT-UI-TRANSITION-ALL | Error | code | 禁止 transition-all 与 transition: all, 必须列出具体属性 |
| PROJECT-UI-BUTTON-TYPE | Error | code | 原生 <button> (含绑定到 button 的动态标签, 如 asChild ? Slot.Root : TAG.button) 必须显式写 type, AST 判定, 不受换行与箭头函数影响 |
| PROJECT-UI-ICON-DECLARED | Error | code | src 中的 icon-[<set>--<name>] 图标类, 其 @iconify-json/<set> 必须在根 package.json 的 dependencies 或 peerDependencies 声明 |
| PROJECT-UI-DEV-DIARY | Error | code | src 注释里不许写开发日记 (实测踩到 / 上一版 / 用户报 等调试经过), 只扫注释, 不扫字符串 |
| PROJECT-UI-JSX-COMMENT-LEAK | Error | code | src 的 .tsx 中 JSX 子节点位置不许写裸块注释 (会渲染成文字), 必须写成 {/* ... */} |
| PROJECT-CONST-DUP | Error | code | 同一字符串或数字字面量在同一代码池 (库与文档站 / scripts 工具) 出现 >= 3 次必须提取为常量, 分别放到 src/constants/ 与 scripts/constants/ |
| PROJECT-NO-ABS-PATH | Error | code | 禁止任何文件系统绝对路径写法 (POSIX 系统根目录, Windows 盘符与 UNC, 家目录, file URL, shebang) 及以根路径开头的路径拼接 |
| HC-EXT | Error | code | 仓库内禁止手写 .js/.mjs/.cjs, 脚本统一 .ts |
| HC-SIZE | Error | code | 逻辑文件 .ts 不超过 300 行, UI 文件 .tsx 不超过 500 行 |
| HC-DIR | Warning | code | 单目录直接文件数大于 6 时待 review |
| HC-COMMENT | Error | code | 文件头连续注释不超过 10 行 |
| HC-COMMENT-SPACE | Error | code | 注释标记后恰好一个空格, 连续尾随单行注释起始列对齐 |
| HC-TEXT | Error | docs | 注释与文档不用 emoji 或非 ASCII 标点, 中文正文允许, 代码字符串与代码块不检查 |
| HC-DOCSIG | Error | code | 已写 @param 的函数文档必须与参数名逐一对应 |
| HC-DOCNAME | Error | docs | docs 文档树目录与文件名小写 kebab, 扩展名 md/mdx/yaml, 禁止 v2/final/copy 等副本词, 日期前缀只在 decisions |
| HC-DOCS | Error | docs | docs 文档只放在 tutorials/reference/architecture/decisions/archive 之下, 同目录不得出现去掉副本词后同名的文档 |
| HC-DOCSIZE | Error | docs | 单个文档不超过 1500 行 |
| HC-CONTEXT | Error | docs | 每个含 README.md 或 AGENTS.md 的目录两者都存在并互相引用, AGENTS 少于 150 行且少于 16384 bytes |
| HC-BUDGET | Error | docs | 每个文件的祖先 AGENTS.md 与 skill 注入上界合计不超过 65536 bytes |
| HC-STACK | Error | code | 登记栈为 React + TS + npm, 新增其他前端框架或其他包管理器锁文件需先裁决 |
| HC-DEPS | Warning | code | 依赖变化进 review: 新直接依赖与跨大版本需批准记录, 否则 unapproved; 补丁/小版本 review-only |
| HC-REUSE | Warning | code | inventory 必须含架构推荐与依赖推荐, 依赖变化时需同步更新 inventory |
| HC-CYCLE | Error | code | src 与 docs/src 的 AST 导入图无环, 无法解析的相对导入或动态导入显式报错 |
| HC-TYPE | Error | code | 对检查快照运行 tsc --noEmit (tsconfig.json 与 docs/tsconfig.json), 全量解析项目引用 |
| HC-DOCSYNC | Warning | code | 函数实现与其 JSDoc 只有一侧在 diff 中变化时, 提醒核对另一侧语义 |
| HC-WHY | Warning | code | diff 中新增或修改的注释待 review: 只写意图/原因/约束, 不复述代码 |
| HC-DOC-REVIEW | Warning | docs | diff 中变化的文档待 review: 单一主题, 不与上下层重复, 内容仍成立 |
| HC-CI | Error | code | 三个 push/PR 入口与可复用测试流程存在并调用 vendored runner, ci.json 通过 runner 配置校验 |
| HC-COLLAB | Error | code | Bug/Feature/组件需求 Issue 模板, PR 模板, CODEOWNERS 与 CONTRIBUTING 存在且归属为已验证身份 |
| HC-META | Error | code | 注册表与 coverage.json 一一对应, hook 与 package 脚本接到单一入口 |

PROJECT-* 是本项目扩展规则, 不替代 HC-* 内置规则. 未列出的 HC 规则 (HC-BOUNDARY, HC-DIR-MIX, HC-FORMAT, HC-LINT, HC-NOTES, HC-TEST, HC-PERF 为 blocked; HC-DATA, HC-PAIR, HC-CONTRACT, HC-PY-IMPORT, HC-PY-CONST 为 not-applicable) 的原因见 coverage.json.

## 扫描范围与精确例外

- 不读取: `.agents/` (vendored skill, 上游维护), node_modules, docs/dist, `scripts/.hx_code_quality/`
- 代码规则: `src/`, `docs/src/`, `docs/scripts/`, `scripts/` 下的 .ts/.tsx 与 `docs/vite.config.ts`; PROJECT-UI-* 只查 `src/`
- PROJECT-UI-HEX / PROJECT-UI-RGB 豁免 `src/layout/CodeBlock.tsx`: 语法高亮色来自 One Dark Pro 主题定义, 不随换肤
- PROJECT-CONST-DUP 分两个计数池: 库与文档站 (常量放 `src/constants/`) 与 scripts 工具 (常量放 `scripts/constants/`). 不计: 空字符串, 数字 0 与 1, import 路径, 字面量类型, 属性名, 指令序言; 常量目录内的定义本身不计
- PROJECT-NO-ABS-PATH 与 HC-TEXT 豁免 `scripts/quality/fixtures.json`: 门禁自测的反例输入
- HC-TEXT 只查注释, Markdown 正文 (跳过代码块与行内代码) 和 .github 下的 YAML, 界面文案字符串属于本地化数据不查
- HC-DOCNAME / HC-DOCS 不查文档站应用代码: `docs/src/`, `docs/scripts/`, `docs/index.html`, docs 的 package/lock/tsconfig/vite 配置
- HC-SIZE 目前按物理行计数 (尚无 formatter)

## 与 scripts/gates 的关系

main 上已有一套 `scripts/gates` (注册表 / 分流 / 指纹 / 负向探针 / .git/hooks), `npm run build` 与 `npm run verify` 由它调度. 两套并存, 分工如下:

- 设计规约与注释规约只有一份实现, 在 `scripts/quality/checks/ui.ts`; gates 注册表的 `ui-rules` 门禁直接调用 `npm run check:ui` 同一条命令, 原 `scripts/check-ui-rules.mjs` 已删除
- gates 的指纹 `thresholds:check-ui-rules` 改为对 ui.ts 去注释后的全部代码求哈希, 改任何 UI 判据都要显式 `check-fingerprint --update`
- `.githooks` 的 pre-commit / pre-push 会先调用 `.git/hooks` 下的同名 hook (gates 安装的那份), 再跑质量入口, 两者都生效
- `scripts/gates/**/*.mjs`, `scripts/check-blueprint.mjs`, `scripts/e2e/*.mjs` 仍是 .mjs, 作为 HC-EXT 历史项留在 baseline, 迁 .ts 另行处理

## Baseline

`scripts/quality/baseline.json` 由可信基准提交 65f8e76 (迁移门禁前的 main, 含 src/blueprint 与 layout 新组件) 扫描生成, 再与当前内容求交集, 只保留两边都存在的 Error, 因此不会把本次新增的违规写进去. 每条保存 path, ruleId, fingerprint, reason, approvedBy.

- 指纹 = 规则 ID + 路径 + 违规内容 + 该内容在文件内的第 k 次出现, 不含行号. 修掉一处后剩余条目仍匹配; 同类违规多出一处会得到新指纹, 判为新增 Error
- 检查时 baseline 从提交树读取 (diff 模式取 base, 其余取 HEAD; CI 取事件 base), 不信任工作区里被改过的 baseline
- HC-CI, HC-COLLAB, HC-META, HC-TYPE 永不进入 baseline
- rename 不自动迁移条目. 历史违规被修复后删除对应条目, 新增或放宽条目必须单独 review

生成命令 (仅在明确授权的重新基线时使用):

```sh
node scripts/quality/index.ts baseline --tree <可信提交> --approved-by <授权人> --reason <原因>
```
