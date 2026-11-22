import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ControlValues, InteractionEntry } from "@/interactions/types";

/** 按 meta.controls 自动生成的调参面板. */
export function Controls({ entry, values, onChange }: { entry: InteractionEntry; values: ControlValues; onChange: (v: ControlValues) => void }) {
  const set = (key: string, value: number | boolean | string) => onChange({ ...values, [key]: value });
  return (
    <div className="flex flex-col divide-y">
      {entry.meta.controls.map((c) => (
        <div key={c.key} className="flex flex-col gap-2.5 px-4 py-3.5">
          <div className="flex items-center justify-between text-xs">
            <Label htmlFor={`c-${c.key}`} className="text-xs text-muted-foreground">{c.label}</Label>
            {c.kind === "number" && <span className="tabular font-mono">{String(values[c.key])}</span>}
          </div>
          {c.kind === "number" && (
            <Slider id={`c-${c.key}`} min={c.min} max={c.max} step={c.step ?? 1} value={[Number(values[c.key])]} onValueChange={([n]) => set(c.key, n)} />
          )}
          {c.kind === "boolean" && (
            <Switch id={`c-${c.key}`} checked={Boolean(values[c.key])} onCheckedChange={(b) => set(c.key, b)} />
          )}
          {c.kind === "text" && (
            <Input id={`c-${c.key}`} value={String(values[c.key])} onChange={(e) => set(c.key, e.target.value)} className="h-8" />
          )}
          {c.kind === "select" && (
            <ToggleGroup type="single" variant="outline" size="sm" value={String(values[c.key])} onValueChange={(s) => s && set(c.key, s)} className="w-full">
              {c.options.map((o) => <ToggleGroupItem key={o.value} value={o.value} className="flex-1 text-xs">{o.label}</ToggleGroupItem>)}
            </ToggleGroup>
          )}
        </div>
      ))}
    </div>
  );
}
