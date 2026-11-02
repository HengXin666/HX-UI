# 质量门禁取证 (inventory)

记录安装 hx-agent-code 门禁时对 HX-UI 的取证事实, 规则裁决依据, 以及架构与依赖推荐. 规则与命令的当前事实见 rules.md.

## 目标与版本

| 项 | 事实 |
|---|---|
| 目标仓库 | HengXin666/HX-UI, 默认分支 main, 首次安装基准 12c7c4f, 迁移基准 65f8e76 (含 src/blueprint 与 scripts/gates) |
| 门禁技能 | hx-agent-code 1.0, 固定版本整份 vendor 在 `.agents/skills/hx-agent-code`, 来源 HengXin666/HXLoLis 提交 b7a5c91 |
| 依赖技能 | hx-agent-notes 未 vendor (HC-NOTES blocked); hx-make-skill 只用于维护技能本身, 目标仓库运行期不需要 |
| 运行时 | Node 22.18+ 原生运行 TS (本地验证 22.23.3, CI 使用 setup-node 22), npm 10 |
| 类型检查 | TypeScript 5.9.3, `tsconfig.json` (src) 与 `docs/tsconfig.json` (docs/src) |
| 文档站构建 | Vite 8.3.1 + @tailwindcss/vite, `docs/` 下独立 package |
| formatter / lint | 无 (无 prettier/eslint/biome 配置) |
| 子模块 | 无 |

## 技术栈

React 19 + TypeScript + Tailwind 4 组件库, 蓝图画布层用 @xyflow/react 12, 蓝图 e2e 用 playwright (devDependencies), 以 TS 源码形式发布 (`exports` 指向 `src/*.ts`). 包管理器为 npm (根与 docs 各一个 package-lock.json). HC-STACK 把 npm 登记为既有栈事实, 新增 pnpm/yarn/bun 锁文件或其他前端框架会报错, 是否迁移 pnpm 见下文推荐.

## 模块表

| 模块 | 路径 | 公共接口 | 测试 |
|---|---|---|---|
| primitives | src/primitives/ (24 文件) | 经 src/index.ts 导出 | docs:smoke, docs:shell |
| layout | src/layout/ (19 文件) | 经 src/index.ts 导出, 内部直接 import primitives 文件 | 同上 |
| charts | src/charts/ (4 文件) | 经 src/index.ts 导出 | 同上 |
| blueprint | src/blueprint/ (54 文件, React Flow 画布 + 语义层) | 经 src/index.ts 导出 | scripts/gates 的 blueprint 与 bp-e2e 门禁 (需兄弟目录 HX-Blueprint-Demo), docs:smoke |
| tokens/styles | src/*.css | package exports | 无 |
| constants | src/constants/ | 常量库, 本次新建 | 无 |
| docs 站 | docs/src/, docs/scripts/ | 应用, 不发布 | docs:icons, docs:smoke, docs:shell |
| 门禁 | scripts/quality/, scripts/constants/, .githooks/ | 单一入口 scripts/quality/index.ts | quality:probes |
| gates 总线 | scripts/gates/, scripts/check-blueprint.mjs, scripts/e2e/ | 单一入口 scripts/gates/run.mjs (npm run build / verify / gates) | gates:probe (probe-gates.mjs) |

没有数据端口, 请求层, 后端路由或 API 契约. 影响图由 `node scripts/quality/index.ts graph` 从 AST 导入关系生成, 并把以上路径映射到测试 ID; 根 package/lock/tsconfig, docs 配置, workflows 与 ci.json 变化触发全量.

## 原门禁 review

原 `scripts/check-ui-rules.mjs` 已迁入 `scripts/quality/checks/ui.ts`, 修复与补充:

- `rgba(` 前面是单词字符时 (`shadow-[0_1px_2px_rgba(...)]` 中的 `_rgba(`) 原正则 `\b` 匹配不上而漏过, 现在用非字母数字左边界
- 新增 PROJECT-UI-BW (bg-black/, bg-white, text-white 等), PROJECT-UI-LINE-1PX 覆盖 ring/outline/divide 与 `ring-[0.5px]` 这类任意值, PROJECT-UI-TRANSITION-ALL
- 新增 PROJECT-UI-ICON-DECLARED: src 中 icon-[solar--] / icon-[mdi--] 的图标集只在 docs/package.json 声明
- button type 改为 JSX AST 判定, 原实现取到第一个 `>` 为止, 遇到 `=>` 箭头函数会截断
- 注释剔除改用 TypeScript token trivia, 原实现会把字符串里的 `//` 当注释

迁移到 65f8e76 时, 用户在 main 上新增的门禁逻辑全部保留并并入:

- check-ui-rules.mjs 的 no-dev-diary (注释里的开发日记) 迁为 PROJECT-UI-DEV-DIARY, 词表原样, 改用 TypeScript 注释 trivia 判定只扫注释
- check-ui-rules.mjs 的 jsx-comment-leak 迁为 PROJECT-UI-JSX-COMMENT-LEAK, 由 "上一行以 > 结尾" 的行启发式改为 JsxText AST 判定
- check-smoke / check-shell / check-icons 的 CHECK_UI_ROOT 扫描根覆盖与 check-shell 的表格行点击, 窄屏导航断言随 .ts 版本保留
- scripts/gates 的 ui-rules 门禁改为调用 `npm run check:ui`, icons / smoke / shell 指向 .ts; 指纹抽取器与负向探针同步改到 scripts/quality, 指纹已 --update
- lanes 的 gates lane 认领新增的 .githooks/, .agents/, AGENTS.md, CONTRIBUTING.md

`scripts/check-smoke.mjs`, `check-shell.mjs`, `docs/scripts/check-icons.mjs` 迁移为 .ts (HC-EXT), 头注释超过 10 行的原因说明移到 browser-checks.md, 写死的系统绝对路径候选被移除.

## Agent hook 能力

仓库没有任何 Agent 宿主配置 (无 .claude, .codex, .cursor 等), 无法确认目标 Agent 支持哪些 write/Bash/stop hook. 已提供任务完成入口 `npm run quality:done` 与 Git hooks; Agent 自动触发列为 blocked, 需要用户指定宿主后接线.

## GitHub 状态

- 原有 workflows: 安装时无; main 之后新增 quality.yml (调用 scripts/gates/run.mjs --all --strict), 保留不动. 本次新增 quality-code / quality-docs / quality-build / quality-tests, 由 vendored `scripts/ci.ts` 执行 `scripts/quality/ci.json`
- 协作文件: 新增 bug / feature / component-request Issue 模板, PR 模板, CODEOWNERS, CONTRIBUTING. CODEOWNERS 的 @HengXin666 经 GitHub API 核实为仓库所有者
- 分支保护与 required check 未配置: 需要把 code, docs, result (quality-build) 绑定为 required check, 属于仓库管理操作, 未在本次执行
- 机器人评论未启用, 报告以 artifact 形式上传

## 规则裁决摘要

| 状态 | 规则 |
|---|---|
| implemented | HC-STACK, HC-EXT, HC-REUSE, HC-DEPS, HC-CYCLE, HC-DIR, HC-COMMENT-SPACE, HC-SIZE, HC-TYPE, HC-DOCSIG, HC-DOCSYNC, HC-COMMENT, HC-WHY, HC-TEXT, HC-DOCS, HC-DOC-REVIEW, HC-DOCSIZE, HC-DOCNAME, HC-CONTEXT, HC-BUDGET, HC-CI, HC-COLLAB, HC-META 与 12 条 PROJECT 规则 |
| not-applicable | HC-DATA, HC-PAIR, HC-CONTRACT (无 API/数据层), HC-PY-IMPORT, HC-PY-CONST (无 Python) |
| blocked | HC-BOUNDARY, HC-DIR-MIX, HC-FORMAT, HC-LINT, HC-NOTES, HC-TEST, HC-PERF |

HC-TYPE 目前覆盖 src 与 docs/src; scripts 缺 Node 类型定义, 待 APR-dependency-types-node. HC-BUDGET 的 skill 注入上界按 vendored hx-agent-code 的 SKILL.md, steps 与 references 全部字节计算 (该技能 disable-model-invocation, 不常驻).

## 架构推荐

结论: 本次保留现有模块结构, 不改组件文件. 推荐后续采用 "局部调整": 为 src/primitives, src/layout, src/charts 各加一个 index.ts 公共接口, 跨模块只从 index 导入, 随后注册 HC-BOUNDARY 并为 HC-DIR-MIX 声明模块成员. 比较了保留现状 (HC-BOUNDARY 无法裁决), 局部调整 (新增 3 个 index 并改 import, 不改视觉与行为) 与拆成 monorepo 包 (成本高, 超出范围). 详见 scripts/quality/approvals.json 的 APR-architecture-module-public-api, 状态 proposed.

## 依赖推荐

结论: 本次不新增任何依赖, 门禁全部复用 TypeScript 编译器 API, Node 标准库与 vendored hx-agent-code. 以下选择需要用户授权, 均登记在 approvals.json, 状态 proposed:

| ID | 内容 | 解除的 blocked |
|---|---|---|
| APR-dependency-formatter-lint | @biomejs/biome (对比 prettier + eslint + typescript-eslint), 以及 4 空格还是保留 2 空格 | HC-FORMAT, HC-LINT |
| APR-dependency-types-node | @types/node@^22, scripts 纳入 tsc | HC-TYPE 的 scripts 部分 |
| APR-dependency-ui-test-runner | vitest + @testing-library/react + jsdom | HC-TEST |
| APR-dependency-perf-runner | @playwright/test | HC-PERF |
| APR-dependency-iconify-peer | 根 package.json 声明 @iconify-json/solar 与 @iconify-json/mdi | 24 条 PROJECT-UI-ICON-DECLARED 历史项 |
| APR-dependency-agent-notes | vendor hx-agent-notes + uv + tree-sitter | HC-NOTES |
| APR-stack-pnpm | npm 迁移 pnpm, 推荐保留 npm | 无 (HC-STACK 已登记事实) |

main 上由仓库所有者直接引入的依赖按既成事实登记为 approved: APR-dependency-xyflow-react (@xyflow/react ^12.12.0, 提交 48448b9) 与 APR-dependency-playwright (playwright ^1.63.0, 提交 1f23399). HC-DEPS 之后遇到它们跨大版本时会显示对应批准记录.

对标 shadcn/ui 全量组件时 (2026-10-18) 新增 APR-dependency-shadcn-parity, 状态 proposed (由代理登记, 等仓库所有者签字改为 approved 并填写 approvedBy 后才算授权): 运行时依赖 cmdk, input-otp, embla-carousel-react, react-resizable-panels, react-hook-form 各服务一个组件 (Command / Combobox, InputOTP, Carousel, Resizable, Form), 均为 shadcn 官方选用的同一批库; zod 与 @hookform/resolvers 只进 docs/package.json, 用于 Form 示例. 其余组件全部复用已有的 radix-ui, motion 与 lucide-react.

版本与许可证取自 npm registry, 查证日期 2026-10-11 (shadcn 对标批次为 2026-10-18); 安全公告未逐项查询, 安装前需 npm audit.

### 路线图依赖预审批 (P0-02, 2026-11-02)

`docs/reference/audit/ui-library-roadmap.md` 各阶段需要的新依赖在 P0-02 一次登记, 后续任务不得自行改 approvals.json, 只由集成任务 (P0-Z / P1-Z / P2-Z) 按下表写入 package.json. 状态均为 proposed, 由代理登记, 等仓库所有者签字改为 approved 后 HC-DEPS 才显示 approved. recharts, motion, react-hook-form, radix-ui 已是 dependencies, 不重复登记. 体积为 bundlephobia min+gzip 估计, 版本与发布日期取自 npm registry, 查证日期 2026-11-02.

| 审批 ID | 依赖 | 安装方式 | gzip 估计 | 首次引入 | 取舍 |
|---|---|---|---|---|---|
| APR-dependency-tanstack-grid | @tanstack/react-table ^8.21.3 | optional peer, check-weight HEAVY | 约 14 KB | P1-07 | 无头引擎, 外观全走令牌; 不选 AG Grid / MUI X (自带样式, 体积大). 不选最新 v9: v9 把 useReactTable 改名 useTable, 与 P1-07 判据冲突 |
| APR-dependency-tanstack-grid | @tanstack/react-virtual ^3.14.25 | optional peer, check-weight HEAVY | 约 10 KB | P1-08 | 支持动态行高与 scrollToIndex, P2-01 可与 react-table 同族接线; 不选 react-window (无动态测量), react-virtuoso (自带 DOM 结构) |
| APR-dependency-dnd-kit | @dnd-kit/core ^6.3.1, @dnd-kit/sortable ^10.0.0, @dnd-kit/utilities ^3.2.2 | dependencies | 合计约 19.5 KB | P2-04 | 自带 KeyboardSensor 与读屏播报; 不选 pragmatic-drag-and-drop (无键盘拖拽), react-beautiful-dnd (已归档). core 最近发布 2024-12, 活跃度偏低但 API 稳定 |
| APR-dependency-form-schema | zod ^4.6.7 | optional peer (不进 HEAVY) | 约 89 KB 全量 | P1-01 | 下游多半自带 zod, peer 共享一份实例避免 schema 类型不兼容; 版本与 docs/package.json 一致 |
| APR-dependency-form-schema | @hookform/resolvers ^5.9.2 | dependencies | 约 0.6 KB | P1-01 | 极小, 直接带上; 最新 7.0.1 暂不跟, 与 docs 一起另行升级 |
| APR-dependency-unit-test-stack | vitest ^5.0.5, @vitest/browser ^5.0.5 (+ @vitest/browser-playwright) | devDependencies | 不进产物 | P0-09 | 复用 vite 8 配置; browser 模式复用已批准的 playwright |
| APR-dependency-unit-test-stack | @testing-library/react ^16.3.3, user-event ^14.6.8, jest-dom ^7.0.1 (+ @testing-library/dom ^10.4.2 peer) | devDependencies | 不进产物 | P0-09 | 按可访问角色查询与真实键盘序列, 键盘交互测试必需 |
| APR-dependency-unit-test-stack | happy-dom ^21.0.4 | devDependencies | 不进产物 | P0-09 | 取代 APR-dependency-ui-test-runner 里的 jsdom: 启动快; 需要真实布局时走 browser 模式 |
| APR-dependency-unit-test-stack | axe-core ^4.14.0 | devDependencies | 不进产物 | P0-09 | 单元测试 axe 断言; MPL-2.0 只在开发期使用, 不分发 |
| APR-dependency-axe-playwright | @axe-core/playwright ^4.14.0 | devDependencies | 不进产物 | P1-16 | AxeBuilder 逐页扫描文档站, 复用已装 playwright; 不选 pa11y (另起 puppeteer) |
| APR-dependency-tiptap | @tiptap/react ^3.32.2, @tiptap/starter-kit ^3.32.2 (+ @tiptap/core, @tiptap/pm 同版本 peer) | optional peer, check-weight HEAVY | 合计 150 KB 以上 | P2-09 | 扩展生态与 Markdown 往返成熟; 不选 Lexical (Markdown 往返弱), Slate (0.x API 不稳) |

重依赖约束: @tanstack 系与 @tiptap 系只做 optional peer 并留在 devDependencies, 由 P1-Z (tanstack) 与 P2-Z (tiptap) 在写入 package.json 的同一提交里加入 `scripts/check-weight.mjs` 的 HEAVY 清单. P0-02 不改 check-weight: package.json 未声明前加入 HEAVY 会让该检查失败.

## 验收命令

```sh
npm run quality:all
npm run quality:probes
npm run quality:audit
npm run build
npm run test
```

`quality:audit` 目前预期失败: coverage.json 里还有 7 条 blocked 规则 (HC-FORMAT, HC-LINT, HC-TEST, HC-PERF, HC-NOTES, HC-BOUNDARY, HC-DIR-MIX), 上表的审批项落地后该命令才能通过.
