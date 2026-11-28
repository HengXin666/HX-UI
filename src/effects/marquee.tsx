import * as React from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 一轮秒数, 越大越慢 */
  duration?: number;
  reverse?: boolean;
  vertical?: boolean;
  pauseOnHover?: boolean;
  /** 两端淡出 */
  fade?: boolean;
  /** 两项之间的间距, 像素 */
  gap?: number;
}

/** 无限跑马灯: 内容复制两份, 纯 CSS 动画. */
export function Marquee({ duration = 40, reverse, vertical, pauseOnHover = true, fade = true, gap = 40, className, children, style, ...rest }: MarqueeProps) {
  const track = cn(
    "flex shrink-0 gap-[var(--marquee-gap)]",
    vertical ? "flex-col animate-marquee-vertical" : "animate-marquee",
    reverse && "[animation-direction:reverse]",
    pauseOnHover && "group-hover:[animation-play-state:paused]",
  );
  return (
    <div
      className={cn(
        "group flex overflow-hidden gap-[var(--marquee-gap)]",
        vertical && "flex-col",
        fade && (vertical
          ? "[mask-image:linear-gradient(to_bottom,transparent,#000_12%,#000_88%,transparent)]"
          : "[mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent)]"),
        className,
      )}
      style={{ "--marquee-duration": `${duration}s`, "--marquee-gap": `${gap}px`, ...style } as React.CSSProperties}
      {...rest}
    >
      <div className={track}>{children}</div>
      <div className={track} aria-hidden>{children}</div>
    </div>
  );
}
