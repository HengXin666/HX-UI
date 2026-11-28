"use client";

import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";
import { hasWebGL } from "./theme";

export interface HoverInfo {
  /** 视口坐标 */
  x: number;
  y: number;
  content: ReactNode;
}

/** Frame 交给场景的接口 */
export interface SceneApi {
  reduced: boolean;
  /** 在视口内才渲染, 滚走就停帧 */
  active: boolean;
  onHover: (info: HoverInfo | null) => void;
  /** 场景注册键盘处理, 返回 true 表示已处理 */
  keys: React.MutableRefObject<((key: string) => boolean) | null>;
}

interface Frame3DProps {
  label: string;
  height: number;
  /** 读屏和不支持 WebGL 时看到的数据 */
  fallback: ReactNode;
  hint?: string;
  className?: string;
  children: (api: SceneApi) => ReactNode;
}

/**
 * 3D 图表的外壳: 懒加载 three.js 场景, 加载中显示骨架, 不支持 WebGL 时退回数据表.
 * 负责悬停读数浮层, 键盘入口 (方向键旋转, +/- 缩放, 0 复位), 离开视口停帧.
 */
export function Frame3D({ label, height, fallback, hint = "拖动旋转 · 滚轮缩放 · 双击复位", className, children }: Frame3DProps) {
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const keys = useRef<((key: string) => boolean) | null>(null);
  const [active, setActive] = useState(false);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [gl] = useState(hasWebGL);

  useEffect(() => {
    const el = box.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "120px" });
    io.observe(el); return () => io.disconnect();
  }, []);

  const onHover = useCallback((h: HoverInfo | null) => setHover(h), []);
  const rect = box.current?.getBoundingClientRect();
  const tip = hover && rect ? { left: hover.x - rect.left, top: hover.y - rect.top } : null;
  const flip = tip && rect ? tip.left > rect.width * 0.62 : false;

  if (!gl) {
    return (
      <div className={cn("w-full rounded-lg border p-4 text-sm", className)}>
        <p className="mb-3 text-muted-foreground">此设备不支持 WebGL，以下是图表数据。</p>
        {fallback}
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        ref={box}
        role="group"
        tabIndex={0}
        aria-label={`${label}。方向键旋转，加减号缩放，0 复位。`}
        onKeyDown={(e) => { if (keys.current?.(e.key)) e.preventDefault(); }}
        onPointerLeave={() => setHover(null)}
        className="relative overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ height }}
      >
        <Suspense fallback={<div aria-hidden className="absolute inset-0 animate-pulse rounded-lg bg-muted/40 motion-reduce:animate-none" />}>
          <div aria-hidden className="absolute inset-0 animate-[hx-fade-in_400ms_ease-out_both]">
            {children({ reduced, active, onHover, keys })}
          </div>
        </Suspense>
        {tip && hover && (
          <div
            aria-hidden
            className="pointer-events-none absolute z-10 min-w-36 rounded-lg border bg-popover/95 px-3 py-2 text-xs text-popover-foreground shadow-float backdrop-blur transition-[left,top] duration-75"
            style={{ left: tip.left + (flip ? -14 : 14), top: tip.top + 14, transform: flip ? "translateX(-100%)" : undefined }}
          >
            {hover.content}
          </div>
        )}
        <div className="sr-only">{fallback}</div>
      </div>
      {hint && <p className="mt-2 text-center text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** 浮层里的一行: 标签 + 数值 */
export function TipRow({ label, value, color }: { label: string; value: ReactNode; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {color && <span className="size-2 rounded-full" style={{ background: color }} />}
        {label}
      </span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}
