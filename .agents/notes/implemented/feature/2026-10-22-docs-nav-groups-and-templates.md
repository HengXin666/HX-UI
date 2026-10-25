# Agent Note: 文档站按用途细分组件分组, 加顶栏与整页模板

Status: implemented

Decision-ID: docs-nav-groups-and-templates

## Code

- `docs/src/nav.ts`
- `docs/src/components/TopBar.tsx`
- `docs/src/pages/templates/index.ts`

## Problem

组件页增加到九十几页之后, 侧栏只有"基础件"一个大组, 一个表单控件与一个弹层混在一起, 找东西只能靠搜索。另外"源码在哪"和"有没有现成整页可以抄"这两件事不属于任何组件分组, 没有固定的落脚点。

## Decision

- 分组按使用者找东西的方式切: 按钮与操作 / 表单输入 / 选择器 / 浮层与菜单 / 反馈与状态 / 数据展示 / 导航 / 布局容器 / 排版 / 会话 / 页面版式 / 图表 / AI 交互 / 模板 / 蓝图。分组是导航的显示顺序, 与源码目录无关。
- 新增模板分组与四个整页模板 (对话工作台 / 设置页 / 数据看板 / 链路控制台)。模板页固定给出三步套用说明, 按真实窗口高度画框, 并附可直接粘走的代码; 模板页与组件页的分工写在各页开头。
- 顶栏放两个站外入口 (模板, GitHub 源码), 用 36px 细栏与一条 1px 分隔线, 颜色只走语义 token。
- 品牌标记改成几何图形 (两块错位叠放的圆角方块) 而不是 HX 字母: 16px 下字母会糊, 方块仍可辨; 同时提供 docs/public/logo.svg 与 favicon.svg。
- 新增页面的接线仍走 nav.ts 加一行 + App.tsx 加一个 case, 注册表门禁 (check-docs-registry) 保持原判据。
- 模板页 (templates-*) **只由** pages/templates 的 TEMPLATE_PAGES 登记, App.tsx 的 default 分支按 PARITY_PAGES 再 TEMPLATE_PAGES 查表; PARITY_PAGES 里不再重复登记 (两张表同 id 会让 TEMPLATE_PAGES 分支永远走不到, 两表分叉后行为与预期不一致, PR #28 review P3)。check-docs-registry 同时读两张表, 重复 id 报 app-duplicate-case。
- favicon 与 theme-color: theme-color 的两档颜色只写在 docs/index.html 那个 meta 的 data-dark / data-light 上, 首屏内联脚本与 ThemeToggle.applyMode 都按实际明暗从这里取值写回 content, 亮色模式下移动端地址栏不再是深色 (PR #28 review P3)。

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是现有分组仍然能通过搜索找到页面。否决: 侧栏是主要入口, 九十多个条目挤在四组里, 搜索并不能替代"浏览"。
- 按源码目录分组 (primitives / layout / chat): 与代码结构一致, 维护成本最低。否决: 读者不知道也不关心组件放在哪个目录, 一个表单控件和一个弹层被分到不同组只会更难找。
- 把模板放进"示例"分组: 不新增分组。否决: 示例讲的是单页版式的复刻, 模板要回答"抄哪一段能直接用", 两者的阅读目的不同。
- theme-color 用两个带 media 的 meta 声明: 纯 HTML。否决: media 只跟系统明暗, 文档站有手动切换档位, 手动选亮色而系统是暗色时仍是深色栏。
- 品牌标记继续用 HX 文字方块: 零成本。否决: 16px 下不可辨, 而且需要一个能在 favicon 里认出来的标记。

## Consequences

侧栏条目按用途分散在十五个组里, 每组条目数回到可扫读的规模。代价是新增组件时要判断它属于哪个组; 模板页需要同步维护示例代码与真实渲染的一致性。
