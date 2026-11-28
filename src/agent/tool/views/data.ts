/**
 * 从工具调用里取视图要的数据 (纯函数, 服务端安全): 终端输出, 退出码, diff, 搜索命中, 网页结果, 图片, 待办, 提问.
 */
import { normalizePlanStatus } from "../../model/todos";
import type { ToolCallData } from "../../model/types";
import { diffLines, parseUnifiedDiff, withContext, type DiffRow } from "../../parts/diff";
import { arr, num, obj, PATH_KEYS, resultText, str } from "../args";

export const isRunning = (c: ToolCallData) => c.status === "running" || c.status === "preparing";

/* 终端 */
export function terminalOutput(c: ToolCallData): string {
  if (c.output) return c.output;
  const r = obj(c.result);
  if (r && (typeof r.stdout === "string" || typeof r.stderr === "string")) return [r.stdout, r.stderr].filter((x) => typeof x === "string" && x).join("\n");
  return resultText(c.result);
}

export function exitCodeOf(c: ToolCallData): number | null | undefined {
  if (c.exitCode !== undefined) return c.exitCode;
  return num(obj(c.result), "exitCode", "exit_code", "code", "returncode");
}

/* 读文件: cat -n 风格的 "     1\t内容" 去掉行号前缀, 返回起始行 */
export function stripLineNumbers(text: string): { code: string; start: number } {
  const lines = text.split("\n");
  const re = /^\s*(\d+)(?:\t|→|\|)/;
  const m = lines[0]?.match(re);
  if (!m || !lines.filter((l) => l !== "").every((l) => re.test(l))) return { code: text, start: 1 };
  return { code: lines.map((l) => l.replace(re, "")).join("\n"), start: Number(m[1]) };
}

/* 改文件 */
export function editFiles(c: ToolCallData): { path?: string; rows: DiffRow[] }[] {
  const meta = obj(c.result);
  const patch = str(c.args, "patch", "input", "diff") ?? (typeof c.meta?.diff === "string" ? c.meta.diff : undefined) ?? str(meta, "diff", "patch");
  if (patch && /^(diff --git|--- |\*\*\* (Begin Patch|Update File|Add File)|@@)/m.test(patch)) {
    return parseUnifiedDiff(patch).map((f) => ({ path: f.path ?? f.oldPath, rows: f.rows }));
  }
  const path = str(c.args, ...PATH_KEYS);
  const edits = arr<Record<string, unknown>>(c.args?.edits) ?? [c.args ?? {}];
  const rows: DiffRow[] = [];
  edits.forEach((e, i) => {
    const o = str(e, "old_string", "oldString", "old_str", "search", "old") ?? "";
    const n = str(e, "new_string", "newString", "new_str", "replace", "new") ?? "";
    if (!o && !n) return;
    if (i > 0) rows.push({ kind: "hunk", text: `第 ${i + 1} 处` });
    rows.push(...withContext(diffLines(o, n)));
  });
  return [{ path, rows }];
}

/* 搜索 */
export interface SearchHit {
  path: string;
  line?: number;
  text?: string;
}
export function searchHits(c: ToolCallData): SearchHit[] {
  const r = c.result;
  const list = arr(r) ?? arr(obj(r)?.matches) ?? arr(obj(r)?.files) ?? arr(obj(r)?.results);
  if (list) return list.map((x) => (typeof x === "string" ? { path: x } : { path: str(obj(x), "path", "file", "filename") ?? "", line: num(obj(x), "line", "line_number", "lineNumber"), text: str(obj(x), "text", "content", "match", "preview") })).filter((h) => h.path);
  const text = resultText(r);
  if (!text) return [];
  return text
    .split("\n")
    .filter((l) => l.trim() && !/^(Found|No (files|matches))/i.test(l))
    .map((l) => {
      const m = l.match(/^(.+?):(\d+)[:-](.*)$/);
      return m ? { path: m[1], line: Number(m[2]), text: m[3] } : { path: l.trim() };
    });
}

/* 网页 */
export function urlLabel(url: string): string {
  try {
    const u = new URL(url);
    return u.host + (u.pathname === "/" ? "" : u.pathname);
  } catch {
    return url;
  }
}
export interface WebResult {
  title?: string;
  url: string;
  snippet?: string;
}
export function webResults(c: ToolCallData): WebResult[] {
  const list = arr(c.result) ?? arr(obj(c.result)?.results) ?? arr(obj(c.result)?.items);
  return (list ?? []).map((x) => ({ title: str(obj(x), "title", "name"), url: str(obj(x), "url", "link", "href") ?? "", snippet: str(obj(x), "snippet", "description", "content", "text") })).filter((r) => r.url);
}

/* 图片 */
export interface ToolImage {
  src: string;
  name?: string;
  width?: number;
  height?: number;
  bytes?: number;
}
export function toolImages(c: ToolCallData): ToolImage[] {
  const list = arr(c.result) ?? arr(obj(c.result)?.images) ?? (obj(c.result) ? [c.result] : []);
  return list
    .map((x) => {
      const o = obj(x);
      const data = str(o, "data", "base64");
      const mime = str(o, "mimeType", "mediaType", "media_type") ?? "image/png";
      return { src: str(o, "url", "src") ?? (data ? `data:${mime};base64,${data}` : ""), name: str(o, "name", "path"), width: num(o, "width"), height: num(o, "height"), bytes: num(o, "bytes", "size") };
    })
    .filter((i) => i.src);
}

/* 待办 */
export type TodoStatus = "pending" | "in_progress" | "completed" | "cancelled";
export interface TodoItem {
  id?: string;
  content: string;
  status: TodoStatus;
  /** 进行中时的说法: "正在跑测试" */
  activeForm?: string;
}
export function todosOf(c: ToolCallData): TodoItem[] {
  const list = arr(c.args?.todos) ?? arr(c.args?.plan) ?? arr(c.args?.items) ?? arr(obj(c.result)?.todos) ?? [];
  return list
    .map((x) => {
      const o = obj(x);
      const status: TodoStatus = normalizePlanStatus(str(o, "status", "state"));
      return { id: str(o, "id"), content: str(o, "content", "step", "title", "text", "task") ?? (typeof x === "string" ? x : ""), status, activeForm: str(o, "activeForm", "active_form") };
    })
    .filter((t) => t.content);
}

/* 提问 */
export interface QuestionOption {
  label: string;
  description?: string;
}
export interface QuestionItem {
  id: string;
  question: string;
  header?: string;
  options: QuestionOption[];
  multiSelect?: boolean;
}
export function questionsOf(c: ToolCallData): QuestionItem[] {
  const list = arr(c.args?.questions) ?? (c.args && str(c.args, "question", "prompt") ? [c.args] : []);
  return list.map((x, i) => {
    const o = obj(x);
    const opts = (arr(o?.options) ?? arr(o?.choices) ?? []).map((op) => (typeof op === "string" ? { label: op } : { label: str(obj(op), "label", "value", "text") ?? "", description: str(obj(op), "description") })).filter((op) => op.label);
    return { id: str(o, "id") ?? String(i), question: str(o, "question", "prompt", "text") ?? "", header: str(o, "header", "title"), options: opts, multiSelect: o?.multiSelect === true || o?.multi_select === true || o?.multiple === true };
  });
}
export function answersOf(c: ToolCallData): Record<string, string | string[]> | null {
  const r = obj(c.result);
  const a = obj(r?.answers) ?? (r && !("content" in r) ? r : null);
  if (a) return a as Record<string, string | string[]>;
  if (typeof c.result === "string" && c.result) return { "0": c.result };
  return null;
}
