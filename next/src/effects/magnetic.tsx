import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { spring } from "@/motion/presets";

/** 磁吸: 指针靠近时子元素被轻轻吸过去. strength 是最大位移比例. */
export function Magnetic({ children, strength = 0.25 }: { children: React.ReactNode; strength?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useSpring(useMotionValue(0), spring.follow);
  const y = useSpring(useMotionValue(0), spring.follow);
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      className="inline-block"
      onPointerMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
