"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import Editor, { loader, type OnMount } from "@monaco-editor/react";
import { cn } from "../primitives/utils";
import { CODE_THEME_ID, defineTheme, type Monaco } from "./monaco-theme";

/**
 * 代码编辑器  VS Code 的内核 (monaco) 加 One Dark Pro Darker 主题。
 *
 * ## 为什么是 monaco 而不是 textarea 或 CodeMirror
 *
 * 需求是"和 VS Code 一样": 同一套语法引擎, 同一套快捷键 (多光标, 行移动, 查找替换),
 * 同一套折叠。monaco 就是 VS Code 的那份内核, 用它等于直接复用编辑器本体;
 * 换别的库只能做到"看起来像", 做不到"用起来一样"。
 *
 * ## 三条实现上的硬约束
 *
 * 1. **不走 CDN**。@monaco-editor/react 默认从 jsdelivr 拉 monaco, 离线环境与
 *    内网部署都会失败; 这里用 loader.config 指到本地包, 由使用方的打包器处理。
 * 2. **懒加载**。monaco 体积大, 不能进首屏。组件挂载后才动态 import, 编辑区
 *    先渲染一个等高骨架。
 * 3. **主题从令牌读**。颜色只在 tokens.css 的 --code-odp-* 里, 这里读出来注册,
 *    不在组件里抄色板 (那也是门禁 PROJECT-UI-HEX 的要求)。
 *
 * worker 由使用方的打包器提供: Vite 下用 new URL(...) 建立 editor.worker,
 * webpack 下用 worker-loader。拿不到时 monaco 会退化成主线程计算, 编辑仍可用。
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

interface MonacoEnvironmentShape {
  getWorker?: (moduleId: string, label: string) => Worker;
}

/**
 * 装 monaco 的 worker 钩子 (只在还没有别人装过时装).
 *
 * worker 必须由使用方提供: 它依赖具体打包器的语法 (Vite 的 ?worker, webpack 的
 * worker-loader), 库自己 new URL 一个裸包名在构建期解析不了。没有 worker 时 monaco
 * 退回主线程计算, 编辑与着色都正常, 只有大文件的语言服务慢一点。
 */
function installEnvironment(createWorker?: (label: string) => Worker): void {
  if (!createWorker) {
    return;
  }
  const globalObject = self as unknown as { MonacoEnvironment?: MonacoEnvironmentShape };
  if (globalObject.MonacoEnvironment?.getWorker) {
    return;
  }
  globalObject.MonacoEnvironment = { getWorker: (_moduleId: string, label: string) => createWorker(label) };
}

/**
 * .agents/notes/implemented/feature/2026-10-22-code-editor-one-dark-pro-darker.md
 */
export function CodeEditor({
  value,
  onChange,
  language = "typescript",
  height = 320,
  readOnly = false,
  minimap = false,
  lineNumbers = true,
  path,
  createWorker,
  className,
}: CodeEditorProps): JSX.Element {
  const [ready, setReady] = useState(false);
  const monacoRef = useRef<Monaco | null>(null);

  useEffect(() => {
    let alive = true;
    void import("monaco-editor").then((monaco) => {
      if (!alive) {
        return;
      }
      monacoRef.current = monaco;
      installEnvironment(createWorker);
      loader.config({ monaco });
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const onMount: OnMount = (editor) => {
    editor.updateOptions({ readOnly, readOnlyMessage: { value: "只读示例" } });
  };

  return (
    <div
      data-slot="code-editor"
      className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}
      style={{ height }}
    >
      {ready ? (
        <Editor
          height="100%"
          language={language}
          value={value}
          {...(path ? { path } : {})}
          theme={CODE_THEME_ID}
          beforeMount={(monaco) => defineTheme(monaco as Monaco)}
          onMount={onMount}
          onChange={(next) => onChange?.(next ?? "")}
          options={{
            minimap: { enabled: minimap },
            lineNumbers: lineNumbers ? "on" : "off",
            fontSize: 12.5,
            fontFamily: "var(--font-mono, ui-monospace), SFMono-Regular, Menlo, monospace",
            fontLigatures: true,
            padding: { top: 12, bottom: 12 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            renderLineHighlight: "all",
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            guides: { indentation: true },
            scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
            overviewRulerLanes: 0,
          }}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-[12px] text-muted-foreground">
          正在加载编辑器...
        </div>
      )}
    </div>
  );
}
