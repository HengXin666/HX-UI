import { useRef, type JSX, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { CodeLines, Win } from "../kit/Code";
import { PARAM, SPEC, snap, type HeroParams, type ParamKey } from "./hero-model";

const K = "text-muted-foreground";
const V = "text-foreground";
const KEY_STEP: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };
const BIG = 10;

/** 可拖的数字: 下划虚线, 左右拖改值, 方向键一档, Shift 十档. 改值立刻驱动背景. */
function Scrub({ name, value, onChange }: { readonly name: ParamKey; readonly value: number; readonly onChange: (key: ParamKey, value: number) => void }): JSX.Element {
  const spec = SPEC[name];
  const drag = useRef<{ x: number; from: number } | null>(null);
  const down = (event: PointerEvent<HTMLSpanElement>): void => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, from: value };
  };
  const move = (event: PointerEvent<HTMLSpanElement>): void => {
    if (!drag.current) return;
    const steps = Math.round((event.clientX - drag.current.x) / spec.px);
    onChange(name, snap(name, drag.current.from + steps * spec.step));
  };
  const up = (): void => {
    drag.current = null;
  };
  const key = (event: KeyboardEvent<HTMLSpanElement>): void => {
    const dir = KEY_STEP[event.key];
    if (!dir) return;
    event.preventDefault();
    onChange(name, snap(name, value + dir * spec.step * (event.shiftKey ? BIG : 1)));
  };
  return (
    <span
      role="slider"
      tabIndex={0}
      aria-label={name}
      aria-valuemin={spec.min}
      aria-valuemax={spec.max}
      aria-valuenow={value}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={key}
      className="cursor-ew-resize touch-none select-none rounded-sm text-foreground underline decoration-muted-foreground decoration-dotted decoration-1 underline-offset-[5px] transition-[background-color] hover:bg-accent focus-visible:outline-1 focus-visible:outline-ring"
    >
      {value}
    </span>
  );
}

/** 一个 prop: name={值}. */
function prop(name: string, value: ReactNode): ReactNode {
  return (
    <>
      <span className={V}>{name}</span>
      <span className={K}>={"{"}</span>
      {value}
      <span className={K}>{"}"}</span>
    </>
  );
}

/** 代码窗 Hero.tsx: 驱动舞台背景的那段 JSX, 数字可拖. */
export function HeroCode({ params, onChange, className }: { readonly params: HeroParams; readonly onChange: (key: ParamKey, value: number) => void; readonly className?: string }): JSX.Element {
  const s = (key: ParamKey): ReactNode => <Scrub name={key} value={params[key] as number} onChange={onChange} />;
  const colors = (
    <>
      <span className={K}>[</span>
      {params.colors.map((token, index) => (
        <span key={`${token}-${index}`}>
          <span aria-hidden className="mr-1 inline-block size-2.5 rounded-[3px] border border-border align-[-1px]" style={{ background: `var(--${token})` }} />
          <span className={V}>&quot;{token}&quot;</span>
          {index < params.colors.length - 1 ? <span className={K}>, </span> : null}
        </span>
      ))}
      <span className={K}>]</span>
    </>
  );
  const lines: ReactNode[] = [
    <><span className={K}>import</span> <span className={V}>{"{ Beam, Grain, MeshGradient }"}</span> <span className={K}>from</span> <span className={V}>&quot;@hx/ui&quot;</span><span className={K}>;</span></>,
    "",
    <><span className={K}>export default function</span> <span className={V}>Hero</span><span className={K}>() {"{"}</span></>,
    <span className={K}>{"  return ("}</span>,
    <><span className={K}>{"    <"}</span><span className={V}>MeshGradient</span></>,
    <>{"      "}{prop("colors", colors)}</>,
    <>{"      "}{prop(PARAM.intensity, s(PARAM.intensity))}</>,
    <span className={K}>{"    >"}</span>,
    <>{"      "}<span className={K}>{"<"}</span><span className={V}>Beam</span> {prop(PARAM.angle, s(PARAM.angle))} {prop(PARAM.x, s(PARAM.x))} {prop(PARAM.width, s(PARAM.width))}</>,
    <>{"        "}{prop("intensity", s(PARAM.glow))}<span className={K}>{" />"}</span></>,
    <>{"      "}<span className={K}>{"<"}</span><span className={V}>Grain</span> {prop("opacity", s(PARAM.grain))}<span className={K}>{" />"}</span></>,
    <><span className={K}>{"    </"}</span><span className={V}>MeshGradient</span><span className={K}>{">"}</span></>,
    <span className={K}>{"  );"}</span>,
    <span className={K}>{"}"}</span>,
  ];
  return (
    <Win title="Hero.tsx" className={className}>
      <CodeLines lines={lines} />
    </Win>
  );
}
