import { test } from "node:test";
import assert from "node:assert/strict";
import { NEWLINE, README_FILE } from "../../constants/quality.ts";
import { NO_GIF_LABEL, frontendChanges, gifImages, judge } from "../../pr-gif/rule.ts";

/**
 * 一个前端文件加一个非前端文件的改动清单.
 *
 * .agents/notes/implemented/process/2026-10-18-pr-gif-demo.md
 */
const FRONTEND = ["src/primitives/sheet.tsx", README_FILE];
const RAW_GIF = "https://raw.githubusercontent.com/HengXin666/HX-UI/pr-assets/pr-10/demo.gif";

/** 应被识别为前端功能的三类路径. */
const FRONTEND_FILES = ["src/a.tsx", "src/b/c.css", "docs/src/nav.ts"];

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

test("判定: 无前端改动通过, 有前端改动缺 GIF 失败, 有 GIF 或豁免标签通过", () => {
	assert.equal(judge([README_FILE], "", []).ok, true);
	assert.equal(judge(FRONTEND, "没有图", []).ok, false);
	assert.equal(judge(FRONTEND, `![d](${RAW_GIF})`, []).ok, true);
	assert.equal(judge(FRONTEND, "", [NO_GIF_LABEL]).ok, true);
	assert.equal(judge(FRONTEND, "<!-- ![d](https://e.com/a.gif) -->", []).ok, false);
});
