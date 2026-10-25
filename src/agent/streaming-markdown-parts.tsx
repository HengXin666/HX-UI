"use client";

import { createContext, useContext, useEffect, useRef, useState, type JSX } from "react";
import { withMarkstreamComponentDisplay } from "markstream-react";
import { CodeBlock } from "../layout/CodeBlock";
import { LIVE_HIGHLIGHT_MS, MD_NEWLINE, NESTED_FENCE_INDEX_ATTR, NESTED_FENCE_TAG, SEGMENT_KIND } from "../constants/markdown";

/** 围栏标记. 三个反引号单独一行即是开/闭. */
const FENCE = "```";

/**
 * 围栏 info string 里只有第一个 token 是语言名: `ts title="a.ts"` 与 `ts{1,3}` 都按 ts 高亮,
 * 整体当语言名会让 CodeBlock 找不到语法, 退回纯文本.
 */
function fenceLang(info: string): string {
  return info.trim().split(/[\s{]/)[0] ?? "";
}

/** 一个围栏代码块的内容. */
export interface Fence {
  readonly text: string;
  readonly lang?: string;
  /** 流式期间最后一个代码块可能还没闭合. */
  readonly open?: boolean;
}

/** 一段内容: 普通 Markdown (可带列表内围栏表), 或者一个顶层围栏代码块. */
export interface Segment extends Fence {
  readonly kind: "markdown" | "code";
  /** 列表项里的围栏: 原文已换成 NESTED_FENCE_TAG 占位, 按下标取回. */
  readonly fences?: readonly Fence[];
}

/** 列表标记: "- " "* " "+ " 或 "1. " "1) ". */
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s/;

/**
 * 按围栏把 Markdown 切成段落.
 *
 * 为什么要自己切: markstream 的代码块默认交给 stream-diffs 的 <diffs-container>,
 * 那个 web component 在可选 peer 缺失或初始化失败时只画标题栏, 正文空白且不报错;
 * 而它的公开 props 里没有"把代码块换成自定义组件"的入口 (renderNode 只在内部类型上).
 * 把围栏切出来自己渲染, 代码块就能稳定用本库的 CodeBlock (shiki + One Dark Pro).
 *
 * 未闭合的围栏按"仍在写入的代码块"处理: 流式中途也能看到正确的代码底色.
 *
 * 列表项里的围栏 (缩进的开围栏, 且当前仍在列表上下文里) 不切段: 切出去会让代码块脱离 <li>,
 * 后续列表项还会重新从 1 编号. 这类围栏在原位换成 NESTED_FENCE_TAG 占位并保留缩进,
 * 列表结构仍由 markstream 解析, 占位再由 NestedFence 渲染成 CodeBlock (决策见 note).
 */
export function splitSegments(markdown: string): Segment[] {
  const lines = markdown.split(MD_NEWLINE);
  const out: Segment[] = [];
  let buffer: string[] = [];
  let fences: Fence[] = [];
  let code: string[] | null = null;
  let lang = "";
  let indent = "";
  let inList = false;

  const flushMarkdown = (): void => {
    const text = buffer.join(MD_NEWLINE);
    if (text.trim()) {
      out.push({ kind: SEGMENT_KIND.markdown, text, ...(fences.length ? { fences } : {}) });
    }
    buffer = [];
    fences = [];
  };
  const closeFence = (open: boolean): void => {
    const fence: Fence = { text: (code ?? []).join(MD_NEWLINE), lang, ...(open ? { open } : {}) };
    if (indent) {
      buffer.push(`${indent}<${NESTED_FENCE_TAG} ${NESTED_FENCE_INDEX_ATTR}="${fences.length}"></${NESTED_FENCE_TAG}>`);
      fences.push(fence);
    } else {
      out.push({ kind: SEGMENT_KIND.code, ...fence });
    }
    code = null;
  };

  for (const line of lines) {
    if (code === null) {
      const lead = line.slice(0, line.length - line.trimStart().length);
      if (line.trimStart().startsWith(FENCE)) {
        indent = inList && lead ? lead : "";
        if (!indent) {
          flushMarkdown();
        }
        lang = fenceLang(line.trim().slice(FENCE.length));
        code = [];
        continue;
      }
      if (LIST_ITEM.test(line)) {
        inList = true;
      } else if (line.trim() && !lead) {
        inList = false;
      }
      buffer.push(line);
      continue;
    }
    if (line.trim() === FENCE) {
      closeFence(false);
      continue;
    }
    code.push(line.startsWith(indent) ? line.slice(indent.length) : line.trimStart());
  }

  if (code !== null) {
    closeFence(true);
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

/** 当前 Markdown 段的列表内围栏表, 由 StreamingMarkdown 按段提供. */
export const FenceTable = createContext<readonly Fence[]>([]);

/**
 * 列表内围栏的占位标签: markstream 把它当 list_item 的块级子节点渲染, 这里按 data-i 取回代码交给 CodeBlock.
 * 只注册这个自定义标签, 不替换 markstream 的 code_block 节点.
 */
function NestedFenceBase({ node }: { readonly node: { readonly attrs?: readonly (readonly [string, string])[] } }): JSX.Element | null {
  const table = useContext(FenceTable);
  const index = Number(node.attrs?.find(([name]) => name === NESTED_FENCE_INDEX_ATTR)?.[1]);
  const fence = table[index];
  return fence ? <FenceBlock code={fence.text} open={fence.open === true} {...(fence.lang ? { lang: fence.lang } : {})} /> : null;
}

export const NestedFence = withMarkstreamComponentDisplay(NestedFenceBase, "block");
