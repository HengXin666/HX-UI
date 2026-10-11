# Agent Note: 图标槽与通用树/行内重命名/状态点

Status: implemented

Decision-ID: ui-icon-slot-and-tree-primitives

## Code

- `src/layout/Icon.tsx`

## Problem

`src/layout/SidebarNav.tsx` 的 `SidebarNavItem.icon` 是**必填 `string`**, 只接受 Iconify
类串 (用 `mask-image` 渲染)。这带来三个问题:

1. **没图标就渲染成空白**: 调用方无图标时只能传 `""`, 得到的是一个空的 `<span>` ——
   占位但不可见。下游因此出现过整条侧栏没有图标。
2. **不支持 React 组件**: 而本库**已经依赖 `lucide-react`**, 却只有三个 primitives
   (`dialog` / `dropdown-menu` / `select`) 用到它。库的图标能力与依赖不匹配。
3. **隐性依赖**: Iconify 类串要求宿主额外引入 Iconify 运行时或字体, 库自己不带。

同时, 树形导航、行内重命名、状态点这三类是**通用交互范式** (文件树/目录树/组织树、
重命名标签或节点、健康状态指示), 每个使用方都在各写一份。

## Decision

### 一、图标收敛到一个槽 (`src/layout/Icon.tsx`)

```ts
export type IconSource = string | ComponentType<{ className?: string }> | ReactNode;
```

`IconSlot` 按四种形态分派, **顺序即语义**:

| 输入 | 行为 |
|---|---|
| `null` / `undefined` / `""` | 返回 `null` —— **不产生任何 DOM**, 不占位 |
| `string` | Iconify 类串路径 (向后兼容) |
| 组件 | 直接以 `size-4 shrink-0` 渲染, 尺寸由槽统一控制 |
| 其他节点 | 包一层 `inline-flex size-4 shrink-0 items-center justify-center` |

`SidebarNavItem.icon` 改为**可选** `IconSource`; `SidebarNavIcon` **委托** `IconSlot`,
自身只保留 `iconUrl` 的 `<img>` 分支 (图片地址不属于 `IconSource` 的三种形态)。
判据只留一处 —— 两份渲染逻辑必然不同步。

**组件判定不能只判 `typeof === "function"`**: React 19 中 `forwardRef` 与 `memo` 产出的是
**对象** (`{ $$typeof, render }`), 而 lucide 的图标正是 `forwardRef`。只判函数会把它们
漏进 ReactNode 分支, 被包进 flex 容器, 尺寸不再由本槽控制 —— 这是能跑但尺寸失控的静默错误。
判定必须同时识别"函数"与"带 `$$typeof` 的对象"。

### 二、三个通用件

- `TreeNav` (`src/layout/TreeNav.tsx` + `src/layout/tree-parts.tsx`):
  受控 (`expandedIds`) 与非受控 (`defaultExpanded`) 双模式; 键盘上下左右与 Enter;
  `role="tree"` / `treeitem` / `aria-expanded` / `aria-selected`; roving tabindex;
  缩进用 `--tree-level-N` 变量而非嵌套 margin。行渲染件拆到 `tree-parts.tsx` 是为
  单文件行数上限 (本仓 tsx ≤ 250 行), 拆法与 `blueprint/canvas-parts.tsx` 一致。
- `InlineRename`: 进入编辑态自动聚焦并**全选**; Enter 提交、Esc 取消 (取消必须压过随后的
  blur)、失焦提交; 空值合法; `maxLength` 截断。
- `StateDot`: `ok | warn | error | idle | busy` 五档, 只用语义 token; `label` 供屏幕阅读器;
  `pulse` 加扩散动画。

**三者都不含业务概念** —— 组件里没有"任务""工作区""项目"这类词, 只有交互范式本身的举例。

### 三、后续扩展

`TreeNode` 随后增加了 `status` (行首状态指示) 与 `trailing` (行尾附加节点) 两个可选
字段, 行渲染顺序固定为 **状态点 → 箭头 → 图标 → 标签 → `meta` → `trailing` → 角标**。
四态视觉与这两个字段的分工由另一篇决策记录给出, 本文不重复:
`.agents/notes/implemented/feature/2026-10-12-session-status-indicator.md`

`TreeNav` 自身只多了一行类型再导出, 键盘导航、展开集与 ARIA 的判定一行未动 ——
状态指示是**行**的属性, 与"哪些行可见"无关。

## Alternatives considered

**什么都不做 (让各使用方自己传 Iconify 类串)**: 最强的理由是零改动, 而且 Iconify 类串
跟随 `currentColor`, 选中态改文字颜色就能整体变色, 不需要换图 —— 这个优点是真的。
否决理由: 它把"图标从哪来"这个决定推给了每一个宿主, 每个宿主都要引入 Iconify 运行时;
而库自己明明已经带了 `lucide-react`。更重要的是必填 `string` 让"没有图标"无法表达,
只能退化成空字符串, 这正是空白图标现象的来源。

**把 `icon` 保留为必填, 只是允许传组件**: 最强的理由是改动最小, 不破坏现有调用方的类型。
否决理由: 不解决根本问题 —— "没有图标"仍然无法表达, 调用方仍要传一个假值。

**只做 `IconSlot`, 树/重命名/状态点留在使用方**: 最强的理由是这三个件的通用性未经第二个
使用方验证, 过早抽象可能抽错形状 (YAGNI)。否决理由: 三者都是成熟且边界清楚的交互范式
(树形导航、行内重命名、状态指示), 不存在需要第二个使用方才能看清的形状; 且它们各自要处理
键盘可达与 ARIA, 让每个使用方重写一遍无障碍逻辑, 正是最容易做错也最该共享的部分。

## Consequences

**变好的**: 图标来源统一到一处, "无图标"成为类型上可表达且渲染上不占位的状态;
宿主不再被迫引入 Iconify; 树/重命名/状态点的键盘与 ARIA 只需实现一次。

**变差的**: `IconSource` 是联合类型, 调用方传错形态时错误信息不如单一类型直白。
`SidebarNavIcon` 与 `IconSlot` 之间多了一层委托, 读代码时要跳一次。
`tree-parts.tsx` 的拆分让"树"这个功能跨两个文件, 新增行渲染逻辑要知道去哪。
