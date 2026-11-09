"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 ReflectiveCard 条目, 实现为 HX 自有.
// ENGINE-GAP: 规格是 WebGL 金属反射 (视频 / 摄像头纹理按法线扭曲, 粗糙度高斯模糊, 倒角光照). 这里是 CSS 叠层近似, 见 note.

import { useEffect, useRef, type JSX, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { prefersReducedMotion } from "../../primitives/motion";
import { cn } from "../../primitives/utils";
import * as M from "./parts/mirror-spec";
import { TILT_FOLLOW, TILT_SETTLE, tiltTarget } from "./parts/tilt";
import { cardPoint, follow, kitTone, useKitMotion, type KitTone } from "./tokens";

export { MIRROR_DEFAULTS, MIRROR_INTRO_MS, mirrorFilter, mirrorMetal, mirrorSheen } from "./parts/mirror-spec";

export interface MirrorCardProps {
  readonly name?: string;
  readonly role?: string;
  readonly badge?: string;
  readonly status?: string;
  readonly statusTone?: KitTone;
  readonly idLabel?: string;
  readonly idValue?: string;
  readonly children?: ReactNode;
  readonly videoSrc?: string;
  readonly webcam?: boolean;
  readonly onWebcamError?: (error: unknown) => void;
  readonly tintTone?: KitTone;
  readonly metalness?: number;
  readonly roughness?: number;
  readonly blurStrength?: number;
  readonly grayscale?: number;
  readonly warp?: number;
  readonly shine?: number;
  readonly bevel?: number;
  readonly glare?: number;
  readonly enableTilt?: boolean;
  readonly tiltStrength?: number;
  readonly className?: string;
}

/**
 * 镜面证件卡: 金属面上印徽标, 姓名, 职位, 状态与编号. 有 videoSrc 或 webcam 时把画面镜像, 模糊, 去色后作反射层, 就绪后 0.35s 淡入.
 * 挂上时一道光 1.4s 扫过; 之后光随倾斜摆动. 指针在卡上时倾向指针 (120 / 16), 离开归位 (24 / 9).
 * 减弱动效时不扫光不倾斜, 反射层直接出现.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-card.md
 */
export function MirrorCard({
  name = "",
  role,
  badge,
  status,
  statusTone = "success",
  idLabel = "ID number",
  idValue,
  children,
  videoSrc,
  webcam = false,
  onWebcamError,
  tintTone = "foreground",
  metalness = M.MIRROR_DEFAULTS.metalness,
  roughness = M.MIRROR_DEFAULTS.roughness,
  blurStrength = M.MIRROR_DEFAULTS.blurStrength,
  grayscale = M.MIRROR_DEFAULTS.grayscale,
  warp = M.MIRROR_DEFAULTS.warp,
  shine = M.MIRROR_DEFAULTS.shine,
  bevel = M.MIRROR_DEFAULTS.bevel,
  glare = M.MIRROR_DEFAULTS.glare,
  enableTilt = true,
  tiltStrength = M.MIRROR_DEFAULTS.tiltStrength,
  className,
}: MirrorCardProps): JSX.Element {
  const still = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const s = useRef({ intro: 1, ready: 0, readyWant: 0, light: 0, lightWant: 0 });
  const tone = kitTone(tintTone);

  const motion = useKitMotion(
    (m) => {
      const node = root.current;
      if (!node) return;
      const st = s.current;
      const ry = m.get("ry");
      node.style.setProperty("--rx", `${m.get("rx").toFixed(2)}deg`);
      node.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      node.style.setProperty("--sheen", `${M.mirrorSheen(st.intro, ry, tiltStrength, warp).toFixed(1)}%`);
      node.style.setProperty("--reflect", st.ready.toFixed(3));
      node.style.setProperty("--light", st.light.toFixed(3));
    },
    still,
    (dtMs) => {
      const st = s.current;
      const dt = dtMs / 1000;
      if (st.intro < 1) st.intro = Math.min(1, st.intro + dtMs / M.MIRROR_INTRO_MS);
      st.ready = still ? st.readyWant : follow(st.ready, st.readyWant, dt, M.MIRROR_FADE_S);
      st.light = still ? st.lightWant : follow(st.light, st.lightWant, dt, 0.15);
      return st.intro < 1 || st.ready !== st.readyWant || st.light !== st.lightWant;
    },
  );
  useEffect(() => {
    if (!still && !prefersReducedMotion()) s.current.intro = 0;
    motion.wake();
    motion.paint();
  }, [still, motion]);

  useEffect(() => {
    const el = video.current;
    if (!webcam || !el) return undefined;
    let stream: MediaStream | null = null;
    let live = true;
    const media = typeof navigator === "undefined" ? undefined : navigator.mediaDevices;
    if (!media?.getUserMedia) {
      onWebcamError?.(new Error("getUserMedia unavailable"));
      return undefined;
    }
    media
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((st) => {
        if (!live) return st.getTracks().forEach((t) => t.stop());
        stream = st;
        el.srcObject = st;
        void el.play?.();
      })
      .catch((error: unknown) => onWebcamError?.(error));
    return () => {
      live = false;
      stream?.getTracks().forEach((t) => t.stop());
      s.current.readyWant = 0;
    };
  }, [webcam, onWebcamError]);

  const onMove = (event: PointerEvent<HTMLElement>): void => {
    const p = cardPoint(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);
    const t = enableTilt && !still ? tiltTarget(p.nx, p.ny, tiltStrength) : { rx: 0, ry: 0 };
    motion.spring("rx", t.rx, TILT_FOLLOW);
    motion.spring("ry", t.ry, TILT_FOLLOW);
    s.current.lightWant = 1;
    motion.wake();
  };
  const onLeave = (): void => {
    motion.spring("rx", 0, TILT_SETTLE);
    motion.spring("ry", 0, TILT_SETTLE);
    s.current.lightWant = 0;
    motion.wake();
  };
  const hasSource = Boolean(videoSrc) || webcam;
  const layer = "pointer-events-none absolute inset-0 rounded-[inherit]";

  return (
    <article ref={root} data-slot="mirror-card" aria-label={name || undefined} onPointerMove={onMove} onPointerLeave={onLeave} onPointerCancel={onLeave} className={cn("relative w-80 [perspective:900px]", className)}>
      <div
        data-slot="mirror-card-face"
        className="relative isolate aspect-[1.586] overflow-hidden rounded-2xl border border-border text-card-foreground"
        style={{ transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))", background: M.mirrorMetal(tone, metalness), boxShadow: `inset 0 0 0 ${bevel}px color-mix(in oklab, white 18%, transparent), var(--shadow-lg)` }}
      >
        {hasSource ? (
          <video
            ref={video}
            data-slot="mirror-card-reflection"
            aria-hidden
            src={videoSrc}
            muted
            loop
            autoPlay
            playsInline
            onCanPlay={() => {
              s.current.readyWant = 1;
              motion.wake();
            }}
            className={cn(layer, "h-full w-full object-cover")}
            style={{ transform: "scaleX(-1) scale(1.2)", filter: M.mirrorFilter(blurStrength, roughness, grayscale), opacity: `calc(var(--reflect, 0) * ${(0.25 + 0.35 * metalness).toFixed(2)})`, mixBlendMode: "soft-light" }}
          />
        ) : null}
        <span aria-hidden data-slot="mirror-card-sheen" className={layer} style={{ background: `linear-gradient(105deg, transparent calc(var(--sheen, 50%) - 18%), color-mix(in oklab, white ${Math.round(30 * shine)}%, transparent) var(--sheen, 50%), transparent calc(var(--sheen, 50%) + 18%))`, mixBlendMode: "overlay" }} />
        {glare > 0 ? <span aria-hidden className={layer} style={{ background: "radial-gradient(circle at 30% 0%, color-mix(in oklab, white 50%, transparent), transparent 60%)", opacity: `calc(${glare} * var(--light, 0))` }} /> : null}
        <div className="relative flex h-full flex-col justify-between p-5">
          <div className="flex items-center justify-between text-xs">
            {badge ? <span className="rounded-full border border-border px-2 py-0.5 font-medium">{badge}</span> : <span />}
            {status ? (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span aria-hidden className="size-1.5 rounded-full" style={{ background: kitTone(statusTone) }} />
                {status}
              </span>
            ) : null}
          </div>
          {children}
          <div className="grid gap-0.5">
            <span className="text-lg font-semibold tracking-tight">{name}</span>
            {role ? <span className="text-sm text-muted-foreground">{role}</span> : null}
            {idValue ? (
              <span className="mt-2 grid text-xs">
                <span className="text-muted-foreground">{idLabel}</span>
                <span className="font-mono tracking-widest">{idValue}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
