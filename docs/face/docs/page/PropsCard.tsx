import type { JSX } from "react";
import { cn } from "@hx/ui";
import { CARD, INSET, MONO, SECTION_TITLE } from "../constants";
import type { PropRow } from "../specs/types";

const TH = "px-4 py-3 text-left text-[11.5px] font-medium tracking-wide text-muted-foreground";
const TD = "px-4 py-4 align-middle";

/** Props 卡: 属性, 类型, 默认, 说明四列, 右上角给出属性个数. */
export function PropsCard({ rows }: { readonly rows: readonly PropRow[] }): JSX.Element {
  return (
    <section aria-labelledby="props" className={CARD}>
      <div className="flex items-baseline justify-between px-[18px] pt-[18px] pb-3">
        <h2 id="props" className={SECTION_TITLE}>
          Props 属性
        </h2>
        <span className="text-[12px] text-muted-foreground">{rows.length} 个属性</span>
      </div>
      <div className={cn(INSET, "overflow-x-auto")}>
        <table className="w-full min-w-[620px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border/60">
              <th className={TH}>属性</th>
              <th className={TH}>类型</th>
              <th className={TH}>默认</th>
              <th className={TH}>说明</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-b border-border/40 last:border-0">
                <td className={cn(TD, MONO, "whitespace-nowrap text-primary")}>{row.name}</td>
                <td className={cn(TD, MONO, "max-w-[160px] text-muted-foreground")}>{row.type}</td>
                <td className={TD}>
                  <code className={cn(MONO, "inline-block max-w-[140px] truncate rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 align-middle text-foreground")}>
                    {row.initial}
                  </code>
                </td>
                <td className={cn(TD, "leading-relaxed text-foreground/85")}>{row.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
