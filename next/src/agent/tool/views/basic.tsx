"use client";
/**
 * 内置工具视图的展开体与行内小件 (组件). 视图对象 (折叠行怎么画) 在 defs.tsx.
 */
import * as React from "react";
import { CodeBlock } from "../../code/code-block";
import { Markdown } from "../../markdown/markdown";
import { formatBytes } from "../../parts/format";
import { basename, COMMAND_KEYS, langOfPath, PATH_KEYS, resultText, shortPath, str } from "../args";
import { useAgentUI, type ToolViewProps } from "../context";
import { DiffView } from "../diff-view";
import { TerminalOutput } from "../terminal-output";
import { editFiles, searchHits, stripLineNumbers, terminalOutput, toolImages, urlLabel, webResults, type SearchHit } from "./data";

/** 可点击的路径 (交给 onOpenFile), 没有回调时是普通文字 */
export function PathLink({ path, line }: { path: string; line?: number }) {
  const { actions, cwd } = useAgentUI();
  const label = shortPath(path, cwd) + (line ? `:${line}` : "");
  if (!actions.onOpenFile) return <span className="font-mono text-[12px]">{label}</span>;
  const open = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
    actions.onOpenFile!(path, line);
  };
  return (
    <span role="link" tabIndex={0} onClick={open} onKeyDown={(e) => e.key === "Enter" && open(e)} className="cursor-pointer font-mono text-[12px] underline-offset-2 hover:text-foreground hover:underline">
      {label}
    </span>
  );
}

export function ExternalLink({ url, children }: { url: string; children?: React.ReactNode }) {
  const { actions } = useAgentUI();
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.stopPropagation();
        if (actions.onOpenUrl) {
          e.preventDefault();
          actions.onOpenUrl(url);
        }
      }}
      className="underline-offset-2 hover:text-foreground hover:underline"
    >
      {children ?? urlLabel(url)}
    </a>
  );
}

export function ErrorText({ text }: { text: string }) {
  return <div className="my-1 whitespace-pre-wrap break-words rounded-md border border-destructive/25 bg-destructive/6 px-3 py-2 font-mono text-xs text-destructive">{text}</div>;
}

export function TerminalBody({ call }: ToolViewProps) {
  return <TerminalOutput command={str(call.args, ...COMMAND_KEYS)} cwd={str(call.args, "cwd", "workdir", "working_directory")} output={terminalOutput(call) || (call.error ?? "")} running={call.status === "running"} />;
}

export function ReadBody({ call }: ToolViewProps) {
  const p = str(call.args, ...PATH_KEYS) ?? "";
  const { code, start } = stripLineNumbers(resultText(call.result));
  if (call.error) return <ErrorText text={call.error} />;
  if (!code) return null;
  return <CodeBlock code={code.replace(/\n$/, "")} language={langOfPath(p)} title={basename(p)} startLine={start} collapse={14} maxHeight={420} className="my-1.5" />;
}

export function WriteBody({ call }: ToolViewProps) {
  const p = str(call.args, ...PATH_KEYS) ?? "";
  const content = str(call.args, "content", "contents", "text") ?? "";
  return (
    <>
      {call.error && <ErrorText text={call.error} />}
      <CodeBlock code={content} language={langOfPath(p)} title={basename(p)} collapse={16} maxHeight={420} incomplete={call.status === "preparing"} className="my-1.5" />
    </>
  );
}

export function EditBody({ call }: ToolViewProps) {
  const files = editFiles(call);
  return (
    <div className="space-y-2 py-1.5">
      {call.error && <ErrorText text={call.error} />}
      {files.map((f, i) => (
        <div key={i}>
          {files.length > 1 && f.path && (
            <div className="mb-1 text-xs text-muted-foreground">
              <PathLink path={f.path} />
            </div>
          )}
          {f.rows.length ? <DiffView rows={f.rows} /> : null}
        </div>
      ))}
    </div>
  );
}

export function SearchBody({ call }: ToolViewProps) {
  const hits = searchHits(call);
  if (call.error) return <ErrorText text={call.error} />;
  if (!hits.length) return <div className="py-1 text-xs text-muted-foreground">没有结果</div>;
  const groups = new Map<string, SearchHit[]>();
  for (const h of hits) groups.set(h.path, [...(groups.get(h.path) ?? []), h]);
  const shown = [...groups].slice(0, 40);
  return (
    <div className="max-h-80 space-y-1.5 overflow-auto py-1 text-xs scrollbar-thin">
      {shown.map(([path, hs]) => (
        <div key={path}>
          <div className="text-muted-foreground">
            <PathLink path={path} line={hs[0].line} />
            {hs.length > 1 && <span className="ml-1.5">{hs.length}</span>}
          </div>
          {hs
            .filter((h) => h.text != null)
            .slice(0, 6)
            .map((h, i) => (
              <div key={i} className="flex gap-2 pl-3 font-mono">
                <span className="w-8 shrink-0 text-right text-muted-foreground/70 tabular">{h.line}</span>
                <span className="truncate">{h.text}</span>
              </div>
            ))}
        </div>
      ))}
      {groups.size > shown.length && <div className="text-muted-foreground">… 还有 {groups.size - shown.length} 个文件</div>}
    </div>
  );
}

export function WebFetchBody({ call }: ToolViewProps) {
  if (call.error) return <ErrorText text={call.error} />;
  const text = resultText(call.result);
  return text ? (
    <div className="max-h-80 overflow-auto rounded-md border bg-muted/30 px-3 py-2 scrollbar-thin">
      <Markdown size="sm">{text.length > 20000 ? `${text.slice(0, 20000)}\n\n…` : text}</Markdown>
    </div>
  ) : null;
}

export function WebSearchBody({ call }: ToolViewProps) {
  const rs = webResults(call);
  if (call.error) return <ErrorText text={call.error} />;
  if (!rs.length) return <div className="whitespace-pre-wrap py-1 text-xs text-muted-foreground">{resultText(call.result) || "没有结果"}</div>;
  return (
    <ul className="space-y-2 py-1">
      {rs.slice(0, 10).map((r, i) => (
        <li key={i} className="min-w-0">
          <div className="truncate text-[13px] text-foreground/90">
            <ExternalLink url={r.url}>{r.title ?? urlLabel(r.url)}</ExternalLink>
          </div>
          <div className="truncate text-xs text-muted-foreground">{urlLabel(r.url)}</div>
          {r.snippet && <div className="line-clamp-2 text-xs text-muted-foreground">{r.snippet}</div>}
        </li>
      ))}
    </ul>
  );
}

export function ImageBody({ call }: ToolViewProps) {
  const imgs = toolImages(call);
  if (call.error) return <ErrorText text={call.error} />;
  return (
    <div className="flex flex-wrap gap-2 py-1.5">
      {imgs.map((im, i) => (
        <figure key={i} className="overflow-hidden rounded-md border bg-muted/40">
          <img src={im.src} alt={im.name ?? ""} loading="lazy" className="max-h-56 max-w-72 object-contain" />
          {(im.width || im.bytes) && (
            <figcaption className="border-t px-2 py-1 text-[11px] text-muted-foreground tabular">
              {im.width && im.height ? `${im.width}×${im.height}` : ""}
              {im.width && im.bytes ? " · " : ""}
              {im.bytes ? formatBytes(im.bytes) : ""}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

export function GenericBody({ call }: ToolViewProps) {
  const input = call.args ? JSON.stringify(call.args, null, 2) : (call.argsText ?? "");
  const out = call.output || resultText(call.result);
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 py-1.5">
      {input && (
        <>
          <span className="pt-1.5 font-mono text-[11px] text-muted-foreground">IN</span>
          <CodeBlock code={input} language="json" incomplete={call.status === "preparing"} lineNumbers={false} collapse={12} hideLanguage className="my-0" />
        </>
      )}
      {(out || call.error) && (
        <>
          <span className="pt-1.5 font-mono text-[11px] text-muted-foreground">OUT</span>
          {call.error ? <ErrorText text={call.error} /> : <CodeBlock code={out} language={/^\s*[[{]/.test(out) ? "json" : "plaintext"} lineNumbers={false} collapse={14} hideLanguage className="my-0" />}
        </>
      )}
    </div>
  );
}
