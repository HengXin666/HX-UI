/**
 * 内置工具视图 (视图对象: 折叠行画什么, 展开体用哪个组件). 不带 "use client": 视图表是可在服务端导入的数据,
 * 里面引用的组件 (PathLink, TerminalBody ...) 各自是客户端组件.
 */
import { Bot, FilePen, FilePlus2, FileText, Globe, Image as ImageIcon, ListTodo, MessageCircleQuestion, Search, SquareTerminal, Wrench } from "lucide-react";
import { StatusPill } from "../../parts/disclosure";
import { countDiff } from "../../parts/diff";
import { formatBytes } from "../../parts/format";
import { basename, COMMAND_KEYS, DESC_KEYS, firstLine, num, PATH_KEYS, QUERY_KEYS, shortPath, str, URL_KEYS } from "../args";
import type { ToolView, ToolViews } from "../context";
import { DiffStat } from "../diff-view";
import { EditBody, ExternalLink, GenericBody, ImageBody, PathLink, ReadBody, SearchBody, TerminalBody, WebFetchBody, WebSearchBody, WriteBody } from "./basic";
import { editFiles, exitCodeOf, isRunning, searchHits, todosOf, webResults, answersOf, questionsOf } from "./data";
import { QuestionCard, SubagentBody, TodoList } from "./interactive";

export const terminalView: ToolView = {
  kind: "command",
  icon: <SquareTerminal />,
  title: (c) => (isRunning(c) ? "运行中" : "运行"),
  summary: (c) => <span className="font-mono text-[12px]">{str(c.args, ...DESC_KEYS) ?? firstLine(str(c.args, ...COMMAND_KEYS))}</span>,
  suffix: (c) => {
    const code = exitCodeOf(c);
    if (c.args?.run_in_background === true || c.args?.background === true) return <StatusPill tone="muted">后台</StatusPill>;
    if (code != null && code !== 0 && !isRunning(c)) return <StatusPill tone="error">exit {code}</StatusPill>;
    return null;
  },
  defaultOpen: (c) => c.status === "running" && !!c.output,
  Body: TerminalBody,
};

export const readView: ToolView = {
  kind: "read",
  icon: <FileText />,
  title: () => "读取",
  summary: (c) => {
    const p = str(c.args, ...PATH_KEYS);
    return p ? <PathLink path={p} line={num(c.args, "offset", "start_line", "line")} /> : null;
  },
  suffix: (c) => {
    const lim = num(c.args, "limit", "lines");
    return lim != null ? <span>{lim} 行</span> : null;
  },
  Body: ReadBody,
};

export const writeView: ToolView = {
  kind: "edit",
  icon: <FilePlus2 />,
  title: () => "写入",
  summary: (c) => {
    const p = str(c.args, ...PATH_KEYS);
    return p ? <PathLink path={p} /> : null;
  },
  suffix: (c) => {
    const content = str(c.args, "content", "contents", "text");
    return content != null && c.status !== "error" ? <span>{formatBytes(new TextEncoder().encode(content).length)}</span> : null;
  },
  Body: WriteBody,
};

export const editView: ToolView = {
  kind: "edit",
  icon: <FilePen />,
  title: () => "编辑",
  summary: (c) => {
    const paths = editFiles(c)
      .map((f) => f.path)
      .filter((p): p is string => !!p);
    if (!paths.length) return null;
    return paths.length === 1 ? <PathLink path={paths[0]} /> : <span className="font-mono text-[12px]">{paths.map((p) => basename(p)).join(", ")}</span>;
  },
  suffix: (c) => {
    if (c.status === "error" || c.status === "denied") return null;
    const t = editFiles(c).reduce(
      (acc, f) => {
        const d = countDiff(f.rows);
        return { added: acc.added + d.added, removed: acc.removed + d.removed };
      },
      { added: 0, removed: 0 },
    );
    return <DiffStat {...t} />;
  },
  Body: EditBody,
};

export const searchView: ToolView = {
  kind: "search",
  icon: <Search />,
  title: (c) => (/glob|find|list|ls/i.test(c.name) ? "查找文件" : "搜索"),
  summary: (c) => {
    const q = str(c.args, ...QUERY_KEYS);
    const where = str(c.args, "path", "include", "dir", "directory");
    return q ? (
      <>
        <span className="font-mono text-[12px]">{q}</span>
        {where && <span className="ml-1.5 text-xs">于 {shortPath(where)}</span>}
      </>
    ) : null;
  },
  suffix: (c) => (c.status === "success" ? <span>{searchHits(c).length} 处</span> : null),
  Body: SearchBody,
};

export const webFetchView: ToolView = {
  kind: "web",
  icon: <Globe />,
  title: () => "抓取",
  summary: (c) => {
    const u = str(c.args, ...URL_KEYS);
    return u ? <ExternalLink url={u} /> : null;
  },
  Body: WebFetchBody,
};

export const webSearchView: ToolView = {
  kind: "web",
  icon: <Globe />,
  title: () => "搜索网页",
  summary: (c) => <span>{str(c.args, ...QUERY_KEYS)}</span>,
  suffix: (c) => (c.status === "success" ? <span>{webResults(c).length} 条</span> : null),
  Body: WebSearchBody,
};

export const imageView: ToolView = {
  kind: "image",
  icon: <ImageIcon />,
  title: () => "查看图片",
  summary: (c) => {
    const p = str(c.args, ...PATH_KEYS, ...URL_KEYS);
    return p ? <PathLink path={p} /> : null;
  },
  Body: ImageBody,
};

export const todoView: ToolView = {
  kind: "todo",
  icon: <ListTodo />,
  title: () => "更新计划",
  summary: (c) => {
    const cur = todosOf(c).find((t) => t.status === "in_progress");
    return cur ? <span>{cur.activeForm ?? cur.content}</span> : null;
  },
  suffix: (c) => {
    const ts = todosOf(c);
    return ts.length ? (
      <span>
        {ts.filter((t) => t.status === "completed").length}/{ts.length}
      </span>
    ) : null;
  },
  Body: ({ call }) => <TodoList items={todosOf(call)} />,
};

export const questionView: ToolView = {
  kind: "question",
  icon: <MessageCircleQuestion />,
  title: (c) => (answersOf(c) ? "已回答" : "向你提问"),
  summary: (c) => <span>{questionsOf(c)[0]?.question}</span>,
  pinned: (c) => !answersOf(c) && (c.status === "running" || c.status === "awaiting-approval"),
  defaultOpen: () => true,
  Body: QuestionCard,
};

export const subagentView: ToolView = {
  kind: "agent",
  icon: <Bot />,
  title: (c) => (c.name.toLowerCase().includes("fork") ? "分叉子 Agent" : "子 Agent"),
  summary: (c) => <span>{str(c.args, ...DESC_KEYS) ?? firstLine(str(c.args, "prompt", "task", "instructions"))}</span>,
  suffix: (c) => {
    const n = (c.children ?? []).filter((p) => p.type === "tool").length;
    return n ? <span>{n} 次调用</span> : null;
  },
  defaultOpen: (c) => c.status === "running",
  Body: SubagentBody,
};

/** mcp__linear__create_issue -> { server: "linear", tool: "create_issue" }; server.tool / server:tool 同理 */
export function splitToolName(name: string): { server?: string; tool: string } {
  const mcp = /^mcp__(.+?)__(.+)$/.exec(name);
  if (mcp) return { server: mcp[1], tool: mcp[2] };
  const dotted = /^([\w-]+)[.:/](.+)$/.exec(name);
  return dotted ? { server: dotted[1], tool: dotted[2] } : { tool: name };
}

export const genericView: ToolView = {
  kind: "other",
  icon: <Wrench />,
  title: (c) => {
    const { server, tool } = splitToolName(c.name);
    return server ? <span>{tool}<span className="ml-1 font-normal text-muted-foreground">{server}</span></span> : tool;
  },
  summary: (c) => {
    const d = str(c.args, ...DESC_KEYS);
    if (d) return <span>{d}</span>;
    const first = c.args && Object.values(c.args).find((v) => typeof v === "string");
    return typeof first === "string" ? <span className="font-mono text-[12px]">{firstLine(first, 120)}</span> : null;
  },
  Body: GenericBody,
};

const alias = (view: ToolView, names: string[]): ToolViews => Object.fromEntries(names.map((n) => [n, view]));

/**
 * 内置视图按常见工具名注册 (Claude Code, Codex, OpenCode, DSH, Cursor 的叫法都收了; 不区分大小写, 见 resolveToolView).
 * 自己的工具: <AgentProvider toolViews={{ deploy: myDeployView }}> 覆盖或补充.
 */
export const defaultToolViews: ToolViews = {
  ...alias(terminalView, ["bash", "shell", "sh", "pwsh", "powershell", "run_command", "execute_command", "exec_command", "terminal", "run_terminal_cmd", "local_shell", "command"]),
  ...alias(readView, ["read", "read_file", "view", "view_file", "cat", "open_file"]),
  ...alias(writeView, ["write", "write_file", "create_file", "create"]),
  ...alias(editView, ["edit", "edit_file", "multiedit", "multi_edit", "str_replace", "str_replace_editor", "str_replace_based_edit_tool", "apply_patch", "patch", "search_replace", "replace"]),
  ...alias(searchView, ["grep", "glob", "search", "find", "find_files", "file_search", "codebase_search", "grep_search", "list_dir", "ls", "list_files"]),
  ...alias(webFetchView, ["web_fetch", "webfetch", "fetch", "fetch_url", "browse", "open_url"]),
  ...alias(webSearchView, ["web_search", "websearch", "search_web", "google_search"]),
  ...alias(imageView, ["read_image", "view_image", "screenshot", "image"]),
  ...alias(todoView, ["todo_write", "todowrite", "todo", "update_plan", "plan", "update_todos", "write_todos"]),
  ...alias(questionView, ["ask_user", "ask_user_question", "askuserquestion", "question", "ask_followup_question", "request_user_input"]),
  ...alias(subagentView, ["task", "agent", "subagent", "subagent_fork", "spawn_agent", "dispatch_agent", "delegate"]),
};

/** 工具名 -> 视图: 先精确, 再小写, 再去掉 MCP 前缀 (mcp__server__tool, server.tool) */
export function resolveToolView(name: string, views: ToolViews): ToolView {
  const lower = name.toLowerCase();
  const bare = lower.replace(/^mcp__[^_]+(?:_[^_]+)*?__/, "").replace(/^[\w-]+[.:/]/, "");
  return views[name] ?? views[lower] ?? views[bare] ?? genericView;
}
