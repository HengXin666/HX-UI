"use client";

import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import type { Registry } from "../registry";
import { fromText as parseText, toText as printText } from "../text";
import type { BlueprintGraph } from "../types";
import { copyText, pasteText } from "./commands";
import { BlueprintEditor } from "./editor";

/**
 * React handle on a blueprint editor.
 *
 *   const bp = useBlueprint({ registry, initial: graph });
 *   bp.apply([{ op: "addNode", type: "math.add", at: [200, 80] }]);   // one undo step
 *   <Blueprint editor={bp} />
 *
 * The returned object is the same `BlueprintEditor` instance on every render (stable for deps and
 * callbacks); reading `bp.graph` / `bp.selection` during render is always current because the hook
 * re-renders its component on every document, selection or path change. Pan / zoom do not re-render.
 */

export interface UseBlueprintOptions {
  readonly registry: Registry;
  /** Starting graph (uncontrolled). */
  readonly initial?: BlueprintGraph;
  /** Controlled value: when it differs from the editor's document, the editor adopts it. */
  readonly value?: BlueprintGraph;
  readonly onChange?: (graph: BlueprintGraph) => void;
}

export type BlueprintHandle = BlueprintEditor & {
  /** Whole document as text (or only the selection). Same format as the clipboard. */
  toText(selectionOnly?: boolean): string;
  /** Replace the document with parsed text (one undo step), or paste it at the pointer. */
  fromText(text: string, mode?: "replace" | "paste"): { ok: boolean; errors: readonly string[] };
};

const EMPTY: BlueprintGraph = { nodes: [], edges: [] };

/** Add the text helpers to an editor instance (kept off the class so it stays logic-only). */
export function withTextApi(ed: BlueprintEditor): BlueprintHandle {
  const h = ed as BlueprintHandle;
  if (typeof h.toText === "function") return h;
  h.toText = (selectionOnly = false) => (selectionOnly ? copyText(ed) ?? "" : printText(ed.root));
  h.fromText = (text, mode = "replace") => {
    if (mode === "paste") return pasteText(ed, text) ? { ok: true, errors: [] } : { ok: false, errors: ["不是蓝图文本"] };
    const r = parseText(text);
    if (!r.ok || !r.graph) return { ok: false, errors: r.errors };
    if (!ed.readOnly) ed.history.set(r.graph, { label: "导入文本" });
    return { ok: true, errors: [] };
  };
  return h;
}

export function useBlueprint(opts: UseBlueprintOptions): BlueprintHandle {
  const [ed] = useState(() => withTextApi(new BlueprintEditor(opts.registry, opts.value ?? opts.initial ?? EMPTY)));
  useSyncExternalStore(ed.subscribe, ed.version, ed.version);
  ed.onChange = opts.onChange;
  useLayoutEffect(() => {
    if (opts.value) ed.syncValue(opts.value);
  }, [ed, opts.value]);
  return ed;
}
