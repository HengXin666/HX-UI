// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Backgrounds 族共用 (单画布, DPR 上限, 离屏停帧) 条目, 实现为 HX 自有.
import { BACKDROP_MAX_TAPS } from "./glsl";
import { approach } from "./math";

/** 一次点击: 归一化坐标与发生时刻 (内核时钟, 秒). */
export interface BackdropTap {
  readonly x: number;
  readonly y: number;
  readonly at: number;
}

/** 指针状态, 坐标是容器内归一化值 (左下 0,0, 右上 1,1), 出界时可超出 0..1. */
export interface PointerState {
  x: number;
  y: number;
  /** 归一化坐标每秒的速度, 停手后按 POINTER_VELOCITY_TAU 衰减. */
  vx: number;
  vy: number;
  inside: boolean;
  down: boolean;
  /** 在场程度 0..1, 进出都平滑过渡, 着色器用它淡入淡出指针效果. */
  presence: number;
  taps: BackdropTap[];
  /** 上一次移动的时刻 (内核时钟, 秒). */
  movedAt: number;
}

/** 进入时在场程度的时间常数 (秒). */
export const POINTER_ENTER_TAU = 0.35;
/** 离开时在场程度的时间常数 (秒), 比进入慢, 效果拖一点尾巴再散. */
export const POINTER_LEAVE_TAU = 0.6;
/** 停手后速度衰减的时间常数 (秒). */
export const POINTER_VELOCITY_TAU = 0.12;
/** 点击记录保留多久 (秒), 过后从队列里清掉. */
export const TAP_LIFETIME = 6;

export function createPointerState(): PointerState {
  const center = 0.5;
  return { x: center, y: center, vx: 0, vy: 0, inside: false, down: false, presence: 0, taps: [], movedAt: 0 };
}

/** 视口坐标换成容器内归一化坐标 (y 朝上). 尺寸为 0 时落在中心. */
export function toLocal(clientX: number, clientY: number, rect: Pick<DOMRect, "left" | "top" | "width" | "height">): readonly [number, number] {
  const center = 0.5;
  const x = rect.width > 0 ? (clientX - rect.left) / rect.width : center;
  const y = rect.height > 0 ? 1 - (clientY - rect.top) / rect.height : center;
  return [x, y];
}

/** 追加一次点击, 超过 max 时丢最旧的. 返回新数组, 不改原数组. */
export function pushTap(taps: readonly BackdropTap[], tap: BackdropTap, max: number = BACKDROP_MAX_TAPS): BackdropTap[] {
  const next = [...taps, tap];
  return next.length > max ? next.slice(next.length - max) : next;
}

/**
 * 每帧推进指针的平滑量: 在场程度逼近 inside, 速度衰减, 过期点击出队.
 *
 * @param state 原地修改的指针状态.
 * @param dt 帧长 (秒).
 * @param now 内核时钟 (秒).
 */
export function stepPointer(state: PointerState, dt: number, now: number): void {
  const goal = state.inside ? 1 : 0;
  state.presence = approach(state.presence, goal, dt, goal > state.presence ? POINTER_ENTER_TAU : POINTER_LEAVE_TAU);
  state.vx = approach(state.vx, 0, dt, POINTER_VELOCITY_TAU);
  state.vy = approach(state.vy, 0, dt, POINTER_VELOCITY_TAU);
  if (state.taps.length && now - state.taps[0].at > TAP_LIFETIME) state.taps = state.taps.filter((t) => now - t.at <= TAP_LIFETIME);
}

/**
 * 在 target 上监听指针. 每个事件都重新量一次矩形 (容器可能随滚动或布局移动),
 * pointercancel 与 pointerleave 一样按离开处理, 不留下卡住的按下态.
 *
 * @param target 监听的元素, 通常是背景的宿主容器.
 * @param state 原地写入的指针状态.
 * @param clock 内核时钟 (秒), 点击与移动用它打时间戳.
 * @param onActivity 有指针活动时回调, 内核用它唤醒停着的帧循环.
 */
export function attachPointer(target: HTMLElement, state: PointerState, clock: () => number, onActivity: () => void): () => void {
  const place = (e: PointerEvent): void => {
    const [x, y] = toLocal(e.clientX, e.clientY, target.getBoundingClientRect());
    const now = clock();
    const span = now - state.movedAt;
    if (state.inside && span > 0) {
      state.vx = (x - state.x) / span;
      state.vy = (y - state.y) / span;
    }
    state.x = x;
    state.y = y;
    state.movedAt = now;
    state.inside = true;
    onActivity();
  };
  const press = (e: PointerEvent): void => {
    place(e);
    state.down = true;
    state.taps = pushTap(state.taps, { x: state.x, y: state.y, at: clock() });
  };
  const release = (): void => {
    state.down = false;
  };
  const leave = (): void => {
    state.down = false;
    state.inside = false;
    onActivity();
  };
  const pairs: ReadonlyArray<readonly [string, (e: PointerEvent) => void]> = [
    ["pointermove", place],
    ["pointerdown", press],
    ["pointerup", release],
    ["pointercancel", leave],
    ["pointerleave", leave],
  ];
  for (const [name, fn] of pairs) target.addEventListener(name, fn as EventListener, { passive: true });
  window.addEventListener("blur", leave);
  return () => {
    for (const [name, fn] of pairs) target.removeEventListener(name, fn as EventListener);
    window.removeEventListener("blur", leave);
  };
}
