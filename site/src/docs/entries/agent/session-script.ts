/**
 * 完整会话的演示剧本 (数据为虚构): 用户提问 -> 编排者思考, 列计划 -> 派出 4 个并行子 Agent (探索 / 实现 / 测试 / 审查,
 * 测试再派一条后台命令) -> 探索把调用点清单交接给实现, 结果回传编排者 (图上光点) -> 实现写文件前停下等批准 (父线程上浮,
 * 点批准或 7 秒后自动继续) -> 各自交回结果 -> 编排者自己读文件, 改代码 (diff), 跑测试 (终端) -> 最终回答.
 * 全程带用量: 每条消息开头一份提示 / 缓存 / 上下文快照, 生成时逐块 usage-delta (实时 tokens/s), 结束时最终用量.
 * 上下文: 编排者是一段续上的长会话 (之前 14 轮的历史), 开头一份 context 构成 (系统提示 / 工具定义 / 注入的 AGENTS.md 与技能),
 * 每个工具结果报 tokens; 收尾读文件 + 跑整套测试把占用推过压缩线 (160k), 最终回答前压缩到 4.3 万 (上下文检视器的演示).
 */
import { estimateTokens, type AgentContextInfo, type AgentEvent, type AgentUsage } from "@/agent";
import type { Step } from "./samples";

export const LEAD = "lead";
export const EXPLORE = "explore";
export const IMPL = "impl";
export const TEST = "test";
export const REVIEW = "review";
export const WATCH = "test-watch";

/** 主线程那条助手消息 */
export const MAIN = "m-lead";
/** 实现停下等批准的那次调用 / 剧本里的停顿 id */
export const APPROVAL_CALL = "im-write";
export const APPROVAL_HOLD = "approve-impl";
const APPROVAL_AUTO_MS = 7000;
const WINDOW = 200_000;

type Cue = { t: number; events: AgentEvent[]; hold?: Step["hold"] };

const msg = (agentId: string) => (agentId === LEAD ? MAIN : `m-${agentId}`);

/** 一段文字逐块流出, 每块带一条 usage-delta (精确的输出 token 增量) */
function stream(agentId: string, t: number, partId: string, body: string, opts: { every?: number; size?: number; reasoning?: boolean } = {}): Cue[] {
  const { every = 45, size = 3, reasoning = false } = opts;
  const m = msg(agentId);
  const out: Cue[] = [];
  for (let i = 0, k = 0; i < body.length; i += size, k++) {
    const delta = body.slice(i, i + size);
    const tokens = estimateTokens(delta);
    out.push({
      t: t + k * every,
      events: [
        reasoning ? { type: "reasoning-delta", messageId: m, partId, delta, agentId } : { type: "text-delta", messageId: m, partId, delta, agentId },
        { type: "usage-delta", messageId: m, outputTokens: tokens, reasoningTokens: reasoning ? tokens : undefined },
      ],
    });
  }
  const end = t + Math.ceil(body.length / size) * every;
  out.push({ t: end, events: [reasoning ? { type: "reasoning-end", messageId: m, partId } : { type: "text-end", messageId: m, partId }] });
  return out;
}

/** 文字流完的时刻 */
const after = (t: number, body: string, every = 45, size = 3) => t + Math.ceil(body.length / size) * every;

interface ToolOpts {
  output?: string[];
  result?: unknown;
  error?: string;
  exitCode?: number;
  /** 等批准: 推到 awaiting-approval 后剧本停住 */
  approval?: boolean;
  /** 结果进上下文的 token 数 */
  tokens?: number;
}

/** 工具: 开始 -> 参数 -> 运行 -> (输出逐行) -> 结果 */
function tool(agentId: string, t: number, callId: string, name: string, args: Record<string, unknown>, ms: number, opts: ToolOpts = {}): Cue[] {
  const m = msg(agentId);
  const json = JSON.stringify(args);
  const cues: Cue[] = [{ t, events: [{ type: "tool-start", messageId: m, callId, name, agentId }] }];
  // 参数也是模型输出: 逐块流出, 计进 tokens/s
  for (let i = 0, k = 0; i < json.length; i += 14, k++) cues.push({ t: t + 20 + k * 25, events: [{ type: "tool-args-delta", messageId: m, callId, delta: json.slice(i, i + 14) }, { type: "usage-delta", messageId: m, outputTokens: 4 }] });
  const argsEnd = t + 40 + Math.ceil(json.length / 14) * 25;
  cues.push({ t: argsEnd, events: [{ type: "tool-args", messageId: m, callId, args }, { type: "tool-status", messageId: m, callId, status: opts.approval ? "awaiting-approval" : "running" }] });
  const out = opts.output ?? [];
  out.forEach((line, i) => cues.push({ t: argsEnd + ((i + 1) * ms) / (out.length + 1), events: [{ type: "tool-output-delta", messageId: m, callId, delta: `${line}\n` }] }));
  cues.push({ t: argsEnd + ms, events: [{ type: "tool-result", messageId: m, callId, result: opts.result, error: opts.error, exitCode: opts.exitCode, status: opts.error ? "error" : "success", tokens: opts.tokens }] });
  return cues;
}

type TodoArgs = Record<string, unknown>;
const T = (content: string, status: "pending" | "in_progress" | "completed" | "cancelled", children?: TodoArgs[], activeForm?: string): TodoArgs => ({ content, status, ...(activeForm ? { activeForm } : null), ...(children ? { children } : null) });

/** 编排者更新计划: todo_write 的整份快照 (嵌套 children), 或 OMP 的 todo 操作 (op: done / append ...); 参数一次给齐, 不流式 (计划面板不闪) */
function todo(t: number, callId: string, args: TodoArgs, name = "todo_write"): Cue[] {
  return [
    { t, events: [{ type: "tool-start", messageId: MAIN, callId, name, agentId: LEAD }] },
    { t: t + 60, events: [{ type: "tool-args", messageId: MAIN, callId, args }, { type: "usage-delta", messageId: MAIN, outputTokens: 24 }, { type: "tool-status", messageId: MAIN, callId, status: "running" }] },
    { t: t + 140, events: [{ type: "tool-result", messageId: MAIN, callId, result: "ok" }] },
  ];
}

/** 计划的几个阶段 (大项 > 小项) */
const plan = (s: { search: S; mark: S; keep?: S; impl: S; sites: S; cases: S; trailing?: S; run: S; behavior: S; verdict: S }) => ({
  todos: [
    T("探索调用点", "pending", [T("搜索 debounce 调用", s.search, undefined, "正在搜索调用点"), T("标注需要 leading 的调用点", s.mark)]),
    T("实现 leading", "pending", [T("改 debounce 实现", s.impl, undefined, "正在改 debounce"), ...(s.keep ? [T("保持默认行为不变", s.keep)] : []), T("改调用点 (需批准)", s.sites, undefined, "等待批准写入调用点")]),
    T("补测试", "pending", [T("写 9 个边界用例", s.cases), ...(s.trailing ? [T("覆盖 trailing=false", s.trailing)] : []), T("跑测试", s.run, undefined, "正在跑测试")]),
    T("审查 diff", "pending", [T("看行为变化", s.behavior), T("给出结论", s.verdict)]),
  ],
});
type S = "pending" | "in_progress" | "completed" | "cancelled";
const P = "pending", A = "in_progress", D = "completed";

const status = (agentId: string, s: Extract<AgentEvent, { type: "agent-status" }>["status"], summary?: string, waitingOn?: string[]): AgentEvent => ({ type: "agent-status", agentId, status: s, summary, waitingOn });
/** 演示价目 (美元 / 百万 token): 提示未命中, 缓存命中, 缓存写入, 输出 */
const PRICE: Record<string, readonly [number, number, number, number]> = {
  "hx-opus": [5, 0.5, 6.25, 25],
  "hx-sonnet": [3, 0.3, 3.75, 15],
  "hx-haiku": [1, 0.1, 1.25, 5],
};
const MODEL_OF: Record<string, string> = { [LEAD]: "hx-opus", [EXPLORE]: "hx-haiku", [IMPL]: "hx-sonnet", [TEST]: "hx-sonnet", [REVIEW]: "hx-opus" };
const PER_TOKEN = 1e-6;
const usd = (n: number) => Math.round(n * 1e6) / 1e6;
/** 每个 Agent 到目前为止花了多少 (按剧本里写出请求的顺序累加; sessionScript 开头清零) */
const spent = new Map<string, number>();
/** 一次请求的提示侧费用 (未命中 + 命中 + 写入), 记进 spent */
function bill(agentId: string, u: AgentUsage): number {
  const [miss, hit, write] = PRICE[MODEL_OF[agentId]];
  const input = u.inputTokens ?? u.contextTokens ?? 0;
  const cached = Math.min(u.cachedInputTokens ?? 0, input);
  const cost = usd(((input - cached) * miss + cached * hit + (u.cacheWriteTokens ?? 0) * write) * PER_TOKEN);
  spent.set(agentId, usd((spent.get(agentId) ?? 0) + cost));
  return cost;
}

/**
 * 每份 usage 都是一次请求自己的用量 (scope: "request"): 累计值由 reducer 加起来, 命中率读累计不会随每次请求跳.
 * 每次请求都带这次的费用 (按价目算), 底栏费用随请求一点点涨, 不会到结束才一下对齐.
 */
const usage = (agentId: string, u: AgentUsage): AgentEvent => ({ type: "usage", messageId: msg(agentId), scope: "request", usage: { contextWindow: WINDOW, ...u, cost: bill(agentId, u) } });
const start = (agentId: string, model: string, u: AgentUsage): AgentEvent[] => [
  { type: "message-start", messageId: msg(agentId), agentId, model },
  { type: "context", messageId: msg(agentId), context: agentId === LEAD ? LEAD_CONTEXT : SUB_CONTEXT },
  usage(agentId, u),
];
/** 结束: 最终用量的费用 = 各次请求的提示侧 + 这条消息的输出 (只有输出那一小段是结束时才加上的) */
const end = (agentId: string, u: Omit<AgentUsage, "cost">): AgentEvent => {
  const out = (u.outputTokens ?? 0) * PRICE[MODEL_OF[agentId]][3] * PER_TOKEN;
  return { type: "message-end", messageId: msg(agentId), usage: { contextWindow: WINDOW, ...u, cost: usd((spent.get(agentId) ?? 0) + out) } };
};

/** 编排者派一个子 Agent: task 调用 + 嵌在它里面的 agent-spawn (于是 spawn 记住了这次调用, 编排块放在这里) */
function dispatch(t: number, agentId: string, spawn: Omit<Extract<AgentEvent, { type: "agent-spawn" }>, "type" | "agentId" | "parentAgentId">, prompt: string): Cue[] {
  const callId = `task-${agentId}`;
  return [
    { t, events: [{ type: "tool-start", messageId: MAIN, callId, name: "task", agentId: LEAD }] },
    {
      t: t + 160,
      events: [
        { type: "tool-args", messageId: MAIN, callId, args: { description: spawn.task, subagent_type: spawn.role, prompt } },
        { type: "usage-delta", messageId: MAIN, outputTokens: 38 },
        { type: "tool-status", messageId: MAIN, callId, status: "running" },
        { type: "tool-child", messageId: MAIN, callId, event: { type: "agent-spawn", agentId, parentAgentId: LEAD, ...spawn } },
      ],
    },
  ];
}

/** 子 Agent 交回结果: 回传消息 (图上光点) + 完成 + 父调用拿到结果 */
function finish(t: number, agentId: string, text: string, summary: string, u: Omit<AgentUsage, "cost">, tokens?: number): Cue {
  return {
    t,
    events: [
      { type: "agent-message", from: agentId, to: LEAD, text, kind: "result" },
      status(agentId, "done", summary),
      end(agentId, u),
      // tokens: 子 Agent 交回的完整报告进编排者上下文的大小 (这里只显示一句摘要)
      { type: "tool-result", messageId: MAIN, callId: `task-${agentId}`, result: text, tokens },
    ],
  };
}

const PLAN = "用户要给 debounce 加 leading 选项, 还要改调用点、补测试、出审查结论。四件事有先后: 实现依赖调用点清单, 测试与审查依赖实现。\n\n拆成四个子 Agent 并行: 探索先跑, 测试先写用例, 实现与审查等前置完成。";
const SPLIT = "拆成四块并行处理：**探索**找调用点，**实现**改 `debounce`，**测试**补边界用例，**审查**看最终 diff。";

const READ_RESULT = `     1\texport function debounce<A extends unknown[]>(
     2\t  fn: (...a: A) => void,
     3\t  wait: number,
     4\t  opts: DebounceOptions = {},
     5\t) {
     6\t  let timer: ReturnType<typeof setTimeout> | undefined;`;

const README_OLD = `## debounce(fn, wait)

静默 wait 毫秒后执行一次。`;
const README_NEW = `## debounce(fn, wait, opts?)

静默 wait 毫秒后执行一次。

- \`leading: true\` 首次调用立即执行
- \`leading\` 与 \`trailing\` 同时开且只调用一次时, 只执行一次`;

/** 上下文构成 (演示数字): 编排者带着之前 14 轮的历史, 子 Agent 只有精简的系统提示与工具 */
const LEAD_CONTEXT: AgentContextInfo = {
  window: WINDOW,
  compactAt: 160_000,
  reservedOutput: 16_000,
  system: 6_200,
  tools: 15_800,
  toolSchemas: [
    { id: "mcp-github", label: "github (12 个工具)", detail: "mcp:github", tokens: 4_200, kind: "tool" },
    { id: "task", label: "task", detail: "子 Agent", tokens: 3_400, kind: "tool" },
    { id: "bash", label: "bash", tokens: 1_900, kind: "tool" },
    { id: "edit", label: "edit", tokens: 1_650, kind: "tool" },
    { id: "read_file", label: "read_file", tokens: 1_200, kind: "tool" },
    { id: "todo_write", label: "todo_write", tokens: 1_100, kind: "tool" },
  ],
  injected: [
    { id: "agents-md", label: "AGENTS.md", detail: "仓库指令", tokens: 2_400, kind: "instructions" },
    { id: "skill-testing", label: "testing-patterns", detail: "技能", tokens: 1_300, kind: "skill" },
    { id: "next-agents-md", label: "next/AGENTS.md", detail: "子目录指令", tokens: 900, kind: "instructions" },
  ],
  history: 104_000,
};
const SUB_CONTEXT: AgentContextInfo = {
  window: WINDOW,
  system: 3_100,
  tools: 4_600,
  injected: [{ id: "agents-md", label: "AGENTS.md", detail: "仓库指令", tokens: 2_400, kind: "instructions" }],
};

const FINAL = `完成了，四个子 Agent 的结果都已合并：

| 子 Agent | 结果 |
|---|---|
| 探索 | 12 处调用，autosave / search / resize 需要 leading |
| 实现 | 加了 \`leading\` / \`trailing\`，改了 4 个文件（已批准写入） |
| 测试 | 9 个边界用例全部通过 |
| 审查 | LGTM，建议在 README 写明同时开启时的行为（已补上） |

\`\`\`ts title="用法"
const save = debounce(persist, 500, { leading: true });
\`\`\`

整套测试 **14 / 14** 通过。要不要顺手把 \`throttle\` 也改成同样的选项？`;

/**
 * 剧本: 按绝对时刻排好的事件, 转成 "距上一步多少毫秒" 的步骤; 实现等批准的那一步带 hold.
 * 研究笔记: docs/dsh-conversation-research.md
 */
export function sessionScript(): Step[] {
  spent.clear();
  const tFinal = 31_600;
  const cues: Cue[] = [
    { t: 0, events: [{ type: "user-message", messageId: "u1", text: "给 debounce 加一个 leading 选项：改完所有调用点、补上测试，最后给我一份审查结论" }] },
    { t: 300, events: [{ type: "agent-spawn", agentId: LEAD, name: "编排者", role: "lead", model: "hx-opus", status: "running", task: "拆分任务, 派发子 Agent, 汇总结果" }, ...start(LEAD, "hx-opus", { inputTokens: 131_000, cachedInputTokens: 118_200, cacheWriteTokens: 2_100, contextTokens: 131_000 })] },
    ...stream(LEAD, 900, "lead-r1", PLAN, { every: 30, size: 3, reasoning: true }),
    // 计划: 参数流式写出来, 计划面板跟着一项项长出来
    ...tool(LEAD, after(900, PLAN, 30) + 100, "lead-todo", "todo_write", plan({ search: A, mark: P, impl: P, sites: P, cases: P, trailing: P, run: P, behavior: P, verdict: P }), 160),
    ...stream(LEAD, 3_900, "lead-t1", SPLIT, { every: 35 }),
    ...dispatch(5_000, EXPLORE, { name: "探索", role: "explorer", model: "hx-haiku", task: "找出仓库里所有 debounce 调用点和它们的参数", status: "running" }, "列出所有 debounce 调用, 标注哪些依赖首次立即执行"),
    ...dispatch(5_250, IMPL, { name: "实现", role: "coder", model: "hx-sonnet", task: "给 debounce 加 leading / trailing 选项, 保持旧行为默认不变" }, "等探索的调用点清单, 然后实现并改调用点"),
    ...dispatch(5_500, TEST, { name: "测试", role: "tester", model: "hx-sonnet", task: "为 leading / trailing 的组合补边界测试", status: "running" }, "先写用例, 等实现落地后跑"),
    ...dispatch(5_750, REVIEW, { name: "审查", role: "reviewer", model: "hx-opus", task: "审查最终 diff 的行为变化与风险" }, "等实现完成后审查 diff"),
    { t: 6_000, events: [status(LEAD, "running", "等待子 Agent", [EXPLORE, IMPL, TEST, REVIEW]), usage(LEAD, { contextTokens: 131_900, cachedInputTokens: 129_600 }), status(IMPL, "running", "等探索给出调用点", [EXPLORE]), status(REVIEW, "running", "等实现完成", [IMPL])] },

    ...todo(6_050, "todo-2", plan({ search: A, mark: P, impl: P, sites: P, cases: A, trailing: P, run: P, behavior: P, verdict: P })),
    // 子 Agent 进展时编排者实时打勾, 增删子项
    ...todo(7_950, "todo-3", plan({ search: D, mark: A, keep: P, impl: P, sites: P, cases: A, trailing: P, run: P, behavior: P, verdict: P })),
    ...todo(9_650, "todo-4", plan({ search: D, mark: A, keep: P, impl: P, sites: P, cases: D, run: P, behavior: P, verdict: P })),
    ...todo(10_750, "todo-5", plan({ search: D, mark: D, keep: P, impl: A, sites: P, cases: D, run: P, behavior: P, verdict: P })),

    // 探索
    { t: 6_100, events: start(EXPLORE, "hx-haiku", { inputTokens: 9_200, cachedInputTokens: 7_900, contextTokens: 9_200 }) },
    ...tool(EXPLORE, 6_300, "ex-grep", "grep", { pattern: "debounce\\(", path: "src" }, 1_300, { output: ["src/utils/debounce.ts:1", "src/editor/autosave.ts:12", "src/search/box.tsx:30", "src/hooks/use-resize.ts:8"] }),
    ...tool(EXPLORE, 8_000, "ex-read", "read_file", { file_path: "src/editor/autosave.ts" }, 700, { result: "const save = debounce(persist, 500);" }),
    ...stream(EXPLORE, 8_900, "ex-sum", "共 12 处调用, 其中 autosave、search、resize 三处依赖首次立即执行。", { every: 55, size: 4 }),

    // 测试: 先写用例, 派一条后台命令
    { t: 6_200, events: [...start(TEST, "hx-sonnet", { inputTokens: 11_000, cachedInputTokens: 8_800, contextTokens: 11_000 }), { type: "agent-spawn", agentId: WATCH, parentAgentId: TEST, name: "vitest --watch", kind: "command", task: "监视 src/utils 变化并重跑测试", status: "running" }] },
    ...stream(TEST, 6_400, "te-plan", "先按 leading × trailing × wait=0 的组合列 9 个用例。", { every: 60, size: 4 }),
    ...tool(TEST, 7_600, "te-write", "write_file", { file_path: "src/utils/debounce.test.ts", content: "describe('debounce leading', () => { /* 9 cases */ })" }, 1_600),
    { t: 9_600, events: [{ type: "agent-message", from: TEST, to: IMPL, text: "边界: wait=0 且 leading 时只执行一次", kind: "message" }, status(TEST, "running", "等实现落地", [IMPL])] },

    // 探索交回, 交接给实现
    {
      t: 10_600,
      events: [
        { type: "agent-handoff", from: EXPLORE, to: IMPL, note: "调用点清单 (12 处) 交给实现" },
        status(IMPL, "running", "按清单修改实现"),
        ...start(IMPL, "hx-sonnet", { inputTokens: 14_600, cachedInputTokens: 9_400, cacheWriteTokens: 1_800, contextTokens: 14_600 }),
      ],
    },
    finish(10_700, EXPLORE, "共 12 处调用, autosave / search / resize 三处需要 leading", "找到 12 处调用", { outputTokens: 640, contextTokens: 10_900 }, 2_900),
    { t: 10_800, events: [usage(LEAD, { contextTokens: 134_800, cachedInputTokens: 130_900 })] },

    // 实现: 改 debounce, 写调用点前等批准
    ...stream(IMPL, 10_900, "im-plan", "用 timer === undefined 判断首次调用; 首次且 leading 时立即执行。", { every: 50, size: 4 }),
    ...tool(IMPL, 12_200, "im-edit", "edit", { file_path: "src/utils/debounce.ts", old_string: "opts: { leading?: boolean } = {}", new_string: "opts: DebounceOptions = {}" }, 1_100),
    ...tool(IMPL, 13_700, APPROVAL_CALL, "multi_edit", { file_path: "src/editor/autosave.ts", description: "写入 autosave / search / resize 3 个调用点", files: 3 }, 1_500, { approval: true }).map((c, i, all) =>
      // awaiting-approval 那一步停住; 结果那一步留给批准后
      i === all.length - 1 ? { ...c, t: c.t + 600 } : c,
    ),
  ];
  // 实现停下等批准: 状态 + 剧本停顿 (父线程上浮审批条)
  const approvalAt = cues.filter((c) => c.events.some((e) => e.type === "tool-status" && e.callId === APPROVAL_CALL)).map((c) => c.t)[0];
  cues.push({ t: approvalAt + 1, events: [status(IMPL, "awaiting-approval", "写入 src/editor/autosave.ts 等 3 个文件")], hold: { id: APPROVAL_HOLD, ms: APPROVAL_AUTO_MS } });
  // 批准之后: 调用继续跑 (上面那条结果事件在 +1500ms 后到)
  cues.push({ t: approvalAt + 2, events: [{ type: "tool-status", messageId: msg(IMPL), callId: APPROVAL_CALL, status: "running" }, status(IMPL, "running", "已批准, 写入调用点")] });
  const resumed = approvalAt + 2;
  cues.push(...todo(approvalAt + 3, "todo-6", plan({ search: D, mark: D, keep: D, impl: D, sites: A, cases: D, run: P, behavior: P, verdict: P })));
  cues.push(
    ...todo(resumed + 3_450, "todo-7", plan({ search: D, mark: D, keep: D, impl: D, sites: D, cases: D, run: A, behavior: A, verdict: P })),
    ...todo(resumed + 6_350, "todo-8", plan({ search: D, mark: D, keep: D, impl: D, sites: D, cases: D, run: D, behavior: A, verdict: P })),
    // 审查建议补 README: 用 OMP 的增量操作 (append 一个子项, done 两项)
    ...todo(resumed + 7_450, "todo-9", { op: "append", phase: "审查 diff", items: ["README 写明同时开启的行为"] }, "todo"),
    ...todo(resumed + 7_550, "todo-10", { op: "done", task: ["看行为变化", "给出结论"] }, "todo"),
  );
  cues.push(
    ...stream(IMPL, resumed + 2_300, "im-sum", "leading 已加, 默认行为不变, 改了 4 个文件。", { every: 50, size: 4 }),
    finish(resumed + 3_400, IMPL, "已加 leading / trailing, 改了 4 个文件", "改了 4 个文件", { outputTokens: 1_480, contextTokens: 19_300 }, 3_400),
    { t: resumed + 3_500, events: [status(TEST, "running", "跑测试"), status(REVIEW, "running", "审查 diff"), usage(LEAD, { contextTokens: 138_300, cachedInputTokens: 133_700 }), ...start(REVIEW, "hx-opus", { inputTokens: 16_800, cachedInputTokens: 14_100, contextTokens: 16_800 })] },
    // 测试跑起来
    ...tool(TEST, resumed + 3_700, "te-run", "bash", { command: "npx vitest run src/utils", description: "跑 debounce 的用例" }, 2_000, {
      output: ["\x1b[2m> vitest run src/utils\x1b[0m", " \x1b[32m✓\x1b[0m leading 首次立即执行", " \x1b[32m✓\x1b[0m trailing 静默后补一次", " \x1b[32m✓\x1b[0m wait=0 只执行一次", " \x1b[1mTests\x1b[0m  \x1b[32m9 passed\x1b[0m (9)"],
      exitCode: 0,
    }),
    { t: resumed + 6_000, events: [{ type: "agent-message", from: WATCH, to: TEST, text: "9 passed", kind: "result" }, status(WATCH, "done", "9 passed")] },
    finish(resumed + 6_300, TEST, "9 个用例全部通过", "9 passed", { outputTokens: 1_120, contextTokens: 15_200 }, 2_100),
    // 审查
    ...tool(REVIEW, resumed + 3_800, "rv-diff", "bash", { command: "git diff --stat" }, 900, { output: [" src/utils/debounce.ts   | 14 +++++---", " src/editor/autosave.ts  |  2 +-", " 4 files changed"], exitCode: 0 }),
    ...stream(REVIEW, resumed + 5_000, "rv-sum", "行为兼容, 默认不变。建议在 README 写明 leading 与 trailing 同时开启时只执行一次。", { every: 55, size: 4 }),
    finish(resumed + 7_400, REVIEW, "LGTM, 1 条文档建议", "LGTM", { outputTokens: 860, contextTokens: 18_100 }, 3_000),
  );
  // 编排者收尾: 读文件, 补 README (diff), 跑整套测试 (终端), 最终回答
  const lead = resumed + 7_700;
  const think = "四个子 Agent 都交回了。审查建议补 README, 我自己改, 再跑一遍整套测试确认。";
  cues.push(
    { t: lead, events: [status(LEAD, "running", "汇总结果"), usage(LEAD, { inputTokens: 143_900, cachedInputTokens: 137_200, contextTokens: 143_900 })] },
    ...stream(LEAD, lead + 100, "lead-r2", think, { every: 30, reasoning: true }),
    ...tool(LEAD, after(lead + 100, think, 30) + 100, "lead-read", "read_file", { file_path: "/repo/src/utils/debounce.ts" }, 500, { result: READ_RESULT, tokens: 6_800 }),
    ...tool(LEAD, after(lead + 100, think, 30) + 1_300, "lead-edit", "edit", { file_path: "/repo/README.md", old_string: README_OLD, new_string: README_NEW }, 600, { result: "ok" }),
    ...todo(after(lead + 100, think, 30) + 2_350, "todo-11", { op: "done", task: "README 写明同时开启的行为" }, "todo"),
    ...todo(after(lead + 100, think, 30) + 2_450, "todo-12", { op: "append", phase: "收尾", items: ["跑整套测试"] }, "todo"),
    ...todo(after(lead + 100, think, 30) + 4_650, "todo-13", { op: "done", task: "跑整套测试" }, "todo"),
    ...tool(LEAD, after(lead + 100, think, 30) + 2_600, "lead-test", "bash", { command: "npm test", description: "整套测试" }, 1_800, {
      output: ["\x1b[2m> vitest run\x1b[0m", "", " \x1b[32m✓\x1b[0m src/utils/debounce.test.ts \x1b[2m(9 tests)\x1b[0m 41ms", " \x1b[32m✓\x1b[0m src/editor/autosave.test.ts \x1b[2m(5 tests)\x1b[0m 22ms", "", " \x1b[1mTest Files\x1b[0m  \x1b[32m2 passed\x1b[0m (2)", " \x1b[1m     Tests\x1b[0m  \x1b[32m14 passed\x1b[0m (14)"],
      exitCode: 0,
      tokens: 9_600,
    }),
    // 每个结果回来, 下一次请求的占用随之上涨 (读文件 +6.8k, 整套测试的输出 +9.6k)
    { t: after(lead + 100, think, 30) + 1_250, events: [usage(LEAD, { contextTokens: 151_100, cachedInputTokens: 143_800 })] },
    { t: after(lead + 100, think, 30) + 2_500, events: [usage(LEAD, { contextTokens: 151_900, cachedInputTokens: 150_600 })] },
    { t: after(lead + 100, think, 30) + 4_550, events: [usage(LEAD, { contextTokens: 161_900, cachedInputTokens: 151_700 })] },
  );
  const answer = Math.max(tFinal, after(lead + 100, think, 30) + 5_000);
  cues.push(
    // 越过压缩线 (160k): 回答前自动压缩, 之前的对话收成摘要
    { t: answer - 700, events: [{ type: "compaction", messageId: MAIN, partId: "lead-compact", agentId: LEAD, before: 161_900, after: 42_600, summary: "debounce 加 leading 的改动, 四个子 Agent 的结论, 测试结果" }] },
    { t: answer - 100, events: [usage(LEAD, { contextTokens: 43_300, cachedInputTokens: 26_600 })] },
    ...stream(LEAD, answer, "lead-final", FINAL, { every: 22, size: 3 }),
  );

  // 等子 Agent 时编排者每收到一份进度 / 交回就再发一次请求: 上下文演变图上每次请求一根柱 (在已知的几个点之间插值)
  const anchors: [number, number, number][] = [
    [6_000, 131_900, 129_600],
    [10_800, 134_800, 130_900],
    [resumed + 3_500, 138_300, 133_700],
    [lead, 143_900, 137_200],
  ];
  for (let a = 0; a < anchors.length - 1; a++) {
    const [t0, c0, k0] = anchors[a];
    const [t1, c1, k1] = anchors[a + 1];
    for (let t = t0 + 700; t < t1 - 300; t += 700) {
      const f = (t - t0) / (t1 - t0);
      cues.push({ t, events: [usage(LEAD, { contextTokens: Math.round(c0 + (c1 - c0) * f), cachedInputTokens: Math.round(k0 + (k1 - k0) * f) })] });
    }
  }

  // 编排者结束放在所有请求之后写, 最终费用才包含上面插值出来的每次请求
  const tail = after(answer, FINAL, 22) + 200;
  cues.push({ t: tail, events: [end(LEAD, { outputTokens: 3_940, reasoningTokens: 820, contextTokens: 45_200 }), status(LEAD, "done", "全部完成")] });

  cues.sort((a, b) => a.t - b.t);
  let last = 0;
  return cues.map((c) => {
    const wait = c.t - last;
    last = c.t;
    return { wait, events: c.events, hold: c.hold };
  });
}
