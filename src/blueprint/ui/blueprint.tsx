"use client";

import "./blueprint.css";
import { useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import type { Registry } from "../registry";
import type { BlueprintGraph } from "../types";
import type { MenuOrigin } from "./action-menu";
import { Breadcrumb, IssuesStrip, Toolbar } from "./chrome";
import { CommentView } from "./comment-view";
import { runCommand } from "./keyboard";
import type { MenuTarget } from "./menu-items";
import { Minimap } from "./minimap";
import { NodeView } from "./node-view";
import { RenameField, type RenameTarget } from "./rename-field";
import { copyText, deleteSelected, pasteText } from "./commands";
import { isTypingTarget, matchShortcut } from "./shortcuts";
import { useBlueprint, type BlueprintHandle } from "./use-blueprint";
import { useCanvas } from "./use-canvas";
import { deriveView } from "./view-model";
import { Wires } from "./wires";
import { lazyPart } from "./lazy-part";
import { DEFAULT_PLACE_KEYS } from "./shortcuts";
export { DEFAULT_PLACE_KEYS };

// Optional pieces are separate chunks: debug UI, variables panel and Find load when switched on or
// opened; menus and the help sheet are fetched right after mount (and at once on pointer or focus).
const debugPart = lazyPart(() => import("./debug-layer"));
const varsPart = lazyPart(() => import("./variables-panel"));
const findPart = lazyPart(() => import("./find-panel"));
const actionPart = lazyPart(() => import("./action-menu"));
const contextPart = lazyPart(() => import("./context-host"));
const helpPart = lazyPart(() => import("./help-sheet"));
const warm = () => {
  void actionPart.load();
  void contextPart.load();
  void helpPart.load();
  void findPart.load();
};

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
  /**
   * Mouse wheel over the canvas. "ctrl" (default, friendly to scrolling pages): zoom with Ctrl / Cmd
   * held, trackpad pinch, or a plain wheel once the editor has focus; otherwise the page scrolls.
   * "zoom": the wheel always zooms (full-screen editors).
   */
  readonly wheel?: "zoom" | "ctrl";
  /**
   * Debugging: a run bar (运行 / 单步 / 继续 / 停止), exec-flow pulses, breakpoints (F9), watched pins
   * and last values on hover. Loaded lazily. Pass an object for initial breakpoints (node ids, or
   * "<subgraphId>/<nodeId>") and the per-hop delay in ms (150–250 reads well).
   */
  readonly debug?: boolean | {
    readonly breakpoints?: readonly string[];
    readonly stepMs?: number;
    /** Show the run bar (default true; BlueprintWorkbench puts the controls in its own toolbar). */
    readonly bar?: boolean;
  };
  /** Graph variables side panel (drag a variable in = Get, Alt-drag = Set). Loaded lazily. */
  readonly variables?: boolean;
  /**
   * Hold a key and left-click empty canvas to drop a node there (UE5: B = Branch, S = Sequence,
   * D = Delay). Keys are single lowercase letters, values node type ids; types missing from the
   * registry are ignored. Default { b: "flow.branch", s: "flow.sequence", d: "flow.delay" }; false = off.
   */
  readonly placeKeys?: Readonly<Record<string, string>> | false;
  /** The floating toolbar (top right). Default true; BlueprintWorkbench has its own. */
  readonly toolbar?: boolean;
  /** The floating breadcrumb (top left). Default true. */
  readonly breadcrumb?: boolean;
  /** Ctrl+F and the toolbar's find button call this instead of opening the built-in Find overlay. */
  readonly onFind?: () => void;
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

function BlueprintView({
  editor: ed, readOnly = false, snap = 16, minimap = false, lodThreshold = 0.5, issues = true, wheel = "ctrl", debug = false, variables = false,
  placeKeys = DEFAULT_PLACE_KEYS, toolbar = true, breadcrumb = true, onFind,
  className, children, ...rest
}: BlueprintProps & { editor: BlueprintHandle }) {
  useSyncExternalStore(ed.subscribe, ed.version, ed.version);
  ed.readOnly = readOnly;
  ed.snap = snap;
  ed.wheel = wheel;
  ed.debugEnabled = Boolean(debug);
  const uid = useId();
  const domId = (node: string) => `${uid}-n-${node.replace(/\s/g, "_")}`;
  const root = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const marquee = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const live = useRef<SVGSVGElement>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [rename, setRename] = useState<RenameTarget | null>(null);
  const [help, setHelp] = useState(false);
  const [find, setFind] = useState(false);
  const [varsOpen, setVarsOpen] = useState<boolean | undefined>(undefined);
  const pending = useRef<string | null>(null);
  const DebugLayer = debugPart.use(Boolean(debug))?.default;
  const VariablesPanel = varsPart.use(Boolean(variables && varsOpen))?.default;
  const FindPanel = findPart.use(find)?.default;
  const ActionMenu = actionPart.use(menu?.kind === "actions")?.ActionMenu;
  const ContextHost = contextPart.use(menu?.kind === "context")?.default;
  const HelpSheet = helpPart.use(help)?.HelpSheet;

  const ui = {
    openActions: (sx: number, sy: number, from?: MenuOrigin) => { if (!ed.readOnly) setMenu({ kind: "actions", sx, sy, from }); },
    openContext: (target: MenuTarget, sx: number, sy: number) => setMenu({ kind: "context", target, sx, sy }),
    closeMenus: () => setMenu(null),
    rename: (t: RenameTarget) => { if (!ed.readOnly) setRename(t); },
  };
  const lod = useMemo(() => ({ low: lodThreshold, box: lodThreshold * 0.6 }), [lodThreshold]);
  const { space, cancel } = useCanvas(ed, { root, world, marquee, tip, live }, ui, lod);

  useLayoutEffect(() => {
    ed.el = root.current;
    // the variables panel starts open when there is room for it; framing leaves it room
    const open = variables && (root.current?.clientWidth ?? 0) >= 720;
    ed.fitInset = { ...ed.fitInset, left: open ? 272 : 0 };
    ed.fit(ed.graph.nodes.map((n) => n.id));
    setVarsOpen((v) => v ?? open);
    return () => { if (ed.el === root.current) ed.el = null; };
  }, [ed]);
  useLayoutEffect(() => {
    ed.fitInset = { ...ed.fitInset, left: variables && varsOpen ? 272 : 0 };
  }, [ed, variables, varsOpen]);
  const dbgOpts = typeof debug === "object" ? debug : undefined;
  useLayoutEffect(() => {
    if (dbgOpts?.stepMs !== undefined) ed.stepMs = dbgOpts.stepMs;
    dbgOpts?.breakpoints?.forEach((k) => ed.breakpoints.add(k));
    // initial breakpoints only: later toggles belong to the user
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ed]);
  // fetch the menu / help chunks shortly after mount (and at once on pointer or focus), off the critical path
  useLayoutEffect(() => {
    const t = setTimeout(warm, 300);
    return () => clearTimeout(t);
  }, []);
  // a pan / zoom invalidates the screen position of an open rename field
  useLayoutEffect(() => ed.onViewport(() => setRename(null)), [ed]);

  const graph = ed.graph;
  const vm = deriveView(ed);

  const setPlacing = (type: string | undefined) => {
    ed.placing = type;
    const el = root.current;
    if (!el) return;
    if (type) { if (!el.dataset.tool) el.dataset.tool = "place"; } else if (el.dataset.tool === "place") delete el.dataset.tool;
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && cancel.current()) {
      e.preventDefault();
      return;
    }
    // B / S / D held: the next click on empty canvas places that node
    const place = placeKeys && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && !isTypingTarget(e.target) ? placeKeys[e.key.toLowerCase()] : undefined;
    if (place && ed.registry.node(place) && !readOnly) {
      e.preventDefault();
      setPlacing(place);
      return;
    }
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
    const handled = runCommand(ed, s.id, {
      openActions: () => {
        const p = ed.pointer ?? ed.toGraph(120, 120);
        const v = ed.viewport;
        ui.openActions(p.x * v.z + v.x, p.y * v.z + v.y);
      },
      closeAll: () => { const had = menu || rename || help || find; setMenu(null); setRename(null); setHelp(false); setFind(false); return Boolean(had); },
      toggleHelp: () => setHelp((h) => !h),
      rename: ui.rename,
      openFind: () => (onFind ? onFind() : setFind(true)),
      debug: Boolean(debug),
    }, e.key);
    if (handled !== false) e.preventDefault();
  };
  const onKeyUp = (e: React.KeyboardEvent) => {
    if (placeKeys && ed.placing && placeKeys[e.key.toLowerCase()] === ed.placing) setPlacing(undefined);
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

  return (
    <div ref={root} tabIndex={0} role="application" aria-roledescription="蓝图编辑器" aria-label={rest["aria-label"] ?? "蓝图编辑器"}
      aria-activedescendant={vm.active !== undefined ? domId(vm.active) : undefined}
      className={cn("bp-root", className)} data-readonly={readOnly || undefined} data-help={help || undefined} data-focus-wires={vm.wires.near ? "" : undefined}
      onKeyDown={onKeyDown} onKeyUp={onKeyUp} onCopy={(e) => onCopy(e)} onCut={(e) => onCopy(e, true)} onPaste={onPaste}
      onBlur={() => { space.current = false; setPlacing(undefined); }} onPointerEnter={warm} onFocus={warm}>
      <div ref={world} className="bp-world">
        {(graph.comments ?? []).map((c) => <CommentView key={c.id} comment={c} selected={ed.selection.comments.includes(c.id)} />)}
        <Wires graph={graph} registry={ed.registry} selected={vm.wires.selected} bad={vm.wires.bad} near={vm.wires.near} />
        {vm.nodes.map((n) => <NodeView key={n.node.id} ed={ed} readOnly={readOnly} domId={domId(n.node.id)} {...n} />)}
        <svg ref={live} className="bp-wires" aria-hidden />
      </div>
      <div ref={marquee} className="bp-marquee" />
      <div ref={tip} className="bp-tip" role="status" />
      {breadcrumb ? <Breadcrumb ed={ed} /> : null}
      {toolbar ? (
        <Toolbar ed={ed} hidden={help} onHelp={() => setHelp((h) => !h)} find={find} onFind={() => (onFind ? onFind() : setFind((f) => !f))}
          vars={variables ? { open: Boolean(varsOpen), toggle: () => setVarsOpen((v) => !v) } : undefined} />
      ) : null}
      {issues ? <IssuesStrip ed={ed} /> : null}
      {minimap ? <Minimap ed={ed} graph={graph} /> : null}
      {variables && varsOpen && VariablesPanel ? <VariablesPanel editor={ed} docked onClose={() => { setVarsOpen(false); root.current?.focus(); }} /> : null}
      {find && FindPanel ? <FindPanel ed={ed} onClose={() => { setFind(false); root.current?.focus(); }} /> : null}
      {debug && DebugLayer ? <DebugLayer ed={ed} minimap={minimap} bar={dbgOpts?.bar !== false} /> : null}
      <div role="status" aria-live="polite" className="bp-notice" data-show={ed.notice ? "" : undefined}>{ed.notice}</div>
      {children}
      {graph.nodes.length === 0 && !menu ? (
        <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted-foreground">
          {readOnly ? "空图" : "右键或按 Tab 添加节点"}
        </p>
      ) : null}
      {menu?.kind === "actions" && ActionMenu ? <ActionMenu ed={ed} sx={menu.sx} sy={menu.sy} from={menu.from} onClose={() => setMenu(null)} /> : null}
      {menu?.kind === "context" && ContextHost ? <ContextHost ed={ed} target={menu.target} ui={ui} sx={menu.sx} sy={menu.sy} host={root.current} onClose={() => setMenu(null)} /> : null}
      {rename ? <RenameField ed={ed} target={rename} onDone={() => { setRename(null); root.current?.focus(); }} /> : null}
      {help && HelpSheet ? <HelpSheet onClose={() => { setHelp(false); root.current?.focus(); }} /> : null}
    </div>
  );
}
