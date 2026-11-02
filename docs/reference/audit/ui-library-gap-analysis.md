# HX-UI 与成熟 UI 库的差距分析 (2026-11)

基准: 2026-11-02 读取的工作区 (package.json version 0.5.0). 本文只做调研, 对比与结论, 不改 src. 分阶段路线图与任务拆解见 `docs/reference/audit/ui-library-roadmap.md`, 机器可读任务表见 `docs/reference/audit/ui-library-tasks.json`.

## 一. 结论先行

1. HX-UI 的 "广度" 已经达到 shadcn/ui 一级 (约 70 个 primitives 对标 shadcn 全集, 外加 agent / chat / blueprint / editor / hxbrowser 等领域件), 工程门禁 (设计规约, API 快照, 版本联动, 冒烟, 注册表对账, 负向探针) 比绝大多数开源库都严. 真正的短板不在 "工程纪律", 而在 "体系":
   - 没有运行时主题层: 只有 `data-mode` 亮暗两套 CSS 变量, 没有 Provider, 没有种子色生成, 没有密度与尺寸档, 没有子树换肤 (对标 Mantine `MantineProvider`, antd `ConfigProvider`, Chakra `createSystem`).
   - 没有国际化层: 文案靠每个组件各自的 `labels` prop 传入, 没有 LocaleProvider 与语言包 (对标 antd / Arco / Element Plus / Naive UI 的 locale 体系).
   - 没有 "重型业务件": 数据网格只有轻量 DataTable (只做过滤, 无排序 / 列固定 / 选择 / 虚拟化), 没有 Tree, Cascader, TreeSelect, Transfer, Upload 队列, ColorPicker, NumberInput, DateRangePicker 预设, 日程视图, ProTable / ProForm (对标 antd + ProComponents, MUI X, Mantine 9).
   - 没有组件级测试: `test:frontend` 处于 blocked, 无单元测试运行器, 无 axe 无障碍扫描, 视觉基线只覆盖一份夹具的计算样式 (对标 Radix / React Aria / Primer / Carbon 的测试矩阵).
   - 打包是单入口: 只有 `.` 一个 JS 入口, 没有按组件子路径导出与体积预算 (对标 MUI / Mantine / antd 的按需与 size-limit).
   - 文档站无 props 自动表, 无可编辑 playground, 无主题编辑器, 无面向 AI 的 llms.txt / registry (对标 shadcn registry + MCP, Mantine / Chakra 主题生成器).
2. 融合策略: 不换栈 (React 19 + radix-ui + Tailwind v4 + cva 保持不变), 把成熟库的优点按 "层" 吸收, 形成六层结构: L0 令牌 / L1 行为与 hooks / L2 样式化基础件 / L3 复合件 / L4 Pro 业务层 / L5 领域件. 每层可以单独取用, 与现有 README 的 "三层可单取" 理念一致.
3. 不抄的东西: 运行时 CSS-in-JS (MUI emotion, 旧 antd cssinjs, Chakra v2), 第二套样式引擎, Vue 生态的实现 (Element Plus / Naive UI / Vuetify / Arco Vue 只取 API 与交互设计), DaisyUI 的纯类名组件方式 (与 cva 重复).
4. 路线: P0 基础设施 (12 项) -> P1 核心件补齐 (17 项) -> P2 高级与 Pro 层 (10 项) -> P3 文档测试与 1.0 (9 项), 共 48 项任务, 每个阶段内除集成任务外写入范围互不相交, 可全部并行.

## 二. 方法与范围

- 现状取证: 通过映射工作区读取 `AGENTS.md`, `README.md`, `CONTRIBUTING.md`, `package.json`, `docs/reference/quality/rules.md`, `docs/reference/ui-enrichment-plan.md`, `docs/code-quality-landscape.md`, `src/index.ts`, `src/tokens.css`, `src/styles.css`, `docs/src/nav.ts`, `scripts/` 下各门禁脚本的头部注释, 以及 `src/` 各子目录清单.
- 横向调研: 以各库官方文档, 官方 changelog 与官方博客为准, 版本信息核对到 2026-10 的公开发布. 引用见第九节.
- 判定口径: "有" 指库内有公开导出的实现并在文档站有页面; "部分" 指有实现但缺少成熟库的关键能力; "无" 指检索不到.

## 三. HX-UI 现状速写

| 项 | 现状 |
|---|---|
| 技术栈 | React 19, TypeScript 5.9, radix-ui 统一包, Tailwind v4 (`@theme inline` 桥接, 可选 peer), cva + tailwind-merge, motion 12, recharts 3, react-day-picker 9, react-hook-form 7, cmdk, vaul, embla, input-otp |
| 分层 | tokens.css (零依赖, 约 308 个变量, 609 行) / styles.css (Tailwind 桥接) / 组件 |
| 组件目录 | primitives (约 70 文件, shadcn 对标), layout (31), box, motion, effects, widgets, charts, chat, agent, editor (Monaco, 可选 peer), blueprint (xyflow, 可选 peer), hxbrowser |
| 文档站 | Vite + hash 路由, `nav.ts` 99 个条目, 50 个页面目录项, 有 Cmd+K 搜索, 页内目录, 主题三态, 上一页 / 下一页, 4 个整页模板 |
| 主题 | `:root, [data-mode="dark"]` 默认暗色, `[data-mode="light"]` 亮色, `@custom-variant dark`; 无 Provider, 无种子色, 无密度 |
| 国际化 | `DatePickerLabels`, `PaginationLabels` 等逐组件 labels prop, `DirectionProvider` 提供 RTL 方向; 无语言包 |
| 表单 | primitives/form.tsx 包 react-hook-form, field.tsx 对标 shadcn Field; docs 依赖 zod 4 与 @hookform/resolvers, 库本身未内置 schema 层 |
| 表格 | layout/DataTable: 粘性表头, 空态, 骨架, 行点击, useTableSearch 过滤; 无排序, 列固定, 列宽, 选择, 展开, 虚拟化 |
| 日期 | Calendar, DatePicker, TimePicker; 无区间预设, 无日期时间, 无月 / 年选择, 无时区 |
| 图表 | Recharts 3 之上 6 种图 + ChartFrame, 增量动画 matchAppend 是亮点; 无散点 / 热力 / 漏斗 / 仪表 / 迷你图, 无图表无障碍兜底 |
| 动效 | motion 引擎 (Reveal, Stagger, AnimatedNumber, PageTransition), FLIP 工具, 全部尊重减弱动效, check-motion 契约 |
| 质量门禁 | scripts/gates 注册表 + scripts/quality 规则 (PROJECT-UI-*, HC-*), API 快照与版本联动, 冒烟, shell 行为检查, 计算样式视觉基线, 依赖重量门禁, agent notes 双链 |
| 测试 | 无 vitest / jest, `test:frontend` 与 `test:perf` blocked; scripts/tests 只有 hxbrowser 与 pr-gif |
| 打包 | tsc 产物 + 相对说明符补扩展名, 单 JS 入口 `.`, `sideEffects: ["*.css"]`, 6 个 CSS 入口, GitHub Release tarball 分发 |
| 版本 | 0.5.0, 有 API 快照联动版本号; 无 CHANGELOG, 无废弃策略文档, 无 codemods |

亮点 (成熟库也少见, 必须保留): 设计规约变成退出码; 公共 API 快照与版本号强绑定; 注册表四方对账防 "占位页"; 负向探针证明门禁会红; 图表增量动画; 蓝图的单一判据 canConnect; agent / chat 领域件 (shadcn 2026-06 才推出聊天组件).

## 四. 横向调研: 各库定位与可借鉴点

### 4.1 Headless / 行为层

- **Radix Primitives**: 无样式, 每个组件拆成 Root / Trigger / Content 等部件, `asChild` 组合, 完整 WAI-ARIA 键盘模型, 受控与非受控双模式, `data-state` 暴露状态给 CSS. 借鉴: 部件化 API, data-state 驱动样式 (HX-UI 已采用).
- **Base UI**: MUI 与 Radix 原班人马的 headless 库, 2026-07 起成为 shadcn/ui 新项目的默认底座 (Radix 继续支持). 借鉴: render prop 替代 asChild 的组合方式, 更完整的 Combobox / NumberField / Field 族.
- **React Aria (Adobe)**: hooks + 组件两级, 国际化与无障碍最完整 (日期, 数字, 拖拽, 虚拟化集合均内建 i18n), 2026-07 起也是 shadcn 可选底座. 借鉴: 国际化日期与数字的处理方式, collection 抽象.
- **Headless UI (Tailwind Labs)**: 组件少而精 (Menu, Listbox, Combobox, Dialog, Popover, Tabs, Disclosure, Switch), 与 Tailwind 深度配合, `data-*` 状态属性. 借鉴: 少量高质量组件的 API 极简度.
- **Ark UI + Zag.js**: 状态机驱动的 headless 组件, 同一份机器跨 React / Vue / Solid / Svelte, 覆盖 ColorPicker, DatePicker, TreeView, NumberInput, PinInput, Splitter, Tour 等 Radix 缺失件. Chakra v3 与 Park UI 都建在它上面. 借鉴: 用状态机写复杂件 (日期, 颜色, 树), 可测性好.

### 4.2 复制粘贴 / 样式化层

- **shadcn/ui**: 代码分发而不是包分发, CLI v4 (2026-03) 带 skills, presets, dry run; registry 体系 (命名空间, 私有 registry, GitHub registry, MCP server, 动态搜索); 每个组件文档有 Composition 结构树方便 AI 正确组合. 借鉴: registry.json 与 llms 友好文档, 主题 preset, 组合结构说明.
- **Park UI**: Ark UI + Panda CSS / Tailwind 的样式层, 提供多套预设. 借鉴: 在 headless 之上提供可切换的 "风格包".
- **DaisyUI**: 纯 Tailwind 插件, 语义类名 (`btn`, `card`), 30+ 主题靠 CSS 变量切换. 借鉴: 多主题切换与主题生成器; 不借鉴: 纯类名组件 (与 cva 重复).
- **Tailwind v4 / cva / tailwind-variants**: v4 的 `@theme` 让令牌直接生成工具类, CSS 优先配置; cva 负责变体, tailwind-variants 额外支持 slots 与响应式变体. 借鉴: 多插槽变体 (slots), compoundVariants 规范化.

### 4.3 全家桶 / 设计系统层

- **MUI (Material UI)**: v9 于 2026-04 发布并与 MUI X 主版本对齐; 主题对象 + CSS 变量模式, `sx`, slots / slotProps 统一覆盖内部结构; MUI X 提供 Data Grid (虚拟化, 编辑, 分组, 透视), Date Pickers, Charts, Tree View. 借鉴: slots / slotProps 约定, 版本对齐与 LTS 策略 (v7 列为长期支持), Data Grid 的能力分级.
- **Chakra UI v3**: 建在 Ark UI 之上, `createSystem` 定义 tokens / semanticTokens / recipes / slotRecipes, 样式 props. 借鉴: recipe 与 slotRecipe 的分离, 语义令牌两级引用.
- **Mantine**: 9.0 于 2026-03 发布, 100+ 组件加 50+ hooks, Styles API (classNames / styles 按内部部件覆盖), @mantine/form, @mantine/dates, 9.x 新增 TreeSelect, Schedule (日 / 周 / 月 / 议程视图), ComboboxPopover, 响应式 Pagination. 借鉴: hooks 包, Styles API, 表单包, 日程视图.
- **Ant Design**: v6 于 2025-11 发布, 默认纯 CSS 变量模式, zeroRuntime 零运行时样式, 全组件语义化结构 classNames / styles, 逻辑方位 API (start / end) 支持 RTL; 每周 patch, 每月 minor 的固定节奏; 组件最全 (Cascader, Transfer, TreeSelect, Upload, ColorPicker, Tour, Watermark, QRCode, Splitter). 借鉴: 语义化结构, 组件广度, ConfigProvider 全局配置, 固定发布节奏.
- **Ant Design Pro / ProComponents**: 在 antd 之上的业务层: ProTable (查询表单 + 表格 + 工具栏 + request 适配), ProForm (分步, 弹窗, 抽屉, 依赖联动), ProLayout, PageContainer. 借鉴: 把 "后台 CRUD" 做成一个组件的思路.
- **Arco Design (字节)**: React 与 Vue 双实现, 设计令牌平台与主题商店, 组件与 antd 规模接近. 借鉴: 主题商店 / 在线主题配置.
- **Naive UI**: Vue 3, TypeScript 全量, 主题可在运行时用 JS 对象覆盖, 内置虚拟列表与虚拟化 Select / Tree / Table. 借鉴: 默认把虚拟化放进大数据量组件.
- **Element Plus**: Vue 3, 中后台最常用之一, 虚拟化 Table-V2 与 Tree-V2, 完整的 i18n 语言包. 借鉴: 虚拟化表格与树作为独立组件.
- **Vuetify**: Material 风格 Vue 库, 全局默认值 (defaults provider) 可按组件统一配置 props, 密度 (density) 作为一级 prop. 借鉴: defaults provider 与 density 档.
- **Fluent UI React v9 (微软)**: Griffel 原子化 CSS-in-JS, 设计令牌分 global / alias 两级, 插槽 (slots) API, 高对比度主题. 借鉴: slots 约定, 高对比度模式.
- **Carbon (IBM)**: 四套主题 (white, g10, g90, g100), 令牌分层, 严格的无障碍与 i18n 规范, 数据表格与数据可视化 (Carbon Charts). 借鉴: 多主题层级与文档里的使用 / 无障碍 / 样式三栏结构.
- **Primer (GitHub)**: Primer React + primitives 令牌, 每个组件有无障碍评审状态与成熟度标签 (alpha / beta / stable / deprecated), 视觉回归与无障碍自动化测试. 借鉴: 组件成熟度标签与发布状态公示.

### 4.4 专项库

- **TanStack Table**: headless 表格引擎, 排序, 过滤, 分组, 聚合, 列固定, 列宽, 行选择, 展开, 分页, 服务端模式全部是插件化 row model. **TanStack Virtual**: headless 虚拟化, 动态尺寸, 横纵双向. 借鉴: DataGrid 直接建在两者之上, 不自研引擎.
- **react-hook-form + zod**: 非受控性能, resolver 接 zod schema, 类型从 schema 推导. HX-UI 已依赖 react-hook-form, 缺内置 zod 封装与 FieldArray 等上层件.
- **motion (原 framer-motion)**: layout 动画, AnimatePresence, 手势, 共享元素 layoutId, 弹簧. HX-UI 已采用, 缺浮层出入场与手势关闭的系统化应用.

## 五. 维度对比: 成熟库怎么做

### 5.1 分层

成熟体系普遍是 "令牌 -> 行为 -> 样式化组件 -> 复合件 -> 业务层" 的分层: MUI (Base UI -> Material UI -> MUI X), Chakra (Zag -> Ark -> Chakra), antd (rc-* -> antd -> ProComponents), shadcn (Radix / Base UI / React Aria -> registry 代码). HX-UI 现在是 "令牌 -> 组件" 两层半, 行为与 hooks 散在组件内部, 复合件与业务层缺位.

### 5.2 主题与令牌

- 三级令牌: 原始色板 (palette) -> 语义 (alias / semantic) -> 组件 (component) 是 Fluent, Carbon, Chakra, antd 的共同做法; HX-UI 只有语义一级 (外加 bp / code 等领域令牌).
- 种子色生成: antd 用 seed token 推导整套色阶, Mantine 用 primaryColor + 10 阶色板, shadcn / DaisyUI 提供主题生成器.
- 运行时与零运行时: antd v6 与 MUI 都走 CSS 变量, 运行时只切变量; HX-UI 本来就是纯 CSS 变量, 方向正确, 缺的是 Provider 与生成器.
- 尺寸与密度: Vuetify `density`, MUI `size`, Mantine `size` xs..xl 是一级 prop, 令牌里有控件高度档; HX-UI 无统一档位.
- 作用域主题: Mantine / Chakra / antd 都支持子树换肤; HX-UI 的 `data-mode` 可以挂在任意节点, 但没有 API 与文档.
- 设计令牌交换格式: W3C DTCG 的 tokens.json 被 Style Dictionary 与 Figma 插件广泛支持; HX-UI 令牌只存在于 CSS.

### 5.3 无障碍

Radix / React Aria / Base UI 按 WAI-ARIA APG 实现键盘与读屏; Primer 与 Carbon 在 CI 跑 axe 并公开每个组件的评审状态. HX-UI 继承 radix 的行为, 但自研件 (Rating, TagInput, TreeNav, DataTable, Stepper, Blueprint) 没有自动化 a11y 校验, 文档也没有键盘交互表.

### 5.4 表单

antd Form, Mantine form, react-hook-form 是三种主流: 字段注册, 校验 (同步 / 异步 / schema), 依赖联动, 动态数组, 错误聚焦. HX-UI 有 rhf 包装与 Field 部件, 缺 schema 封装, FieldArray, 异步校验, 提交态, 以及 NumberInput / PasswordInput / Cascader / TreeSelect / Transfer / ColorPicker / Upload 等输入件.

### 5.5 表格与虚拟化

MUI X Data Grid, antd Table, Element Plus Table-V2, Naive UI DataTable 都支持排序 / 过滤 / 固定列 / 选择 / 展开 / 虚拟滚动; shadcn 的 Data Table 是 TanStack Table 示例. HX-UI 的 DataTable 只到 "过滤 + 空态 + 行点击", 没有虚拟化原语.

### 5.6 日期

Mantine dates 与 MUI X Date Pickers 提供区间, 预设, 日期时间, 月 / 年, 时区; React Aria 的日期全部走国际化日历. Mantine 9 还提供 Schedule 日程视图. HX-UI 只有单日 / 区间日历与时分输入.

### 5.7 图表

MUI X Charts, Carbon Charts, Mantine charts (Recharts 封装), shadcn chart (Recharts 封装) 均提供主题联动与 tooltip 规范; Carbon 与 Highcharts 风格库提供图表的表格视图供读屏. HX-UI 在 Recharts 封装与增量动画上领先, 缺图种与图表无障碍.

### 5.8 国际化

antd, Arco, Element Plus, Naive UI 都有几十种语言包与 ConfigProvider 注入; React Aria 用 Intl 处理数字与日期; antd v6 用 start / end 逻辑方位支持 RTL. HX-UI 有 DirectionProvider, 文案只能逐组件传入.

### 5.9 暗色

所有现代库都用 CSS 变量切换暗色; 区别在于是否支持 system 跟随, 无闪烁首屏, 高对比度. HX-UI 文档站已实现三态与 FOUC 防护, 但这套逻辑在 docs 里, 没有作为库 API 导出.

### 5.10 动效

Fluent 与 Carbon 有动效令牌 (时长 + 曲线), Material 3 有 emphasized 曲线, motion 提供 layout / 手势. HX-UI 动效令牌与引擎已具备, 缺浮层原点放大, 手势关闭, View Transitions 封装.

### 5.11 文档与 playground

Mantine / Chakra / MUI 文档每个组件有 props 表 (从类型生成), Styles API 表, 可编辑示例或 CodeSandbox / StackBlitz 跳转; shadcn 提供 Composition 结构树, llms.txt, MCP server; Storybook 是 Primer / Carbon / Fluent 的组件工作台. HX-UI 文档站外壳优秀, 但 props 表手写 (DocPropRow), 示例不可编辑, 无主题编辑器, 无 AI 出口.

### 5.12 测试与视觉回归

Radix / Base UI / MUI 用 Jest 或 Vitest + Testing Library; React Aria 有大规模无障碍与国际化测试; Primer / Carbon / Fluent 用 Playwright 或 Chromatic 做像素级视觉回归; Vitest browser mode 已可在真实浏览器跑组件测试. HX-UI 有冒烟与行为检查, 但没有组件级单测, 没有 axe, 视觉基线只有一份计算样式夹具.

### 5.13 打包与 tree-shaking

MUI / Mantine / antd 都提供 ESM, `sideEffects` 声明, 按组件子路径导入, 并在 CI 里用 size-limit 或自建脚本守体积. HX-UI 已声明 sideEffects, 重依赖做成可选 peer (check-weight), 但只有单 JS 入口, 无每入口体积预算.

### 5.14 版本与破坏性变更

antd: 每周 patch, 每月 minor, major 另行; MUI: 主版本 + LTS (v7 长期支持), 迁移指南与 codemod; Mantine: 主版本迁移指南; Primer / Carbon: 组件成熟度与废弃标签; Changesets 是 monorepo 常用的变更集工具. HX-UI 有 "API 变化必须改版本号" 的硬门禁 (成熟库也少见), 缺 CHANGELOG, 废弃策略与迁移指南.

## 六. 差距矩阵

等级: P0 = 阻碍 "只用这一个库" 的基础缺口; P1 = 常用业务必需; P2 = 进阶与体验; OK = 已达到或领先.

| # | 维度 | 成熟库标杆 | HX-UI 现状 | 等级 | 对应任务 |
|---|---|---|---|---|---|
| 1 | 分层架构 | MUI, Chakra, antd + Pro | 令牌 + 组件, 无 hooks 层与 Pro 层 | P0 | P0-08, P2-05 |
| 2 | 组件契约 (props 词汇, 插槽) | antd v6 semantic classNames, MUI slots, Mantine Styles API | 各组件自定, 无统一插槽覆盖 | P0 | P0-03 |
| 3 | 令牌分级 | Fluent, Carbon, Chakra | 只有语义一级 | P0 | P0-04 |
| 4 | 尺寸与密度档 | Vuetify density, Mantine size | 无统一档位 | P0 | P0-04 |
| 5 | 主题 Provider 与种子色 | antd ConfigProvider, MantineProvider, createSystem | 无 | P0 | P0-06 |
| 6 | 全局样式隔离 | antd v6 @layer, Tailwind v4 layers | tokens.css 含 body 与滚动条全局规则 | P0 | P0-05 |
| 7 | 国际化语言包 | antd, Element Plus, Naive UI, React Aria | 逐组件 labels | P0 | P0-07 |
| 8 | RTL | antd v6 逻辑方位, Radix Direction | 有 DirectionProvider, 未全量扫查 | P2 | P3-05 |
| 9 | 共享 hooks | Mantine hooks, React Aria hooks | 散落组件内部 | P0 | P0-08 |
| 10 | 组件级单测 | Radix, MUI, Base UI | 无运行器 | P0 | P0-09, P3-04 |
| 11 | 无障碍自动化 | Primer, Carbon (axe) | 无 | P1 | P0-09, P1-16 |
| 12 | 视觉回归 | Primer, Fluent, Chromatic | 计算样式单夹具 | P2 | P3-03 |
| 13 | 按需导入与体积预算 | MUI, Mantine, size-limit | 单入口, 无预算 | P0 | P0-10 |
| 14 | CHANGELOG 与废弃策略 | antd, MUI, Changesets | API 快照联动版本 (领先), 无 CHANGELOG | P1 | P0-11, P3-08 |
| 15 | 表单引擎 | antd Form, Mantine form, rhf + zod | rhf 薄封装 | P1 | P1-01 |
| 16 | 数值 / 密码 / 搜索输入 | Mantine, antd, Ark | 无 | P1 | P1-02 |
| 17 | 多选 / 树选 / 级联 / 穿梭 | antd, Mantine 9 TreeSelect | 只有 Combobox 多选 | P1 | P1-03 |
| 18 | 日期区间预设 / 日期时间 / 时区 | Mantine dates, MUI X | 单日与区间 | P1 | P1-04 |
| 19 | 上传队列 | antd Upload | 只有 FileDropzone | P1 | P1-05 |
| 20 | 颜色选择器 | antd, Ark, Mantine | 只有 ColorSwatch | P1 | P1-06 |
| 21 | 数据网格 | MUI X Data Grid, antd Table, TanStack | 轻量 DataTable | P0 | P1-07, P2-01 |
| 22 | 虚拟化 | TanStack Virtual, Element Table-V2, Naive UI | 无 | P1 | P1-08, P2-01 |
| 23 | 树 | antd Tree, MUI X Tree View, Ark TreeView | TreeNav (导航用) | P1 | P1-09 |
| 24 | 展示件 (描述列表, 标签, 图片预览, QRCode, 水印) | antd | 部分 (Badge, Avatar) | P1 | P1-10 |
| 25 | 通知系统 | sonner, antd notification, Mantine notifications | Toaster 基础 | P1 | P1-11 |
| 26 | 浮层栈与引导 | antd Modal / Tour / Popconfirm, Mantine Spotlight | Dialog, ConfirmDialog, Command | P1 | P1-12 |
| 27 | 导航菜单 / 锚点 / 固钉 | antd Menu, Anchor, Affix | Sidebar, NavTabs, Breadcrumb | P1 | P1-13 |
| 28 | 应用外壳与响应式 | Mantine AppShell, ProLayout | AppFrame 固定两栏 | P1 | P1-14 |
| 29 | 文本工具 (省略, 高亮, 复制) | antd Typography, Mantine Highlight | Typography 基础 | P2 | P1-15 |
| 30 | 图表种类与无障碍 | MUI X Charts, Carbon Charts | 6 种 + 增量动画 (领先) | P2 | P2-02 |
| 31 | 日程视图 | Mantine 9 Schedule | 无 | P2 | P2-03 |
| 32 | 拖拽排序与看板 | dnd-kit, Ark | DragDrop 基础 | P2 | P2-04 |
| 33 | Pro 业务层 | ProComponents | 有 4 个整页模板, 无组件化 | P2 | P2-05 |
| 34 | 动效系统化 | motion, Material 3 | 引擎齐备 (OK), 浮层与手势未系统化 | P2 | P2-06 |
| 35 | 主题编辑器 | shadcn themes, DaisyUI, Arco 主题商店 | 无 | P2 | P2-07 |
| 36 | 令牌交换格式 | W3C DTCG, Style Dictionary | 仅 CSS | P2 | P2-08 |
| 37 | 富文本 | Mantine tiptap | 无 (有 Monaco 与流式 Markdown) | P2 | P2-09 |
| 38 | Props 表自动生成 | Mantine, MUI, Chakra | 手写 DocPropRow | P2 | P3-01 |
| 39 | 可编辑 playground | MUI, Mantine, StackBlitz | 只读示例 + 复制 | P2 | P3-02 |
| 40 | 面向 AI 的文档出口 | shadcn registry, MCP, llms.txt | 无 | P2 | P3-06 |
| 41 | 性能基准 | MUI X, TanStack 基准 | test:perf blocked | P2 | P3-07 |
| 42 | 设计规约门禁 | 少见 | 已有 (领先) | OK | 保持 |
| 43 | API 快照与版本联动 | 少见 | 已有 (领先) | OK | 保持 |
| 44 | AI / 会话 / 蓝图领域件 | shadcn 2026-06 聊天组件 | 已有且更深 (领先) | OK | 保持 |

## 七. 融合后的目标架构

| 层 | 内容 | 来源借鉴 | 依赖 |
|---|---|---|---|
| L0 令牌 | tokens.css 三级令牌, base.css 可选重置, tokens.json (DTCG) | Fluent, Carbon, antd seed | 零 |
| L1 行为 | src/hooks, src/provider (主题, 语言, 默认值), src/locale | Mantine hooks, React Aria, Vuetify defaults | React |
| L2 基础件 | 现有 primitives (radix 之上), 统一组件契约与插槽 | shadcn, Radix, Base UI, antd semantic classNames | radix-ui, cva |
| L3 复合件 | form, inputs, select, dates, data-grid, virtual, tree, upload, notify, overlay, nav, shell | antd, Mantine, MUI X, TanStack | rhf, zod, TanStack |
| L4 Pro 层 | ProTable, ProForm, PageContainer, 整页模板 | ProComponents | L3 |
| L5 领域件 | agent, chat, blueprint, editor, hxbrowser, charts, schedule, rich-text | 自有, Mantine Schedule, tiptap | 可选 peer |

规则: 下层不得 import 上层 (HC-CYCLE 已有无环检查, 可在其上加层级规则); 每层单独可取用; 重依赖只在 L5 且必须是可选 peer (check-weight 已守).

## 八. 风险与约束

- 门禁约束会放大工作量: tsx 不超过 250 行 (gates line-budget), ts 不超过 300 行 (HC-SIZE), 每目录直接文件不超过 6 个 (HC-DIR, Warning), 同一字面量 3 次以上必须进 constants, 每个决策一篇 agent note 并双链. 任务拆解已按此切分子目录.
- 新直接依赖需要先在 approvals.json 登记 (HC-DEPS), 因此 P0-02 是所有引新依赖任务的前置.
- 共享入口 (src/index.ts, package.json, nav.ts, App.tsx, navIcons.ts, README, gates 注册表, API 快照) 只归每阶段的集成任务, 避免并行冲突.
- "组件视觉类名沿用 open-vetta" 的约束意味着 P0-04 只能新增令牌与档位, 不改默认外观; 新目录的组件不受上游类名约束.
- 审计产物归位 (P0-01 已完成): 误建的 0 字节空文件 `docs/audit` 已删除; 三份产物迁到 `docs/reference/audit/`, 文件名去掉日期前缀, 满足 HC-DOCNAME 的日期前缀规则. HC-DOCS 只检查 docs 下第一级目录, `reference/audit/` 属于 reference, 不违规. 遗留冲突: `ui-library-tasks.json` 的扩展名不在 HC-DOCNAME 允许的 md/mdx/yaml 内, 迁移后路径是新路径, 不在 baseline 中, docs 分组会报 1 条新增 Error. 按约束不改 baseline, 处理方向见下一节.
- 0.x 阶段的破坏性变更需要 CHANGELOG 与迁移说明兜底 (P0-11, P3-08), 否则下游项目难以跟进.

## 八附. P0-01 门禁冲突记录

| 规则 | 检查对象 | 结论 |
|---|---|---|
| HC-DOCS | docs 下第一级目录须为 tutorials/reference/architecture/decisions/archive | `docs/reference/audit/` 合规, 不需要改规则; 空文件 `docs/audit` 删除后原有违规消失 |
| HC-DOCNAME 日期前缀 | 日期前缀只允许 decisions | 三份文件去掉 `2026-` 前缀后合规 |
| HC-DOCNAME 目录名 | 目录小写 kebab | `audit` 合规 |
| HC-DOCNAME 扩展名 | 文档扩展名限 md/mdx/yaml | `docs/reference/audit/ui-library-tasks.json` 违规 (迁移前的旧路径同样违规) |

`.json` 冲突的可选处理 (二选一, 由维护者裁决, 不改 baseline):

1. 改规则: 按 rules.md 的约定 "项目必需其他扩展名或名称须登记精确路径及原因", 在 `scripts/quality/checks/docs.ts` 的 HC-DOCNAME 中加入精确路径豁免 `docs/reference/audit/ui-library-tasks.json` (原因: 路线图的机器可读任务表, 由核对脚本读取), 并同步 `docs/reference/quality/rules.md` 的例外清单与 fixtures. 这是代码改动, 不在 P0-01 只改文档的范围内.
2. 改产物: 把任务表转为 `docs/reference/audit/ui-library-tasks.yaml`, 或移出 docs 树 (如 `scripts/roadmap/tasks.json`). 这会改变验收判据里的文件名, 需要先改任务表与路线图.

## 九. 引用来源

- shadcn/ui 文档: https://ui.shadcn.com/docs
- shadcn/ui changelog: https://ui.shadcn.com/docs/changelog
- shadcn/ui 2026-07 Base UI 成为默认: https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default
- shadcn/cli v4 (2026-03): https://ui.shadcn.com/docs/changelog/2026-03-cli-v4
- shadcn CLI 3.0 与 MCP server (2025-08): https://ui.shadcn.com/docs/changelog/2025-08-cli-3-mcp
- shadcn Component Composition (2026-04): https://ui.shadcn.com/docs/changelog/2026-04-component-composition
- Radix Primitives: https://www.radix-ui.com/primitives/docs/overview/introduction
- Radix 无障碍说明: https://www.radix-ui.com/primitives/docs/overview/accessibility
- Base UI: https://base-ui.com
- React Aria: https://react-spectrum.adobe.com/react-aria/
- Headless UI: https://headlessui.com
- Ark UI: https://ark-ui.com
- Zag.js: https://zagjs.com
- Park UI: https://park-ui.com
- DaisyUI: https://daisyui.com
- Material UI: https://mui.com/material-ui/
- MUI v9 发布: https://mui.com/blog/introducing-mui-v9/
- MUI 版本与支持策略: https://mui.com/material-ui/getting-started/versions/
- MUI X Data Grid: https://mui.com/x/react-data-grid/
- Chakra UI 主题: https://chakra-ui.com/docs/theming/overview
- Mantine: https://mantine.dev
- Mantine 9.0 changelog: https://mantine.dev/changelog/9-0-0/
- Mantine 9.2 (TreeSelect): https://mantine.dev/changelog/9-2-0
- Mantine 9.4 (ComboboxPopover, AgendaView): https://mantine.dev/changelog/9-4-0
- Mantine hooks: https://mantine.dev/hooks/package/
- Mantine form: https://mantine.dev/form/package/
- Ant Design: https://ant.design
- Ant Design v5 到 v6 迁移: https://ant.design/docs/react/migration-v6/
- Ant Design 6.0 发布说明: https://github.com/ant-design/ant-design/issues/55804
- Ant Design changelog 与发布节奏: https://ant.design/changelog
- Ant Design v6 的 CSS 变量: https://ant.design/docs/blog/css-tricks/
- ProComponents: https://procomponents.ant.design
- Ant Design Pro: https://pro.ant.design
- Arco Design React: https://arco.design/react/docs/start
- Naive UI: https://www.naiveui.com
- Element Plus: https://element-plus.org
- Vuetify: https://vuetifyjs.com
- Fluent UI React v9: https://react.fluentui.dev
- Carbon Design System 主题: https://carbondesignsystem.com/elements/themes/overview/
- Primer: https://primer.style/product
- TanStack Table: https://tanstack.com/table/latest
- TanStack Virtual: https://tanstack.com/virtual/latest
- react-hook-form: https://react-hook-form.com
- zod: https://zod.dev
- motion: https://motion.dev
- Tailwind CSS v4 theme: https://tailwindcss.com/docs/theme
- cva: https://cva.style/docs
- tailwind-variants: https://www.tailwind-variants.org
- W3C Design Tokens Format: https://www.designtokens.org/tr/drafts/format/
- WAI-ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- axe-core: https://github.com/dequelabs/axe-core
- Playwright 截图断言: https://playwright.dev/docs/test-snapshots
- Vitest browser mode: https://vitest.dev/guide/browser/
- size-limit: https://github.com/ai/size-limit
- Changesets: https://github.com/changesets/changesets
