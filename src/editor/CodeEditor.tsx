"use client";

import type { JSX } from "react";
import Editor from "@monaco-editor/react";
import { cn } from "../primitives/utils";
import { CODE_EDITOR_DEFAULTS, CODE_EDITOR_FILL } from "../constants/editor";
import { sharedEditorOptions } from "./editor-options";
import { CODE_THEME_ID, defineTheme, type Monaco } from "./monaco-theme";
import { useMonacoReady } from "./use-monaco";

/**
 * 代码编辑器  VS Code 的内核 (monaco) 加 One Dark Pro Darker 主题.
 *
 * ## 为什么是 monaco 而不是 textarea 或 CodeMirror
 *
 * 需求是"和 VS Code 一样": 同一套语法引擎, 同一套快捷键 (多光标, 行移动, 查找替换),
 * 同一套折叠. monaco 就是 VS Code 的那份内核, 用它等于直接复用编辑器本体;
 * 换别的库只能做到"看起来像", 做不到"用起来一样".
 *
 * ## 三条实现上的硬约束
 *
 * 1. **不走 CDN**. @monaco-editor/react 默认从 jsdelivr 拉 monaco, 离线环境与
 * 内网部署都会失败; 这里用 loader.config 指到本地包, 由使用方的打包器处理.
 * 2. **懒加载**. monaco 体积大, 不能进首屏. 组件挂载后才动态 import, 编辑区
 * 先渲染一个等高骨架.
 * 3. **主题从令牌读**. 颜色只在 tokens.css 的 --code-odp-* 里, 这里读出来注册,
 * 不在组件里抄色板 (那也是门禁 PROJECT-UI-HEX 的要求).
 *
 * worker 由使用方的打包器提供: Vite 下用 new URL(...) 建立 editor.worker,
 * webpack 下用 worker-loader. 拿不到时 monaco 会退化成主线程计算, 编辑仍可用.
 * 对比两段文本用同目录的 DiffEditor, 不要在这里塞 original/modified.
 */
export interface CodeEditorProps {
  /** 受控值. 不给 onChange 时按只读展示. */
  readonly value: string;
  readonly onChange?: (next: string) => void;
  /** monaco 语言 id, 例如 tsx / ts / json / css / bash. */
  readonly language?: string;
  /** 编辑器高度, 数字按像素. */
  readonly height?: number | string;
  readonly readOnly?: boolean;
  readonly minimap?: boolean;
  readonly lineNumbers?: boolean;
  /** 打开的文件名 (决定 monaco 的模型语言与 id). */
  readonly path?: string;
  /** worker 工厂. Vite: () => new EditorWorker() (?worker 导入). 不给时退回主线程. */
  readonly createWorker?: (label: string) => Worker;
  readonly className?: string;
}

/**
 * .agents/notes/implemented/feature/2026-10-22-code-editor-one-dark-pro-darker.md
 */
export function CodeEditor({
  value,
  onChange,
  language = CODE_EDITOR_DEFAULTS.language,
  height = CODE_EDITOR_DEFAULTS.height,
  readOnly = false,
  minimap = false,
  lineNumbers = true,
  path,
  createWorker,
  className,
}: CodeEditorProps): JSX.Element {
  const ready = useMonacoReady(createWorker);

  return (
    <div
      data-slot="code-editor"
      className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}
      style={{ height }}
    >
      {ready ? (
        <Editor
          height={CODE_EDITOR_FILL}
          language={language}
          value={value}
          {...(path ? { path } : {})}
          theme={CODE_THEME_ID}
          beforeMount={(monaco) => defineTheme(monaco as Monaco)}
          onChange={(next) => onChange?.(next ?? "")}
          options={sharedEditorOptions({
            readOnly: readOnly || !onChange,
            minimap,
            lineNumbers,
          })}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-[12px] text-muted-foreground">
          正在加载编辑器...
        </div>
      )}
    </div>
  );
}
