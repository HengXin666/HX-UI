/**
 * 文档站专用的取值: 示例里反复出现的标签页值, 演示数据与类名. 库本身不引用这里.
 */

/** 预览框的两个标签页. */
export const DOC_TAB = {
	preview: "preview",
	code: "code",
} as const;

/** 文档站示例与排版里复用的取值. */
export const DOC = {
	/** 属性表里 "无默认值" 的写法. */
	none: "-",
	/** 名字列表的分隔. */
	listSep: ", ",
	/** 多行清单的行分隔. */
	newline: "\n",
	/** 示例容器的常用排版. */
	stack: "flex w-full flex-col gap-3",
	stackMd: "flex w-full max-w-md flex-col gap-3",
	widthMd: "w-full max-w-md",
	/** 进度条示例的宽度. */
	barWidth: "w-64",
	/** 进度计量器示例的宽度 (右侧还有一列数值). */
	barWidthWide: "w-72",
	wrap: "flex flex-wrap gap-2",
	tight: "flex flex-col gap-1",
	dangerText: "text-danger-fg",
	/** 外链在新标签页打开. */
	newTab: "_blank",
	/** 示例里的通用文案. */
	settings: "设置",
	copy: "复制",
	/** 小一号的说明文字 (上一页 / 下一页的标题行). */
	caption: "text-[11px] text-muted-foreground",
	/** 可截断的一行强调文字 (页面导航的目标名). */
	strongLine: "truncate text-[13px] font-medium text-foreground",
	/** 安装页的路由 (面包屑, 导航菜单与链接示例都指向它). */
	installHref: "#/install",
	/** 规格清单每行的列数: 属性表 (名字 ~ 类型 ~ 默认 ~ 说明), 导航清单 (id ~ 标签 ~ 说明). */
	propsColumns: 4,
	navColumns: 3,
	/** 文档站外壳 (品牌标, 顶栏外链, 模板页) 的类名与属性值, 经 docs/src/constants/shell.ts 按用途取用. */
	shrink: "shrink-0",
	grow: "min-w-0 flex-1",
	stackSnug: "flex flex-col gap-1.5",
	space: " ",
	noReferrer: "noreferrer",
	focusableOff: "false",
	/** 代码编辑器示例的 monaco 语言 id. */
	jsonLang: "json",
} as const;

/** 文档站示例里的演示数据 (页码, 进度, 长度限制等). */
export const DOC_SAMPLE = {
	turns: 6,
	streamStep: 2,
	streamInterval: 40,
	progress: 42,
	progressStep: 19,
	/** 失败 / 警告色进度条的演示值. */
	progressFail: 18,
	full: 100,
	collapsedHeight: 64,
	slider: 30,
	page: 4,
	pageCount: 20,
	/** 滚动容器示例里渲染的行数. */
	scrollRows: 20,
	nameMin: 2,
	nameMax: 16,
	bioMax: 80,
	otpLength: 6,
	otpHalf: 3,
	/** 多行骨架的演示行数. */
	skeletonLines: 3,
	wideRatio: 16 / 9,
	invoiceLabelSpan: 3,
	/** 品牌标的边长: 默认, 侧栏标题, 顶栏. */
	logoSize: 24,
	logoSidebar: 22,
	logoTopBar: 16,
	/** 代码编辑器示例的高度 (px): 可编辑示例, 其它语言示例. */
	editorHeight: 320,
	editorHeightSmall: 220,
} as const;

/** 文档属性表的一行 (DocKit 的 PropsTable). */
export interface DocPropRow {
	name: string;
	type: string;
	default?: string;
	desc: string;
}

/** 流式文本文档页的属性表: StreamingMarkdown 与 StreamingText. */
export const DOC_STREAMING_PROPS: { readonly markdown: DocPropRow[]; readonly text: DocPropRow[] } = {
	markdown: [
		{ name: "content", type: "string", desc: "已到达的 Markdown 原文, 不完整的语法按半成品渲染" },
		{ name: "streaming", type: "boolean", default: "true", desc: "仍在生成, 为 true 时保留流式光标" },
		{ name: "final", type: "boolean", desc: "流已结束, 与 streaming 同时给时以它为准" },
		{ name: "customId", type: "string", desc: "每条消息一个 id, 作为节点 key 的前缀" },
		{ name: "isDark", type: "boolean", desc: "明暗主题, 缺省跟随根元素的 data-mode" },
		{ name: "className", type: "string", desc: "追加到外层容器的类名" },
	],
	text: [
		{ name: "text", type: "string", desc: "当前已到达的文本, 原样渲染" },
		{ name: "streaming", type: "boolean", desc: "为 true 时显示光标, 表示仍在生成" },
		{ name: "cursor", type: "boolean", default: "true", desc: "是否显示光标, 只在 streaming 为 true 时生效" },
		{ name: "className", type: "string", desc: "追加到文本容器的类名" },
	],
};

/** 思考与过程页演示的时间轴: 每步间隔与各阶段的起止步号, 用名字表达流程, 避免散落的魔法数字. */
export const PROCESS_DEMO = {
	stepMs: 1100,
	step: {
		idle: -1,
		start: 0,
		scan: 1,
		scanEnd: 4,
		/** 思考结束, 进入发散比较. */
		branch: 6,
		/** 选定方向, 子代理开工. */
		decide: 8,
		read: 9,
		research: 11,
		merge: 12,
		edit: 13,
		end: 14,
	},
} as const;

/** 先思考再回复演示: 发出请求到首个思考 token 的空窗, 以及流程各阶段名. */
export const THINK_DEMO = {
	firstTokenDelayMs: 700,
	phase: {
		idle: "idle",
		waiting: "waiting",
		thinking: "thinking",
		answering: "answering",
		done: "done",
	},
} as const;

/** Agent 总览演示的节奏 (ms): 流式每帧间隔与字符数, 首 token 等待, 思考逐行间隔, 思考结束后工具与回复的延迟. */
export const OVERVIEW_DEMO = {
	streamTickMs: 24,
	streamStep: 2,
	thinkFirstTokenMs: 700,
	thinkLineMs: 420,
	toolDelayMs: 200,
	replyDelayMs: 1000,
} as const;

/** Agent 总览演示里事件的生命周期状态. */
export const AGENT_DEMO_STATUS = {
	pending: "pending",
	running: "running",
	done: "done",
	approved: "approved",
	rejected: "rejected",
} as const;

/** DiffView 行类型: 上下文, 删除, 新增. */
export const DIFF_KIND = {
	ctx: "ctx",
	del: "del",
	add: "add",
} as const;

/** 工具调用卡的展示态: 执行中与成功. */
export const TOOL_STATE = {
	running: "running",
	ok: "ok",
} as const;

/** 文档演示里响应的键盘按键. */
export const DOC_KEY = {
	enter: "Enter",
} as const;

/** Agent 总览演示的展示参数: 分隔标记的样式, 用户消息靠右与助手消息靠左的对齐. */
export const OVERVIEW_VIEW = {
	markerVariant: "solid",
	alignStart: "start",
	alignEnd: "end",
} as const;

/** Page ids matched by the docs router switch. */
export const DOC_PAGE_ID = {
  button: "button",
  input: "input",
  switch: "switch",
  select: "select",
  dialog: "dialog",
} as const;

/** DOM event names and keys the docs shell listens for. */
export const DOC_EVENT = {
  escape: "Escape",
  keydown: "keydown",
  change: "change",
} as const;

/** Docs shell class names shared by the sidebar and the mobile top bar. */
export const DOC_SHELL_CLS = {
  show: "flex",
  hide: "hidden",
  fill: "min-w-0 flex-1 truncate",
  pushRight: "ml-auto",
} as const;

/** Nav icons reused by several docs entries. */
export const NAV_ICON = {
  chevronDown: "icon-[solar--alt-arrow-down-linear]",
  widget: "icon-[solar--widget-2-linear]",
  clock: "icon-[solar--clock-circle-linear]",
} as const;
