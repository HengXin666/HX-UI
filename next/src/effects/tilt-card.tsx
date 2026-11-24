"use client";

import * as React from "react";
import { m, useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";
import { spring } from "@/motion/presets";

export interface TiltCardProps {
  className?: string;
  children: React.ReactNode;
  /** 最大倾角, 度 */
  max?: number;
  /** 悬停时放大到多少 */
  scale?: number;
  /** 反光: 一层跟随指针的高光 */
  glare?: boolean;
}

/** 3D 倾斜卡片: 适合商品图 / 产品截图. 只动 transform 与高光层的 opacity. */
export function TiltCard({ className, children, max = 8, scale = 1, glare = false }: TiltCardProps) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const hover = useMotionValue(0);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), spring.follow);
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), spring.follow);
  const s = useSpring(useTransform(hover, [0, 1], [1, scale]), spring.follow);
  const gx = useTransform(px, (v) => `${v * 100}%`);
  const gy = useTransform(py, (v) => `${v * 100}%`);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${gx} ${gy}, oklch(1 0 0 / 0.35), transparent 55%)`;
  const glareOpacity = useSpring(hover, spring.follow);
  return (
    <div className="[perspective:1000px]">
      <m.div
        className={cn("relative [transform-style:preserve-3d]", className)}
        style={reduce ? undefined : { rotateX: rx, rotateY: ry, scale: s }}
        onPointerEnter={() => hover.set(1)}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          px.set((e.clientX - r.left) / r.width);
          py.set((e.clientY - r.top) / r.height);
        }}
        onPointerLeave={() => {
          px.set(0.5);
          py.set(0.5);
          hover.set(0);
        }}
      >
        {children}
        {glare && !reduce && (
          <m.span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-overlay" style={{ backgroundImage: glareBg, opacity: glareOpacity }} />
        )}
      </m.div>
    </div>
  );
}
