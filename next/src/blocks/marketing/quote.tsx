import type * as React from "react";
import { Reveal } from "@/motion/reveal";
import { cn } from "@/lib/utils";

/** 单条大证言: 一句话说服力胜过一墙卡片. aside 放可量化的结果. */
export function Quote({ quote, name, role, avatar, aside, className }: {
  quote: string;
  name: string;
  role: string;
  avatar?: string;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <Reveal className={cn("grid gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-16", className)}>
      <figure>
        <blockquote className="max-w-3xl text-pretty text-2xl font-medium leading-snug tracking-[-0.02em] md:text-[2.1rem] md:leading-[1.3]">
          <span aria-hidden className="text-muted-foreground/50">“</span>{quote}<span aria-hidden className="text-muted-foreground/50">”</span>
        </blockquote>
        <figcaption className="mt-8 flex items-center gap-3 text-sm">
          {avatar ? <img src={avatar} alt="" className="size-9 rounded-full object-cover" /> : <span className="grid size-9 place-items-center rounded-full bg-muted font-medium">{name.slice(0, 1)}</span>}
          <span><span className="font-medium">{name}</span><span className="block text-muted-foreground">{role}</span></span>
        </figcaption>
      </figure>
      {aside && <div className="md:border-l md:pl-10">{aside}</div>}
    </Reveal>
  );
}
