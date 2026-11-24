"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import {
  DEFAULT_SHOT,
  type MotionInput,
  type Shot,
  type ShotInput,
  motionProgress,
  resolveMotion,
  resolveShot,
  sampleMotion,
} from "./shots";

export type StageDevice = "browser" | "window" | "phone" | "tablet" | "laptop" | "card" | "none";
export type StageBackground = "solid" | "spotlight" | "gradient" | "mesh" | "studio" | "grid" | "transparent";
export type StageArrange = "single" | "layers" | "row" | "fan" | "stack" | "tower";

export interface StageHandle {
  /** 从头播放运镜 */
  play: () => void;
  pause: () => void;
  /** 跳到运镜的某个进度, 0–1 */
  seek: (progress: number) => void;
  /** 现在的镜头 (含运镜、视差、拖拽) */
  getShot: () => Shot;
}

export interface StageProps {
  /** 场景里的屏幕. 一般是 StageScreen; 其它内容会自动装进一块屏幕 */
  children: React.ReactNode;
  /** 静止时的镜头: 内置名字或参数. 改它会平滑运镜过去 */
  shot?: ShotInput;
  /** 运镜: 内置名字或关键帧. 设置后覆盖 shot */
  motion?: MotionInput;
  /** 绑定滚动: 运镜进度跟随元素在视口 (或容器) 里的位置 */
  scroll?: boolean | { container?: React.RefObject<HTMLElement | null>; start?: number; end?: number };
  /** 镜头切换的过渡时长, 秒 */
  transition?: number;
  /** 多块屏幕的排布; 屏幕自己写了 position 时以屏幕为准 */
  arrange?: StageArrange;
  /** 屏幕的默认设备外框 */
  device?: StageDevice;
  /** 屏幕宽度占舞台宽度的比例 */
  size?: number;
  /** 背景样式 */
  background?: StageBackground;
  /** 背景色 (支持 var(--token)). mesh 用 colors */
  backgroundColor?: string;
  /** 第二个背景色: spotlight 的光、gradient 的终点、studio 的地平线 */
  backgroundColor2?: string;
  /** mesh 背景的几团颜色 */
  colors?: string[];
  /** 是否显示 3D 地面 (studio / grid 背景下自动有) */
  floor?: boolean;
  /** 地面上的接触阴影与屏幕投影, 0–1 */
  shadow?: number;
  /** 阴影的柔和度, 0–1 */
  softness?: number;
  /** 屏幕在地面上的倒影, 0–1 (Chromium / Safari) */
  reflection?: number;
  /** 屏幕表面随角度变化的反光, 0–1 */
  sheen?: number;
  /** 景深强度: 离焦点 (shot.focus) 越远越虚, 配合屏幕的 depth */
  dof?: number;
  /** 胶片颗粒, 0–1 */
  grain?: number;
  /** 暗角, 0–1 */
  vignette?: number;
  /** 光标视差强度, 0 关闭 */
  parallax?: number;
  /** 在空白处拖拽转动镜头, 双击复位 */
  orbit?: boolean;
  /** 叠在画面上的大标题 */
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  textPosition?: "top" | "bottom";
  /** 屏幕里的内容能否点击操作 */
  interactive?: boolean;
  /** 屏幕里的文字能否拖选. 默认关: 在屏幕上拖动是转镜头, 点击照常 */
  selectable?: boolean;
  /** 设备厚度倍数, 0 为纸片, 默认 1 */
  thickness?: number;
  /** 冻结运镜 */
  paused?: boolean;
  onMotionEnd?: () => void;
  className?: string;
  style?: React.CSSProperties;
  /** 加在 3D 世界层 */
  worldClassName?: string;
  /** 加在文字层 */
  textClassName?: string;
  "aria-label"?: string;
}

interface Ctx {
  sw: number;
  thickness: number;
  device: StageDevice;
  reflection: number;
  register: (el: HTMLElement, depth: number) => () => void;
}
const StageCtx = React.createContext<Ctx | null>(null);

const ASPECT: Record<StageDevice, number> = { browser: 16 / 10, window: 16 / 10, phone: 9 / 19.5, tablet: 3 / 4, laptop: 16 / 10, card: 4 / 3, none: 16 / 10 };
const SIZE: Partial<Record<StageDevice, number>> = { phone: 0.24, tablet: 0.36 };
/** 外框在内容之外多出的高度, em (字号 = 屏宽 / 64) */
const CHROME_EM: Partial<Record<StageDevice, number>> = { browser: 2.4, window: 2.4, laptop: 2.4, phone: 1.8, tablet: 2.4 };
/** 机身厚度, 以屏宽为单位 */
const DEPTH: Record<StageDevice, number> = { phone: 0.1, tablet: 0.05, laptop: 0.014, browser: 0.018, window: 0.018, card: 0.03, none: 0 };

/** 自动排布: 返回 [x, y, z] (以屏幕宽度为单位), Y 轴旋转, 景深层号 */
function place(arr: StageArrange, i: number, n: number, aspect: number): { p: [number, number, number]; ry: number; depth: number } {
  const m = (n - 1) / 2, d = i - m;
  switch (arr) {
    case "layers": return { p: [d * 0.3, -d * 0.16, d * 0.34], ry: 0, depth: d };
    case "row": return { p: [d * 1.1, 0, 0], ry: 0, depth: 0 };
    case "fan": return { p: [d * 0.62, 0, -Math.abs(d) * 0.28], ry: -d * 20, depth: -Math.abs(d) };
    case "stack": return { p: [d * 0.05, d * 0.06, d * 0.1], ry: 0, depth: d };
    case "tower": return { p: [d * 0.08, d * (1 / aspect) * 0.62, d * 0.14], ry: 0, depth: d };
    default: return { p: [0, 0, 0], ry: 0, depth: 0 };
  }
}
const ARRANGE_SCALE: Record<StageArrange, (n: number) => number> = {
  single: () => 1,
  layers: (n) => 1 / (1 + (n - 1) * 0.16),
  row: (n) => 1 / Math.max(1, n * 0.86),
  fan: (n) => 1 / (1 + (n - 1) * 0.3),
  stack: () => 0.92,
  tower: (n) => 1 / (1 + (n - 1) * 0.32),
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export const Stage = React.forwardRef<StageHandle, StageProps>(function Stage(
  {
    children,
    shot = "turn",
    motion = "none",
    scroll = false,
    transition = 0.9,
    arrange = "single",
    device = "browser",
    size,
    background = "spotlight",
    backgroundColor,
    backgroundColor2,
    colors,
    floor,
    shadow = 0.7,
    softness = 0.65,
    reflection = 0,
    sheen = 0.5,
    dof = 0,
    grain = 0.12,
    vignette = 0.3,
    parallax = 0.4,
    orbit = true,
    title,
    subtitle,
    textPosition = "bottom",
    interactive = true,
    selectable = false,
    thickness = 1,
    paused = false,
    onMotionEnd,
    className,
    style,
    worldClassName,
    textClassName,
    "aria-label": ariaLabel = "3D 展台",
  },
  ref,
) {
  const reduce = useReducedMotion();
  const root = React.useRef<HTMLDivElement>(null);
  const world = React.useRef<HTMLDivElement>(null);
  const [W, setW] = React.useState(0);
  const [H, setH] = React.useState(0);

  React.useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => { setW(e.contentRect.width); setH(e.contentRect.height); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 屏幕
  const items = React.Children.toArray(children).filter(React.isValidElement);
  const allScreens = items.length > 0 && items.every((c) => (c as React.ReactElement).type === StageScreen);
  const screens = allScreens ? items : [<StageScreen key="auto">{children}</StageScreen>];
  const n = screens.length;
  const aspect = ASPECT[device];
  // 宽度按 size, 同时保证整块屏幕的高度不超过舞台高度的 74%, 竖屏设备也放得下
  const chrome = device === "browser" || device === "window" ? 1.06 : device === "laptop" ? 1.12 : device === "phone" || device === "tablet" ? 1.08 : 1;
  const sw = Math.min(W * (size ?? SIZE[device] ?? 0.62), (H * 0.74 * aspect) / chrome) * ARRANGE_SCALE[n > 1 ? arrange : "single"](n);

  // 景深注册
  const dofEls = React.useRef(new Map<HTMLElement, number>());
  const register = React.useCallback((el: HTMLElement, depth: number) => {
    dofEls.current.set(el, depth);
    return () => { dofEls.current.delete(el); };
  }, []);

  // 动画状态全放 ref, 每帧直接写样式, 不触发重渲染
  const m = React.useMemo(() => resolveMotion(motion), [motion]);
  const base = React.useMemo(() => resolveShot(shot), [shot]);
  const cur = React.useRef<Shot | null>(null);
  const elapsed = React.useRef(0);
  const ended = React.useRef(false);
  const seekTo = React.useRef<number | null>(null);
  const pausedRef = React.useRef(paused);
  pausedRef.current = paused;
  const manualPause = React.useRef(false);
  const wakeRef = React.useRef<() => void>(() => {});
  const pointer = React.useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  const drag = React.useRef({ on: false, pending: false, sx: 0, sy: 0, yaw: 0, pitch: 0, lx: 0, ly: 0, reset: false });
  const endCb = React.useRef(onMotionEnd);
  endCb.current = onMotionEnd;
  const opts = React.useRef({ sheen, dof, transition, parallax, scroll, m, base, reduce });
  opts.current = { sheen, dof, transition, parallax, scroll, m, base, reduce };

  React.useEffect(() => { elapsed.current = 0; ended.current = false; wakeRef.current(); }, [m]);

  React.useImperativeHandle(ref, () => ({
    play: () => { elapsed.current = 0; ended.current = false; manualPause.current = false; seekTo.current = null; wakeRef.current(); },
    pause: () => { manualPause.current = true; },
    seek: (p) => { seekTo.current = clamp(p, 0, 1); ended.current = false; wakeRef.current(); },
    getShot: () => ({ ...(cur.current ?? DEFAULT_SHOT) }),
  }), []);

  React.useEffect(() => {
    const el = root.current, wd = world.current;
    if (!el || !wd) return;
    let raf = 0, last = 0, onScreen = true, still = 0;
    // 画面静止后停掉 rAF, 有输入或参数变化时 wake() 再起
    const wake = () => { still = 0; if (onScreen && !raf) { last = 0; raf = requestAnimationFrame(frame); } };
    wakeRef.current = wake;

    let prev = "";
    const tiltEl = el.querySelector<HTMLElement>(".hx-st-tilt");
    const write = (s: Shot) => {
      const w = el.clientWidth, h = el.clientHeight;
      // 镜头没变就不写样式, 静止时零开销
      const sig = `${w}|${h}|${s.yaw.toFixed(3)}|${s.pitch.toFixed(3)}|${s.roll.toFixed(3)}|${s.zoom.toFixed(4)}|${s.x.toFixed(4)}|${s.y.toFixed(4)}|${s.lens.toFixed(3)}|${s.focus.toFixed(3)}|${s.tilt.toFixed(3)}|${opts.current.dof}|${opts.current.sheen}`;
      if (sig === prev) return;
      prev = sig;
      if (tiltEl) tiltEl.style.display = s.tilt > 0.01 ? "" : "none";
      el.style.perspective = `${Math.max(200, s.lens * w)}px`;
      wd.style.transform = `translate3d(${s.x * w}px, ${s.y * h}px, 0) scale(${s.zoom}) rotateX(${s.pitch}deg) rotateY(${s.yaw}deg) rotateZ(${s.roll}deg)`;
      const o = opts.current;
      el.style.setProperty("--hx-st-yaw", s.yaw.toFixed(2));
      el.style.setProperty("--hx-st-sheen", (o.sheen * clamp(0.12 + Math.abs(s.yaw) / 45 + Math.abs(s.pitch) / 70, 0, 1)).toFixed(3));
      el.style.setProperty("--hx-st-sx", `${(50 - s.yaw * 1.4).toFixed(1)}%`);
      el.style.setProperty("--hx-st-tilt", s.tilt.toFixed(3));
      if (o.dof > 0) dofEls.current.forEach((d, node) => { node.style.filter = `blur(${Math.min(10, Math.abs(d - s.focus) * o.dof * 3).toFixed(2)}px)`; });
      else dofEls.current.forEach((_, node) => { node.style.filter = ""; });
    };

    const scrollProgress = () => {
      const sc = opts.current.scroll;
      const cfg = typeof sc === "object" ? sc : {};
      const box = cfg.container?.current;
      const r = el.getBoundingClientRect();
      const top = box ? box.getBoundingClientRect().top : 0;
      const vh = box ? box.clientHeight : window.innerHeight;
      const start = cfg.start ?? 1, end = cfg.end ?? 0.2;
      // 元素顶部从视口 start 处走到 end 处 = 0 → 1
      const y = r.top - top;
      return clamp((start * vh - y) / Math.max(1, (start - end) * vh), 0, 1);
    };

    const target = (dt: number): Shot => {
      const o = opts.current;
      let s = o.base;
      if (o.m && !o.reduce) {
        if (o.scroll) s = sampleMotion(o.m, scrollProgress());
        else {
          if (seekTo.current != null) { elapsed.current = (o.m.delay ?? 0) + seekTo.current * o.m.duration; seekTo.current = null; }
          else if (!pausedRef.current && !manualPause.current) elapsed.current += dt;
          const [p, done] = motionProgress(o.m, elapsed.current);
          s = sampleMotion(o.m, p);
          if (done && !ended.current) { ended.current = true; endCb.current?.(); }
        }
      }
      const pt = pointer.current, dr = drag.current;
      const k = 1 - Math.exp(-dt * 6);
      pt.sx += (pt.x - pt.sx) * k; pt.sy += (pt.y - pt.sy) * k;
      if (dr.reset) { dr.yaw *= 1 - k; dr.pitch *= 1 - k; if (Math.abs(dr.yaw) + Math.abs(dr.pitch) < 0.05) { dr.yaw = dr.pitch = 0; dr.reset = false; } }
      const par = o.reduce ? 0 : o.parallax;
      return { ...s, yaw: s.yaw + pt.sx * par * 12 + dr.yaw, pitch: clamp(s.pitch - pt.sy * par * 8 + dr.pitch, -85, 85) };
    };

    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const t = target(dt);
      if (!cur.current || opts.current.reduce) cur.current = t;
      else {
        const k = 1 - Math.exp(-dt * (4.6 / Math.max(0.05, opts.current.transition)));
        const c = cur.current;
        for (const key of Object.keys(c) as (keyof Shot)[]) c[key] += (t[key] - c[key]) * k;
      }
      write(cur.current);
      const o = opts.current, c = cur.current, pt = pointer.current, dr = drag.current;
      const timed = !!o.m && !o.reduce && !o.scroll && !pausedRef.current && !manualPause.current && !ended.current;
      let gap = Math.abs(pt.x - pt.sx) + Math.abs(pt.y - pt.sy);
      for (const key of Object.keys(c) as (keyof Shot)[]) gap = Math.max(gap, Math.abs(t[key] - c[key]));
      still = timed || dr.on || dr.reset || gap > 1e-3 ? 0 : still + 1;
      raf = onScreen && still < 3 ? requestAnimationFrame(frame) : 0;
    };
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      el.classList.toggle("hx-st-off", !onScreen);
      if (onScreen) wake();
    });
    io.observe(el);
    const ro = new ResizeObserver(wake);
    ro.observe(el);
    const onScroll = () => { if (opts.current.scroll) wake(); };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); window.removeEventListener("scroll", onScroll, { capture: true }); wakeRef.current = () => {}; };
  }, []);

  // 参数变了, 叫醒渲染循环
  React.useEffect(() => wakeRef.current(), [m, base, sheen, dof, transition, parallax, scroll, paused, reduce, W, H]);

  const onPointerMove = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    pointer.current.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointer.current.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    const d = drag.current;
    wakeRef.current();
    if (d.pending && !d.on && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 4) {
      // 从屏幕上起手: 拖过 4px 才算转镜头, 并吞掉随后的 click
      d.on = true; d.pending = false; d.lx = e.clientX; d.ly = e.clientY;
      e.currentTarget.setPointerCapture(e.pointerId);
      window.getSelection()?.removeAllRanges();
      const swallow = (ev: MouseEvent) => { ev.stopPropagation(); ev.preventDefault(); };
      window.addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0);
    }
    if (d.on) {
      d.yaw += (e.clientX - d.lx) * 0.25;
      d.pitch = clamp(d.pitch - (e.clientY - d.ly) * 0.2, -70, 70);
      d.lx = e.clientX; d.ly = e.clientY;
    }
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (!orbit || reduce || e.button !== 0) return;
    const t = e.target as HTMLElement;
    wakeRef.current();
    // 叠在舞台上的按钮等控件照常点击, 不起拖拽
    if (!t.closest(".hx-st-item") && t.closest("button, a, input, textarea, select, [role=button], [data-stage-keep]")) return;
    if (t.closest(".hx-st-item")) {
      // 屏幕上: 表单控件和标了 data-stage-keep 的元素照常操作; 可选文字时不抢拖动
      if (selectable || t.closest("input, textarea, select, [contenteditable], [role=slider], [data-stage-keep]")) return;
      drag.current = { ...drag.current, pending: true, sx: e.clientX, sy: e.clientY, reset: false };
      return;
    }
    drag.current = { ...drag.current, on: true, lx: e.clientX, ly: e.clientY, reset: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const endDrag = () => { drag.current.on = false; drag.current.pending = false; };
  const onDoubleClick = (e: React.MouseEvent) => {
    if (!orbit || (e.target as HTMLElement).closest(".hx-st-item")) return;
    drag.current.reset = true;
    wakeRef.current();
  };

  const hasFloor = floor ?? (background === "studio" || background === "grid" || reflection > 0);
  const floorY = (sw / aspect + sw * (CHROME_EM[device] ?? 0) / 64) / 2 + (device === "laptop" ? sw * DEPTH.laptop * 2.2 * thickness : 0) + sw * 0.01;
  const cssVars = {
    "--hx-st-bg": backgroundColor,
    "--hx-st-bg2": backgroundColor2,
    "--hx-st-shadow": shadow,
    "--hx-st-soft": softness,
    "--hx-st-grain": grain,
    "--hx-st-vig": vignette,
  } as React.CSSProperties;
  const meshColors = colors ?? ["var(--brand)", "var(--chart-2)", "var(--chart-4)"];

  return (
    <StageCtx.Provider value={{ sw, thickness, device, reflection: hasFloor ? reflection : 0, register }}>
      <div
        ref={root}
        role="group"
        aria-label={ariaLabel}
        className={cn("hx-stage", `hx-st-bg-${background}`, orbit && !reduce && "hx-st-orbit", !interactive && "hx-st-static", !selectable && "hx-st-noselect", className)}
        style={{ ...cssVars, ...style }}
        onPointerMove={onPointerMove}
        onPointerLeave={() => { pointer.current.x = pointer.current.y = 0; endDrag(); }}
        onPointerDown={onPointerDown}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={onDoubleClick}
      >
        {background === "mesh" ? (
          <div className="hx-st-mesh" aria-hidden="true">
            {meshColors.slice(0, 4).map((c, i) => <span key={i} style={{ background: c, animationDelay: `${-i * 4}s` }} />)}
          </div>
        ) : null}
        <div ref={world} className={cn("hx-st-world", worldClassName)} style={{ opacity: W ? 1 : 0 }}>
          {hasFloor && W ? (
            <div className="hx-st-floor" aria-hidden="true" style={{ transform: `translate(-50%, -50%) translateY(${floorY}px) rotateX(90deg)`, width: sw * 3.2, height: sw * 3.2 }}>
              <div className="hx-st-contact" style={{ width: sw * (n > 1 && arrange === "row" ? n * 1.1 : 1.05), height: sw * 0.5 }} />
            </div>
          ) : null}
          {W
            ? screens.map((s, i) => {
                const el = s as React.ReactElement<StageScreenProps>;
                const auto = place(n > 1 ? arrange : "single", i, n, aspect);
                return React.cloneElement(el, { key: el.key ?? i, __auto: auto } as Partial<StageScreenProps>);
              })
            : null}
        </div>
        <div className="hx-st-tilt" aria-hidden="true" />
        {title || subtitle ? (
          <div className={cn("hx-st-text", textPosition === "top" ? "hx-st-text-top" : "hx-st-text-bottom", textClassName)}>
            {title ? <p className="hx-st-title">{title}</p> : null}
            {subtitle ? <p className="hx-st-sub">{subtitle}</p> : null}
          </div>
        ) : null}
        <div className="hx-st-finish" aria-hidden="true" />
      </div>
    </StageCtx.Provider>
  );
});

export interface StageScreenProps {
  children?: React.ReactNode;
  /** 设备外框, 默认跟随 Stage */
  device?: StageDevice;
  /** 浏览器 / 窗口外框的地址栏或标题 */
  url?: string;
  /** 内容的设计宽度, px. 内容按这个宽度排版再整体缩放到屏幕里, 像一张高清截图 */
  contentWidth?: number;
  /** 宽高比, 默认按设备 */
  aspect?: number;
  /** 宽度倍数, 相对 Stage 的屏幕宽度 */
  scale?: number;
  /** 手动位置 [x, y, z], 以屏幕宽度为单位; 写了就不参与自动排布 */
  position?: [number, number, number];
  /** 手动旋转 [x, y, z], 度 */
  rotation?: [number, number, number];
  /** 景深层号, 默认按排布 */
  depth?: number;
  /** 屏幕内容可以滚动 */
  scrollable?: boolean;
  /** 加在外框上 */
  className?: string;
  /** 加在内容视口上 */
  screenClassName?: string;
  style?: React.CSSProperties;
  /** 内部: Stage 注入的自动排布 */
  __auto?: { p: [number, number, number]; ry: number; depth: number };
}

export function StageScreen({
  children,
  device: dev,
  url = "hx-ui.dev",
  contentWidth = 1280,
  aspect: asp,
  scale = 1,
  position,
  rotation,
  depth,
  scrollable = false,
  className,
  screenClassName,
  style,
  __auto,
}: StageScreenProps) {
  const ctx = React.useContext(StageCtx);
  const device = dev ?? ctx?.device ?? "browser";
  const sw0 = ctx?.sw ?? 640;
  const sw = sw0 * scale * (dev && dev !== ctx?.device ? (SIZE[dev] ?? 0.62) / (SIZE[ctx?.device ?? "browser"] ?? 0.62) : 1);
  const aspect = asp ?? ASPECT[device];
  const outer = React.useRef<HTMLDivElement>(null);
  const view = React.useRef<HTMLDivElement>(null);
  const content = React.useRef<HTMLDivElement>(null);

  // 内容按设计宽度排版, 再缩放进屏幕
  React.useLayoutEffect(() => {
    const v = view.current, c = content.current;
    if (!v || !c) return;
    const fit = () => {
      const s = v.clientWidth / contentWidth;
      c.style.width = `${contentWidth}px`;
      c.style.height = `${v.clientHeight / Math.max(0.01, s)}px`;
      c.style.transform = `scale(${s})`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(v);
    return () => ro.disconnect();
  }, [contentWidth]);

  const d = depth ?? __auto?.depth ?? 0;
  React.useEffect(() => (outer.current && ctx ? ctx.register(outer.current, d) : undefined), [ctx, d]);

  const p = position ?? __auto?.p ?? [0, 0, 0];
  const r = rotation ?? [0, __auto?.ry ?? 0, 0];
  const transform = `translate(-50%, -50%) translate3d(${p[0] * sw}px, ${p[1] * sw}px, ${p[2] * sw}px) rotateX(${r[0]}deg) rotateY(${r[1]}deg) rotateZ(${r[2]}deg)`;
  const refl = ctx?.reflection ?? 0;
  // 厚度: 背后叠几层同形状的薄片, 侧面看就是实心的机身. 只有纯色, 没有模糊, 很便宜
  const t = sw * DEPTH[device] * (ctx?.thickness ?? 1);
  const layers = t < 1 ? 0 : Math.min(10, Math.max(2, Math.round(t / 1.6)));

  return (
    <div ref={outer} className="hx-st-item" style={{ width: sw, fontSize: Math.max(6, sw / 64), transform }}>
      <div className="hx-st-drop" aria-hidden="true" style={{ transform: `translateZ(${-t - 1}px)` }} />
      {Array.from({ length: layers }, (_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={cn("hx-st-slab", `hx-st-slab-${device}`, i === layers - 1 && "hx-st-back")}
          style={{ transform: `translateZ(${(-t * (i + 1)) / layers}px)` }}
        />
      ))}
      {device === "laptop" ? <LaptopDeck depth={(sw / aspect) * 0.72} t={t} /> : null}
      <div
        className={cn("hx-st-screen", `hx-st-dev-${device}`, className)}
        style={{
          ...(refl > 0 ? ({ WebkitBoxReflect: `below ${Math.round(sw * 0.03 * 2)}px linear-gradient(transparent 62%, rgb(255 255 255 / ${(refl * 0.35).toFixed(3)}))` } as React.CSSProperties) : null),
          ...style,
        }}
      >
        {device === "browser" || device === "window" ? (
          <div className="hx-st-bar" aria-hidden="true">
            <i /><i /><i />
            {device === "browser" ? <span className="hx-st-url">{url}</span> : <span className="hx-st-wtitle">{url}</span>}
          </div>
        ) : null}
        <div ref={view} className={cn("hx-st-view", scrollable && "hx-st-scroll", screenClassName)} style={{ aspectRatio: String(aspect) }}>
          <div ref={content} className="hx-st-content">{children}</div>
          <div className="hx-st-sheen" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

/** 笔记本键盘底座: 一块真正水平放置的板, 从屏幕底边朝镜头伸出 */
function LaptopDeck({ depth, t }: { depth: number; t: number }) {
  const th = Math.max(2, t * 2.2);
  const n = Math.min(6, Math.max(2, Math.round(th / 1.6)));
  return (
    <div className="hx-st-deck" aria-hidden="true" style={{ height: depth }}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className={cn("hx-st-deck-layer", i === n - 1 && "hx-st-deck-bottom")} style={{ transform: `translateZ(${(-th * (i + 1)) / n}px)` }} />
      ))}
      <div className="hx-st-deck-top">
        <div className="hx-st-keys" />
        <div className="hx-st-pad" />
      </div>
    </div>
  );
}
