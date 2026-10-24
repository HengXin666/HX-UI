"use client";

/**
 * One Dark Pro Darker 主题名. 与 tokens.css 里的 --code-odp-* 一一对应.
 */
export const CODE_THEME_ID = "one-dark-pro-darker";

/** 从根元素读一个令牌; 读不到时回退到调用方给的默认值. */
function token(style: CSSStyleDeclaration, name: string): string {
  return style.getPropertyValue(name).trim();
}

/**
 * 把 monaco 主题的取值**全部**指向 tokens.css 的令牌.
 *
 * 为什么不在组件里写死色板: 颜色只允许来自令牌层 (PROJECT-UI-HEX), 换成别的深色
 * 变体时只改 CSS 一处. 取不到值时宁可留空让 monaco 用默认主题, 也不在代码里兜一份
 * 色板, 否则两处颜色迟早不一致.
 */
export function readPalette(): Record<string, string> {
  const style = getComputedStyle(document.documentElement);
  return {
    background: token(style, "--code-odp-background"),
    foreground: token(style, "--code-odp-foreground"),
    lineHighlight: token(style, "--code-odp-line-highlight"),
    selection: token(style, "--code-odp-selection"),
    lineNumber: token(style, "--code-odp-line-number"),
    comment: token(style, "--code-odp-comment"),
    keyword: token(style, "--code-odp-keyword"),
    string: token(style, "--code-odp-string"),
    number: token(style, "--code-odp-number"),
    fn: token(style, "--code-odp-function"),
    variable: token(style, "--code-odp-variable"),
    type: token(style, "--code-odp-type"),
    operator: token(style, "--code-odp-operator"),
    widget: token(style, "--code-odp-widget"),
    border: token(style, "--code-odp-border"),
  };
}

/**
 * 注册主题. 幂等: monaco 允许重复注册同名主题, 后一次覆盖前一次,
 * 所以每次编辑器挂载前都调一次是安全的, 也顺带支持运行期换肤.
 */
export function defineTheme(monaco: typeof import("monaco-editor")): void {
  const p = readPalette();
  monaco.editor.defineTheme(CODE_THEME_ID, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: p.foreground, background: p.background },
      { token: "comment", foreground: p.comment, fontStyle: "italic" },
      { token: "keyword", foreground: p.keyword },
      { token: "keyword.operator", foreground: p.operator },
      { token: "string", foreground: p.string },
      { token: "number", foreground: p.number },
      { token: "regexp", foreground: p.string },
      { token: "type", foreground: p.type },
      { token: "type.identifier", foreground: p.type },
      { token: "identifier", foreground: p.variable },
      { token: "delimiter", foreground: p.foreground },
      { token: "tag", foreground: p.variable },
    ],
    colors: {
      "editor.background": p.background,
      "editor.foreground": p.foreground,
      "editorLineNumber.foreground": p.lineNumber,
      "editorLineNumber.activeForeground": p.foreground,
      "editor.lineHighlightBackground": p.lineHighlight,
      "editor.selectionBackground": p.selection,
      "editor.inactiveSelectionBackground": p.selection,
      "editorCursor.foreground": p.fn,
      "editorIndentGuide.background1": p.border,
      "editorIndentGuide.activeBackground1": p.lineNumber,
      "editorWidget.background": p.widget,
      "editorWidget.border": p.border,
      "editorSuggestWidget.background": p.widget,
      "editorSuggestWidget.selectedBackground": p.selection,
      "editorHoverWidget.background": p.widget,
      "editorHoverWidget.border": p.border,
      "editorGutter.background": p.background,
      "scrollbarSlider.background": p.selection,
      "scrollbarSlider.hoverBackground": p.lineNumber,
      "minimap.background": p.background,
    },
  });
}

/** monaco 命名空间类型 (动态 import 的返回类型). */
export type Monaco = typeof import("monaco-editor");
