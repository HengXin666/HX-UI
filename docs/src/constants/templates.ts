import { TASK_STATUS, TONE_VARIANT } from "@hx/ui";
import { TEMPLATE_SAMPLE } from "../../../src/constants/templates";

/**
 * 模板页 (docs/src/pages/templates/) 跨页复用的取值.
 * 与库或其它文档页同值的原始字面量登记在 src/constants/templates.ts (PROJECT-CONST-DUP 认可的常量目录), 这里只按用途重新命名.
 */

/** 控制台, 看板, 设置三页共用的骨架: 第一步套用说明, 预览框高度, 预览框内容容器. 代码块语言四页共用. */
export const TEMPLATE_PAGE = {
  installStep: "安装 @hx/ui 并引入样式入口",
  frameHeight: 430,
  body: "flex h-full flex-col gap-4 overflow-y-auto p-5",
  lang: TEMPLATE_SAMPLE.lang,
} as const;

/** 部署控制台: 当前步骤与进行中步骤的说明. */
export const CONSOLE_STEP = {
  current: TEMPLATE_SAMPLE.consoleCurrent,
  running: TEMPLATE_SAMPLE.running,
} as const;

/** 部署控制台日志行的 id. */
export const LOG_ID = {
  first: TEMPLATE_SAMPLE.logFirst,
  second: TEMPLATE_SAMPLE.logSecond,
  third: TEMPLATE_SAMPLE.logThird,
  fourth: TEMPLATE_SAMPLE.logFourth,
} as const;

/** 部署控制台日志行的级别 (LogLine.level). */
export const LOG_LEVEL = {
  info: TONE_VARIANT.info,
  success: TONE_VARIANT.success,
  warn: TEMPLATE_SAMPLE.warn,
  error: TASK_STATUS.error,
} as const;

/** 数据看板: 服务状态文案, 服务 id, 服务列字段名, 等宽数字类名. */
export const DASHBOARD = {
  stateOk: "正常",
  authId: TEMPLATE_SAMPLE.authId,
  searchId: TEMPLATE_SAMPLE.searchId,
  nameKey: TEMPLATE_SAMPLE.nameKey,
  tabularNums: TEMPLATE_SAMPLE.tabularNums,
} as const;

/** 设置页: 分组 id, 语言值, 密度选项, Webhook 输入框宽度. */
export const SETTINGS = {
  general: TEMPLATE_SAMPLE.general,
  zh: TEMPLATE_SAMPLE.zh,
  compact: TEMPLATE_SAMPLE.compact,
  compactLabel: TEMPLATE_SAMPLE.compactLabel,
  inputWidth: TEMPLATE_SAMPLE.inputWidth,
} as const;
