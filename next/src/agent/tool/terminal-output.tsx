"use client";
/**
 * 终端输出面板: ANSI 着色, 运行中自动贴底 (用户上翻后停住), 只渲染最后 maxLines 行, 超出提示 "前面省略 N 行".
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { parseAnsi, tailLines } from "../parts/ansi";
import { CopyIconButton } from "../parts/copy";

export interface TerminalOutputProps {
  /** 命令行 (显示成 $ command) */
  command?: string;
  cwd?: string;
  output?: string;
  running?: boolean;
  /** 最多渲染多少行 (默认 400) */
  maxLines?: number;
  /** 输出区最大高度 (默认 320px) */
  maxHeight?: number;
  className?: string;
}

export function TerminalOutput({ command, cwd, output = "", running, maxLines = 400, maxHeight = 320, className }: TerminalOutputProps) {
  const { text, hidden } = React.useMemo(() => tailLines(output, maxLines), [output, maxLines]);
  const spans = React.useMemo(() => parseAnsi(text), [text]);
  const box = React.useRef<HTMLDivElement>(null);
  const stick = React.useRef(true);
  React.useLayoutEffect(() => {
    const el = box.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [text]);
  return (
    <div data-slot="terminal" className={cn("hx-code group/term relative overflow-hidden rounded-md border border-[var(--hx-code-border)] bg-[var(--hx-term-bg)] font-mono text-xs leading-5 text-[var(--hx-code-fg)]", className)}>
      {command != null && (
        <div className="flex items-start gap-2 border-b border-[var(--hx-code-border)] px-3 py-2">
          <span className="select-none text-[var(--hx-code-add-fg)]">$</span>
          <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">{command}</span>
          {cwd && <span className="shrink-0 truncate text-[var(--hx-code-muted)]" title={cwd}>{cwd}</span>}
          <CopyIconButton text={command} label="复制命令" className="-my-1 size-6 opacity-0 transition-opacity group-hover/term:opacity-70" />
        </div>
      )}
      {(output || running) && (
        <div
          ref={box}
          onScroll={(e) => {
            const el = e.currentTarget;
            stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
          }}
          className="overflow-auto px-3 py-2 scrollbar-thin"
          style={{ maxHeight }}
          tabIndex={0}
          role="log"
          aria-live={running ? "polite" : undefined}
        >
          {hidden > 0 && <div className="mb-1 select-none text-[var(--hx-code-muted)] italic">… 前面省略 {hidden} 行</div>}
          <pre className="m-0 whitespace-pre-wrap break-words">
            {spans.map((s, i) => (
              <span key={i} className={cn(s.bold && "font-semibold", s.dim && "opacity-60", s.italic && "italic", s.underline && "underline")} style={s.fg || s.bg ? { color: s.fg, backgroundColor: s.bg } : undefined}>
                {s.text}
              </span>
            ))}
            {running && <span aria-hidden className="hx-caret" />}
          </pre>
        </div>
      )}
    </div>
  );
}
