/**
 * 展开 / 收起动效 (Unfold) 的纯逻辑: 缓动曲线, 参数归一, 新旧列表合并, 逐行关键帧规划.
 * 不带 "use client": DOM 驱动 (use-unfold.ts) 与自检脚本 (scripts/ui-check.ts) 共用, 服务端也能 import.
 *
 * 模型: 一列按顺序排的行 (树的可见行, 表格的行, 清单项). 展开 = 一段行插进来, 收起 = 一段行离开.
 *   位移: 每行从 "改动前看到的位置" 走到新布局 (FLIP: 先量, 再用 translateY 补回去, 再放开), 全部共用一条缓动和同一个时长,
 *        所以下方的行作为整体平滑让位 / 收拢, 相对位置在每一帧都和插值一致, 不跳.
 *   揭示: 新行不是一起淡入, 而是等下方让出的空间 "盖过" 它的一半时才开始淡入 (slide 再带一点自上而下的位移),
 *        于是子行自上而下依次出现, 和让位同步; 收起反过来, 下方行收上来盖住之前淡出, 自下而上收回.
 *   只动 transform / opacity. 离视口很远的位移只走到视口边缘, 剩下的在视口外一步到位 (大段子树不会一闪而过).
 */

export type UnfoldType = "slide" | "fade" | "none";
/** CSS 缓动: "cubic-bezier(a, b, c, d)", 关键字 (linear / ease / ease-in / ease-out / ease-in-out), 或 4 个控制点 */
export type UnfoldEasing = string | readonly [number, number, number, number];

export interface UnfoldOptions {
  /** slide (默认): 让位 + 自上而下淡入并轻微下移; fade: 让位 + 原地淡入; none: 不做动画 */
  type?: UnfoldType;
  /** 让出 / 收起一行所用的时长 (ms), 默认 220 */
  duration?: number;
  /** 每多一行可见的变化行, 总时长加多少 (ms), 默认 14 */
  stagger?: number;
  /** 总时长封顶 (ms), 默认 380: 一次展开很多行时不会越拖越久 */
  maxDuration?: number;
  /** 让位的缓动, 默认 cubic-bezier(0.22, 1, 0.36, 1) */
  easing?: UnfoldEasing;
}

export interface ResolvedUnfold {
  type: UnfoldType;
  duration: number;
  stagger: number;
  maxDuration: number;
  /** 进度 (0..1) -> 缓动后的进度 */
  ease: (t: number) => number;
  /** ease 的反函数: 缓动后的进度 -> 时间进度 */
  inverse: (y: number) => number;
  /** 纯收起用的曲线: 由 ease 对称化成慢起慢收的 S 形 (起步慢, 底部的行来得及先淡出; 收尾不急停) */
  collapse: (t: number) => number;
  collapseInverse: (y: number) => number;
}

/** 默认缓动与 presets.ts 的 ease.out 相同 (这里不 import, 让本文件不依赖别的模块, 自检脚本可以直接跑) */
export const UNFOLD_DEFAULTS = { type: "slide", duration: 220, stagger: 14, maxDuration: 380, easing: [0.22, 1, 0.36, 1] } as const;

type Bezier = readonly [number, number, number, number];
const EASING_KEYWORDS: Record<string, Bezier> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
};
/** 淡入淡出本身的曲线 (outCubic) */
const FADE_CURVE: Bezier = [0.33, 1, 0.68, 1];
/** 反解 / 求 x 的二分次数: 2^-24 足够细 */
const SOLVE_STEPS = 24;

/** 解析缓动; 认不出时回落默认值 */
export function parseEasing(input: UnfoldEasing | undefined): Bezier {
  if (Array.isArray(input) && input.length === 4 && input.every((n) => Number.isFinite(n))) return input as unknown as Bezier;
  if (typeof input === "string") {
    const s = input.trim().toLowerCase();
    if (EASING_KEYWORDS[s]) return EASING_KEYWORDS[s];
    const m = /^cubic-bezier\(([^)]*)\)$/.exec(s);
    const nums = m ? m[1].split(",").map((x) => Number(x.trim())) : [];
    if (nums.length === 4 && nums.every((n) => Number.isFinite(n))) return [nums[0], nums[1], nums[2], nums[3]];
  }
  return UNFOLD_DEFAULTS.easing;
}

/** 三次贝塞尔缓动 (x1, x2 夹到 0..1, 和 CSS 一致): 先二分解出参数 s 使 x(s) = t, 再求 y(s) */
export function cubicBezier([ax, ay, bx, by]: Bezier): (t: number) => number {
  const x1 = Math.min(1, Math.max(0, ax));
  const x2 = Math.min(1, Math.max(0, bx));
  const coord = (s: number, p1: number, p2: number) => 3 * (1 - s) * (1 - s) * s * p1 + 3 * (1 - s) * s * s * p2 + s * s * s;
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < SOLVE_STEPS; i++) {
      const mid = (lo + hi) / 2;
      if (coord(mid, x1, x2) < t) lo = mid;
      else hi = mid;
    }
    return coord((lo + hi) / 2, ay, by);
  };
}

/** 单调缓动的反函数 (二分): 第一个使 ease(t) >= y 的 t */
export function inverseEase(ease: (t: number) => number): (y: number) => number {
  return (y) => {
    if (y <= 0) return 0;
    if (y >= 1) return 1;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < SOLVE_STEPS; i++) {
      const mid = (lo + hi) / 2;
      if (ease(mid) < y) lo = mid;
      else hi = mid;
    }
    return hi;
  };
}

/** 把一条先快后慢的曲线对称成 S 形: 前半段是它倒放 (慢起), 后半段是它正放 (慢收), 中点速度连续 */
export function symmetricEase(ease: (t: number) => number): (t: number) => number {
  return (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? (1 - ease(1 - 2 * t)) / 2 : (1 + ease(2 * t - 1)) / 2);
}

const positive = (v: number | undefined, fallback: number) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback);

/** 把 Tree 等组件的 animation 参数 (类型名或对象) 归一成完整配置 */
export function resolveUnfold(input?: UnfoldType | UnfoldOptions | null): ResolvedUnfold {
  const o: UnfoldOptions = typeof input === "string" ? { type: input } : (input ?? {});
  const type: UnfoldType = o.type === "fade" || o.type === "none" ? o.type : "slide";
  const duration = positive(o.duration, UNFOLD_DEFAULTS.duration);
  const ease = cubicBezier(parseEasing(o.easing));
  const collapse = symmetricEase(ease);
  return {
    type,
    duration,
    stagger: positive(o.stagger, UNFOLD_DEFAULTS.stagger),
    maxDuration: Math.max(duration, positive(o.maxDuration, UNFOLD_DEFAULTS.maxDuration)),
    ease,
    inverse: inverseEase(ease),
    collapse,
    collapseInverse: inverseEase(collapse),
  };
}

/** 一次改动的总时长: 基础时长 + 每多一行可见变化行加 stagger, 封顶 maxDuration */
export function unfoldDuration(o: Pick<ResolvedUnfold, "duration" | "stagger" | "maxDuration">, changedRows: number): number {
  return Math.min(o.maxDuration, o.duration + o.stagger * Math.max(0, changedRows - 1));
}

/**
 * 新旧列表合并: next 的顺序为准, 离开中的行 (prev 里有, next 里没有, 且 keep 为真) 留在它在 prev 里的前一个仍在的行后面.
 * 收起时子行留在原地播完动画再移除; 动画中途又展开时它们原样回到 next 里, 不重建.
 */
export function mergeUnfoldKeys(prev: readonly string[], next: readonly string[], keep: (key: string) => boolean = () => true): string[] {
  const inNext = new Set(next);
  const lead: string[] = [];
  const after = new Map<string, string[]>();
  let anchor: string | null = null;
  for (const k of prev) {
    if (inNext.has(k)) {
      anchor = k;
      continue;
    }
    if (!keep(k)) continue;
    if (anchor === null) lead.push(k);
    else {
      const list = after.get(anchor);
      if (list) list.push(k);
      else after.set(anchor, [k]);
    }
  }
  const out = [...lead];
  for (const k of next) {
    out.push(k);
    const tail = after.get(k);
    if (tail) out.push(...tail);
  }
  return out;
}

export type UnfoldPhase = "enter" | "stay" | "exit";

/** 规划输入: 一行的布局与当前视觉状态 (坐标都是视口 px) */
export interface UnfoldItem {
  key: string;
  /** enter: 这次新出现; stay: 一直在 (可能在移动, 也可能是半路被叫回来的离开行); exit: 正在离开 */
  phase: UnfoldPhase;
  /** 新布局下的上边 (不含 transform) */
  top: number;
  height: number;
  /** 改动前看到的位置相对新布局的偏移 (stay / exit) */
  y?: number;
  /** 改动前的不透明度 (stay / exit), 默认 1 */
  opacity?: number;
}

export interface UnfoldFrame {
  /** 0..1 */
  offset: number;
  y: number;
  opacity: number;
}

export interface UnfoldTrack {
  /** 这一行的关键帧总时长 (ms); 关键帧线性插值, 已经按缓动采样好 */
  duration: number;
  /** 是否改不透明度 (只移动的行不写 opacity, 不盖住它自己的样式) */
  fades: boolean;
  frames: UnfoldFrame[];
}

export interface UnfoldPlan {
  /** 位移时长 (ms) */
  duration: number;
  /** 全部播完 (含最后一行淡出) 的时刻 (ms): 离开的行在这之后移除 */
  end: number;
  tracks: Map<string, UnfoldTrack>;
}

/** 行被下方让出的空间盖过多少时开始淡入 (行高的比例); 收起时同理, 被盖过这么多时已淡完 */
const REVEAL_AT = 0.5;
/** 淡入淡出时长 = 位移时长 * 比例, 夹在上下限之间 (ms) */
const FADE_RATIO = 0.7;
const FADE_MIN = 90;
const FADE_MAX = 200;
/** 淡出最短时长 (ms) */
const FADE_OUT_MIN = 60;
/** slide 的附加位移: 行高的比例, 封顶 px; 收起时只走一部分 */
const SLIDE_RATIO = 0.3;
const SLIDE_MAX = 8;
const SLIDE_OUT = 0.6;
/** 纯收起比展开快一点 (曲线是对称的 S 形, 见 symmetricEase) */
const COLLAPSE_RATIO = 0.85;
/** 采样间隔 (ms): 小于一帧, 线性插值看不出折线 */
const SAMPLE_MS = 12;
/** 小于它的位移 / 透明度差视为没有 */
const EPS_PX = 0.5;
const EPS_OPACITY = 0.01;

export interface UnfoldView {
  top: number;
  bottom: number;
}

const round = (v: number) => Math.round(v * 100) / 100;
const roundOffset = (v: number) => Math.round(v * 10000) / 10000;

/**
 * 规划一次改动: 每行一条关键帧轨道 (没有可见变化的行不出轨道).
 * items 按显示顺序排, 包含离开中的行; view 是可见区域 (视口与滚动容器的交集).
 */
export function planUnfold(items: readonly UnfoldItem[], view: UnfoldView, o: ResolvedUnfold): UnfoldPlan {
  const n = items.length;
  const tracks = new Map<string, UnfoldTrack>();
  if (!n || o.type === "none") return { duration: 0, end: 0, tracks };

  // 淡入方向: 1 淡入 (新行, 或半路叫回的离开行), -1 淡出, 0 不变
  const dir = items.map((it) => (it.phase === "exit" ? -1 : it.phase === "enter" || (it.opacity ?? 1) < 1 - EPS_OPACITY ? 1 : 0));

  // 终点: 离开的行移除后, 后面的行上移它们占的距离; 离开的行自己跟着它前面的行走
  const yTo: number[] = new Array(n);
  let shift = 0;
  let runShift = 0;
  for (let i = 0; i < n; i++) {
    const it = items[i];
    if (it.phase === "exit") {
      if (i === 0 || items[i - 1].phase !== "exit") runShift = shift;
      yTo[i] = -runShift;
      if (i + 1 < n) shift += items[i + 1].top - it.top;
    } else yTo[i] = -shift;
  }

  // 起点: 已有的行从看到的位置出发; 新行跟着它上面最近的已有行 (锚点) 一起走
  const yFrom: number[] = new Array(n);
  let anchorY = 0;
  for (let i = 0; i < n; i++) {
    const it = items[i];
    if (it.phase === "enter") yFrom[i] = anchorY;
    else {
      yFrom[i] = it.y ?? 0;
      anchorY = yFrom[i];
    }
  }

  const visible = (a: number, b: number) => a < view.bottom && b > view.top;
  let changed = 0;
  let entering = false;
  for (let i = 0; i < n; i++) {
    if (!dir[i]) continue;
    if (dir[i] > 0) entering = true;
    const it = items[i];
    if (visible(it.top + Math.min(yFrom[i], yTo[i]), it.top + Math.max(yFrom[i], yTo[i]) + it.height)) changed++;
  }
  const T = Math.max(1, unfoldDuration(o, changed) * (entering ? 1 : COLLAPSE_RATIO));
  // 有新行时用展开曲线; 纯收起用对称的 S 形
  const curve = entering ? o.ease : o.collapse;
  const curveInverse = entering ? o.inverse : o.collapseInverse;

  // 视口裁剪: 位移量相同的行是一个刚体组; 组的上沿要走出视口底部时只走到视口底部, 剩下的在视口外完成
  const fromE = [...yFrom];
  const toE = [...yTo];
  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const d = yTo[i] - yFrom[i];
    if (Math.abs(d) <= EPS_PX) continue;
    const g = Math.round(d);
    const list = groups.get(g);
    if (list) list.push(i);
    else groups.set(g, [i]);
  }
  for (const [, list] of groups) {
    const d = yTo[list[0]] - yFrom[list[0]];
    if (d > 0) {
      const top0 = Math.min(...list.map((i) => items[i].top + yFrom[i]));
      if (top0 >= view.bottom) for (const i of list) fromE[i] = toE[i] = yTo[i];
      else if (top0 + d > view.bottom) for (const i of list) toE[i] = yFrom[i] + (view.bottom - top0);
    } else {
      const top1 = Math.min(...list.map((i) => items[i].top + yTo[i]));
      const top0 = top1 - d;
      if (top1 >= view.bottom) for (const i of list) fromE[i] = toE[i] = yTo[i];
      else if (top0 > view.bottom) for (const i of list) fromE[i] = yFrom[i] + (view.bottom - top0);
    }
  }

  // 连续同向淡入 / 淡出的行是一段; 段后第一行是 "前沿", 它让开 (或盖上) 时段里的行才出现 (或消失)
  const runEnd: number[] = new Array(n);
  const runStart: number[] = new Array(n);
  for (let i = 0; i < n; i++) runStart[i] = i > 0 && dir[i] && dir[i] === dir[i - 1] ? runStart[i - 1] : i;
  for (let i = n - 1; i >= 0; i--) runEnd[i] = i < n - 1 && dir[i] && dir[i] === dir[i + 1] ? runEnd[i + 1] : i;

  const fade = Math.min(FADE_MAX, Math.max(FADE_MIN, T * FADE_RATIO));
  const fadeEase = cubicBezier(FADE_CURVE);
  let end = T;

  for (let i = 0; i < n; i++) {
    const it = items[i];
    const dy = toE[i] - fromE[i];
    const moves = Math.abs(dy) > EPS_PX;
    const o0 = dir[i] > 0 && it.phase === "enter" ? 0 : (it.opacity ?? 1);
    const o1 = dir[i] < 0 ? 0 : 1;
    const fades = dir[i] !== 0 && Math.abs(o1 - o0) > EPS_OPACITY;
    const slideMax = o.type === "slide" ? Math.min(SLIDE_MAX, it.height * SLIDE_RATIO) : 0;
    // 半路叫回的行已经在场, 不再从上方滑入 (否则第一帧会跳)
    const slide = !fades ? 0 : dir[i] > 0 ? (o0 > EPS_OPACITY ? 0 : slideMax) : slideMax * SLIDE_OUT;
    const lo = it.top + Math.min(fromE[i], toE[i]) - slide;
    const hi = it.top + Math.max(fromE[i], toE[i]) + it.height;
    if ((!moves && !fades) || !visible(lo, hi)) continue;

    // 淡入淡出的时间窗: 前沿与本行下沿的距离 g = A + B * ease(u), 找它越过 -REVEAL_AT * 行高 的时刻
    let fadeStart = 0;
    let fadeEnd = 0;
    if (fades) {
      const a = runStart[i];
      const b = runEnd[i];
      const mine = (e: number) => it.top + fromE[i] + dy * e + it.height;
      let front: (e: number) => number;
      if (b + 1 < n) {
        const f = b + 1;
        front = (e) => items[f].top + fromE[f] + (toE[f] - fromE[f]) * e;
      } else {
        // 段在最后, 下面没有行: 假想一条跟着段首走的前沿, 扫过整段
        const span = items[b].top + items[b].height - items[a].top;
        front = (e) => items[a].top + fromE[a] + (toE[a] - fromE[a]) * e + span * (dir[i] > 0 ? e : 1 - e);
      }
      const A = front(0) - mine(0);
      const B = front(1) - mine(1) - A;
      const thr = -it.height * REVEAL_AT;
      if (dir[i] > 0) {
        const e = A >= thr ? 0 : B > 0 ? Math.min(1, (thr - A) / B) : 1;
        fadeStart = curveInverse(e) * T;
        fadeEnd = fadeStart + fade;
      } else {
        const e = A <= thr ? 0 : B < 0 ? Math.min(1, (thr - A) / B) : 1;
        fadeEnd = curveInverse(e) * T;
        fadeStart = Math.max(0, fadeEnd - fade);
        fadeEnd = Math.max(fadeEnd, fadeStart + FADE_OUT_MIN);
      }
    }

    const length = Math.max(moves ? T : 0, fades ? fadeEnd : 0);
    const times = new Set<number>();
    const steps = Math.max(2, Math.ceil(length / SAMPLE_MS));
    for (let k = 0; k <= steps; k++) times.add((length * k) / steps);
    for (const t of [fadeStart, fadeEnd, T]) if (t > 0 && t < length) times.add(t);
    const frames: UnfoldFrame[] = [...times]
      .sort((x, y) => x - y)
      .map((t) => {
        const move = moves ? fromE[i] + dy * curve(Math.min(1, t / T)) : fromE[i];
        let opacity = it.opacity ?? 1;
        let off = 0;
        if (fades) {
          const p = t <= fadeStart ? 0 : t >= fadeEnd ? 1 : fadeEase((t - fadeStart) / (fadeEnd - fadeStart));
          opacity = o0 + (o1 - o0) * p;
          off = dir[i] > 0 ? -slide * (1 - p) : -slide * p;
        }
        return { offset: roundOffset(t / length), y: round(move + off), opacity: round(opacity) };
      });
    frames[0].offset = 0;
    frames[frames.length - 1].offset = 1;
    tracks.set(it.key, { duration: Math.round(length), fades, frames });
    end = Math.max(end, length);
  }
  return { duration: Math.round(T), end: Math.round(end), tracks };
}

/** 轨道在 t (ms) 时的值 (关键帧之间线性插值); 被新的改动打断时用它接上当前的不透明度 */
export function sampleUnfold(track: UnfoldTrack, t: number): { y: number; opacity: number } {
  const { frames } = track;
  const at = track.duration > 0 ? Math.min(1, Math.max(0, t / track.duration)) : 1;
  let i = 1;
  while (i < frames.length - 1 && frames[i].offset < at) i++;
  const a = frames[i - 1];
  const b = frames[i] ?? a;
  const span = b.offset - a.offset;
  const p = span > 0 ? Math.min(1, Math.max(0, (at - a.offset) / span)) : 1;
  return { y: a.y + (b.y - a.y) * p, opacity: a.opacity + (b.opacity - a.opacity) * p };
}
