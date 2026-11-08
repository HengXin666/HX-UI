"use client";
// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 MagnetLines 条目, 实现为 HX 自有.
// ENGINE-GAP: 上游用 WebGL 实例化短线 (上限 30000) 并带一点深度透视; 本件用 Canvas2D 逐根描线, 上限 8000 根, 无深度透视.

import { useRef, type JSX } from "react";
import { BackdropShell, fallbackGradient, splitCommon, useCanvasBackdrop, type BackdropCommonProps, type BackdropFrame } from "../../backdrop/kernel";
import {
  dampingOf, hueTurn, influenceAt, introAt, layoutGrid, MAGNET, makeNeedles, modeAngle, pulseAt, springAngle, stiffnessOf, type MagnetMode, type MagnetNeedles,
  type MagnetShape,
} from "./magnet-lines-field";
import { clearFrame, DEG, follow, HALF, inkOf, mixRgb, pickColor, smooth, TURN, wrapAngle } from "./tokens";

export interface MagnetLinesProps extends BackdropCommonProps {
  /** 线距 (CSS 像素), 默认 30; 给了 rows / columns 时按它们排满. */
  readonly spacing?: number;
  readonly rows?: number;
  readonly columns?: number;
  /** 网格限定在居中的正方形里 (CSS 像素边长), 不给就铺满. */
  readonly containerSize?: number;
  /** 线色, 默认 muted-foreground. */
  readonly lineColor?: string;
  /** 靠近指针时混入的强调色 (磁针的北极), 默认 primary. */
  readonly accentColor?: string;
  /** 线宽 / 线长 (CSS 像素), 默认 2 / 18. */
  readonly lineWidth?: number;
  readonly lineHeight?: number;
  /** 静止朝向 (度), 默认 -10. */
  readonly baseAngle?: number;
  /** 朝向规则: point 指向 / orbit 绕行 / repel 背离 / flow 顺指针运动方向. */
  readonly mode?: MagnetMode;
  /** 线形: line 线段 / arrow 箭头 / needle 双色磁针. */
  readonly shape?: MagnetShape;
  /** 按朝向转色相. */
  readonly rainbow?: boolean;
  /** 影响半径 (CSS 像素), 默认 200. */
  readonly radius?: number;
  /** 影响外的线变淡程度 0..1, 默认 0.65. */
  readonly fade?: number;
  /** 靠边变淡的宽度 (短边一半的比例), 默认 0. */
  readonly edgeFade?: number;
  /** 靠近指针时变长的比例, 默认 0.4. */
  readonly stretch?: number;
  /** 靠近指针时向指针挪的比例 (线距倍数), 默认 0. */
  readonly reach?: number;
  /** 静止朝向的随机散布 0..1, 默认 0. */
  readonly scatter?: number;
  /** 转向惯性 0..1, 0 为直接到位, 默认 0.35. */
  readonly inertia?: number;
  /** 回弹 0..1, 默认 0.3. */
  readonly bounce?: number;
  /** 点击脉冲拧转强度, 默认 0.3. */
  readonly ripple?: number;
  readonly clickPulse?: boolean;
  /** 入场: 由中心向外转着显形, 默认 true. */
  readonly intro?: boolean;
  /** 指针不在时让磁点自己巡游, 默认 false. */
  readonly idle?: boolean;
}

interface Core {
  needles: MagnetNeedles | null;
  key: string;
  tx: number;
  ty: number;
  heading: number;
  wander: number;
}

/** 本库定: 色阶查表级数, 无指针巡游的李萨如参数. */
const STEPS = 24;
const WANDER = { ax: 0.3, ay: 0.25, fx: 0.23, fy: 0.31 } as const;
const SEED = 5113;

/**
 * 磁力线: 一张短线网格, 每根是一个角弹簧, 朝向由指针按模式给出 (指向, 绕行, 背离或顺流), 影响半径外回到静止朝向并变淡;
 * 点击放出一圈脉冲把扫过的线拧一下, 入场由中心向外转着显形. 减弱动效时直接到位只画一帧.
 */
export function MagnetLines(props: MagnetLinesProps): JSX.Element {
  const {
    spacing = 30, rows, columns, containerSize, lineColor = "muted-foreground", accentColor = "primary", lineWidth = 2, lineHeight = 18, baseAngle = -10,
    mode = "orbit", shape = "line", rainbow = false, radius = 200, fade = 0.65, edgeFade = 0, stretch = 0.4, reach = 0, scatter = 0, inertia = 0.35,
    bounce = 0.3, ripple = 0.3, clickPulse = true, intro = true, idle = false, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const core = useRef<Core>({ needles: null, key: "", tx: 0, ty: 0, heading: 0, wander: 0 });

  const draw = (ctx: CanvasRenderingContext2D, frame: BackdropFrame): void => {
    clearFrame(ctx, frame.fit);
    const sc = frame.fit.scale > 0 ? frame.fit.scale : 1;
    const W = frame.fit.width / sc;
    const H = frame.fit.height / sc;
    const side = containerSize ? Math.min(containerSize, W, H) : 0;
    const box = side ? { x: (W - side) / 2, y: (H - side) / 2, w: side, h: side } : { x: 0, y: 0, w: W, h: H };
    const grid = layoutGrid(box.w, box.h, spacing, rows, columns);
    const base = baseAngle * DEG;
    const c = core.current;
    const key = `${grid.cols}x${grid.rows}|${scatter}`;
    if (!c.needles || c.key !== key) {
      c.needles = makeNeedles(grid.cols * grid.rows, base, scatter, SEED);
      c.key = key;
      [c.tx, c.ty] = [W / 2, H / 2];
    }
    const s = c.needles;
    const p = frame.pointer;
    const dt = Math.min(frame.dt, MAGNET.dtCap);
    const present = p.inside || p.presence > 0.01;
    const wandering = !present && idle;
    c.wander += dt;
    const gx = present ? p.x * W : wandering ? W * (HALF + WANDER.ax * Math.sin(c.wander * WANDER.fx * TURN * 0.25)) : c.tx;
    const gy = present ? (1 - p.y) * H : wandering ? H * (HALF + WANDER.ay * Math.sin(c.wander * WANDER.fy * TURN * 0.25)) : c.ty;
    const k0 = dt > 0 ? follow(dt, present ? MAGNET.followTau : MAGNET.wanderTau) : 1;
    const mx = gx - c.tx;
    const my = gy - c.ty;
    if (Math.hypot(mx, my) > 0.5 && dt > 0) c.heading += wrapAngle(Math.atan2(my, mx) - c.heading) * follow(dt, MAGNET.headingTau);
    c.tx += mx * k0;
    c.ty += my * k0;
    const reach0 = present ? p.presence : wandering ? 1 : 0;
    const k = stiffnessOf(inertia, frame.reduced);
    const damp = dampingOf(k, bounce);
    const period = shape === "line" ? Math.PI : TURN;
    const taps = clickPulse && !frame.reduced ? p.taps.map((t) => ({ x: t.x * W, y: (1 - t.y) * H, age: frame.elapsed - t.at })) : [];
    const cx = W / 2;
    const cy = H / 2;
    const ink = frame.colors[0] ?? pickColor(frame.colors, 0);
    const accent = pickColor(frame.colors, 1);
    const ramp = Array.from({ length: STEPS }, (_, i) => inkOf(mixRgb(ink, accent, i / (STEPS - 1))));
    const hues = rainbow ? Array.from({ length: STEPS }, (_, i) => inkOf(hueTurn(mixRgb(ink, accent, HALF), (i / STEPS) * TURN))) : [];
    const north = inkOf(accent);
    const edge = edgeFade * Math.min(box.w, box.h) * HALF;
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(0.5, lineWidth * sc);
    for (let i = 0; i < s.count; i += 1) {
      const col = i % grid.cols;
      const row = Math.floor(i / grid.cols);
      let x = box.x + grid.ox + col * grid.dx;
      let y = box.y + grid.oy + row * grid.dy;
      const dx = c.tx - x;
      const dy = c.ty - y;
      const d = Math.hypot(dx, dy);
      const infl = influenceAt(d, radius) * reach0;
      const rest0 = base + s.jitter[i];
      let goal = rest0 + wrapAngle(modeAngle(mode, dx, dy, c.heading) - rest0, period) * infl;
      for (const t of taps) goal += pulseAt(Math.hypot(x - t.x, y - t.y), t.age) * MAGNET.pulseSpin * TURN * ripple;
      const enter = intro ? introAt(Math.hypot(x - cx, y - cy), frame.elapsed) : { shown: 1, spin: 0 };
      [s.angle[i], s.velocity[i]] = dt > 0 || frame.reduced ? springAngle(s.angle[i], s.velocity[i], goal, k, damp, dt, period) : [s.angle[i], s.velocity[i]];
      const a = s.angle[i] + enter.spin;
      if (d > 0) {
        x += (dx / d) * reach * infl * Math.min(grid.dx, grid.dy) * HALF;
        y += (dy / d) * reach * infl * Math.min(grid.dx, grid.dy) * HALF;
      }
      const edgeK = edge > 0 ? smooth(0, edge, Math.min(x - box.x, box.x + box.w - x, y - box.y, box.y + box.h - y)) : 1;
      ctx.globalAlpha = enter.shown * edgeK * (1 - fade * (1 - infl));
      if (ctx.globalAlpha <= 0.01) continue;
      const half = lineHeight * (1 + stretch * infl) * HALF * sc;
      const ux = Math.cos(a) * half;
      const uy = Math.sin(a) * half;
      const px = x * sc;
      const py = y * sc;
      const hueIx = Math.floor(((((a % TURN) + TURN) % TURN) / TURN) * STEPS) % STEPS;
      ctx.strokeStyle = rainbow ? hues[hueIx] : ramp[Math.round(infl * (STEPS - 1))];
      ctx.beginPath();
      ctx.moveTo(px - ux, py - uy);
      ctx.lineTo(shape === "needle" ? px : px + ux, shape === "needle" ? py : py + uy);
      if (shape === "arrow") {
        const hx = Math.cos(a + Math.PI * 0.8) * half * 0.45;
        const hy = Math.sin(a + Math.PI * 0.8) * half * 0.45;
        const kx = Math.cos(a - Math.PI * 0.8) * half * 0.45;
        const ky = Math.sin(a - Math.PI * 0.8) * half * 0.45;
        ctx.moveTo(px + ux + hx, py + uy + hy);
        ctx.lineTo(px + ux, py + uy);
        ctx.lineTo(px + ux + kx, py + uy + ky);
      }
      ctx.stroke();
      if (shape === "needle") {
        ctx.strokeStyle = north;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + ux, py + uy);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  };

  const palette = [lineColor, accentColor];
  const handle = useCanvasBackdrop({ draw }, { ...options, colors: palette });
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient([])} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
