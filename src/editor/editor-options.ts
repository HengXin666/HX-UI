import type { editor } from "monaco-editor";
import { CODE_EDITOR_OPTIONS, CODE_EDITOR_READONLY_MESSAGE } from "../constants/editor";

/** 单文件编辑器与 diff 共用的 monaco 选项. diff 在调用处再打开左右对比. */
export function sharedEditorOptions(input: {
  readOnly: boolean;
  minimap: boolean;
  lineNumbers: boolean;
}): editor.IStandaloneEditorConstructionOptions {
  return {
    readOnly: input.readOnly,
    readOnlyMessage: { value: CODE_EDITOR_READONLY_MESSAGE },
    minimap: { enabled: input.minimap },
    lineNumbers: input.lineNumbers ? "on" : "off",
    fontSize: CODE_EDITOR_OPTIONS.fontSize,
    fontFamily: "var(--font-mono, ui-monospace), SFMono-Regular, Menlo, monospace",
    fontLigatures: true,
    padding: { top: CODE_EDITOR_OPTIONS.padding, bottom: CODE_EDITOR_OPTIONS.padding },
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    renderLineHighlight: CODE_EDITOR_OPTIONS.renderLineHighlight,
    automaticLayout: true,
    tabSize: CODE_EDITOR_OPTIONS.tabSize,
    wordWrap: "on",
    guides: { indentation: true },
    scrollbar: {
      verticalScrollbarSize: CODE_EDITOR_OPTIONS.scrollbarSize,
      horizontalScrollbarSize: CODE_EDITOR_OPTIONS.scrollbarSize,
    },
    overviewRulerLanes: 0,
  };
}
