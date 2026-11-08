import type { JSX } from "react";
import { BUTTON_TYPE } from "@hx/ui";
import { OUT, WIN } from "../kit/layout";
import { PRESETS, presetMeta } from "./hero-model";

/** 预设: 五行点选. 点一行同时改代码窗里的数字和舞台背景. 底部进 Playground. */
export function Presets({ active, onPick, onBench, className }: { readonly active: string | null; readonly onPick: (id: string) => void; readonly onBench: () => void; readonly className?: string }): JSX.Element {
  return (
    <div className={`${WIN.frame} ${className ?? ""}`}>
      <div className={WIN.bar}>预设</div>
      <div role="radiogroup" aria-label="背景预设" className={`${WIN.body} flex-none p-0.5`}>
        {PRESETS.map((preset) => {
          const on = preset.id === active;
          return (
            <button
              key={preset.id}
              type={BUTTON_TYPE}
              role="radio"
              aria-checked={on}
              onClick={() => onPick(preset.id)}
              className={`flex h-[46px] w-full items-center gap-3 rounded-[9px] border px-3 text-left transition-[background-color,border-color] focus-visible:outline-1 focus-visible:outline-ring ${on ? "border-border bg-accent" : "border-transparent hover:bg-accent/60"}`}
            >
              <span aria-hidden className="flex shrink-0">
                {preset.params.colors.map((token, index) => (
                  <span key={`${token}-${index}`} className="-mr-1 size-3.5 rounded-full border border-card" style={{ background: `var(--${token})` }} />
                ))}
              </span>
              <span className={`ml-2 text-[14px] ${on ? "text-heading" : "text-foreground"}`}>{preset.label}</span>
              <span className="ml-auto hidden font-mono text-[11px] text-muted-foreground sm:inline">{presetMeta(preset.params)}</span>
            </button>
          );
        })}
      </div>
      <button
        type={BUTTON_TYPE}
        onClick={onBench}
        className="flex h-10 items-center gap-2 px-4 text-left text-[13px] text-muted-foreground transition-[color] hover:text-foreground focus-visible:outline-1 focus-visible:outline-ring"
      >
        在 Playground 打开 <span aria-hidden>{OUT}</span>
      </button>
    </div>
  );
}
