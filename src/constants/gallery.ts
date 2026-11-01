/**
 * 展示画廊 (docs/src/pages/gallery) 专用的取值: 类名表, 演示数字, 动效节奏, 文案与图表数据.
 * 画廊页与仪表盘展示块都从这里取, 库本身不引用这里.
 */

/* ---------------------------------------------------------------- 画廊页 */

/** 画廊页的类名表: 同一串出现多次或只是排版细节的都收在这里, 颜色全部是语义令牌. */
export const GALLERY_CLS = {
	page: "flex flex-col gap-16 pb-8",
	section: "flex flex-col gap-5",
	sectionHead: "flex flex-col gap-2",
	eyebrow: "text-[length:var(--fs-2xs)] font-medium uppercase tracking-[0.18em] text-primary",
	heading: "text-[length:var(--fs-2xl)] font-semibold tracking-tight text-foreground",
	lead: "max-w-2xl text-[length:var(--fs-sm)] leading-relaxed text-muted-foreground",
	leadCentered: "max-w-2xl text-[length:var(--fs-sm)] leading-relaxed text-muted-foreground mx-auto",
	chip: "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[length:var(--fs-xs)] text-muted-foreground",
	chipIcon: "size-3.5 text-primary",
	link: "inline-flex h-9 items-center gap-2 rounded-lg px-4 text-[length:var(--fs-sm)] font-medium transition-[background-color,border-color,box-shadow] duration-(--duration-fast) focus-visible:shadow-(--ring-glow) focus-visible:outline-none",
	linkPrimary: "bg-primary text-primary-foreground shadow-(--shadow-glow) hover:bg-primary/90",
	linkSecondary: "border border-border bg-card text-foreground hover:border-primary/40",
	linkIcon: "size-4",
	figure: "text-[length:var(--fs-3xl)] font-semibold leading-none tracking-tight text-foreground",
	figureCell: "flex flex-col gap-1.5",
	muted: "text-[length:var(--fs-xs)] text-muted-foreground",
	tile: "flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-5",
	tileIcon: "flex size-9 items-center justify-center rounded-lg border border-border bg-muted/50 text-primary [&>svg]:size-4",
	tileTitle: "text-[length:var(--fs-base)] font-medium text-foreground",
	miniBars: "flex h-28 items-end gap-1.5 px-5 pb-5",
	miniBar: "flex-1 rounded-t-sm bg-(image:--gradient-brand) opacity-80",
	bentoFooter: "mt-auto",
	hero: "relative overflow-hidden rounded-2xl border border-border px-6 py-14 md:px-12 md:py-20",
	heroInner: "relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center",
	heroTitle: "text-balance text-[length:var(--fs-4xl)] font-semibold leading-[1.1] tracking-tight text-foreground md:text-[length:var(--fs-5xl)]",
	heroAccent: "hx-gradient-pan bg-clip-text text-transparent",
	heroActions: "flex flex-wrap justify-center gap-3",
	heroFigures: "relative mx-auto mt-12 max-w-4xl",
	heroFigurePanel: "relative grid grid-cols-2 gap-6 rounded-2xl p-6 md:grid-cols-4",
	principles: "grid gap-4 md:grid-cols-3",
	cta: "relative overflow-hidden rounded-2xl border border-border px-6 py-12 text-center",
	ctaInner: "relative mx-auto flex max-w-xl flex-col items-center gap-4",
	install: "rounded-lg border border-border bg-(--surface-raised) px-4 py-2 font-mono text-[length:var(--fs-sm)] text-foreground shadow-(--shadow-2xl)",
} as const;

/**
 * 首屏数字, 每个都可以在仓库里数出来. 第一次进视口时从零弹上来. 改库后按下面的命令重数再改这里.
 * - 具名导出 979: scripts/gates/baselines/api-surface.txt 去掉 # 注释行与空行后的行数, 复算:
 * grep -v '^\s*#' scripts/gates/baselines/api-surface.txt | grep -c .
 * - 设计令牌 176: src/tokens.css 里声明的 CSS 自定义属性, 按名字去重 (亮暗两套重复声明只算一次), 复算:
 * grep -oE '^\s*--[a-zA-Z0-9-]+\s*:' src/tokens.css | sed 's/[ :]//g' | sort -u | wc -l
 * - 动效预设 7: src/motion/presets.ts 的 MOTION_PRESETS 键数 (fade, fadeUp, fadeDown, scaleIn, blurIn, slideLeft, slideRight), 复算:
 * grep -c '\[MOTION_PRESET_NAME\.' src/motion/presets.ts
 * - 主题 2: src/tokens.css 的 [data-mode="dark"] 与 [data-mode="light"] 两套, 复算:
 * grep -oE 'data-mode="(light|dark)"' src/tokens.css | sort -u | wc -l
 */
export const DEMO_FIGURES = [
	{ label: "具名导出", value: 979 },
	{ label: "设计令牌", value: 176 },
	{ label: "动效预设", value: 7 },
	{ label: "主题: 亮与暗", value: 2 },
] as const;

/** 首屏数字的弹簧手感. */
export const FIGURE_SPRING = "snappy";

/** 技术栈跑马灯的条目. */
export const TECH_STACK = ["React 19", "Tailwind v4", "motion/react", "Radix", "Recharts 3", "Monaco", "cva", "Iconify Solar", "Vite"] as const;

/** 技术栈跑马灯: 滚一圈的秒数与无障碍名. */
export const TECH_MARQUEE = { duration: 36, label: "技术栈" } as const;

/** 三条设计原则的文案, 图标在页面里按 key 配. */
export const PRINCIPLE_COPY = [
	{ key: "theme", title: "亮暗同源", text: "两套主题共用一份语义令牌, 组件里不写一个色值." },
	{ key: "motion", title: "动得克制", text: "时长与缓动从令牌读, 减弱动效时全库归零." },
	{ key: "stroke", title: "1px 的秩序", text: "层级靠表面明度与阴影拉开, 描边永远只有一像素." },
] as const;

/** 原则卡的入场预设. */
export const PRINCIPLE_PRESET = "scaleIn";

/** 特性墙磁贴里的迷你柱形高度 (百分比). */
export const MINI_BAR_HEIGHTS = [38, 62, 48, 80, 56, 92, 70, 84] as const;

/** 首屏各段 Reveal 的入场参数: 每段晚 0.08 秒, 形成自上而下的节奏. */
export const HERO_REVEAL = {
	badge: { preset: "fade" },
	title: { preset: "blurIn", timing: "emphasized", delay: 0.08 },
	lead: { delay: 0.16 },
	actions: { delay: 0.24 },
	figures: { delay: 0.32 },
} as const;

/** 首屏的底纹, 玻璃与流光参数. */
export const HERO_SURFACE = {
	backdrop: "aurora",
	glassBlur: "lg",
	beamDuration: 9,
} as const;

/** 首屏两个按钮的锚点. */
export const HERO_ANCHOR = { install: "#install", effects: "#effects" } as const;

/** 区块进入视口多少比例时开始浮现. */
export const SECTION_REVEAL_AMOUNT = 0.1;

/** 三个区块的眉题与标题. */
export const SECTION_COPY = {
	features: { eyebrow: "Features", title: "拼一块特性墙, 不用写一个 grid" },
	principles: { eyebrow: "Principles", title: "三条不商量的规矩" },
	dashboard: { eyebrow: "Dashboard", title: "同一套件, 拼成一块仪表盘" },
} as const;

/** 特性墙的网格: 四列, 中号行高与间距. */
export const BENTO_GRID = { cols: 4, rowHeight: "md", gap: "md", label: "特性" } as const;

/** 特性墙的五块磁贴: 跨度与文案, 图标和内容在页面里配. */
export const BENTO_TILES = {
	motion: {
		colSpan: 2, rowSpan: 2, title: "动效引擎",
		description: "入场, 交错, 数字滚动与转场共用一套弹簧预设, 节奏来自令牌.",
	},
	layout: {
		colSpan: 2, title: "布局原语",
		description: "Stack, Grid, Container, Bento, SplitView: 间距与宽度只有一套档位.",
	},
	stat: { title: "指标卡", description: "趋势箭头只说好坏, 迷你折线 1px.", footer: "StatCard · trend" },
	effects: { title: "视觉效果", description: "光斑, 流光, 跑马灯, 底纹, 毛玻璃.", footer: "5 个装饰层" },
	theme: {
		colSpan: "full", surface: "muted", title: "亮色与暗色同一份代码",
		description: "切一下右上角的主题: 极光变淡, 玻璃变白, 阴影收轻, 布局一像素都不动.",
	},
} as const;

/** 收尾召唤区: 网格底纹与反向流光. */
export const CTA_SURFACE = { backdrop: "grid", size: 28, beamTone: "accent", beamDuration: 12 } as const;

/* ---------------------------------------------------------- 仪表盘展示块 */

/** 仪表盘的类名表. */
export const DASH_CLS = {
	shell: "flex flex-col gap-4 rounded-2xl border border-border bg-(--surface-raised) p-4 shadow-(--shadow-2xl) md:p-5",
	header: "flex flex-col gap-0.5",
	panel: "flex flex-col gap-3 rounded-xl border border-border bg-card p-4",
	panelWide: "flex flex-col gap-3 rounded-xl border border-border bg-card p-4 lg:col-span-2",
	title: "text-[length:var(--fs-sm)] font-medium text-foreground",
	muted: "text-[length:var(--fs-xs)] text-muted-foreground",
	mutedNum: "text-[length:var(--fs-xs)] text-muted-foreground tabular-nums",
	row: "flex items-center justify-between gap-3",
	rowItem: "flex items-center justify-between gap-3 py-2",
	num: "tabular-nums text-foreground",
	stats: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4",
	chartRow: "grid gap-4 lg:grid-cols-3",
	healthBackdrop: "h-full rounded-xl border border-border p-3",
	healthGlass: "relative flex h-full flex-col gap-3 rounded-lg p-4",
	healthList: "flex flex-col divide-y divide-border",
	serviceName: "truncate font-mono text-[length:var(--fs-xs)] text-foreground",
	serviceMeta: "flex items-center gap-2",
	dotOk: "size-1.5 rounded-full bg-success",
	dotWarn: "size-1.5 rounded-full bg-warning",
	featureStat: "border-border/60 bg-card/70 shadow-(--shadow-glow)",
	featureValue: "inline-flex items-baseline text-[length:var(--fs-4xl)] tracking-tight",
} as const;

/** 指标卡列表用 ul / li 渲染, 读屏能报出条数. */
export const DASH_LIST_TAG = { list: "ul", item: "li" } as const;

/** 迷你折线的基准数据: 按周排列, 七个点. */
export const SPARK_BASE = {
	calls: [42, 48, 45, 53, 58, 61, 66],
	latency: [188, 176, 181, 164, 158, 149, 142],
	errors: [0.61, 0.58, 0.52, 0.55, 0.47, 0.44, 0.42],
	users: [9.1, 9.4, 9.2, 9.8, 10.3, 10.6, 11.2],
} as const;

/** 趋势里 "越低越好" 的写法, 延迟与错误率用它. */
export const TREND_DOWN = "down";

/** 趋势的对照口径. */
export const TREND_VS_LAST_WEEK = "较上周";

/** 第一排四张指标卡. */
export const STAT_CARDS = [
	{
		key: "calls", label: "今日调用", value: "2.24M", icon: "icon-[solar--graph-up-linear]",
		trend: { value: 8.2, label: TREND_VS_LAST_WEEK }, sparkline: SPARK_BASE.calls,
	},
	{
		key: "latency", label: "P95 延迟", value: "142ms", icon: "icon-[solar--stopwatch-linear]",
		trend: { value: -12.4, better: TREND_DOWN, label: TREND_VS_LAST_WEEK }, sparkline: SPARK_BASE.latency,
	},
	{
		key: "errors", label: "错误率", value: "0.42%", icon: "icon-[solar--shield-warning-linear]",
		trend: { value: -4.5, better: TREND_DOWN, label: "低于阈值 1%" }, sparkline: SPARK_BASE.errors,
	},
	{
		key: "users", label: "活跃用户", value: "11.2K", icon: "icon-[solar--users-group-rounded-linear]",
		trend: { value: 5.7 }, hint: "峰值出现在 17:00", sparkline: SPARK_BASE.users,
	},
] as const;

/**
 * 仪表盘的主指标: 本月错误预算剩余 (SLA 99.95% 换算出的可停机时长还剩多少).
 * 数值从 0 弹到 64, 趋势 +18.5% 较上月 (涨是好事), 折线按周七个点单调上行, 终点等于数值.
 */
export const ERROR_BUDGET = {
	label: "错误预算剩余",
	icon: "icon-[solar--shield-check-linear]",
	tone: "good",
	value: 64,
	from: 0,
	trend: { value: 18.5, label: "较上月" },
	hint: "SLA 99.95% · 本月可用性 99.982%",
	sparkline: [31, 38, 42, 47, 52, 58, 64],
} as const;

/** 面积图: 近 12 小时的请求量, 两条系列. */
export const TRAFFIC = [
	{ name: "08:00", api: 320, edge: 180 },
	{ name: "09:00", api: 410, edge: 220 },
	{ name: "10:00", api: 520, edge: 260 },
	{ name: "11:00", api: 610, edge: 300 },
	{ name: "12:00", api: 560, edge: 340 },
	{ name: "13:00", api: 640, edge: 360 },
	{ name: "14:00", api: 720, edge: 390 },
	{ name: "15:00", api: 690, edge: 420 },
	{ name: "16:00", api: 780, edge: 450 },
	{ name: "17:00", api: 820, edge: 470 },
	{ name: "18:00", api: 760, edge: 430 },
	{ name: "19:00", api: 700, edge: 410 },
];

/** 面积图的两条系列. */
export const TRAFFIC_SERIES = [
	{ dataKey: "api", name: "API" },
	{ dataKey: "edge", name: "边缘" },
];

/** 柱状图: 各区域本周调用 (千次). */
export const REGIONS = [
	{ name: "华东", calls: 1240 },
	{ name: "华南", calls: 980 },
	{ name: "华北", calls: 860 },
	{ name: "新加坡", calls: 540 },
	{ name: "东京", calls: 410 },
];

/** 柱状图的系列. */
export const REGION_SERIES = [{ dataKey: "calls", name: "调用" }];

/** 侧栏里的服务健康: 状态决定圆点语气. */
export const SERVICES = [
	{ name: "api-gateway", p95: 182, ok: true },
	{ name: "auth-service", p95: 96, ok: true },
	{ name: "search-index", p95: 410, ok: false },
	{ name: "billing", p95: 128, ok: true },
] as const;

/** 服务状态圆点的读屏文案与角色. */
export const HEALTH_LABEL = { ok: "正常", degraded: "降级", role: "img" } as const;

/** 健康侧栏: 点阵底纹间距, 玻璃模糊档位与染色. */
export const HEALTH_SURFACE = { backdrop: "dots", size: 18, blur: "md", tint: "primary" } as const;

/** 本月额度 (百万次), forecastExtra 是按当前速率到月底还会多用的百分点. */
export const QUOTA = { used: 6.8, limit: 10, forecastExtra: 9 } as const;

/** 比例换算成百分数. */
export const PERCENT = 100;

/** 主图与侧图的高度 (像素). */
export const CHART_HEIGHT = { main: 248, side: 196 } as const;
