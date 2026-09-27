import { Fragment, useState, type JSX, type ReactNode } from "react";
import {
  Badge, Button, Card, CardContent, CardHeader, CardTitle,
  CodeBlock as LibCodeBlock, cn,
} from "@hx/ui";

/**
 * 文档站自己的壳。
 *
 * 这一层刻意**只用 @hx/ui 里的组件**构成 —— 文档站自己就是这套库最直接的示范。
 * 只有"预览框"这类文档专有的容器才允许写自有的类串, 因为它们是文档的排版, 不是产品界面。
 */

/** 一块可预览区域: 上面是活的实例, 下面是源码。 */
export function Preview({
  children,
  code,
  lang = "tsx",
  align = "start",
  className,
}: {
  children: ReactNode;
  code?: string;
  lang?: string;
  align?: "start" | "center" | "stretch";
  className?: string;
}): JSX.Element {
  return (
    <Card variant="default" className={cn("overflow-hidden", className)}>
      <div
        className={cn(
          "flex min-h-[120px] flex-wrap gap-3 p-5",
          align === "center" && "items-center justify-center",
          align === "start" && "items-start",
          align === "stretch" && "items-stretch",
        )}
      >
        {children}
      </div>
      {code ? <CodeBlock code={code} lang={lang} /> : null}
    </Card>
  );
}

/**
 * 代码块 —— 直接用库的 CodeBlock (shiki + One Dark Pro)。
 *
 * 文档站自己展示代码, 用的就是被展示的那个组件; 这是最直接的自证。
 * 这里只做一件事: 去掉外层卡片的圆角与边框, 因为它已经嵌在 Preview 的卡片里了。
 */
export function CodeBlock({ code, lang = "tsx" }: { code: string; lang?: string }): JSX.Element {
  return (
    <LibCodeBlock
      code={code}
      lang={lang}
      className="rounded-none border-0 border-t border-border/60"
    />
  );
}

export function H2({ children, id }: { children: ReactNode; id?: string }): JSX.Element {
  return (
    <h2 id={id} className="mt-10 mb-3 scroll-mt-24 text-[19px] font-semibold text-foreground first:mt-0">
      {children}
    </h2>
  );
}

export function H3({ children }: { children: ReactNode }): JSX.Element {
  return <h3 className="mt-6 mb-2 text-[15px] font-semibold text-foreground">{children}</h3>;
}

/**
 * 把 `**文本**` 渲染成加粗。
 *
 * 文档正文里用 markdown 的星号写法最省事, 但 `P` 拿到的是 React 节点而不是 markdown ——
 * 不处理就会把星号原样显示出来 (实测有过 12 处)。这里只认成对的 `**`, 不做其它 markdown 解析:
 * 范围越窄越不容易出意外。
 */
function emphasize(node: ReactNode): ReactNode {
  if (typeof node === "string") {
    const parts = node.split("**");
    if (parts.length === 1) return node;
    return parts.map((part, i) =>
      i % 2 === 1 ? <b key={i} className="font-semibold text-foreground">{part}</b> : part,
    );
  }
  if (Array.isArray(node)) return node.map((child, i) => <Fragment key={i}>{emphasize(child)}</Fragment>);
  return node;
}

export function P({ children }: { children: ReactNode }): JSX.Element {
  return <p className="my-3 text-[13px] leading-relaxed text-muted-foreground">{emphasize(children)}</p>;
}

/** 行内代码。 */
export function Code({ children }: { children: ReactNode }): JSX.Element {
  return <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px] text-foreground/90">{children}</code>;
}

/** 属性表。用 Card 做外框, 表头用 muted 底。 */
export function PropsTable({
  rows,
}: {
  rows: Array<{ name: string; type: string; default?: string; desc: string }>;
}): JSX.Element {
  return (
    <Card variant="solid" className="my-4 overflow-hidden">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left">
            <th className="px-3 py-2 font-medium text-muted-foreground">属性</th>
            <th className="px-3 py-2 font-medium text-muted-foreground">类型</th>
            <th className="px-3 py-2 font-medium text-muted-foreground">默认</th>
            <th className="px-3 py-2 font-medium text-muted-foreground">说明</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-border/40 last:border-0">
              <td className="px-3 py-2 font-mono text-primary">{r.name}</td>
              <td className="px-3 py-2 font-mono text-muted-foreground/90">{r.type}</td>
              <td className="px-3 py-2 font-mono text-muted-foreground/70">{r.default ?? "-"}</td>
              <td className="px-3 py-2 text-foreground/85">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/** 提示条。用 Badge 的语义色配 Card。 */
export function Callout({
  kind = "info",
  title,
  children,
}: {
  kind?: "info" | "warning";
  title: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <Card variant={kind === "warning" ? "default" : "muted"} className={cn("my-4", kind === "warning" && "border-amber-500/40")}>
      <CardHeader className="flex-row items-center gap-2 pb-0">
        <Badge variant={kind === "warning" ? "warning" : "default"}>{kind === "warning" ? "注意" : "提示"}</Badge>
        <CardTitle className="text-[13px]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-[12.5px] leading-relaxed text-muted-foreground">{emphasize(children)}</CardContent>
    </Card>
  );
}
