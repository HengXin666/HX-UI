import type { JSX, ReactNode } from "react";
import { Badge, Card, CardContent } from "@hx/ui";
import { Code, P } from "./DocKit";

/**
 * 模板页共用的两块排版: "怎么套用" 与 "整页画框".
 *
 * 模板页要回答的问题和组件页不同  读者不是来学某个 props, 而是想知道
 * "把这段代码搬进我的项目还要做哪几步". 所以每页顶部固定给三步:
 * 装依赖, 引样式, 挂路由/入口; 下面的预览按真实窗口尺寸画框, 不是缩略图.
 */
export function ApplySteps({ steps }: { readonly steps: readonly string[] }): JSX.Element {
  return (
    <Card variant="muted" className="my-4">
      <CardContent className="pt-3">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="default">怎么套用</Badge>
          <span className="text-[12px] text-muted-foreground">三步, 每步都可直接复制</span>
        </div>
        <ol className="flex flex-col gap-1.5">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
              <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-primary/15 text-[10px] font-semibold text-link">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">{step}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

/**
 * 整页画框.
 *
 * 模板必须按它真实的窗口尺寸看  压缩到正文宽度后侧栏与内容区的比例会失真,
 * 读者照着截图抄出来的布局是错的. 这里给固定高度 + 横向滚动, 让整页保持原比例.
 */
export function TemplateFrame({
  height = 560,
  children,
}: {
  readonly height?: number;
  readonly children: ReactNode;
}): JSX.Element {
  return (
    <div
      className="overflow-hidden rounded-xl border border-border/60 bg-background"
      style={{ height }}
    >
      {children}
    </div>
  );
}

/** 一行等宽的文件名清单, 告诉读者这段代码该落在哪个文件. */
export function TemplateFiles({ files }: { readonly files: readonly string[] }): JSX.Element {
  return (
    <P>
      建议落点:
      {files.map((file, index) => (
        <span key={file}>
          {index > 0 ? " / " : " "}
          <Code>{file}</Code>
        </span>
      ))}
    </P>
  );
}
