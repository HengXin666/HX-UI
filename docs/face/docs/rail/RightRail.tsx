import type { JSX } from "react";
import { BUTTON_TYPE, cn } from "@hx/ui";
import { REPO_URL } from "../../../src/components/site";
import { TableOfContents } from "../../../src/components/TableOfContents";
import { VERSION } from "../../home/site-facts";
import { CARD, ICON, ICON_XS, PKG, SOURCE_BRANCH } from "../constants";
import { copyText } from "../page/copy";

const INSTALL = `npm i ${PKG}`;
const LINE = "flex h-10 items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/60 pr-1 pl-3";

function CopyLine({ code, what }: { code: string; what: string }): JSX.Element {
  return (
    <div className={LINE}>
      <code className="truncate font-mono text-[12px] text-foreground">{code}</code>
      <button
        type={BUTTON_TYPE}
        aria-label={`复制${what}`}
        onClick={() => copyText(code, what)}
        className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <span aria-hidden className={cn(ICON.copy, ICON_XS)} />
      </button>
    </div>
  );
}

/**
 * 右栏: 原站这里是 Pro 广告与赞助, HX UI 没有对应的真实内容, 换成安装卡与本页目录.
 * importName 与 source 只在可调组件页给出.
 */
export function RightRail({
  importName,
  source,
  container,
  deps,
}: {
  readonly importName?: string;
  readonly source?: string;
  readonly container: HTMLElement | null;
  readonly deps: unknown;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <section aria-label="安装" className={cn(CARD, "p-4")}>
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-foreground">安装</h2>
          <span className="rounded-full border border-border px-2 font-mono text-[11px] leading-5 text-muted-foreground">v{VERSION}</span>
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">一个包装好全部组件, 样式入口引入一次即可.</p>
        <div className="mt-3 flex flex-col gap-2">
          <CopyLine code={INSTALL} what="安装命令" />
          {importName ? <CopyLine code={`import { ${importName} } from "${PKG}";`} what="导入语句" /> : null}
        </div>
        {source ? (
          <a
            href={`${REPO_URL}/blob/${SOURCE_BRANCH}/${source}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            查看源码
            <span aria-hidden className={cn(ICON.out, ICON_XS)} />
          </a>
        ) : null}
      </section>
      <div className={cn(CARD, "p-4 empty:hidden")}>
        <TableOfContents container={container} deps={deps} className="static block max-h-none" />
      </div>
    </div>
  );
}
