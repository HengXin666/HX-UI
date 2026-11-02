# HX-UI 统一 UI 库路线图与并行任务拆解 (2026-11)

基准: 2026-11-02 工作区, package.json version 0.5.0. 调研与差距矩阵见 `docs/reference/audit/ui-library-gap-analysis.md`. 本文的任务表与 `docs/reference/audit/ui-library-tasks.json` 一一对应 (同一份数据生成), 以 JSON 为准.

## 一. 目标

让下游前端只依赖 `@hx/ui` 一个包就能完成: 主题与暗色, 国际化, 表单, 数据网格与虚拟化, 日期与日程, 图表, 浮层与通知, 导航与应用外壳, 中后台 Pro 页面, 以及已有的 AI 会话与蓝图领域件. 1.0 的判据:

- 差距矩阵 (gap-analysis 第六节) 中 P0 与 P1 全部关闭, P2 至少关闭 80%.
- 每个公共组件: 有文档页, 有自动生成的 props 表, 有至少一个交互测试, axe 无 serious / critical 违规, 亮暗两套与 RTL 下冒烟通过.
- 每个入口有 gzip 体积预算; API 快照冻结, 破坏性变更走 CHANGELOG + 迁移文档 + codemod.

## 二. 拆解原则

- 不换栈: React 19 + radix-ui + Tailwind v4 (可选) + cva + motion 不变; 复杂引擎直接用 TanStack Table / Virtual, react-hook-form + zod, dnd-kit, 不自研.
- 新能力进新目录 (src/provider, src/locale, src/hooks, src/form, src/inputs, src/select, src/dates, src/upload, src/color, src/data-grid, src/virtual, src/tree, src/display, src/notify, src/overlay, src/nav, src/shell, src/text, src/pro, src/schedule, src/sortable, src/rich-text, src/charts/ext, src/motion/ext), 各带 index.ts 桶文件.
- 共享入口只归每阶段的集成任务 (P0-Z / P1-Z / P2-Z / P3-Z): `src/index.ts`, `src/constants/index.ts`, `package.json`, `package-lock.json`, `docs/src/nav.ts`, `docs/src/App.tsx`, `docs/src/navIcons.ts`, `README.md`, `scripts/gates/registry.mjs`, `scripts/gates/baselines/api-surface.txt`, `scripts/gates/baselines/api-surface.version`, `scripts/quality/approvals.json`.
- 同一阶段内, 除依赖链上的任务外, 任意两个任务的写入范围互不相交 (已用脚本校验前缀重叠), 因此可以无限叠加并行的执行者.
- 每个任务都要满足既有门禁: tsx 不超过 250 行, ts 不超过 300 行, 每目录直接文件不超过 6 个 (超出就分子目录), 3 次以上字面量进 src/constants/<任务>.ts, 一篇 agent note 双链, 组件颜色只来自语义 token, 线条 1px, 原生 button 写 type, 不写 transition-all.
- 每个任务完成时运行 `npm run quality:done` 与 `uv run scripts/redlines/agent_notes.py --diff`; 涉及前端可见变化的 PR 按 AGENTS.md 嵌入 GIF.
- 新直接依赖必须已在 P0-02 登记; 任务不得自行改 approvals.json (P0-02 与集成任务除外).
- 验收判据只用三种: 文件存在, 行数区间, 正则命中; 一项任务可有多条, 全部满足才算完成.

## 三. 阶段总览

| 阶段 | 主题 | 任务数 | 并行度 | 关键产出 | 出口版本 |
|---|---|---|---|---|---|
| P0 | 基础设施: 契约, 令牌, 主题, 国际化, hooks, 测试, 打包, 版本 | 12 | 契约 -> 令牌 -> 隔离 串行, 其余并行 | HxProvider, LocaleProvider, hooks, vitest + axe, 子路径导出, CHANGELOG | 0.6.0 |
| P1 | 核心件补齐: 表单, 输入, 选择, 日期, 上传, 颜色, 网格, 虚拟化, 树, 展示, 通知, 浮层, 导航, 外壳, 文本, a11y 门禁 | 17 | 16 路全并行 | DataGrid, Tree, Cascader, Transfer, DateRangePicker, Upload, notify(), AppShell | 0.7.0 |
| P2 | 高级与 Pro 层: 网格编辑, 图表扩充, 日程, 看板, ProTable / ProForm, 动效二期, 主题编辑器, 令牌导出, 富文本 | 10 | 9 路全并行 | ProTable, Schedule, Kanban, 主题编辑器, tokens.json | 0.8.0 |
| P3 | 文档测试与 1.0: props 表, playground, 视觉回归, 测试铺满, RTL 扫查, llms 出口, 性能, codemods | 9 | 8 路 (P3-06 依赖 P3-01) | PropsTable, Playground, 像素基线, llms.txt, 1.0.0-rc.0 | 1.0.0-rc.0 |

## 四. 依赖关系

```
P0-03 契约 --+--> P0-04 令牌 --> P0-05 样式隔离 --> P0-10 子路径与体积
             +--> P0-06 主题  P0-07 国际化  P0-08 hooks  P0-11 版本
P0-01 文档归位 (无依赖)   P0-02 依赖审批 --> P0-09 测试底座, P0-10
全部 P0 --> P0-Z 集成 (0.6.0)
P0-Z --> P1-01 .. P1-16 (16 路并行) --> P1-Z 集成 (0.7.0)
P1-Z --> P2-01 .. P2-09 (9 路并行) --> P2-Z 集成 (0.8.0)
P2-Z --> P3-01 .. P3-08 (P3-06 依赖 P3-01) --> P3-Z 集成 (1.0.0-rc.0)
```

关键路径: P0-03 -> P0-04 -> P0-05 -> P0-10 -> P0-Z -> (P1 最慢一项, 预计 P1-07 DataGrid) -> P1-Z -> (P2 最慢一项, 预计 P2-05 Pro 层) -> P2-Z -> P3-01 -> P3-06 -> P3-Z.

## 五. 并行任务拆解表

### 第零阶段: 基础设施

| ID | 标题 | 依赖 | 写入范围 | 验收判据 |
|---|---|---|---|---|
| P0-01 | 审计文档归位与门禁对齐 | 无 | `docs/audit`<br>`docs/reference/audit/ui-library-gap-analysis.md`<br>`docs/reference/audit/ui-library-roadmap.md`<br>`docs/reference/audit/ui-library-tasks.json`<br>`docs/reference/audit/` | 文件存在 `docs/reference/audit/ui-library-gap-analysis.md`<br>文件存在 `docs/reference/audit/ui-library-roadmap.md`<br>文件存在 `docs/reference/audit/ui-library-tasks.json` |
| P0-02 | 依赖预审批 | 无 | `scripts/quality/approvals.json`<br>`docs/reference/quality/inventory.md` | 正则 `@tanstack/react-table` 命中 `scripts/quality/approvals.json`<br>正则 `@axe-core/playwright` 命中 `scripts/quality/approvals.json`<br>正则 `react-virtual` 命中 `docs/reference/quality/inventory.md` |
| P0-03 | 组件契约规范 | 无 | `docs/architecture/component-contract.md`<br>`docs/architecture/README.md`<br>`docs/architecture/AGENTS.md` | 行数 150..900 `docs/architecture/component-contract.md`<br>正则 `classNames` 命中 `docs/architecture/component-contract.md`<br>正则 `onValueChange` 命中 `docs/architecture/component-contract.md` |
| P0-04 | 令牌三层化与尺寸密度档 | P0-03 | `src/tokens.css`<br>`src/styles.css`<br>`docs/src/pages/TokensPage.tsx`<br>`.agents/notes/implemented/feature/` | 正则 `--control-h-xl` 命中 `src/tokens.css`<br>正则 `--palette-[a-z]+-950` 命中 `src/tokens.css`<br>行数 700..1500 `src/tokens.css` |
| P0-05 | 全局样式隔离与 cascade layer | P0-04 | `src/base.css`<br>`src/tokens.css`<br>`scripts/build-lib.ts` | 文件存在 `src/base.css`<br>正则 `@layer hx\.base` 命中 `src/base.css`<br>正则 `base\.css` 命中 `scripts/build-lib.ts` |
| P0-06 | 主题运行时 HxProvider | P0-03 | `src/provider/`<br>`src/constants/provider.ts` | 文件存在 `src/provider/HxProvider.tsx`<br>正则 `oklch` 命中 `src/provider/create-theme.ts`<br>正则 `getThemeScript` 命中 `src/provider/index.ts` |
| P0-07 | 国际化运行时 | P0-03 | `src/locale/`<br>`src/constants/locale.ts` | 文件存在 `src/locale/LocaleProvider.tsx`<br>正则 `pagination` 命中 `src/locale/en-US.ts`<br>正则 `pagination` 命中 `src/locale/zh-CN.ts` |
| P0-08 | 共享 hooks 层 | P0-03 | `src/hooks/`<br>`src/constants/hooks.ts` | 文件存在 `src/hooks/index.ts`<br>正则 `useControllableState` 命中 `src/hooks/index.ts`<br>正则 `useHotkeys` 命中 `src/hooks/index.ts` |
| P0-09 | 单元与无障碍测试底座 | P0-02 | `vitest.config.ts`<br>`tests/setup.ts`<br>`tests/components/`<br>`scripts/quality/runtime/` | 文件存在 `vitest.config.ts`<br>正则 `axe` 命中 `tests/setup.ts`<br>文件存在 `tests/components/button.test.tsx` |
| P0-10 | 按组件子路径导出与体积预算 | P0-02, P0-05 | `scripts/build-lib.ts`<br>`scripts/check-size.ts`<br>`scripts/constants/pack.ts`<br>`scripts/gates/baselines/size-budget.json` | 文件存在 `scripts/check-size.ts`<br>正则 `gzip` 命中 `scripts/check-size.ts`<br>文件存在 `scripts/gates/baselines/size-budget.json` |
| P0-11 | 版本与破坏性变更策略 | P0-03 | `CHANGELOG.md`<br>`docs/reference/versioning.md`<br>`src/primitives/deprecate.ts` | 文件存在 `CHANGELOG.md`<br>行数 60..400 `docs/reference/versioning.md`<br>正则 `console\.warn` 命中 `src/primitives/deprecate.ts` |
| P0-Z | 第零阶段集成 | P0-04, P0-05, P0-06, P0-07, P0-08, P0-09, P0-10, P0-11 | 全部共享入口 | 正则 `"\./base\.css"` 命中 `package.json`<br>正则 `HxProvider` 命中 `src/index.ts`<br>正则 `"version": "0\.6\.0"` 命中 `package.json` |

任务目标:

- **P0-01 审计文档归位与门禁对齐**: 删除误建的空文件 docs/audit, 把 docs/reference/ 下三份带日期前缀的 ui-library 产物迁到 docs/reference/audit/ 并改名为 ui-library-gap-analysis.md / ui-library-roadmap.md / ui-library-tasks.json, 修复 HC-DOCS (文档只放 tutorials/reference/architecture/decisions/archive) 与 HC-DOCNAME (日期前缀只在 decisions) 两条门禁, 旧路径留一行跳转说明或直接删除并改引用.
- **P0-02 依赖预审批**: 在 approvals.json 一次登记本路线图需要的新直接依赖与开发依赖 (@tanstack/react-table, @tanstack/react-virtual, @dnd-kit/core, @dnd-kit/sortable, zod, @hookform/resolvers, vitest, @testing-library/react, @testing-library/user-event, happy-dom, axe-core, @axe-core/playwright), 每项写用途, 体积, 替代方案, 是否 optional peer; 同步 inventory.md 的依赖推荐节.
- **P0-03 组件契约规范**: 写 docs/architecture/component-contract.md: 统一 prop 词汇 (size xs..xl, variant, tone, radius, density), 受控/非受控 (value/defaultValue/onValueChange), asChild 与 render prop, 插槽 classNames/styles (对标 antd v6 semantic classNames 与 Mantine Styles API), data-slot/data-state 属性, ref 透传, 事件命名, 禁用与只读, 废弃流程. 新组件必须引用本文.
- **P0-04 令牌三层化与尺寸密度档**: tokens.css 拆成 原始色板 (oklch 11 阶) -> 语义 -> 组件 三层; 新增 --control-h-xs..xl, --space-*, --radius-* 全档, --z-* 栈, --density 因子, 断点令牌; 亮暗两套都有值; TokensPage 同步展示. 不改任何组件默认外观.
- **P0-05 全局样式隔离与 cascade layer**: 把 tokens.css 里的 body/*/scrollbar/selection 等全局规则移入可选的 src/base.css, 全部样式包进 @layer hx.tokens / hx.base / hx.components, 让使用方的样式天然胜出; build-lib 拷贝新文件, exports 增加 ./base.css (由 P0-Z 接线).
- **P0-06 主题运行时 HxProvider**: src/provider/: HxProvider (mode light/dark/system, accent 种子色, radius, density, reducedMotion 覆盖, locale 透传), createTheme(seed) 用 oklch 生成整套语义变量, 支持嵌套作用域主题 (子树换肤), useTheme hook, SSR 无闪烁脚本 getThemeScript().
- **P0-07 国际化运行时**: src/locale/: LocaleProvider + useLocale, zh-CN 与 en-US 两套语言包覆盖所有内置文案 (日期, 分页, 组合框, 对话框关闭, 空态, 上传, 表格, 确认框), 日期与数字统一走 Intl; 现有组件的 labels prop 保留为最高优先级覆盖.
- **P0-08 共享 hooks 层**: src/hooks/: useControllableState, useMergeRefs, useDisclosure, useMediaQuery, useBreakpoint, useResizeObserver, useEventListener, useClickOutside, useHotkeys, useDebouncedValue, useLocalStorage, useClipboard, useIntersection, useReducedMotion; 每个一文件, 子目录按类别分组守 HC-DIR.
- **P0-09 单元与无障碍测试底座**: 接 vitest (happy-dom) + testing-library + axe-core: vitest.config.ts, tests/setup.ts, 首批 Button/Dialog/Select/Tabs/Checkbox 五个样例测试含 axe 断言; scripts/quality 的 frontend 层从 blocked 改为调用 vitest.
- **P0-10 按组件子路径导出与体积预算**: build-lib 保留模块结构, 生成 @hx/ui/<component> 子路径清单 (exports 由 P0-Z 接线); 新增 scripts/check-size.ts: 每个入口 gzip 体积预算, 超预算失败; 核对 'use client' 指令在产物中保留.
- **P0-11 版本与破坏性变更策略**: CHANGELOG.md (Keep a Changelog 格式, 回填 0.1 到 0.5), docs/reference/versioning.md (semver, 0.x 期间 minor 可破坏但必须有迁移段, 废弃至少保留一个 minor, dev 环境 deprecate() 警告, codemods/ 目录约定), src/primitives/deprecate.ts 工具函数.
- **P0-Z 第零阶段集成**: 唯一可改共享入口的任务: package.json (exports 子路径, base.css, 新依赖, test 脚本), src/index.ts 导出 provider/locale/hooks, gates 注册 check-size 与 vitest, API 快照与版本号更新到 0.6.0, README 三层说明改为六层.

### 第一阶段: 核心件补齐

| ID | 标题 | 依赖 | 写入范围 | 验收判据 |
|---|---|---|---|---|
| P1-01 | 表单引擎 | P0-Z | `src/form/`<br>`src/constants/form.ts`<br>`docs/src/pages/form/` | 文件存在 `src/form/index.ts`<br>正则 `FieldArray` 命中 `src/form/index.ts`<br>正则 `zodResolver` 命中 `src/form/use-zod-form.ts` |
| P1-02 | 输入族扩充 | P0-Z | `src/inputs/`<br>`src/constants/inputs.ts`<br>`docs/src/pages/inputs/` | 文件存在 `src/inputs/NumberInput.tsx`<br>文件存在 `src/inputs/PasswordInput.tsx`<br>正则 `Intl\.NumberFormat` 命中 `src/inputs/NumberInput.tsx` |
| P1-03 | 选择族扩充 | P0-Z | `src/select/`<br>`src/constants/select.ts`<br>`docs/src/pages/select/` | 文件存在 `src/select/MultiSelect.tsx`<br>文件存在 `src/select/Cascader.tsx`<br>文件存在 `src/select/Transfer.tsx` |
| P1-04 | 日期时间族 | P0-Z | `src/dates/`<br>`src/constants/dates.ts`<br>`docs/src/pages/dates/` | 文件存在 `src/dates/DateRangePicker.tsx`<br>正则 `presets` 命中 `src/dates/DateRangePicker.tsx`<br>文件存在 `src/dates/DateTimePicker.tsx` |
| P1-05 | 上传 | P0-Z | `src/upload/`<br>`src/constants/upload.ts`<br>`docs/src/pages/upload/` | 文件存在 `src/upload/Upload.tsx`<br>正则 `retry` 命中 `src/upload/Upload.tsx` |
| P1-06 | 颜色选择器 | P0-Z | `src/color/`<br>`src/constants/color.ts`<br>`docs/src/pages/color/` | 文件存在 `src/color/ColorPicker.tsx`<br>正则 `oklch` 命中 `src/color/convert.ts` |
| P1-07 | 数据网格 DataGrid | P0-Z | `src/data-grid/`<br>`src/constants/data-grid.ts`<br>`docs/src/pages/data-grid/` | 文件存在 `src/data-grid/DataGrid.tsx`<br>正则 `useReactTable` 命中 `src/data-grid/DataGrid.tsx`<br>正则 `getSortedRowModel` 命中 `src/data-grid/` |
| P1-08 | 虚拟化 | P0-Z | `src/virtual/`<br>`src/constants/virtual.ts`<br>`docs/src/pages/virtual/` | 文件存在 `src/virtual/VirtualList.tsx`<br>正则 `useVirtualizer` 命中 `src/virtual/VirtualList.tsx` |
| P1-09 | 树 | P0-Z | `src/tree/`<br>`src/constants/tree.ts`<br>`docs/src/pages/tree/` | 文件存在 `src/tree/Tree.tsx`<br>正则 `role=\{?"tree"` 命中 `src/tree/Tree.tsx` |
| P1-10 | 展示族 | P0-Z | `src/display/`<br>`src/constants/display.ts`<br>`docs/src/pages/display/` | 文件存在 `src/display/Descriptions.tsx`<br>文件存在 `src/display/Image.tsx`<br>文件存在 `src/display/Tag.tsx` |
| P1-11 | 通知系统 | P0-Z | `src/notify/`<br>`src/constants/notify.ts`<br>`docs/src/pages/notify/` | 文件存在 `src/notify/notify.ts`<br>正则 `promise` 命中 `src/notify/notify.ts`<br>正则 `aria-live` 命中 `src/notify/` |
| P1-12 | 浮层管理与引导 | P0-Z | `src/overlay/`<br>`src/constants/overlay.ts`<br>`docs/src/pages/overlay/` | 文件存在 `src/overlay/Popconfirm.tsx`<br>文件存在 `src/overlay/Tour.tsx`<br>正则 `focus` 命中 `src/overlay/modal-stack.ts` |
| P1-13 | 导航族扩充 | P0-Z | `src/nav/`<br>`src/constants/nav.ts`<br>`docs/src/pages/nav/` | 文件存在 `src/nav/Menu.tsx`<br>文件存在 `src/nav/Anchor.tsx` |
| P1-14 | 应用外壳与响应式 | P0-Z | `src/shell/`<br>`src/constants/shell.ts`<br>`docs/src/pages/shell/` | 文件存在 `src/shell/AppShell.tsx`<br>正则 `breakpoint` 命中 `src/shell/responsive.ts` |
| P1-15 | 排版与文本工具 | P0-Z | `src/text/`<br>`src/constants/text.ts`<br>`docs/src/pages/text/` | 文件存在 `src/text/Ellipsis.tsx`<br>文件存在 `src/text/Highlight.tsx` |
| P1-16 | 无障碍门禁 | P0-Z | `scripts/e2e/a11y.ts`<br>`scripts/constants/a11y.ts` | 文件存在 `scripts/e2e/a11y.ts`<br>正则 `AxeBuilder` 命中 `scripts/e2e/a11y.ts` |
| P1-Z | 第一阶段集成 | P1-01, P1-02, P1-03, P1-04, P1-05, P1-06, P1-07, P1-08, P1-09, P1-10, P1-11, P1-12, P1-13, P1-14, P1-15, P1-16 | 全部共享入口 | 正则 `DataGrid` 命中 `src/index.ts`<br>正则 `data-grid ~` 命中 `docs/src/nav.ts`<br>正则 `"version": "0\.7\.0"` 命中 `package.json` |

任务目标:

- **P1-01 表单引擎**: src/form/: 基于 react-hook-form + zod 的 Form, FormField 自动接 aria-describedby/aria-invalid, FieldArray, 异步校验与防抖, 提交态与错误汇总, useZodForm; 与现有 primitives/form.tsx 兼容并在其顶部指向新实现.
- **P1-02 输入族扩充**: src/inputs/: NumberInput (步进, 精度, 千分位, Intl, 滚轮可关), PasswordInput (可见切换, 强度条), SearchInput (防抖, 清空), PinInput 复用 input-otp, Mentions.
- **P1-03 选择族扩充**: src/select/: MultiSelect (标签折叠, 全选, 创建项), Autocomplete, TreeSelect (单选/多选/级联勾选), Cascader (懒加载, 搜索), Transfer (双栏穿梭, 搜索, 全选).
- **P1-04 日期时间族**: src/dates/: DateRangePicker (预设区间, 双月面板), DateTimePicker, MonthPicker, YearPicker, 时区感知格式化 (Intl.DateTimeFormat timeZone), 文案与周起始日来自 LocaleProvider.
- **P1-05 上传**: src/upload/: Upload 队列 (进度, 取消, 重试, 并发上限), 自定义 request 适配器, 图片卡片墙与预览, 粘贴上传; 内部复用 widgets/FileDropzone 的校验.
- **P1-06 颜色选择器**: src/color/: ColorPicker (色相/饱和/透明度面板, hex/rgb/hsl/oklch 输入, 预设色, EyeDropper API 可用时显示吸管), ColorInput. 组件 tsx 内零色值, 色值计算放纯 ts.
- **P1-07 数据网格 DataGrid**: src/data-grid/: 基于 @tanstack/react-table 的 DataGrid: 排序, 筛选, 列显隐, 列固定, 列宽拖拽, 行选择, 行展开, 分组表头, 受控与服务端模式, 接 Pagination 与 EmptyState; 现有 DataTable 保留为轻量版.
- **P1-08 虚拟化**: src/virtual/: VirtualList, VirtualGrid (基于 @tanstack/react-virtual), 动态行高, 粘性分组头, 滚动到索引 API; Select/Combobox 的选项超过阈值时可开启虚拟滚动 (仅提供 hook, 接入由 P2-01).
- **P1-09 树**: src/tree/: Tree (单选, 多选勾选级联, 半选, 异步加载, 搜索高亮, 键盘导航符合 APG treeview, 拖拽排序钩子), 与 layout/TreeNav 共享 flattenTree.
- **P1-10 展示族**: src/display/: Descriptions (键值描述列表, 响应式列), Tag/Chip (可关闭, 可选), Image (懒加载, 失败兜底, 灯箱预览组), Statistic/Countdown, QRCode, Watermark.
- **P1-11 通知系统**: src/notify/: 命令式 notify()/toast.promise()/message(), 六个位置, 最大堆叠数, 操作按钮, 可暂停计时, 滑动关闭, 读屏 live region; 现有 Toaster 改为其上的一层外观.
- **P1-12 浮层管理与引导**: src/overlay/: 模态栈管理器 (焦点归还, 层级, Esc 只关最顶层), 命令式 openModal(), Popconfirm, Tour 步骤式引导 (高亮遮罩, 键盘), Spotlight 搜索面板 (复用 command).
- **P1-13 导航族扩充**: src/nav/: Menu (垂直/水平, 可折叠成图标, 子菜单), Anchor (滚动联动), BackTop, Affix, Tabs 溢出滚动与更多菜单, Steps 可点击与竖排.
- **P1-14 应用外壳与响应式**: src/shell/: AppShell (header/navbar/aside/footer, 断点下自动收起成抽屉, 尺寸来自令牌), 响应式 prop 工具 (base/sm/md/lg), Show/Hide 断点组件; 与 AppFrame 并存.
- **P1-15 排版与文本工具**: src/text/: Text, Title, Highlight (关键词高亮), Ellipsis (多行截断 + 溢出才显示 Tooltip), CopyButton, NumberFormatter, RelativeTime.
- **P1-16 无障碍门禁**: scripts/e2e/a11y.ts: 用 @axe-core/playwright 逐页扫描文档站 (亮暗两套), 产出 JSON 报告, 严重级 serious/critical 失败; 每个组件页增加键盘交互说明表 (由各组件任务填写, 本任务只建检查).
- **P1-Z 第一阶段集成**: 接线 P1 全部新目录: src/index.ts 与子路径 exports, docs nav/App/navIcons 新页面, gates 注册 a11y, API 快照与版本 0.7.0, README 组件清单.

### 第二阶段: 高级与 Pro 层

| ID | 标题 | 依赖 | 写入范围 | 验收判据 |
|---|---|---|---|---|
| P2-01 | 网格虚拟化与可编辑单元格 | P1-Z | `src/data-grid/` | 正则 `useVirtualizer` 命中 `src/data-grid/`<br>文件存在 `src/data-grid/editable-cell.tsx`<br>正则 `toCsv` 命中 `src/data-grid/` |
| P2-02 | 图表扩充与图表无障碍 | P1-Z | `src/charts/ext/`<br>`src/constants/charts-ext.ts`<br>`docs/src/pages/charts-ext/` | 文件存在 `src/charts/ext/Heatmap.tsx`<br>文件存在 `src/charts/ext/Sparkline.tsx`<br>正则 `DataTableView\|asTable` 命中 `src/charts/ext/` |
| P2-03 | 日程视图 | P1-Z | `src/schedule/`<br>`src/constants/schedule.ts`<br>`docs/src/pages/schedule/` | 文件存在 `src/schedule/WeekView.tsx`<br>文件存在 `src/schedule/MonthView.tsx` |
| P2-04 | 拖拽排序与看板 | P1-Z | `src/sortable/`<br>`src/constants/sortable.ts`<br>`docs/src/pages/sortable/` | 文件存在 `src/sortable/Kanban.tsx`<br>正则 `KeyboardSensor` 命中 `src/sortable/` |
| P2-05 | Pro 层: ProTable / ProForm | P1-Z | `src/pro/`<br>`src/constants/pro.ts`<br>`docs/src/pages/pro/` | 文件存在 `src/pro/ProTable.tsx`<br>文件存在 `src/pro/ProForm.tsx`<br>正则 `request` 命中 `src/pro/ProTable.tsx` |
| P2-06 | 动效第二阶段 | P1-Z | `src/motion/ext/`<br>`src/constants/motion-ext.ts` | 文件存在 `src/motion/ext/index.ts`<br>正则 `startViewTransition` 命中 `src/motion/ext/` |
| P2-07 | 主题编辑器页 | P1-Z | `docs/src/pages/theme-builder/` | 文件存在 `docs/src/pages/theme-builder/ThemeBuilderPage.tsx`<br>正则 `createTheme` 命中 `docs/src/pages/theme-builder/` |
| P2-08 | 设计令牌导出 | P1-Z | `scripts/tokens/`<br>`scripts/constants/tokens.ts` | 文件存在 `scripts/tokens/export.ts`<br>正则 `\$value` 命中 `scripts/tokens/export.ts` |
| P2-09 | 富文本编辑器 (可选 peer) | P1-Z | `src/rich-text/`<br>`src/constants/rich-text.ts`<br>`docs/src/pages/rich-text/` | 文件存在 `src/rich-text/RichTextEditor.tsx`<br>正则 `useEditor` 命中 `src/rich-text/RichTextEditor.tsx` |
| P2-Z | 第二阶段集成 | P2-01, P2-02, P2-03, P2-04, P2-05, P2-06, P2-07, P2-08, P2-09 | 全部共享入口<br>`scripts/check-weight.mjs` | 正则 `ProTable` 命中 `src/index.ts`<br>正则 `tiptap` 命中 `scripts/check-weight.mjs`<br>正则 `"version": "0\.8\.0"` 命中 `package.json` |

任务目标:

- **P2-01 网格虚拟化与可编辑单元格**: DataGrid 接 VirtualList: 十万行流畅滚动, 单元格编辑 (文本/数字/选择/日期, 校验, Tab 跳格), 复制粘贴区域, 导出 CSV.
- **P2-02 图表扩充与图表无障碍**: src/charts/ext/: Scatter, Funnel, Treemap, Heatmap, Gauge, Sparkline, 组合图; 图例点选显隐, 十字准线, 每张图可切换为数据表视图 (读屏与导出).
- **P2-03 日程视图**: src/schedule/: DayView, WeekView, MonthView, AgendaView, 拖拽移动与拉伸事件, 当前时间线, 资源分组; 时区与周起始日来自 LocaleProvider.
- **P2-04 拖拽排序与看板**: src/sortable/: 基于 @dnd-kit 的 SortableList, SortableGrid, Kanban (列间移动, 键盘拖拽, 读屏播报); layout/DragDrop 保留.
- **P2-05 Pro 层: ProTable / ProForm**: src/pro/: ProTable (查询表单 + DataGrid + 工具栏 + 请求适配 request(params) -> {data,total}), ProForm (schema 驱动, 分步表单, 弹窗表单, 依赖联动), PageContainer, 整页 CRUD 模板.
- **P2-06 动效第二阶段**: src/motion/ext/: 浮层从触发点放大 (transform-origin 跟随 radix 变量), 抽屉与通知滑动关闭手势, View Transitions API 页面转场封装, 共享元素过渡 layoutId 工具; 全部尊重减弱动效.
- **P2-07 主题编辑器页**: docs/src/pages/theme-builder/: 种子色, 圆角, 密度, 字体实时预览全站组件, 导出 CSS 变量与 HxProvider 配置, 支持分享 URL.
- **P2-08 设计令牌导出**: scripts/tokens/: 从 tokens.css 生成 W3C DTCG 格式 tokens.json 与 TS 常量 (dist/tokens.json, dist/tokens.d.ts), 供 Figma 插件与非 React 项目使用; 门禁核对两边一致.
- **P2-09 富文本编辑器 (可选 peer)**: src/rich-text/: 基于 tiptap 的 RichTextEditor 作为可选 peer, 工具栏, 提及, 斜杠命令, Markdown 往返; check-weight 守住不进默认安装图.
- **P2-Z 第二阶段集成**: 接线 P2 新目录与页面, tiptap/dnd-kit 依赖登记 (dnd-kit 为直接依赖, tiptap 为 optional peer 并加入 check-weight 的 HEAVY 清单), 版本 0.8.0.

### 第三阶段: 文档, 测试与 1.0

| ID | 标题 | 依赖 | 写入范围 | 验收判据 |
|---|---|---|---|---|
| P3-01 | Props 表自动生成 | P2-Z | `scripts/docs/`<br>`docs/src/components/props-table/` | 文件存在 `scripts/docs/gen-props.ts`<br>正则 `createProgram` 命中 `scripts/docs/gen-props.ts` |
| P3-02 | 在线 Playground | P2-Z | `docs/src/playground/` | 文件存在 `docs/src/playground/Playground.tsx`<br>正则 `stackblitz` 命中 `docs/src/playground/` |
| P3-03 | 像素级视觉回归 | P2-Z | `scripts/e2e/visual.ts`<br>`scripts/constants/visual.ts` | 文件存在 `scripts/e2e/visual.ts`<br>正则 `toHaveScreenshot\|screenshot` 命中 `scripts/e2e/visual.ts` |
| P3-04 | 组件交互测试铺满 | P2-Z | `tests/components/`<br>`scripts/check-test-coverage.ts` | 文件存在 `scripts/check-test-coverage.ts`<br>文件存在 `tests/components/data-grid.test.tsx`<br>文件存在 `tests/components/date-range-picker.test.tsx` |
| P3-05 | RTL 与密度全量扫查 | P2-Z | `src/primitives/`<br>`src/layout/`<br>`scripts/quality/checks/ui.ts` | 正则 `PROJECT-UI-LOGICAL` 命中 `scripts/quality/checks/ui.ts` |
| P3-06 | 面向 Agent 的文档出口 | P3-01 | `docs/public/llms.txt`<br>`docs/public/registry.json`<br>`scripts/docs/gen-llms.ts` | 文件存在 `docs/public/llms.txt`<br>正则 `registry:ui` 命中 `docs/public/registry.json` |
| P3-07 | 性能基准 | P2-Z | `scripts/perf/`<br>`scripts/constants/perf.ts` | 文件存在 `scripts/perf/run.ts`<br>正则 `performance\.now` 命中 `scripts/perf/run.ts` |
| P3-08 | codemods 与迁移指南 | P2-Z | `codemods/`<br>`docs/reference/migration/` | 文件存在 `codemods/README.md`<br>文件存在 `docs/reference/migration/0-6.md` |
| P3-Z | 第三阶段集成与 1.0 准备 | P3-01, P3-02, P3-03, P3-04, P3-05, P3-06, P3-07, P3-08 | 全部共享入口 | 正则 `"version": "1\.0\.0-rc\.0"` 命中 `package.json`<br>正则 `visual` 命中 `scripts/gates/registry.mjs` |

任务目标:

- **P3-01 Props 表自动生成**: scripts/docs/gen-props.ts 用 TypeScript compiler API 从导出类型生成每个组件的 props JSON (名称, 类型, 默认值, JSDoc), 文档站 PropsTable 组件读取它; 手写 DocPropRow 逐步退役.
- **P3-02 在线 Playground**: docs/src/playground/: 每个示例可编辑并实时渲染 (浏览器端 esbuild-wasm 或 sucrase 转译), 一键在 StackBlitz 打开, 主题与语言切换同步到示例.
- **P3-03 像素级视觉回归**: scripts/e2e/visual.ts: Playwright toHaveScreenshot 逐页逐主题截图, 固定字体与视口, 允许阈值, 基线存在孤儿分支或 LFS 而非 PR 分支; 与现有计算样式基线并存.
- **P3-04 组件交互测试铺满**: tests/components/: 每个公共组件至少一个测试文件, 覆盖键盘交互, 受控/非受控, axe 无违规; 新增 scripts/check-test-coverage.ts 对账导出与测试文件.
- **P3-05 RTL 与密度全量扫查**: 把 src 内的 ml/mr/pl/pr/left/right 改成逻辑属性, 在 dir=rtl 与 density=compact 下跑一遍冒烟与 a11y; 新增 PROJECT-UI-LOGICAL 规则防回退.
- **P3-06 面向 Agent 的文档出口**: 生成 docs/public/llms.txt 与 llms-full.txt (组件清单, 组合结构, props 摘要, 示例), 以及 shadcn 兼容的 registry.json, 让 AI 编码工具按本库正确出码.
- **P3-07 性能基准**: 解开 test:perf: 渲染一千行 DataGrid, 五百选项 Select, 百节点蓝图的首渲与交互耗时基准, 结果写报告并与基线比较, 退化超过阈值失败.
- **P3-08 codemods 与迁移指南**: codemods/ 下为 0.x 期间的每个破坏性变更提供 ts 脚本 (用 TypeScript compiler API, 不引新依赖), docs/reference/migration/ 每个 minor 一篇.
- **P3-Z 第三阶段集成与 1.0 准备**: gates 注册 visual/perf/test-coverage, 文档站接 PropsTable 与 Playground, README 重写为 1.0 结构, 版本 1.0.0-rc.0, 宣布 API 冻结规则.

## 六. 每个任务的通用完成定义

1. 判据全部满足 (三类判据可由脚本逐条核对, 见第八节).
2. `npm run build` 与 `npm run quality:done` 无新增 Error; baseline 不新增条目.
3. 新组件遵守 `docs/architecture/component-contract.md` (P0-03 产出): 统一 size / variant / tone 词汇, 受控与非受控, classNames 插槽, data-slot 与 data-state.
4. 有文档页源码 (由集成任务接入 nav), 页内含示例, 键盘交互表, 无障碍说明.
5. P0-09 之后的任务: tests/components/ 下有对应测试 (P3-04 负责补齐存量).
6. 一篇 agent note, `## Code` 逐行列路径, `## Alternatives considered` 含 "什么都不做 / 复用现有".

## 七. 执行编排建议

- 每个任务交给一个独立执行者 (人或 Agent), 在独立分支上工作, 只改自己的写入范围; 越界改动由 review 退回.
- 阶段内任务完成后由集成任务一次性接线, 集成任务负责解决命名冲突, 更新 API 快照与版本号, 跑 `npm run verify` 与 `npm run gates:all`.
- 阶段切换的闸门: 上一阶段集成任务合并后, 下一阶段才开始 (下一阶段依赖新导出与新令牌).
- 若某任务阻塞 (依赖未批准, 门禁冲突), 执行者在任务表里标记 blocked 与原因, 不得以放宽门禁或改 baseline 的方式绕过.
- 执行者连续两次自检失败时停止并报告现状, 由维护者裁决.

## 八. 判据核对方法

`docs/reference/audit/ui-library-tasks.json` 的每条判据结构:

```json
{ "type": "file_exists", "path": "src/form/index.ts" }
{ "type": "line_range", "path": "src/tokens.css", "min": 700, "max": 1500 }
{ "type": "regex", "path": "src/data-grid/", "pattern": "getSortedRowModel" }
```

- file_exists: 路径存在即通过.
- line_range: 文件物理行数落在 [min, max].
- regex: path 是文件时对其内容匹配; path 以 / 结尾时对目录下任一文件匹配 (递归).
- 核对脚本可在 P0-Z 之后作为 `scripts/check-roadmap.ts` 加入 gates (可选, 不在本表中).

## 九. 风险与对策

| 风险 | 对策 |
|---|---|
| 任务并行改同一文件 | 共享入口只归集成任务; 写入范围已校验不相交 |
| 新依赖未批准导致阻塞 | P0-02 一次性预审批全部依赖 |
| 行数与目录文件数门禁导致大组件难写 | 契约要求按部件拆文件, 子目录分组 |
| 默认外观被改动 | P0-04 只新增令牌与档位; 视觉类名沿用上游 |
| 主题与国际化 Provider 引入破坏性变化 | 无 Provider 时全部组件保持现状 (默认值即当前行为) |
| 体积膨胀 | P0-10 每入口预算; 重依赖只做可选 peer (check-weight) |
| 审计文档命名违反 HC-DOCNAME, 误建空文件 docs/audit | P0-01 已删除空文件, 迁到 docs/reference/audit/ 并去日期前缀; 任务表 .json 扩展名冲突见差距分析 "八附" |

## 十. 引用来源

- https://ui.shadcn.com/docs/changelog
- https://mui.com/material-ui/getting-started/versions/
- https://mantine.dev/changelog/9-0-0/
- https://ant.design/docs/react/migration-v6/
- https://procomponents.ant.design
- https://tanstack.com/table/latest
- https://tanstack.com/virtual/latest
- https://react-hook-form.com
- https://zod.dev
- https://www.designtokens.org/tr/drafts/format/
- https://github.com/dequelabs/axe-core
- https://playwright.dev/docs/test-snapshots
- https://github.com/ai/size-limit
- https://github.com/changesets/changesets
- https://www.w3.org/WAI/ARIA/apg/
