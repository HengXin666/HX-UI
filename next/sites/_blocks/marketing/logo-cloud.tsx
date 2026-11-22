import type * as React from "react";
import { Marquee } from "@/effects/marquee";

/** 客户标识墙: 跑马灯, 悬停暂停. logos 用文字或 svg 节点. */
export function LogoCloud({ label, logos }: { label?: string; logos: React.ReactNode[] }) {
  return (
    <div className="px-4 py-10">
      {label && <p className="mb-6 text-center text-sm text-muted-foreground">{label}</p>}
      <Marquee duration={36} className="mx-auto max-w-5xl">
        {logos.map((l, i) => (
          <div key={i} className="flex h-10 items-center text-lg font-semibold tracking-tight text-muted-foreground/70 grayscale transition hover:text-foreground">{l}</div>
        ))}
      </Marquee>
    </div>
  );
}
