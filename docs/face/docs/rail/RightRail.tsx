import { useMemo, type JSX, type MouseEvent } from "react";
import { DocsToc, InstallBlock, cn, useCollectedHeadings } from "@hx/ui";
import { REPO_URL } from "../../../src/components/site";
import { VERSION } from "../../home/site-facts";
import { CARD, ICON, ICON_XS, PKG, SOURCE_BRANCH } from "../constants";

const INSTALL = `npm i ${PKG}`;
const LINE = "flex h-10 items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/60 pr-1 pl-3";

/** 一行命令加复制: 库 InstallBlock 的 pill 单行, 复制结果经 aria-live 播报; 外观按右栏的方框行排. */
function CopyLine({ code, what }: { code: string; what: string }): JSX.Element {
  return (
    <InstallBlock
      embedded
      variant="pill"
      prompt=""
      commands={[{ command: code }]}
      labels={{ copyCommand: `复制${what}` }}
      classNames={{
        command: cn(LINE, "flex w-full max-w-none rounded-lg bg-background/60 py-0 [&>pre]:min-w-0 [&>pre]:flex-1"),
        line: "truncate font-mono text-[12px] text-foreground",
        copy: "size-8 shrink-0 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground",
      }}
    />
  );
}

/** 只收 h2: 一两个章节不值得占一栏, 与原目录同一条门槛. 预览台与示例卡 (data-demo) 里区块自带的标题不算页面章节. */
const TOC_SELECTOR = "h2[id]:not([data-demo] h2)";
const TOC_MIN = 2;
const HASH = "#";
const ANCHOR_TAIL = /#\s*$/;

/**
 * 目录点击: 文档站用 hash 路由 (#/组件), 锚点 #标题 会被当成换页. 拦下默认跳转, 只滚到标题.
 */
function scrollToHeading(event: MouseEvent<HTMLElement>): void {
  const link = (event.target as Element).closest<HTMLAnchorElement>(`a[href^="${HASH}"]`);
  if (!link) return;
  event.preventDefault();
  const id = decodeURIComponent(link.hash.slice(HASH.length));
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * 右栏: 原站这里是 Pro 广告与赞助, HX UI 没有对应的真实内容, 换成安装卡与本页目录.
 * importName 与 source 只在可调组件页给出.
 */
export function RightRail({
  importName,
  source,
  container,
}: {
  readonly importName?: string;
  readonly source?: string;
  readonly container: HTMLElement | null;
}): JSX.Element {
  const body = useMemo(() => ({ current: container }), [container]);
  // 换页时容器不变, 库的 MutationObserver 跟随正文重采.
  const collected = useCollectedHeadings(body, true, TOC_SELECTOR);
  // 旧文档页的标题尾巴带一个 "#" 锚点字符, 目录里不显示它.
  const toc = useMemo(() => collected.map((item) => ({ ...item, label: typeof item.label === "string" ? item.label.replace(ANCHOR_TAIL, "").trim() : item.label })), [collected]);
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
      {toc.length >= TOC_MIN ? (
        <div className={cn(CARD, "p-4")} onClickCapture={scrollToHeading}>
          <DocsToc
            items={toc}
            title="本页目录"
            aria-label="本页目录"
            rootMargin="-80px 0px -70% 0px"
            classNames={{
              root: "static block max-h-none",
              title: "mb-2 text-[11px] font-medium text-muted-foreground/70",
              list: "flex flex-col gap-px border-l border-border/60",
              link: "-ml-px block border-l border-transparent py-1 pl-3 text-[12px] leading-snug text-muted-foreground transition-colors hover:border-border hover:text-foreground aria-[current=location]:border-primary aria-[current=location]:font-medium aria-[current=location]:text-foreground",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
