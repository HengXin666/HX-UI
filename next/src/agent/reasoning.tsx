"use client";
/**
 * 思考过程.
 * - 生成中: "思考中" 微光 + 实时计时; 折叠态显示最新一行, 展开看全文 (流式 Markdown)
 * - 结束: 自动收起成 "已思考 12 秒", 折叠态显示首行
 * - 用户手动开合过, 就不再自动开合
 */
import * as React from "react";
import { Brain } from "lucide-react";
import { Markdown, type MarkdownProps } from "./markdown/markdown";
import { Disclosure } from "./parts/disclosure";
import { useElapsed } from "./parts/elapsed";
import { formatDuration } from "./parts/format";

export interface ReasoningProps {
  text: string;
  streaming?: boolean;
  startedAt?: number;
  endedAt?: number;
  /** 生成中是否自动展开 (默认 false: 折叠态显示最新一行) */
  openWhileStreaming?: boolean;
  defaultOpen?: boolean;
  /** 标题; 默认 "思考中" / "已思考 N 秒" / 没有时长时 "思考过程" */
  title?: React.ReactNode;
  markdown?: Omit<MarkdownProps, "children" | "streaming">;
  className?: string;
}

function lineOf(text: string, last: boolean): string {
  const lines = text.split("\n").map((l) => l.replace(/^[#>*\-\s]+/, "").replace(/[*_`]/g, "").trim()).filter(Boolean);
  return (last ? lines[lines.length - 1] : lines[0]) ?? "";
}

export const Reasoning = React.memo(function Reasoning({ text, streaming = false, startedAt, endedAt, openWhileStreaming = false, defaultOpen = false, title, markdown, className }: ReasoningProps) {
  const [touched, setTouched] = React.useState<boolean | null>(null);
  const open = touched ?? (streaming ? openWhileStreaming : defaultOpen);
  const ms = useElapsed(startedAt, endedAt, streaming);
  const label = title ?? (streaming ? "思考中" : startedAt != null && endedAt != null ? `已思考 ${formatDuration(endedAt - startedAt)}` : "思考过程");
  const preview = open ? undefined : lineOf(text, streaming);
  return (
    <Disclosure
      data-slot="reasoning"
      icon={<Brain />}
      title={label}
      summary={preview}
      running={streaming}
      suffix={streaming && startedAt != null ? formatDuration(ms) : undefined}
      open={open}
      onOpenChange={setTouched}
      expandable={text.trim() !== ""}
      className={className}
    >
      <Markdown size="sm" streaming={streaming} animated={false} {...markdown} className="text-[var(--hx-agent-process)]">
        {text}
      </Markdown>
    </Disclosure>
  );
});
