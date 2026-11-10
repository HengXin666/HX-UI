// 行为规格参照 docs/research/catalog/animations.md 的 HalftoneReveal 条目, 实现为 HX 自有.
/**
 * DotReveal 的 JS 侧状态: 平滑跟手点, 在场程度, 漫游渐入, 点击爆开队列. 坐标是 CSS 像素, y 从顶部量.
 * 遮罩本身在乒乓通道里 (见 dot-shader), 这里只算每帧喂给它的画笔.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-scene.md
 */
import { DOT } from "../tokens";

export interface DotBurst {
  readonly x: number;
  readonly y: number;
  /** 出生时刻 (内核 elapsed 秒). */
  readonly at: number;
}

export interface DotState {
  x: number;
  y: number;
  /** 上一帧画笔落点, 这一帧从它连到 (x, y) 画一段. */
  fromX: number;
  fromY: number;
  presence: number;
  drift: number;
  placed: boolean;
  bursts: DotBurst[];
  seen: Set<number>;
}

export interface DotInput {
  readonly x: number;
  readonly y: number;
  readonly inside: boolean;
  readonly width: number;
  readonly height: number;
  readonly taps: readonly DotBurst[];
}

export interface DotTuning {
  readonly wander: boolean;
  readonly clickBurst: boolean;
  /** 爆开一次多少秒, 默认 DOT.burstSeconds (BayerVeil 传自己的 1.2). */
  readonly burstSeconds?: number;
}

export function makeDot(): DotState {
  return { x: 0, y: 0, fromX: 0, fromY: 0, presence: 0, drift: 0, placed: false, bursts: [], seen: new Set() };
}

/** 漫游路径: 绕中心的慢李萨如曲线. */
export function dotWanderPath(t: number, width: number, height: number): { x: number; y: number } {
  const { fx, fy, amp } = DOT.wander;
  return { x: width * (0.5 + amp * Math.sin(t * fx * Math.PI * 2)), y: height * (0.5 + amp * Math.sin(t * fy * Math.PI * 2 + 1.3)) };
}

/** 推进一帧. dt 为真实帧长, now 为内核 elapsed. */
export function stepDot(s: DotState, dt: number, now: number, input: DotInput, tuning: DotTuning): DotState {
  const step = Math.min(DOT.maxDt, Math.max(0, dt));
  const roaming = tuning.wander && !input.inside;
  s.drift = roaming ? Math.min(1, s.drift + step / DOT.driftSeconds) : 0;
  const engaged = input.inside || roaming;
  s.presence += ((engaged ? 1 : 0) - s.presence) * (1 - Math.exp(-step / DOT.presenceTau));
  const target = input.inside ? input : roaming ? dotWanderPath(now, input.width, input.height) : { x: s.x, y: s.y };
  s.fromX = s.x;
  s.fromY = s.y;
  if (!s.placed && engaged) {
    s.x = s.fromX = target.x;
    s.y = s.fromY = target.y;
    s.placed = true;
  } else {
    const follow = 1 - Math.exp(-step / DOT.followTau);
    s.x += (target.x - s.x) * follow;
    s.y += (target.y - s.y) * follow;
  }
  if (tuning.clickBurst) {
    for (const tap of input.taps) {
      if (s.seen.has(tap.at)) continue;
      s.seen.add(tap.at);
      s.bursts.push(tap);
    }
  }
  const life = tuning.burstSeconds ?? DOT.burstSeconds;
  s.bursts = s.bursts.filter((b) => now - b.at < life).slice(-DOT.maxBursts);
  for (const at of s.seen) if (now - at > life * 2) s.seen.delete(at);
  return s;
}

/** 爆开队列打包成 vec4[MAX_BURSTS]: xy 中心, z 进度 0..1, w 有效. */
export function packBursts(s: DotState, now: number, life: number = DOT.burstSeconds): Float32Array {
  const out = new Float32Array(DOT.maxBursts * 4);
  s.bursts.forEach((b, i) => out.set([b.x, b.y, Math.min(1, Math.max(0, (now - b.at) / life)), 1], i * 4));
  return out;
}

/** 遮罩每帧的褪色量: linger 秒褪完, 不低于 minFade. */
export function dotFade(dt: number, linger: number): number {
  return Math.max(linger > 0 ? dt / linger : 1, DOT.minFade);
}

/** 图片底色 (0..1 的 RGB): 缩到 matteGrid 见方后取四角像素平均. 画布不可用或跨域读不出时返回 null, 抠像随之关闭. */
export function dotMatte(img: CanvasImageSource): [number, number, number] | null {
  const n = DOT.matteGrid;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = n;
    canvas.height = n;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, n, n);
    const px = ctx.getImageData(0, 0, n, n).data;
    const sum = [0, 0, 0];
    for (const [x, y] of [[0, 0], [n - 1, 0], [0, n - 1], [n - 1, n - 1]] as const) {
      const i = (y * n + x) * 4;
      for (let c = 0; c < 3; c += 1) sum[c] = (sum[c] ?? 0) + (px[i + c] ?? 0);
    }
    return [(sum[0] ?? 0) / 1020, (sum[1] ?? 0) / 1020, (sum[2] ?? 0) / 1020];
  } catch {
    return null;
  }
}
