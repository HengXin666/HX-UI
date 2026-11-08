/**
 * L1 唯一的按需 rAF 帧循环. tick 返回 true 继续, false 停; wake 幂等, 只在停着时排帧.
 * 帧长由 frameDelta 统一算: 第一帧按 firstFrameMs, 可选 maxDtMs 上限. 控件各族与驱动都建在它上面.
 *
 * .agents/notes/implemented/feature/2026-11-08-motion-spring-frame.md
 */

/** 第一帧没有上一帧时间, 按 60Hz 一帧计. */
export const FIRST_FRAME_MS = 16;

/** 参数是毫秒帧长与当前时间戳; 返回 true 继续下一帧. */
export type FrameTick = (dtMs: number, now: number) => boolean;

export interface FrameClockOptions {
  /** 第一帧的帧长, 默认 FIRST_FRAME_MS. */
  readonly firstFrameMs?: number;
  /** 帧长上限 (只钳后续帧), 默认不钳; 积分器多半自带上限. */
  readonly maxDtMs?: number;
}

export interface FrameLoop {
  /** 换上每帧回调并唤醒. 正在跑时只换回调, 不重置时间. */
  readonly start: (tick: FrameTick) => void;
  /** 用当前回调唤醒; 已在跑或环境没有 rAF 时什么都不做. */
  readonly wake: () => void;
  readonly stop: () => void;
  readonly running: () => boolean;
}

/** 帧长 (毫秒). last 为 0 表示第一帧. */
export function frameDelta(now: number, last: number, options: FrameClockOptions = {}): number {
  const { firstFrameMs = FIRST_FRAME_MS, maxDtMs = Number.POSITIVE_INFINITY } = options;
  return last ? Math.min(maxDtMs, now - last) : firstFrameMs;
}

/**
 * 不依赖 React 的帧循环. 回调里调用 stop 或先 stop 再 wake 时, 以回调里的调用为准, 本帧不再续排.
 *
 * @param tick 每帧回调, 也可以之后由 start 换上.
 * @param options 第一帧帧长与帧长上限.
 */
export function createFrameLoop(tick?: FrameTick, options: FrameClockOptions = {}): FrameLoop {
  let frame = 0;
  let last = 0;
  /** 每次 stop 或重新排帧加一. 回调里用它判断自己是否已被打断, 不依赖 rAF 句柄是否复用. */
  let generation = 0;
  let current = tick;

  const loop = (now: number): void => {
    const dt = frameDelta(now, last, options);
    last = now;
    const token = generation;
    const keep = current?.(dt, now) ?? false;
    if (generation !== token) return;
    if (keep) {
      frame = requestAnimationFrame(loop);
      return;
    }
    frame = 0;
    last = 0;
  };

  const wake = (): void => {
    if (frame || typeof requestAnimationFrame === "undefined") return;
    last = 0;
    generation += 1;
    frame = requestAnimationFrame(loop);
  };

  return {
    start: (next) => {
      current = next;
      wake();
    },
    wake,
    stop: () => {
      if (frame) cancelAnimationFrame(frame);
      generation += 1;
      frame = 0;
      last = 0;
    },
    running: () => frame !== 0,
  };
}
