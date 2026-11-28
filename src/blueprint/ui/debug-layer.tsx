"use client";

import { CircleStop, Eraser, Pause, Play, StepForward } from "lucide-react";
import { m } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { DebugState } from "../debug";
import type { StepEvent } from "../evaluate";
import { findPin } from "../ports";
import { callStackOf, resolveNodePath } from "../subgraph";
import type { BlueprintEditor } from "./editor";
import { esc } from "./drag-move";
import { pinPos } from "./geometry";

/**
 * Debugging UI (lazily loaded by <Blueprint debug>):
 *   - run bar: 运行 / 单步 / 继续 / 停止 / 清除 and the status line (F5 / F10 / Shift+F5 / F9 too)
 *   - exec-flow pulses: before each exec hop a short dash runs along the wire taken (stroke-dashoffset,
 *     about one hop per `ed.stepMs`), the wire and the node stay marked. Reduced motion: marks only.
 *   - paused node ring, auto-opening the level it is on
 *   - watched pins (right-click a pin > 监视此值): a value bubble next to the pin
 *   - hover a pin after a run: its last value
 */

const SVG = "http://www.w3.org/2000/svg";

/** Short, single-line text for a value. */
export function formatValue(v: unknown): string {
  if (v === undefined) return "未定义";
  if (typeof v === "string") return JSON.stringify(v).slice(0, 40);
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000);
  try {
    const s = JSON.stringify(v instanceof Set ? [...v] : v instanceof Map ? Object.fromEntries(v) : v) ?? String(v);
    return s.length > 40 ? `${s.slice(0, 39)}…` : s;
  } catch {
    return String(v);
  }
}

const STATUS: Record<DebugState["status"], string> = {
  idle: "调试", running: "运行中…", paused: "已暂停", done: "运行结束", stopped: "已停止", error: "出错",
};

/** Last outputs by level key ("node" / "sg/node"); the latest call site wins. */
function valuesByKey(ed: BlueprintEditor, st: DebugState) {
  const out = new Map<string, Readonly<Record<string, unknown>>>();
  for (const [path, v] of st.values) {
    const r = resolveNodePath(ed.root, path);
    if (r) out.set(r.key, v);
  }
  return out;
}

export default function DebugLayer({ ed, minimap, bar = true }: { ed: BlueprintEditor; minimap: boolean; bar?: boolean }) {
  useSyncExternalStore(ed.subscribe, ed.version, ed.version);
  const st = ed.debug;
  const tip = useRef<HTMLDivElement>(null);
  const reduced = useRef(false);
  const byKey = useMemo(() => valuesByKey(ed, st), [ed, st]);
  const byKeyRef = useRef(byKey);
  byKeyRef.current = byKey;

  // ---------------------------------------------------------------- marks on the canvas
  /** Local id of a runtime path when it lives on the level being edited. */
  const localOf = (path: string | undefined) => {
    if (path === undefined) return undefined;
    const r = resolveNodePath(ed.root, path);
    return r && r.sg === ed.subgraph ? r.id : undefined;
  };
  const mark = (step: Pick<StepEvent, "node" | "edge" | "disabled">, state: "done" | "next") => {
    const root = ed.el;
    if (!root) return;
    const n = localOf(step.node);
    if (n !== undefined) root.querySelector(`[data-node="${esc(n)}"]`)?.setAttribute("data-run", step.disabled ? "skipped" : state);
    const e = localOf(step.edge);
    if (e !== undefined) root.querySelector(`[data-edge="${esc(e)}"]`)?.setAttribute("data-run", "");
  };
  const pulse = (edgePath: string | undefined) => {
    const root = ed.el;
    const e = localOf(edgePath);
    if (!root || e === undefined) return;
    const g = root.querySelector(`[data-edge="${esc(e)}"]`);
    g?.setAttribute("data-run", "");
    const base = g?.querySelector(".bp-wire");
    const layer = root.querySelector(".bp-run-layer");
    if (!base || !layer || reduced.current) return;
    const p = document.createElementNS(SVG, "path");
    p.setAttribute("d", base.getAttribute("d") ?? "");
    p.setAttribute("pathLength", "1");
    p.setAttribute("class", "bp-pulse");
    layer.appendChild(p);
    const ms = Math.min(250, Math.max(150, ed.stepMs));
    const a = p.animate([{ strokeDashoffset: 0.16 }, { strokeDashoffset: -1 }], { duration: ms, easing: "ease-in-out" });
    a.onfinish = a.oncancel = () => p.remove();
  };
  const clearMarks = () => {
    ed.el?.querySelectorAll("[data-run], [data-paused], [data-frame]").forEach((x) => { x.removeAttribute("data-run"); x.removeAttribute("data-paused"); x.removeAttribute("data-frame"); });
  };
  const paintAll = () => {
    clearMarks();
    const s = ed.debug;
    if (ed.el) {
      if (s.status === "running") ed.el.dataset.running = "";
      else delete ed.el.dataset.running;
    }
    if (s.status === "idle") return;
    for (const step of s.trace) mark(step, "done");
    if (s.status === "paused" && s.at) {
      const n = localOf(s.at.node);
      if (n !== undefined) ed.el?.querySelector(`[data-node="${esc(n)}"]`)?.setAttribute("data-paused", "");
      const e = localOf(s.at.edge);
      if (e !== undefined) ed.el?.querySelector(`[data-edge="${esc(e)}"]`)?.setAttribute("data-run", "");
      // call stack: the call sites that lead to the paused node, on whatever level is open
      for (const f of callStackOf(ed.root, s.at.node).slice(0, -1)) {
        if (f.sg === ed.subgraph) ed.el?.querySelector(`[data-node="${esc(f.id)}"]`)?.setAttribute("data-frame", "");
      }
    }
  };

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = mq.matches;
    const onMq = () => (reduced.current = mq.matches);
    mq.addEventListener("change", onMq);
    const off = ed.onDebug((e) => {
      if (e.type === "before") {
        pulse(e.target.edge);
        const n = localOf(e.target.node);
        if (n !== undefined) ed.el?.querySelector(`[data-node="${esc(n)}"]`)?.setAttribute("data-run", "next");
      } else if (e.type === "step") mark(e.step, "done");
      else if (e.state.status !== "paused") {
        if (ed.el) {
          if (e.state.status === "running") ed.el.dataset.running = "";
          else delete ed.el.dataset.running;
        }
      } else if (e.state.at) {
        // UE5 jumps to the breakpoint: open its level and bring it into view
        const r = resolveNodePath(ed.root, e.state.at.node);
        if (r && r.sg !== ed.subgraph) ed.reveal(r.key);
        requestAnimationFrame(() => {
          const node = ed.graph.nodes.find((x) => x.id === r?.id);
          const host = ed.el;
          if (!node || !host) return;
          const v = ed.viewport;
          const sx = node.x * v.z + v.x, sy = node.y * v.z + v.y;
          if (sx < 0 || sy < 0 || sx > host.clientWidth - 80 || sy > host.clientHeight - 60) {
            ed.setViewport({ ...v, x: host.clientWidth / 2 - (node.x + 80) * v.z, y: host.clientHeight / 2 - (node.y + 30) * v.z });
          }
        });
      }
    });
    return () => { off(); mq.removeEventListener("change", onMq); clearMarks(); if (ed.el) delete ed.el.dataset.running; };
  }, [ed]); // eslint-disable-line react-hooks/exhaustive-deps

  // React re-renders (an edit, entering a subgraph) do not keep imperative marks: repaint from the trace.
  useLayoutEffect(paintAll);

  // ---------------------------------------------------------------- hover: last value of a pin
  useEffect(() => {
    const root = ed.el;
    if (!root) return;
    const onMove = (e: PointerEvent) => {
      const el = tip.current;
      if (!el) return;
      const cell = e.buttons ? null : (e.target as Element).closest<HTMLElement>("[data-pin]");
      const nodeId = cell?.closest<HTMLElement>("[data-node]")?.dataset.node;
      const text = cell && nodeId !== undefined && byKeyRef.current.size ? pinValueText(ed, byKeyRef.current, nodeId, cell.dataset.pin!) : undefined;
      if (text === undefined) return void (el.style.display = "none");
      const r = root.getBoundingClientRect();
      el.textContent = text;
      el.style.display = "block";
      el.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top - 30}px)`;
    };
    const hide = () => { if (tip.current) tip.current.style.display = "none"; };
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", hide);
    return () => { root.removeEventListener("pointermove", onMove); root.removeEventListener("pointerleave", hide); };
  }, [ed]);

  // ---------------------------------------------------------------- watch bubbles (in the world layer)
  const world = ed.el?.querySelector(".bp-world");
  const g = ed.graph;
  const prefix = ed.subgraph === undefined ? "" : `${ed.subgraph}/`;
  const bubbles = [...ed.watches].flatMap((w) => {
    const [key, pinKey] = w.split("|") as [string, string];
    if (prefix ? !key.startsWith(prefix) || key.slice(prefix.length).includes("/") : key.includes("/")) return [];
    const local = key.slice(prefix.length);
    const node = g.nodes.find((n) => n.id === local);
    const dir = pinKey.startsWith("in:") ? "in" : "out";
    const pin = pinKey.slice(pinKey.indexOf(":") + 1);
    const at = node && pinPos(node, dir, pin, ed.registry, g);
    if (!at) return [];
    const text = byKey.size ? pinValueText(ed, byKey, local, pinKey) ?? "—" : "—";
    return [{ w, x: at.x, y: at.y, dir, text, label: pin }];
  });

  // ---------------------------------------------------------------- run bar
  const pausedTitle = (() => {
    if (st.status !== "paused" || !st.at) return "";
    const r = resolveNodePath(ed.root, st.at.node);
    const nodes = r?.sg === undefined ? ed.root.nodes : ed.root.subgraphs?.[r.sg]?.nodes ?? [];
    const n = nodes.find((x) => x.id === r?.id);
    return n ? n.title ?? ed.registry.node(n.type)?.title ?? n.type : st.at.node;
  })();
  const live = st.status === "running" || st.status === "paused";
  const status = st.status === "paused" ? `${st.reason === "cursor" ? "已运行到光标" : STATUS.paused} · ${pausedTitle}`
    : st.status === "done" ? `${STATUS.done} · ${st.steps} 步`
      : st.status === "error" ? `${STATUS.error} · ${st.error === "No entry node to run" ? "没有入口事件节点" : st.error ?? ""}`
        : STATUS[st.status];
  const BTN = "flex h-7 items-center gap-1 rounded-md px-2 text-xs hover:bg-accent disabled:opacity-40";

  return (
    <>
      {bar ? <m.div data-bp-overlay role="toolbar" aria-label="调试" onPointerDown={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
        className={`absolute right-2 z-20 flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-lg border bg-popover/90 p-0.5 pl-2.5 text-popover-foreground shadow-soft backdrop-blur ${minimap ? "bottom-12 sm:bottom-[8.5rem]" : "bottom-12 sm:bottom-2"}`}>
        <span className="bp-run-dot" data-status={st.status} aria-hidden />
        <span className="mr-1 max-w-40 truncate text-xs" role="status" aria-live="polite">{status}</span>
        {st.status === "paused" ? (
          <button type="button" className={BTN} title="继续（F5）" onClick={() => void ed.continue()}><Play className="size-3.5" aria-hidden />继续</button>
        ) : st.status === "running" ? (
          <button type="button" className={BTN} title="在下一个节点前暂停（F10）" onClick={() => void ed.step()}><Pause className="size-3.5" aria-hidden />暂停</button>
        ) : (
          <button type="button" className={BTN} title="从入口事件运行（F5）" onClick={() => void ed.run()}><Play className="size-3.5" aria-hidden />运行</button>
        )}
        {st.status !== "running" ? <button type="button" className={BTN} title="单步（F10）" onClick={() => void ed.step()}><StepForward className="size-3.5" aria-hidden />单步</button> : null}
        {live ? <button type="button" className={`${BTN} text-destructive`} title="停止（Shift F5）" onClick={() => ed.stop()}><CircleStop className="size-3.5" aria-hidden />停止</button> : null}
        {st.status === "done" || st.status === "stopped" || st.status === "error" ? (
          <button type="button" className={BTN} title="清除运行痕迹" onClick={() => ed.clearDebug()}><Eraser className="size-3.5" aria-hidden />清除</button>
        ) : null}
      </m.div> : null}
      <div ref={tip} className="bp-vtip" aria-hidden />
      {world ? createPortal(
        <>
          <svg className="bp-wires bp-run-layer" aria-hidden />
          {bubbles.map((b) => (
            <div key={b.w} className="bp-watch" data-dir={b.dir} style={{ transform: `translate(${b.x}px, ${b.y}px)` }}>
              <span className="bp-watch-pin">{b.label}</span>{b.text}
            </div>
          ))}
        </>,
        world,
      ) : null}
    </>
  );
}

/** "last value" text of a pin on the level being edited, or undefined when nothing ran there. */
function pinValueText(ed: BlueprintEditor, byKey: ReadonlyMap<string, Readonly<Record<string, unknown>>>, nodeId: string, pinAttr: string): string | undefined {
  const i = pinAttr.indexOf(":");
  const dir = pinAttr.slice(0, i) === "in" ? "in" : "out";
  const pin = pinAttr.slice(i + 1);
  const g = ed.graph;
  const node = g.nodes.find((n) => n.id === nodeId);
  const p = node && findPin(node, pin, dir, ed.registry, g);
  if (!node || !p || p.exec) return undefined;
  if (dir === "out") {
    const v = byKey.get(ed.keyOf(nodeId));
    return v && pin in v ? formatValue(v[pin]) : undefined;
  }
  const e = g.edges.find((x) => x.to.node === nodeId && x.to.pin === pin);
  if (e) {
    const v = byKey.get(ed.keyOf(e.from.node));
    return v && e.from.pin in v ? formatValue(v[e.from.pin]) : undefined;
  }
  return byKey.has(ed.keyOf(nodeId)) ? `${formatValue(node.values?.[pin] ?? p.default)}（字面值）` : undefined;
}
