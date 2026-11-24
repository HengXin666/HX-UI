"use client";

import { m } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import type { CommentTone } from "../types";
import { COMMENT_TONES, TONE_LABEL } from "./comment-view";
import { keyLabel } from "./shortcuts";

/** Small right-click menu (node / wire / comment). Items come from menu-items.ts. */

export type MenuEntry =
  | { readonly kind?: "item"; readonly label: string; readonly keys?: string; readonly danger?: boolean; readonly disabled?: boolean; readonly run: () => void }
  | { readonly kind: "sep" }
  | { readonly kind: "tones"; readonly value: CommentTone; readonly run: (t: CommentTone) => void };

export function ContextMenu({ title, items, sx, sy, host, onClose }: {
  title: string; items: readonly MenuEntry[]; sx: number; sy: number; host: HTMLElement | null; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: sx, top: sy });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !host) return;
    setPos({
      left: Math.max(8, Math.min(sx, host.clientWidth - el.offsetWidth - 8)),
      top: Math.max(8, Math.min(sy, host.clientHeight - el.offsetHeight - 8)),
    });
    el.querySelector<HTMLElement>("[role=menuitem]:not([aria-disabled=true]), [role=menuitemradio]")?.focus();
  }, [sx, sy, host]);

  const close = () => { onClose(); host?.focus(); };
  const onKey = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    const list = [...(ref.current?.querySelectorAll<HTMLElement>("[role=menuitem]:not([aria-disabled=true]), [role=menuitemradio]") ?? [])];
    const i = list.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); list[(i + 1) % list.length]?.focus(); }
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); list[(i - 1 + list.length) % list.length]?.focus(); }
    else if (e.key === "Tab") { e.preventDefault(); close(); }
  };

  return (
    <m.div ref={ref} data-bp-overlay role="menu" aria-label={title} onKeyDown={onKey} onPointerDown={(e) => e.stopPropagation()}
      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
      className="absolute z-40 min-w-52 rounded-lg border bg-popover p-1 text-sm text-popover-foreground shadow-float"
      style={{ left: pos.left, top: pos.top }}>
      <div className="px-2 pt-1 pb-1.5 text-[11px] font-medium text-muted-foreground" role="presentation">{title}</div>
      {items.map((it, i) => {
        if (it.kind === "sep") return <div key={i} role="separator" className="-mx-1 my-1 h-px bg-border" />;
        if (it.kind === "tones") {
          return (
            <div key={i} role="group" aria-label="颜色" className="flex flex-wrap gap-1 px-2 py-1.5">
              {COMMENT_TONES.map((t) => (
                <button key={t} type="button" role="menuitemradio" aria-checked={it.value === t} aria-label={TONE_LABEL[t]} title={TONE_LABEL[t]}
                  onClick={() => { it.run(t); close(); }}
                  className="bp-swatch outline-offset-2 aria-checked:outline-2 aria-checked:outline-ring" data-tone={t} />
              ))}
            </div>
          );
        }
        return (
          <button key={i} type="button" role="menuitem" aria-disabled={it.disabled || undefined}
            onClick={() => { if (it.disabled) return; it.run(); close(); }}
            className={`flex w-full items-center justify-between gap-6 rounded-md px-2 py-1.5 text-left outline-none focus-visible:bg-accent hover:bg-accent aria-disabled:opacity-50 ${it.danger ? "text-destructive" : ""}`}>
            <span>{it.label}</span>
            {it.keys ? <span className="font-mono text-[11px] text-muted-foreground">{keyLabel(it.keys).join(" ")}</span> : null}
          </button>
        );
      })}
    </m.div>
  );
}
