"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 HoloCard 条目, 实现为 HX 自有.
// ENGINE-GAP: 规格是 WebGL 箔面着色器 (逐像素图案, 裂纹, 星点, 菲涅尔光谱与掠射角). 这里是 CSS 渐变遮罩近似, 见 note.

import { useEffect, useRef, useState, type JSX, type PointerEvent } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cn } from "../../primitives/utils";
import * as F from "./parts/foil-spec";
import { TILT_FOLLOW, TILT_SETTLE, glarePose, tiltTarget } from "./parts/tilt";
import { KIT_FOCUS, cardPoint, kitTone, transitionOf, useKitMotion, type KitTone } from "./tokens";

export { FOIL_SPECTRUM, foilIdle, foilPattern, foilRainbow, foilShift, type FoilPreset } from "./parts/foil-spec";

export interface FoilCardProps {
  readonly image: string;
  readonly backImage?: string;
  readonly alt?: string;
  readonly preset?: F.FoilPreset;
  readonly intensity?: number;
  readonly scale?: number;
  readonly edgeSparkle?: number;
  readonly frame?: number;
  readonly glare?: number;
  readonly foilTone?: KitTone;
  readonly width?: number;
  readonly radius?: number;
  readonly tiltMax?: number;
  readonly hoverScale?: number;
  readonly idle?: boolean;
  readonly shadow?: boolean;
  readonly className?: string;
}

/**
 * 全息卡: 63:88 的卡面, 图片上盖一层按 preset 图案遮罩的彩虹箔, 色带随倾斜横移; 边框 frame px, 边缘一圈彩光 edgeSparkle.
 * 指针在卡上时卡面倾向指针 (tiltMax 度) 并放大到 hoverScale, 高光随指针; 无指针时 idle 漂移. 有 backImage 时点击或键盘翻到背面.
 * 减弱动效时不倾斜, 不漂移, 翻面直接到位, 箔面停在中位.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-card.md
 */
export function FoilCard({
  image,
  backImage,
  alt = "",
  preset = "bursts",
  intensity = F.FOIL_DEFAULTS.intensity,
  scale = F.FOIL_DEFAULTS.scale,
  edgeSparkle = F.FOIL_DEFAULTS.edgeSparkle,
  frame = F.FOIL_DEFAULTS.frame,
  glare = F.FOIL_DEFAULTS.glare,
  foilTone = "muted",
  width = F.FOIL_DEFAULTS.width,
  radius = F.FOIL_DEFAULTS.radius,
  tiltMax = F.FOIL_DEFAULTS.tiltMax,
  hoverScale = F.FOIL_DEFAULTS.hoverScale,
  idle = true,
  shadow = true,
  className,
}: FoilCardProps): JSX.Element {
  const still = useReducedMotion();
  const face = useRef<HTMLDivElement>(null);
  const [back, setBack] = useState(false);
  const s = useRef({ hover: false, t: 0, gx: 50, gy: 50 });
  const flippable = Boolean(backImage);

  const motion = useKitMotion(
    (m) => {
      const node = face.current;
      if (!node) return;
      const rx = m.get("rx");
      const ry = m.get("ry");
      const sh = F.foilShift(ry, rx, tiltMax);
      const sc = 1 + (hoverScale - 1) * m.get("lift");
      node.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${(ry + m.get("flip")).toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      node.style.setProperty("--fx", `${sh.x.toFixed(1)}%`);
      node.style.setProperty("--fy", `${sh.y.toFixed(1)}%`);
      node.style.setProperty("--gx", `${s.current.gx.toFixed(1)}%`);
      node.style.setProperty("--gy", `${s.current.gy.toFixed(1)}%`);
      node.style.setProperty("--lift", m.get("lift").toFixed(3));
    },
    still,
    (dtMs) => {
      const st = s.current;
      if (!idle || still || st.hover) return false;
      st.t += dtMs / 1000;
      const t = F.foilIdle(st.t, tiltMax);
      motion.spring("rx", t.rx, TILT_SETTLE);
      motion.spring("ry", t.ry, TILT_SETTLE);
      return true;
    },
  );
  useEffect(() => {
    motion.spring("flip", back ? 180 : 0, TILT_SETTLE);
    motion.wake();
  }, [back, motion]);

  const onMove = (event: PointerEvent<HTMLDivElement>): void => {
    const p = cardPoint(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);
    const g = glarePose(p.nx, p.ny);
    Object.assign(s.current, { hover: true, gx: g.x, gy: g.y });
    const t = still ? { rx: 0, ry: 0 } : tiltTarget(p.nx, p.ny, tiltMax);
    motion.spring("rx", t.rx, TILT_FOLLOW);
    motion.spring("ry", t.ry, TILT_FOLLOW);
    motion.spring("lift", still ? 0 : 1, TILT_FOLLOW);
  };
  const onLeave = (): void => {
    Object.assign(s.current, { hover: false, gx: 50, gy: 50 });
    for (const id of ["rx", "ry", "lift"]) motion.spring(id, 0, TILT_SETTLE);
    motion.wake();
  };
  const fade = transitionOf([["opacity", F.FOIL_FADE_MS, "ease"]], still);
  const layer = "pointer-events-none absolute inset-0 rounded-[inherit]";
  const sideStyle = { borderRadius: radius, border: `${frame}px solid ${kitTone(foilTone)}`, backfaceVisibility: "hidden" } as const;

  return (
    <div data-slot="foil-card" className={cn("relative", className)} style={{ width, aspectRatio: `${F.FOIL_RATIO}`, perspective: F.FOIL_PERSPECTIVE }}>
      <div
        ref={face}
        data-slot="foil-card-face"
        role={flippable ? "button" : "img"}
        tabIndex={flippable ? 0 : undefined}
        aria-label={alt || undefined}
        aria-pressed={flippable ? back : undefined}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onPointerCancel={onLeave}
        onClick={() => flippable && setBack((v) => !v)}
        onKeyDown={(event) => {
          if (!flippable || (event.key !== "Enter" && event.key !== " ")) return;
          event.preventDefault();
          setBack((v) => !v);
        }}
        className={cn("relative h-full w-full [transform-style:preserve-3d]", flippable && "cursor-pointer", KIT_FOCUS)}
        style={{ borderRadius: radius }}
      >
        {shadow ? <span aria-hidden className={layer} style={{ boxShadow: "var(--shadow-xl)", opacity: "calc(0.5 + 0.5 * var(--lift, 0))" }} /> : null}
        <div className="absolute inset-0 overflow-hidden bg-card" style={sideStyle}>
          <img src={image} alt="" draggable={false} className="h-full w-full object-cover" />
          <span
            aria-hidden
            data-slot="foil-card-foil"
            className={layer}
            style={{ background: F.foilRainbow(115), backgroundSize: "300% 300%", backgroundPosition: "var(--fx, 50%) var(--fy, 50%)", mask: F.foilPattern(preset, scale), mixBlendMode: "color-dodge", opacity: intensity * 0.6, transition: fade }}
          />
          {edgeSparkle > 0 ? (
            <span
              aria-hidden
              data-slot="foil-card-edge"
              className={layer}
              style={{ background: F.foilRainbow(45), backgroundSize: "300% 300%", backgroundPosition: "var(--fx, 50%) var(--fy, 50%)", mask: "radial-gradient(farthest-side, transparent 82%, black)", mixBlendMode: "screen", opacity: `calc(${edgeSparkle} * (0.35 + 0.65 * var(--lift, 0)))` }}
            />
          ) : null}
          {glare > 0 ? (
            <span aria-hidden data-slot="foil-card-glare" className={layer} style={{ background: "radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), color-mix(in oklab, white 70%, transparent), transparent 50%)", mixBlendMode: "overlay", opacity: `calc(${glare} * var(--lift, 0))`, transition: fade }} />
          ) : null}
        </div>
        {backImage ? (
          <div data-slot="foil-card-back" aria-hidden={!back} className="absolute inset-0 overflow-hidden bg-card" style={{ ...sideStyle, transform: "rotateY(180deg)" }}>
            <img src={backImage} alt="" draggable={false} className="h-full w-full object-cover" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
