"use client";

import * as React from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";
import { resolveColors, useFrameLoop, useThemeVersion } from "./use-frame-loop";

export type ParticleShape = "circle" | "square" | "ring" | "sparkle";

export interface ParticlesHandle {
  /** 在某个点 (容器内 px) 放一圈光波; 不给坐标就在中心 */
  burst: (x?: number, y?: number) => void;
}

export interface ParticlesProps {
  /** 粒子数量 */
  particleCount?: number;
  /** 从中心散开多远 */
  particleSpread?: number;
  /** 漂浮、闪烁和旋转的速度 */
  speed?: number;
  /** 从这些颜色里随机挑, 支持 var(--token) */
  particleColors?: string[];
  /** 基础尺寸, 近处的粒子画得更大 */
  particleBaseSize?: number;
  /** 尺寸差异, 0 时都一样大 */
  sizeRandomness?: number;
  shape?: ParticleShape;
  /** 粒子周围的柔光 */
  glow?: number;
  /** 闪烁程度, 0-1 */
  twinkle?: number;
  /** 把最近的粒子虚化成光斑, 像镜头景深 */
  depthOfField?: number;
  /** 相近的粒子连成细线, 像星座 */
  connections?: boolean;
  /** 多近才连线, px */
  connectionDistance?: number;
  /** 上飘像火星, 下落像雪, 迎面像星空 */
  drift?: "none" | "up" | "down" | "forward";
  driftSpeed?: number;
  /** 光标会推动粒子 */
  moveParticlesOnHover?: boolean;
  /** parallax 整体视差; repel / attract 推开或吸引附近的粒子 */
  hoverEffect?: "parallax" | "repel" | "attract";
  particleHoverFactor?: number;
  /** repel / attract 的作用半径, px */
  hoverRadius?: number;
  /** 点击时放出一圈光波 */
  clickBurst?: boolean;
  /** 粒子边缘柔化 */
  softParticles?: boolean;
  /** 关掉整体缓慢旋转 */
  disableRotation?: boolean;
  /** 相机距离, 越近越有纵深 */
  cameraDistance?: number;
  /** 换一组随机分布 */
  variation?: number;
  /** 挂载时淡入 */
  intro?: boolean;
  opacity?: number;
  /** 白底: 浅色粒子自动换成深色 */
  lightMode?: boolean;
  paused?: boolean;
  dpr?: number;
  className?: string;
  canvasClassName?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

interface P { x: number; y: number; z: number; s: number; c: number; ph: number; fx: number; fy: number; ox: number; oy: number; vx: number; vy: number }

function rng(seed: number) {
  let s = (seed * 9301 + 49297) % 233280 || 1;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function sprite(rgb: [number, number, number], soft: boolean) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const [r, gg, b] = rgb.map((v) => Math.round(v * 255));
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${r},${gg},${b},${soft ? 0.55 : 0.8})`);
  grad.addColorStop(0.25, `rgba(${r},${gg},${b},0.22)`);
  grad.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

export const Particles = React.forwardRef<ParticlesHandle, ParticlesProps>(function Particles(
  {
    particleCount = 200,
    particleSpread = 10,
    speed = 0.1,
    particleColors = ["#ffffff"],
    particleBaseSize = 100,
    sizeRandomness = 1,
    shape = "circle",
    glow = 0.5,
    twinkle = 0.3,
    depthOfField = 0,
    connections = false,
    connectionDistance = 110,
    drift = "none",
    driftSpeed = 1,
    moveParticlesOnHover = true,
    hoverEffect = "parallax",
    particleHoverFactor = 1,
    hoverRadius = 140,
    clickBurst = true,
    softParticles = false,
    disableRotation = false,
    cameraDistance = 20,
    variation = 0,
    intro = true,
    opacity = 1,
    lightMode = false,
    paused = false,
    dpr = 2,
    className,
    canvasClassName,
    style,
    children,
  },
  ref,
) {
  const reduce = useReducedMotion();
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const wrap = React.useRef<HTMLDivElement>(null);
  const theme = useThemeVersion();
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => setReady(true), []);

  const rgb = React.useMemo(() => {
    const cols = resolveColors(wrap.current, particleColors.length ? particleColors : ["#fff"]);
    return lightMode ? cols.map((c) => (c[0] + c[1] + c[2] > 2.4 ? ([0.09, 0.09, 0.11] as [number, number, number]) : c)) : cols;
  }, [particleColors, lightMode, theme, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  const sprites = React.useMemo(() => (typeof document === "undefined" ? [] : rgb.map((c) => sprite(c, softParticles))), [rgb, softParticles]);
  const css = React.useMemo(() => rgb.map((c) => c.map((v) => Math.round(v * 255)).join(",")), [rgb]);

  const parts = React.useMemo<P[]>(() => {
    const r = rng(variation * 7919 + 17);
    return Array.from({ length: Math.max(0, Math.round(particleCount)) }, () => {
      // 球内均匀分布
      const u = r(), v = r(), w = Math.cbrt(r());
      const th = u * Math.PI * 2, ph = Math.acos(2 * v - 1);
      return {
        x: Math.sin(ph) * Math.cos(th) * w, y: Math.sin(ph) * Math.sin(th) * w, z: Math.cos(ph) * w,
        s: r(), c: Math.floor(r() * 1e6), ph: r() * Math.PI * 2, fx: 0.5 + r(), fy: 0.5 + r(),
        ox: 0, oy: 0, vx: 0, vy: 0,
      };
    });
  }, [particleCount, variation]);

  const mouse = React.useRef({ x: 0, y: 0, in: false, px: 0, py: 0 });
  const bursts = React.useRef<{ x: number; y: number; t: number }[]>([]);
  const clock = React.useRef(0);
  const introT = React.useRef(intro && !reduce ? 0 : 1);
  const size = React.useRef({ w: 0, h: 0 });

  React.useImperativeHandle(ref, () => ({
    burst: (x, y) => bursts.current.push({ x: x ?? size.current.w / 2, y: y ?? size.current.h / 2, t: clock.current }),
  }), []);

  const still = reduce || paused;
  useFrameLoop(canvas, ({ t, dt, w, h, dpr: d }) => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    clock.current = t;
    size.current = { w, h };
    if (introT.current < 1) introT.current = still ? 1 : Math.min(1, introT.current + dt / 1.2);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const k = t * speed * 10;
    const cx = w / 2, cy = h / 2;
    const unit = Math.max(w, h) / 17; // 世界单位到像素, 默认散布铺满舞台
    const R = particleSpread;
    const rotY = disableRotation ? 0 : k * 0.035;
    const rotX = disableRotation ? 0 : Math.sin(k * 0.02) * 0.25;
    const cyR = Math.cos(rotY), syR = Math.sin(rotY), cxR = Math.cos(rotX), sxR = Math.sin(rotX);
    const m = mouse.current;
    // 视差: 整体轻微反向平移
    const tx = moveParticlesOnHover && hoverEffect === "parallax" && m.in ? m.x - cx : 0;
    const ty = moveParticlesOnHover && hoverEffect === "parallax" && m.in ? m.y - cy : 0;
    m.px += (-tx * 0.06 * particleHoverFactor - m.px) * Math.min(1, dt * 3);
    m.py += (-ty * 0.06 * particleHoverFactor - m.py) * Math.min(1, dt * 3);
    bursts.current = bursts.current.filter((b) => t - b.t < 1.6);
    const ease = 1 - Math.pow(1 - introT.current, 3);
    const pts: { sx: number; sy: number; r: number; a: number; c: number; z: number }[] = [];

    for (const p of parts) {
      let x = p.x * R, y = p.y * R, z = p.z * R;
      // 漂浮
      x += Math.sin(k * 0.3 * p.fx + p.ph) * 0.35;
      y += Math.cos(k * 0.27 * p.fy + p.ph) * 0.35;
      if (drift !== "none") {
        const run = t * driftSpeed * (drift === "forward" ? 2.2 : 1.1);
        if (drift === "up") y = ((y + run + R) % (2 * R) + 2 * R) % (2 * R) - R;
        else if (drift === "down") y = ((y - run + R) % (2 * R) + 2 * R) % (2 * R) - R;
        else z = ((z + run + R) % (2 * R) + 2 * R) % (2 * R) - R;
      }
      // 旋转
      const x1 = x * cyR + z * syR, z1 = -x * syR + z * cyR;
      const y1 = y * cxR - z1 * sxR, z2 = y * sxR + z1 * cxR;
      const persp = cameraDistance / Math.max(0.5, cameraDistance - z2);
      let sx = cx + x1 * unit * persp + m.px * persp, sy = cy - y1 * unit * persp + m.py * persp;
      // 吸引 / 推开 (屏幕空间弹簧)
      let fx = 0, fy = 0;
      if (moveParticlesOnHover && m.in && hoverEffect !== "parallax") {
        const dx = sx + p.ox - m.x, dy = sy + p.oy - m.y, dd = Math.hypot(dx, dy);
        if (dd < hoverRadius && dd > 0.1) {
          const f = (1 - dd / hoverRadius) * 60 * particleHoverFactor * (hoverEffect === "repel" ? 1 : -0.6);
          fx += (dx / dd) * f; fy += (dy / dd) * f;
        }
      }
      let flash = 0;
      for (const b of bursts.current) {
        const age = t - b.t, rad = age * 520, dx = sx - b.x, dy = sy - b.y, dd = Math.hypot(dx, dy);
        const band = Math.exp(-Math.pow((dd - rad) / 38, 2)) * (1 - age / 1.6);
        flash += band;
        if (dd > 0.1) { fx += (dx / dd) * band * 90; fy += (dy / dd) * band * 90; }
      }
      p.vx += (fx - p.ox) * Math.min(1, dt * 9); p.vy += (fy - p.oy) * Math.min(1, dt * 9);
      p.vx *= 0.78; p.vy *= 0.78;
      p.ox += p.vx * Math.min(1, dt * 9); p.oy += p.vy * Math.min(1, dt * 9);
      if (still) { p.ox = p.oy = 0; }
      sx += p.ox; sy += p.oy;
      const sz = (particleBaseSize / 100) * 1.05 * Math.max(0.25, 1 + (p.s - 0.5) * 1.7 * sizeRandomness) * persp * persp;
      const tw = 1 - twinkle * (0.5 + 0.5 * Math.sin(k * 1.7 * p.fx + p.ph * 3));
      const depthA = Math.min(1, 0.35 + 0.65 * persp);
      pts.push({ sx, sy, r: Math.max(0.3, sz), a: Math.min(1, (tw * depthA + flash * 0.9)) * ease * opacity, c: p.c % rgb.length, z: z2 });
    }

    if (connections) {
      ctx.lineWidth = 0.6;
      const cd2 = connectionDistance * connectionDistance;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j], dx = a.sx - b.sx, dy = a.sy - b.sy, d2 = dx * dx + dy * dy;
          if (d2 > cd2) continue;
          ctx.strokeStyle = `rgba(${css[a.c]},${(1 - Math.sqrt(d2) / connectionDistance) * 0.35 * Math.min(a.a, b.a)})`;
          ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
        }
      }
    }

    pts.sort((a, b) => a.z - b.z);
    const near = R * (1 - depthOfField * 0.9);
    for (const q of pts) {
      if (q.a <= 0.003) continue;
      let r = q.r, a = q.a;
      // 景深: 离相机近的粒子放大发虚
      const bok = depthOfField > 0 && q.z > near ? Math.min(1, (q.z - near) / (R * 0.6)) * depthOfField : 0;
      if (bok > 0) { r *= 1 + bok * 4; a *= 1 - bok * 0.7; }
      if (glow > 0 || bok > 0) {
        const gr = r * (2 + glow * 6 + bok * 2);
        ctx.globalAlpha = a * Math.min(1, glow + bok);
        ctx.drawImage(sprites[q.c], q.sx - gr, q.sy - gr, gr * 2, gr * 2);
      }
      if (bok > 0.6) continue;
      ctx.globalAlpha = a;
      ctx.fillStyle = ctx.strokeStyle = `rgb(${css[q.c]})`;
      ctx.beginPath();
      if (shape === "square") ctx.rect(q.sx - r, q.sy - r, r * 2, r * 2);
      else if (shape === "ring") { ctx.lineWidth = Math.max(0.6, r * 0.45); ctx.arc(q.sx, q.sy, r * 1.3, 0, Math.PI * 2); ctx.stroke(); continue; }
      else if (shape === "sparkle") {
        const L = r * 2.6, s = r * 0.45;
        ctx.moveTo(q.sx, q.sy - L); ctx.lineTo(q.sx + s, q.sy - s); ctx.lineTo(q.sx + L, q.sy); ctx.lineTo(q.sx + s, q.sy + s);
        ctx.lineTo(q.sx, q.sy + L); ctx.lineTo(q.sx - s, q.sy + s); ctx.lineTo(q.sx - L, q.sy); ctx.lineTo(q.sx - s, q.sy - s); ctx.closePath();
      } else ctx.arc(q.sx, q.sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, {
    maxDpr: Math.min(2, dpr), still,
    deps: [parts, rgb, shape, glow, twinkle, depthOfField, connections, connectionDistance, particleBaseSize, sizeRandomness, particleSpread, cameraDistance, opacity, softParticles],
  });

  const local = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  return (
    <div
      ref={wrap}
      className={cn("relative isolate h-full w-full overflow-hidden", className)}
      style={style}
      onPointerMove={(e) => { const p = local(e); Object.assign(mouse.current, p, { in: true }); }}
      onPointerLeave={() => { mouse.current.in = false; }}
      onPointerDown={clickBurst ? (e) => { const p = local(e); bursts.current.push({ ...p, t: clock.current }); } : undefined}
    >
      <canvas ref={canvas} aria-hidden="true" className={cn("pointer-events-none absolute inset-0 -z-10 h-full w-full", canvasClassName)} />
      {children}
    </div>
  );
});
