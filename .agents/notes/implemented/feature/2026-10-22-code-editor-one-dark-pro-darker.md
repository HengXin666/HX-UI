# Agent Note: 代码编辑器用 monaco, 主题固定 One Dark Pro Darker

Status: implemented

Decision-ID: code-editor-one-dark-pro-darker

## Code

- `src/editor/CodeEditor.tsx`
- `docs/src/pages/CodeEditorPage.tsx`

## Problem

文档站与下游需要"像 VS Code 一样"的代码编辑器: 同一套语法着色, 多光标, 查找替换, 折叠。同时主题必须是 One Dark Pro Darker。约束有两层: 仓库门禁禁止 src 下的 .ts/.tsx 出现 hex 色值 (PROJECT-UI-HEX), 颜色只能来自 tokens.css; 组件库以源码形式被下游 Vite 打包, 不能假设有 CDN。

## Decision

- 用 monaco-editor (VS Code 内核) 加 @monaco-editor/react 的加载器, 通过 loader.config 指向本地安装的 monaco, 关掉默认 CDN 路径; 组件挂载后才动态 import, 不进首屏。
- 主题色板放在 tokens.css 的 --code-odp-* 令牌里, monaco-theme.ts 运行期用 getComputedStyle 读出来注册成名为 one-dark-pro-darker 的主题; 回退值是 One Dark Pro Darker 的官方取值, 只用于没挂 tokens.css 的宿主。
- worker 用 new URL(monaco-editor/esm/vs/editor/editor.worker.js, import.meta.url) 交给使用方打包器解析, 拿不到时 monaco 退回主线程, 编辑功能不依赖 worker。
- 编辑器与 CodeBlock 分工: CodeBlock 保持 shiki 只读展示 (静态高亮, 适合文档片段), CodeEditor 负责可编辑场景。两者共用同一套配色, 取色路径不同。
- 依赖登记在 scripts/quality/approvals.json 的 APR-dependency-ai-stream-editor。

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是仓库已有 CodeBlock, 它已经能高亮代码。否决: 它没有光标, 没有编辑, 没有折叠, 需求字面上要的是"代码编辑器"。
- 用 CodeMirror 6: 体积更小, 主题也能自定义。否决: 用户要求"跟 VS Code 一样", monaco 就是那一份内核; 用 CodeMirror 只能做到外观接近, 快捷键与语言服务都要另配。
- 在组件里内联一份 hex 色板: 实现最简单。否决: 直接违反 PROJECT-UI-HEX, 而且换肤时颜色会与页面脱节。
- 把主题色从 shiki 主题文件里读: 与 CodeBlock 同源。否决: shiki 与 monaco 的 token 命名不同, 且 tokens.css 已经是本仓颜色的唯一来源。

## Consequences

首屏不受影响 (动态加载), 但首次打开代码编辑器要下载 monaco 与 worker, 内网离线部署也不会再依赖 CDN。代价是多两个依赖, 且 monaco 的 token 规则只覆盖常见语法类别; 需要更细的着色时改 tokens.css 里的令牌或加 token 规则。加载器与选项抽到同目录的 use-monaco.ts 和 editor-options.ts, 仍由 CodeEditor 引用本决策。左右对比是另一个组件, 见 2026-10-31-monaco-diff-editor。
