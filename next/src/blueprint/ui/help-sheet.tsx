"use client";

import { X } from "lucide-react";
import { m } from "motion/react";
import { useEffect, useRef } from "react";
import { Kbd } from "@/components/ui/kbd";
import { GESTURES, SHORTCUTS, keyLabel } from "./shortcuts";

/** "?" sheet. Rendered from the SHORTCUTS table, so the help can never lie about the keys. */
export function HelpSheet({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.querySelector<HTMLElement>("button")?.focus(), []);
  const groups = [...new Set(SHORTCUTS.map((s) => s.group))];
  return (
    <m.div ref={ref} data-bp-overlay role="dialog" aria-label="快捷键" onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Escape" || e.key === "?") { e.preventDefault(); onClose(); } }}
      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.18 }}
      className="scrollbar-thin absolute inset-3 z-50 overflow-y-auto rounded-xl border bg-popover/95 p-4 text-popover-foreground shadow-float backdrop-blur sm:inset-x-auto sm:right-3 sm:w-[min(640px,calc(100%-1.5rem))]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">快捷键</h2>
        <button type="button" aria-label="关闭" onClick={onClose} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"><X className="size-4" /></button>
      </div>
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {groups.map((g) => (
          <section key={g}>
            <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">{g}</h3>
            <dl className="space-y-1 text-[13px]">
              {SHORTCUTS.filter((s) => s.group === g).map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3">
                  <dt>{s.label}</dt>
                  <dd className="flex shrink-0 gap-1">{s.display ? s.display.split(" ").map((p, i) => <Kbd key={i}>{p}</Kbd>) : s.keys.slice(0, 1).map((k) => keyLabel(k).map((p, i) => <Kbd key={i}>{p}</Kbd>))}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <section>
          <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">鼠标</h3>
          <dl className="space-y-1 text-[13px]">
            {GESTURES.map((x) => (
              <div key={x.keys} className="flex items-baseline justify-between gap-3">
                <dt className="shrink-0 text-muted-foreground">{x.keys}</dt>
                <dd className="text-right">{x.label}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </m.div>
  );
}
