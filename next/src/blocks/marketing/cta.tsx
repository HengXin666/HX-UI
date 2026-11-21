import type * as React from "react";
import { Reveal } from "@/motion/reveal";

/** 收尾号召: 深色块 + 噪点 + 品牌光. */
export function Cta({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <section className="px-4 py-20">
      <Reveal preset="scale" className="hx-noise relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-[oklch(0.18_0.01_270)] px-6 py-16 text-center text-white md:py-20">
        <div aria-hidden className="absolute left-1/2 top-0 h-64 w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/50 blur-[90px]" />
        <h2 className="relative text-balance text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
        {description && <p className="relative mx-auto mt-4 max-w-xl text-white/70">{description}</p>}
        {actions && <div className="relative mt-8 flex flex-wrap justify-center gap-3">{actions}</div>}
      </Reveal>
    </section>
  );
}
