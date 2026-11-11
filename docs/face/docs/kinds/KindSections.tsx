import type { JSX } from "react";
import { CodeBlock } from "@hx/ui";
import type { CatalogEntry } from "../catalog";
import { CARD, PKG, SECTION_DESC, SECTION_TITLE } from "../constants";
import { PropsCard } from "../page/PropsCard";
import { generatedRows } from "../props";

/** 组件层还没写页的件: 用目录给出的模块名与导出名拼出 import 与最小用法, 不编演示. */
export function ImportCode({ entry }: { readonly entry: CatalogEntry }): JSX.Element {
  const head = entry.exports[0] ?? entry.label;
  const code = `import { ${entry.exports.join(", ")} } from "${entry.from ?? PKG}";\n\n<${head} />`;
  return (
    <div className="flex flex-col gap-2">
      <h2 id="usage" className={SECTION_TITLE}>
        Usage 用法
      </h2>
      <p className={SECTION_DESC}>这件组件的演示与调参随组件批次补齐; 下面是能直接用的 import.</p>
      <CodeBlock code={code} lang="tsx" />
    </div>
  );
}

/** Props: 每个导出一张表 (第一个是主件, 其余作部件), 数据来自 props.gen.json; 读不到属性的导出不出表. */
export function ExportProps({ names }: { readonly names: readonly string[] }): JSX.Element | null {
  const tables = names.flatMap((name) => {
    const rows = generatedRows(name);
    return rows ? [{ name, rows }] : [];
  });
  if (tables.length === 0) return null;
  return (
    <>
      {tables.map((table, index) => (
        <PropsCard key={table.name} part={index === 0 ? undefined : table.name} rows={table.rows} />
      ))}
    </>
  );
}

/** 页型规定必有但内容要组件批次才写的段 (composite 的键盘段, control 的减少动效对照): 如实写明待补. */
export function PendingSection({ id, title, what }: { readonly id: string; readonly title: string; readonly what: string }): JSX.Element {
  return (
    <section aria-labelledby={id} className={CARD}>
      <div className="px-[18px] py-[18px]">
        <h2 id={id} className={SECTION_TITLE}>
          {title}
        </h2>
        <p className={SECTION_DESC}>{what}随这件组件的组件页一起补齐.</p>
      </div>
    </section>
  );
}
