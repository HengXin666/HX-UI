"use client"

/**
 * 提及输入: 多行输入框, 打 "@" (或 "#" "/" 等触发符) 时在光标处弹出候选, 选中后插入 "@名字 ".
 *
 *   <MentionInput items={members} value={text} onValueChange={setText} onMentionsChange={(ids) => setMentions(ids)} />
 *
 * 为什么不用 Popover + Command: Command 是独立的搜索框, 焦点要进浮层; 提及时焦点必须一直留在输入框里,
 * 浮层只是 "跟着光标的候选列表". 所以这里自己做: 输入框保留焦点, 用 aria-activedescendant 指向当前候选 (combobox 模式).
 * 光标坐标: 一个隐藏的镜像 div 复制输入框的排版 (字体, 内边距, 宽度, 换行规则), 量出触发符所在字符的位置;
 * 浮层 fixed 定位在它下方, 下方放不下就翻到上方, 左右夹在视口内, 不遮挡正在打的那一行; 滚动 / 改尺寸时 rAF 重新定位.
 * 浮层关闭时淡出并轻微位移 (150ms, 期间 inert 不可交互, 内容冻结在关闭前那一帧), 减弱动效时直接消失.
 *
 * 高亮 (highlight): 输入框下面垫一层同排版的 overlay.
 * - "text" (默认): 输入框文字透明, 只留原生光标 (caret-color) 与原生选区; 看到的文字全部由 overlay 画, 提及区间染主题色.
 *   光标, 选区, 撤销, 拼写检查, 输入法都还是 textarea 原生的. 输入法组合串的下划线原本用文字颜色画 (透明就看不见了),
 *   所以 overlay 按 compositionupdate 给出的组合区间自己画一条下划线 (text-decoration 不影响排版), 选字时提及颜色也不丢.
 * - "background": 文字仍由输入框画, overlay 只给提及区间垫底色 (最保守).
 * 为了 overlay 与文字绝不错位: textarea 自己从不滚动 (高度始终 = 内容高度), 由外面一层 scroller 限高并滚动,
 * overlay 和 textarea 都在 scroller 里, 原生一起滚, 不需要 JS 同步 scrollTop (同步会在线程化滚动时晚一帧, 文字会抖).
 * 打字时浏览器会把光标滚进可见区, 对祖先滚动容器同样生效.
 * 自动增高用 field-sizing: content; 不支持的浏览器 (Firefox) 在文本变化时量一次 scrollHeight 补上.
 *
 * 输入法: 组合期间不拦截 Enter / 方向键 (那是输入法的选字); 但候选会按组合串实时预过滤 (拼音 "lin'xiao" 去掉分隔符
 * 当查询词, 命中 keywords 里的拼音), 体验对齐微信 / 飞书; 上屏后按真实文字再过滤一次.
 * 已插入的提及记在内部, 文本里对应的 "@名字" 被删 / 改坏时自动移除, onMentionsChange 给出当前的 id 列表;
 * 撤销 / 重做把文字找回来时, 刚被移除的提及也一起恢复.
 * 浮层底部的键盘提示在触屏 (pointer: coarse) 上隐藏, 那里没有方向键.
 * 候选源: 数组 (本地过滤, 可换 filter) 或函数 (可返回 Promise, 防抖, 期间显示加载中, 旧请求的结果丢弃).
 * 插入走 execCommand("insertText"), 进浏览器自己的撤销栈; 不可用时直接改值, 并由组件自己维护一个小撤销栈
 * (Ctrl/⌘+Z 撤销, Ctrl/⌘+Shift+Z 或 Ctrl+Y 重做), 只在文字没被改过时接管, 否则交还给浏览器.
 */

import * as React from "react"
import { createPortal } from "react-dom"
import { LoaderCircleIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFieldControl } from "@/components/ui/field"
import { useReducedMotion } from "@/motion/use-reduced-motion"
import {
  MAX_QUERY,
  defaultMentionFilter,
  findTrigger,
  findTriggerComposing,
  insertMention,
  mentionRanges,
  rankMentions,
  syncMentions,
  type MentionItem,
  type MentionRange,
  type MentionRecord,
  type TriggerMatch,
} from "@/components/ui/mention-input-model"

export type { MentionItem, MentionRecord, TriggerMatch, MentionRange } from "@/components/ui/mention-input-model"
export { findTrigger, findTriggerComposing, insertMention, syncMentions, mentionRanges, defaultMentionFilter, rankMentions } from "@/components/ui/mention-input-model"

/** 自定义渲染候选时拿到的状态 */
export interface MentionItemState {
  active: boolean
  query: string
  trigger: string
  /** 输入法组合中 (列表只是预览, Enter 交给输入法) */
  composing: boolean
}

/** 高亮颜色 (都是主题令牌) */
export type MentionTone = "brand" | "info" | "success" | "warning"

/** 高亮方式: text 给提及文字本身着色 (默认); background 只垫底色; false 不高亮 */
export type MentionHighlight = "text" | "background"

export type MentionSource<T> = readonly MentionItem<T>[] | ((query: string) => readonly MentionItem<T>[] | Promise<readonly MentionItem<T>[]>)

export interface MentionTrigger<T = unknown> {
  /** 触发符, 如 "@" "#" "/" */
  char: string
  /** 候选: 数组 (本地过滤) 或函数 (按查询词返回, 可异步; 不再本地过滤, 除非给了 filter) */
  items: MentionSource<T>
  /** 浮层的名字, 读屏用, 如 "提及成员" "话题" "命令" */
  label?: string
  /** 只在行首触发 (斜杠命令) */
  startOfLine?: boolean
  /** 查询词里允许空格 */
  allowSpaces?: boolean
  filter?: (item: MentionItem<T>, query: string) => boolean
  renderItem?: (item: MentionItem<T>, state: MentionItemState) => React.ReactNode
  /** 没有匹配时显示 */
  empty?: React.ReactNode
  /** 插入后是否记为提及 (进 onMentionsChange 与高亮), 默认 true; 斜杠命令通常设 false 并用 onMentionSelect 处理 */
  track?: boolean
  /** 高亮颜色, 默认 brand */
  tone?: MentionTone
}

export type MentionPlacement = "auto" | "bottom" | "top"

export interface MentionInputProps<T = unknown> extends Omit<React.ComponentProps<"textarea">, "value" | "defaultValue"> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** 简写: 只有 "@" 一种触发时直接给候选 */
  items?: MentionSource<T>
  /** 多种触发符, 各自的候选源; 给了就忽略 items */
  triggers?: readonly MentionTrigger<T>[]
  /** 已有文本里的提及 (编辑草稿时) */
  defaultMentions?: readonly MentionRecord[]
  /** 已选提及变化: 插入新的, 或文本里的 "@名字" 被删掉 */
  onMentionsChange?: (ids: string[], mentions: MentionRecord[]) => void
  /** 选中一个候选时 (插入之前) */
  onMentionSelect?: (item: MentionItem<T>, trigger: string) => void
  /** 浮层最多显示几条, 默认 8 */
  maxItems?: number
  /** 高亮已插入的提及: "text" (= true, 默认) 文字着色; "background" 垫底色; false 不高亮 */
  highlight?: boolean | MentionHighlight
  /** 浮层在光标下方 / 上方; auto (默认) 下方放不下时翻到上方. 指定方向放不下时也会翻 */
  placement?: MentionPlacement
  /** 浮层对齐触发符 (默认, 打字时不跟着抖) 还是当前光标 */
  anchor?: "trigger" | "caret"
  /** 随内容长高, 默认 true; false 时固定 minRows 行高, 超出滚动 */
  autoGrow?: boolean
  /** 最少行数, 默认 2 */
  minRows?: number
  /** 自动增高的最多行数, 默认 8 */
  maxRows?: number
  /** default 带边框; ghost 无边框无底, 嵌进自己的输入卡片里用 */
  variant?: "default" | "ghost"
  /** 浮层宽度 px, 默认 288 */
  popoverWidth?: number
  popoverClassName?: string
  /** 异步候选的防抖 ms, 默认 150 */
  debounce?: number
  /** 强制显示加载中 */
  loading?: boolean
  /** 浮层底部的键盘提示, 默认 true */
  hint?: boolean
  /** 没有匹配时显示, 默认 "没有匹配项" */
  emptyText?: React.ReactNode
  /** 所有触发符共用的候选渲染 (触发符自己的 renderItem 优先) */
  renderItem?: (item: MentionItem<T>, state: MentionItemState) => React.ReactNode
  /** 给 textarea 本身的类名 (className 给外层; 排版类会同步到高亮层) */
  textareaClassName?: string
}

const DEFAULT_MAX_ITEMS = 8
const DEFAULT_WIDTH = 288
const DEFAULT_DEBOUNCE = 150
/** 浮层退出动画时长 (与 duration-150 一致) */
const EXIT_MS = 150
/** 浮层与光标行的间距 */
const OFFSET = 6
/** 浮层离视口边缘至少留多少 */
const MARGIN = 8
/** 浮层左边比触发符往左多出一点, 让候选文字和触发符大致对齐 */
const INSET = 10
/** 撤销 / 重做时最多找回多少条刚被移除的提及 */
const GRAVE_MAX = 50
/** 回退路径自己的撤销栈深度 */
const UNDO_MAX = 50
const NO_RECORDS: readonly MentionRecord[] = []

/** 背景模式: 提及垫底色 */
const TONE_BG: Record<MentionTone, string> = {
  brand: "bg-brand-soft ring-brand/25",
  info: "bg-info/15 ring-info/25",
  success: "bg-success/15 ring-success/25",
  warning: "bg-warning/15 ring-warning/25",
}

/** 文字模式: 提及文字着色 (不改字重, 否则与输入框错位) */
const TONE_TEXT: Record<MentionTone, string> = {
  brand: "text-brand",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
}

/** 行高 (scroller 用它算 max-h 的 1lh, 必须与输入框一致) */
const LEADING = "text-base leading-6 md:text-sm md:leading-5"
/** 输入框与高亮层必须完全同排版, 共用这一串 */
const TYPO = cn("px-3 py-2 whitespace-pre-wrap break-words", LEADING)

/** 镜像 div 要复制的排版属性 */
const MIRROR_PROPS = [
  "box-sizing",
  "width",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "border-style",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "font-variant",
  "font-stretch",
  "font-feature-settings",
  "line-height",
  "letter-spacing",
  "word-spacing",
  "text-indent",
  "text-transform",
  "text-align",
  "tab-size",
  "direction",
  "word-break",
  "overflow-wrap",
] as const

/** 文本第 index 个字符在视口里的位置 (左上角) 与行高; 竖向夹在 clip (可见的 scroller) 内 */
function caretRect(ta: HTMLTextAreaElement, index: number, mirror: HTMLDivElement, clip: DOMRect) {
  const cs = getComputedStyle(ta)
  const st = mirror.style
  for (const p of MIRROR_PROPS) st.setProperty(p, cs.getPropertyValue(p))
  st.position = "absolute"
  st.top = "0"
  st.left = "-9999px"
  st.visibility = "hidden"
  st.whiteSpace = "pre-wrap"
  st.overflow = "hidden"
  st.height = "auto"
  const bl = parseFloat(cs.borderLeftWidth) || 0
  const bt = parseFloat(cs.borderTopWidth) || 0
  mirror.textContent = ta.value.slice(0, index)
  const span = document.createElement("span")
  // 用剩下的文字而不是一个占位字符: 触发符所在的词换不换行与输入框一致
  span.textContent = ta.value.slice(index) || "\u200b"
  mirror.appendChild(span)
  const box = ta.getBoundingClientRect()
  const lh = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) || 14) * 1.4
  const top = box.top + bt + span.offsetTop - ta.scrollTop
  return {
    left: box.left + bl + span.offsetLeft - ta.scrollLeft,
    // 光标所在行滚出可见区时, 夹回可见范围
    top: Math.min(Math.max(top, clip.top), clip.bottom - lh),
    height: lh,
  }
}

function isPromise<V>(v: unknown): v is Promise<V> {
  return !!v && typeof (v as Promise<V>).then === "function"
}

const sameMatch = (a: TriggerMatch | null, b: TriggerMatch | null) =>
  a === b || (!!a && !!b && a.trigger === b.trigger && a.query === b.query && a.start === b.start && a.end === b.end)

const sameIds = (a: readonly MentionRecord[], b: readonly MentionRecord[]) => a.length === b.length && a.every((m, i) => m.id === b[i].id)

/** 浏览器是否支持 field-sizing (不支持时 JS 量高度) */
let fieldSizing: boolean | undefined
const supportsFieldSizing = () => (fieldSizing ??= typeof CSS !== "undefined" && CSS.supports("field-sizing", "content"))

/** 回退路径的一步: 插入前后的文字, 光标, 提及 */
interface UndoStep {
  before: string
  beforeCaret: number
  after: string
  afterCaret: number
}

/** overlay 的一段: 在不在某个提及里, 是不是输入法组合串 */
interface OverlaySegment {
  start: number
  text: string
  mention: MentionRecord | null
  composing: boolean
}

/** 按提及区间与组合区间把文本切段 (区间互不重叠, 已按位置排序) */
function overlaySegments(text: string, ranges: readonly MentionRange[], comp: readonly [number, number] | null): OverlaySegment[] {
  const cuts = new Set<number>([0, text.length])
  for (const r of ranges) cuts.add(r.start).add(r.end)
  const c = comp && comp[1] > comp[0] ? ([Math.max(0, comp[0]), Math.min(text.length, comp[1])] as const) : null
  if (c) cuts.add(c[0]).add(c[1])
  const points = [...cuts].filter((n) => n >= 0 && n <= text.length).sort((a, b) => a - b)
  const out: OverlaySegment[] = []
  let ri = 0
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    if (a === b) continue
    while (ri < ranges.length && ranges[ri].end <= a) ri++
    const r = ranges[ri]
    out.push({ start: a, text: text.slice(a, b), mention: r && r.start <= a && b <= r.end ? r.mention : null, composing: !!c && c[0] <= a && b <= c[1] })
  }
  return out
}

/** 名字里与查询词相同的一段加亮 */
function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const i = text.toLowerCase().indexOf(query.toLowerCase())
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <span className="text-brand">{text.slice(i, i + query.length)}</span>
      {text.slice(i + query.length)}
    </>
  )
}

function DefaultItem<T>({ item, query }: { item: MentionItem<T>; query: string }) {
  return (
    <>
      {item.icon != null && (
        <span data-slot="mention-item-icon" aria-hidden className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-full text-muted-foreground [&_svg]:size-4">
          {item.icon}
        </span>
      )}
      <span className="flex min-w-0 flex-1 items-baseline gap-2">
        <span className="truncate font-medium">
          <Highlighted text={item.label} query={query} />
        </span>
        {item.description && <span className="truncate text-xs text-muted-foreground">{item.description}</span>}
      </span>
      {item.tag != null && (
        <span data-slot="mention-item-tag" className="shrink-0 rounded-sm border px-1.5 py-px text-[11px] leading-4 text-muted-foreground">
          {item.tag}
        </span>
      )}
    </>
  )
}

function MentionInput<T = unknown>({
  value: valueProp,
  defaultValue,
  onValueChange,
  items,
  triggers: triggersProp,
  defaultMentions,
  onMentionsChange,
  onMentionSelect,
  maxItems = DEFAULT_MAX_ITEMS,
  highlight = true,
  placement = "auto",
  anchor = "trigger",
  autoGrow = true,
  minRows = 2,
  maxRows = 8,
  variant = "default",
  popoverWidth = DEFAULT_WIDTH,
  popoverClassName,
  debounce = DEFAULT_DEBOUNCE,
  loading: loadingProp = false,
  hint = true,
  emptyText = "没有匹配项",
  renderItem,
  textareaClassName,
  className,
  style,
  ref,
  onChange,
  onKeyDown,
  onSelect,
  onBlur,
  onFocus,
  onCompositionStart,
  onCompositionEnd,
  onCompositionUpdate,
  ...rest
}: MentionInputProps<T>) {
  const fieldProps = useFieldControl(rest)
  const reduced = useReducedMotion()
  const [inner, setInner] = React.useState(defaultValue ?? "")
  const text = valueProp ?? inner
  const [match, setMatch] = React.useState<TriggerMatch | null>(null)
  const [active, setActive] = React.useState(0)
  const [records, setRecords] = React.useState<readonly MentionRecord[]>(defaultMentions ?? NO_RECORDS)
  const [remote, setRemote] = React.useState<{ key: string; items: readonly MentionItem<T>[] } | null>(null)
  const [pending, setPending] = React.useState(false)
  const [composingState, setComposingState] = React.useState(false)
  /** 输入法组合串在文本里的区间 (文字模式由 overlay 画下划线) */
  const [compRange, setCompRange] = React.useState<readonly [number, number] | null>(null)
  const [exiting, setExiting] = React.useState(false)
  const taRef = React.useRef<HTMLTextAreaElement | null>(null)
  const scrollerRef = React.useRef<HTMLDivElement>(null)
  const popupRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const mirrorRef = React.useRef<HTMLDivElement | null>(null)
  const composing = React.useRef(false)
  const composeFrom = React.useRef<number | null>(null)
  const dismissed = React.useRef<string | null>(null)
  const pendingCaret = React.useRef<number | null>(null)
  const recordsRef = React.useRef(records)
  recordsRef.current = records
  /** 最近被移除的提及: 撤销 / 重做把文字找回时一起恢复 */
  const grave = React.useRef<MentionRecord[]>([])
  const reviveNext = React.useRef(false)
  const undoStack = React.useRef<{ undo: UndoStep[]; redo: UndoStep[] }>({ undo: [], redo: [] })
  const listId = React.useId()

  const mode: MentionHighlight | null = highlight === true ? "text" : highlight === false ? null : highlight

  const triggers = React.useMemo<readonly MentionTrigger<T>[]>(
    () => triggersProp ?? (items ? [{ char: "@", items, label: "提及" }] : []),
    [triggersProp, items]
  )
  const rule = match ? triggers.find((t) => t.char === match.trigger) ?? null : null
  const query = match?.query ?? ""

  const setRef = React.useCallback(
    (el: HTMLTextAreaElement | null) => {
      taRef.current = el
      if (typeof ref === "function") return ref(el)
      if (ref) ref.current = el
    },
    [ref]
  )

  // ---- 触发检测 ----
  const keyOf = (m: TriggerMatch) => `${m.trigger}:${m.start}`
  const detect = React.useCallback(
    (ta: HTMLTextAreaElement) => {
      let raw: TriggerMatch | null = null
      if (ta.selectionStart === ta.selectionEnd && document.activeElement === ta) {
        raw =
          composing.current && composeFrom.current != null
            ? // 选字中: 按组合串预过滤 (只是预览, 键盘仍归输入法)
              findTriggerComposing(ta.value, ta.selectionEnd, composeFrom.current, triggers, MAX_QUERY)
            : findTrigger(ta.value, ta.selectionStart, triggers, MAX_QUERY)
      }
      // 关掉过的那个触发: 光标还在它里面就不再弹; 离开它 (或删掉它) 后忘掉
      if (!raw || dismissed.current !== keyOf(raw)) dismissed.current = null
      const next = raw && dismissed.current === keyOf(raw) ? null : raw
      setMatch((prev) => (sameMatch(prev, next) ? prev : next))
    },
    [triggers]
  )

  // 换了触发或查询词: 回到第一条
  React.useEffect(() => setActive(0), [match?.trigger, match?.start, match?.query])

  const close = (remember: boolean) => {
    if (remember && match) dismissed.current = keyOf(match)
    setMatch(null)
  }

  // ---- 候选 ----
  const source = rule?.items
  const sourceRef = React.useRef(source)
  sourceRef.current = source
  const isRemote = typeof source === "function"
  const remoteKey = rule && isRemote ? `${rule.char}\u0000${query}` : null

  React.useEffect(() => {
    if (!remoteKey) return
    const fn = sourceRef.current
    if (typeof fn !== "function") return
    let live = true
    const q = query
    const run = () => {
      let result: ReturnType<typeof fn>
      try {
        result = fn(q)
      } catch {
        setPending(false)
        return
      }
      if (isPromise<readonly MentionItem<T>[]>(result)) {
        setPending(true)
        result.then(
          (list) => {
            if (!live) return
            setRemote({ key: remoteKey, items: list })
            setPending(false)
          },
          () => live && setPending(false)
        )
      } else {
        setRemote({ key: remoteKey, items: result })
        setPending(false)
      }
    }
    // 第一次立刻取, 之后按防抖; 期间保留上一批结果, 列表不闪空
    const t = window.setTimeout(run, remote ? debounce : 0)
    return () => {
      live = false
      window.clearTimeout(t)
    }
    // remote 只用来判断 "是不是第一次", 不进依赖
  }, [remoteKey, debounce])

  const options = React.useMemo<MentionItem<T>[]>(() => {
    if (!rule) return []
    const filter = rule.filter ?? defaultMentionFilter
    if (typeof rule.items === "function") {
      const list = remote?.items ?? []
      return rule.filter ? rankMentions(list, query, filter, maxItems) : list.slice(0, maxItems)
    }
    return rankMentions(rule.items, query, filter, maxItems)
  }, [rule, remote, query, maxItems])

  const loading = loadingProp || (isRemote && (pending || remote?.key !== remoteKey))
  const enabled = React.useMemo(() => options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0), [options])
  const activeIndex = enabled.length ? enabled[Math.min(active, enabled.length - 1)] : -1
  const open = !!match && !!rule && !fieldProps.disabled && !rest.readOnly
  const optionId = (i: number) => `${listId}-opt-${i}`

  // ---- 提及记录: 文本改了就同步; 撤销 / 重做时从最近移除的里找回 ----
  React.useEffect(() => {
    const prev = recordsRef.current
    const revive = reviveNext.current
    reviveNext.current = false
    const pool = revive ? [...prev, ...grave.current.filter((g) => !prev.some((p) => p.id === g.id))] : prev
    const next = syncMentions(text, pool)
    if (sameIds(prev, next)) return
    const removed = prev.filter((p) => !next.some((n) => n.id === p.id))
    grave.current = [...removed, ...grave.current.filter((g) => !next.some((n) => n.id === g.id) && !removed.some((r) => r.id === g.id))].slice(0, GRAVE_MAX)
    setRecords(next)
  }, [text])
  const lastIds = React.useRef((defaultMentions ?? NO_RECORDS).map((m) => m.id).join("\u0000"))
  const mentionsCb = React.useRef(onMentionsChange)
  mentionsCb.current = onMentionsChange
  React.useEffect(() => {
    const ids = records.map((m) => m.id)
    const key = ids.join("\u0000")
    if (key === lastIds.current) return
    lastIds.current = key
    mentionsCb.current?.(ids, [...records])
  }, [records])

  const commitText = (next: string) => {
    setInner(next)
    onValueChange?.(next)
  }

  const choose = (item: MentionItem<T>) => {
    const ta = taRef.current
    if (!ta || !match || !rule || item.disabled) return
    const val = item.value ?? item.label
    onMentionSelect?.(item, match.trigger)
    const before = ta.value
    const beforeCaret = match.end
    const { text: next, caret, inserted } = insertMention(before, match, val)
    if (rule.track !== false) setRecords((prev) => (prev.some((m) => m.id === item.id) ? prev : [...prev, { id: item.id, trigger: match.trigger, value: val }]))
    dismissed.current = null
    setMatch(null)
    ta.focus()
    ta.setSelectionRange(match.start, match.end)
    let ok = false
    try {
      // 走浏览器的输入管线: Ctrl+Z 能撤销这次插入
      ok = document.execCommand("insertText", false, inserted)
    } catch {
      ok = false
    }
    if (ok && ta.value === next) {
      ta.setSelectionRange(caret, caret)
      setMatch(null)
      return
    }
    // 回退: 直接改值, 浏览器的撤销栈接不上, 记进自己的
    const stack = undoStack.current
    stack.undo = [...stack.undo, { before, beforeCaret, after: next, afterCaret: caret }].slice(-UNDO_MAX)
    stack.redo = []
    pendingCaret.current = caret
    commitText(next)
  }

  /** 回退路径的撤销 / 重做; 文字在那之后被改过就不接管 (交还给浏览器), 返回是否处理了 */
  const historyKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.metaKey || e.ctrlKey
    if (!mod || e.altKey) return false
    const k = e.key.toLowerCase()
    const isUndo = k === "z" && !e.shiftKey
    const isRedo = (k === "z" && e.shiftKey) || (k === "y" && e.ctrlKey && !e.metaKey)
    if (!isUndo && !isRedo) return false
    const stack = undoStack.current
    if (!stack.undo.length && !stack.redo.length) return false
    const cur = e.currentTarget.value
    const step = isUndo ? stack.undo[stack.undo.length - 1] : stack.redo[stack.redo.length - 1]
    if (!step || cur !== (isUndo ? step.after : step.before)) {
      // 之后又打过字: 这一栈已经过期
      stack.undo = []
      stack.redo = []
      return false
    }
    e.preventDefault()
    if (isUndo) {
      stack.undo = stack.undo.slice(0, -1)
      stack.redo = [...stack.redo, step]
    } else {
      stack.redo = stack.redo.slice(0, -1)
      stack.undo = [...stack.undo, step]
    }
    reviveNext.current = true
    pendingCaret.current = isUndo ? step.beforeCaret : step.afterCaret
    setMatch(null)
    commitText(isUndo ? step.before : step.after)
    return true
  }

  React.useLayoutEffect(() => {
    const ta = taRef.current
    if (!ta) return
    if (pendingCaret.current != null) {
      ta.setSelectionRange(pendingCaret.current, pendingCaret.current)
      pendingCaret.current = null
    }
    // 不支持 field-sizing 的浏览器: 量一次内容高度 (min-h 由 CSS 兜底)
    if (!supportsFieldSizing()) {
      ta.style.height = "auto"
      ta.style.height = `${ta.scrollHeight + ta.offsetHeight - ta.clientHeight}px`
    }
  }, [text])

  // ---- 浮层: 退出动画 ----
  const wasOpen = React.useRef(false)
  React.useLayoutEffect(() => {
    if (open) {
      wasOpen.current = true
      setExiting(false)
      return
    }
    if (!wasOpen.current) return
    wasOpen.current = false
    if (reduced) return
    setExiting(true)
    // animationend 是主路径; 计时器兜底 (标签页在后台时动画事件可能不来)
    const t = window.setTimeout(() => setExiting(false), EXIT_MS + 50)
    return () => window.clearTimeout(t)
  }, [open, reduced])

  // ---- 浮层定位 ----
  const position = React.useCallback(() => {
    const ta = taRef.current
    const pop = popupRef.current
    const sc = scrollerRef.current
    if (!ta || !pop || !sc || !match) return
    if (!mirrorRef.current) {
      const m = document.createElement("div")
      m.setAttribute("aria-hidden", "true")
      m.dataset.slot = "mention-input-mirror"
      document.body.appendChild(m)
      mirrorRef.current = m
    }
    const c = caretRect(ta, anchor === "caret" ? match.end : match.start, mirrorRef.current, sc.getBoundingClientRect())
    const vw = window.innerWidth
    const vh = window.innerHeight
    const w = pop.offsetWidth
    const h = pop.offsetHeight
    const below = c.top + c.height + OFFSET
    const above = c.top - OFFSET - h
    const fitsBelow = below + h <= vh - MARGIN
    const fitsAbove = above >= MARGIN
    const side = placement === "top" ? (fitsAbove || !fitsBelow ? "top" : "bottom") : fitsBelow || !fitsAbove ? "bottom" : "top"
    const left = Math.min(Math.max(MARGIN, c.left - INSET), vw - w - MARGIN)
    pop.style.left = `${Math.round(left)}px`
    pop.style.top = `${Math.round(side === "bottom" ? below : Math.max(MARGIN, above))}px`
    pop.dataset.side = side
    pop.style.visibility = "visible"
  }, [match, anchor, placement])

  React.useLayoutEffect(() => {
    if (open) position()
  }, [open, position, options.length, loading, text])

  React.useEffect(() => {
    if (!open) return
    let raf = 0
    const schedule = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        position()
      })
    }
    window.addEventListener("resize", schedule)
    window.addEventListener("scroll", schedule, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", schedule)
      window.removeEventListener("scroll", schedule, true)
    }
  }, [open, position])

  React.useEffect(
    () => () => {
      mirrorRef.current?.remove()
      mirrorRef.current = null
    },
    []
  )

  // 当前候选滚进列表可视区 (只滚列表自己, 不用 scrollIntoView, 免得连带滚动页面)
  React.useEffect(() => {
    const list = listRef.current
    if (!open || activeIndex < 0 || !list) return
    const el = document.getElementById(optionId(activeIndex))
    if (!el) return
    const lr = list.getBoundingClientRect()
    const er = el.getBoundingClientRect()
    if (er.top < lr.top) list.scrollTop -= lr.top - er.top + 4
    else if (er.bottom > lr.bottom) list.scrollTop += er.bottom - lr.bottom + 4
  }, [open, activeIndex])

  // ---- 事件 ----
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 输入法选字中: Enter / 方向键 是输入法的, 不拦
    const ime = composing.current || e.nativeEvent.isComposing || e.keyCode === 229
    if (ime) {
      onKeyDown?.(e)
      return
    }
    if (historyKey(e)) return
    if (open) {
      const n = enabled.length
      const cur = Math.min(active, Math.max(0, n - 1))
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        if (n) setActive(e.key === "ArrowDown" ? (cur + 1) % n : (cur - 1 + n) % n)
        return
      }
      if ((e.key === "Enter" && !e.shiftKey) || e.key === "Tab") {
        const item = activeIndex >= 0 ? options[activeIndex] : undefined
        if (item) {
          e.preventDefault()
          choose(item)
          return
        }
        if (loading) {
          e.preventDefault()
          return
        }
      }
      if (e.key === "Escape") {
        e.preventDefault()
        // 不让外层 (对话框) 跟着关
        e.stopPropagation()
        close(true)
        return
      }
    }
    onKeyDown?.(e)
  }

  const ranges = React.useMemo(() => (mode && records.length ? mentionRanges(text, records) : []), [mode, records, text])
  const toneOf = (trigger: string) => triggers.find((t) => t.char === trigger)?.tone ?? "brand"

  // 分组: 按组第一次出现的顺序
  const groups = React.useMemo(() => {
    const out: { name: string | undefined; items: { item: MentionItem<T>; index: number }[] }[] = []
    options.forEach((item, index) => {
      const g = out.find((x) => x.name === item.group)
      if (g) g.items.push({ item, index })
      else out.push({ name: item.group, items: [{ item, index }] })
    })
    return out
  }, [options])

  // 行高范围: scroller 限高 (滚动发生在这里), textarea 只管自己的最小高度, 从不自己滚
  const scrollerRows = autoGrow ? "max-h-[calc(var(--mi-max)*1lh+1rem)]" : "h-[calc(var(--mi-min)*1lh+1rem)]"

  const render = rule?.renderItem ?? renderItem
  const empty = rule?.empty ?? emptyText
  const isText = mode === "text"

  // 浮层内容: 打开时实时渲染并记下; 退出动画期间冻结在最后一帧
  const frozen = React.useRef<React.ReactNode>(null)
  let body: React.ReactNode = frozen.current
  if (open) {
    body = (
      <>
        <div ref={listRef} id={listId} role="listbox" aria-label={rule?.label ?? "候选"} aria-busy={loading || undefined} className="max-h-72 overflow-y-auto overscroll-contain p-1 scrollbar-thin">
          {groups.map((g, gi) => (
            <div key={g.name ?? `\u0000${gi}`} role={g.name ? "group" : undefined} aria-label={g.name}>
              {g.name && (
                <div aria-hidden data-slot="mention-input-group" className="px-2 pt-2 pb-1 text-[11px] font-medium text-muted-foreground first:pt-1">
                  {g.name}
                </div>
              )}
              {g.items.map(({ item, index }) => {
                const on = index === activeIndex
                return (
                  <div
                    key={item.id}
                    id={optionId(index)}
                    role="option"
                    aria-selected={on}
                    aria-disabled={item.disabled || undefined}
                    data-active={on ? "" : undefined}
                    data-slot="mention-input-item"
                    onMouseMove={() => {
                      if (item.disabled || on) return
                      const k = enabled.indexOf(index)
                      if (k >= 0) setActive(k)
                    }}
                    onClick={() => choose(item)}
                    className={cn(
                      "flex min-h-9 cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors duration-100 pointer-coarse:min-h-11",
                      "data-active:bg-accent data-active:text-accent-foreground aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
                    )}
                  >
                    {render ? render(item, { active: on, query, trigger: match?.trigger ?? "", composing: composingState }) : <DefaultItem item={item} query={query} />}
                  </div>
                )
              })}
            </div>
          ))}
          {loading && (
            <div role="status" className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground">
              <LoaderCircleIcon className="size-3.5 animate-spin motion-reduce:animate-none" />
              加载中…
            </div>
          )}
          {!loading && !options.length && <div className="px-2 py-3 text-center text-xs text-muted-foreground">{empty}</div>}
        </div>
        {hint && options.length > 0 && (
          <div aria-hidden data-slot="mention-input-hint" className="flex items-center gap-3 border-t pointer-coarse:hidden px-2.5 py-1.5 text-[11px] text-muted-foreground">
            {composingState ? (
              <span>选字中 · 上屏后再选择</span>
            ) : (
              <>
                <span>↑↓ 选择</span>
                <span>Enter / Tab 确认</span>
                <span className="ml-auto">Esc 关闭</span>
              </>
            )}
          </div>
        )}
      </>
    )
    frozen.current = body
  }
  const showPopup = open || exiting

  return (
    <div
      data-slot="mention-input"
      data-variant={variant}
      data-highlight={mode ?? undefined}
      data-open={open ? "" : undefined}
      data-composing={composingState ? "" : undefined}
      className={cn(
        "group/mi relative isolate w-full min-w-0",
        variant === "default" &&
          "rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 has-[textarea[aria-invalid=true]]:border-destructive has-[textarea:disabled]:opacity-50 dark:bg-input/30",
        className
      )}
      style={{ "--mi-min": minRows, "--mi-max": Math.max(minRows, maxRows), ...style } as React.CSSProperties}
    >
      <div
        ref={scrollerRef}
        data-slot="mention-input-scroller"
        className={cn("overflow-y-auto overscroll-contain rounded-[inherit] [scrollbar-gutter:stable] scrollbar-thin", LEADING, scrollerRows)}
      >
        <div className="relative">
          {mode && (
            <div
              aria-hidden
              data-slot="mention-input-highlight"
              className={cn(
                "pointer-events-none absolute inset-0 z-0 overflow-hidden select-none",
                TYPO,
                textareaClassName,
                // 文字模式: 看到的字由这里画; 组合中交还给 textarea
                isText ? "text-foreground" : "text-transparent"
              )}
            >
              {overlaySegments(text, ranges, isText ? compRange : null).map((seg) => {
                const body = seg.composing ? (
                  <span data-slot="mention-input-composition" className="underline decoration-1 underline-offset-[3px]">
                    {seg.text}
                  </span>
                ) : (
                  seg.text
                )
                if (!seg.mention) return <React.Fragment key={seg.start}>{body}</React.Fragment>
                const tone = toneOf(seg.mention.trigger)
                return (
                  <mark
                    key={seg.start}
                    data-slot="mention-input-mark"
                    data-trigger={seg.mention.trigger}
                    className={cn("bg-transparent", isText ? TONE_TEXT[tone] : cn("rounded-[4px] text-transparent ring-1 box-decoration-clone", TONE_BG[tone]))}
                  >
                    {body}
                  </mark>
                )
              })}
              {/* 末尾是换行时补一个字符, 高度与输入框一致 */}
              {"\u200b"}
            </div>
          )}
          <textarea
            ref={setRef}
            data-slot="mention-input-textarea"
            value={text}
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? listId : undefined}
            aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
            {...fieldProps}
            onChange={(e) => {
              onChange?.(e)
              const it = (e.nativeEvent as InputEvent).inputType
              // 浏览器撤销 / 重做: 找回文字时把刚移除的提及也找回来
              if (it === "historyUndo" || it === "historyRedo") reviveNext.current = true
              commitText(e.target.value)
              detect(e.target)
            }}
            onSelect={(e) => {
              onSelect?.(e)
              detect(e.currentTarget)
            }}
            onKeyDown={handleKeyDown}
            onFocus={(e) => {
              onFocus?.(e)
              detect(e.currentTarget)
            }}
            onBlur={(e) => {
              onBlur?.(e)
              setMatch(null)
            }}
            onCompositionStart={(e) => {
              onCompositionStart?.(e)
              composing.current = true
              composeFrom.current = e.currentTarget.selectionStart
              setComposingState(true)
            }}
            onCompositionUpdate={(e) => {
              onCompositionUpdate?.(e)
              const from = composeFrom.current
              if (from != null) setCompRange([from, from + (e.data?.length ?? 0)])
            }}
            onCompositionEnd={(e) => {
              onCompositionEnd?.(e)
              composing.current = false
              composeFrom.current = null
              setComposingState(false)
              setCompRange(null)
              detect(e.currentTarget)
            }}
            className={cn(
              "relative z-[1] block w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed",
              "field-sizing-content min-h-[calc(var(--mi-min)*1lh+1rem)]",
              TYPO,
              // 文字模式: 字透明, 光标与选区仍是原生的 (选区底色是半透明令牌, 透出下面 overlay 的字)
              isText && "text-transparent caret-foreground selection:bg-brand-soft selection:text-transparent",
              textareaClassName
            )}
          />
        </div>
      </div>
      {showPopup &&
        createPortal(
          <div
            ref={popupRef}
            data-slot="mention-input-popover"
            data-side="bottom"
            data-state={open ? "open" : "closed"}
            // 退出动画期间不可交互, 也不给读屏
            inert={!open}
            aria-hidden={!open || undefined}
            // 点浮层不让输入框失焦
            onMouseDown={(e) => e.preventDefault()}
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget && !open) setExiting(false)
            }}
            style={{ position: "fixed", left: 0, top: 0, width: popoverWidth, visibility: "hidden" }}
            className={cn(
              "z-50 flex max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-float",
              "duration-150 data-[side=bottom]:origin-top-left data-[side=top]:origin-bottom-left motion-reduce:animate-none",
              "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[side=bottom]:data-[state=open]:slide-in-from-top-1 data-[side=top]:data-[state=open]:slide-in-from-bottom-1",
              "data-[state=closed]:pointer-events-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:[animation-fill-mode:forwards] data-[side=bottom]:data-[state=closed]:slide-out-to-top-1 data-[side=top]:data-[state=closed]:slide-out-to-bottom-1",
              popoverClassName
            )}
          >
            {body}
          </div>,
          document.body
        )}
    </div>
  )
}

export { MentionInput }
