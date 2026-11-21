import type * as React from "react";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/motion/reveal";
import { TextReveal } from "@/motion/text-effect";
import { Backdrop } from "@/effects/backdrop";
import { cn } from "@/lib/utils";

interface HeroProps {
  eyebrow?: { label: string; href?: string };
  title: string;
  /** 标题里要加渐变强调的那段 */
  highlight?: string;
  description: string;
  actions?: React.ReactNode;
  /** 产品截图 / 活组件 / 视频 */
  media?: React.ReactNode;
  align?: "center" | "left";
  backdrop?: "grid" | "dots" | "aurora" | "glow" | "none";
  className?: string;
}

/** 首屏: 徽标 → 标题逐词入场 → 说明 → 按钮 → 媒体上浮. */
export function Hero({ eyebrow, title, highlight, description, actions, media, align = "center", backdrop = "glow", className }: HeroProps) {
  const center = align === "center";
  return (
    <section className={cn("relative overflow-hidden px-4 pb-16 pt-20 md:pt-28", className)}>
      {backdrop !== "none" && <Backdrop variant={backdrop} />}
      {backdrop === "glow" && <Backdrop variant="grid" className="opacity-50 [mask-image:radial-gradient(ellipse_55%_45%_at_50%_0%,#000_10%,transparent_75%)]" />}
      <div className={cn("relative mx-auto max-w-6xl", center ? "text-center" : "grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]")}>
        <div className={cn(center && "mx-auto max-w-3xl")}>
          {eyebrow && (
            <Reveal preset="blur" inView={false}>
              <a href={eyebrow.href ?? "#"} className="group mb-6 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur transition-colors hover:text-foreground">
                <span className="size-1.5 rounded-full bg-brand" />
                {eyebrow.label}
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </a>
            </Reveal>
          )}
          <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
            <TextReveal text={title} />
            {highlight && (
              <span className="hx-text-gradient block"><TextReveal text={highlight} delay={0.25} /></span>
            )}
          </h1>
          <Reveal preset="up" delay={0.35} inView={false}>
            <p className={cn("mt-6 text-pretty text-lg text-muted-foreground", center && "mx-auto max-w-2xl")}>{description}</p>
          </Reveal>
          {actions && (
            <Reveal preset="up" delay={0.45} inView={false}>
              <div className={cn("mt-8 flex flex-wrap gap-3", center && "justify-center")}>{actions}</div>
            </Reveal>
          )}
        </div>
        {media && (
          <Reveal preset="up" delay={0.55} inView={false} className={cn(center && "mx-auto mt-16 max-w-5xl")}>
            {media}
          </Reveal>
        )}
      </div>
    </section>
  );
}
