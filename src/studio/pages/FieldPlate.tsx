"use client";

import type { JSX } from "react";
import { cn } from "../../primitives/utils";
import { STUDIO_CLASS } from "../classes";
import { FIELD_LOG } from "./copy";

/** 产品界面的手搓稿: 一条决定记录, 密度按真的周会, 不是标语卡片. */
export function FieldPlate(): JSX.Element {
  return (
    <div className={cn("h-full gap-3 p-4 md:p-5", STUDIO_CLASS.stack)} aria-hidden>
      <div className="flex items-center justify-between gap-3">
        <span className={STUDIO_CLASS.label}>岸本设计  /  第 42 周</span>
        <span className="text-xs tabular-nums text-muted-foreground">3 条未决</span>
      </div>
      <ol className={STUDIO_CLASS.stack}>
        {FIELD_LOG.map((item) => (
          <li key={item.title} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 border-t border-border py-3">
            <span className="text-xs tabular-nums text-muted-foreground">{item.time}</span>
            <span>
              <span className="block text-sm font-medium text-foreground">{item.title}</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{item.note}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
