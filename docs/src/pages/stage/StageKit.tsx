import { Fragment, useState, type JSX, type ReactNode } from "react";
import { Button, Card, SegmentedControl, Slider, Switch, type SegmentedControlItem } from "@hx/ui";
import { CodeBlock, H2 } from "../../components/DocKit";

const MONO = "font-mono text-[12px]";
const PANEL = { variant: "default", className: "max-w-full overflow-hidden" } as const;

/**
 * 组件页的三截: 舞台 (当前态, 本身不做入场), 道具台 (改值立刻作用在舞台上, 不重挂载), 源码 (与道具台一致的调用代码, 自带复制).
 * 唯一的重挂载是 "重播入场": 换一个 key 让舞台上的组件从头再进一次场.
 *
 * .agents/notes/implemented/feature/2026-11-08-docs-viz-page-stage.md
 */
export function StageLayout({ stage, props, code }: { stage: ReactNode; props: ReactNode; code: string }): JSX.Element {
  const [take, setTake] = useState(0);
  return (
    <>
      <H2>舞台</H2>
      <Card variant={PANEL.variant} className={PANEL.className}>
        <div className="min-w-0 p-5 md:p-6">
          <Fragment key={take}>{stage}</Fragment>
        </div>
      </Card>
      <H2>道具台</H2>
      <Card variant={PANEL.variant} className={PANEL.className}>
        <div className="flex flex-col divide-y divide-border px-4">
          {props}
          <div className="flex items-center justify-between gap-4 py-3">
            <span className="text-[12px] text-muted-foreground">道具改值不重挂载; 只有这个按钮会让组件从头入场.</span>
            <Button type="button" variant="outline" size="sm" onClick={() => setTake((count) => count + 1)}>
              重播入场
            </Button>
          </div>
        </div>
      </Card>
      <H2>源码</H2>
      <Card variant={PANEL.variant} className={PANEL.className}>
        <CodeBlock code={code} />
      </Card>
    </>
  );
}

/** 道具台的一行: 属性名, 控件, 当前值. */
export function PropRow({ name, readout, children }: { name: string; readout?: string; children: ReactNode }): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
      <code className={`w-32 shrink-0 text-foreground ${MONO}`}>{name}</code>
      <div className="flex min-w-0 flex-1 items-center">{children}</div>
      {readout !== undefined ? <span className={`w-16 shrink-0 text-right tabular-nums text-muted-foreground ${MONO}`}>{readout}</span> : null}
    </div>
  );
}

export function PropSlider({
  name,
  value,
  min,
  max,
  step,
  onChange,
}: {
  name: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}): JSX.Element {
  return (
    <PropRow name={name} readout={String(value)}>
      <Slider
        className="w-full max-w-80"
        value={[value]}
        min={min}
        max={max}
        step={step}
        aria-label={name}
        onValueChange={(next) => onChange(next[0] ?? value)}
      />
    </PropRow>
  );
}

export function PropSwitch({ name, checked, onChange }: { name: string; checked: boolean; onChange: (checked: boolean) => void }): JSX.Element {
  return (
    <PropRow name={name} readout={String(checked)}>
      <Switch checked={checked} aria-label={name} onCheckedChange={onChange} />
    </PropRow>
  );
}

export function PropChoice<T extends string>({
  name,
  items,
  value,
  onChange,
}: {
  name: string;
  items: SegmentedControlItem<T>[];
  value: T;
  onChange: (value: T) => void;
}): JSX.Element {
  return (
    <PropRow name={name}>
      <div className="max-w-full overflow-x-auto">
        <SegmentedControl items={items} value={value} onChange={(next) => onChange(typeof next === "function" ? next(value) : next)} />
      </div>
    </PropRow>
  );
}
