import type { JSX } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Slider, Switch, cn } from "@hx/ui";
import { GRADIENT_STOP } from "../../../../src/constants/typography";
import { CARD, INSET, SECTION_TITLE } from "../constants";
import type { ControlDef, ControlValue, Values } from "../specs/types";

/** 一格控件的外框: 左标签右控件, 对标 reactbits Customize 网格的单元. */
const CELL = "flex h-10 min-w-0 items-center justify-between gap-2 rounded-lg border border-border/60 bg-card/60 px-3 text-[13px]";
const LABEL = "truncate text-muted-foreground";
const COLOR = "color";
const TRIGGER = "h-7 border-0 bg-transparent px-1 text-[13px] text-foreground hover:bg-muted";

/** 令牌名换成可上色的 CSS: 渐变字的色标走它自己的映射, 其余直接是 var(--令牌). */
function swatch(token: string): string {
  return GRADIENT_STOP[token] ?? `var(--${token})`;
}

function Cell({ control, value, onChange }: { control: ControlDef; value: ControlValue; onChange: (value: ControlValue) => void }): JSX.Element {
  switch (control.kind) {
    case "select":
    case COLOR:
      return (
        <div className={CELL}>
          <span className={LABEL}>{control.label}</span>
          <Select value={String(value)} onValueChange={onChange}>
            <SelectTrigger size="sm" aria-label={control.label} className={TRIGGER}>
              {control.kind === COLOR ? <span aria-hidden className="size-4 rounded border border-border" style={{ background: swatch(String(value)) }} /> : null}
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {(control.kind === COLOR ? control.options.map((item) => ({ value: item, label: item })) : control.options).map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    case "switch":
      return (
        <label className={cn(CELL, "cursor-pointer")}>
          <span className={LABEL}>{control.label}</span>
          <Switch checked={Boolean(value)} onCheckedChange={onChange} aria-label={control.label} />
        </label>
      );
    case "slider":
      return (
        <div className={cn(CELL, "gap-3")}>
          <span className={cn(LABEL, "shrink-0")}>{control.label}</span>
          <Slider
            className="min-w-0 flex-1"
            min={control.min}
            max={control.max}
            step={control.step}
            value={[Number(value)]}
            onValueChange={([next]) => onChange(next)}
            aria-label={control.label}
          />
          <span className="w-12 shrink-0 text-right font-mono text-[12px] tabular-nums text-foreground">{Number(value)}</span>
        </div>
      );
    case "text":
      return (
        <label className={CELL}>
          <span className={cn(LABEL, "shrink-0")}>{control.label}</span>
          <input
            value={String(value)}
            onChange={(event) => onChange(event.target.value)}
            aria-label={control.label}
            className="h-7 min-w-0 flex-1 rounded-md border border-border/60 bg-background/60 px-2 text-right text-[12px] text-foreground outline-none focus:border-ring/60"
          />
        </label>
      );
  }
}

/** Customize 卡: 三列控件网格, 改值立刻作用到预览与 Code 页签. */
export function Customize({
  controls,
  values,
  onChange,
}: {
  readonly controls: readonly ControlDef[];
  readonly values: Values;
  readonly onChange: (key: string, value: ControlValue) => void;
}): JSX.Element {
  return (
    <section aria-labelledby="customize" className={CARD}>
      <h2 id="customize" className={cn(SECTION_TITLE, "px-[18px] pt-[18px] pb-3")}>
        Customize 调参
      </h2>
      <div className={cn(INSET, "grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3")}>
        {controls.map((control) => (
          <Cell key={control.key} control={control} value={values[control.key] ?? control.initial} onChange={(next) => onChange(control.key, next)} />
        ))}
      </div>
    </section>
  );
}
