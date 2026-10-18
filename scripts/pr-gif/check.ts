/**
 * PR 演示 GIF 检查 (CI 工作流 .github/workflows/pr-gif.yml 调用): 改了前端功能的 PR, 正文必须嵌入 GIF 图片.
 *
 * 输入 (环境变量): PR_BODY 正文, PR_LABELS 标签名 JSON 数组, CHANGED_FILES 换行分隔的改动文件;
 * 没给 CHANGED_FILES 时用 git diff --name-only BASE_SHA...HEAD_SHA 计算 (需要 fetch-depth: 0).
 * 本地自查: CHANGED_FILES="$(git diff --name-only origin/main...HEAD)" PR_BODY="$(cat body.md)" node scripts/pr-gif/check.ts
 */
import { execFileSync } from "node:child_process";
import { GIT_HEAD, LIST_SEPARATOR, NEWLINE, SAMPLE_LIMIT } from "../constants/quality.ts";
import { NO_GIF_LABEL, judge } from "./rule.ts";

/** 改动文件清单: 优先 CHANGED_FILES, 否则 git diff BASE_SHA...HEAD_SHA. */
function changedFiles(): string[] {
	const listed = process.env.CHANGED_FILES;
	if (listed !== undefined) {
		return listed.split(NEWLINE).map((line) => line.trim()).filter(Boolean);
	}
	const base = process.env.BASE_SHA;
	const head = process.env.HEAD_SHA || GIT_HEAD;
	if (!base) {
		console.error("check-pr-gif: 需要 CHANGED_FILES 或 BASE_SHA");
		process.exit(2);
	}
	return execFileSync("git", ["diff", "--name-only", `${base}...${head}`], { encoding: "utf8" })
		.split(NEWLINE)
		.filter(Boolean);
}

function labels(): string[] {
	const raw = process.env.PR_LABELS;
	if (!raw) {
		return [];
	}
	const parsed: unknown = JSON.parse(raw);
	return Array.isArray(parsed) ? parsed.map(String) : [];
}

const verdict = judge(changedFiles(), process.env.PR_BODY ?? "", labels());
console.log(`check-pr-gif: ${verdict.reason}`);
if (verdict.frontend.length > 0) {
	console.log(`  前端改动 ${verdict.frontend.length} 个文件, 例如: ${verdict.frontend.slice(0, SAMPLE_LIMIT).join(LIST_SEPARATOR)}`);
}
for (const url of verdict.gifs) {
	console.log(`  GIF: ${url}`);
}
if (!verdict.ok) {
	console.log("  按 .agents/skills/record-browser-gif/SKILL.md 录制 GIF, 推到 pr-assets 分支并嵌入 PR 正文的 \"演示\" 一节;");
	console.log(`  确实没有可见变化时由维护者加 ${NO_GIF_LABEL} 标签, 并在正文写一节 "## 理由" 或一行 "理由: ..."`);
	process.exit(1);
}
