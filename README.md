# HX-UI

一套 React + TypeScript 的 UI 组件库，视觉沿用 [open-vetta](https://github.com/openvetta/open-vetta) 的设计语言，
带一个可交互的组件文档站（26 个页面、每个页面都是活实例 + 可复制代码）。

## 这套东西是什么

分三层，可以只取其中一层用：

| 层 | 内容 | 依赖 |
|---|---|---|
| 令牌 | `src/tokens.css` —— 颜色 / 圆角 / 阴影 / 字体 / 图表色序 | **零** |
| 桥接 | `src/styles.css` —— Tailwind 4 的 `@theme inline` 映射 | Tailwind v4 |
| 组件 | `src/primitive/` `src/layout/` `src/charts/` | React 19 + radix-ui |

`tokens.css` 不 import Tailwind，因此非 Tailwind 项目也能直接用。

## 组件

**基础件**（源码取自 open-vetta，视觉类名未改动）
`Button` `Input` `Switch` `Select` `Dialog` `Drawer` `DropdownMenu` `Popover` `Calendar` `DatePicker` `Slider` `Spin`

**版式件**（决定页面长什么样）
`AppFrame` 应用外壳：外留白 + 两块圆角面板
`SettingSection` / `SettingRow` 设置页版式：一张卡里一行一个设置项
`SidebarNavItem` 侧栏导航项
`Card` `Badge` `SegmentedControl` `CollapsePanel`
`Stepper` 步骤条，状态由外部控制
`LogViewer` 日志框，粘底但不锁死
`Toaster` 消息提醒，右下角堆叠 + 顶部居中
`CodeBlock` 代码块，shiki + One Dark Pro

**图表**（基于 Recharts 3 套一层）
`HxLineChart` `HxAreaChart` `HxBarChart` `HxPieChart` `HxRadarChart` `HxRadialChart`
外加 `ChartFrame` + `ChartChrome`，需要 Recharts 完整能力时自己拼。

## 三个值得一说的地方

**一、换肤只需改令牌。** 组件里不出现任何硬编色值。改 `tokens.css` 里的 CSS 变量，全站跟着变。

**二、图表的增量动画。** Recharts 默认按数组下标配对数据，数量变化时按比例拉伸 ——
5 个点变 15 个点时每个旧点"覆盖"约 3 个新点，整条线从头重排。
这里区分「首次加载」与「后续增量」：首次播完整绘制动画，之后用 `matchAppend`
（或 `matchByDataKey`）让已存在的点留在原位，只有新点淡入。

**三、Spin 有 41 种形态，支持轮播。** 形态来自 [UI Ball LDRS](https://uiball.com/ldrs/)（MIT）。
`mode="rotate"` 会定时随机换一个形态并交叉淡入；`mode="fixed"`（默认）固定不动。

## 开发

```bash
# 组件库本身
npm install
npx tsc --noEmit          # 类型检查

# 文档站
cd docs
npm install
npm run dev               # http://localhost:5600
npm run build
node scripts/check-icons.mjs   # 图标名门禁
```

文档站有 hash 路由，每个组件有独立 URL（`#/button`、`#/charts`...），可直接分享。

## 同步上游

标为「源码取自 open-vetta」的组件可以用脚本重新拉取。脚本只改包名引用，**视觉类名一个字不动**。

```bash
npm run sync-upstream                    # 默认从 ../../ref/open-vetta 拉
npm run sync-upstream /path/to/open-vetta
```

## 许可

Apache-2.0。组件源码取自 [open-vetta](https://github.com/openvetta/open-vetta)（Apache-2.0），
见 `NOTICE`。Spin 的形态来自 [LDRS](https://github.com/GriffinJohnston/ldrs)（MIT）。
