import { useState, type JSX } from "react";
import { BUTTON_TYPE, CodeBlock, Kbd, KbdGroup, cn } from "@hx/ui";
import { CARD, ICON, ICON_XS, INSET, SECTION_DESC, SECTION_TITLE, TOOL_GROUP } from "../constants";
import type { Example, KeyRow } from "../specs/types";

/** 示例卡: 上面预览, 下面一条工具栏, 点 "代码" 展开这段示例的源码. */
function ExampleCard({ example }: { readonly example: Example }): JSX.Element {
  const [open, setOpen] = useState(false);
  const stretch = example.align === "stretch";
  const codeId = `example-${example.id}-code`;
  return (
    <article aria-labelledby={`example-${example.id}`} className="flex flex-col gap-2">
      <h3 id={`example-${example.id}`} className="scroll-mt-24 text-[14px] font-medium text-foreground">
        {example.title}
      </h3>
      {example.desc ? <p className="-mt-1 text-[13px] leading-relaxed text-muted-foreground">{example.desc}</p> : null}
      <div className={CARD}>
        <div data-demo className={cn(INSET, "min-h-[160px] overflow-hidden", stretch ? "block" : "flex flex-wrap items-center justify-center gap-3 p-6")}>{example.render()}</div>
        <div className="flex justify-end px-1.5 pb-1.5">
          <button
            type={BUTTON_TYPE}
            aria-expanded={open}
            aria-controls={codeId}
            onClick={() => setOpen((prev) => !prev)}
            className={cn(TOOL_GROUP, "h-8 gap-1.5 px-2.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground")}
          >
            <span aria-hidden className={cn(ICON.code, ICON_XS)} />
            {open ? "收起代码" : "代码"}
          </button>
        </div>
        {open ? (
          <div id={codeId} className="px-1.5 pb-1.5">
            <CodeBlock code={example.code} lang="tsx" />
          </div>
        ) : null}
      </div>
    </article>
  );
}

/** 示例段: 主演示之外的用法, 每种一张卡. reactbits 一页只有一个演示, 我们的组件变体多, 单列这一段. */
export function Examples({ items }: { readonly items: readonly Example[] }): JSX.Element | null {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="examples" className="flex flex-col gap-5">
      <div>
        <h2 id="examples" className={SECTION_TITLE}>
          Examples 示例
        </h2>
        <p className={SECTION_DESC}>主演示之外的常见用法, 每张卡都能展开代码.</p>
      </div>
      {items.map((example) => (
        <ExampleCard key={example.id} example={example} />
      ))}
    </section>
  );
}

/** 键盘与无障碍段: 按键与它做的事, 按键用库 Kbd. */
export function Keyboard({ rows }: { readonly rows: readonly KeyRow[] }): JSX.Element | null {
  if (rows.length === 0) return null;
  return (
    <section aria-labelledby="keyboard" className={CARD}>
      <div className="px-[18px] pt-[18px] pb-3">
        <h2 id="keyboard" className={SECTION_TITLE}>
          Keyboard 键盘与无障碍
        </h2>
      </div>
      <table className={cn(INSET, "w-[calc(100%-12px)] border-separate border-spacing-0 overflow-hidden text-[13px]")}>
        <caption className="sr-only">键盘操作</caption>
        <thead>
          <tr className="text-left text-[11.5px] tracking-wide text-muted-foreground">
            <th scope="col" className="w-[38%] border-b border-border/60 px-4 py-3 font-medium">
              按键
            </th>
            <th scope="col" className="border-b border-border/60 px-4 py-3 font-medium">
              行为
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.keys.join("+") + row.action}>
              <td className="border-b border-border/40 px-4 py-3 align-middle [tr:last-child_&]:border-0">
                <KbdGroup>
                  {row.keys.map((key) => (
                    <Kbd key={key}>{key}</Kbd>
                  ))}
                </KbdGroup>
              </td>
              <td className="border-b border-border/40 px-4 py-3 leading-relaxed text-foreground/85 [tr:last-child_&]:border-0">{row.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
