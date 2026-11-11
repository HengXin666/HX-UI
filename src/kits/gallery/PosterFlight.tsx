"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 FlyingPosters 条目, 实现为 HX 自有.
// ENGINE-GAP: 规格在 WebGL 里用自带投影与相机 (cameraFov, cameraZ) 把海报网格按速度弯曲 (distortion), 并做明暗 (shading) 与圆角遮罩.
// 内核没有顶点通道, 这里用 CSS 透视与整张海报的旋转和斜切近似, 网格不弯, 无明暗.

import { useEffect, useRef, type JSX, type WheelEvent } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cn } from "../../primitives/utils";
import { followFactor } from "./parts/bend-spec";
import { useDrag } from "./parts/use-drag";
import * as P from "./parts/poster-spec";
import { KIT_FOCUS, MS_PER_S, useKitMotion } from "../tokens";

export { POSTER_DEFAULTS, posterPose, posterSkew, posterY, smoothRate, type PosterAxis } from "./parts/poster-spec";

export interface PosterItem {
  readonly image: string;
  readonly alt: string;
}

export interface PosterFlightProps {
  readonly items: readonly PosterItem[];
  readonly planeWidth?: number;
  readonly planeHeight?: number;
  /** 速度带来的斜切强度. */
  readonly distortion?: number;
  readonly scrollEase?: number;
  readonly gap?: number;
  readonly columns?: number;
  readonly columnGap?: number;
  /** 相邻列反向滚动. */
  readonly alternate?: boolean;
  /** 穿过视口时转过的角度 deg. */
  readonly rotation?: number;
  readonly axis?: P.PosterAxis;
  /** 自动滚动 px/s. */
  readonly speed?: number;
  /** 速度带来的倾斜强度 (1 时满速倾斜 20 度). */
  readonly lean?: number;
  /** 边缘渐隐宽度, 半高的比例. */
  readonly fade?: number;
  readonly wheel?: boolean;
  readonly drag?: boolean;
  readonly height?: number;
  readonly onItemClick?: (index: number) => void;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * 飞行海报: 海报排成一列或几列循环带, 滚轮与拖拽推目标位置, 实际位置按规格的帧率无关跟随 (scrollEase 0.01) 追上;
 * 每张海报穿过视口时绕所选轴转过 rotation, 速度越快斜切越大, 可随速度整体倾斜. 减弱动效时位置直接跳, 无旋转外的动感形变, 不自动滚动.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */
export function PosterFlight({
  items,
  planeWidth = P.POSTER_DEFAULTS.planeWidth,
  planeHeight = P.POSTER_DEFAULTS.planeHeight,
  distortion = P.POSTER_DEFAULTS.distortion,
  scrollEase = P.POSTER_DEFAULTS.scrollEase,
  gap = planeHeight * P.POSTER_GAP_RATIO,
  columns = P.POSTER_DEFAULTS.columns,
  columnGap = P.POSTER_DEFAULTS.columnGap,
  alternate = true,
  rotation = P.POSTER_DEFAULTS.rotation,
  axis = "vertical",
  speed = P.POSTER_DEFAULTS.speed,
  lean = P.POSTER_DEFAULTS.lean,
  fade = P.POSTER_DEFAULTS.fade,
  wheel = true,
  drag = true,
  height = 640,
  onItemClick,
  ariaLabel = "Posters",
  className,
}: PosterFlightProps): JSX.Element {
  const reduced = useReducedMotion();
  const cols = Math.max(1, Math.round(columns));
  const perCol = Math.ceil(items.length / cols);
  const pitch = planeHeight + gap;
  const total = perCol * pitch;
  const nodes = useRef<Array<HTMLButtonElement | null>>([]);
  const layer = useRef<HTMLDivElement>(null);
  const s = useRef({ scroll: 0, target: 0, velocity: 0, lean: 0, start: 0 });

  const paint = (): void => {
    const st = s.current;
    const skew = reduced ? 0 : P.posterSkew(st.velocity, distortion);
    if (layer.current) layer.current.style.transform = `rotate(${reduced ? 0 : st.lean}deg)`;
    nodes.current.forEach((node, i) => {
      if (!node) return;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const flip = alternate && col % 2 === 1 ? -1 : 1;
      const y = P.posterY(row * pitch, flip * st.scroll, total);
      const pose = P.posterPose(y, height / 2, rotation, axis, fade);
      const x = (col - (cols - 1) / 2) * (planeWidth + columnGap);
      node.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) ${pose.rotate} skewY(${flip * skew}deg)`;
      node.style.opacity = String(pose.opacity);
    });
  };
  const motion = useKitMotion(paint, reduced, (dtMs) => {
    const st = s.current;
    if (speed && !reduced) st.target += (speed * dtMs) / MS_PER_S;
    const before = st.scroll;
    st.scroll = reduced ? st.target : st.scroll + (st.target - st.scroll) * followFactor(scrollEase, dtMs);
    const v = dtMs > 0 ? ((st.scroll - before) * MS_PER_S) / dtMs : 0;
    st.velocity = P.smoothRate(st.velocity, v, P.POSTER_VELOCITY_RATE, dtMs);
    st.lean = P.smoothRate(st.lean, lean * P.posterSkew(st.velocity, 1), P.POSTER_LEAN_RATE, dtMs);
    const moving = Math.abs(st.target - st.scroll) > 0.05 || Math.abs(st.velocity) > 0.5;
    if (!moving && !speed) {
      st.scroll = st.target;
      st.velocity = 0;
    }
    return moving || Boolean(speed && !reduced);
  });

  useEffect(() => {
    motion.paint();
    if (speed) motion.wake();
    // 挂上与配置变化时重摆
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, cols, speed]);

  const aim = (target: number): void => {
    s.current.target = target;
    if (reduced) s.current.scroll = target;
    motion.wake();
    motion.paint();
  };
  const dragging = useDrag(
    {
      onStart: () => {
        s.current.start = s.current.target;
      },
      onMove: (_dx, dy) => aim(s.current.start - dy * P.POSTER_INPUT_GAIN),
      onEnd: () => {},
    },
    drag,
  );
  const onWheel = (event: WheelEvent<HTMLElement>): void => {
    if (!wheel) return;
    aim(s.current.target + event.deltaY * P.POSTER_INPUT_GAIN);
  };

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      onWheel={onWheel}
      data-slot="poster-flight"
      className={cn("relative w-full touch-none select-none overflow-hidden", className)}
      style={{ height, perspective: height * 2 }}
      {...dragging.bind}
    >
      <div ref={layer} data-slot="poster-flight-layer" className="absolute inset-0">
        {items.map((item, i) => (
          <button
            key={i}
            ref={(node) => {
              nodes.current[i] = node;
            }}
            type="button"
            aria-label={item.alt}
            data-slot="poster-flight-poster"
            onClick={() => {
              if (!dragging.dragged()) onItemClick?.(i);
            }}
            className={cn("absolute left-1/2 top-1/2 overflow-hidden border-0 p-0 will-change-transform", KIT_FOCUS)}
            style={{ width: planeWidth, height: planeHeight }}
          >
            <img src={item.image} alt="" draggable={false} className="size-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
