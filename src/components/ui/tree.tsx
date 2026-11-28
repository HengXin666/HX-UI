"use client"

/**
 * 树: 文件树, 目录, 组织架构, 分类筛选. 多级嵌套, 可折叠, 单选 / 多选 / 级联勾选, 懒加载, 连接线, 键盘导航.
 *
 *   <Tree aria-label="文件" nodes={nodes} defaultExpanded={["src"]} onAction={(n) => open(n.id)} />
 *
 * 结构: 摊平成可见行 (见 tree-model.ts), 一个 role="tree" 下排 role="treeitem",
 * 层级与位置用 aria-level / aria-setsize / aria-posinset 表达; 折叠的子树不进 DOM.
 * 焦点是 roving tabindex: 整棵树只占一个 Tab 位, 进来落在上次聚焦 (或第一个选中) 的行.
 * 键盘 (WAI-ARIA treeview): 上下 行, 右 展开 / 进第一个孩子, 左 收起 / 回父, Home / End 首尾,
 * Enter 展开收起枝 / 触发 onAction, Space 选中 (多选时切换), * 展开同级, 打字 跳到以它开头的行,
 * 多选另有 Shift+上下 / Shift+点击 连选, Ctrl/⌘+点击 切换, Ctrl/⌘+A 全选.
 * 外观与 HX-CF-Drive 的目录树 (FolderTree) 和 hxoa 面板的工作区树一致: 行高 32px, 行间留 2px, 圆角行,
 * 悬停 accent/60, 选中 accent 底 + 1px border 描边, 20px 的箭头热区 (悬停变前景色), 每级缩进 16px, 默认无连接线.
 * 动效 (animation, 默认 "slide"): 展开时下方的行平滑让位, 子行随让出的空间自上而下依次淡入; 收起反过来, 播完才移除.
 * 由通用的 useUnfold (src/motion/use-unfold.ts) 驱动, 只动 transform / opacity; 收起中的行 inert + aria-hidden,
 * 不可聚焦也不被读屏读到, 键盘与选中逻辑只看真实的可见行. 箭头旋转 150ms. 减弱动效时全部直接到位.
 */

import * as React from "react"
import { CheckIcon, ChevronRightIcon, LoaderCircleIcon, MinusIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useUnfold } from "@/motion/use-unfold"
import type { UnfoldOptions, UnfoldType } from "@/motion/unfold"
import {
  TREE_KEYS,
  checkState,
  flattenVisible,
  indexTree,
  isBranch,
  moveFocus,
  rangeIds,
  setExpanded,
  textOf,
  toggleCascade,
  toggleOne,
  typeahead,
  type CheckState,
  type TreeNode,
  type TreeRow,
} from "@/components/ui/tree-model"

export type { TreeNode, TreeRow, CheckState } from "@/components/ui/tree-model"
export { flattenVisible, branchIds, subtreeIds, checkState } from "@/components/ui/tree-model"

export type TreeSelectionMode = "none" | "single" | "multiple"

/** 展开 / 收起动画: 类型名, 或带时长 / 交错 / 封顶 / 缓动的对象 (见 UnfoldOptions) */
export type TreeAnimation = UnfoldType | UnfoldOptions

/** 自定义渲染时拿到的行状态 */
export interface TreeItemState {
  depth: number
  branch: boolean
  expanded: boolean
  selected: boolean
  /** 级联勾选时的勾选态 */
  checked: CheckState
  focused: boolean
  loading: boolean
}

export interface TreeProps<T = unknown> {
  nodes: readonly TreeNode<T>[]
  /** 受控展开集; 与 onExpandedChange 配合 */
  expanded?: readonly string[]
  defaultExpanded?: readonly string[]
  onExpandedChange?: (ids: string[], change: { id: string; expanded: boolean }) => void
  /** 选中方式, 默认 single */
  selectionMode?: TreeSelectionMode
  /** 受控选中集 (单选时最多一个) */
  selected?: readonly string[]
  defaultSelected?: readonly string[]
  onSelectedChange?: (ids: string[]) => void
  /** 多选时显示复选框并级联: 勾枝 = 勾它和全部后代, 部分后代勾上时枝显示半选 */
  checkboxes?: boolean
  /** 打开 / 执行: 叶子上按 Enter 或双击 */
  onAction?: (node: TreeNode<T>) => void
  /** 懒加载: 展开一个 hasChildren 且还没有 children 的枝时调用; 加载完由调用方把 children 填进 nodes */
  loadChildren?: (node: TreeNode<T>) => Promise<void> | void
  /** 点整行就展开收起枝 (默认 true); false 时只有箭头和键盘能开合 */
  expandOnClick?: boolean
  /** 连接线 */
  lines?: boolean
  /** 每级缩进 px, 默认 16 */
  indent?: number
  /**
   * 展开 / 收起动画, 默认 "slide" (下方让位 + 子行自上而下淡入并轻微下移); "fade" 原地淡入; "none" 关闭.
   * 对象形式可调 duration (每行 ms, 默认 220), stagger (每多一行加的 ms, 默认 14), maxDuration (封顶 ms, 默认 380), easing.
   * 减弱动效 (prefers-reduced-motion) 时总是直接显示.
   */
  animation?: TreeAnimation
  size?: "sm" | "default"
  /** 整棵树在加载: 显示骨架行 */
  loading?: boolean
  /** 没有节点时显示 */
  empty?: React.ReactNode
  /** 换掉默认的 标签 部分 (图标 / 附加内容 / 箭头 / 复选框照旧) */
  renderLabel?: (node: TreeNode<T>, state: TreeItemState) => React.ReactNode
  className?: string
  style?: React.CSSProperties
  id?: string
  "aria-label"?: string
  "aria-labelledby"?: string
}

const DEFAULT_INDENT = 16
/** 行首留白 (px), 连接线的横坐标从这里算 */
const PAD = 6
/** 箭头热区边长 (px), 与参考的目录树一致 (size-5); 缩进比它窄时会盖住上一级图标的左半, 正好让箭头落在父级图标下方 */
const CHEVRON = 20
/** 行间距 (px, 对应 gap-0.5); 连接线要跨过它才连得上 */
const ROW_GAP = 2
/** 箭头图标在热区里的左边距 (px): (20 - 14) / 2 */
const CHEVRON_INSET = 3
/** 行内元素间距 (px, 对应 gap-1.5), 懒加载提示与子行图标对齐用 */
const ITEM_GAP = 6
/** 连按字母时, 两次按键间隔超过它就重新开始拼 */
const TYPEAHEAD_MS = 500
const SKELETON_ROWS = [72, 56, 64, 44]
const NO_IDS: readonly string[] = []
/** 懒加载提示行的 key 后缀 (节点 id 里不会有的字符) */
const LOADING_KEY = "\u0000loading"

/** 要渲染的一条: 树行, 或懒加载时跟在枝后面的 "加载中" 提示 */
type Line<T> = { kind: "row"; row: TreeRow<T> } | { kind: "loading"; row: TreeRow<T> }
const lineKey = (line: Line<unknown>) => (line.kind === "row" ? line.row.node.id : line.row.node.id + LOADING_KEY)

/** 受控 / 非受控的 string[] 状态 */
function useIdList(value: readonly string[] | undefined, initial: readonly string[] | undefined) {
  const [inner, setInner] = React.useState<readonly string[]>(initial ?? NO_IDS)
  return [value ?? inner, setInner] as const
}

function TreeCheck({ state }: { state: CheckState }) {
  const on = state !== false
  return (
    <span
      aria-hidden
      data-state={state === "indeterminate" ? "indeterminate" : on ? "checked" : "unchecked"}
      className={cn(
        "grid size-3.5 shrink-0 place-items-center rounded-[4px] border border-input transition-colors duration-150",
        on && "border-primary bg-primary text-primary-foreground"
      )}
    >
      {state === "indeterminate" ? <MinusIcon className="size-3" strokeWidth={3} /> : on ? <CheckIcon className="size-3" strokeWidth={3} /> : null}
    </span>
  )
}

/** 连接线: 祖先层还有后续兄弟的画贯穿竖线, 自己这层画 ├ 或 └; 竖线落在父级箭头的中线上, 上下各伸出 ROW_GAP 跨过行间距 */
function Guides({ row, indent }: { row: TreeRow<unknown>; indent: number }) {
  if (row.depth === 0) return null
  const x = (level: number) => PAD + level * indent + CHEVRON / 2
  const own = row.depth - 1
  // 横线: 枝连到自己的箭头图标, 叶子 (没有箭头) 连到图标前 4px
  const arm = row.branch ? indent - CHEVRON / 2 + CHEVRON_INSET : indent + CHEVRON / 2 - 4
  return (
    <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0">
      {/* x(level) 这条竖线连着第 level+1 层的兄弟: 路径上那一层的祖先后面还有兄弟才画 */}
      {row.guides.slice(1).map((on, level) =>
        on ? <span key={level} className="absolute w-px bg-border" style={{ left: x(level), top: -ROW_GAP, bottom: -ROW_GAP }} /> : null
      )}
      <span
        className="absolute w-px bg-border"
        style={{ left: x(own), top: -ROW_GAP, ...(row.last ? { height: `calc(50% + ${ROW_GAP}px)` } : { bottom: -ROW_GAP }) }}
      />
      <span className="absolute top-1/2 h-px bg-border" style={{ left: x(own), width: arm }} />
    </span>
  )
}

function Tree<T = unknown>({
  nodes,
  expanded: expandedProp,
  defaultExpanded,
  onExpandedChange,
  selectionMode = "single",
  selected: selectedProp,
  defaultSelected,
  onSelectedChange,
  checkboxes = false,
  onAction,
  loadChildren,
  expandOnClick = true,
  lines = false,
  indent = DEFAULT_INDENT,
  animation = "slide",
  size = "default",
  loading = false,
  empty = "暂无内容",
  renderLabel,
  className,
  style,
  ...aria
}: TreeProps<T>) {
  const [expandedList, setExpandedInner] = useIdList(expandedProp, defaultExpanded)
  const [selectedList, setSelectedInner] = useIdList(selectedProp, defaultSelected)
  const [pending, setPending] = React.useState<ReadonlySet<string>>(() => new Set())
  const [focusId, setFocusId] = React.useState<string | null>(null)
  const anchor = React.useRef<string | null>(null)
  const typed = React.useRef({ text: "", at: 0 })
  const rowEls = React.useRef(new Map<string, HTMLDivElement>())
  const wantFocus = React.useRef(false)

  const expandedSet = React.useMemo(() => new Set(expandedList), [expandedList])
  const selectedSet = React.useMemo(() => new Set(selectedList), [selectedList])
  const rows = React.useMemo(() => flattenVisible(nodes, expandedSet), [nodes, expandedSet])
  const index = React.useMemo(() => indexTree(nodes), [nodes])
  const multiple = selectionMode === "multiple"
  const cascade = multiple && checkboxes
  const display = React.useMemo(
    () =>
      rows.flatMap((row): Line<T>[] =>
        row.expanded && pending.has(row.node.id) && !row.node.children?.length ? [{ kind: "row", row }, { kind: "loading", row }] : [{ kind: "row", row }]
      ),
    [rows, pending]
  )
  const unfold = useUnfold<Line<T>>(display, lineKey, animation)

  // 当前 Tab 停靠的行: 记住的焦点; 它被折进去了就落到最近的可见祖先; 都没有就第一个选中, 再没有就第一行
  const visible = React.useMemo(() => new Set(rows.map((r) => r.node.id)), [rows])
  const tabId = React.useMemo(() => {
    for (let id = focusId; id; id = index.parentOf.get(id) ?? null) if (visible.has(id)) return id
    return rows.find((r) => selectedSet.has(r.node.id))?.node.id ?? rows[0]?.node.id ?? null
  }, [focusId, index, visible, rows, selectedSet])

  React.useEffect(() => {
    if (!wantFocus.current || !tabId) return
    wantFocus.current = false
    rowEls.current.get(tabId)?.focus()
  }, [tabId])

  const focusRow = (id: string) => {
    wantFocus.current = true
    setFocusId(id)
    // 同一行 (tabId 不变) 时 effect 不会再跑, 直接聚焦
    if (id === tabId) rowEls.current.get(id)?.focus()
  }

  const commitExpanded = (ids: readonly string[], open: boolean) => {
    const next = setExpanded(expandedList, ids, open)
    setExpandedInner(next)
    for (const id of ids) onExpandedChange?.(next, { id, expanded: open })
  }

  const load = (node: TreeNode<T>) => {
    if (!loadChildren || !node.hasChildren || node.children?.length || pending.has(node.id)) return
    setPending((s) => new Set(s).add(node.id))
    const done = (ok: boolean) => {
      setPending((s) => {
        const next = new Set(s)
        next.delete(node.id)
        return next
      })
      if (!ok) setExpandedInner((list) => list.filter((x) => x !== node.id))
    }
    Promise.resolve()
      .then(() => loadChildren(node))
      .then(() => done(true), () => done(false))
  }

  const toggle = (node: TreeNode<T>, open = !expandedSet.has(node.id)) => {
    if (node.disabled || !isBranch(node)) return
    if (open) load(node)
    commitExpanded([node.id], open)
  }

  const commitSelected = (next: string[]) => {
    setSelectedInner(next)
    onSelectedChange?.(next)
  }

  type Pick = { toggle?: boolean; range?: boolean }
  const select = (node: TreeNode<T>, how: Pick = {}) => {
    if (selectionMode === "none" || node.disabled) return
    if (!multiple) {
      if (!(selectedList.length === 1 && selectedList[0] === node.id)) commitSelected([node.id])
      anchor.current = node.id
      return
    }
    if (how.range && anchor.current) {
      const span = rangeIds(rows, anchor.current, node.id)
      commitSelected(how.toggle ? [...new Set([...selectedList, ...span])] : span)
      return
    }
    anchor.current = node.id
    if (cascade) commitSelected(toggleCascade(nodes, selectedList, node.id))
    else if (how.toggle) commitSelected(toggleOne(selectedList, node.id))
    else commitSelected([node.id])
  }

  const onRowClick = (e: React.MouseEvent, row: TreeRow<T>) => {
    const { node } = row
    focusRow(node.id)
    if (node.disabled) return
    const mod = e.metaKey || e.ctrlKey
    if (row.branch && expandOnClick && !mod && !e.shiftKey) toggle(node)
    // 级联勾选时, 枝的整行点击只开合 (勾选交给复选框), 叶子的整行点击切换勾选
    if (cascade && row.branch && expandOnClick) return
    select(node, { toggle: mod, range: e.shiftKey })
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const row = rows.find((r) => r.node.id === tabId)
    if (!row) return
    const { node } = row
    const mod = e.metaKey || e.ctrlKey
    if ((TREE_KEYS as readonly string[]).includes(e.key) && !mod && !e.altKey) {
      const move = moveFocus(rows, tabId, e.key)
      if (move.kind === "none") return
      e.preventDefault()
      if (move.kind === "focus") {
        focusRow(move.id)
        const target = index.byId.get(move.id)
        if (multiple && e.shiftKey && target && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
          if (!target.disabled && !selectedSet.has(move.id)) commitSelected([...selectedList, move.id])
        }
      } else if (move.kind === "expand" || move.kind === "collapse") {
        toggle(node, move.kind === "expand")
      } else if (move.kind === "expandSiblings") {
        for (const id of move.ids) {
          const n = index.byId.get(id)
          if (n) load(n)
        }
        commitExpanded(move.ids, true)
      }
      return
    }
    if (e.key === "Enter") {
      e.preventDefault()
      if (row.branch) toggle(node)
      else {
        if (!cascade) select(node)
        if (!node.disabled) onAction?.(node)
      }
      return
    }
    if (e.key === " ") {
      e.preventDefault()
      select(node, { toggle: multiple, range: multiple && e.shiftKey })
      return
    }
    if (multiple && mod && e.key.toLowerCase() === "a") {
      e.preventDefault()
      commitSelected(rows.filter((r) => !r.node.disabled).map((r) => r.node.id))
      return
    }
    if (e.key.length === 1 && !mod && !e.altKey && /\S/.test(e.key)) {
      const now = e.timeStamp
      const text = now - typed.current.at > TYPEAHEAD_MS ? e.key : typed.current.text + e.key
      typed.current = { text, at: now }
      const hit = typeahead(rows, tabId, text)
      if (hit) {
        e.preventDefault()
        focusRow(hit)
      }
    }
  }

  const rowH = size === "sm" ? "h-7 text-[13px]" : "h-8 text-sm"

  if (loading) {
    return (
      <div data-slot="tree" aria-busy="true" className={cn("grid gap-0.5", className)} style={style}>
        {SKELETON_ROWS.map((w, i) => (
          <div key={i} className={cn("flex items-center gap-1.5", rowH)} style={{ paddingLeft: PAD + CHEVRON + ITEM_GAP + (i % 2) * indent }}>
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-3 rounded" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    )
  }

  if (!nodes.length) {
    return (
      <div data-slot="tree" data-empty="" className={cn("grid place-items-center py-8 text-sm text-muted-foreground", className)} style={style}>
        {empty}
      </div>
    )
  }

  return (
    <div
      data-slot="tree"
      role="tree"
      aria-multiselectable={multiple || undefined}
      aria-busy={pending.size > 0 || undefined}
      onKeyDown={onKeyDown}
      className={cn("grid min-w-0 content-start gap-0.5", className)}
      style={style}
      {...aria}
    >
      {unfold.entries.map(({ key, item, exiting }) => {
        const { row } = item
        const { node, depth, branch, expanded } = row
        if (item.kind === "loading") {
          return (
            <div key={key} ref={unfold.ref(key)} aria-hidden className="py-1 text-xs text-muted-foreground" style={{ paddingLeft: PAD + (depth + 1) * indent + CHEVRON + ITEM_GAP }}>
              加载中…
            </div>
          )
        }
        const isSelected = selectionMode !== "none" && (cascade ? checkState(node, selectedSet) === true : selectedSet.has(node.id))
        const checked = cascade ? checkState(node, selectedSet) : isSelected
        const busy = pending.has(node.id)
        const state: TreeItemState = { depth, branch, expanded, selected: isSelected, checked, focused: node.id === tabId, loading: busy }
        const icon = expanded && node.iconExpanded ? node.iconExpanded : node.icon
        const unfoldRef = unfold.ref(key)
        return (
          <div
            key={key}
            ref={(el) => {
              unfoldRef(el)
              // 收起中的行不登记: 焦点只会落到真实的可见行上
              if (el && !exiting) rowEls.current.set(node.id, el)
              else rowEls.current.delete(node.id)
            }}
            // 收起动画中的行: 不可聚焦, 不可点, 不被读屏读到
            inert={exiting || undefined}
            aria-hidden={exiting || undefined}
            data-exiting={exiting ? "" : undefined}
            role="treeitem"
            aria-level={depth + 1}
            aria-setsize={row.size}
            aria-posinset={row.pos}
            aria-expanded={branch ? expanded : undefined}
            aria-selected={selectionMode === "none" ? undefined : isSelected}
            aria-checked={cascade ? (checked === "indeterminate" ? "mixed" : checked) : undefined}
            aria-disabled={node.disabled || undefined}
            aria-busy={busy || undefined}
            aria-label={typeof node.label === "string" ? undefined : textOf(node)}
            tabIndex={!exiting && node.id === tabId ? 0 : -1}
            data-state={branch ? (expanded ? "open" : "closed") : undefined}
            data-selected={isSelected && !cascade ? "" : undefined}
            onClick={(e) => onRowClick(e, row)}
            onDoubleClick={() => {
              if (node.disabled) return
              // 枝: 关掉整行点击开合时, 双击开合 (同参考的目录树); 叶子: 打开
              if (branch) {
                if (!expandOnClick) toggle(node)
              } else onAction?.(node)
            }}
            onFocus={(e) => e.target === e.currentTarget && setFocusId(node.id)}
            className={cn(
              "group/tree-item relative flex min-w-0 cursor-pointer items-center gap-1.5 rounded-md pr-2 outline-none select-none pointer-coarse:h-10",
              "transition-colors duration-150 not-data-selected:hover:bg-accent/60 focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset",
              // 选中底色只给单选 / 普通多选; 级联勾选靠复选框表达, 不再整片铺底
              "data-selected:bg-accent data-selected:text-accent-foreground data-selected:ring-1 data-selected:ring-border",
              "aria-disabled:cursor-not-allowed aria-disabled:opacity-40",
              rowH
            )}
            style={{ paddingLeft: PAD + depth * indent }}
          >
            {lines && <Guides row={row as TreeRow<unknown>} indent={indent} />}
            <span
              aria-hidden
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded text-muted-foreground",
                branch && !node.disabled && "transition-colors duration-150 hover:text-foreground"
              )}
              onClick={(e) => {
                if (!branch || node.disabled) return
                // 箭头只开合, 不改选中
                e.stopPropagation()
                focusRow(node.id)
                toggle(node)
              }}
            >
              {busy ? (
                <LoaderCircleIcon className="size-3.5 animate-spin motion-reduce:animate-none" />
              ) : branch ? (
                <ChevronRightIcon className={cn("size-3.5 transition-transform duration-150 ease-out motion-reduce:transition-none", expanded && "rotate-90")} />
              ) : null}
            </span>
            {cascade && (
              <span
                className="grid shrink-0 place-items-center"
                onClick={(e) => {
                  e.stopPropagation()
                  focusRow(node.id)
                  select(node)
                }}
              >
                <TreeCheck state={checked} />
              </span>
            )}
            {icon && <span aria-hidden className="grid size-4 shrink-0 place-items-center text-muted-foreground [&>svg]:size-4">{icon}</span>}
            <span className="min-w-0 flex-1 truncate">{renderLabel ? renderLabel(node, state) : node.label}</span>
            {node.trailing != null && <span className="ml-auto shrink-0 pl-2 text-xs text-muted-foreground tabular">{node.trailing}</span>}
          </div>
        )
      })}
    </div>
  )
}

export { Tree }
