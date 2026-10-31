/**
 * editor/ 代码编辑器: monaco (VS Code 内核) 加 One Dark Pro Darker 主题.
 * 与 layout/CodeBlock 的分工: CodeBlock 是只读展示 (shiki 静态高亮), 这里是可编辑的编辑器.
 * DiffEditor 是同一内核的对比视图.
 */
export { CodeEditor, type CodeEditorProps } from "./CodeEditor";
export { DiffEditor, type DiffEditorProps, type DiffLineNote, type DiffSide } from "./DiffEditor";
export { CODE_THEME_ID, defineTheme, readPalette, type Monaco } from "./monaco-theme";
