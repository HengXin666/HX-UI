import * as React from "react";
import { m, useMotionValue, useSpring, useTransform } from "motion/react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";
import { spring } from "@/motion/presets";

/** 3D 倾斜卡片: 适合商品图 / 产品截图. max 是最大倾角. */
export function TiltCard({ className, children, max = 8 }: { className?: string; children: React.ReactNode; max?: number }) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), spring.follow);
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), spring.follow);
  return (
    <div className="[perspective:1000px]">
      <m.div
        className={cn("relative [transform-style:preserve-3d]", className)}
        style={reduce ? undefined : { rotateX: rx, rotateY: ry }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          px.set((e.clientX - r.left) / r.width);
          py.set((e.clientY - r.top) / r.height);
        }}
        onPointerLeave={() => {
          px.set(0.5);
          py.set(0.5);
        }}
      >
        {children}
      </m.div>
    </div>
  );
}
