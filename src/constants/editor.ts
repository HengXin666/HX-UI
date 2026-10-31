/**
 * 代码编辑器 (editor/CodeEditor.tsx) 与它的 monaco 主题 (editor/monaco-theme.ts) 的取值.
 */

/** CodeEditor 的缺省语言与高度 (px). */
export const CODE_EDITOR_DEFAULTS = {
  language: "typescript",
  height: 320,
} as const;

/** 编辑器填满外层容器: 高度由外层 style 决定. */
export const CODE_EDITOR_FILL = "100%";

/** 传给 monaco 的编辑器选项里的数值与枚举. */
export const CODE_EDITOR_OPTIONS = {
  /** 上下内边距 (px). */
  padding: 12,
  renderLineHighlight: "all",
  tabSize: 2,
  /** 横纵滚动条宽度 (px). */
  scrollbarSize: 8,
  /** 编辑器字号 (px). */
  fontSize: 12.5,
  /** diff 行下注释区高度 (px). */
  noteZonePx: 28,
} as const;

/** 只读时 monaco 状态栏上的说明. */
export const CODE_EDITOR_READONLY_MESSAGE = "只读示例";

/** diff 的两侧. 行号与注释都要指明落在哪一边. */
export const DIFF_SIDE = {
  original: "original",
  modified: "modified",
} as const;

/** monaco 主题规则的 token 名. */
export const MONACO_TOKEN = {
  comment: "comment",
  keyword: "keyword",
  keywordOperator: "keyword.operator",
  string: "string",
  number: "number",
  regexp: "regexp",
  type: "type",
  typeIdentifier: "type.identifier",
  identifier: "identifier",
  delimiter: "delimiter",
  tag: "tag",
} as const;
