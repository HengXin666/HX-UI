/**
 * 文档站模板页 (docs/src/pages/templates/) 的演示取值: 与库或其它文档页同值的字面量登记在这里,
 * 由 docs/src/constants/templates.ts 按用途取用. 库本身不引用这里.
 */

/** 模板页演示数据里与别处同值的取值. */
export const TEMPLATE_SAMPLE = {
	/** 完整代码块的语言. */
	lang: "tsx",
	/** 部署控制台: 当前步骤下标与进行中步骤的说明. */
	consoleCurrent: 2,
	running: "进行中",
	/** 日志级别 warn (LogLine.level). */
	warn: "warn",
	/** 日志行的 id. */
	logFirst: "1",
	logSecond: "2",
	logThird: "3",
	logFourth: "4",
	/** 数据看板: 服务 id, 服务列的字段名, 等宽数字类名. */
	authId: "auth",
	searchId: "search",
	nameKey: "name",
	tabularNums: "tabular-nums",
	/** 设置页: 分组 id, 语言值, 密度选项, 输入框宽度. */
	general: "general",
	zh: "zh",
	compact: "compact",
	compactLabel: "紧凑",
	inputWidth: "w-52",
} as const;
