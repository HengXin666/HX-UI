import type { JSX } from "react";
import { ApiTable, cn } from "@hx/ui";
import { CARD, INSET, MONO, SECTION_TITLE } from "../constants";
import type { PropRow } from "../specs/types";

/** 表头与单元格的排版, 经库 ApiTable 的 classNames 落到它自己的 Table 上. */
const TABLE = cn(
  "min-w-[620px] border-collapse text-[13px]",
  "[&_thead_tr]:border-b [&_thead_tr]:border-border/60 [&_th]:h-auto [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:text-[11.5px] [&_th]:font-medium [&_th]:tracking-wide [&_th]:text-muted-foreground",
  "[&_td]:px-4 [&_td]:py-4 [&_td]:align-middle",
);
const CODE_RESET = "[&_code]:rounded-none [&_code]:bg-transparent [&_code]:p-0";

/** Props 卡: 库 ApiTable 的四列 (属性, 类型, 默认, 说明), 卡头给出属性个数. */
export function PropsCard({ rows }: { readonly rows: readonly PropRow[] }): JSX.Element {
  return (
    <section aria-labelledby="props" className={CARD}>
      <div className="flex items-baseline justify-between px-[18px] pt-[18px] pb-3">
        <h2 id="props" className={SECTION_TITLE}>
          Props 属性
        </h2>
        <span className="text-[12px] text-muted-foreground">{rows.length} 个属性</span>
      </div>
      <ApiTable
        caption="Props 属性"
        collapseAt={0}
        labels={{ apiDefault: "默认" }}
        rows={rows.map((row) => ({ name: row.name, type: row.type, default: row.initial, description: row.desc }))}
        classNames={{
          root: cn(INSET, "rounded-xl border-border/60"),
          table: TABLE,
          row: "border-b border-border/40 last:border-0 hover:bg-transparent",
          name: cn(MONO, "font-normal whitespace-nowrap text-primary"),
          type: cn(MONO, CODE_RESET, "max-w-[160px] text-muted-foreground [&_code]:whitespace-normal [&_code]:break-words [&_code]:text-muted-foreground [&>span]:max-w-[160px]"),
          default: cn(
            "text-foreground",
            "[&_code]:inline-block [&_code]:max-w-[140px] [&_code]:truncate [&_code]:rounded-md [&_code]:border [&_code]:border-border/60 [&_code]:bg-muted/40 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:align-middle [&_code]:text-foreground",
            MONO,
          ),
          description: "min-w-0 leading-relaxed text-foreground/85",
        }}
      />
    </section>
  );
}
