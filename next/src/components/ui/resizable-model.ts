/**
 * Resizable 的纯逻辑: 尺寸换算, 初始布局, 规范化, 拖动一对相邻面板, 折叠吸附.
 * 不碰 DOM, 不写 "use client", 可在 scripts/ui-check.ts 里直接测.
 *
 * 级联推挤 (resizeAt) 与约束冲突时的比例分配见各函数注释.
 *
 * 布局是一组百分比 (和为 100), 与分栏数一一对应. 约束也统一换成百分比:
 * 数字表示百分比, "240px" 表示像素 (按分栏组当前的像素长度换算, 组变大变小时重新换算).
 */

/** 尺寸: 数字 = 百分比; "240px" = 像素; "30%" = 百分比 */
export type PanelSize = number | `${number}px` | `${number}%`

export interface PanelSpec {
  defaultSize?: PanelSize
  minSize?: PanelSize
  maxSize?: PanelSize
  collapsible?: boolean
  collapsedSize?: PanelSize
}

/** 换算成百分比后的约束 */
export interface PanelConstraint {
  min: number
  max: number
  collapsible: boolean
  collapsedSize: number
  defaultSize?: number
}

const EPS = 0.01

/** 换成百分比; 像素值在组长度未知 (0) 时返回 undefined */
export function toPercent(size: PanelSize | undefined, groupPx: number): number | undefined {
  if (size == null) return undefined
  if (typeof size === "number") return size
  const n = Number.parseFloat(size)
  if (!Number.isFinite(n)) return undefined
  if (size.endsWith("px")) return groupPx > 0 ? (n / groupPx) * 100 : undefined
  return n
}

export function resolveConstraints(specs: readonly PanelSpec[], groupPx: number): PanelConstraint[] {
  return specs.map((s) => {
    const min = clamp(toPercent(s.minSize, groupPx) ?? 0, 0, 100)
    const max = clamp(toPercent(s.maxSize, groupPx) ?? 100, min, 100)
    const collapsedSize = clamp(toPercent(s.collapsedSize, groupPx) ?? 0, 0, min)
    const def = toPercent(s.defaultSize, groupPx)
    return { min, max, collapsible: Boolean(s.collapsible), collapsedSize, defaultSize: def == null ? undefined : clamp(def, 0, 100) }
  })
}

export function isCollapsed(size: number, c: PanelConstraint): boolean {
  return c.collapsible && size <= c.collapsedSize + EPS && c.collapsedSize < c.min
}

/** 单个面板的落点: 可折叠且小于最小值时, 过了一半吸附到折叠, 否则吸附到最小; 其余夹在 [min, max] */
export function fitSize(value: number, c: PanelConstraint): number {
  if (c.collapsible && value < c.min) return value < (c.min + c.collapsedSize) / 2 ? c.collapsedSize : c.min
  return clamp(value, c.min, c.max)
}

/**
 * 规范化: 每个面板落进约束 (折叠的保持折叠), 和不为 100 时把差额平均分给还有余量的面板.
 * 约束互相矛盾时按比例分: 最小值之和超过可用空间就按各自最小值的比例缩, 最大值之和不够就按最大值的比例放,
 * 谁都不会被挤成 0 (组被拖得比所有最小值之和还窄时, 各栏一起等比例变窄, 而不是最后一栏消失).
 */
export function normalizeLayout(sizes: readonly number[], cons: readonly PanelConstraint[]): number[] {
  const n = cons.length
  const out = cons.map((c, i) => {
    const v = sizes[i] ?? 0
    return isCollapsed(v, c) ? c.collapsedSize : clamp(v, c.min, c.max)
  })
  for (let round = 0; round < n + 1; round++) {
    const diff = 100 - sum(out)
    if (Math.abs(diff) < EPS) return out
    const open = out
      .map((_, i) => i)
      .filter((i) => !isCollapsed(out[i], cons[i]) && (diff > 0 ? cons[i].max - out[i] > EPS : out[i] - cons[i].min > EPS))
    if (!open.length) break
    const share = diff / open.length
    for (const i of open) out[i] = clamp(out[i] + share, cons[i].min, cons[i].max)
  }
  const rest = 100 - sum(out)
  if (Math.abs(rest) < EPS || !n) return out
  const open = out.map((_, i) => i).filter((i) => !isCollapsed(out[i], cons[i]))
  if (!open.length) {
    // 全都折叠了: 展开最后一个来占满
    out[n - 1] += rest
    return out
  }
  const room = 100 - sum(out.filter((_, i) => !open.includes(i)))
  const weight = open.map((i) => (rest < 0 ? cons[i].min : cons[i].max))
  const total = sum(weight)
  for (const [k, i] of open.entries()) out[i] = total > EPS ? (Math.max(0, room) * weight[k]) / total : Math.max(0, room) / open.length
  return out
}

/** 初始布局: 写了 defaultSize 的照写, 其余平分剩下的, 再规范化 */
export function initialLayout(cons: readonly PanelConstraint[]): number[] {
  const known = cons.reduce((acc, c) => acc + (c.defaultSize ?? 0), 0)
  const free = cons.filter((c) => c.defaultSize == null).length
  const each = free ? Math.max(0, 100 - known) / free : 0
  return normalizeLayout(
    cons.map((c) => c.defaultSize ?? each),
    cons
  )
}

/**
 * 只动相邻两个面板的旧算法 (不推挤更远的面板), 保留给需要它的调用方; 组件内部用 resizeAt.
 * 拖动第 a 与 a+1 两个相邻面板之间的把手: delta 为正时 a 变大 b 变小. 只动这两个, 二者之和不变.
 * 任一方越界就停在边界; 两边的约束无法同时满足时保持原样.
 */
export function resizePair(start: readonly number[], cons: readonly PanelConstraint[], a: number, delta: number): number[] {
  const b = a + 1
  if (a < 0 || b >= start.length) return start.slice()
  const total = start[a] + start[b]
  let sa = fitSize(start[a] + delta, cons[a])
  const sb = fitSize(total - sa, cons[b])
  sa = total - sb
  if (Math.abs(fitSize(sa, cons[a]) - sa) > EPS) return start.slice()
  const out = start.slice()
  out[a] = sa
  out[b] = sb
  return out
}

export interface ResizeOptions {
  /** 推挤时允许把被压到最小值的可折叠面板继续压到折叠 (过一半吸附), 默认 true; 键盘方向键传 false */
  collapse?: boolean
}

/**
 * 级联推挤 (VS Code 式): 拖第 a 与 a+1 之间的把手 delta (%), 正数往后推.
 * 变小的一侧从最近的面板开始压到最小值, 还不够就接着压更远的; 全压到最小值后, 可折叠的面板 (由近到远)
 * 在继续推过它可让出空间的一半时吸附折叠, 不到一半就停住. 变大的一侧也由近到远, 各自到 maxSize 为止.
 * 最近的那个变大面板若是折叠的, 推过它最小值的一半才吸附展开到最小值 (与两栏时的手感一致), 远处折叠的面板不会被自动展开.
 * 总和恒为不变; 推不动 (两侧都没余量) 时停在能到的地方. 从拖动开始时的快照算, 拖回去能原样恢复.
 */
export function resizeAt(
  start: readonly number[],
  cons: readonly PanelConstraint[],
  a: number,
  delta: number,
  options: ResizeOptions = {}
): number[] {
  const n = start.length
  if (a < 0 || a + 1 >= n || Math.abs(delta) < EPS) return start.slice()
  const allowCollapse = options.collapse ?? true
  const out = start.slice()
  const grow = delta > 0 ? descending(a) : ascending(a + 1, n)
  const shrink = delta > 0 ? ascending(a + 1, n) : descending(a)
  const open = (i: number) => !isCollapsed(out[i], cons[i])
  const span = (i: number) => cons[i].min - cons[i].collapsedSize
  /** 折叠第 i 个 (已压到最小值或本来就小于最小值) 能让出的空间 */
  const snapGain = (i: number) => Math.max(0, Math.min(out[i], cons[i].min) - cons[i].collapsedSize)
  const near = grow[0]
  const nearClosed = !open(near)

  let capGrow = 0
  for (const i of grow) if (i === near || open(i)) capGrow += Math.max(0, cons[i].max - out[i])
  let capShrink = 0
  let capSnap = 0
  for (const i of shrink) {
    if (!open(i)) continue
    capShrink += Math.max(0, out[i] - cons[i].min)
    if (allowCollapse && cons[i].collapsible) capSnap += snapGain(i)
  }

  const drag = Math.abs(delta)
  let want = Math.min(drag, capGrow, capShrink + capSnap)
  if (nearClosed) {
    const need = span(near)
    // 没推过一半, 或另一侧根本让不出这么多: 保持折叠
    if (drag < need / 2 || need > capShrink + capSnap + EPS || need > capGrow + EPS) return start.slice()
    want = Math.max(want, need)
  }

  // 变小一侧: 先由近到远压到最小值, 再由近到远吸附折叠
  let rest = want
  for (const i of shrink) {
    if (rest <= EPS) break
    if (!open(i)) continue
    const take = Math.min(Math.max(0, out[i] - cons[i].min), rest)
    out[i] -= take
    rest -= take
  }
  if (allowCollapse) {
    for (const i of shrink) {
      if (rest <= EPS) break
      if (!open(i) || !cons[i].collapsible) continue
      const s = snapGain(i)
      // 不到一半停住; 吸附多让出的空间要另一侧装得下
      if (rest < s / 2 - EPS || want - rest + s > capGrow + EPS) break
      out[i] = cons[i].collapsedSize
      rest -= s
    }
  }
  let give = want - rest
  if (nearClosed && give < span(near) - EPS) return start.slice()

  // 变大一侧: 由近到远加到 maxSize
  for (const i of grow) {
    if (give <= EPS) break
    if (i !== near && !open(i)) continue
    const add = Math.min(Math.max(0, cons[i].max - out[i]), give)
    out[i] += add
    give -= add
  }
  // 理论上不会剩; 浮点误差补给最近的变大面板, 保证和不变
  if (Math.abs(give) > 0) out[near] += give
  return out
}

/** 把第 i 个面板设成 target (%), 由相邻一侧级联补差 (优先后面的面板, 最后一个面板用前面的) */
export function setPanelSize(
  sizes: readonly number[],
  cons: readonly PanelConstraint[],
  i: number,
  target: number,
  options?: ResizeOptions
): number[] {
  if (i < 0 || i >= sizes.length || sizes.length < 2) return sizes.slice()
  const delta = target - sizes[i]
  return i + 1 < sizes.length ? resizeAt(sizes, cons, i, delta, options) : resizeAt(sizes, cons, i - 1, -delta, options)
}

export function sameLayout(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < EPS)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function ascending(from: number, to: number): number[] {
  const out: number[] = []
  for (let i = from; i < to; i++) out.push(i)
  return out
}

function descending(from: number): number[] {
  const out: number[] = []
  for (let i = from; i >= 0; i--) out.push(i)
  return out
}

function sum(list: readonly number[]): number {
  return list.reduce((acc, v) => acc + v, 0)
}
