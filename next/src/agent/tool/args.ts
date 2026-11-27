/**
 * 工具参数 / 结果的取值小工具 (纯函数). 不同 Agent 对同一个概念用不同字段名, 这里按常见写法依次找.
 */
export type Args = Record<string, unknown> | undefined;

export function str(args: Args, ...keys: string[]): string | undefined {
  if (!args) return undefined;
  for (const k of keys) {
    const v = args[k];
    if (typeof v === "string" && v !== "") return v;
    if (typeof v === "number") return String(v);
  }
  return undefined;
}

export function num(args: Args, ...keys: string[]): number | undefined {
  if (!args) return undefined;
  for (const k of keys) {
    const v = args[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  }
  return undefined;
}

export function arr<T = unknown>(v: unknown): T[] | undefined {
  return Array.isArray(v) ? (v as T[]) : undefined;
}

export function obj(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined;
}

export const PATH_KEYS = ["file_path", "path", "filePath", "target_file", "filename", "file", "notebook_path"];
export const COMMAND_KEYS = ["command", "cmd", "script", "commandLine"];
export const QUERY_KEYS = ["pattern", "query", "regex", "q", "search", "glob"];
export const URL_KEYS = ["url", "uri", "href"];
export const DESC_KEYS = ["description", "summary", "title", "explanation"];

/** 结果转文本: 字符串原样, {content|text|output|stdout} 取字段, 数组里的 text 块拼起来, 其余 JSON */
export function resultText(result: unknown): string {
  if (result == null) return "";
  if (typeof result === "string") return result;
  if (Array.isArray(result)) return result.map((b) => (typeof b === "string" ? b : (str(obj(b), "text", "content") ?? ""))).filter(Boolean).join("\n");
  const o = obj(result);
  if (o) {
    const t = str(o, "content", "text", "output", "stdout");
    if (t != null) return t;
    const c = arr(o.content);
    if (c) return resultText(c);
  }
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
}

/** 显示用的短路径: 去掉 cwd 前缀, 家目录换成 ~ */
export function shortPath(p: string, cwd?: string): string {
  let s = p;
  if (cwd && s.startsWith(cwd.endsWith("/") ? cwd : `${cwd}/`)) s = s.slice(cwd.length + (cwd.endsWith("/") ? 0 : 1));
  return s.replace(/^\/(?:home|Users)\/[^/]+/, "~");
}

export function basename(p: string): string {
  return p.split(/[\\/]/).filter(Boolean).pop() ?? p;
}

const EXT_LANG: Record<string, string> = {
  ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx", mjs: "javascript", cjs: "javascript", py: "python", rs: "rust", go: "go", java: "java", kt: "kotlin", c: "c", h: "c", cc: "cpp", cpp: "cpp", cxx: "cpp", hpp: "cpp", cs: "csharp", rb: "ruby", php: "php", swift: "swift", sh: "bash", bash: "bash", zsh: "bash", ps1: "powershell", json: "json", jsonc: "jsonc", yml: "yaml", yaml: "yaml", toml: "toml", md: "markdown", mdx: "mdx", html: "html", vue: "vue", svelte: "svelte", css: "css", scss: "scss", less: "less", sql: "sql", xml: "xml", svg: "xml", lua: "lua", dart: "dart", dockerfile: "docker", ini: "ini", cmake: "cmake", gradle: "groovy", proto: "proto", graphql: "graphql", tex: "latex", zig: "zig",
};

export function langOfPath(p: string): string {
  const name = basename(p).toLowerCase();
  if (name === "dockerfile") return "docker";
  if (name === "makefile") return "make";
  if (name === "cmakelists.txt") return "cmake";
  return EXT_LANG[name.split(".").pop() ?? ""] ?? "plaintext";
}

/** 首行 (摘要用) */
export function firstLine(s: string | undefined, max = 160): string {
  if (!s) return "";
  const l = s.split("\n").find((x) => x.trim() !== "") ?? "";
  return l.length > max ? `${l.slice(0, max)}…` : l;
}
