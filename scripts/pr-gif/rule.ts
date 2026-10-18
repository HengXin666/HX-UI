/**
 * PR 演示 GIF 规则的纯函数部分: 哪些改动算前端功能, PR 正文里什么算 GIF 演示, 什么时候豁免.
 * CLI 在 scripts/pr-gif/check.ts, 单测在 scripts/tests/pr-gif/rule.test.ts.
 */
import { NEWLINE, SPACE } from "../constants/quality.ts";

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

/** 围栏代码块开头: 最多三个前导空格, 三个及以上反引号或波浪号 (CommonMark). */
const FENCE = /^ {0,3}(?<mark>`{3,}|~{3,})/;
/** markdown 标题行: 围栏代码块之外的 "## 理由" 小节从这里开始. */
const HEADING = /^#{1,6}\s/;
/** 豁免理由的两种写法: 标题里带 "理由" 或 no-gif, 或一行 "理由: ...". */
const REASON_TITLE = /(?:理由|no-gif)/i;
const REASON_INLINE = /^(?:[-*+]\s+)?(?:no-gif\s*)?理由\s*[:：]\s*(?<text>.*)$/i;
/** 理由正文至少要这么多字符, "理由: 无" 这类敷衍说明不算写明. */
const MIN_REASON_CHARS = 6;

/**
 * 去掉 HTML 注释与围栏代码块: 两者里的图片都是示例, 不是本次演示.
 * 未闭合的围栏按代码处理到正文末尾, 宁可要求作者补图, 也不把示例当证据.
 */
function visibleText(body: string): string {
	const kept: string[] = [];
	let fence: string | undefined;
	for (const row of body.replace(HTML_COMMENT, "").split(NEWLINE)) {
		const mark = FENCE.exec(row)?.groups?.mark;
		if (fence === undefined) {
			if (mark) {
				fence = mark;
				continue;
			}
			kept.push(row);
		} else if (mark && mark[0] === fence[0] && mark.length >= fence.length) {
			fence = undefined;
		}
	}
	return kept.join(NEWLINE);
}

/** 改动文件里落在前端功能路径下的那些. */
export function frontendChanges(files: readonly string[]): string[] {
	return files.filter((file) => FRONTEND_PATTERNS.some((pattern) => pattern.test(file)));
}

/** PR 正文里作为图片嵌入的 GIF 地址 (注释与围栏代码块里的示例不算, 普通链接不算). */
export function gifImages(body: string): string[] {
	const visible = visibleText(body);
	const urls = [...visible.matchAll(MARKDOWN_IMAGE), ...visible.matchAll(HTML_IMAGE)].map((match) => match[1]);
	return urls.filter((url) => GIF_URL.test(url) || ATTACHMENT_URL.test(url));
}

/** 带 no-gif 标签时正文写明的豁免理由; 没有写或只写了几个字时返回 undefined. */
export function exemptionReason(body: string): string | undefined {
	const rows = visibleText(body).split(NEWLINE);
	for (let index = 0; index < rows.length; index += 1) {
		const row = rows[index].trim();
		const inline = REASON_INLINE.exec(row);
		if (inline) {
			const text = inline.groups!.text.trim();
			if (text.length >= MIN_REASON_CHARS) {
				return text;
			}
			continue;
		}
		if (!HEADING.test(row) || !REASON_TITLE.test(row)) {
			continue;
		}
		const lines: string[] = [];
		for (const next of rows.slice(index + 1)) {
			if (HEADING.test(next.trim())) {
				break;
			}
			if (next.trim()) {
				lines.push(next.trim());
			}
		}
		const text = lines.join(SPACE);
		if (text.length >= MIN_REASON_CHARS) {
			return text;
		}
	}
	return undefined;
}

export type GifVerdict = { ok: boolean; reason: string; frontend: string[]; gifs: string[] };

/**
 * 综合判定: 没有前端改动时通过; 带豁免标签时正文必须写明理由; 否则正文里至少要有一张 GIF 图片.
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
		const reason = exemptionReason(body);
		if (reason === undefined) {
			return {
				ok: false, reason: `带有 ${NO_GIF_LABEL} 标签, 但正文没有写明豁免理由: 写一节 "## 理由" 或一行 "理由: ..."`,
				frontend, gifs,
			};
		}
		return { ok: true, reason: `带有 ${NO_GIF_LABEL} 标签, 正文写明豁免理由: ${reason}`, frontend, gifs };
	}
	if (gifs.length > 0) {
		return { ok: true, reason: "PR 正文包含 GIF 演示", frontend, gifs };
	}
	return { ok: false, reason: "改动了前端功能, 但 PR 正文没有嵌入 GIF 演示图片", frontend, gifs };
}
