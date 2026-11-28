"use client";
/**
 * Markdown 各元素的渲染: 全部换成本库令牌, 不用 Streamdown 自带的外观.
 * 代码围栏在这里分派: 自定义渲染器 (fences) > 内置 svg > CodeBlock.
 */
import * as React from "react";
import { useIsCodeFenceIncomplete, type Components, type ExtraProps } from "streamdown";
import { cn } from "@/lib/utils";
import { CodeBlock } from "../code/code-block";
import { SvgFence } from "../fences/svg";
import { InCodeGroupContext, useMarkdownSettings, type FenceRenderer } from "./context";
import { parseFence, trimCode } from "./fence";
import { CodeGroup } from "./code-group";

type HastProps = ExtraProps & { className?: string; children?: React.ReactNode };

const BUILTIN_FENCES: Record<string, FenceRenderer> = { svg: SvgFence };

function textOf(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(textOf).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(children)) return textOf(children.props.children);
  return "";
}

function FenceCode({ node, className, children }: HastProps) {
  const settings = useMarkdownSettings();
  const inGroup = React.useContext(InCodeGroupContext);
  const incomplete = useIsCodeFenceIncomplete();
  const rawLang = className?.match(/language-([^\s]+)/)?.[1] ?? "";
  const metaString = (node?.properties?.metastring as string | undefined) ?? "";
  const meta = React.useMemo(() => parseFence(rawLang, metaString), [rawLang, metaString]);
  const code = trimCode(textOf(children));
  const Renderer = settings.fences[meta.lang] ?? settings.fences[rawLang.toLowerCase()] ?? BUILTIN_FENCES[meta.lang];
  if (Renderer && !inGroup) return <Renderer code={code} lang={meta.lang} meta={meta} incomplete={incomplete} theme={settings.codeTheme} />;
  return (
    <CodeBlock
      code={code}
      language={meta.rawLang}
      title={inGroup ? undefined : meta.title}
      lineNumbers={meta.lineNumbers}
      startLine={meta.startLine}
      highlightLines={meta.highlight}
      collapse={meta.collapse || settings.codeCollapse}
      maxHeight={settings.codeMaxHeight}
      theme={settings.codeTheme}
      incomplete={incomplete}
      bare={inGroup}
      hideLanguage={inGroup}
    />
  );
}

function Code(props: HastProps & React.ComponentProps<"code">) {
  if ("data-block" in props) return <FenceCode {...props} />;
  const { node: _node, className, ...rest } = props;
  return <code data-slot="inline-code" className={cn("rounded-[0.3em] border bg-muted/60 px-[0.35em] py-[0.1em] font-mono text-[0.86em] [overflow-wrap:anywhere]", className)} {...rest} />;
}

function Anchor({ node: _node, href = "", className, children, onClick, ...rest }: HastProps & React.ComponentProps<"a">) {
  const { onLinkClick } = useMarkdownSettings();
  const external = /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      className={cn("font-medium text-brand underline decoration-brand/35 underline-offset-[3px] transition-colors duration-150 hover:decoration-brand", className)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={(e) => {
        onClick?.(e);
        if (onLinkClick?.(href, e) === true) e.preventDefault();
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

const strip = <T extends HastProps>({ node: _n, ...rest }: T) => rest;

export const markdownComponents: Components = {
  code: Code as Components["code"],
  a: Anchor as Components["a"],
  p: (p: HastProps) => <p className="my-3 leading-7 first:mt-0 last:mb-0" {...strip(p)} />,
  h1: (p: HastProps) => <h1 className="mt-6 mb-3 text-[1.6em] leading-tight font-semibold tracking-tight first:mt-0" {...strip(p)} />,
  h2: (p: HastProps) => <h2 className="mt-6 mb-3 text-[1.35em] leading-snug font-semibold tracking-tight first:mt-0" {...strip(p)} />,
  h3: (p: HastProps) => <h3 className="mt-5 mb-2 text-[1.15em] font-semibold first:mt-0" {...strip(p)} />,
  h4: (p: HastProps) => <h4 className="mt-4 mb-2 font-semibold first:mt-0" {...strip(p)} />,
  h5: (p: HastProps) => <h5 className="mt-4 mb-2 text-[0.95em] font-semibold first:mt-0" {...strip(p)} />,
  h6: (p: HastProps) => <h6 className="mt-4 mb-2 text-[0.9em] font-semibold text-muted-foreground first:mt-0" {...strip(p)} />,
  strong: (p: HastProps) => <strong className="font-semibold" {...strip(p)} />,
  ul: ({ className, ...p }: HastProps) => <ul className={cn("my-3 list-disc space-y-1 pl-6 marker:text-muted-foreground first:mt-0 last:mb-0 [&_ul]:my-1 [&_ol]:my-1", className?.includes("contains-task-list") && "list-none pl-1", className)} {...strip(p)} />,
  ol: (p: HastProps) => <ol className="my-3 list-decimal space-y-1 pl-6 marker:text-muted-foreground marker:tabular first:mt-0 last:mb-0 [&_ul]:my-1 [&_ol]:my-1" {...strip(p)} />,
  li: ({ className, ...p }: HastProps) => <li className={cn("pl-1 leading-7 [&>p]:my-1", className?.includes("task-list-item") && "pl-0 [&>input]:mr-2 [&>input]:size-3.5 [&>input]:translate-y-[2px] [&>input]:accent-[var(--brand)]", className)} {...strip(p)} />,
  blockquote: (p: HastProps) => <blockquote className="my-3 border-l-2 border-brand/40 pl-4 text-muted-foreground first:mt-0 last:mb-0 [&>p]:my-1.5" {...strip(p)} />,
  hr: (p: HastProps) => <hr className="my-6 border-t border-border" {...strip(p)} />,
  img: ({ alt, ...p }: HastProps & React.ComponentProps<"img">) => <img alt={alt ?? ""} loading="lazy" className="my-3 max-h-[480px] max-w-full rounded-lg border bg-muted object-contain" {...strip(p)} />,
  table: (p: HastProps) => (
    <div data-slot="md-table" className="my-4 max-w-full overflow-auto rounded-lg border scrollbar-thin first:mt-0 last:mb-0">
      <table className="w-full border-collapse text-sm" {...strip(p)} />
    </div>
  ),
  thead: (p: HastProps) => <thead className="bg-muted/50" {...strip(p)} />,
  tbody: (p: HastProps) => <tbody {...strip(p)} />,
  tr: (p: HastProps) => <tr className="border-t first:border-t-0 [thead_&]:border-t-0" {...strip(p)} />,
  th: (p: HastProps) => <th className="border-b px-3 py-2 text-left font-medium whitespace-nowrap" {...strip(p)} />,
  td: (p: HastProps) => <td className="px-3 py-2 align-top tabular" {...strip(p)} />,
  sup: (p: HastProps) => <sup className="text-[0.75em]" {...strip(p)} />,
  sub: (p: HastProps) => <sub className="text-[0.75em]" {...strip(p)} />,
  section: ({ className, ...p }: HastProps) => <section className={cn(className?.includes("footnotes") && "mt-6 border-t pt-3 text-sm text-muted-foreground", className)} {...strip(p)} />,
  "hx-code-group": CodeGroup as unknown as Components["code"],
};
