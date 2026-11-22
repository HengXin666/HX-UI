import * as React from "react";
import { ArrowRight } from "lucide-react";
import { m, useScroll, useTransform } from "motion/react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { Reveal } from "@/motion/reveal";
import { Backdrop } from "@/effects/backdrop";
import { cn } from "@/lib/utils";

interface HeroProps {
  eyebrow?: { label: string; href?: string };
  title: string;
  /** 第二行, 用弱化色; 主次两句话的写法, 不再做渐变字 */
  highlight?: string;
  description: string;
  actions?: React.ReactNode;
  /** 产品界面 / 活组件 / 视频 */
  media?: React.ReactNode;
  align?: "center" | "left";
  /** 背景: 默认无. 成熟发布页靠排版和产品图撑场面, 不靠光晕 */
  backdrop?: "grid" | "dots" | "aurora" | "glow" | "none";
  /** 媒体随滚动从倾斜摆正 (仅 transform) */
  tilt?: boolean;
  className?: string;
}

/** 媒体: 进视口前带透视倾斜, 滚动到位后摆正. 减弱动效时始终平放. */
function TiltMedia({ children, enabled }: { children: React.ReactNode; enabled: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.35"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [14, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [24, 0]);
  if (!enabled || reduce) return <div ref={ref}>{children}</div>;
  return (
    <div ref={ref} style={{ perspective: 1600 }}>
      <m.div style={{ rotateX, scale, y, transformOrigin: "50% 0%" }}>{children}</m.div>
    </div>
  );
}

/** 首屏: 公告 → 两句标题 (主句 + 弱化句) → 说明 → 按钮 → 产品界面. */
export function Hero({ eyebrow, title, highlight, description, actions, media, align = "left", backdrop = "none", tilt = true, className }: HeroProps) {
  const center = align === "center";
  return (
    <section className={cn("relative px-5 pt-16 md:px-8 md:pt-24", media ? "pb-0" : "pb-20", className)}>
      {backdrop !== "none" && <Backdrop variant={backdrop} />}
      <div className={cn("relative mx-auto max-w-6xl", center && "text-center")}>
        {eyebrow && (
          <a href={eyebrow.href ?? "#"} className="group mb-8 inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground">
            <span className="rounded-full border px-2 py-px text-[11px] font-medium text-foreground">新</span>
            {eyebrow.label}
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </a>
        )}
        {/* 公告, 标题, 说明, 按钮不做透明度入场: 它们是 LCP, 必须随 HTML 第一帧画出来 */}
        <h1 className={cn("text-balance text-[2.6rem] font-medium leading-[1.06] tracking-[-0.03em] sm:text-6xl md:text-7xl", center ? "mx-auto max-w-4xl" : "max-w-4xl")}>
          {title}
          {highlight && <span className="block text-muted-foreground/70">{highlight}</span>}
        </h1>
        <p className={cn("mt-6 max-w-xl text-pretty text-[17px] leading-relaxed text-muted-foreground md:text-lg", center && "mx-auto")}>{description}</p>
        {actions && <div className={cn("mt-9 flex flex-wrap items-center gap-x-5 gap-y-3", center && "justify-center")}>{actions}</div>}
      </div>
      {media && (
        <Reveal preset="fade" delay={0.2} inView={false} className="relative mx-auto mt-16 max-w-6xl md:mt-20">
          <TiltMedia enabled={tilt}>{media}</TiltMedia>
        </Reveal>
      )}
    </section>
  );
}
