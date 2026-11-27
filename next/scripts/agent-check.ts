/**
 * Agent 拓展包的逻辑自检.  Run: node scripts/agent-check.ts   (Node 22.18+, 直接跑 TS)
 * 只测纯逻辑 (围栏 meta, 组合代码块切块, 部分 JSON, 事件 reducer, diff, ANSI, 活动摘要 / 分段, AI SDK 适配, 工具数据提取).
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
const { summarizeActivity } = await import("../src/agent/model/summary.ts");
const { segmentParts, activitySpan } = await import("../src/agent/model/group.ts");
const { fromAiSdkMessages } = await import("../src/agent/adapters/ai-sdk.ts");
const { formatDuration, formatBytes } = await import("../src/agent/parts/format.ts");
const data = await import("../src/agent/tool/views/data.ts");
const { shortPath, langOfPath, resultText } = await import("../src/agent/tool/args.ts");

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

await check("活动摘要 / 分段: 最多点名两类, 提问 / 正文断开活动", () => {
  assert.equal(summarizeActivity(["command", "edit", "edit", "read", "search"]), "修改了 2 个文件, 运行了 1 条命令, 还有 2 项");
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

console.log(`\nagent-check: ${passed} 项通过`);
