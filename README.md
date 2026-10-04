# HX-UI

一套 React + TypeScript 的 UI 组件库，视觉沿用 [open-vetta](https://github.com/openvetta/open-vetta) 的设计语言，
带一个可交互的组件文档站（38 个页面、每个页面都是活实例 + 可复制代码）。

## 这套东西是什么

分三层，可以只取其中一层用：

| 层 | 内容 | 依赖 |
|---|---|---|
| 令牌 | `src/tokens.css` —— 颜色 / 圆角 / 阴影 / 字体 / 图表色序 | **零** |
| 桥接 | `src/styles.css` —— Tailwind 4 的 `@theme inline` 映射 | Tailwind v4 |
| 组件 | `src/primitives/` `src/layout/` `src/charts/` | React 19 + radix-ui |

`tokens.css` 不 import Tailwind，因此非 Tailwind 项目也能直接用。

## 组件

**基础件**（源码取自 open-vetta，视觉类名未改动）
`Button` `Input` `Switch` `Select` `Dialog` `Drawer` `DropdownMenu` `Popover` `Calendar` `DatePicker` `Slider` `Spin`

**基础件（2026-09-29 补齐，建在已装好的 radix 之上）**
`Tooltip` 悬浮提示，含一行式 `TooltipHint`
`Tabs` 标签页，underline / pill 两态
`Accordion` / `Collapsible` 折叠，双向都有高度动画（关键帧，非 transition）
`ScrollArea` 细滚动条容器
`Progress` / `ProgressMeter` 进度条（含不定长）
`Skeleton` / `SkeletonText` 骨架屏
`Separator` 分隔线
`Textarea` 多行文本，随内容长高
`TimePicker` 时:分输入
`ConfirmDialog` 确认框，命令式 `await confirmDialog()` 与声明式两用

**版式件**（决定页面长什么样）
`AppFrame` 应用外壳：外留白 + 两块圆角面板
`SettingSection` / `SettingRow` 设置页版式：一张卡里一行一个设置项
`SidebarNavItem` 侧栏导航项
`Card` `Badge` `SegmentedControl` `CollapsePanel`
`Stepper` 步骤条，状态由外部控制
`LogViewer` 日志框，粘底但不锁死
`Toaster` 消息提醒，右下角堆叠 + 顶部居中
`CodeBlock` 代码块，shiki + One Dark Pro
`DataTable` 数据表：粘性表头 / 空态 / 骨架加载态 / 行点击，不接管数据获取
`StatCard` / `StatGrid` 指标卡与栅格，数字等宽不抖
`EmptyState` / `DataBoundary` 空/错误/加载三态，判定顺序固定
`PageHeader` 页头：标题 + 说明 + 右侧操作位

**图表**（基于 Recharts 3 套一层）
`HxLineChart` `HxAreaChart` `HxBarChart` `HxPieChart` `HxRadarChart` `HxRadialChart`
外加 `ChartFrame` + `ChartChrome`，需要 Recharts 完整能力时自己拼。

**蓝图**（`src/blueprint/`）—— 节点图编辑器
`BlueprintEditor` 默认形态（面板 + 画布 + 诊断）；`BlueprintCanvas` 只要画布；
`canConnect` / `validateGraph` 是纯函数，没有 React 也能跑，后端可以拿同一份判据校验上传上来的图。

自定义节点是**注册**进来的，不用改库源码：

```ts
const reg = createRegistry();
reg.type({ id: "image", extends: "object" });        // 子类型能连父类型输入口
reg.node({
  type: "blur", label: "高斯模糊", category: "图像处理",
  inputs: [{ id: "src", label: "源图", type: "image" }],
  outputs: [{ id: "out", label: "结果", type: "image" }],
  params: [{ id: "k", label: "半径", kind: "number", default: 3 }],
  evaluate: ({ inputs, params }) => ({ out: blur(inputs.src, params.k) }),
});
```

连接合法性只有一份判据 `canConnect`，拖拽反馈与落地都调它 —— 写成两处迟早出现
“提示能连、连完报错”。独占输入被占时不报错而是顶掉旧线，并把被顶掉的边 id
回传给你提示。校验分四层（结构 → 局部 → 环 → 业务钩子），环的报错挂在**边**上
而不是节点上：删环上任意一条边都能解开，挂节点会让人以为要删节点。

## 四个值得一说的地方

**一、换肤只需改令牌。** 组件里不出现任何硬编色值。改 `tokens.css` 里的 CSS 变量，全站跟着变。
`npm run build` 里的 `check-ui-rules.mjs` 会把这条约定变成退出码（硬编 hex / 非语义调色盘 /
非 1px 边框 / 漏写 `type` 的原生 button 都会失败）。规则文档写在注释里不会失败，这个会。

蓝图另有 `check-blueprint.mjs`：38 条断言跑真实源码（类型协变 / 连接判定 / 独占顶替 /
环检测 / 分支求值 / 序列化往返）。判据写错时 tsc、构建、冒烟全绿，只有这层能抓到。

**二、蓝图里执行流与数据流共存。** 有副作用的节点必须挂 `execIn`，求值沿 exec 边走，
没走到的分支不求值 —— 这正是分支的语义。数据节点惰性求值，按拓扑序 + 缓存，
菱形图上公共上游只算一次。

**三、图表的增量动画。** Recharts 默认按数组下标配对数据，数量变化时按比例拉伸 ——
5 个点变 15 个点时每个旧点"覆盖"约 3 个新点，整条线从头重排。
这里区分「首次加载」与「后续增量」：首次播完整绘制动画，之后用 `matchAppend`
（或 `matchByDataKey`）让已存在的点留在原位，只有新点淡入。

**四、Spin 有 41 种形态，支持轮播。** 形态来自 [UI Ball LDRS](https://uiball.com/ldrs/)（MIT）。
`mode="rotate"` 会定时随机换一个形态并交叉淡入；`mode="fixed"`（默认）固定不动。

## 开发

```bash
# 组件库本身
npm install
npm run gates:install-hooks   # 装一次: 把 pre-commit / pre-push 链到 .git/hooks
npm run build             # = gates --group lib (tsc + 设计规约 + 蓝图断言)
npm run verify            # = gates:push (完整矩阵, 见下)
```

**关于 `npm run verify` 里那步浏览器冒烟**：本次补组件时有两个文档页渲染成全白
（一个 radix Provider 用错、一个组件 API 用错），而 `tsc`、`vite build`、
设计规约门禁、图标门禁**全部通过**。唯一能抓到它的是真的在浏览器里打开一次看 DOM。
脚本在 `scripts/check-smoke.mjs`，页面清单从 `docs/src/nav.ts` 自动提取；
没装 chromium 时默认跳过（CI 用 `--strict` 让它变成失败）。

### 门禁

所有检查的**唯一注册表**在 `scripts/gates/registry.mjs`，唯一入口是 `scripts/gates/run.mjs`。
本地钩子与 CI 调的是同一行命令，所以"某个检查点悄悄少跑几条"这件事不会发生。

```bash
npm run gates:list        # 有哪些检查、各自拦什么、依赖什么产物
npm run gates:staged      # 提交档 (lib + docs + shape, 实测约 5s)
npm run gates:push        # 推送档 (+ 浏览器矩阵 + 守卫)
npm run gates:all         # 全部分组 + --strict (CI 档)
npm run gates:probe       # 17 条负向/接线探针 (证明门禁真的会红)
npm run gates:fingerprint # 严格度与接线指纹 (防静默放松)
```

三条容易踩的坑，已由机器兜住：`check-docs-registry.mjs` 对账
`nav.ts ↔ App.tsx 分支 ↔ 页面文件 ↔ 图标表 ↔ 库导出`（`nav` 有页面而 `App` 没有 case 时
会渲染成占位页，而冒烟抓不到它 —— 有负向探针钉着）；`check-line-budget.mjs` 管单文件行数
（tsx ≤ 250 / ts ≤ 450，存量 12 个文件逐个冻结、只降不升）；`check-lanes.mjs` 保证
每个顶层目录都被某条 lane 认领（否则改它一条门禁都不跑）。

当前有效检查、缺口与不装项见 `docs/code-quality-landscape.md`。

```bash
# 文档站
cd docs
npm install
npm run dev               # http://localhost:5600
npm run verify            # typecheck + 图标门禁 + 构建 + 浏览器冒烟
```

文档站有 hash 路由，每个组件有独立 URL（`#/button`、`#/charts`...），可直接分享。

### 文档站的外壳能力

| 能力 | 说明 |
|---|---|
| **⌘K / Ctrl+K 搜索** | 分组结果、↑↓ 选择、Enter 跳转。匹配是「子串 + 子序列」双路 —— 只做子串时 `dt` 搜不到 `DataTable`，只做子序列时中文搜不到 |
| **页内目录** | 宽屏右栏，滚动高亮当前章节。目录是从**渲染后的 DOM** 读的，所以改标题不用同步维护目录 |
| **标题锚点** | `<H2>` 的 id 由标题文本自动推导（中文原样保留，如 `#加载态与空态`），点标题即复制完整链接 |
| **主题切换三档** | 跟随系统 / 亮 / 暗，三态循环。首屏由 `index.html` 里的内联脚本在 React 挂载**之前**定档，避免闪烁（FOUC） |
| **上一页 / 下一页** | 按 `nav.ts` 的顺序遍历 38 页 |

ThemeToggle 有一个刻意的行为：**只在「跟随系统」档位监听 `prefers-color-scheme`**。手动选定后不再跟随 —— 否则用户选了亮色、系统入夜时界面会自己变暗，那是 bug 不是特性。

## 同步上游

标为「源码取自 open-vetta」的组件可以用脚本重新拉取。脚本只改包名引用，**视觉类名一个字不动**。

```bash
npm run sync-upstream                    # 默认从 ../../ref/open-vetta 拉
npm run sync-upstream /path/to/open-vetta
```

## 许可

Apache-2.0。组件源码取自 [open-vetta](https://github.com/openvetta/open-vetta)（Apache-2.0），
见 `NOTICE`。Spin 的形态来自 [LDRS](https://github.com/GriffinJohnston/ldrs)（MIT）。
