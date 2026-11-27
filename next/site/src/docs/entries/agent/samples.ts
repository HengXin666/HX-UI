/** Agent 文档页的示例内容: 一篇覆盖各种语法的回答, 一段完整的 Agent 运行剧本 */
import type { AgentEvent } from "@/agent";

export const SAMPLE_MARKDOWN = `## 给 debounce 加上 leading

改动分两步: 先让计时器知道 **这一次是不是首次调用**, 再在 \`flush\` 里决定要不要补发尾调用。

- [x] 读现有实现
- [x] 加 \`leading\` / \`trailing\` 选项
- [ ] 补边界测试

| 选项 | 默认 | 作用 |
|---|---|---|
| \`leading\` | \`false\` | 第一次调用立刻执行 |
| \`trailing\` | \`true\` | 静默期结束后再执行一次 |
| \`maxWait\` | 无 | 最长等多久必须执行 |

\`\`\`ts title="src/utils/debounce.ts" {4-6}
export function debounce<A extends unknown[]>(fn: (...a: A) => void, wait: number, opts: { leading?: boolean } = {}) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    const first = timer === undefined;
    if (first && opts.leading) fn(...args);
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      if (!opts.leading || !first) fn(...args);
    }, wait);
  };
}
\`\`\`

同一个思路的三种写法 (组合代码块, 点选项卡切换):

\`\`\`cpp [impl-C++]
template <class F>
auto debounce(F f, std::chrono::milliseconds wait) {
    return [=, last = std::chrono::steady_clock::time_point{}]() mutable {
        auto now = std::chrono::steady_clock::now();
        if (now - last > wait) f();
        last = now;
    };
}
\`\`\`

\`\`\`python [impl-Python]
import time

def debounce(wait: float):
    def deco(fn):
        last = 0.0
        def wrapped(*a, **k):
            nonlocal last
            now = time.monotonic()
            if now - last > wait:
                fn(*a, **k)
            last = now
        return wrapped
    return deco
\`\`\`

\`\`\`rust [impl-Rust]
pub struct Debounce { last: Option<std::time::Instant>, wait: std::time::Duration }

impl Debounce {
    pub fn hit(&mut self) -> bool {
        let now = std::time::Instant::now();
        let fire = self.last.map_or(true, |t| now - t > self.wait);
        self.last = Some(now);
        fire
    }
}
\`\`\`

调用时序:

\`\`\`mermaid
sequenceDiagram
    participant U as 用户输入
    participant D as debounce
    participant F as fn
    U->>D: 第 1 次
    D->>F: leading 立即执行
    U->>D: 第 2..n 次
    Note over D: 静默 wait 毫秒
    D->>F: trailing 补一次
\`\`\`

状态流转:

\`\`\`mermaid
flowchart LR
    A[空闲] -->|调用| B{首次?}
    B -->|是, leading| C[立即执行]
    B -->|否| D[重置计时]
    C --> D
    D -->|wait 到期| E[尾调用]
    E --> A
\`\`\`

一张内联 SVG:

\`\`\`svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" width="320" height="80">
  <rect x="1" y="1" width="318" height="78" rx="10" fill="none" stroke="#61afef" stroke-width="2"/>
  <circle cx="40" cy="40" r="14" fill="#98c379"/>
  <circle cx="90" cy="40" r="6" fill="#7f848e"/><circle cx="120" cy="40" r="6" fill="#7f848e"/><circle cx="150" cy="40" r="6" fill="#7f848e"/>
  <circle cx="270" cy="40" r="14" fill="#e5c07b"/>
  <text x="40" y="72" text-anchor="middle" font-size="11" fill="#abb2bf">leading</text>
  <text x="270" y="72" text-anchor="middle" font-size="11" fill="#abb2bf">trailing</text>
</svg>
\`\`\`

触发间隔满足 $$\\Delta t \\ge w$$ 时才执行, 期望执行次数:

$$
E[N] = \\sum_{i=1}^{n} \\Pr(t_i - t_{i-1} \\ge w) = n \\cdot e^{-\\lambda w}
$$

\`\`\`diff
- if (!opts.leading) fn(...args);
+ if (!opts.leading || !first) fn(...args);
\`\`\`

> 注意: \`leading\` 和 \`trailing\` 同时为 \`true\` 且只调用一次时, 只执行一次。

参考 [lodash.debounce](https://lodash.com/docs/#debounce) 的语义。
`;

/* ---------------- Agent 运行剧本 ---------------- */

export interface Step {
  /** 距上一步的毫秒 (1x 速度) */
  wait: number;
  events: AgentEvent[];
}

const M = "a1";
let seq = 0;
const ev = <T extends AgentEvent>(e: T) => e;

/** 文字按 2..5 字一块切开, 每块一步 */
function streamText(kind: "text" | "reasoning", partId: string, text: string, ms = 28): Step[] {
  const out: Step[] = [];
  for (let i = 0; i < text.length; ) {
    const n = 2 + ((i * 7 + seq++) % 4);
    const delta = text.slice(i, i + n);
    i += n;
    out.push({ wait: ms, events: [kind === "text" ? ev({ type: "text-delta", messageId: M, partId, delta }) : ev({ type: "reasoning-delta", messageId: M, partId, delta })] });
  }
  out.push({ wait: 0, events: [kind === "text" ? ev({ type: "text-end", messageId: M, partId }) : ev({ type: "reasoning-end", messageId: M, partId })] });
  return out;
}

/** 工具: 开始 -> 参数流式 -> 运行 -> (输出流式) -> 结果 */
function tool(callId: string, name: string, args: Record<string, unknown>, opts: { output?: string[]; result?: unknown; error?: string; exitCode?: number; runMs?: number; approval?: boolean } = {}): Step[] {
  const json = JSON.stringify(args);
  const steps: Step[] = [{ wait: 160, events: [{ type: "tool-start", messageId: M, callId, name }] }];
  for (let i = 0; i < json.length; i += 9) steps.push({ wait: 18, events: [{ type: "tool-args-delta", messageId: M, callId, delta: json.slice(i, i + 9) }] });
  if (opts.approval) steps.push({ wait: 60, events: [{ type: "tool-status", messageId: M, callId, status: "awaiting-approval" }] }, { wait: 1800, events: [] });
  steps.push({ wait: 80, events: [{ type: "tool-status", messageId: M, callId, status: "running" }] });
  for (const line of opts.output ?? []) steps.push({ wait: 180, events: [{ type: "tool-output-delta", messageId: M, callId, delta: line + "\n" }] });
  steps.push({ wait: opts.runMs ?? 420, events: [{ type: "tool-result", messageId: M, callId, result: opts.result, error: opts.error, exitCode: opts.exitCode, status: opts.error ? "error" : "success" }] });
  return steps;
}

const READ_RESULT = `     1\texport function debounce<A extends unknown[]>(fn: (...a: A) => void, wait: number) {
     2\t  let timer: ReturnType<typeof setTimeout> | undefined;
     3\t  return (...args: A) => {
     4\t    clearTimeout(timer);
     5\t    timer = setTimeout(() => fn(...args), wait);
     6\t  };
     7\t}`;

const OLD = `export function debounce<A extends unknown[]>(fn: (...a: A) => void, wait: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}`;
const NEW = `export function debounce<A extends unknown[]>(fn: (...a: A) => void, wait: number, opts: { leading?: boolean } = {}) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    const first = timer === undefined;
    if (first && opts.leading) fn(...args);
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      if (!opts.leading || !first) fn(...args);
    }, wait);
  };
}`;

const FINAL = `改好了, \`debounce\` 现在支持 \`leading\`:

\`\`\`ts title="用法"
const save = debounce(persist, 500, { leading: true });
\`\`\`

| 检查 | 结果 |
|---|---|
| 单测 | 14 / 14 通过 |
| lint | 通过 |

\`\`\`mermaid
flowchart LR
    A[首次调用] -->|leading| B[立即执行]
    B --> C[静默 500ms]
    C -->|期间又调用| D[尾调用一次]
\`\`\`

要不要顺手把 \`throttle\` 也改成同样的选项?`;

export function agentScript(): Step[] {
  seq = 0;
  return [
    { wait: 0, events: [{ type: "user-message", messageId: "u1", text: "给 src/utils/debounce.ts 加一个 leading 选项, 然后跑一下测试和 lint" }] },
    { wait: 400, events: [{ type: "message-start", messageId: M, model: "hx-coder" }] },
    ...streamText("reasoning", "r1", "用户要给 debounce 加 leading 选项。先看现有实现和调用方, 再改代码, 最后跑测试。\n\n需要注意 leading 和 trailing 同时开时只调用一次的边界。", 22),
    ...tool("c-todo", "todo_write", { todos: [{ content: "读现有实现", status: "in_progress", activeForm: "正在读现有实现" }, { content: "加 leading 选项", status: "pending" }, { content: "跑测试与 lint", status: "pending" }] }, { runMs: 120 }),
    ...tool("c-grep", "grep", { pattern: "debounce\\(", path: "src" }, { result: "src/utils/debounce.ts:1:export function debounce<A extends unknown[]>(\nsrc/editor/autosave.ts:12:const save = debounce(persist, 500);\nsrc/search/box.tsx:30:const onType = debounce(query, 200);", runMs: 300 }),
    ...tool("c-read", "read_file", { file_path: "/repo/src/utils/debounce.ts" }, { result: READ_RESULT, runMs: 200 }),
    ...streamText("reasoning", "r2", "实现很短。用 timer === undefined 判断首次调用, 首次且 leading 时立即执行, 计时结束时如果首次已经执行过就不再补。", 20),
    ...tool("c-edit", "edit", { file_path: "/repo/src/utils/debounce.ts", old_string: OLD, new_string: NEW }, { result: "ok", runMs: 260 }),
    ...tool("c-test", "bash", { command: "npm test -- debounce", description: "跑 debounce 的单测" }, {
      output: ["\x1b[2m> vitest run debounce\x1b[0m", "", " \x1b[32m✓\x1b[0m src/utils/debounce.test.ts \x1b[2m(14 tests)\x1b[0m 38ms", "   \x1b[32m✓\x1b[0m trailing 默认行为", "   \x1b[32m✓\x1b[0m leading 立即执行", "   \x1b[32m✓\x1b[0m leading + trailing 只调用一次", "", " \x1b[1mTest Files\x1b[0m  \x1b[32m1 passed\x1b[0m (1)", " \x1b[1m     Tests\x1b[0m  \x1b[32m14 passed\x1b[0m (14)"],
      exitCode: 0,
      runMs: 300,
    }),
    ...tool("c-lint", "bash", { command: "npm run lint", description: "跑 lint" }, { output: ["\x1b[1msrc/utils/debounce.ts\x1b[0m", "  3:62  \x1b[31merror\x1b[0m  'opts' default object should be typed  @typescript-eslint/no-inferrable", "", "\x1b[31m✖ 1 problem (1 error, 0 warnings)\x1b[0m"], exitCode: 1, runMs: 200 }),
    ...streamText("reasoning", "r3", "lint 要求把选项类型写成具名接口。", 20),
    ...tool("c-edit2", "edit", { file_path: "/repo/src/utils/debounce.ts", old_string: "wait: number, opts: { leading?: boolean } = {}", new_string: "wait: number, opts: DebounceOptions = {}" }, { result: "ok", runMs: 200 }),
    ...tool("c-lint2", "bash", { command: "npm run lint", description: "再跑一次 lint" }, { output: ["\x1b[32m✔ no problems\x1b[0m"], exitCode: 0, runMs: 260 }),
    ...tool("c-todo2", "todo_write", { todos: [{ content: "读现有实现", status: "completed" }, { content: "加 leading 选项", status: "completed" }, { content: "跑测试与 lint", status: "completed" }] }, { runMs: 100 }),
    ...streamText("text", "t1", FINAL, 18),
    { wait: 200, events: [{ type: "message-end", messageId: M, usage: { inputTokens: 18200, cachedInputTokens: 12400, outputTokens: 1630, reasoningTokens: 410, contextTokens: 41000, contextWindow: 200000, cost: 0.0213 } }] },
  ];
}
