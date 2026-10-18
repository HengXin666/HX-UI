import { test } from "node:test";
import assert from "node:assert/strict";
import { FENCE_BACKTICKS, FENCE_TILDES, NEWLINE, README_FILE, REASON_HEADING } from "../../constants/quality.ts";
import { NO_GIF_LABEL, exemptionReason, frontendChanges, gifImages, judge } from "../../pr-gif/rule.ts";

/**
 * 一个前端文件加一个非前端文件的改动清单.
 *
 * .agents/notes/implemented/process/2026-10-18-pr-gif-demo.md
 */
const FRONTEND = ["src/primitives/sheet.tsx", README_FILE];
const RAW_GIF = "https://raw.githubusercontent.com/HengXin666/HX-UI/pr-assets/pr-10/demo.gif";

/** 应被识别为前端功能的三类路径. */
const FRONTEND_FILES = ["src/a.tsx", "src/b/c.css", "docs/src/nav.ts"];

/** 四连反引号围栏: 里面的三连反引号不结束代码块. */
const FENCE_LONGER = FENCE_BACKTICKS + "`";

test("前端路径: src 下的 tsx / css 与 docs/src 下的任何文件", () => {
	assert.deepEqual(
		frontendChanges([...FRONTEND_FILES, "src/constants/ui.ts", "docs/vite.config.ts", "scripts/x.ts"]),
		FRONTEND_FILES,
	);
});

test("GIF 图片: markdown 与 img 标签都认, 普通链接与注释里的示例不认", () => {
	const body = [
		`![演示](${RAW_GIF})`,
		`<img alt="x" src="https://example.com/a.GIF?raw=true">`,
		"[只是链接](https://example.com/b.gif)",
		"<!-- ![模板](https://example.com/template.gif) -->",
		"![附件](https://github.com/user-attachments/assets/0123-abcd)",
		"![截图](https://example.com/c.png)",
	].join(NEWLINE);
	assert.deepEqual(gifImages(body), [RAW_GIF, "https://github.com/user-attachments/assets/0123-abcd", "https://example.com/a.GIF?raw=true"]);
});

test("围栏代码块: 反引号与波浪号围栏里的图片示例都不算演示, 围栏外的不受影响", () => {
	const fenced = [
		FENCE_BACKTICKS + "markdown",
		`![示例](${RAW_GIF})`,
		FENCE_BACKTICKS,
		FENCE_TILDES + "md",
		'<img src="https://example.com/fenced.gif">',
		FENCE_TILDES,
		`![真实演示](${RAW_GIF})`,
	].join(NEWLINE);
	assert.deepEqual(gifImages(fenced), [RAW_GIF]);

	const longer = [FENCE_LONGER, `![示例](${RAW_GIF})`, FENCE_BACKTICKS, `![仍在围栏内](${RAW_GIF})`, FENCE_LONGER].join(NEWLINE);
	assert.deepEqual(gifImages(longer), []);

	const unclosed = [FENCE_BACKTICKS, `![示例](${RAW_GIF})`].join(NEWLINE);
	assert.deepEqual(gifImages(unclosed), []);

	const indented = ["   " + FENCE_BACKTICKS, `![示例](${RAW_GIF})`, "   " + FENCE_BACKTICKS].join(NEWLINE);
	assert.deepEqual(gifImages(indented), []);
});

test("豁免理由: 理由小节与行内理由都认, 敷衍说明与代码块里的说明不算", () => {
	const section = ["## 演示", "无图", REASON_HEADING, "只改了类型注释, 页面渲染没有可见变化"].join(NEWLINE);
	assert.equal(exemptionReason(section), "只改了类型注释, 页面渲染没有可见变化");

	const inline = ["改了点内部实现", "理由: 只调整了导出顺序, 文档站行为不变"].join(NEWLINE);
	assert.equal(exemptionReason(inline), "只调整了导出顺序, 文档站行为不变");

	assert.equal(exemptionReason(REASON_HEADING), undefined);
	assert.equal(exemptionReason("理由: 无"), undefined);
	assert.equal(exemptionReason([REASON_HEADING, FENCE_BACKTICKS, "只改了注释", FENCE_BACKTICKS].join(NEWLINE)), undefined);
	assert.equal(exemptionReason("没有理由"), undefined);
});

test("判定: 无前端改动通过, 有前端改动缺 GIF 失败, 有 GIF 或带理由的豁免标签通过", () => {
	assert.equal(judge([README_FILE], "", []).ok, true);
	assert.equal(judge(FRONTEND, "没有图", []).ok, false);
	assert.equal(judge(FRONTEND, `![d](${RAW_GIF})`, []).ok, true);
	assert.equal(judge(FRONTEND, "", [NO_GIF_LABEL]).ok, false);
	assert.equal(judge(FRONTEND, "理由: 只改了内部常量顺序, 没有可见变化", [NO_GIF_LABEL]).ok, true);
	assert.equal(judge(FRONTEND, [REASON_HEADING, "本次只改类型定义, 组件渲染与交互不变"].join(NEWLINE), [NO_GIF_LABEL]).ok, true);
	assert.equal(judge(FRONTEND, "<!-- ![d](https://e.com/a.gif) -->", []).ok, false);
	assert.equal(judge(FRONTEND, [FENCE_BACKTICKS + "markdown", `![d](${RAW_GIF})`, FENCE_BACKTICKS].join(NEWLINE), []).ok, false);
});
