import "./blueprint.css";
import { useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import type { Registry } from "../registry";
import type { BlueprintGraph } from "../types";
import { ActionMenu, type MenuOrigin } from "./action-menu";
import { Breadcrumb, IssuesStrip, Toolbar } from "./chrome";
import { CommentView } from "./comment-view";
import { ContextMenu } from "./context-menu";
import { HelpSheet } from "./help-sheet";
import { runCommand } from "./keyboard";
import { menuFor, type MenuTarget } from "./menu-items";
import { Minimap } from "./minimap";
import { NodeView } from "./node-view";
import { RenameField, type RenameTarget } from "./rename-field";
import { copyText, deleteSelected, pasteText } from "./commands";
import { isTypingTarget, matchShortcut } from "./shortcuts";
import { useBlueprint, type BlueprintHandle } from "./use-blueprint";
import { useCanvas } from "./use-canvas";
import { deriveView } from "./view-model";
import { Wires } from "./wires";

/**
 * <Blueprint>: UE5-style node graph editor.
 *
 *   <Blueprint registry={registry} value={graph} onChange={setGraph} />    controlled
 *   <Blueprint registry={registry} defaultValue={graph} />                 uncontrolled
 *   const bp = useBlueprint({ registry, initial }); <Blueprint editor={bp} />   full API
 *
 * Layers (back to front): grid (root background) > comments > wires (one svg) > nodes > live wire,
 * then screen-space overlays (marquee, tooltip, menus, chrome). Keys only act while this editor
 * has focus, so two editors on a page never clash.
 */

export interface BlueprintProps {
  readonly registry?: Registry;
  readonly value?: BlueprintGraph;
  readonly defaultValue?: BlueprintGraph;
  readonly onChange?: (graph: BlueprintGraph) => void;
  /** Use an editor from `useBlueprint` instead of the props above. */
  readonly editor?: BlueprintHandle;
  readonly readOnly?: boolean;
  /** Grid snap in graph units, 0 / 1 = off. Default 16. */
  readonly snap?: number;
  readonly minimap?: boolean;
  /** Below this zoom nodes drop pin labels and fields (title only); below 0.6x of it they become boxes. Default 0.5. */
  readonly lodThreshold?: number;
  /** Show the validation strip. Default true. */
  readonly issues?: boolean;
  readonly className?: string;
  readonly "aria-label"?: string;
  /** Extra overlay content (hints, badges) drawn over the canvas, under menus and the help sheet. */
  readonly children?: React.ReactNode;
}

export function Blueprint(props: BlueprintProps) {
  return props.editor ? <BlueprintView {...props} editor={props.editor} /> : <OwnedBlueprint {...props} />;
}

function OwnedBlueprint(props: BlueprintProps) {
  if (!props.registry) throw new Error("[Blueprint] pass `registry` (or `editor` from useBlueprint)");
  const ed = useBlueprint({
    registry: props.registry, initial: props.defaultValue,
    ...(props.value ? { value: props.value } : {}), ...(props.onChange ? { onChange: props.onChange } : {}),
  });
  return <BlueprintView {...props} editor={ed} />;
}

type Menu = { kind: "actions"; sx: number; sy: number; from?: MenuOrigin | undefined } | { kind: "context"; target: MenuTarget; sx: number; sy: number };

function BlueprintView({ editor: ed, readOnly = false, snap = 16, minimap = false, lodThreshold = 0.5, issues = true, className, children, ...rest }: BlueprintProps & { editor: BlueprintHandle }) {
  useSyncExternalStore(ed.subscribe, ed.version, ed.version);
  ed.readOnly = readOnly;
  ed.snap = snap;
  const root = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const marquee = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const live = useRef<SVGSVGElement>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [rename, setRename] = useState<RenameTarget | null>(null);
  const [help, setHelp] = useState(false);
  const pending = useRef<string | null>(null);

  const ui = {
    openActions: (sx: number, sy: number, from?: MenuOrigin) => { if (!ed.readOnly) setMenu({ kind: "actions", sx, sy, from }); },
    openContext: (target: MenuTarget, sx: number, sy: number) => setMenu({ kind: "context", target, sx, sy }),
    closeMenus: () => setMenu(null),
    rename: (t: RenameTarget) => { if (!ed.readOnly) setRename(t); },
  };
  const lod = useMemo(() => ({ low: lodThreshold, box: lodThreshold * 0.6 }), [lodThreshold]);
  const { space } = useCanvas(ed, { root, world, marquee, tip, live }, ui, lod);

  useLayoutEffect(() => {
    ed.el = root.current;
    ed.fit(ed.graph.nodes.map((n) => n.id));
    return () => { if (ed.el === root.current) ed.el = null; };
  }, [ed]);
  // a pan / zoom invalidates the screen position of an open rename field
  useLayoutEffect(() => ed.onViewport(() => setRename(null)), [ed]);

  const graph = ed.graph;
  const vm = deriveView(ed);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " && !isTypingTarget(e.target)) {
      e.preventDefault();
      space.current = true;
      if (root.current && !root.current.dataset.tool) root.current.dataset.tool = "space";
      return;
    }
    if (isTypingTarget(e.target)) return;
    const s = matchShortcut(e.nativeEvent);
    if (!s) return;
    if (s.native) {
      // the browser's copy / cut / paste event normally follows; fall back to memory if it does not
      pending.current = s.id;
      setTimeout(() => {
        if (pending.current !== s.id) return;
        pending.current = null;
        if (s.id === "paste") { if (ed.clip) pasteText(ed, ed.clip); return; }
        const text = copyText(ed);
        if (!text) return;
        ed.clip = text;
        void navigator.clipboard?.writeText(text).catch(() => undefined);
        if (s.id === "cut") deleteSelected(ed);
      }, 0);
      return;
    }
    e.preventDefault();
    runCommand(ed, s.id, {
      openActions: () => {
        const p = ed.pointer ?? ed.toGraph(120, 120);
        const v = ed.viewport;
        ui.openActions(p.x * v.z + v.x, p.y * v.z + v.y);
      },
      closeAll: () => { const had = menu || rename || help; setMenu(null); setRename(null); setHelp(false); return Boolean(had); },
      toggleHelp: () => setHelp((h) => !h),
      rename: ui.rename,
    });
  };
  const onKeyUp = (e: React.KeyboardEvent) => {
    if (e.key !== " ") return;
    space.current = false;
    if (root.current?.dataset.tool === "space") delete root.current.dataset.tool;
  };
  const onCopy = (e: React.ClipboardEvent, cut = false) => {
    if (isTypingTarget(e.target)) return;
    pending.current = null;
    const text = copyText(ed);
    if (!text) return;
    e.preventDefault();
    e.clipboardData.setData("text/plain", text);
    ed.clip = text;
    if (cut) deleteSelected(ed);
  };
  const onPaste = (e: React.ClipboardEvent) => {
    if (isTypingTarget(e.target)) return;
    pending.current = null;
    const text = e.clipboardData.getData("text/plain");
    if ((text && pasteText(ed, text)) || (ed.clip && pasteText(ed, ed.clip))) e.preventDefault();
  };

  const ctx = menu?.kind === "context" ? menuFor(ed, menu.target, ui) : undefined;
  return (
    <div ref={root} tabIndex={0} role="application" aria-roledescription="蓝图编辑器" aria-label={rest["aria-label"] ?? "蓝图编辑器"}
      className={cn("bp-root", className)} data-readonly={readOnly || undefined} data-focus-wires={vm.wires.near ? "" : undefined}
      onKeyDown={onKeyDown} onKeyUp={onKeyUp} onCopy={(e) => onCopy(e)} onCut={(e) => onCopy(e, true)} onPaste={onPaste}
      onBlur={() => { space.current = false; }}>
      <div ref={world} className="bp-world">
        {(graph.comments ?? []).map((c) => <CommentView key={c.id} comment={c} selected={ed.selection.comments.includes(c.id)} />)}
        <Wires graph={graph} registry={ed.registry} selected={vm.wires.selected} bad={vm.wires.bad} near={vm.wires.near} />
        {vm.nodes.map((n) => <NodeView key={n.node.id} ed={ed} readOnly={readOnly} {...n} />)}
        <svg ref={live} className="bp-wires" aria-hidden />
      </div>
      <div ref={marquee} className="bp-marquee" />
      <div ref={tip} className="bp-tip" role="status" />
      <Breadcrumb ed={ed} />
      <Toolbar ed={ed} onHelp={() => setHelp((h) => !h)} />
      {issues ? <IssuesStrip ed={ed} /> : null}
      {minimap ? <Minimap ed={ed} graph={graph} /> : null}
      {children}
      {graph.nodes.length === 0 && !menu ? (
        <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted-foreground">
          {readOnly ? "空图" : "右键或按 Tab 添加节点"}
        </p>
      ) : null}
      {menu?.kind === "actions" ? <ActionMenu ed={ed} sx={menu.sx} sy={menu.sy} from={menu.from} onClose={() => setMenu(null)} /> : null}
      {ctx && menu?.kind === "context" ? <ContextMenu title={ctx.title} items={ctx.items} sx={menu.sx} sy={menu.sy} host={root.current} onClose={() => setMenu(null)} /> : null}
      {rename ? <RenameField ed={ed} target={rename} onDone={() => { setRename(null); root.current?.focus(); }} /> : null}
      {help ? <HelpSheet onClose={() => { setHelp(false); root.current?.focus(); }} /> : null}
    </div>
  );
}
