# Agent Note: 对标 shadcn/ui 补齐全部组件, 组合式版本与已有组件并存

Status: implemented

Decision-ID: shadcn-parity-components

## Code

- `src/primitives/styles.ts`
- `src/chat/message.tsx`
- `src/constants/ui.ts`
- `src/index.ts`

## Problem

HX-UI 要覆盖 https://ui.shadcn.com/docs/components 列出的全部组件 (含 AI 会话类的 Attachment, Bubble, Marker, Message, MessageScroller, Questionnaire, Trace 与 Direction), 外观沿用 Dark Dimmed 令牌, 语义状态色, 动效令牌与水波纹, 并支持现代动效. Sidebar, ContextMenu, ToggleGroup, Field, Table, AlertDialog, Empty, Spinner 在库里另有声明式 API (SidebarNavItemButton, 传 MenuAction[] 的 ContextMenu, SegmentedControl, SettingsFormFields, DataTable, ConfirmDialog, EmptyState, Spin), 下游 HXLoLis / HX-Jungle 正在用这些导出, 不能改名或改行为. 组件会被放进表单, 嵌进普通页面, 在服务端渲染后 hydration, 由调用方传入自己的事件与受控属性, 所以内部行为不能被这些场景破坏.

## Decision

- 新组件放在 `src/primitives/` (基础件) 与新目录 `src/chat/` (会话组合件), 结构, 部件名与 data-slot 对齐 shadcn, 便于对照文档和让 AI 按 shadcn 的写法直接使用. 弹层与菜单共用的类名 (进出场动效, 浮层外观, 菜单项, 遮罩, 焦点环) 收在 `src/primitives/styles.ts`, ContextMenu / Menubar / HoverCard / Sheet / AlertDialog 共用一份, 新组件之间不会漂移.
- 部分覆盖的组件只做加法: 组合式右键菜单的根叫 `ContextMenuRoot` (声明式 `ContextMenu` 名字不让出), 组合式 Sidebar 系列, `Table*` 原语, `Field*`, `ToggleGroup`, `AlertDialog*`, `Empty*`, `Spinner` 与原有导出并存, 原有导出与行为不变.
- 外观: 颜色只用语义令牌, 线条 1px (焦点环用 ring-1 而不是 shadcn 的 3px), 遮罩用 bg-background/60 加模糊而不是黑色原色; Dialog 的遮罩同步换成这份遮罩. 水波纹按组件类型接入: Toggle, ToggleGroupItem, ContextMenuItem, MenubarItem, SidebarMenuButton 带 (可用 ripple={false} 关闭), 输入类, 勾选类, 链接, 表格行不带.
- 动效: 弹层统一 fade + zoom + 按弹出方向 slide, 时长取 --duration-* 令牌 (减弱动效时令牌归零); Sheet 按侧滑入, 退出用 ease-in 且更短; Dialog 居中改用 translate 属性, 让缩放关键帧能叠加, 从而补上进出场动画; NavigationMenu 视口宽高插值并按方向滑入内容; Command 列表高度过渡; Carousel 当前圆点拉长; 问卷切题用 motion 按方向滑动; Trace 的运行中步骤与 Marker 的 shimmer 用 motion.css 的 hx-shimmer 扫光. JS 驱动的动效 (embla 滚动时长, 平滑滚动, motion 位移) 经 `src/primitives/motion.ts` 的 prefersReducedMotion 或 motion 的 useReducedMotion 判断, 减弱动效时直接跳转.
- 新依赖只加组件必需的: cmdk (Command / Combobox), input-otp, embla-carousel-react, react-resizable-panels (v4 的 Group / Panel / Separator API), react-hook-form (Form); zod 与 @hookform/resolvers 只用于文档站示例, 放在 docs/package.json. 都已在 scripts/quality/approvals.json 登记为 APR-dependency-shadcn-parity, 状态是 proposed: 依赖由代理按 shadcn 官方选型引入, 仓库所有者尚未逐项签字, 合并前需要所有者把它改成 approved 并填 approvedBy (HC-DEPS 是 Warning, proposed 期间只报 unapproved, 不阻断).
- 组合式 Sidebar 拆成三个文件以守住 tsx 250 行上限: `src/primitives/sidebar.tsx` 只留状态, Provider, useIsMobile 与 Sidebar 本体; `src/primitives/sidebar-parts.tsx` 放版式件 (SidebarTrigger, SidebarRail, SidebarInset, SidebarInput, SidebarHeader / Footer / Separator / Content, SidebarGroup*); `src/primitives/sidebar-menu.tsx` 只放菜单项. 对外导出名不变, 仍经 shadcn-parity.ts 汇总.
- 交互契约 (组件放进任意页面都要成立): 渲染原生 button 的部件 (含 `TAG.button` 动态标签与 Button 包装的 SidebarTrigger / CarouselPrevious / CarouselNext / 问卷按钮) 默认 `type="button"`, asChild 时不写; 调用方传入的 onClick 与内置行为合并 (先调调用方, 未 preventDefault 再执行内置的翻页 / 聚焦 / 回到底部), 不允许 `{...props}` 覆盖内置处理; 组件级快捷键 (侧栏 Cmd/Ctrl+B, 轮播方向键) 遇到可编辑目标 (`isEditableTarget`, 在 `src/primitives/utils.ts`) 让位; 受控属性 (open / defaultOpen / onOpenChange) 显式合并, 不被透传覆盖; 随机值 (侧栏骨架宽度) 由 useId 派生, SSR 与客户端一致; 问卷最后一题只选中不自动提交, onSubmit 只调用一次, 切题退场方向读 AnimatePresence 的 custom; MessageScroller 观察固定存在的轨道节点, 程序化平滑滚动期间不改贴底判定, 定位消息只滚动视口自身. 门禁 PROJECT-UI-BUTTON-TYPE 同时检查 `const Comp = asChild ? Slot.Root : TAG.button` 这类绑定到 button 的动态标签.
- 无障碍: 列表语义只在子项确为 listitem 时声明 (ItemGroup 不声明, AttachmentGroup 用 group); 附件上传进度用 role=progressbar 与 aria-valuenow; 面包屑省略号的 "更多" 读屏可读; FormMessage 实际渲染时把自身 id 加进控件的 aria-describedby; FieldError 先滤掉空 message 再去重. 排版组件字号全部来自 `--fs-*` 令牌 (导语与一级标题新增 --fs-lead / --fs-5xl). Marker 的扫光颜色跟随 tone (渐变取 currentColor, 用 -webkit-text-fill-color 透明), 只作用于 MarkerContent.
- 字面量按 PROJECT-CONST-DUP 收进 `src/constants/ui.ts` (ORIENTATION, SIDE, ALIGN, ROLE, TAG, OPEN_STATE, TASK_STATUS, UI_CLASSES, UI_NUMBERS 等), 新组件里不留 3 次以上的字面量. 导出数超过入口文件行数上限, 所以基础件经 `src/primitives/shadcn-parity.ts`, 会话件经 `src/chat/index.ts` 汇总后由 `src/index.ts` 整体导出.

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是现有的 SegmentedControl, ConfirmDialog, DataTable, EmptyState 已能满足大部分页面, 少维护一批组件. 否决: 用户明确要全量覆盖 shadcn 清单, 且 AI 按 shadcn 写法生成的代码在缺组件时只能手搓, 正是协作约定禁止的.
- 直接 `npx shadcn add` 拷入官方源码: 最快, 与上游逐字一致. 否决: 官方样式依赖 3px ring, 黑色遮罩, oklch 颜色和 sidebar-* 一组令牌, 全部违反 PROJECT-UI-* 门禁与当前 Dark Dimmed 观感, 改完等于重写.
- 把部分覆盖的组件改成 shadcn API (例如把 ContextMenu 换成组合式): API 统一. 否决: 下游正在用旧导出, 改名会让子模块升级时白屏.
- 会话组件放进 `src/layout/` 与 ChatStream 一起: 少一个目录. 否决: layout 已有 30 多个文件, 会话件是一组互相组合的部件, 独立目录更容易整体查找与替换.

## Consequences

组件数量对齐 shadcn 当前清单, AI 与人都可以按 shadcn 文档的组合写法使用. 代价是同一能力有两套入口 (声明式快捷件与组合式部件), 文档站里每个这样的页面都写明两者的分工. 依赖多了 5 个运行时包. 视觉上与 shadcn 不完全一致 (1px 焦点环, 灰底遮罩, 语义令牌配色), 这是有意的. Dialog 的遮罩与进出场动画随之改变, 依赖旧遮罩颜色的截图需要更新.
