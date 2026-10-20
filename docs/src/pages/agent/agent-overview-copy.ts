import type { DiffLine } from "@hx/ui";

export const KIND = {
	user: "user",
	assistant: "assistant",
	tool: "tool",
	confirm: "confirm",
	diff: "diff",
	marker: "marker",
} as const;

export type EventKind = (typeof KIND)[keyof typeof KIND];

export const STATUS = {
	pending: "pending",
	running: "running",
	done: "done",
	approved: "approved",
	rejected: "rejected",
} as const;

export type EventStatus = (typeof STATUS)[keyof typeof STATUS];

export interface EventItem {
	readonly id: string;
	readonly kind: EventKind;
	readonly text?: string;
	readonly status?: EventStatus;
	readonly streaming?: boolean;
}

export const DEMO_PROMPT = "把 tool.ts 的请求超时改成 10 秒, 并补一条重试上限";

export const INTRO_TEXT =
	"这是一个本地模拟的 agent 交互示例. 点击发送后依次展示工具调用, 流式回复, 人工确认与变更预览.";

export const STREAM_TEXT =
	"已定位 src/agent/tool.ts. 超时常量当前是 5000 毫秒, 重试上限是 2 次. 我会把超时改为 10000 毫秒, 并新增 maxRetries = 3. 这次改动会写入文件, 需要你确认.";

export const TOOL_NAME = "read_file";

export const TOOL_ARGS = { path: "src/agent/tool.ts" };

export const TOOL_RESULT = { files: 1, matches: ["TOOL_TIMEOUT_MS", "retryLimit"] };

export const TOOL_DURATION_MS = 820;

export const CONFIRM_DETAIL = "即将写入 src/agent/tool.ts, 共 1 个文件, 2 行新增与 1 行删除.";

export const INDENT = "ml-10";

export const DIFF_LINES: readonly DiffLine[] = [
	{ type: "ctx", text: "@@ -12,6 +12,7 @@" },
	{ type: "del", text: "export const TOOL_TIMEOUT_MS = 5000;" },
	{ type: "add", text: "export const TOOL_TIMEOUT_MS = 10000;" },
	{ type: "ctx", text: "const retryLimit = 2;" },
	{ type: "add", text: "const maxRetries = 3;" },
];

export const INITIAL_EVENTS: readonly EventItem[] = [
	{ id: "intro-marker", kind: KIND.marker, text: "本地模拟, 不发起网络请求" },
	{ id: "intro", kind: KIND.assistant, text: INTRO_TEXT },
];
