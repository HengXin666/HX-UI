/**
 * 提及输入 (MentionInput) 的纯逻辑: 光标前有没有在打触发符, 插入提及后的文本与光标, 文本被删后同步已选提及,
 * 高亮区间, 默认过滤. 不带 "use client": 组件 (mention-input.tsx) 与自检脚本共用, 服务端也能 import.
 */

import type { ReactNode } from "react"

/** 一个候选项 */
export interface MentionItem<T = unknown> {
  id: string
  /** 显示名; 插入的文字默认也是它 */
  label: string
  /** 插入到文本里的名字 (不含触发符), 默认 label */
  value?: string
  /** 名字后面的说明 (职位, 邮箱, 命令说明) */
  description?: string
  /** 前置图标 / 头像 */
  icon?: ReactNode
  /** 行尾的类型标签, 如 "Agent" "群" */
  tag?: ReactNode
  /** 分组名, 如 "全体" "群 Agent" "成员"; 组按第一次出现的顺序排 */
  group?: string
  /** 额外参与过滤的词 (拼音, 英文名, 工号...) */
  keywords?: readonly string[]
  disabled?: boolean
  data?: T
}

/** 一条已插入的提及 */
export interface MentionRecord {
  id: string
  /** 触发符, 如 "@" */
  trigger: string
  /** 插入的名字 (不含触发符) */
  value: string
}

/** 光标前正在输入的触发 */
export interface TriggerMatch {
  trigger: string
  /** 触发符之后, 光标之前的文字 */
  query: string
  /** 触发符所在下标 */
  start: number
  /** 光标下标 (= 要被替换的区间末尾) */
  end: number
}

export interface TriggerRule {
  char: string
  /** 只在行首触发 (斜杠命令), 默认 false */
  startOfLine?: boolean
  /** 查询词里允许空格, 默认 false */
  allowSpaces?: boolean
}

/** 查询词最长多少字; 超过就不再当作在提及 */
export const MAX_QUERY = 32

const isSpace = (ch: string) => /\s/.test(ch)
/**
 * 触发符前面不能是英文字母 / 数字 / 下划线 (所以 a@b.com 里的 @ 不触发);
 * 中文紧挨着打 "你好@张三" 照常触发, 这是中文聊天里的习惯写法.
 */
const WORD_BEFORE = /[A-Za-z0-9_]/
const canPrecede = (ch: string) => ch === "" || !WORD_BEFORE.test(ch)

/**
 * 找光标前的触发: 从光标往回扫, 遇到触发符且它前面是开头 / 空白 / 标点就命中.
 * 多字符触发符 (如 "::") 也支持. 有选区 (selectionStart != selectionEnd) 时调用方应当不调用.
 */
export function findTrigger(text: string, caret: number, rules: readonly TriggerRule[], maxQuery = MAX_QUERY): TriggerMatch | null {
  if (!rules.length || caret <= 0) return null
  const lineStart = text.lastIndexOf("\n", caret - 1) + 1
  const limit = Math.max(lineStart, caret - maxQuery - 8)
  for (let i = caret - 1; i >= limit; i--) {
    const ch = text[i]
    for (const rule of rules) {
      const c = rule.char
      if (!c || text.slice(i, i + c.length) !== c || i + c.length > caret) continue
      const query = text.slice(i + c.length, caret)
      if (query.length > maxQuery) continue
      if (!rule.allowSpaces && /\s/.test(query)) continue
      // 紧跟触发符就是空格: 不是在提及
      if (query.startsWith(" ")) continue
      const before = i === 0 ? "" : text[i - 1]
      if (rule.startOfLine ? !(i === lineStart || text.slice(lineStart, i).trim() === "") : !canPrecede(before)) continue
      return { trigger: c, query, start: i, end: caret }
    }
    // 不允许空格的触发符遇到空白就停; 允许空格的继续往回找
    if (isSpace(ch) && !rules.some((r) => r.allowSpaces)) return null
  }
  return null
}

/** 输入法组合串里的分隔符: 拼音输入法常显示 "lin'xiao" 或 "lin xiao", 过滤时去掉 */
const COMPOSE_SEPARATORS = /['’\s]/g

/**
 * 输入法组合期间的触发检测: [composeFrom, caret) 是还没上屏的组合串 (如拼音 "lin'xiao").
 * 去掉分隔符后接在已上屏文字后面当查询词, 让候选在选字时就按拼音实时预过滤 (配合 MentionItem.keywords).
 * 只认组合串之前已经上屏的触发符; 返回的 start / end 是原文本里的下标 (end = 真实光标), query 是去掉分隔符的.
 */
export function findTriggerComposing(text: string, caret: number, composeFrom: number, rules: readonly TriggerRule[], maxQuery = MAX_QUERY): TriggerMatch | null {
  const from = Math.max(0, Math.min(composeFrom, caret))
  const head = text.slice(0, from)
  const seg = text.slice(from, caret).replace(COMPOSE_SEPARATORS, "")
  const m = findTrigger(head + seg, head.length + seg.length, rules, maxQuery)
  if (!m || m.start >= from) return null
  return { ...m, end: caret }
}

/** 把 [match.start, match.end) 换成 "触发符 + 名字 + 后缀"; 后面已经是空白时不重复加空格. 返回新文本与光标 */
export function insertMention(text: string, match: Pick<TriggerMatch, "start" | "end" | "trigger">, value: string, suffix = " "): { text: string; caret: number; inserted: string } {
  const after = text.slice(match.end)
  const tail = suffix && after.startsWith(suffix) ? "" : suffix
  const inserted = match.trigger + value + tail
  const next = text.slice(0, match.start) + inserted + after
  return { text: next, caret: match.start + inserted.length + (tail ? 0 : suffix.length), inserted }
}

/** 名字后面是边界 (结尾, 空白, 标点) 才算一个完整的提及: "@小明" 删成 "@小" 就不算了 */
const BOUNDARY = /[\s,.;:!?，。、；：！？)\]}」』）】"'”’]/

function occurrences(text: string, token: string): number[] {
  const out: number[] = []
  if (!token) return out
  for (let i = text.indexOf(token); i !== -1; i = text.indexOf(token, i + 1)) {
    const next = text[i + token.length]
    const prev = i === 0 ? "" : text[i - 1]
    if ((next === undefined || BOUNDARY.test(next)) && canPrecede(prev)) out.push(i)
  }
  return out
}

/** 文本被改后, 去掉已经不在文本里的提及 (同一 id 只留一条) */
export function syncMentions(text: string, mentions: readonly MentionRecord[]): MentionRecord[] {
  const seen = new Set<string>()
  const out: MentionRecord[] = []
  for (const m of mentions) {
    if (seen.has(m.id)) continue
    if (occurrences(text, m.trigger + m.value).length) {
      seen.add(m.id)
      out.push(m)
    }
  }
  return out
}

export interface MentionRange {
  start: number
  end: number
  mention: MentionRecord
}

/** 文本里所有提及的区间 (高亮用), 按位置排序, 不重叠 (长的优先, 如 "@小明同学" 盖过 "@小明") */
export function mentionRanges(text: string, mentions: readonly MentionRecord[]): MentionRange[] {
  const sorted = [...mentions].sort((a, b) => b.value.length - a.value.length)
  const taken: MentionRange[] = []
  for (const m of sorted) {
    const token = m.trigger + m.value
    for (const start of occurrences(text, token)) {
      const end = start + token.length
      if (taken.some((r) => start < r.end && end > r.start)) continue
      taken.push({ start, end, mention: m })
    }
  }
  return taken.sort((a, b) => a.start - b.start)
}

/** 默认过滤: 名字 / 插入值 / 关键词 里包含查询词 (不区分大小写) */
export function defaultMentionFilter(item: MentionItem<unknown>, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  return [item.label, item.value ?? "", ...(item.keywords ?? [])].some((s) => s.toLowerCase().includes(q))
}

/** 过滤并排序: 名字以查询词开头的排前面, 其余保持原顺序; 截到 max 条 */
export function rankMentions<T>(items: readonly MentionItem<T>[], query: string, filter: (item: MentionItem<T>, query: string) => boolean, max: number): MentionItem<T>[] {
  const hit = items.filter((it) => filter(it, query))
  if (query) {
    const q = query.toLowerCase()
    const head = hit.filter((it) => it.label.toLowerCase().startsWith(q))
    const rest = hit.filter((it) => !it.label.toLowerCase().startsWith(q))
    return [...head, ...rest].slice(0, max)
  }
  return hit.slice(0, max)
}
