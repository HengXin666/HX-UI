import * as React from "react";
import { ActivityGroup, AgentProvider, ToolCall, type AgentActions, type AgentPart, type ToolCallData } from "@/agent";
import type { DemoProps } from "../types";

const NOW = Date.now();
const t = (s: number) => NOW - s * 1000;

const LINES = ["\x1b[2m> vite build\x1b[0m", "\x1b[36mvite v8.3.8\x1b[0m building for production...", "transforming (412) src/main.tsx", "\x1b[32m✓\x1b[0m 1284 modules transformed.", "dist/index.html          0.62 kB", "dist/assets/index.css   48.10 kB │ gzip: 9.21 kB", "dist/assets/index.js   212.44 kB │ gzip: 68.90 kB", "\x1b[32m✓ built in 3.41s\x1b[0m"];

function useLiveTerminal(): ToolCallData {
  const [n, setN] = React.useState(0);
  const [start] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = window.setInterval(() => setN((x) => (x >= LINES.length + 6 ? 0 : x + 1)), 450);
    return () => window.clearInterval(id);
  }, []);
  const done = n >= LINES.length;
  return { id: "live", name: "bash", status: done ? "success" : "running", args: { command: "npm run build", description: "构建生产包" }, output: LINES.slice(0, n).join("\n") + (n ? "\n" : ""), exitCode: done ? 0 : undefined, startedAt: start, endedAt: done ? start + LINES.length * 450 : undefined };
}

const STATIC: ToolCallData[] = [
  { id: "p", name: "write_file", status: "preparing", argsText: '{"file_path":"/repo/src/api/client.ts","content":"export const client = createClient({\\n  baseUrl: process.env.API', args: { file_path: "/repo/src/api/client.ts", content: "export const client = createClient({\n  baseUrl: process.env.API" }, startedAt: t(1) },
  { id: "r", name: "read_file", status: "success", args: { file_path: "/repo/src/hooks/use-user.ts", offset: 12, limit: 20 }, result: "    12\texport function useUser(id: string) {\n    13\t  const { data, error } = useSWR(`/api/users/${id}`, fetcher);\n    14\t  return { user: data, loading: !data && !error, error };\n    15\t}", startedAt: t(20), endedAt: t(19.6) },
  { id: "e", name: "edit", status: "success", args: { file_path: "/repo/src/hooks/use-user.ts", old_string: "  const { data, error } = useSWR(`/api/users/${id}`, fetcher);\n  return { user: data, loading: !data && !error, error };", new_string: "  const { data, error, isLoading } = useSWR(id ? `/api/users/${id}` : null, fetcher);\n  return { user: data, loading: isLoading, error };" }, result: "ok", startedAt: t(18), endedAt: t(17.7) },
  { id: "g", name: "grep", status: "success", args: { pattern: "useUser\\(", path: "src" }, result: "src/pages/profile.tsx:8:  const { user } = useUser(params.id);\nsrc/pages/settings.tsx:14:  const { user, loading } = useUser(me.id);\nsrc/components/avatar.tsx:5:  const { user } = useUser(id);", startedAt: t(16), endedAt: t(15.8) },
  { id: "f", name: "bash", status: "error", args: { command: "npx tsc --noEmit", description: "类型检查" }, output: "src/pages/settings.tsx(14,23): \x1b[31merror\x1b[0m TS2339: Property 'loading' does not exist on type 'User'.\n", exitCode: 2, startedAt: t(14), endedAt: t(11) },
  { id: "w", name: "web_search", status: "success", args: { query: "swr isLoading vs isValidating" }, result: [{ title: "API – SWR", url: "https://swr.vercel.app/docs/api", snippet: "isLoading: if there's an ongoing request and no loaded data." }, { title: "Understanding isLoading and isValidating", url: "https://swr.vercel.app/docs/advanced/understanding", snippet: "isValidating becomes true whenever there is an ongoing request whether the data is loaded or not." }], startedAt: t(10), endedAt: t(8.5) },
  { id: "todo", name: "todo_write", status: "success", args: { todos: [{ content: "改 useUser 的 loading 判断", status: "completed" }, { content: "修 settings 页的类型错误", status: "in_progress", activeForm: "正在修 settings 页的类型错误" }, { content: "补 useUser 单测", status: "pending" }] }, startedAt: t(8), endedAt: t(7.9) },
  { id: "d", name: "bash", status: "denied", args: { command: "rm -rf node_modules && npm i" }, startedAt: t(6), endedAt: t(5) },
  { id: "x", name: "mcp__linear__create_issue", status: "success", args: { title: "useUser 在 id 为空时仍发请求", team: "WEB", priority: 2 }, result: { id: "WEB-312", url: "https://linear.app/x/issue/WEB-312" }, startedAt: t(4), endedAt: t(3) },
];

const APPROVAL: ToolCallData = { id: "a", name: "bash", status: "awaiting-approval", args: { command: "git push origin feat/use-user", description: "推送分支" }, startedAt: t(2) };
const QUESTION: ToolCallData = {
  id: "q",
  name: "ask_user_question",
  status: "running",
  args: { questions: [{ header: "测试", question: "useUser 的单测用哪种方式 mock 请求?", options: [{ label: "msw", description: "拦截网络请求, 最接近真实" }, { label: "vi.mock(fetcher)", description: "最快, 只测 hook 逻辑" }] }] },
  startedAt: t(1),
};
const SUB: ToolCallData = {
  id: "s",
  name: "task",
  status: "success",
  args: { description: "排查 avatar 组件的重复请求", prompt: "找出 avatar.tsx 为什么每次渲染都请求一次用户信息" },
  children: [
    { type: "reasoning", id: "s-r", text: "先看 avatar 怎么拿 id。", startedAt: t(30), endedAt: t(29) },
    { type: "tool", id: "s-1", call: { id: "s-1", name: "read_file", status: "success", args: { file_path: "/repo/src/components/avatar.tsx" }, result: "1\texport function Avatar({ id }) {", startedAt: t(29), endedAt: t(28.8) } },
    { type: "text", id: "s-t", text: "原因: 父组件每次渲染都传新的 `id` 字符串拼接结果, 但值没变, 实际是 `fetcher` 没有缓存 key。" },
  ],
  startedAt: t(31),
  endedAt: t(26),
};

export default function AgentToolCallDemo({ values, onEvent }: DemoProps) {
  const live = useLiveTerminal();
  const actions = React.useMemo<AgentActions>(
    () => ({
      onApprove: (id, scope) => onEvent?.(`批准 ${id} (${scope === "always" ? "总是允许" : "一次"})`),
      onDeny: (id) => onEvent?.(`拒绝 ${id}`),
      onAnswer: (_id, a) => onEvent?.(`回答: ${JSON.stringify(a)}`),
      onOpenFile: (p, line) => onEvent?.(`打开 ${p}${line ? `:${line}` : ""}`),
    }),
    [onEvent],
  );
  const grouped: AgentPart[] = [live, ...STATIC.slice(1, 4)].map((c) => ({ type: "tool", id: `g-${c.id}`, call: c }));
  return (
    <AgentProvider actions={actions} cwd="/repo">
      <div className="h-full w-full overflow-auto scrollbar-thin">
        <div className="mx-auto max-w-2xl space-y-0.5 px-6 py-6">
          {values.group ? (
            <ActivityGroup parts={grouped} defaultOpen />
          ) : (
            <>
              <ToolCall call={live} />
              {STATIC.map((c) => <ToolCall key={c.id} call={c} />)}
              <ToolCall call={SUB} />
              <ToolCall call={APPROVAL} />
              <ToolCall call={QUESTION} />
            </>
          )}
        </div>
      </div>
    </AgentProvider>
  );
}
