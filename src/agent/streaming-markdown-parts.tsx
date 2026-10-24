"use client";

import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import { CodeBlock } from "../layout/CodeBlock";
import { LIVE_HIGHLIGHT_MS, MD_NEWLINE, SEGMENT_KIND } from "../constants/markdown";

/** 围栏标记. 三个反引号单独一行即是开/闭. */
const FENCE = "```";

/**
 * 围栏 info string 里只有第一个 token 是语言名: `ts title="a.ts"` 与 `ts{1,3}` 都按 ts 高亮,
 * 整体当语言名会让 CodeBlock 找不到语法, 退回纯文本.
 */
function fenceLang(info: string): string {
  return info.trim().split(/[\s{]/)[0] ?? "";
}

/** 一段内容: 普通 Markdown, 或者一个围栏代码块. */
export interface Segment {
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
 * 那个 web component 在可选 peer 缺失或初始化失败时只画标题栏, 正文空白且不报错;
 * 而它的公开 props 里没有"把代码块换成自定义组件"的入口 (renderNode 只在内部类型上).
 * 把围栏切出来自己渲染, 代码块就能稳定用本库的 CodeBlock (shiki + One Dark Pro).
 *
 * 未闭合的围栏按"仍在写入的代码块"处理: 流式中途也能看到正确的代码底色.
 */
export function splitSegments(markdown: string): Segment[] {
  const lines = markdown.split(MD_NEWLINE);
  const out: Segment[] = [];
  let buffer: string[] = [];
  let code: string[] | null = null;
  let lang = "";

  const flushMarkdown = (): void => {
    const text = buffer.join(MD_NEWLINE);
    if (text.trim()) {
      out.push({ kind: SEGMENT_KIND.markdown, text });
    }
    buffer = [];
  };

  for (const line of lines) {
    if (code === null) {
      if (line.trimStart().startsWith(FENCE)) {
        flushMarkdown();
        lang = fenceLang(line.trim().slice(FENCE.length));
        code = [];
      } else {
        buffer.push(line);
      }
      continue;
    }
    if (line.trim() === FENCE) {
      out.push({ kind: SEGMENT_KIND.code, text: code.join(MD_NEWLINE), lang });
      code = null;
      lang = "";
      continue;
    }
    code.push(line);
  }

  if (code !== null) {
    out.push({ kind: SEGMENT_KIND.code, text: code.join(MD_NEWLINE), lang, open: true });
  }
  flushMarkdown();
  return out;
}

/**
 * 内容为空或以围栏结束时, markstream 的光标不会出现 (它只跟随文本节点), 需要自己补一个:
 * streaming 的契约是"还在生成时末尾有光标", 也就是半截代码块后面也得看得见.
 */
export function needsTailCursor(content: string): boolean {
  const trimmed = content.trimEnd();
  if (!trimmed) {
    return true;
  }
  const lastLine = trimmed.slice(trimmed.lastIndexOf(MD_NEWLINE) + MD_NEWLINE.length).trim();
  return lastLine.startsWith(FENCE);
}

/**
 * 流式代码块的高亮节流.
 *
 * 围栏未闭合期间每来一个 token 都重跑一次完整 shiki, 长回复会把主线程拖住;
 * 这里按固定间隔放行 (最新内容仍然立刻排队, 只是不等每个 token).
 * 闭合后直接返回原文, 保证最终结果一定是最新代码.
 */
function useThrottledCode(code: string, open: boolean): string {
  const [shown, setShown] = useState(code);
  const lastAt = useRef(0);
  useEffect(() => {
    if (!open) {
      lastAt.current = Date.now();
      setShown(code);
      return undefined;
    }
    const now = Date.now();
    const wait = LIVE_HIGHLIGHT_MS - (now - lastAt.current);
    if (wait <= 0) {
      lastAt.current = now;
      setShown(code);
      return undefined;
    }
    const timer = setTimeout(() => {
      lastAt.current = Date.now();
      setShown(code);
    }, wait);
    return () => clearTimeout(timer);
  }, [code, open]);
  return open ? shown : code;
}

/** 一个围栏代码块: 流式中途按节流后的代码渲染, 闭合后一次性收尾. 决策见 streaming-markdown.tsx 的锚点. */
export function FenceBlock({ code, lang, open }: { readonly code: string; readonly lang?: string; readonly open: boolean }): JSX.Element {
  const shown = useThrottledCode(code, open);
  return <CodeBlock className="my-3" code={shown} {...(lang ? { lang } : {})} showLineNumbers />;
}
