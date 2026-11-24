import { useRef } from "react";

/**
 * Keyboard-accessible splitter between two panels (WAI-ARIA window splitter): role="separator"
 * with aria-valuenow / min / max. Drag with the pointer; ← → (or ↑ ↓) by 16px, Shift by 64px,
 * Home / End jump to min / max, Enter collapses or restores, double-click restores the default.
 *
 * `side` says where the sized panel sits relative to the splitter: "start" (left / top panel,
 * dragging right / down grows it) or "end" (right / bottom panel, dragging right / down shrinks it).
 */
export interface SplitterProps {
  readonly orientation: "vertical" | "horizontal";
  readonly side: "start" | "end";
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly onChange: (v: number) => void;
  /** Enter key: collapse / restore the panel. */
  readonly onToggle?: () => void;
  readonly onReset?: () => void;
  readonly label: string;
  readonly controls?: string;
  readonly className?: string;
}

export function Splitter({ orientation, side, value, min, max, onChange, onToggle, onReset, label, controls, className = "" }: SplitterProps) {
  const drag = useRef<{ start: number; value: number } | null>(null);
  const clamp = (v: number) => Math.round(Math.min(max, Math.max(min, v)));
  const vertical = orientation === "vertical";
  const sign = side === "start" ? 1 : -1;
  return (
    <div role="separator" tabIndex={0} aria-orientation={orientation} aria-label={label} aria-controls={controls}
      aria-valuenow={Math.round(value)} aria-valuemin={min} aria-valuemax={max}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        drag.current = { start: vertical ? e.clientX : e.clientY, value };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const pos = vertical ? e.clientX : e.clientY;
        onChange(clamp(d.value + sign * (pos - d.start)));
      }}
      onPointerUp={() => { drag.current = null; }}
      onPointerCancel={() => { drag.current = null; }}
      onDoubleClick={onReset}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 64 : 16;
        const grow: Record<string, number> = vertical ? { ArrowRight: 1, ArrowLeft: -1 } : { ArrowDown: 1, ArrowUp: -1 };
        const dir = grow[e.key];
        if (dir !== undefined) { e.preventDefault(); e.stopPropagation(); onChange(clamp(value + sign * dir * step)); }
        else if (e.key === "Home") { e.preventDefault(); onChange(min); }
        else if (e.key === "End") { e.preventDefault(); onChange(max); }
        else if (e.key === "Enter" && onToggle) { e.preventDefault(); onToggle(); }
      }}
      className={`group relative z-10 shrink-0 touch-none outline-none ${vertical ? "w-px cursor-col-resize" : "h-px cursor-row-resize"} bg-border ${className}`}>
      {/* wider hit area and a focus / hover indicator, without taking layout space */}
      <span aria-hidden className={`absolute ${vertical ? "inset-y-0 -left-1 -right-1" : "inset-x-0 -top-1 -bottom-1"}`} />
      <span aria-hidden className={`pointer-events-none absolute bg-ring opacity-0 transition-opacity duration-150 group-hover:opacity-60 group-focus-visible:opacity-100 group-active:opacity-100 motion-reduce:transition-none ${vertical ? "inset-y-0 -left-px w-[3px]" : "inset-x-0 -top-px h-[3px]"}`} />
    </div>
  );
}
