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

/** 类型串超过这个长度折叠, 展开看全文 (区块的 classNames 之类). */
const TYPE_COLLAPSE = 64;

/**
 * Props 卡: 库 ApiTable 的四列 (属性, 类型, 默认, 说明), 卡头给出属性个数.
 * part 给出时是复合组件的某个部件, 标题写部件名, 用 h3 挂在主表下面.
 */
export function PropsCard({ rows, part, note }: { readonly rows: readonly PropRow[]; readonly part?: string; readonly note?: string }): JSX.Element {
  const id = part ? `props-${part}` : "props";
  const Heading = part ? "h3" : "h2";
  return (
    <section aria-labelledby={id} className={CARD}>
      <div className="flex items-baseline justify-between px-[18px] pt-[18px] pb-3">
        <Heading id={id} className={SECTION_TITLE}>
          {part ? <code className="font-mono text-[14px]">{part}</code> : "Props 属性"}
        </Heading>
        <span className="text-[12px] text-muted-foreground">{rows.length} 个属性</span>
      </div>
      <ApiTable
        caption={part ? `${part} 属性` : "Props 属性"}
        collapseAt={TYPE_COLLAPSE}
        labels={{ apiDefault: "默认" }}
        rows={rows.map((row) => ({ name: row.name, type: row.type, default: row.initial, description: row.desc || "-", required: row.required }))}
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
          description: "min-w-[220px] whitespace-normal leading-relaxed text-foreground/85",
        }}
      />
      {note ? <p className="px-[18px] pt-1 pb-4 text-[12.5px] leading-relaxed text-muted-foreground">{note}</p> : null}
    </section>
  );
}
