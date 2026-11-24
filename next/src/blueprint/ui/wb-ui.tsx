import { ChevronRight } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import type { Registry } from "../registry";
import { containerType, parseContainer, type ContainerKind } from "../registry";
import { TYPE_LABEL } from "./labels";

/**
 * Small building blocks shared by the workbench panels (My Blueprint, Details, the dock): a
 * collapsible section, a label + control row, text fields that commit on blur / Enter, a type
 * picker with UE5's container switch. Plain elements styled with the theme tokens; no new deps.
 */

export const PANEL_BTN = "inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40";
export const ICON_BTN = "grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40";
/** Field chrome without a width (combine with w-full or a fixed width). */
export const FIELD = "h-7 min-w-0 rounded-md border bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60";
export const INPUT = `${FIELD} w-full`;

/** A collapsible group with a header row (title, count, actions). */
export function Section({ title, count, actions, children, defaultOpen = true, open: forced }: {
  title: string; count?: number; actions?: ReactNode; children: ReactNode; defaultOpen?: boolean; open?: boolean;
}) {
  const [own, setOwn] = useState(defaultOpen);
  const open = forced ?? own;
  const id = useId();
  return (
    <section className="border-b last:border-b-0">
      <div className="flex h-8 items-center gap-1 pr-1 pl-1">
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOwn((o) => !o)}
          className="flex h-7 min-w-0 flex-1 items-center gap-1 rounded-md px-1 text-left text-xs font-semibold hover:bg-accent/60">
          <ChevronRight aria-hidden className={`size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 motion-reduce:transition-none ${open ? "rotate-90" : ""}`} />
          <span className="truncate">{title}</span>
          {count !== undefined ? <span className="ml-1 font-normal text-muted-foreground tabular-nums">{count}</span> : null}
        </button>
        {actions}
      </div>
      <div id={id} hidden={!open} className="pb-1.5">{children}</div>
    </section>
  );
}

/** label | control, stacked on narrow panels. */
export function Field({ label, children, hint, htmlFor }: { label: string; children: ReactNode; hint?: ReactNode; htmlFor?: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-x-2 gap-y-0.5 px-3 py-1">
      <label htmlFor={htmlFor} className="pt-1.5 text-[11px] leading-4 text-muted-foreground">{label}</label>
      <div className="min-w-0">
        {children}
        {hint ? <div className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{hint}</div> : null}
      </div>
    </div>
  );
}

/** Text input that commits on blur or Enter (Esc reverts). Re-keyed on `value` so outside edits show. */
export function TextField({ value, onCommit, placeholder, label, id, disabled, multiline, mono }: {
  value: string; onCommit: (v: string) => void; placeholder?: string; label: string; id?: string; disabled?: boolean; multiline?: boolean; mono?: boolean;
}) {
  const common = {
    id, defaultValue: value, placeholder, disabled, "aria-label": label, spellCheck: false,
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { if (e.currentTarget.value !== value) onCommit(e.currentTarget.value); },
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.stopPropagation();
      if (e.key === "Enter" && (!multiline || e.ctrlKey || e.metaKey)) { e.preventDefault(); e.currentTarget.blur(); }
      if (e.key === "Escape") { e.currentTarget.value = value; e.currentTarget.blur(); }
    },
  };
  return multiline
    ? <textarea key={value} {...common} rows={3} className={`${INPUT} h-auto resize-y py-1.5 leading-4 ${mono ? "font-mono" : ""}`} />
    : <input key={value} {...common} className={`${INPUT} ${mono ? "font-mono" : ""}`} />;
}

/** Number input committing on blur / Enter; empty = undefined. */
export function NumberField({ value, onCommit, label, min, step = "any", disabled, placeholder }: {
  value: number | undefined; onCommit: (v: number | undefined) => void; label: string; min?: number; step?: number | "any"; disabled?: boolean; placeholder?: string;
}) {
  const text = value === undefined ? "" : String(value);
  return (
    <input key={text} type="number" defaultValue={text} aria-label={label} min={min} step={step} disabled={disabled} placeholder={placeholder}
      onBlur={(e) => {
        const raw = e.currentTarget.value;
        const v = raw === "" || Number.isNaN(Number(raw)) ? undefined : Number(raw);
        if (v !== value) onCommit(v);
      }}
      onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") e.currentTarget.blur(); }}
      className={`${INPUT} font-mono`} />
  );
}

export function Check({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className="flex h-7 cursor-pointer items-center gap-2 text-xs has-disabled:cursor-default has-disabled:opacity-60">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="size-3.5 accent-foreground" />
      {label}
    </label>
  );
}

export function Select<T extends string>({ value, options, onChange, label, disabled, id }: {
  value: T; options: readonly { readonly value: T; readonly label: string }[]; onChange: (v: T) => void; label: string; disabled?: boolean; id?: string;
}) {
  return (
    <select id={id} value={value} aria-label={label} disabled={disabled} onChange={(e) => onChange(e.target.value as T)}
      onKeyDown={(e) => e.stopPropagation()} className={`${INPUT} px-1.5`}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

const CONTAINERS: readonly { value: ContainerKind; label: string }[] = [
  { value: "single", label: "单个" }, { value: "array", label: "数组" }, { value: "set", label: "集合" }, { value: "map", label: "映射" },
];

export function typeName(reg: Registry, id: string): string {
  const c = parseContainer(id);
  const base = (t: string) => TYPE_LABEL[t] ?? reg.type(t)?.label ?? t;
  if (c.kind === "single") return base(id);
  if (c.kind === "map") return `映射 ${base(c.key ?? "string")} → ${base(c.of)}`;
  return `${c.kind === "array" ? "数组" : "集合"} · ${base(c.of)}`;
}

/**
 * Type picker: base type + container (UE5 variable "single / array / set / map" switch; map gets a
 * key type). `exec` is offered only when `allowExec` (macro and collapsed-graph pins).
 */
export function TypePicker({ reg, value, onChange, label, disabled, allowExec = false, containers = true }: {
  reg: Registry; value: string; onChange: (t: string) => void; label: string; disabled?: boolean; allowExec?: boolean; containers?: boolean;
}) {
  const c = parseContainer(value);
  // registered container types (e.g. "numbers") show as themselves, single
  const bases = [...reg.types.values()].filter((t) => (allowExec || t.shape !== "exec") && (t.shape === "data" || t.shape === "exec" || t.id === value));
  const baseOpts = bases.map((t) => ({ value: t.id, label: TYPE_LABEL[t.id] ?? t.label ?? t.id }));
  const isExec = reg.isExec(c.of);
  return (
    <div className="flex min-w-0 gap-1">
      {containers && !isExec ? (
        <select aria-label={`${label}：容器`} value={c.kind} disabled={disabled} onKeyDown={(e) => e.stopPropagation()}
          onChange={(e) => onChange(containerType(e.target.value as ContainerKind, c.of, c.key))} className={`${FIELD} w-[4.25rem] shrink-0 px-1`}>
          {CONTAINERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : null}
      {c.kind === "map" ? (
        <select aria-label={`${label}：键类型`} value={c.key} disabled={disabled} onKeyDown={(e) => e.stopPropagation()}
          onChange={(e) => onChange(containerType("map", c.of, e.target.value))} className={`${FIELD} min-w-0 flex-1 px-1`}>
          {baseOpts.filter((o) => !reg.isExec(o.value)).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : null}
      <select aria-label={label} value={c.of} disabled={disabled} onKeyDown={(e) => e.stopPropagation()}
        onChange={(e) => onChange(reg.isExec(e.target.value) ? e.target.value : containerType(c.kind, e.target.value, c.key))} className={`${FIELD} min-w-0 flex-1 px-1`}>
        {baseOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

/** Literal editor for a value of `type`: number / text / switch, JSON for containers and objects. */
export function ValueField({ reg, type, value, onCommit, label, disabled }: {
  reg: Registry; type: string; value: unknown; onCommit: (v: unknown) => void; label: string; disabled?: boolean;
}) {
  const shape = reg.shape(type);
  if (shape === "exec") return <span className="text-[11px] text-muted-foreground">执行引脚</span>;
  if (shape === "data" && type !== "any" && type !== "object") {
    if (reg.assignable(type, "boolean")) return <Check checked={Boolean(value)} onChange={onCommit} label={value ? "真" : "假"} disabled={disabled} />;
    if (reg.assignable(type, "number")) return <NumberField value={typeof value === "number" ? value : undefined} onCommit={onCommit} label={label} disabled={disabled} placeholder="默认" />;
    if (reg.assignable(type, "string")) return <TextField value={value === undefined ? "" : String(value)} onCommit={(v) => onCommit(v)} label={label} disabled={disabled} placeholder="默认" />;
  }
  return <JsonField value={value} onCommit={onCommit} label={label} disabled={disabled} />;
}

function JsonField({ value, onCommit, label, disabled }: { value: unknown; onCommit: (v: unknown) => void; label: string; disabled?: boolean }) {
  const [err, setErr] = useState<string>();
  const text = value === undefined ? "" : JSON.stringify(value instanceof Set ? [...value] : value instanceof Map ? Object.fromEntries(value) : value);
  return (
    <div>
      <input key={text} defaultValue={text} aria-label={label} aria-invalid={err ? true : undefined} disabled={disabled} spellCheck={false} placeholder="JSON，例如 [1, 2]"
        onBlur={(e) => {
          const raw = e.currentTarget.value.trim();
          if (raw === text) return;
          if (!raw) { setErr(undefined); return onCommit(undefined); }
          try { onCommit(JSON.parse(raw)); setErr(undefined); } catch { setErr("不是合法的 JSON"); }
        }}
        onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") e.currentTarget.blur(); }}
        className={`${INPUT} font-mono aria-invalid:border-destructive`} />
      {err ? <div role="alert" className="mt-0.5 text-[11px] text-destructive">{err}</div> : null}
    </div>
  );
}

/** "Nothing here" line inside a panel. */
export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-3 py-2 text-xs leading-5 text-muted-foreground">{children}</p>;
}
