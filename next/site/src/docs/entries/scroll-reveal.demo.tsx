import { useRef } from "react";
import { ScrollReveal, type RevealEffect } from "@/scroll/scroll-reveal";
import type { DemoProps } from "../types";

export default function ScrollRevealDemo({ values: v }: DemoProps) {
  const box = useRef<HTMLDivElement>(null);
  return (
    <div ref={box} className="absolute inset-0 overflow-y-auto overscroll-contain" tabIndex={0} aria-label="滚动区域">
      <div className="grid h-full place-items-center">
        <p className="flex flex-col items-center gap-1 text-xs text-muted-foreground">在这个框里往下滚<span aria-hidden="true">↓</span></p>
      </div>
      <div className="mx-auto max-w-[760px] px-6 pb-[12vh] sm:px-10">
        <ScrollReveal
          scrollContainerRef={box}
          mode={v.mode as "scrub" | "enter"}
          splitBy={v.splitBy as "words"}
          effect={v.effect as RevealEffect}
          highlightColor={String(v.highlight)}
          stagger={Number(v.stagger)}
          duration={Number(v.duration)}
          smoothing={Number(v.smoothing)}
          baseOpacity={Number(v.baseOpacity)}
          baseRotation={Number(v.baseRotation)}
          baseOffset={Number(v.baseOffset)}
          blurStrength={Number(v.blurStrength)}
          enableBlur={Boolean(v.enableBlur)}
          containerClassName="text-[1.7rem] font-semibold leading-[1.2] tracking-[-0.025em] sm:text-[2.6rem]"
        >
          {String(v.text)}
        </ScrollReveal>
      </div>
    </div>
  );
}
