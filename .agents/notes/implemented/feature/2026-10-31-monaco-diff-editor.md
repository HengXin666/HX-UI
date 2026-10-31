# Agent Note: diff 用 monaco 的 DiffEditor, 不另做一套

Status: implemented

Decision-ID: monaco-diff-editor

## Code

- `src/editor/DiffEditor.tsx`
- `docs/src/pages/CodeEditorPage.tsx`

## Problem

审查页要展示一段改动: 原文和修改后的文本左右对照, 增删行能看出来, 并且能在某一行下面挂一条只读说明. 库里已经有 VS Code 内核 `CodeEditor` (monaco), monaco 自己也带 `DiffEditor`. 调用方却只能打开一份文本, 所以 diff 画不出来.

## Decision

- 新增 `DiffEditor`, 走和 `CodeEditor` 相同的本地 monaco 加载与 One Dark Pro Darker 主题, 渲染 `@monaco-editor/react` 的 `DiffEditor`. 入参是 `original` 与 `modified`. 默认只读, 默认左右对比.
- 行上说明用 monaco 的 view zone 插在对应行下面, 行号从 1 开始, 用 `side` 指明原文侧或修改侧. 组件不提供聊天, 也不写「请确认上下文」.
- `revealLine` 滚到修改侧的那一行.
- `CodeBlock` 继续负责单段静态高亮. `agent/DiffView` 继续负责已经切好的 `add/del/ctx` 行, 它没有语法着色, 也不是 VS Code 内核. 需要和 VS Code 一样看 diff 时用这个组件.

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是 `agent/DiffView` 已经能逐行标增删. 否决: 它不是 monaco, 没有左右对比, 没有语法着色, 也不能把说明钉在某一行下面. 用户要的是 VS Code 控件本身的 diff.
- 在 `CodeEditor` 上加一个 `original` 参数, 有原文就内部换成 diff: 少一个导出. 否决: 单文件编辑器的入参是一份 `value`, 塞进对比会让只读和可编辑两种语义叠在一起, 调用方分不清现在打开的是哪一种.
- 用 shiki 自己画 unified diff: 不增加 monaco 的用法. 否决: 审查要的就是 VS Code 那份对比, 包括行号, 滚动和主题, 再画一套会和 `CodeEditor` 分叉.

## Consequences

首次打开 diff 和打开编辑器一样要加载 monaco, 首屏仍然不包含它. 行上说明是 view zone, 长文本会被固定高度裁切, 调用方应传入一行能读完的说明. 旧版 `CodeEditor` 的只读提示和单文件行为不变.
