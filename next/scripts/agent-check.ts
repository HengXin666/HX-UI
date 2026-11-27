/**
 * Agent 拓展包的逻辑自检.  Run: node scripts/agent-check.ts   (Node 22.18+, 直接跑 TS)
 * 只测纯逻辑 (档位样式的单调分级, 实时上下文与累计 tokens 的分开标签, 上下文构成 / 演变 / 事件, 推理强度升降档, 渐变档位条的吸附 / 键盘 / 强度, 累计与本次请求的缓存命中率, planCalls=hidden 的过滤, 计划树 / 待办派生, 按 Agent 区分的速率, 模型与推理强度选择, 围栏 meta, 组合代码块切块, 部分 JSON, 事件 reducer, 多 Agent 树与选择器, 实时用量 / 速率, 会话编排块的范围, 轨迹账本,
 * diff, ANSI, 活动摘要 / 分段, AI SDK 适配, 工具数据提取).
 * 组件的渲染在文档站里看. 没有测试框架, node:assert, 第一个失败就 exit 1.
 */
import assert from "node:assert/strict";
import { register } from "node:module";

register(
  "data:text/javascript," +
    encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  try { return await next(spec, ctx); }
  catch (e) {
    if (spec.startsWith(".") && !/\\.[cm]?[jt]sx?$/.test(spec)) return next(spec + ".ts", ctx);
    throw e;
  }
}`),
);

const { parseFence, splitInfo, parseRanges } = await import("../src/agent/markdown/fence.ts");
const { mergeGroupBlocks, parseBlocksWithGroups, remarkCodeGroups, fenceGroupOf } = await import("../src/agent/markdown/groups.ts");
const { parsePartialJson, parsePartialArgs } = await import("../src/agent/model/partial-json.ts");
const { reduceAgentEvents, emptyAgentState } = await import("../src/agent/model/events.ts");
type AgentEvent = import("../src/agent/model/events.ts").AgentEvent;
const { diffLines, withContext, countDiff, parseUnifiedDiff } = await import("../src/agent/parts/diff.ts");
const { parseAnsi, stripAnsi, collapseCarriageReturns, tailLines } = await import("../src/agent/parts/ansi.ts");
const { summarizeActivity, rankActivity } = await import("../src/agent/model/summary.ts");
const usage = await import("../src/agent/model/usage.ts");
const trajectory = await import("../src/agent/model/trajectory.ts");
const { segmentParts, activitySpan } = await import("../src/agent/model/group.ts");
const { fromAiSdkMessages, agentEventsFromAiSdk } = await import("../src/agent/adapters/ai-sdk.ts");
const agents = await import("../src/agent/model/agents.ts");
const orchestraLayout = await import("../src/agent/orchestra/layout.ts");
const { formatDuration, formatBytes, formatTokens } = await import("../src/agent/parts/format.ts");
const data = await import("../src/agent/tool/views/data.ts");
const { shortPath, langOfPath, resultText } = await import("../src/agent/tool/args.ts");
const todos = await import("../src/agent/model/todos.ts");
const models = await import("../src/agent/model/models.ts");
const planIndex = await import("../src/agent/model/plan-index.ts");
const ctx = await import("../src/agent/model/context.ts");

let passed = 0;
async function check(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`ok   ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}\n${e instanceof Error ? (e.stack ?? e.message) : String(e)}`);
    process.exit(1);
  }
}

await check("围栏 meta: 语言归一, 标题, 行高亮, 组, 行号, 折叠", () => {
  const m = parseFence("C++", 'title="main.cpp" {1,3-5} [解法-C++] startLine=10 collapse=8');
  assert.equal(m.lang, "cpp");
  assert.equal(m.rawLang, "C++");
  assert.equal(m.title, "main.cpp");
  assert.deepEqual([...m.highlight], [1, 3, 4, 5]);
  assert.deepEqual(m.group, { name: "解法", label: "C++" });
  assert.equal(m.startLine, 10);
  assert.equal(m.collapse, 8);
  assert.equal(m.lineNumbers, true);
  assert.equal(parseFence("py", "showLineNumbers=false").lineNumbers, false);
  assert.equal(parseFence("ts", "title='a b.ts'").title, "a b.ts");
  assert.equal(parseFence("", "").lang, "plaintext");
  assert.deepEqual(splitInfo('ts{1} title="x"'), { lang: "ts", meta: '{1} title="x"' });
  assert.equal(parseRanges("5-3, x, 9").size, 4);
});

await check("组合代码块: 切块后同组相邻围栏并回一块, 不同组 / 正文隔开就不并", () => {
  const md = "前言\n\n```cpp [s-C++]\nint a;\n```\n\n```py [s-Py]\na=1\n```\n\n```go [t-Go]\n```\n\n正文\n\n```rs [s-Rust]\n```\n";
  const blocks = parseBlocksWithGroups(md);
  const fences = blocks.filter((b) => fenceGroupOf(b.trimStart()));
  assert.equal(fences.length, 3, JSON.stringify(blocks));
  assert.ok(fences[0].includes("int a;") && fences[0].includes("a=1"));
  assert.deepEqual(mergeGroupBlocks(["```a [g-1]\n```\n", "\n", "```b [g-2]\n```"]).length, 2);
  // remark: 顶层相邻同组 code -> hxCodeGroup
  const tree = { type: "root", children: [{ type: "code", meta: "[g-A]" }, { type: "code", meta: "[g-B]" }, { type: "paragraph" }, { type: "code", meta: "[g-C]" }] };
  remarkCodeGroups()(tree);
  assert.deepEqual(tree.children.map((n: { type: string; children?: unknown[] }) => `${n.type}${n.children ? n.children.length : ""}`), ["hxCodeGroup2", "paragraph", "hxCodeGroup1"]);
});

await check("部分 JSON: 半截字符串 / key / 字面量 / 嵌套都能补出来", () => {
  assert.deepEqual(parsePartialJson('{"command": "npm te'), { command: "npm te" });
  assert.deepEqual(parsePartialJson('{"a": 1, "b'), { a: 1 });
  assert.deepEqual(parsePartialJson('{"a": 1, "b":'), { a: 1 });
  assert.deepEqual(parsePartialJson('{"a": [1, 2, {"x": tr'), { a: [1, 2, {}] });
  assert.deepEqual(parsePartialJson('{"s": "line\\'), { s: "line" });
  assert.deepEqual(parsePartialJson('{"todos": [{"content": "写测试", "status": "in_pro'), { todos: [{ content: "写测试", status: "in_pro" }] });
  assert.equal(parsePartialJson(""), undefined);
  assert.equal(parsePartialArgs("[1,2"), undefined);
  assert.deepEqual(parsePartialArgs('{"x": 12.'), {});
});

await check("事件 reducer: 文本 / 思考 / 工具三段式 / 输出 / 子 Agent / 收尾, 未改动的引用不变", () => {
  const ev: AgentEvent[] = [
    { type: "user-message", messageId: "u1", text: "跑一下测试", at: 1 },
    { type: "message-start", messageId: "a1", at: 2 },
    { type: "reasoning-delta", messageId: "a1", partId: "r1", delta: "先看看", at: 3 },
    { type: "reasoning-delta", messageId: "a1", partId: "r1", delta: "脚本" },
    { type: "tool-start", messageId: "a1", callId: "c1", name: "bash", at: 5 },
    { type: "tool-args-delta", messageId: "a1", callId: "c1", delta: '{"command":"npm t' },
  ];
  let s = reduceAgentEvents(emptyAgentState(), ev);
  const a = s.messages[1];
  assert.equal(s.messages.length, 2);
  assert.equal(a.parts[0].type === "reasoning" && a.parts[0].streaming, false, "工具开始时思考收尾");
  const tool = a.parts[1];
  assert.ok(tool.type === "tool" && tool.call.status === "preparing" && tool.call.args?.command === "npm t");
  const userBefore = s.messages[0];
  const reasoningBefore = a.parts[0];
  s = reduceAgentEvents(s, [
    { type: "tool-args-delta", messageId: "a1", callId: "c1", delta: 'est"}' },
    { type: "tool-status", messageId: "a1", callId: "c1", status: "running", at: 6 },
    { type: "tool-output-delta", messageId: "a1", callId: "c1", delta: "PASS 12\n" },
    { type: "tool-result", messageId: "a1", callId: "c1", exitCode: 0, at: 9 },
    { type: "tool-start", messageId: "a1", callId: "c2", name: "task" },
    { type: "tool-child", messageId: "a1", callId: "c2", event: { type: "text-delta", messageId: "-", partId: "t", delta: "子任务完成" } },
    { type: "text-delta", messageId: "a1", partId: "t1", delta: "全部" },
    { type: "text-delta", messageId: "a1", partId: "t1", delta: "通过" },
  ]);
  assert.equal(s.messages[0], userBefore, "用户消息引用不变");
  const b = s.messages[1];
  assert.equal(b.parts[0], reasoningBefore, "没改的 part 引用不变");
  const c1 = b.parts[1];
  assert.ok(c1.type === "tool" && c1.call.status === "success" && c1.call.output === "PASS 12\n" && c1.call.exitCode === 0 && c1.call.startedAt === 6 && c1.call.endedAt === 9);
  const c2 = b.parts[2];
  assert.ok(c2.type === "tool" && c2.call.children?.[0].type === "text");
  assert.ok(b.parts[3].type === "text" && b.parts[3].text === "全部通过" && b.parts[3].streaming);
  s = reduceAgentEvents(s, [{ type: "message-end", messageId: "a1", status: "stopped", usage: { outputTokens: 10 }, at: 20 }]);
  const end = s.messages[1];
  assert.equal(end.status, "stopped");
  assert.ok(end.parts[2].type === "tool" && end.parts[2].call.status === "interrupted", "未结束的工具在停止时记为中断");
  assert.ok(end.parts[3].type === "text" && !end.parts[3].streaming);
  assert.equal(end.usage?.outputTokens, 10);
});

await check("diff: Myers 求差, 上下文折叠, 统一 diff 解析", () => {
  const rows = diffLines("a\nb\nc\nd", "a\nB\nc\nd\ne");
  assert.deepEqual(rows.map((r) => `${r.kind}:${r.text}`), ["ctx:a", "del:b", "add:B", "ctx:c", "ctx:d", "add:e"]);
  assert.deepEqual(countDiff(rows), { added: 2, removed: 1 });
  assert.deepEqual(diffLines("", "x").map((r) => r.kind), ["add"]);
  assert.deepEqual(diffLines("x", "").map((r) => r.kind), ["del"]);
  const long = Array.from({ length: 30 }, (_, i) => `l${i}`);
  const changed = long.slice();
  changed[15] = "CHANGED";
  const ctx = withContext(diffLines(long.join("\n"), changed.join("\n")), 2);
  assert.equal(ctx.filter((r) => r.kind === "hunk").length, 2);
  assert.equal(ctx.filter((r) => r.kind === "ctx").length, 4);
  const files = parseUnifiedDiff("diff --git a/x.ts b/x.ts\n--- a/x.ts\n+++ b/x.ts\n@@ -1,2 +1,2 @@\n a\n-b\n+c\n");
  assert.equal(files.length, 1);
  assert.equal(files[0].path, "x.ts");
  assert.deepEqual([files[0].added, files[0].removed], [1, 1]);
  assert.deepEqual(files[0].rows.filter((r) => r.kind !== "hunk").map((r) => [r.oldNo, r.newNo]), [[1, 1], [2, undefined], [undefined, 2]]);
});

await check("ANSI: 颜色 / 粗体 / 256 色 / 回车覆盖 / 去控制序列 / 尾部截取", () => {
  const sp = parseAnsi("a\x1b[1;31mred\x1b[0m\x1b[38;5;82mg\x1b[39m");
  assert.deepEqual(sp.map((s) => s.text), ["a", "red", "g"]);
  assert.ok(sp[1].bold && sp[1].fg);
  assert.ok(sp[2].fg?.startsWith("rgb("));
  assert.equal(collapseCarriageReturns("10%\r50%\r100%\ndone"), "100%\ndone");
  assert.equal(stripAnsi("\x1b[2K\x1b[1Gok"), "ok");
  const t = tailLines("1\n2\n3\n4\n5\n", 2);
  assert.equal(t.text, "4\n5\n");
  assert.equal(t.hidden, 3);
});

await check("活动摘要 / 分段: 按次数排 (同次数按先后), 最多点名三类, 提问 / 正文断开活动", () => {
  assert.equal(summarizeActivity(["command", "edit", "edit", "read", "search"]), "修改了 2 个文件, 运行了 1 条命令, 读取了 1 个文件 等 1 项");
  assert.deepEqual(rankActivity(["read", "command", "read"]).map((r) => `${r.kind}=${r.count}`), ["read=2", "command=1"]);
  assert.deepEqual(rankActivity(["command", "read"]).map((r) => r.kind), ["command", "read"], "同次数没有固定优先级, 按第一次出现");
  assert.equal(summarizeActivity([], { reasoning: 2 }), "思考过程");
  const parts = [
    { type: "reasoning", id: "r", text: "" },
    { type: "tool", id: "a", call: { id: "a", name: "bash", status: "success", startedAt: 1, endedAt: 4 } },
    { type: "notice", id: "n", kind: "retry", text: "重试" },
    { type: "tool", id: "q", call: { id: "q", name: "ask_user", status: "running" } },
    { type: "tool", id: "b", call: { id: "b", name: "read", status: "success", startedAt: 5, endedAt: 7 } },
    { type: "text", id: "t", text: "完成" },
  ] as const;
  const segs = segmentParts(parts as never, (p) => p.id === "q");
  assert.deepEqual(segs.map((s) => (s.type === "activity" ? `act${s.parts.length}` : s.part.id)), ["act3", "q", "act1", "t"]);
  const span = activitySpan(parts.slice(0, 2) as never);
  assert.deepEqual(span, { start: 1, end: 4, live: false });
});

await check("AI SDK 适配: text / reasoning / tool-* / dynamic-tool 状态映射", () => {
  const ms = fromAiSdkMessages(
    [
      { id: "u", role: "user", parts: [{ type: "text", text: "hi" }] },
      {
        id: "a",
        role: "assistant",
        parts: [
          { type: "step-start" },
          { type: "reasoning", text: "嗯", state: "done" },
          { type: "tool-bash", toolCallId: "c1", state: "output-available", input: { command: "ls" }, output: "a\nb" },
          { type: "dynamic-tool", toolName: "deploy", toolCallId: "c2", state: "approval-requested", input: {} },
          { type: "text", text: "好", state: "streaming" },
        ],
      },
    ],
    { streaming: true },
  );
  const a = ms[1];
  assert.equal(a.status, "streaming");
  assert.deepEqual(a.parts.map((p) => p.type), ["reasoning", "tool", "tool", "text"]);
  assert.ok(a.parts[1].type === "tool" && a.parts[1].call.name === "bash" && a.parts[1].call.status === "success");
  assert.ok(a.parts[2].type === "tool" && a.parts[2].call.name === "deploy" && a.parts[2].call.status === "awaiting-approval");
  assert.equal(ms[0].status, "done");
});

await check("工具数据: 终端 stdout/stderr, cat -n 行号, 编辑 diff, grep 命中, 待办, 提问", () => {
  const base = { id: "x", name: "t", status: "success" as const };
  assert.equal(data.terminalOutput({ ...base, result: { stdout: "o", stderr: "e" } }), "o\ne");
  assert.equal(data.exitCodeOf({ ...base, result: { exit_code: 2 } }), 2);
  assert.deepEqual(data.stripLineNumbers("    10\ta\n    11\tb"), { code: "a\nb", start: 10 });
  assert.deepEqual(data.stripLineNumbers("plain\ntext").start, 1);
  const ed = data.editFiles({ ...base, args: { file_path: "/p/a.ts", old_string: "x\ny", new_string: "x\nz" } });
  assert.equal(ed[0].path, "/p/a.ts");
  assert.deepEqual(countDiff(ed[0].rows), { added: 1, removed: 1 });
  const multi = data.editFiles({ ...base, args: { file_path: "a", edits: [{ old_string: "a", new_string: "b" }, { old_string: "c", new_string: "d" }] } });
  assert.equal(multi[0].rows.filter((r) => r.kind === "hunk").length, 1);
  const patch = data.editFiles({ ...base, args: { input: "*** Begin Patch\n*** Update File: src/x.ts\n@@\n-a\n+b\n*** End Patch" } });
  assert.equal(patch[0].path, "src/x.ts");
  assert.equal(data.searchHits({ ...base, result: "src/a.ts:3:foo\nsrc/a.ts:9:bar\nsrc/b.ts" }).length, 3);
  const todos = data.todosOf({ ...base, args: { todos: [{ content: "A", status: "completed" }, { content: "B", status: "in-progress", activeForm: "正在 B" }, "C"] } });
  assert.deepEqual(todos.map((t) => t.status), ["completed", "in_progress", "pending"]);
  const qs = data.questionsOf({ ...base, args: { questions: [{ question: "选哪个?", options: ["甲", { label: "乙", description: "推荐" }], multiSelect: true }] } });
  assert.equal(qs[0].options.length, 2);
  assert.equal(qs[0].multiSelect, true);
  assert.equal(data.answersOf({ ...base, result: { answers: { "0": "甲" } } })?.["0"], "甲");
});

await check("小工具: 路径缩短, 后缀语言, 结果转文本, 时长 / 字节格式", () => {
  assert.equal(shortPath("/repo/src/a.ts", "/repo"), "src/a.ts");
  assert.equal(shortPath("/home/hx/x"), "~/x");
  assert.equal(langOfPath("a/b/Main.CPP"), "cpp");
  assert.equal(langOfPath("Dockerfile"), "docker");
  assert.equal(resultText([{ type: "text", text: "a" }, { type: "text", text: "b" }]), "a\nb");
  assert.equal(formatDuration(450), "0.5 秒");
  assert.equal(formatDuration(65_000), "1 分 05 秒");
  assert.equal(formatBytes(2048), "2.0 KB");
});

await check("多 Agent: spawn / status / handoff / message 建树, 乱序先到的子节点归位, 消息引用不变", () => {
  let s = reduceAgentEvents(emptyAgentState(), [
    { type: "user-message", messageId: "u1", text: "重构并补测试", at: 0 },
    { type: "agent-spawn", agentId: "lead", name: "编排者", model: "opus", status: "running", at: 1 },
    // 子节点的状态比 spawn 先到, 孙节点比子节点先到
    { type: "agent-status", agentId: "b", status: "running", at: 2 },
    { type: "agent-spawn", agentId: "b1", parentAgentId: "b", name: "b1", kind: "command", at: 2 },
    { type: "agent-spawn", agentId: "a", parentAgentId: "lead", name: "探索", role: "explorer", task: "找出所有调用点", at: 2 },
    { type: "agent-spawn", agentId: "b", parentAgentId: "lead", name: "实现", at: 3 },
  ]);
  const t = s.agents;
  assert.deepEqual(agents.agentRoots(t).map((n) => n.id), ["lead"]);
  assert.deepEqual(agents.childrenOf(t, "lead").map((n) => n.id), ["a", "b"]);
  assert.deepEqual(agents.childrenOf(t, "b").map((n) => n.id), ["b1"], "先到的孙节点在父 spawn 后归位");
  assert.equal(t.nodes.b.status, "running", "先到的 status 不被 spawn 退回 queued");
  assert.equal(t.nodes.b.startedAt, 2);
  assert.equal(t.nodes.b.placeholder, undefined);
  assert.equal(t.nodes.a.status, "queued");
  assert.equal(t.nodes.b1.kind, "command");
  assert.deepEqual(agents.flattenAgentTree(t).map((x) => `${x.node.id}:${x.depth}`), ["lead:0", "a:1", "b:1", "b1:2"]);
  assert.deepEqual(agents.descendantsOf(t, "lead").map((n) => n.id), ["a", "b", "b1"]);
  const msgs = s.messages;
  const aBefore = t.nodes.a;
  s = reduceAgentEvents(s, [
    { type: "agent-status", agentId: "b", status: "awaiting-approval", summary: "rm -rf dist", at: 5 },
    { type: "agent-status", agentId: "lead", status: "running", summary: "等实现", waitingOn: ["b", "a"], at: 5 },
    { type: "agent-handoff", from: "a", to: "b", note: "调用点清单", at: 6 },
    { type: "agent-status", agentId: "a", status: "done", at: 6 },
    { type: "agent-message", from: "a", to: "lead", text: "共 12 处", kind: "result", at: 6 },
  ]);
  assert.equal(s.messages, msgs, "树事件不动消息");
  const u = s.agents;
  assert.notEqual(u.nodes.a, aBefore);
  assert.equal(u.nodes.a.endedAt, 6);
  assert.deepEqual(u.links.map((l) => `${l.kind}:${l.from}>${l.to}`), ["handoff:a>b", "result:a>lead"]);
  assert.deepEqual(agents.linksOf(u, "lead").received.map((l) => l.text), ["共 12 处"]);
  assert.deepEqual(agents.linksOf(u, "a").sent.length, 2);
  const c = agents.countAgents(u);
  assert.deepEqual([c.total, c.running, c.waiting, c.done, c.queued], [4, 1, 1, 1, 1]);
  assert.equal(agents.countAgents(u, u.nodes.lead.children).done, 1, "按父统计");
  // a 已完成, lead 只剩在等 b; b 在等用户
  assert.deepEqual(agents.agentWaits(u), [{ from: "lead", to: "b", reason: "dependency" }, { from: "b", to: null, reason: "awaiting-approval" }]);
  assert.deepEqual(agents.pendingAgents(u).map((n) => n.id), ["b"]);
  const seg = agents.agentSegments(u.nodes.b, 10);
  assert.deepEqual(seg.map((x) => `${x.kind}:${x.start}-${x.end}`), ["run:2-5", "wait:5-10"]);
  assert.deepEqual(agents.agentSegments(u.nodes.lead, 10).map((x) => x.kind), ["run", "wait"], "带 waitingOn 的 running 算等待段");
  assert.deepEqual(agents.agentSpan(u.nodes.a, 99), { start: 6, end: 6 }, "没跑过就结束: 起点是结束时刻");
  assert.deepEqual(agents.agentSpan(u.nodes.b, 99), { start: 2, end: 99 }, "没结束的用 now");
  // 占位: 只在消息里出现过的 Agent
  const p = reduceAgentEvents(emptyAgentState(), [{ type: "agent-message", from: "x", to: "y", text: "hi", at: 1 }]).agents;
  assert.ok(p.nodes.x.placeholder && p.nodes.y.placeholder);
});

await check("多 Agent: 消息 / part 带 agentId, tool-child 嵌的 spawn 归到 task 调用, 工具段与最新输出", () => {
  const s = reduceAgentEvents(emptyAgentState(), [
    { type: "message-start", messageId: "m1", agentId: "lead", at: 1 },
    { type: "tool-start", messageId: "m1", callId: "task1", name: "task", at: 2 },
    { type: "tool-child", messageId: "m1", callId: "task1", event: { type: "agent-spawn", agentId: "w", parentAgentId: "lead", name: "worker", status: "running", at: 2 } },
    { type: "tool-child", messageId: "m1", callId: "task1", event: { type: "tool-start", messageId: "-", callId: "c1", name: "bash", at: 3 } },
    { type: "tool-child", messageId: "m1", callId: "task1", event: { type: "tool-result", messageId: "-", callId: "c1", at: 4 } },
    { type: "tool-child", messageId: "m1", callId: "task1", event: { type: "text-delta", messageId: "-", partId: "t", delta: "全部   通过" } },
    { type: "text-delta", messageId: "m1", partId: "x", delta: "另一个 Agent 写的", agentId: "z" },
  ]);
  assert.equal(s.messages[0].agentId, "lead");
  assert.equal(s.agents.nodes.w.callId, "task1", "spawn 记上派它的调用");
  assert.equal(s.agents.nodes.w.messageId, "m1");
  const task = s.messages[0].parts[0];
  assert.ok(task.type === "tool" && task.call.children?.length === 2, "agent-* 事件不进 children");
  assert.equal(s.messages[0].parts[1].agentId, "z");
  assert.deepEqual(agents.partsOfAgent(s.messages, s.agents, "w").map((p) => p.id), ["c1", "t"]);
  assert.deepEqual(agents.partsOfAgent(s.messages, s.agents, "lead").map((p) => p.id), ["task1"]);
  assert.deepEqual(agents.toolSpansOfAgent(s.messages, s.agents, "w", 9).map((x) => `${x.name}:${x.start}-${x.end}`), ["bash:3-4"]);
  assert.equal(agents.latestOutput(s.messages, s.agents, "w"), "全部 通过");
  assert.equal(agents.latestOutput(s.messages, s.agents, "w", 2), "…通过");
});

await check("AI SDK 适配: metadata.agentId, data-agent-* 数据 part, task 工具当作派发", () => {
  const msgs = [
    { id: "m1", role: "assistant" as const, metadata: { agentId: "lead" }, parts: [
      { type: "data-agent-spawn", data: { agentId: "lead", name: "编排者", status: "running" } },
      { type: "tool-task", toolCallId: "t1", state: "output-available", input: { subagent_type: "reviewer", prompt: "审查 diff", model: "sonnet" }, output: "LGTM" },
      { type: "tool-task", toolCallId: "t2", state: "approval-requested", input: { description: "删构建目录" } },
      { type: "data-agent-handoff", data: { from: "t1", to: "t2", note: "交给你" } },
      { type: "data-unrelated", data: { x: 1 } },
    ] },
  ];
  assert.equal(fromAiSdkMessages(msgs)[0].agentId, "lead");
  const tree = agentEventsFromAiSdk(msgs, { at: 5 }).reduce(agents.reduceAgentTree, agents.emptyAgentTree());
  assert.deepEqual(agents.childrenOf(tree, "lead").map((n) => `${n.id}:${n.name}:${n.status}`), ["t1:reviewer:done", "t2:删构建目录:awaiting-approval"]);
  assert.equal(tree.nodes.t1.model, "sonnet");
  assert.equal(tree.nodes.t1.task, "审查 diff");
  assert.deepEqual(tree.links.map((l) => `${l.kind}:${l.from}>${l.to}:${l.text}`), ["result:t1>lead:LGTM", "handoff:t1>t2:交给你"]);
});

await check("编排视图几何: 分层布局父居中, 派发 / 交接边, 光点路线, 时间刻度", () => {
  const tree = [
    { type: "agent-spawn", agentId: "l", name: "lead", at: 0 },
    { type: "agent-spawn", agentId: "a", parentAgentId: "l", at: 0 },
    { type: "agent-spawn", agentId: "b", parentAgentId: "l", at: 0 },
    { type: "agent-spawn", agentId: "c", parentAgentId: "l", at: 0 },
    { type: "agent-handoff", from: "a", to: "b", at: 1 },
  ].reduce((t, e) => agents.reduceAgentTree(t, e as never), agents.emptyAgentTree());
  const g = orchestraLayout.layoutAgentGraph(tree, { nodeW: 100, nodeH: 40, colGap: 50, rowGap: 10, pad: 0 });
  assert.deepEqual(["l", "a", "b", "c"].map((id) => [g.boxes.get(id)?.x, g.boxes.get(id)?.y]), [[0, 50], [150, 0], [150, 50], [150, 100]]);
  assert.deepEqual(g.edges.map((e) => e.id), ["spawn:l>a", "spawn:l>b", "spawn:l>c", "handoff:a>b"]);
  const back = orchestraLayout.linkRoute(g, { from: "a", to: "l" });
  assert.deepEqual(back?.[3], { x: 100, y: 70 }, "回传沿派发边反向");
  const pts = orchestraLayout.sampleCubic(g.edges[0].curve, 4);
  assert.deepEqual([pts[0], pts[4]], [{ x: 100, y: 70 }, { x: 150, y: 20 }]);
  assert.deepEqual(orchestraLayout.timeTicks(60_000, 6), [0, 10_000, 20_000, 30_000, 40_000, 50_000, 60_000]);
  assert.deepEqual([0, 15_000, 90_000, 3_725_000].map(orchestraLayout.formatOffset), ["0s", "15s", "1:30", "1:02:05"]);
  assert.equal(orchestraLayout.clip("编排者派出子 Agent", 8), "编排者…");
});

await check("实时用量: 估算转精确, 滑动窗口速率, 首 token / 吞吐, 命中率与上下文, 百分比不虚报 100%", () => {
  assert.equal(usage.estimateTokens("你好abcd"), 3);
  let m = usage.bumpMeter(undefined, 1000, 5, false);
  m = usage.bumpMeter(m, 1100, 5, false);
  assert.equal(m.streamedTokens, 10);
  assert.equal(m.exact, false);
  m = usage.bumpMeter(m, 1200, 7, true);
  assert.deepEqual([m.streamedTokens, m.exact, m.samples.length, m.firstTokenAt], [7, true, 1, 1000], "第一条精确计数丢掉估算, 首 token 时刻保留");
  m = usage.bumpMeter(m, 1300, 99, false);
  assert.equal(m.streamedTokens, 7, "精确之后的估算只更新时刻");
  assert.equal(m.lastTokenAt, 1300);
  // 2 秒窗口: 1.0s 内 100 个 -> 100 tok/s (分母取首 token 以来的时长)
  const r = { samples: [{ at: 10_000, tokens: 50 }, { at: 10_500, tokens: 50 }], streamedTokens: 100, exact: true, firstTokenAt: 9_500 };
  assert.equal(Math.round(usage.tokenRate(r, 10_500)), 100);
  assert.equal(usage.tokenRate(r, 13_000), 0, "窗口里没有采样 (在等工具) 时为 0");
  const t = usage.messageTiming({ startedAt: 0, usage: { outputTokens: 300 }, meter: { firstTokenAt: 800, lastTokenAt: 3800, samples: [], streamedTokens: 290, exact: true } });
  assert.deepEqual(t, { ttftMs: 800, decodeMs: 3000, outputTokens: 300, tokensPerSecond: 100 });
  assert.equal(usage.cacheHitRate({ inputTokens: 200, cachedInputTokens: 150 }), 0.75);
  assert.equal(usage.cacheHitRate({ outputTokens: 1 }), null);
  assert.equal(usage.contextRatio({ contextTokens: 50_000, contextWindow: 200_000 }), 0.25);
  assert.equal(usage.formatPercent(0.9996), "99");
  assert.equal(usage.formatPercent(1), "100");
  assert.equal(usage.formatRate(8.34), "8.3");
  assert.equal(usage.formatRate(42.6), "43");
});

await check("实时用量: reducer 记首 token / usage-delta 累加; 会话汇总并行速率, 上下文只看主线程, 本轮起止", () => {
  let s = reduceAgentEvents(emptyAgentState(), [
    { type: "user-message", messageId: "u", text: "hi", at: 0 },
    { type: "message-start", messageId: "a", agentId: "lead", at: 100 },
    { type: "usage", messageId: "a", usage: { inputTokens: 1000, cachedInputTokens: 600, contextTokens: 1000, contextWindow: 10_000, cost: 0.01 } },
    { type: "text-delta", messageId: "a", partId: "t", delta: "abcdefgh", at: 400 },
    { type: "usage-delta", messageId: "a", outputTokens: 20, at: 500 },
    { type: "usage-delta", messageId: "a", outputTokens: 20, at: 900 },
    { type: "message-start", messageId: "b", agentId: "w", at: 200 },
    { type: "usage", messageId: "b", usage: { inputTokens: 500, cachedInputTokens: 0, contextTokens: 9_000 } },
    { type: "usage-delta", messageId: "b", outputTokens: 30, at: 800 },
  ] as AgentEvent[]);
  const a = s.messages[1];
  assert.equal(a.meter?.firstTokenAt, 400, "第一段文字的时刻是首 token");
  assert.equal(a.usage?.outputTokens, 40, "精确计数从第一条 usage-delta 起算, 估算不重复计");
  assert.equal(usage.messageTiming(a).ttftMs, 300);
  s = reduceAgentEvents(s, [{ type: "agent-spawn", agentId: "lead", at: 0 }, { type: "agent-spawn", agentId: "w", parentAgentId: "lead", at: 0 }] as AgentEvent[]);
  const sess = usage.sessionUsage(s.messages, 1000, { isMain: (m) => !agents.isSubAgent(s.agents, m.agentId) });
  assert.equal(sess.streams, 2);
  assert.ok(sess.tokensPerSecond > 0);
  assert.equal(sess.inputTokens, 1500);
  assert.equal(sess.cacheHitRate, 0.4);
  assert.equal(sess.contextTokens, 1000, "子 Agent 的上下文不算主线程");
  assert.equal(sess.contextRatio, 0.1);
  assert.deepEqual([sess.turn.startedAt, sess.turn.endedAt, sess.turn.live, sess.live], [100, undefined, true, true]);
  s = reduceAgentEvents(s, [{ type: "message-end", messageId: "a", at: 2000, usage: { outputTokens: 44 } }, { type: "message-end", messageId: "b", at: 2500 }] as AgentEvent[]);
  const done = usage.sessionUsage(s.messages, 9999);
  assert.deepEqual([done.tokensPerSecond, done.live, done.turn.endedAt, done.outputTokens], [0, false, 2500, 74]);
});

await check("会话编排块: 消息派出的 Agent, 只画这一支的范围, 主线程消息, 子 Agent 请求上浮", () => {
  const s = reduceAgentEvents(emptyAgentState(), [
    { type: "agent-spawn", agentId: "lead", name: "编排者", status: "running", at: 0 },
    { type: "message-start", messageId: "m", agentId: "lead", at: 0 },
    { type: "tool-start", messageId: "m", callId: "t1", name: "task", at: 1 },
    { type: "tool-child", messageId: "m", callId: "t1", event: { type: "agent-spawn", agentId: "a", parentAgentId: "lead", name: "实现", status: "running", at: 1 } },
    { type: "tool-start", messageId: "m", callId: "t2", name: "task", at: 1 },
    { type: "tool-child", messageId: "m", callId: "t2", event: { type: "agent-spawn", agentId: "b", parentAgentId: "lead", name: "测试", at: 1 } },
    { type: "agent-spawn", agentId: "b1", parentAgentId: "b", kind: "command", at: 2 },
    // 同一个编排者在别的消息里派的
    { type: "agent-spawn", agentId: "z", parentAgentId: "lead", messageId: "other", at: 3 },
    { type: "message-start", messageId: "ma", agentId: "a", at: 2 },
    { type: "tool-start", messageId: "ma", callId: "w", name: "edit", agentId: "a", at: 3 },
    { type: "tool-status", messageId: "ma", callId: "w", status: "awaiting-approval", at: 4 },
    { type: "agent-status", agentId: "a", status: "awaiting-approval", summary: "写 3 个文件", at: 4 },
    { type: "agent-handoff", from: "a", to: "z", at: 5 },
    { type: "agent-message", from: "a", to: "b", text: "接口改了", at: 5 },
  ] as AgentEvent[]);
  const t = s.agents;
  assert.deepEqual(agents.dispatchedAgents(t, "m", ["t1", "t2"]).map((n) => n.id), ["a", "b"]);
  assert.deepEqual(agents.dispatchedAgents(t, "other").map((n) => n.id), ["z"]);
  const scope = agents.orchestraScope(t, ["a", "b"], "lead");
  assert.deepEqual(scope.order, ["lead", "a", "b", "b1"], "带上编排者与后代, 不带别的消息派的 z");
  assert.deepEqual(scope.nodes.lead.children, ["a", "b"]);
  assert.equal(scope.nodes.a.parentId, "lead");
  assert.deepEqual(scope.links.map((l) => l.kind), ["message"], "连到范围外的交接去掉");
  assert.deepEqual(agents.pickSubtree(t, ["b"]).order, ["b", "b1"]);
  assert.equal(agents.pickSubtree(t, ["b"]).nodes.b.parentId, undefined);
  assert.deepEqual(agents.threadMessages(s.messages, t).map((m) => m.id), ["m"], "子 Agent 自己的消息不进主线程");
  const req = agents.pendingRequests(s.messages, t, ["a", "b"]);
  assert.deepEqual(req.map((r) => `${r.agent.id}:${r.call?.id}`), ["a:w"]);
  assert.equal(agents.isSubAgent(t, "lead"), false);
  assert.equal(agents.isSubAgent(t, "b1"), true);
});

await check("轨迹账本: 按轮分组, 子 Agent 挂在派发调用下, 嵌套调用为子行, 进行中不给时长", () => {
  const s = reduceAgentEvents(emptyAgentState(), [
    { type: "user-message", messageId: "u1", text: "**改** debounce", at: 0 },
    { type: "message-start", messageId: "m", agentId: "lead", model: "opus", at: 10 },
    { type: "reasoning-delta", messageId: "m", partId: "r", delta: "想一想", at: 20 },
    { type: "reasoning-end", messageId: "m", partId: "r", at: 30 },
    { type: "tool-start", messageId: "m", callId: "t1", name: "task", at: 40 },
    { type: "tool-args", messageId: "m", callId: "t1", args: { description: "找调用点" } },
    { type: "tool-child", messageId: "m", callId: "t1", event: { type: "agent-spawn", agentId: "a", parentAgentId: "lead", name: "探索", status: "running", at: 40 } },
    { type: "message-start", messageId: "ma", agentId: "a", at: 41 },
    { type: "tool-start", messageId: "ma", callId: "g", name: "grep", agentId: "a", at: 42 },
    { type: "tool-args", messageId: "ma", callId: "g", args: { pattern: "debounce(" } },
    { type: "tool-start", messageId: "m", callId: "b", name: "bash", at: 50 },
    { type: "tool-args", messageId: "m", callId: "b", args: { command: "npm test" } },
    { type: "tool-child", messageId: "m", callId: "b", event: { type: "tool-start", messageId: "-", callId: "b1", name: "read", at: 51 } },
    { type: "tool-result", messageId: "m", callId: "b", at: 60 },
    { type: "text-delta", messageId: "m", partId: "x", delta: "**完成**, 改了 `a.ts`", at: 70 },
    { type: "user-message", messageId: "u2", text: "谢谢", at: 100 },
  ] as AgentEvent[]);
  const turns = trajectory.buildTrajectory(s.messages, s.agents, 200);
  assert.equal(turns.length, 2);
  const rows = turns[0].rows;
  assert.deepEqual(rows.map((r) => r.kind), ["user", "assistant", "reasoning", "tool", "tool", "text"]);
  assert.equal(rows[0].text, "改 debounce", "去掉 Markdown 记号");
  assert.equal(rows[5].text, "完成, 改了 a.ts");
  const task = rows[3];
  assert.equal(task.text, "找调用点");
  assert.deepEqual(task.children?.map((r) => `${r.kind}:${r.label}`), ["agent:探索"]);
  assert.deepEqual(task.children?.[0].children?.map((r) => `${r.kind}:${r.label}:${r.text}`), ["subtool:grep:debounce("]);
  assert.equal(task.children?.[0].live, true);
  assert.equal(task.children?.[0].end, undefined, "进行中的子 Agent 不给结束时刻");
  assert.deepEqual(rows[4].children?.map((r) => r.kind), ["subtool"]);
  assert.deepEqual([rows[4].start, rows[4].end, rows[4].live], [50, 60, false]);
  assert.equal(turns[0].live, true);
  assert.equal(trajectory.flattenRows(rows).length, 9);
});

await check("计划: todo_write 嵌套快照, 大项状态由子项推出, 进度只数叶子, 参数流式时实时更新", () => {
  const call = (id: string, args: Record<string, unknown>, status: "success" | "preparing" | "error" = "success") => ({ type: "tool" as const, id, call: { id, name: "todo_write", status, args } });
  const s1 = call("t1", { todos: [{ content: "探索", status: "completed", children: [{ content: "grep", status: "completed" }] }, { content: "实现", status: "pending", subtasks: [{ content: "改函数", status: "in_progress" }, { content: "改调用点", status: "pending" }] }, { content: "审查", status: "pending" }] });
  const plan = todos.planFromParts([s1]);
  assert.equal(plan.items.length, 3);
  assert.equal(plan.items[1].children.length, 2, "subtasks 是子项");
  assert.equal(plan.items[1].children[0].id, "实现/改函数", "没有 id 时按路径生成");
  assert.equal(todos.planStatus(plan.items[1]), "in_progress", "有子项开始了, 大项就在进行中");
  assert.equal(todos.planStatus(plan.items[0]), "completed");
  const pr = todos.planProgress(plan.items);
  assert.deepEqual([pr.closed, pr.total], [1, 4], "只数叶子");
  assert.equal(pr.current?.content, "改函数");
  assert.deepEqual(pr.currentPath, ["实现", "实现/改函数"]);
  // 第二次快照: 完成一项, 新增一项, 删掉一项
  const s2 = call("t2", { todos: [{ content: "探索", status: "completed", children: [{ content: "grep", status: "completed" }] }, { content: "实现", children: [{ content: "改函数", status: "completed" }, { content: "改调用点", status: "in_progress" }, { content: "写 README", status: "pending" }] }] });
  const p2 = todos.planFromParts([s1, s2]);
  const step = p2.steps[1];
  assert.deepEqual(step.completed, ["实现/改函数"]);
  assert.deepEqual(step.added, ["实现/写 README"]);
  assert.deepEqual(step.removed, ["审查"]);
  assert.deepEqual(step.started, ["实现/改调用点"]);
  assert.equal(todos.describePlanStep(step), "完成 改函数 · 开始 改调用点 · 新增 1 项 · 移除 1 项");
  assert.equal(p2.callId, "t2");
  // 流式: 参数还在写, 部分解析的快照照用; 失败的调用不算
  const partial = call("t3", { todos: [{ content: "探索", status: "completed" }, { content: "实" }] }, "preparing");
  const p3 = todos.planFromParts([s1, partial]);
  assert.equal(p3.steps[1].live, true);
  assert.deepEqual(p3.items.map((i) => i.content), ["探索", "实"]);
  assert.equal(todos.planFromParts([s1, call("t4", { todos: [] }, "error")]).callId, "t1");
  // 别的工具名 / 状态写法
  assert.equal(todos.isTodoCall({ name: "TodoWrite" }), true);
  assert.equal(todos.normalizePlanStatus("abandoned"), "cancelled");
  assert.equal(todos.normalizePlanStatus("in-progress"), "in_progress");
});

await check("计划: OMP 的 todo 操作 (init 分阶段 / start / done / drop / append / rm), 结果里的 phases 为准", () => {
  let n = 0;
  const op = (args: Record<string, unknown>, result?: unknown) => ({ type: "tool" as const, id: `o${++n}`, call: { id: `o${n}`, name: "todo", status: "success" as const, args, result } });
  const init = op({ op: "init", list: [{ phase: "调研", items: ["读代码", "列调用点"] }, { phase: "实现", items: ["改函数"] }] });
  const steps = [init, op({ op: "start", task: "读代码" }), op({ op: "done", task: "读代码" })];
  let p = todos.planFromParts(steps);
  assert.deepEqual(p.items.map((i) => i.content), ["调研", "实现"]);
  assert.equal(p.items[0].children[0].status, "completed");
  assert.equal(p.items[0].children[1].status, "in_progress", "done 之后第一个待办自动进行中 (OMP normalize)");
  p = todos.planFromParts([...steps, op({ op: "append", items: ["补测试"] })]);
  assert.deepEqual(p.items[0].children.map((c) => c.content), ["读代码", "列调用点", "补测试"], "没点名阶段时加到当前阶段");
  assert.deepEqual(p.steps.at(-1)?.added, ["调研/补测试"]);
  p = todos.planFromParts([...steps, op({ op: "append", phase: "收尾", items: ["写 README"] }), op({ op: "drop", task: "列调用点" }), op({ op: "rm", phase: "实现" })]);
  assert.deepEqual(p.items.map((i) => i.content), ["调研", "收尾"]);
  assert.equal(p.items[0].children[1].status, "cancelled");
  assert.equal(todos.planProgress(p.items).current?.content, "写 README");
  assert.equal(todos.planFromParts([...steps, op({ op: "view" })]).steps.length, 3, "view 不算更新");
  // 结果里的 phases 是权威快照
  const r = todos.planFromParts([op({ op: "done", task: "x" }, { details: { phases: [{ name: "A", tasks: [{ content: "a1", status: "completed" }] }] } })]);
  assert.equal(r.items[0].children[0].status, "completed");
  // 子 Agent 的待办归它自己, 主线程不混进来
  const s = reduceAgentEvents(emptyAgentState(), [
    { type: "agent-spawn", agentId: "lead", status: "running" },
    { type: "agent-spawn", agentId: "a", parentAgentId: "lead", status: "running" },
    { type: "tool-start", messageId: "m", callId: "t1", name: "todo_write", agentId: "lead" },
    { type: "tool-args", messageId: "m", callId: "t1", args: { todos: [{ content: "主", status: "pending" }] } },
    { type: "tool-start", messageId: "ma", callId: "t2", name: "todo_write", agentId: "a" },
    { type: "tool-args", messageId: "ma", callId: "t2", args: { todos: [{ content: "子", status: "pending" }] } },
  ] as AgentEvent[]);
  s.messages[1].agentId = "a";
  assert.deepEqual(todos.planOf(s.messages, s.agents).items.map((i) => i.content), ["主"]);
  assert.deepEqual(todos.planOf(s.messages, s.agents, "a").items.map((i) => i.content), ["子"]);
});

await check("按 Agent 区分速率: 各自的消息 / 嵌在派发调用里的子 Agent 各算各的, 主 Agent 不吃子 Agent 的 token", () => {
  const ev: AgentEvent[] = [
    { type: "agent-spawn", agentId: "lead", status: "running", at: 0 },
    { type: "message-start", messageId: "m", agentId: "lead", at: 0 },
    { type: "tool-start", messageId: "m", callId: "task", name: "task", at: 10 },
    { type: "tool-child", messageId: "m", callId: "task", event: { type: "agent-spawn", agentId: "a", parentAgentId: "lead", status: "running", at: 10 } },
    { type: "agent-spawn", agentId: "b", parentAgentId: "lead", status: "running", at: 10 },
    { type: "message-start", messageId: "mb", agentId: "b", at: 10 },
  ];
  for (let i = 0; i < 10; i++) {
    const at = 1000 + i * 100;
    ev.push({ type: "usage-delta", messageId: "m", outputTokens: 2, at });
    ev.push({ type: "tool-child", messageId: "m", callId: "task", event: { type: "usage-delta", messageId: "-", outputTokens: 5, at } });
    ev.push({ type: "usage-delta", messageId: "mb", outputTokens: 10, at });
  }
  const s = reduceAgentEvents(emptyAgentState(), ev);
  const rates = usage.agentTokenRates(s.messages, s.agents, 1950);
  const lead = rates.get("lead") ?? 0;
  const a = rates.get("a") ?? 0;
  const b = rates.get("b") ?? 0;
  assert.ok(lead > 15 && lead < 25, `主 Agent 约 20 tok/s, 实际 ${lead}`);
  assert.ok(a > 40 && a < 60, `嵌在调用里的子 Agent a 约 50 tok/s, 实际 ${a}`);
  assert.ok(b > 80 && b < 120, `子 Agent b 约 100 tok/s, 实际 ${b}`);
  assert.equal(s.messages[0].meter?.streamedTokens, 20, "子 Agent 的 token 不进父消息的计量");
  assert.equal(Math.round(usage.sumRates(rates, ["a", "b"])), Math.round(a + b));
  // 会话总速率把三者都算上
  const total = usage.sessionUsage(s.messages, 1950).tokensPerSecond;
  assert.ok(Math.abs(total - (lead + a + b)) < 0.01);
  // usage-delta 直接带 callId 也记到调用上
  const s2 = reduceAgentEvents(s, [{ type: "usage-delta", messageId: "m", callId: "task", outputTokens: 7, at: 2000 }]);
  const call = s2.messages[0].parts.find((p) => p.type === "tool");
  assert.equal(call?.type === "tool" ? call.call.meter?.streamedTokens : 0, 57);
  // 消息结束后速率归零
  const s3 = reduceAgentEvents(s2, [{ type: "message-end", messageId: "mb", at: 2000 }]);
  assert.equal(usage.agentTokenRates(s3.messages, s3.agents, 2000).get("b"), undefined);
});

await check("模型选择: 强度按档位排序, 换模型吸附到最近一档, 无效选择规整, 搜索", () => {
  const clients = [
    { id: "codex", name: "Codex", models: [{ id: "gpt-5", efforts: ["high", "low", "medium", "minimal"] as const, defaultEffort: "medium" as const }, { id: "mini" }] },
    { id: "claude", name: "Claude Code", models: [{ id: "opus", name: "Opus", description: "最强推理", efforts: ["off", "low", "medium", "high", "max"] as const }] },
    { id: "off", name: "OpenCode", unavailable: "未安装", models: [{ id: "x" }] },
  ];
  assert.deepEqual(models.effortsOf(clients[0].models[0]), ["minimal", "low", "medium", "high"]);
  assert.equal(models.nearestEffort(["low", "high"], "medium"), "low", "同样近取较低");
  assert.equal(models.nearestEffort(["off", "low", "medium", "high", "max"], "xhigh"), "high");
  assert.equal(models.nearestEffort([], "high"), undefined);
  assert.deepEqual(models.resolveModelSelection(clients, { client: "claude", model: "opus", effort: "minimal" }), { client: "claude", model: "opus", effort: "low" });
  assert.deepEqual(models.resolveModelSelection(clients, { client: "codex", model: "gpt-5" }), { client: "codex", model: "gpt-5", effort: "medium" });
  assert.deepEqual(models.resolveModelSelection(clients, { client: "codex", model: "mini", effort: "high" }), { client: "codex", model: "mini" }, "不支持强度的模型没有 effort");
  assert.equal(models.resolveModelSelection(clients, { client: "off" })?.client, "codex", "不可用的客户端换成第一个可用的");
  assert.deepEqual(models.searchModels(clients, "推理").map((g) => g.client.id), ["claude"]);
  assert.equal(models.searchModels(clients, "").length, 3);
});

await check("推理强度: Alt+, / Alt+. 只走模型声明的档位, 到头返回 undefined, 当前值不在档位里先吸附", () => {
  const lv = ["off", "low", "medium", "high", "max"] as const;
  assert.equal(models.stepEffort(lv, "medium", 1), "high");
  assert.equal(models.stepEffort(lv, "medium", -1), "low");
  assert.equal(models.stepEffort(lv, "max", 1), undefined, "最高再升没有");
  assert.equal(models.stepEffort(lv, "off", -1), undefined, "最低再降没有");
  assert.equal(models.stepEffort(["low", "high"], "medium", 1), "high", "medium 先吸附到 low (同样近取较低) 再升");
  assert.equal(models.stepEffort(["low", "high"], "xhigh", -1), "low", "xhigh 先吸附到 high 再降");
  assert.equal(models.stepEffort([], "high", 1), undefined);
});

await check("渐变档位条: 点 / 拖吸附到最近一档, 两端留滑块半径, 键盘 (方向 / PageUp / Home / End), 强度随档位单调升高", () => {
  // 宽 300, 两端各留 13 (滑块半径), 4 档: 刻度在 13, 104.33, 195.67, 287
  assert.equal(models.effortIndexAt(13, 300, 13, 4), 0);
  assert.equal(models.effortIndexAt(-40, 300, 13, 4), 0, "越界夹到最低");
  assert.equal(models.effortIndexAt(58, 300, 13, 4), 0, "离第 0 档近");
  assert.equal(models.effortIndexAt(60, 300, 13, 4), 1, "过了两档中点吸到第 1 档");
  assert.equal(models.effortIndexAt(200, 300, 13, 4), 2);
  assert.equal(models.effortIndexAt(999, 300, 13, 4), 3, "越界夹到最高");
  assert.equal(models.effortIndexAt(150, 300, 13, 1), 0, "只有一档");
  assert.equal(models.effortFractionAt(13, 300, 13), 0);
  assert.equal(models.effortFractionAt(150, 300, 13), (150 - 13) / 274, "拖动时滑块跟手 (连续进度)");
  assert.equal(models.effortFractionAt(400, 300, 13), 1);
  const lv = ["low", "medium", "high", "max"] as const;
  assert.equal(models.effortKey(lv, "medium", "ArrowRight"), "high");
  assert.equal(models.effortKey(lv, "medium", "ArrowUp"), "high");
  assert.equal(models.effortKey(lv, "medium", "PageDown"), "low");
  assert.equal(models.effortKey(lv, "medium", "ArrowLeft"), "low");
  assert.equal(models.effortKey(lv, "medium", "Home"), "low");
  assert.equal(models.effortKey(lv, "low", "End"), "max");
  assert.equal(models.effortKey(lv, "max", "ArrowRight"), undefined, "到头不动");
  assert.equal(models.effortKey(lv, "max", "End"), undefined, "已经在最高");
  assert.equal(models.effortKey(lv, "medium", "a"), undefined, "不认识的键");
  assert.equal(models.effortKey(["off", "low", "high"], "xhigh", "ArrowLeft"), "low", "当前值不在档位里先吸附到 high 再降");
  assert.equal(models.effortKey(["off", "low", "high"], undefined, "ArrowRight"), "high", "没选时从中间一档起");
  const levels = [0, 1, 2, 3].map((i) => models.effortIntensity(i, 4));
  for (let i = 1; i < levels.length; i++) {
    assert.ok(levels[i].saturate > levels[i - 1].saturate, "越高越鲜艳");
    assert.ok(levels[i].brightness > levels[i - 1].brightness, "越高越亮");
    assert.ok(levels[i].opacity >= levels[i - 1].opacity);
    assert.ok(levels[i].sheenMs < levels[i - 1].sheenMs, "越高流光越快");
  }
  assert.deepEqual([levels[0].t, levels[3].t], [0, 1]);
  assert.equal(models.effortIntensity(0, 1).t, 1, "只有一档按最高算");
});

await check("缓存命中率: scope=request 的 usage 累加成累计值, 运行中不随单次请求跳; 本次请求单独记; message-end 的累计为准", () => {
  const W = 200_000;
  let s = reduceAgentEvents(emptyAgentState(), [
    { type: "message-start", messageId: "m", at: 0 },
    { type: "usage", messageId: "m", scope: "request", usage: { inputTokens: 100_000, cachedInputTokens: 90_000, contextTokens: 100_000, contextWindow: W, cost: 0.01 }, at: 10 },
  ]);
  let m = s.messages[0];
  assert.deepEqual([m.usage?.inputTokens, m.usage?.cachedInputTokens, m.requests], [100_000, 90_000, 1]);
  const hits: number[] = [];
  // 之后的请求只报上下文与命中 (像 DSH 每一步的快照): 提示侧按 contextTokens 算, 命中被夹在提示侧以内
  const steps: [number, number][] = [[101_000, 100_500], [102_000, 40_000], [103_000, 999_999], [104_000, 103_000]];
  for (const [i, [ctx, cached]] of steps.entries()) {
    s = reduceAgentEvents(s, [{ type: "usage", messageId: "m", scope: "request", usage: { contextTokens: ctx, cachedInputTokens: cached }, at: 20 + i }]);
    hits.push(usage.sessionUsage(s.messages, 30).cacheHitRate!);
  }
  m = s.messages[0];
  assert.equal(m.requests, 5);
  assert.equal(m.usage?.inputTokens, 100_000 + 101_000 + 102_000 + 103_000 + 104_000, "提示侧累加");
  assert.equal(m.request?.cachedInputTokens, 103_000, "本次请求");
  assert.equal(m.request?.inputTokens, 104_000, "本次请求的提示侧取 contextTokens");
  assert.equal(m.usage?.contextTokens, 104_000, "上下文取最近一次");
  assert.equal(m.usage?.cost, 0.01, "只有第一次报了费用");
  // 单次请求的命中在 40% ~ 100% 之间跳 (每步差 0.6), 累计值每步变化小得多
  const single = [100_500 / 101_000, 40_000 / 102_000, 1, 103_000 / 104_000];
  const maxStep = (xs: number[]) => Math.max(...xs.slice(1).map((x, i) => Math.abs(x - xs[i])));
  assert.ok(maxStep(hits) < 0.2 && maxStep(hits) < maxStep(single) / 3, `累计命中率平稳: ${hits.join(", ")}`);
  assert.ok(hits.every((h) => h <= 1));
  const sess = usage.sessionUsage(s.messages, 30);
  assert.equal(sess.requests, 5);
  assert.equal(sess.lastRequest?.cacheHitRate, 103_000 / 104_000, "本次请求的命中率与累计分开");
  assert.notEqual(sess.lastRequest?.cacheHitRate, sess.cacheHitRate);
  // 旧写法 (默认 scope=total) 仍是合并快照
  const old = reduceAgentEvents(emptyAgentState(), [
    { type: "message-start", messageId: "o" },
    { type: "usage", messageId: "o", usage: { inputTokens: 100, cachedInputTokens: 50 } },
    { type: "usage", messageId: "o", usage: { cachedInputTokens: 80 } },
  ]);
  assert.deepEqual([old.messages[0].usage?.inputTokens, old.messages[0].usage?.cachedInputTokens, old.messages[0].request], [100, 80, undefined]);
  // 结束时宿主给的累计为准
  s = reduceAgentEvents(s, [{ type: "message-end", messageId: "m", usage: { inputTokens: 600_000, cachedInputTokens: 540_000, outputTokens: 900 } }]);
  assert.equal(usage.sessionUsage(s.messages, 99).cacheHitRate, 0.9);
  assert.deepEqual(usage.requestUsage({ inputTokens: 10, cachedInputTokens: 30 }), { inputTokens: 10, cachedInputTokens: 10 }, "命中不超过提示侧");
});

await check("planCalls=hidden: 计划的后续更新从对话里滤掉, 每份计划只留第一次列出; 子 Agent 的计划各算各的", () => {
  const call = (id: string, agentId: string | undefined, todos: unknown[]) => ({ type: "tool" as const, id, agentId, call: { id, name: "todo_write", status: "success" as const, args: { todos } } });
  const a = [{ content: "探索", status: "in_progress" }, { content: "实现", status: "pending" }];
  const b = [{ content: "探索", status: "completed" }, { content: "实现", status: "in_progress" }];
  const msgs = [{ id: "m", role: "assistant" as const, parts: [call("p1", undefined, a), call("p2", undefined, b), call("p3", undefined, b), call("w1", "worker", a), call("w2", "worker", b)] }];
  const tree = reduceAgentEvents(emptyAgentState(), [
    { type: "agent-spawn", agentId: "lead", name: "编排者" },
    { type: "agent-spawn", agentId: "worker", parentAgentId: "lead", name: "实现" },
  ]).agents;
  const idx = planIndex.buildPlanIndex(msgs, tree);
  assert.deepEqual(["p1", "p2", "p3", "w1", "w2"].map((id) => planIndex.isRepeatPlanCall(idx, id)), [false, true, true, false, true]);
  assert.equal(planIndex.isRepeatPlanCall(idx, "unknown"), false, "没进索引的不滤");
  assert.equal(planIndex.isRepeatPlanCall(planIndex.EMPTY_PLAN_INDEX, "p2"), false);
});

await check("上下文: context / usage 采样 / 工具结果 tokens / 压缩进 reducer, 构成 = 固定开销 + 历史 + 对话, 报告值大时差额记未细分", () => {
  const ev: AgentEvent[] = [
    { type: "user-message", messageId: "u", text: "改一下 debounce", at: 0 },
    { type: "message-start", messageId: "m", at: 10 },
    { type: "context", messageId: "m", context: { window: 100_000, system: 2_000, tools: 3_000, toolSchemas: [{ id: "bash", label: "bash", tokens: 1_000 }], injected: [{ id: "a", label: "AGENTS.md", tokens: 500, kind: "instructions" }], history: 40_000 } },
    { type: "usage", messageId: "m", usage: { contextTokens: 46_000, cachedInputTokens: 45_000 }, at: 20 },
    { type: "usage", messageId: "m", usage: { contextTokens: 46_000, cachedInputTokens: 45_000 }, at: 25 },
    { type: "text-delta", messageId: "m", partId: "t", delta: "abcdefgh" },
    { type: "tool-start", messageId: "m", callId: "r", name: "read_file", at: 30 },
    { type: "tool-args", messageId: "m", callId: "r", args: { file_path: "src/a.ts" } },
    { type: "tool-result", messageId: "m", callId: "r", result: "x", tokens: 30_000, at: 40 },
    { type: "usage", messageId: "m", usage: { contextTokens: 77_000, cachedInputTokens: 46_000 }, at: 50 },
  ];
  let s = reduceAgentEvents(emptyAgentState(), ev);
  const m = s.messages[1];
  assert.equal(m.contextSamples?.length, 2, "同值采样不重复记");
  const call = m.parts.find((p) => p.type === "tool");
  assert.equal(call?.type === "tool" ? call.call.resultTokens : 0, 30_000);
  let b = ctx.contextBreakdown(s.messages);
  assert.equal(b.byCategory.system, 2_000);
  assert.equal(b.byCategory.tools, 3_000, "列出的工具定义 + 其余");
  assert.ok(b.items.some((it) => it.id === "tools:rest" && it.tokens === 2_000));
  assert.equal(b.byCategory.injected, 500);
  assert.equal(b.byCategory.results, 30_000, "工具结果用报告的 tokens");
  assert.ok(b.byCategory.user > 0 && b.byCategory.assistant > 0);
  assert.equal(b.total, 77_000, "总量取报告值 (比估算大)");
  assert.ok(b.items.some((it) => it.id === "unattributed"), "差额记未细分");
  assert.equal(b.cached, 46_000, "缓存取最近一份采样");
  assert.equal(b.compactAt, 80_000, "压缩线默认窗口 80%");
  assert.equal(b.level, "near", "77k ≥ 80k × 0.9");
  assert.equal(b.items[0].label, "更早的对话", "按大小排");
  // 压缩: 之前的对话收成摘要, 摘要 = 压缩后 - 固定开销
  s = reduceAgentEvents(s, [
    { type: "usage", messageId: "m", usage: { contextTokens: 82_000 }, at: 60 },
    { type: "compaction", messageId: "m", partId: "c", before: 82_000, after: 12_000, at: 70 },
    { type: "text-delta", messageId: "m", partId: "t2", delta: "done" },
  ]);
  const notice = s.messages[1].parts.find((p) => p.type === "notice");
  assert.equal(notice?.type === "notice" ? notice.kind : "", "compaction");
  assert.equal(s.messages[1].usage?.contextTokens, 12_000);
  b = ctx.contextBreakdown(s.messages);
  assert.equal(b.compactions, 1);
  assert.equal(b.byCategory.results, 0, "压缩前的工具结果不在了");
  assert.equal(b.byCategory.user, 0);
  assert.ok(b.items.some((it) => it.label === "压缩摘要" && it.tokens === 12_000 - 5_500));
  assert.equal(b.level, "ok");
  const tl = ctx.contextTimeline(s.messages);
  assert.deepEqual(tl.map((p) => p.tokens), [46_000, 77_000, 82_000, 12_000]);
  assert.equal(tl[3].compacted, true);
  const evs = ctx.contextEvents(s.messages);
  assert.deepEqual(evs.map((e) => e.kind), ["inject", "result", "near", "over", "compaction"]);
  assert.equal(evs[4].delta, -70_000);
});

await check("上下文: 按 Agent 分线程, 子 Agent 只看自己的消息", () => {
  const s = reduceAgentEvents(emptyAgentState(), [
    { type: "agent-spawn", agentId: "lead", name: "lead" },
    { type: "agent-spawn", agentId: "sub", parentAgentId: "lead", name: "sub" },
    { type: "message-start", messageId: "a", agentId: "lead" },
    { type: "usage", messageId: "a", usage: { contextTokens: 9_000, contextWindow: 10_000 } },
    { type: "message-start", messageId: "b", agentId: "sub" },
    { type: "usage", messageId: "b", usage: { contextTokens: 1_000, contextWindow: 10_000 } },
  ]);
  assert.equal(ctx.contextBreakdown(s.messages, { agents: s.agents }).total, 9_000);
  assert.equal(ctx.contextBreakdown(s.messages, { agents: s.agents, agentId: "sub" }).total, 1_000);
  assert.equal(ctx.contextBreakdown(s.messages, { agents: s.agents }).level, "over", "9k ≥ 8k 压缩线");
  assert.equal(ctx.contextBreakdown([], {}).empty, true);
});

await check("上下文演变: 每份采样记部件数, contextSeries 按当时的线程切出构成并锚到报告值, 缓存命中不重算", () => {
  const s = reduceAgentEvents(emptyAgentState(), [
    { type: "message-start", messageId: "m", at: 0 },
    { type: "context", messageId: "m", context: { window: 100_000, system: 2_000, tools: 3_000 } },
    { type: "usage", messageId: "m", usage: { contextTokens: 5_000 }, at: 10 },
    { type: "tool-start", messageId: "m", callId: "r", name: "read_file", at: 20 },
    { type: "tool-args", messageId: "m", callId: "r", args: { file_path: "src/a.ts" } },
    { type: "tool-result", messageId: "m", callId: "r", result: "x", tokens: 8_000, at: 30 },
    { type: "usage", messageId: "m", usage: { contextTokens: 14_000 }, at: 40 },
    { type: "text-delta", messageId: "m", partId: "t", delta: "x".repeat(4_000) },
    { type: "usage", messageId: "m", usage: { contextTokens: 6_000 }, at: 50 },
  ]);
  const m = s.messages[0];
  assert.deepEqual(m.contextSamples?.map((x) => x.parts), [0, 1, 2], "采样时的部件数");
  const cache: import("../src/agent/model/context.ts").ContextSeriesCache = new Map();
  const series = ctx.contextSeries(s.messages, {}, cache);
  assert.equal(series.length, 3);
  assert.equal(series[0].byCategory.results, 0, "第一次请求时还没有工具结果");
  assert.equal(series[0].byCategory.system + series[0].byCategory.tools, 5_000);
  assert.equal(series[1].byCategory.results, 8_000, "第二次请求带上了结果");
  assert.equal(series[1].byCategory.assistant > 0, true, "工具调用参数算助手");
  const sum = (b: Record<string, number>) => Object.values(b).reduce((a, x) => a + x, 0);
  assert.ok(Math.abs(sum(series[2].byCategory) - 6_000) <= 7, "估算比报告大时按比例缩到报告值");
  assert.equal(cache.size, 3);
  const again = ctx.contextSeries(s.messages, {}, cache);
  assert.equal(again[1].byCategory, series[1].byCategory, "缓存命中直接复用");
});

await check("子 Agent 尾部: 最新文字的末尾, 正在跑的工具 (命令 + 输出末尾), 思考, 不停在更早的内容", () => {
  const long = "开头的一大段说明。".repeat(30) + "最新的几个字";
  let s = reduceAgentEvents(emptyAgentState(), [
    { type: "agent-spawn", agentId: "lead", name: "lead" },
    { type: "agent-spawn", agentId: "w", parentAgentId: "lead", name: "worker", task: "干活" },
    { type: "message-start", messageId: "m", agentId: "w" },
    { type: "text-delta", messageId: "m", partId: "t1", delta: long },
  ]);
  let t = agents.agentTail(s.messages, s.agents, "w", 40);
  assert.equal(t?.kind, "text");
  assert.equal(t?.cut, true);
  assert.ok(t?.text.endsWith("最新的几个字"), "保留末尾");
  assert.equal(t?.text.length, 40);
  assert.equal(t?.live, true, "还在流");
  s = reduceAgentEvents(s, [
    { type: "tool-start", messageId: "m", callId: "c", name: "bash" },
    { type: "tool-args", messageId: "m", callId: "c", args: { command: "npm test" } },
    { type: "tool-output-delta", messageId: "m", callId: "c", delta: "line 1\nline 2\n✓ 9 passed" },
  ]);
  t = agents.agentTail(s.messages, s.agents, "w");
  assert.equal(t?.kind, "tool");
  assert.equal(t?.label, "运行 npm test", "正在跑的命令, 不回到更早的文字");
  assert.equal(t?.text, "line 1 line 2 ✓ 9 passed");
  assert.equal(t?.live, true);
  s = reduceAgentEvents(s, [{ type: "reasoning-delta", messageId: "m", partId: "r", delta: "想一想下一步" }]);
  t = agents.agentTail(s.messages, s.agents, "w");
  assert.deepEqual([t?.kind, t?.label, t?.text], ["reasoning", "思考", "想一想下一步"]);
  assert.equal(agents.latestOutput(s.messages, s.agents, "w"), "思考 · 想一想下一步");
  assert.equal(agents.agentTail([], s.agents, "w")?.kind, "summary", "没有输出时用任务");
  assert.equal(agents.toolLine({ name: "todo_write", args: { todos: [] } }), "更新计划");
  assert.equal(agents.toolLine({ name: "read_file", args: { file_path: "src/a.ts" } }), "读取 src/a.ts");
  assert.equal(agents.toolLine({ name: "mystery" }), "mystery");
});

await check("档位样式: 由低到高单调 (色阶 / 柱数 / 字重不降), 常见五档 关闭 / 低 / 中 / 高 / 最高 两两可分, 只有最高带光晕", () => {
  const order = models.EFFORT_ORDER;
  const tones = models.EFFORT_TONE_ORDER;
  let prev = { tone: -1, bars: -1, weight: 0 };
  for (const e of order) {
    const l = models.effortLook(e);
    const cur = { tone: tones.indexOf(l.tone), bars: l.bars, weight: l.weight };
    assert.ok(cur.tone >= 0, `${e} 的色阶在表里`);
    assert.ok(cur.tone >= prev.tone && cur.bars >= prev.bars && cur.weight >= prev.weight, `${e} 不比前一档弱`);
    assert.ok(l.bars >= 0 && l.bars <= models.EFFORT_GLYPH_BARS);
    prev = cur;
  }
  const five = ["off", "low", "medium", "high", "max"] as const;
  const looks = five.map((e) => models.effortLook(e));
  assert.deepEqual(looks.map((l) => l.tone), ["off", "low", "mid", "high", "max"], "五档各占一级色阶");
  for (let i = 1; i < looks.length; i++) assert.ok(looks[i].bars > looks[i - 1].bars, `${five[i]} 柱数严格多于 ${five[i - 1]} (黑白主题靠它分高低)`);
  assert.ok(looks[3].weight > looks[2].weight && looks[4].weight > looks[3].weight, "高 / 最高 字重递增 (ink 里品牌色等于前景色)");
  assert.deepEqual(order.filter((e) => models.effortLook(e).glow), ["max"], "只有最高带光晕");
  assert.equal(models.effortLook("high"), models.effortLook("high"), "按档位本身定, 不随模型变");
});

await check("实时上下文与累计 tokens 分开: 累计只增, 上下文随请求涨 / 压缩回落, 两个标签不同", () => {
  const W = 200_000;
  let s = reduceAgentEvents(emptyAgentState(), [
    { type: "message-start", messageId: "m" },
    { type: "usage", messageId: "m", scope: "request", usage: { inputTokens: 120_000, cachedInputTokens: 100_000, contextTokens: 120_000, contextWindow: W, cost: 0.11 } },
    { type: "usage-delta", messageId: "m", outputTokens: 500 },
  ]);
  let u = usage.sessionUsage(s.messages, Date.now());
  let l = usage.usageLabels(u);
  assert.equal(l.totalTokens, 120_500);
  assert.ok(l.total.startsWith("累计 "), l.total);
  assert.equal(l.context?.label, "上下文 60%");
  assert.equal(l.context?.amount, `${formatTokens(120_000)} / ${formatTokens(W)}`);
  assert.equal(l.context?.left, 80_000);
  assert.notEqual(l.total, l.context?.label);
  // 再发两次请求: 累计把提示侧加起来 (远超窗口), 上下文只取最近一次
  s = reduceAgentEvents(s, [
    { type: "usage", messageId: "m", scope: "request", usage: { contextTokens: 130_000, cachedInputTokens: 120_000, contextWindow: W, cost: 0.08 } },
    { type: "usage", messageId: "m", scope: "request", usage: { contextTokens: 136_000, cachedInputTokens: 129_000, contextWindow: W, cost: 0.07 } },
  ]);
  u = usage.sessionUsage(s.messages, Date.now());
  l = usage.usageLabels(u);
  assert.equal(l.totalTokens, 120_000 + 130_000 + 136_000 + 500, "累计 = 每次请求的提示侧 + 输出");
  assert.ok(l.totalTokens > W, "累计可以远超窗口, 所以不能和上下文混用");
  assert.equal(l.context?.percent, 68);
  assert.equal(Math.round((u.cost ?? 0) * 100) / 100, 0.26, "每次请求带费用, 底栏费用跟着涨");
  // 压缩: 上下文回落, 累计不动
  const before = l.totalTokens;
  s = reduceAgentEvents(s, [{ type: "compaction", messageId: "m", partId: "c", before: 136_000, after: 40_000 }]);
  l = usage.usageLabels(usage.sessionUsage(s.messages, Date.now()));
  assert.equal(l.context?.percent, 20, "压缩后上下文回落");
  assert.equal(l.totalTokens, before, "累计不随压缩变");
  assert.equal(usage.usageLabels({ inputTokens: 10 }).context, undefined, "不知道窗口时没有上下文标签");
});

console.log(`\nagent-check: ${passed} 项通过`);
