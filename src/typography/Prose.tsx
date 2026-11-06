import type * as React from "react";
import {
	TYPOGRAPHY_DEFAULTS,
	dataFlag,
	detectCjk,
	resolveSlots,
	type CjkMode,
	type ProseTag,
	type RootSlot,
	type SlotClassNames,
	type SlotStyles,
	type TextSize,
} from "../constants/typography";
import { cn } from "../primitives/utils";

export interface ProseState {
	size: TextSize;
	cjk: boolean;
}

/** 正文基准字号: sm=文档密排 (13), md=博客 (15), lg=长文 (17). 标题档位固定引用 --fs-* 令牌. */
const PROSE_SIZE_CLASS: Record<TextSize, string> = {
	sm: "text-[length:var(--fs-base)]",
	md: "text-[length:var(--fs-lg)]",
	lg: "text-[length:var(--fs-lead)]",
};

/** 根: 文字色, 行距, 首尾子元素去外边距, 长词断行. */
const PROSE_ROOT = "min-w-0 leading-relaxed text-foreground text-pretty [overflow-wrap:anywhere] [&>:first-child]:mt-0 [&>:last-child]:mb-0";

/** 标题层级与间距: 上大下小, 标题与紧随内容视觉成组. */
const PROSE_HEADINGS = cn(
	"[&_:is(h1,h2,h3,h4,h5,h6)]:scroll-m-20 [&_:is(h1,h2,h3,h4,h5,h6)]:font-semibold [&_:is(h1,h2,h3,h4,h5,h6)]:text-heading",
	"[&_:is(h1,h2,h3,h4)]:tracking-tight [&_:is(h1,h2,h3,h4)]:text-balance",
	"[&_h1]:mt-0 [&_h1]:mb-6 [&_h1]:text-[length:var(--fs-5xl)] [&_h1]:font-bold [&_h1]:leading-tight",
	"[&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:border-b [&_h2]:border-border-muted [&_h2]:pb-2 [&_h2]:text-[length:var(--fs-3xl)] [&_h2]:leading-snug",
	"[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-[length:var(--fs-xl)] [&_h3]:leading-snug",
	"[&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:text-[length:var(--fs-lg)]",
	"[&_:is(h5,h6)]:mt-6 [&_:is(h5,h6)]:mb-2 [&_:is(h5,h6)]:text-[length:var(--fs-base)] [&_h6]:text-muted-foreground",
	"[&_:is(h1,h2,h3,h4,h5,h6)+*]:mt-0",
);

/** 段落, 强调, 链接. */
const PROSE_TEXT = cn(
	"[&_p]:my-5",
	"[&_strong]:font-semibold [&_strong]:text-heading",
	"[&_a]:font-medium [&_a]:text-link [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-4 [&_a:hover]:no-underline",
	"[&_a]:rounded-sm [&_a:focus-visible]:outline-1 [&_a:focus-visible]:outline-ring [&_a:focus-visible]:outline-offset-2",
	"[&_mark]:rounded-sm [&_mark]:bg-[var(--primary-subtle)] [&_mark]:px-0.5 [&_mark]:text-foreground",
	"[&_small]:text-[length:var(--fs-sm)] [&_small]:text-muted-foreground",
);

/** 有序 / 无序列表与嵌套, 标记用次要色. */
const PROSE_LISTS = cn(
	"[&_ul]:my-5 [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:ps-6",
	"[&_li]:my-1.5 [&_li]:ps-1 [&_li::marker]:text-muted-foreground",
	"[&_li>:is(ul,ol)]:my-1.5 [&_li>p]:my-2",
	"[&_dl]:my-5 [&_dt]:mt-4 [&_dt]:font-semibold [&_dt]:text-heading [&_dd]:mt-1 [&_dd]:ps-6",
);

/** 引用: 1px 起始边 (契约线宽), 次要色. */
const PROSE_QUOTE = cn(
	"[&_blockquote]:my-6 [&_blockquote]:border-s [&_blockquote]:border-link [&_blockquote]:ps-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic",
	"[&_blockquote_p]:my-2",
);

/** 行内代码与代码块: 等宽字体令牌, 底色 --muted, 1px 边框. 代码块内的 code 复位行内样式. */
const PROSE_CODE = cn(
	"[&_:not(pre)>code]:rounded-md [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5",
	"[&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.875em] [&_:not(pre)>code]:font-medium [&_:not(pre)>code]:text-foreground",
	"[&_kbd]:rounded-sm [&_kbd]:border [&_kbd]:border-border [&_kbd]:bg-muted [&_kbd]:px-1 [&_kbd]:font-mono [&_kbd]:text-[0.875em]",
	"[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted [&_pre]:p-4",
	"[&_pre]:font-mono [&_pre]:text-[length:var(--fs-sm)] [&_pre]:leading-relaxed [&_pre]:text-foreground [&_pre]:[overflow-wrap:normal]",
	"[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:[font-size:inherit] [&_pre_code]:[color:inherit]",
);

/** 表格: 表头底 1px 实线, 行间 1px 弱线, 数字列可由调用方加 tabular-nums. */
const PROSE_TABLE = cn(
	"[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[0.925em]",
	"[&_caption]:mb-2 [&_caption]:text-start [&_caption]:text-muted-foreground",
	"[&_th]:border-b [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-start [&_th]:font-semibold [&_th]:text-heading",
	"[&_td]:border-b [&_td]:border-border-muted [&_td]:px-3 [&_td]:py-2 [&_td]:align-top",
	"[&_:is(th,td):first-child]:ps-0 [&_:is(th,td):last-child]:pe-0",
);

/** 图片, 视频, 插图说明, 分隔线. */
const PROSE_MEDIA = cn(
	"[&_:is(img,video)]:my-8 [&_:is(img,video)]:h-auto [&_:is(img,video)]:max-w-full [&_:is(img,video)]:rounded-lg",
	"[&_figure]:my-8 [&_figure>:is(img,video)]:my-0",
	"[&_figcaption]:mt-3 [&_figcaption]:text-[length:var(--fs-sm)] [&_figcaption]:text-muted-foreground",
	"[&_hr]:my-12 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-border",
);

/**
 * 中文回退: 标题字距改用 --tracking-display-cjk; 正文行距放宽; 中文没有真斜体,
 * 浏览器伪斜体会把字形拉歪, 所以 em 与引用取消 italic 改为加粗或保持正体; 关闭字重合成.
 */
const PROSE_CJK = cn(
	"data-cjk:leading-loose data-cjk:[line-break:strict] data-cjk:[font-synthesis:none]",
	"data-cjk:[&_:is(h1,h2,h3,h4)]:tracking-[var(--tracking-display-cjk)]",
	"data-cjk:[&_em]:not-italic data-cjk:[&_em]:font-semibold data-cjk:[&_blockquote]:not-italic",
);

const PROSE_BASE = cn(PROSE_ROOT, PROSE_HEADINGS, PROSE_TEXT, PROSE_LISTS, PROSE_QUOTE, PROSE_CODE, PROSE_TABLE, PROSE_MEDIA, PROSE_CJK);

export interface ProseProps extends Omit<React.ComponentProps<"div">, "data-slot"> {
	/** 根标签, 默认 div; 博客正文用 article. */
	as?: ProseTag;
	/** 正文基准字号档, 默认 md. */
	size?: TextSize;
	/** 中文回退: auto 时只看 lang (子树文本不扫描), 中文内容请传 lang="zh-CN" 或 cjk. */
	cjk?: CjkMode;
	classNames?: SlotClassNames<RootSlot, ProseState>;
	styles?: SlotStyles<RootSlot, ProseState>;
}

/**
 * Prose: 博客 / 文档正文容器. 子元素是调用方的原生 HTML (或 Markdown 渲染结果), 本组件只给基线样式:
 * 标题层级间距, 段落, 列表, 引用, 代码, 表格, 图片, hr. 颜色全部来自语义令牌, 线宽 1px, 无过渡.
 * 遵循 docs/architecture/component-contract.md; ref 指向根元素. 规则都是后代任意变体, 调用方用 className 覆盖即可.
 */
export function Prose({
	as = TYPOGRAPHY_DEFAULTS.proseTag,
	size = TYPOGRAPHY_DEFAULTS.textSize,
	cjk,
	lang,
	classNames,
	styles,
	className,
	style,
	children,
	ref,
	...props
}: ProseProps): React.JSX.Element {
	const Tag = as as React.ElementType;
	const isCjk = detectCjk(cjk, lang, children);
	const state: ProseState = { size, cjk: isCjk };
	const slotClass = resolveSlots(classNames, state);
	const slotStyle = resolveSlots(styles, state);
	return (
		<Tag
			{...props}
			ref={ref}
			lang={lang}
			data-slot="prose"
			data-size={size}
			data-cjk={dataFlag(isCjk)}
			className={cn(PROSE_SIZE_CLASS[size], PROSE_BASE, slotClass.root, className)}
			style={{ ...slotStyle.root, ...style }}
		>
			{children}
		</Tag>
	);
}
