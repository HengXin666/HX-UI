/**
 * PR 演示 GIF 规则的纯函数部分: 哪些改动算前端功能, PR 正文里什么算 GIF 演示, 什么时候豁免.
 * CLI 在 scripts/pr-gif/check.ts, 单测在 scripts/tests/pr-gif/rule.test.ts.
 */

/** 豁免标签: 维护者确认没有可见变化时加上, 并在 PR 正文写明理由. */
export const NO_GIF_LABEL = "no-gif";

/** 前端功能路径: 库里的组件与样式, 以及文档站源码. */
const FRONTEND_PATTERNS: readonly RegExp[] = [/^src\/.+\.(?:tsx|css)$/, /^docs\/src\//];

/** GitHub 上传附件 (gh --attach / 网页拖拽) 的地址不带 .gif 扩展名, 按主机与路径认定. */
const ATTACHMENT_URL = /^https:\/\/(?:github\.com\/user-attachments\/assets\/|private-user-images\.githubusercontent\.com\/)/;
const GIF_URL = /^https:\/\/[^\s?#]+\.gif(?:[?#]\S*)?$/i;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const MARKDOWN_IMAGE = /!\[[^\]]*\]\(\s*<?([^)\s>]+)/g;
const HTML_IMAGE = /<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/gi;

/** 改动文件里落在前端功能路径下的那些. */
export function frontendChanges(files: readonly string[]): string[] {
	return files.filter((file) => FRONTEND_PATTERNS.some((pattern) => pattern.test(file)));
}

/** PR 正文里作为图片嵌入的 GIF 地址 (HTML 注释里的模板示例不算, 普通链接不算). */
export function gifImages(body: string): string[] {
	const visible = body.replace(HTML_COMMENT, "");
	const urls = [...visible.matchAll(MARKDOWN_IMAGE), ...visible.matchAll(HTML_IMAGE)].map((match) => match[1]);
	return urls.filter((url) => GIF_URL.test(url) || ATTACHMENT_URL.test(url));
}

export type GifVerdict = { ok: boolean; reason: string; frontend: string[]; gifs: string[] };

/**
 * 综合判定: 没有前端改动或带豁免标签时通过, 否则正文里至少要有一张 GIF 图片.
 *
 * .agents/notes/implemented/process/2026-10-18-pr-gif-demo.md
 */
export function judge(files: readonly string[], body: string, labels: readonly string[]): GifVerdict {
	const frontend = frontendChanges(files);
	const gifs = gifImages(body);
	if (frontend.length === 0) {
		return { ok: true, reason: "没有前端功能改动, 不要求 GIF", frontend, gifs };
	}
	if (labels.includes(NO_GIF_LABEL)) {
		return { ok: true, reason: `带有 ${NO_GIF_LABEL} 标签, 豁免 GIF (正文须写明理由)`, frontend, gifs };
	}
	if (gifs.length > 0) {
		return { ok: true, reason: "PR 正文包含 GIF 演示", frontend, gifs };
	}
	return { ok: false, reason: "改动了前端功能, 但 PR 正文没有嵌入 GIF 演示图片", frontend, gifs };
}
