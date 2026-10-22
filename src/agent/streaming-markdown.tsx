"use client";

import { useEffect, useMemo, useState, type JSX } from "react";
import MarkdownRender from "markstream-react";
import { CodeBlock } from "../layout/CodeBlock";
import { cn } from "../primitives/utils";

/**
 * 根元素上的主题属性与取值 (tokens.css 用 data-mode 区分明暗).
 * 读不到时按暗色处理: 库的默认皮肤是暗色, 文档站首屏也是暗色.
 */
const MODE_ATTRIBUTE = "data-mode";
const MODE_LIGHT = "light";

/** 围栏标记. 三个反引号单独一行即是开/闭. */
const FENCE = "```";

/**
 * 把 markstream 自带的配色与线条拉回本库的语义 token.
 *
 * 它的样式表在 node_modules 里, 用 :where() 包选择器 (特异度 0), 所以这里用
 * "父级任意变体" 声明就能盖过, 不需要 !important. 变量声明同理: --link-color 这类
 * 只在消费处带默认值, 从父级继承即可生效.
 */
const SKIN = [
  "[--link-color:var(--link)]",
  "[--table-border:var(--border)]",
  "[--footnote-border:var(--border)]",
  "[--blockquote-border-color:var(--border)]",
  "[&_.inline-code]:bg-muted",
  "[&_.inline-code]:text-foreground",
  "[&_.blockquote-node]:border-l-[1px]",
  "[&_.blockquote-node]:border-border",
  "[&_.typewriter-cursor]:border-r-[1px]",
  "[&_table]:text-[12.5px]",
  "[&_th]:font-medium",
  "[&_th]:text-muted-foreground]",
  // 表格线: markstream 只给单元格内边距不画线, 这里用 !important 的 utilities 压过它
  // 未分层的预编译规则 (分层里的 !important 胜过来分层的普通声明).
  "[&_table.table-node]:!border",
  "[&_table.table-node]:!border-border",
  "[&_th]:!border-b",
  "[&_th]:!border-border",
  "[&_th]:!bg-muted",
  "[&_td]:!border-b",
  "[&_td]:!border-border",
].join(" ");

function readDark(): boolean {
  if (typeof document === "undefined") {
    return true;
  }
  return document.documentElement.getAttribute(MODE_ATTRIBUTE) !== MODE_LIGHT;
}

/**
 * 跟随根元素的明暗切换, 让 markstream 的代码块与内嵌层用同一套明暗.
 * 显式传 isDark 时以调用方为准, 不再观察 DOM.
 */
function useIsDark(override?: boolean): boolean {
  const [dark, setDark] = useState(readDark);
  useEffect(() => {
    if (override !== undefined || typeof MutationObserver === "undefined") {
      return undefined;
    }
    const observer = new MutationObserver(() => setDark(readDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: [MODE_ATTRIBUTE] });
    return () => observer.disconnect();
  }, [override]);
  return override ?? dark;
}

/** 一段内容: 普通 Markdown, 或者一个围栏代码块. */
interface Segment {
  readonly kind: "markdown" | "code";
  readonly text: string;
  readonly lang?: string;
  /** 流式期间最后一段代码块可能还没闭合. */
  readonly open?: boolean;
}

/**
 * 按围栏把 Markdown 切成段落.
 *
 * 为什么要自己切: markstream 的代码块默认交给 stream-diffs 的 <diffs-container>,
 * 那个 web component 在可选 peer 缺失或初始化失败时只画标题栏、正文空白且不报错;
 * 而它的公开 props 里没有"把代码块换成自定义组件"的入口 (renderNode 只在内部类型上).
 * 把围栏切出来自己渲染, 代码块就能稳定用本库的 CodeBlock (shiki + One Dark Pro).
 *
 * 未闭合的围栏按"仍在写入的代码块"处理: 流式中途也能看到正确的代码底色.
 */
function splitSegments(markdown: string): Segment[] {
  const lines = markdown.split("\n");
  const out: Segment[] = [];
  let buffer: string[] = [];
  let code: string[] | null = null;
  let lang = "";

  const flushMarkdown = (): void => {
    const text = buffer.join("\n");
    if (text.trim()) {
      out.push({ kind: "markdown", text });
    }
    buffer = [];
  };

  for (const line of lines) {
    if (code === null) {
      if (line.trimStart().startsWith(FENCE)) {
        flushMarkdown();
        lang = line.trim().slice(FENCE.length).trim();
        code = [];
      } else {
        buffer.push(line);
      }
      continue;
    }
    if (line.trim() === FENCE) {
      out.push({ kind: "code", text: code.join("\n"), lang });
      code = null;
      lang = "";
      continue;
    }
    code.push(line);
  }

  if (code !== null) {
    out.push({ kind: "code", text: code.join("\n"), lang, open: true });
  }
  flushMarkdown();
  return out;
}

/**
 * .agents/notes/implemented/feature/2026-10-22-streaming-markdown-markstream.md
 */
export interface StreamingMarkdownProps {
  /** 已到达的 Markdown 原文. 不完整的语法在流式期间按半成品渲染, 结束后再收尾. */
  readonly content: string;
  /** 仍在生成. 为 true 时保留流式光标, 且解析器不会把未闭合的块当成最终结果. */
  readonly streaming?: boolean;
  /** 流已结束. 与 streaming 同时给时以 final 为准, 便于直接接 SSE 的结束事件. */
  readonly final?: boolean;
  readonly className?: string;
  /** 每条消息一个解析器 id, 让同一页里多个实例的代码块 DOM id 不撞车. */
  readonly customId?: string;
  /** 明暗主题. 缺省跟随根元素的 data-mode, 也可以由调用方显式指定. */
  readonly isDark?: boolean;
}

/**
 * 流式 Markdown 渲染.
 *
 * 样式不由本组件注入, 使用方 (或文档站) 必须引入一次 markstream-react/index.css,
 * 库的样式入口 src/styles.css 已经带上它, 引了 @hx/ui/styles.css 就不用再引.
 *
 * 代码块由本库的 CodeBlock 渲染 (见 splitSegments 的说明), 其余节点交给 markstream:
 * 未闭合的标题, 列表, 表格与引用在流式中途都能按半成品渲染.
 * fade 关闭: 逐节点淡入会和调用方自己的逐字追加叠成两层节奏, 看起来像抖动;
 * 光标由 markstream 的 typewriter 提供, 它在系统要求减弱动效时自动停闪.
 */
export function StreamingMarkdown({
  content,
  streaming = true,
  final,
  className,
  customId,
  isDark,
}: StreamingMarkdownProps): JSX.Element {
  const done = final ?? !streaming;
  const dark = useIsDark(isDark);
  const segments = useMemo(() => splitSegments(content), [content]);

  return (
    <div
      data-slot="streaming-markdown"
      data-streaming={done ? "false" : "true"}
      className={cn("min-w-0 text-[13.5px] leading-relaxed text-foreground", SKIN, className)}
    >
      {segments.map((segment, index) => {
        const key = `${index}-${segment.kind}`;
        if (segment.kind === "code") {
          return (
            <CodeBlock
              key={key}
              className="my-3"
              code={segment.text}
              {...(segment.lang ? { lang: segment.lang } : {})}
              showLineNumbers
            />
          );
        }
        return (
          <MarkdownRender
            key={key}
            content={segment.text}
            final={done}
            fade={false}
            typewriter={!done && index === segments.length - 1}
            smoothStreaming={false}
            isDark={dark}
            {...(customId ? { customId } : {})}
          />
        );
      })}
    </div>
  );
}
