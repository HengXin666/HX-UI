import { RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Control, Values } from "./types";

function Cell({ label, htmlFor, children, wide }: { label: string; htmlFor: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn("flex min-h-12 items-center justify-between gap-3 rounded-lg bg-[var(--panel-cell)] px-3", wide && "sm:col-span-2 lg:col-span-3")}>
      <label htmlFor={htmlFor} className="shrink-0 text-[13px] text-muted-foreground">{label}</label>
      <div className="flex min-w-0 flex-1 items-center justify-end">{children}</div>
    </div>
  );
}

function ControlInput({ c, value, set }: { c: Control; value: Values[string]; set: (v: Values[string]) => void }) {
  const id = `ctl-${c.key}`;
  switch (c.type) {
    case "select":
      // 用库自己的 Select: 浮层有进出动画, 键盘可选, 也顺便给组件做真实使用
      return (
        <Cell label={c.label} htmlFor={id}>
          <Select value={String(value)} onValueChange={(v) => set(v)}>
            <SelectTrigger id={id} size="sm" className="h-8 max-w-44 border-0 bg-transparent pr-1.5 text-[13px] font-medium shadow-none hover:bg-accent dark:bg-transparent dark:hover:bg-accent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" className="max-h-72">
              {c.options.map((o) => <SelectItem key={o.value} value={o.value} className="text-[13px]">{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Cell>
      );
    case "number":
      return (
        <Cell label={c.label} htmlFor={id}>
          <Slider id={id} aria-label={c.label} className="max-w-32" min={c.min} max={c.max} step={c.step} value={[Number(value)]} onValueChange={([v]) => set(v)} />
          <output htmlFor={id} className="w-14 text-right font-mono text-xs tabular-nums">{Number(value).toFixed(c.step < 0.01 ? 3 : 2)}{c.unit}</output>
        </Cell>
      );
    case "toggle":
      return (
        <Cell label={c.label} htmlFor={id}>
          <Switch id={id} checked={Boolean(value)} onCheckedChange={set} />
        </Cell>
      );
    case "text":
      return (
        <Cell label={c.label} htmlFor={id} wide>
          <input
            id={id}
            value={String(value)}
            onChange={(e) => set(e.target.value)}
            maxLength={80}
            className="h-8 w-full max-w-xl rounded-md bg-transparent px-2 text-right text-[13px] font-medium outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          />
        </Cell>
      );
  }
}

export function ControlsPanel({
  controls,
  values,
  onChange,
  presets,
  onPreset,
  onReset,
  activePreset,
}: {
  controls: Control[];
  values: Values;
  onChange: (key: string, v: Values[string]) => void;
  presets?: { label: string; values: Values }[];
  onPreset: (v: Values) => void;
  onReset: () => void;
  activePreset: number;
}) {
  return (
    <section aria-labelledby="customize" className="rounded-xl border bg-card/40 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 id="customize" className="mr-2 text-sm font-medium">调参</h2>
        {presets?.map((p, i) => (
          <button
            key={p.label}
            type="button"
            aria-pressed={activePreset === i}
            onClick={() => onPreset(p.values)}
            className="h-7 rounded-full border px-3 text-xs text-muted-foreground transition-[color,background-color,border-color,transform] duration-150 hover:text-foreground active:scale-[0.96] aria-pressed:border-[var(--cat)] aria-pressed:bg-[color-mix(in_oklch,var(--cat)_14%,transparent)] aria-pressed:text-foreground"
          >
            {p.label}
          </button>
        ))}
        <button type="button" onClick={onReset} className="group ml-auto inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground">
          <RotateCcw className="size-3.5 transition-transform duration-300 ease-out group-hover:-rotate-90" />重置
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {controls.map((c) => <ControlInput key={c.key} c={c} value={values[c.key]} set={(v) => onChange(c.key, v)} />)}
      </div>
    </section>
  );
}
