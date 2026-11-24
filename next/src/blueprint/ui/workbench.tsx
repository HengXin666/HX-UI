import "./blueprint.css";
import {
  CircleCheck, CircleStop, CircleX, Crosshair, Eraser, FunctionSquare, GitFork, Keyboard, Maximize, Maximize2, Minimize2, PanelBottom, PanelLeft, PanelRight,
  Pause, Play, Redo2, Save, Search, SquareStack, StepForward, Undo2, Workflow, X, ZoomIn, ZoomOut, AlertTriangle,
} from "lucide-react";
import { m } from "motion/react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { callStackOf } from "../subgraph";
import type { BlueprintGraph } from "../types";
import { Blueprint, type BlueprintProps } from "./blueprint";
import type { DockTab } from "./debug-dock";
import { lazyPart } from "./lazy-part";
import { Splitter } from "./splitter";
import { useBlueprint, type BlueprintHandle } from "./use-blueprint";

// The panels are their own chunks: the shell (toolbar, splitters, tabs) paints at once.
const myPart = lazyPart(() => import("./my-blueprint"));
const detailsPart = lazyPart(() => import("./details-panel"));
const dockPart = lazyPart(() => import("./debug-dock"));
const helpPart = lazyPart(() => import("./help-sheet"));

/**
 * <BlueprintWorkbench>: the whole UE5-style blueprint editor as one component.
 *
 *   top      toolbar: compile status, save, undo / redo, run / step / continue / stop / run to
 *            cursor, find, zoom, layout toggles, shortcuts, full screen
 *   left     我的蓝图 (graphs, functions, macros, variables, locals, libraries)
 *   centre   tabs of open graphs over the canvas (<Blueprint>), breadcrumb inside it
 *   right    细节 (context-sensitive details)
 *   bottom   编译结果 / 查找结果 / 调用栈 / 监视 / 断点
 *
 * Every panel is resizable with a keyboard-accessible splitter and collapsible; sizes persist with
 * `storageKey`. Below 900px of width the side panels become drawers. `fullscreen` (default) fills
 * the viewport (100dvh); `fullscreen={false}` fills its parent instead. All parts share one
 * BlueprintEditor (pass `editor` from useBlueprint to drive it), and each is exported on its own
 * from "@/blueprint/ui/panels".
 */

export interface BlueprintWorkbenchProps extends Pick<BlueprintProps, "registry" | "value" | "defaultValue" | "onChange" | "readOnly" | "snap" | "minimap" | "lodThreshold" | "wheel" | "placeKeys"> {
  readonly editor?: BlueprintHandle;
  /** Fill the viewport (100dvh). false: fill the parent (give it a height). Default true. */
  readonly fullscreen?: boolean;
  /** Toolbar title. Default: the document name (graph settings), else "蓝图". */
  readonly title?: string;
  /** Persist panel sizes and open / closed state in localStorage under this key. */
  readonly storageKey?: string;
  /** Which panels start open (wide layouts). Default all three. */
  readonly panels?: { readonly left?: boolean; readonly right?: boolean; readonly bottom?: boolean };
  /** Debugging (run controls, breakpoints, call stack, watches). Default true. */
  readonly debug?: boolean | { readonly breakpoints?: readonly string[]; readonly stepMs?: number };
  /** Shows a 保存 button and binds Ctrl+S. */
  readonly onSave?: (graph: BlueprintGraph) => void;
  /** Extra toolbar content, before the layout toggles. */
  readonly toolbarEnd?: ReactNode;
  readonly className?: string;
  readonly "aria-label"?: string;
}

interface Layout {
  left: number; right: number; bottom: number;
  open: { left: boolean; right: boolean; bottom: boolean };
}

const DEFAULTS = { left: 264, right: 312, bottom: 208 };
const LIMITS = { left: [200, 480], right: [240, 560], bottom: [120, 520] } as const;

function readLayout(key: string | undefined, panels: BlueprintWorkbenchProps["panels"]): Layout {
  const base: Layout = { ...DEFAULTS, open: { left: panels?.left ?? true, right: panels?.right ?? true, bottom: panels?.bottom ?? true } };
  if (!key || typeof localStorage === "undefined") return base;
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? "null") as Partial<Layout> | null;
    if (!raw) return base;
    const num = (v: unknown, k: keyof typeof LIMITS) => (typeof v === "number" ? Math.min(LIMITS[k][1], Math.max(LIMITS[k][0], v)) : base[k]);
    return { left: num(raw.left, "left"), right: num(raw.right, "right"), bottom: num(raw.bottom, "bottom"), open: { ...base.open, ...(raw.open ?? {}) } };
  } catch {
    return base;
  }
}

export function BlueprintWorkbench(props: BlueprintWorkbenchProps) {
  return props.editor ? <Workbench {...props} editor={props.editor} /> : <OwnedWorkbench {...props} />;
}

function OwnedWorkbench(props: BlueprintWorkbenchProps) {
  if (!props.registry) throw new Error("[BlueprintWorkbench] pass `registry` (or `editor` from useBlueprint)");
  const ed = useBlueprint({
    registry: props.registry, initial: props.defaultValue,
    ...(props.value ? { value: props.value } : {}), ...(props.onChange ? { onChange: props.onChange } : {}),
  });
  return <Workbench {...props} editor={ed} />;
}

const TB = "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-pressed:bg-accent aria-pressed:text-foreground";
const SEP = <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-border max-[599px]:mx-0.5" />;

function Workbench({
  editor: ed, fullscreen = true, title, storageKey, panels, debug = true, onSave, toolbarEnd, className,
  readOnly, snap, minimap, lodThreshold, wheel, placeKeys, ...rest
}: BlueprintWorkbenchProps & { editor: BlueprintHandle }) {
  useSyncExternalStore(ed.subscribe, ed.version, ed.version);
  const uid = useId();
  const root = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout>(() => readLayout(storageKey, panels));
  // measured before the body mounts, so the canvas frames the graph at its real size
  const [measured, setMeasured] = useState<number | undefined>(undefined);
  const width = measured ?? 1280;
  const [drawer, setDrawer] = useState<"left" | "right" | null>(null);
  const [tab, setTab] = useState<DockTab>("issues");
  const [query, setQuery] = useState("");
  const [tabs, setTabs] = useState<string[]>([]);
  const [help, setHelp] = useState(false);
  const [isFull, setIsFull] = useState(false);
  const narrow = width < 900;
  const compact = width < 600;
  const MyBlueprint = myPart.use(narrow ? drawer === "left" : layout.open.left)?.MyBlueprintPanel;
  const Details = detailsPart.use(narrow ? drawer === "right" : layout.open.right)?.DetailsPanel;
  const Dock = dockPart.use(layout.open.bottom)?.DebugDock;
  const HelpSheet = helpPart.use(help)?.HelpSheet;

  // ---------------------------------------------------------------- size, persistence
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const w = el.clientWidth;
    // phones: the dock starts closed so the canvas keeps the screen
    const stored = storageKey && typeof localStorage !== "undefined" ? localStorage.getItem(storageKey) : null;
    if (w < 600 && !stored) setLayout((l) => ({ ...l, open: { ...l.open, bottom: false } }));
    setMeasured(w);
    const ro = new ResizeObserver(([e]) => setMeasured(e!.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!storageKey) return;
    const t = setTimeout(() => { try { localStorage.setItem(storageKey, JSON.stringify(layout)); } catch { /* private mode */ } }, 200);
    return () => clearTimeout(t);
  }, [layout, storageKey]);
  useEffect(() => {
    const on = () => setIsFull(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  // warm the panel chunks right after the shell paints
  useEffect(() => {
    const t = setTimeout(() => { void myPart.load(); void detailsPart.load(); void dockPart.load(); }, 200);
    return () => clearTimeout(t);
  }, []);

  const setSize = (k: "left" | "right" | "bottom", v: number) => setLayout((l) => ({ ...l, [k]: v }));
  const toggle = (k: "left" | "right" | "bottom") => {
    if (narrow && k !== "bottom") return setDrawer((d) => (d === k ? null : k));
    setLayout((l) => ({ ...l, open: { ...l.open, [k]: !l.open[k] } }));
  };
  const openDock = (t: DockTab) => {
    setTab(t);
    setLayout((l) => (l.open.bottom ? l : { ...l, open: { ...l.open, bottom: true } }));
  };
  const openFind = useCallback((q?: string) => {
    if (q !== undefined) setQuery(q);
    openDock("find");
    requestAnimationFrame(() => root.current?.querySelector<HTMLInputElement>("[data-dock-find]")?.focus());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------- tabs follow navigation
  const current = ed.subgraph;
  const subs = ed.root.subgraphs;
  useEffect(() => {
    setTabs((t) => {
      const alive = t.filter((id) => subs?.[id]);
      const next = current !== undefined && subs?.[current] && !alive.includes(current) ? [...alive, current] : alive;
      return next.length === t.length && next.every((x, i) => x === t[i]) ? t : next;
    });
  }, [current, subs]);
  const closeTab = (id: string) => {
    setTabs((t) => t.filter((x) => x !== id));
    if (current === id) ed.open(undefined);
  };

  // ---------------------------------------------------------------- debug state for the toolbar and tabs
  const dbg = typeof debug === "object" ? debug : {};
  const st = ed.debug;
  const stackLevels = new Set<string>();
  if (st.status === "paused" && st.at) for (const f of callStackOf(ed.root, st.at.node)) stackLevels.add(f.sg ?? "");
  const issues = ed.validation.all.issues;
  const errors = issues.filter((i) => i.level === "error").length;
  const warnings = issues.length - errors;
  const docTitle = title ?? ed.root.meta?.name ?? "蓝图";
  const sel = ed.selection.nodes;

  const onKeyDown = (e: React.KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey;
    // undo / redo from anywhere in the workbench (panels too), unless a field or the canvas took it
    const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
    if (mod && !typing && !e.defaultPrevented && !ed.readOnly) {
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) { e.preventDefault(); ed.undo(); return; }
      if (k === "y" || (k === "z" && e.shiftKey)) { e.preventDefault(); ed.redo(); return; }
    }
    if (mod && e.key.toLowerCase() === "s" && onSave) { e.preventDefault(); onSave(ed.root); ed.notify("已保存"); }
    else if (mod && e.shiftKey && e.key.toLowerCase() === "f") { e.preventDefault(); openFind(); }
    else if (e.key === "Escape" && drawer) { e.preventDefault(); setDrawer(null); }
  };

  const tabLabel = (id: string) => {
    const sg = subs?.[id];
    const Icon = sg?.kind === "function" ? FunctionSquare : sg?.kind === "macro" ? SquareStack : Workflow;
    return <><Icon aria-hidden className="size-3.5 shrink-0" /><span className="truncate">{sg?.label ?? id}</span></>;
  };

  const left = MyBlueprint ? <MyBlueprint editor={ed} onFindReferences={(q) => openFind(q)} className="h-full" /> : <div aria-busy className="h-full" />;
  const right = Details ? <Details editor={ed} onFindReferences={(q) => openFind(q)} className="h-full" /> : <div aria-busy className="h-full" />;

  const runControls = debug ? (
    <div role="group" aria-label="运行" className="flex items-center gap-0.5">
      <span className="bp-run-dot ml-1" data-status={st.status} aria-hidden />
      <span className={cn("mr-1 ml-1 max-w-32 truncate text-xs", compact && "sr-only")} role="status" aria-live="polite">
        {st.status === "paused" ? (st.reason === "cursor" ? "已到光标" : "已暂停") : st.status === "running" ? "运行中" : st.status === "done" ? `结束 · ${st.steps} 步` : st.status === "stopped" ? "已停止" : st.status === "error" ? "出错" : "调试"}
      </span>
      {st.status === "paused" ? (
        <button type="button" className={TB} title="继续（F5）" onClick={() => void ed.continue()}><Play className="size-4" aria-hidden /><span className={cn(compact && "sr-only")}>继续</span></button>
      ) : st.status === "running" ? (
        <button type="button" className={TB} title="暂停（F10）" onClick={() => void ed.step()}><Pause className="size-4" aria-hidden /><span className={cn(compact && "sr-only")}>暂停</span></button>
      ) : (
        <button type="button" className={TB} title="从入口事件运行（F5）" onClick={() => void ed.run()}><Play className="size-4" aria-hidden /><span className={cn(compact && "sr-only")}>运行</span></button>
      )}
      {st.status !== "running" ? <button type="button" className={TB} title="单步（F10）" aria-label="单步" onClick={() => void ed.step()}><StepForward className="size-4" aria-hidden /></button> : null}
      {compact ? null : <button type="button" className={TB} title="运行到选中节点（Ctrl F10）" aria-label="运行到光标" disabled={sel.length !== 1} onClick={() => void ed.runToCursor()}><Crosshair className="size-4" aria-hidden /></button>}
      {st.status === "running" || st.status === "paused" ? (
        <button type="button" className={cn(TB, "text-destructive hover:text-destructive")} title="停止（Shift F5）" aria-label="停止" onClick={() => ed.stop()}><CircleStop className="size-4" aria-hidden /></button>
      ) : st.status !== "idle" ? (
        <button type="button" className={TB} title="清除运行痕迹" aria-label="清除运行痕迹" onClick={() => ed.clearDebug()}><Eraser className="size-4" aria-hidden /></button>
      ) : null}
    </div>
  ) : null;

  const canvas = (
    <Blueprint editor={ed} toolbar={false} issues={false} onFind={() => openFind()}
      debug={debug ? { ...dbg, bar: false } : false}
      {...(readOnly !== undefined ? { readOnly } : {})} {...(snap !== undefined ? { snap } : {})} {...(minimap !== undefined ? { minimap } : {})}
      {...(lodThreshold !== undefined ? { lodThreshold } : {})} {...(placeKeys !== undefined ? { placeKeys } : {})}
      wheel={wheel ?? (fullscreen ? "zoom" : "ctrl")}
      aria-label={`${docTitle} 画布`} className="h-full w-full" />
  );

  return (
    <div ref={root} role="region" aria-label={rest["aria-label"] ?? `${docTitle} 蓝图编辑器`} onKeyDown={onKeyDown}
      data-bp-workbench="" data-narrow={narrow || undefined}
      className={cn("relative flex min-h-0 w-full flex-col overflow-hidden bg-background text-foreground", fullscreen ? "h-dvh" : "h-full min-h-[480px] rounded-xl border", className)}>
      {/* ------------------------------------------------------------ toolbar */}
      <div role="toolbar" aria-label="工作台工具栏" className="scrollbar-none flex h-11 shrink-0 items-center gap-0.5 overflow-x-auto border-b px-1.5">
        {narrow ? <button type="button" className={TB} aria-label="我的蓝图" aria-pressed={drawer === "left"} onClick={() => toggle("left")}><PanelLeft className="size-4" aria-hidden /></button> : null}
        {compact ? <h2 className="sr-only">{docTitle}</h2> : (
          <>
            <h2 className="flex min-w-0 shrink items-center gap-1.5 px-1.5 text-sm font-semibold">
              <GitFork aria-hidden className="size-4 shrink-0 text-muted-foreground" /><span className="truncate">{docTitle}</span>
            </h2>
            {SEP}
          </>
        )}
        <button type="button" className={TB} onClick={() => openDock("issues")} title={issues.length ? `编译结果：${errors} 个错误，${warnings} 个警告` : "编译通过"}>
          {errors ? <CircleX className="size-4 text-destructive" aria-hidden /> : warnings ? <AlertTriangle className="size-4 text-warning" aria-hidden /> : <CircleCheck className="size-4 text-success" aria-hidden />}
          <span className={cn("tabular-nums", compact && "sr-only")}>{errors ? `${errors} 错误` : warnings ? `${warnings} 警告` : "已编译"}</span>
        </button>
        {onSave ? <button type="button" className={TB} title="保存（Ctrl S）" onClick={() => { onSave(ed.root); ed.notify("已保存"); }}><Save className="size-4" aria-hidden /><span className={cn(compact && "sr-only")}>保存</span></button> : null}
        {ed.readOnly ? null : (
          <>
            <button type="button" className={TB} aria-label="撤销" title={`撤销（Ctrl Z）`} disabled={!ed.canUndo} onClick={() => ed.undo()}><Undo2 className="size-4" aria-hidden /></button>
            <button type="button" className={TB} aria-label="重做" title="重做（Ctrl Y）" disabled={!ed.canRedo} onClick={() => ed.redo()}><Redo2 className="size-4" aria-hidden /></button>
          </>
        )}
        {debug ? <>{SEP}{runControls}</> : null}
        {SEP}
        <button type="button" className={TB} title="查找（Ctrl F）" aria-label="查找" aria-pressed={layout.open.bottom && tab === "find"} onClick={() => openFind()}><Search className="size-4" aria-hidden /></button>
        {compact ? null : (
          <>
            <button type="button" className={TB} aria-label="缩小" title="缩小" onClick={() => { const el = ed.el; if (el) ed.zoomAt(el.clientWidth / 2, el.clientHeight / 2, 1 / 1.2); }}><ZoomOut className="size-4" aria-hidden /></button>
            <ZoomReadout ed={ed} />
            <button type="button" className={TB} aria-label="放大" title="放大" onClick={() => { const el = ed.el; if (el) ed.zoomAt(el.clientWidth / 2, el.clientHeight / 2, 1.2); }}><ZoomIn className="size-4" aria-hidden /></button>
          </>
        )}
        <button type="button" className={TB} aria-label="适配视图" title="适配视图（Home）" onClick={() => ed.fit()}><Maximize className="size-4" aria-hidden /></button>
        <span className="flex-1" />
        {toolbarEnd}
        {narrow ? null : <button type="button" className={TB} aria-label="我的蓝图面板" title="我的蓝图" aria-pressed={layout.open.left} onClick={() => toggle("left")}><PanelLeft className="size-4" aria-hidden /></button>}
        <button type="button" className={TB} aria-label="输出面板" title="编译结果、查找、调试" aria-pressed={layout.open.bottom} onClick={() => toggle("bottom")}><PanelBottom className="size-4" aria-hidden /></button>
        <button type="button" className={TB} aria-label="细节面板" title="细节" aria-pressed={narrow ? drawer === "right" : layout.open.right} onClick={() => toggle("right")}><PanelRight className="size-4" aria-hidden /></button>
        {compact ? null : <button type="button" className={TB} aria-label="快捷键" title="快捷键（?）" aria-pressed={help} onClick={() => setHelp((h) => !h)}><Keyboard className="size-4" aria-hidden /></button>}
        {!compact && typeof document !== "undefined" && document.fullscreenEnabled ? (
          <button type="button" className={TB} aria-label={isFull ? "退出全屏" : "全屏"} title={isFull ? "退出全屏" : "全屏"}
            onClick={() => (isFull ? void document.exitFullscreen() : void root.current?.requestFullscreen())}>
            {isFull ? <Minimize2 className="size-4" aria-hidden /> : <Maximize2 className="size-4" aria-hidden />}
          </button>
        ) : null}
      </div>

      {/* ------------------------------------------------------------ body */}
      {measured === undefined ? <div className="flex-1" /> : <div className="relative flex min-h-0 flex-1">
        {!narrow && layout.open.left ? (
          <>
            <aside id={`${uid}-left`} aria-label="我的蓝图" className="min-h-0 shrink-0 overflow-hidden" style={{ width: layout.left }}>{left}</aside>
            <Splitter orientation="vertical" side="start" value={layout.left} min={LIMITS.left[0]} max={LIMITS.left[1]} label="调整我的蓝图宽度" controls={`${uid}-left`}
              onChange={(v) => setSize("left", v)} onToggle={() => toggle("left")} onReset={() => setSize("left", DEFAULTS.left)} />
          </>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <nav aria-label="打开的图" className="scrollbar-none flex h-9 shrink-0 items-end gap-px overflow-x-auto border-b bg-muted/30 px-1">
            <GraphTab active={current === undefined} onSelect={() => ed.open(undefined)} stack={stackLevels.has("")}>
              <GitFork aria-hidden className="size-3.5 shrink-0" /><span className="truncate">事件图</span>
            </GraphTab>
            {tabs.map((id) => (
              <GraphTab key={id} active={current === id} onSelect={() => ed.open(id)} onClose={() => closeTab(id)} stack={stackLevels.has(id)} closeLabel={`关闭 ${subs?.[id]?.label ?? id}`}>
                {tabLabel(id)}
              </GraphTab>
            ))}
          </nav>
          <div className="relative min-h-0 flex-1">{canvas}</div>
          {layout.open.bottom ? (
            <>
              <Splitter orientation="horizontal" side="end" value={layout.bottom} min={LIMITS.bottom[0]} max={LIMITS.bottom[1]} label="调整输出面板高度" controls={`${uid}-dock`}
                onChange={(v) => setSize("bottom", v)} onToggle={() => toggle("bottom")} onReset={() => setSize("bottom", DEFAULTS.bottom)} />
              <section id={`${uid}-dock`} aria-label="输出" className="min-h-0 shrink-0" style={{ height: narrow ? Math.min(layout.bottom, 220) : layout.bottom }}>
                {Dock ? (
                  <Dock editor={ed} tab={tab} onTabChange={setTab} query={query} onQueryChange={setQuery} debug={Boolean(debug)} className="h-full"
                    actions={<button type="button" aria-label="收起输出面板" className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" onClick={() => toggle("bottom")}><X className="size-3.5" /></button>} />
                ) : <div aria-busy className="h-full" />}
              </section>
            </>
          ) : null}
        </div>

        {!narrow && layout.open.right ? (
          <>
            <Splitter orientation="vertical" side="end" value={layout.right} min={LIMITS.right[0]} max={LIMITS.right[1]} label="调整细节面板宽度" controls={`${uid}-right`}
              onChange={(v) => setSize("right", v)} onToggle={() => toggle("right")} onReset={() => setSize("right", DEFAULTS.right)} />
            <aside id={`${uid}-right`} aria-label="细节" className="min-h-0 shrink-0 overflow-hidden" style={{ width: layout.right }}>{right}</aside>
          </>
        ) : null}

        {/* narrow layouts: side panels as drawers over the canvas */}
        {narrow && drawer ? (
          <>
            <button type="button" aria-label="关闭面板" tabIndex={-1} onClick={() => setDrawer(null)} className="absolute inset-0 z-30 bg-background/50" />
            <m.div aria-label={drawer === "left" ? "我的蓝图" : "细节"} role="dialog"
              initial={{ x: drawer === "left" ? -16 : 16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.18 }}
              className={cn("absolute top-0 bottom-0 z-40 flex w-[min(340px,88%)] flex-col border bg-background shadow-float", drawer === "left" ? "left-0 border-l-0" : "right-0 border-r-0")}>
              <div className="flex h-9 shrink-0 items-center justify-between border-b pr-1 pl-3 text-xs font-semibold">
                {drawer === "left" ? "我的蓝图" : "细节"}
                <button type="button" aria-label="关闭" onClick={() => setDrawer(null)} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"><X className="size-4" /></button>
              </div>
              <div className="min-h-0 flex-1">{drawer === "left" ? left : right}</div>
            </m.div>
          </>
        ) : null}
      </div>}
      {help && HelpSheet ? <HelpSheet onClose={() => { setHelp(false); ed.el?.focus(); }} /> : null}
    </div>
  );
}

function GraphTab({ active, onSelect, onClose, stack, closeLabel, children }: {
  active: boolean; onSelect: () => void; onClose?: () => void; stack: boolean; closeLabel?: string; children: ReactNode;
}) {
  return (
    <div className={cn("group/tab relative flex h-8 max-w-48 shrink-0 items-center rounded-t-md border border-b-0 text-xs", active ? "bg-background text-foreground" : "border-transparent text-muted-foreground hover:bg-background/60 hover:text-foreground")}>
      <button type="button" aria-current={active ? "page" : undefined} onClick={onSelect} onAuxClick={(e) => { if (e.button === 1 && onClose) { e.preventDefault(); onClose(); } }}
        title={stack ? "调用栈经过这里" : undefined}
        className={cn("flex h-full min-w-0 items-center gap-1.5 rounded-t-md pl-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/50", onClose ? "pr-1" : "pr-2.5")}>
        {children}
        {stack ? <span aria-label="调用栈" className="size-1.5 shrink-0 rounded-full bg-[var(--bp-break)]" /> : null}
      </button>
      {onClose ? (
        <button type="button" aria-label={closeLabel} onClick={onClose}
          className="mr-1 grid size-5 shrink-0 place-items-center rounded text-muted-foreground opacity-60 hover:bg-accent hover:text-foreground hover:opacity-100 focus-visible:opacity-100">
          <X className="size-3" />
        </button>
      ) : null}
    </div>
  );
}

/** Zoom % that follows pan / zoom without re-rendering the workbench. */
function ZoomReadout({ ed }: { ed: BlueprintHandle }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const paint = () => {
      const el = ref.current;
      if (!el) return;
      const pct = `${Math.round(ed.viewport.z * 100)}%`;
      el.textContent = pct;
      el.setAttribute("aria-label", `${pct}，点击缩放到 100%`);
    };
    paint();
    return ed.onViewport(paint);
  }, [ed]);
  return (
    <button ref={ref} type="button" title="缩放到 100%" onClick={() => { const el = ed.el; if (el) ed.zoomAt(el.clientWidth / 2, el.clientHeight / 2, 1 / ed.viewport.z); }}
      className="h-8 w-12 shrink-0 rounded-md text-center font-mono text-[11px] text-muted-foreground tabular-nums hover:bg-accent hover:text-foreground" />
  );
}
