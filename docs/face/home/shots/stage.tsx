import { useEffect, useState, type CSSProperties, type JSX, type ReactNode } from "react";
import { stepSpring, type SpringSpec } from "../../../../src/craft";
import { DT_MIN_MS } from "../../../../src/craft/tokens";
import { MEDIA_REDUCED_MOTION } from "../../../../src/constants/ui";
import { SHOT_ARC_S, SHOT_BEAT_S } from "../../../../src/motion/shots";
import { stageSpan, useStageMs } from "../use-clock";

/** 顶栏高度. FaceApp 的顶栏用它定高, 舞台用它做 sticky top 并从视口高里扣掉, 第一行内容不会被顶栏压住. */
export const HEADER_PX = 48;
const STAGE_HEIGHT = `calc(100svh - ${HEADER_PX}px)`;

/** 舞台每 1ms 镜头时间对应的滚动距离. 一镜 3000ms 约等于 900px 滚动. */
export const PX_PER_MS = 0.3;
const MS = 1000;
/** 首页借来的整页里有自己的入场镜头 (标题推近, 逐拍入画); 预热时间盖住它们最长的一拍. */
const WARM_BEATS = 4;
const WARM_MS = (SHOT_ARC_S + SHOT_BEAT_S * WARM_BEATS) * MS;
/** 预热层缩到这么小, 整页都落在视口里, 入场镜头一次全部播完. */
const WARM_SCALE = 0.12;
const MEDIA_WIDE = "(min-width: 768px)";

export const STAGE_CLASS = {
  kicker: "font-mono text-xs tracking-[0.12em] text-muted-foreground",
  title: "mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl",
  lede: "mt-3 max-w-[34rem] text-sm leading-[1.8] text-muted-foreground",
  wrap: "mx-auto w-full max-w-[78rem] px-5 md:px-8 lg:px-14",
} as const;

export interface StageApi {
  /** 当前镜头毫秒, 已落到整帧. */
  readonly ms: number;
  /** 滚到这一镜的某一毫秒. 点击控件时用, 让动作仍由滚动进度驱动. */
  readonly seek: (ms: number) => void;
}

/**
 * 一镜一个 sticky 舞台: 舞台铺满视口, 轨道长度 = 镜头时长 × PX_PER_MS.
 * 舞台本身始终在画面里, 不会出现内容停在透明里等滚动的空洞.
 */
export function Stage({
  id,
  total,
  label,
  className,
  children,
}: {
  readonly id: string;
  readonly total: number;
  readonly label: string;
  readonly className?: string;
  readonly children: (api: StageApi) => ReactNode;
}): JSX.Element {
  const [track, setTrack] = useState<HTMLElement | null>(null);
  const ms = useStageMs(track, total);
  const seek = (target: number): void => {
    if (!track) return;
    const span = stageSpan(track);
    const smooth = window.matchMedia?.(MEDIA_REDUCED_MOTION).matches ? "auto" : "smooth";
    window.scrollTo({ top: span.start + (Math.min(total, Math.max(0, target)) / total) * span.length, behavior: smooth });
  };
  return (
    <section
      ref={setTrack}
      data-shot={id}
      data-shot-ms={ms}
      data-shot-total={total}
      aria-label={label}
      className="relative border-b border-border"
      style={{ height: `calc(${STAGE_HEIGHT} + ${Math.round(total * PX_PER_MS)}px)` }}
    >
      <div className={`sticky overflow-hidden ${className ?? ""}`} style={{ top: HEADER_PX, height: STAGE_HEIGHT }}>
        {children({ ms, seek })}
      </div>
    </section>
  );
}

/**
 * 弹簧从 0 走到 1 的位置, 纯时间函数: 固定 8ms 步长积分, 步间线性插值.
 * 镜头里用 thumb 弹簧的地方都靠它, 同一毫秒永远是同一个值.
 */
export function springAt(spec: SpringSpec, ms: number): number {
  if (ms <= 0) return 0;
  const steps = Math.floor(ms / DT_MIN_MS);
  let current = 0;
  let velocity = 0;
  let previous = 0;
  for (let i = 0; i <= steps; i += 1) {
    previous = current;
    const next = stepSpring(current, velocity, 1, spec, DT_MIN_MS);
    current = next.current;
    velocity = next.velocity;
  }
  const rest = (ms - steps * DT_MIN_MS) / DT_MIN_MS;
  return previous + (current - previous) * rest;
}

/** 窄屏 (小于 md) 时为 false. 镜 4 据此改成上下叠. */
export function useWide(): boolean {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const query = window.matchMedia?.(MEDIA_WIDE);
    if (!query) return;
    const read = (): void => setWide(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);
  return wide;
}

const WARM_STYLE: CSSProperties = {
  position: "fixed",
  left: 0,
  top: 0,
  transform: `scale(${WARM_SCALE})`,
  transformOrigin: "0 0",
  opacity: 0,
  pointerEvents: "none",
  zIndex: -1,
};

/**
 * 预热: 借来的整页 (FieldPage / KilnPage) 自带视口入场. 挂载后先把它缩小放进视口, 让那些入场一次播完,
 * 再放回舞台. 同一个元素只换样式, 不重挂载, 所以到了舞台里它已经是静止的落幅.
 * 预热时它是 fixed, 祖先不能有 transform, 所以镜头的位移直接写在它自己的 style 上.
 * 减弱动效时那些入场本来就直接是落幅, 不预热.
 */
export function Warm({
  width,
  style,
  className,
  part,
  children,
  onReady,
}: {
  readonly width: number;
  readonly style?: CSSProperties;
  readonly className?: string;
  readonly part?: string;
  readonly children: ReactNode;
  readonly onReady?: () => void;
}): JSX.Element {
  const [warm, setWarm] = useState(true);
  useEffect(() => {
    if (window.matchMedia?.(MEDIA_REDUCED_MOTION).matches) {
      setWarm(false);
      return;
    }
    const timer = window.setTimeout(() => setWarm(false), WARM_MS);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!warm) onReady?.();
    // onReady 只在预热结束时叫一次.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warm]);
  return (
    <div
      data-shot-part={part}
      data-warm={warm ? "" : undefined}
      aria-hidden={warm || undefined}
      className={warm ? undefined : className}
      style={warm ? { ...WARM_STYLE, width } : { ...style, width }}
    >
      {children}
    </div>
  );
}
