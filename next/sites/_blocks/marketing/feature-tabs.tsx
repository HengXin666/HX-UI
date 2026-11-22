import * as React from "react";
import { AnimatePresence, m, useInView } from "motion/react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

export interface FeatureTab {
  title: string;
  description: string;
  /** 右侧视觉: 活组件优先, 其次截图 */
  visual: React.ReactNode;
}

/**
 * 特性轮播: 左侧条目 + 右侧视觉, 自动前进, 当前条目底部有进度线.
 * 悬停 / 聚焦暂停; 减弱动效时不自动前进, 视觉直接切换.
 */
export function FeatureTabs({ tabs, interval = 7000, className }: { tabs: FeatureTab[]; interval?: number; className?: string }) {
  const [i, setI] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px" });
  const reduce = useReducedMotion();
  const auto = !reduce && !paused && inView;

  React.useEffect(() => {
    if (!auto) return;
    const t = window.setTimeout(() => setI((v) => (v + 1) % tabs.length), interval);
    return () => window.clearTimeout(t);
  }, [auto, i, interval, tabs.length]);

  return (
    <div ref={ref} className={cn("grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-12", className)} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div role="tablist" aria-orientation="vertical" className="flex flex-col">
        {tabs.map((t, k) => {
          const on = k === i;
          return (
            <button
              key={t.title}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setI(k)}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
              className={cn("relative border-t py-5 text-left transition-colors", on ? "border-foreground/15" : "border-border")}
            >
              <span aria-hidden className="absolute -top-px left-0 h-px w-full overflow-hidden">
                {on && (
                  <span
                    key={`${i}-${auto}`}
                    className={cn("block h-full origin-left bg-foreground", auto ? "animate-[hx-progress_linear_forwards]" : "")}
                    style={auto ? { animationDuration: `${interval}ms` } : undefined}
                  />
                )}
              </span>
              <div className={cn("font-medium transition-colors", on ? "text-foreground" : "text-muted-foreground")}>{t.title}</div>
              <div className={cn("grid transition-[grid-template-rows,opacity] duration-300", on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                <p className="overflow-hidden text-sm leading-relaxed text-muted-foreground"><span className="block pt-2">{t.description}</span></p>
              </div>
            </button>
          );
        })}
      </div>
      <div className="relative min-w-0">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={i}
            role="tabpanel"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {tabs[i].visual}
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
