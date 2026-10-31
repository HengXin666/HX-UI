"use client";

import { useEffect, useRef, type JSX } from "react";
import { DiffEditor as MonacoDiffEditor } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { cn } from "../primitives/utils";
import { CODE_EDITOR_DEFAULTS, CODE_EDITOR_FILL, CODE_EDITOR_OPTIONS, DIFF_SIDE } from "../constants/editor";
import { TAG } from "../constants/ui";
import { sharedEditorOptions } from "./editor-options";
import { CODE_THEME_ID, defineTheme, type Monaco } from "./monaco-theme";
import { useMonacoReady } from "./use-monaco";

export type DiffSide = (typeof DIFF_SIDE)[keyof typeof DIFF_SIDE];

/** 挂在 diff 某一行下面的只读说明. 不打开聊天, 也不要求看的人自己去对上下文. */
export interface DiffLineNote {
  readonly id: string;
  /** 行号从 1 开始, 指 side 那一侧的模型. */
  readonly line: number;
  readonly side?: DiffSide;
  readonly text: string;
}

export interface DiffEditorProps {
  readonly original: string;
  readonly modified: string;
  readonly language?: string;
  readonly height?: number | string;
  /** 审查场景默认只读. 要改右侧时显式传 false. */
  readonly readOnly?: boolean;
  readonly minimap?: boolean;
  readonly lineNumbers?: boolean;
  /** false 时改成行内 diff. 默认左右对比. */
  readonly renderSideBySide?: boolean;
  /** 挂上之后滚到修改侧的这一行. */
  readonly revealLine?: number;
  readonly notes?: readonly DiffLineNote[];
  readonly createWorker?: (label: string) => Worker;
  readonly className?: string;
}

const NOTE_CLASS = "border-t border-border bg-muted/50 px-3 py-1 text-[12px] text-foreground";

const EMPTY_NOTES: readonly DiffLineNote[] = [];

function notesOn(notes: readonly DiffLineNote[], side: DiffSide): DiffLineNote[] {
  return notes.filter((note) => (note.side ?? DIFF_SIDE.modified) === side && note.line > 0);
}

function applyNotes(
  instance: editor.IStandaloneDiffEditor,
  notes: readonly DiffLineNote[],
  revealLine: number | undefined,
  zones: Record<DiffSide, string[]>,
): void {
  zones[DIFF_SIDE.original] = paintSide(
    instance.getOriginalEditor(),
    zones[DIFF_SIDE.original],
    notesOn(notes, DIFF_SIDE.original),
  );
  zones[DIFF_SIDE.modified] = paintSide(
    instance.getModifiedEditor(),
    zones[DIFF_SIDE.modified],
    notesOn(notes, DIFF_SIDE.modified),
  );
  if (revealLine && revealLine > 0) {
    instance.getModifiedEditor().revealLineInCenter(revealLine);
  }
}

/** 把说明插进行下, 并清掉上一轮的 zone. 返回这一轮的 zone id. */
function paintSide(
  code: editor.IStandaloneCodeEditor,
  previous: readonly string[],
  notes: readonly DiffLineNote[],
): string[] {
  const next: string[] = [];
  code.changeViewZones((accessor) => {
    for (const id of previous) {
      accessor.removeZone(id);
    }
    for (const note of notes) {
      const node = document.createElement(TAG.div);
      node.className = NOTE_CLASS;
      node.dataset.noteId = note.id;
      node.textContent = note.text;
      next.push(
        accessor.addZone({
          afterLineNumber: note.line,
          heightInPx: CODE_EDITOR_OPTIONS.noteZonePx,
          domNode: node,
        }),
      );
    }
  });
  return next;
}

/**
 * monaco 的 diff 编辑器. 与 CodeEditor 同一套本地加载和主题, 只是同时打开原文和修改后的文本.
 * .agents/notes/implemented/feature/2026-10-31-monaco-diff-editor.md
 */
export function DiffEditor({
  original,
  modified,
  language = CODE_EDITOR_DEFAULTS.language,
  height = CODE_EDITOR_DEFAULTS.height,
  readOnly = true,
  minimap = false,
  lineNumbers = true,
  renderSideBySide = true,
  revealLine,
  notes = EMPTY_NOTES,
  createWorker,
  className,
}: DiffEditorProps): JSX.Element {
  const ready = useMonacoReady(createWorker);
  const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  const zones = useRef<Record<DiffSide, string[]>>({
    [DIFF_SIDE.original]: [],
    [DIFF_SIDE.modified]: [],
  });

  useEffect(() => {
    const instance = editorRef.current;
    if (instance) {
      applyNotes(instance, notes, revealLine, zones.current);
    }
  }, [notes, revealLine]);

  return (
    <div
      data-slot="diff-editor"
      className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}
      style={{ height }}
    >
      {ready ? (
        <MonacoDiffEditor
          height={CODE_EDITOR_FILL}
          language={language}
          original={original}
          modified={modified}
          theme={CODE_THEME_ID}
          beforeMount={(monaco) => defineTheme(monaco as Monaco)}
          onMount={(instance) => {
            editorRef.current = instance;
            applyNotes(instance, notes, revealLine, zones.current);
          }}
          options={{
            ...sharedEditorOptions({ readOnly, minimap, lineNumbers }),
            renderSideBySide,
            overviewRulerLanes: 1,
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
