"use client";

import {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
  type JSX, type ReactNode,
} from "react";
import { cn } from "../primitives/utils";
import type { BlueprintGraph, BlueprintRegistry, GraphValidation, PortRef } from "./types";
import { EXEC_IN_PORT, canConnect } from "./connect";
import {
  CURVE_MIN, nodeHeight, nodeWidth, portPos, hitNode, hitPort, rectsIntersect, graphBounds,
} from "./geometry";
import { BlueprintNodeCard } from "./BlueprintNode";
import { BlueprintPalette } from "./BlueprintPalette";

/**
 * 画布。
 *
 * ## 它管什么
 *   平移 / 缩放 / 拖节点 / 拖线 / 框选 / 拖到空白处弹面板
 *
 * ## 它不管什么
 *   图的**内容**。图通过受控 props 进出, 画布不做任何结构判断 ——
 *   判断全在 `canConnect` 与 `validateGraph` 里。理由见 connect.ts:
 *   判据只能有一份, 否则 UI 提示与落地结果会分叉。
 *
 * ## 三个踩过的坑, 写进实现里了
 *   1. 拖拽必须用 pointer events + setPointerCapture。用 mousemove 绑 window,
 *      鼠标移出 iframe 或松在元素外时会丢事件, 表现为"节点粘在手上"。
 *   2. 缩放要**以光标为锚点**。以原点缩放时每滚一下图就跑掉, 手感是坏的。
 *   3. 连线预览与已落地的边走同一个 path 公式。两处各画一遍会出现
 *      "预览一个形状、落地变成另一个"。
 *   4. 滚轮**必须**用 addEventListener(..., { passive: false }), 不能走 React 的
 *      onWheel —— React 17+ 把它注册成 passive, 于是 preventDefault() 被浏览器
 *      忽略, 结果是"图缩放了、页面同时也滚了"。实测踩到过。
 */

export interface Viewport {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

export interface BlueprintCanvasProps {
  readonly registry: BlueprintRegistry;
  readonly graph: BlueprintGraph;
  readonly validation?: GraphValidation;
  readonly selected?: ReadonlySet<string>;

  readonly onNodesMove?: (moves: readonly { id: string; x: number; y: number }[]) => void;
  readonly onConnect?: (from: PortRef, to: PortRef) => void;
  readonly onDisconnect?: (edgeId: string) => void;
  readonly onSelect?: (ids: readonly string[]) => void;
  readonly onNodeParamChange?: (nodeId: string, key: string, value: unknown) => void;
  readonly onAddNode?: (type: string, at: { x: number; y: number }) => void;
  readonly onRemoveNodes?: (ids: readonly string[]) => void;
  readonly onOpenMenu?: (at: { x: number; y: number }) => void;
  /** 双击子图节点: 请求"进入"这一层。由外层决定是换一张图还是开抽屉。 */
  readonly onEnterSubgraph?: (nodeId: string, sgId: string) => void;
  /** 折叠选中的节点。 */
  readonly onCollapse?: (ids: readonly string[]) => void;
  /** 注释改动 (拖动 / 改尺寸 / 改文案)。 */
  readonly onCommentChange?: (id: string, patch: { x?: number; y?: number; w?: number; h?: number; title?: string }) => void;
  /** 命中的注释被拖动: 由外层算"带走哪些节点" —— 那是图操作, 画布不管。 */
  readonly onCommentMove?: (id: string, delta: { dx: number; dy: number }) => void;

  readonly className?: string;
  readonly height?: number | string;
  readonly showGrid?: boolean;
  /** 端口命中容差 (图坐标)。 */
  readonly portTolerance?: number;
  /** 左上角浮层。 */
  readonly toolbar?: ReactNode;
  /** 显示全屏按钮。默认 true。 */
  readonly allowFullscreen?: boolean;
}

interface DragState {
  readonly ids: readonly string[];
  readonly start: { x: number; y: number };
  readonly origin: ReadonlyMap<string, { x: number; y: number }>;
}

interface LinkState {
  readonly from: PortRef;
  readonly dir: "in" | "out";
  readonly cursor: { x: number; y: number };
  /** null = 没悬停在端口上; 否则是判定结论。 */
  readonly verdict: { ok: boolean; reason?: string; replaces?: string } | null;
}

export function BlueprintCanvas({
  registry, graph, validation, selected,
  onNodesMove, onConnect, onDisconnect, onSelect, onNodeParamChange,
  onAddNode, onRemoveNodes, onOpenMenu,
  onEnterSubgraph, onCollapse, onCommentChange, onCommentMove,
  className, height = 520, showGrid = true, portTolerance = 10, toolbar,
  allowFullscreen = true,
}: BlueprintCanvasProps): JSX.Element {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [view, setView] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [drag, setDrag] = useState<DragState | null>(null);
  const [link, setLink] = useState<LinkState | null>(null);
  const [marquee, setMarquee] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [panning, setPanning] = useState<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const [paletteAt, setPaletteAt] = useState<{ x: number; y: number } | null>(null);
  const [commentDrag, setCommentDrag] = useState<{
    readonly id: string;
    readonly start: { x: number; y: number };
    readonly origin: { x: number; y: number };
  } | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  /** Fullscreen API 不可用/被拒时的回退: fixed 覆盖层。 */
  const [maximized, setMaximized] = useState(false);
  /** 两者任一为真都算"展开了"。 */
  const expanded = fullscreen || maximized;

  /**
   * 全屏。
   *
   * 用 Fullscreen API 而不是自己加个 fixed 覆盖层:
   * 后者遮得住视口, 但遮不住浏览器 UI / iframe 边界, 而且 Esc 退出的行为
   * 要自己实现。Fullscreen API 是浏览器给的, 行为一致。
   *
   * 监听 fullscreenchange 而不是只在 toggle 时改 state —— 用户按 Esc 或 F11
   * 退出时不会经过我们的按钮, 不同步的话按钮状态就卡在"已全屏"。
   */
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === hostRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /**
   * 全屏, 带**回退**。
   *
   * Fullscreen API 需要用户手势, 而且在某些环境里会被直接拒绝
   * (实测 headless Chromium 报 "Permissions check failed"; 嵌在 iframe 里
   *  没有 allow="fullscreen" 时同样被拒)。那时如果什么都不做, 按钮点了没反应 ——
   * 最坏的一类失败。
   *
   * 所以失败时退回"最大化": 一个 fixed 覆盖层撑满视口。它遮不住浏览器 UI,
   * 但至少能给到整屏的画布。两种模式共用同一个 `expanded` 状态,
   * 下游 (尺寸自适应) 不用区分。
   */
  const toggleFullscreen = useCallback(() => {
    const el = hostRef.current;
    if (!el) return;
    if (expanded) {
      if (document.fullscreenElement === el) {
        void document.exitFullscreen().catch(() => undefined);
      }
      setMaximized(false);
      return;
    }
    const req = el.requestFullscreen?.() as Promise<void> | undefined;
    if (req && typeof req.then === "function") {
      req.then(() => setMaximized(false)).catch(() => setMaximized(true));
    } else {
      setMaximized(true);
    }
  }, [expanded]);

  const toGraph = useCallback(
    (clientX: number, clientY: number) => {
      const rect = hostRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return { x: (clientX - rect.left - view.x) / view.zoom, y: (clientY - rect.top - view.y) / view.zoom };
    },
    [view]
  );

  /**
   * 缩放: 以光标为锚点。解 (cx - x') / z' == (cx - x) / z。
   *
   * 这里用 **原生非被动监听** 而不是 React 的 onWheel —— 这是个坑, 实测踩到:
   * React 17+ 把 wheel/touchmove 注册成 **passive** 监听, 于是 handler 里的
   * `preventDefault()` 被浏览器直接忽略 (控制台还会警告 "Unable to preventDefault
   * inside passive event listener")。表现就是: 图缩放了, 页面**同时也滚了** ——
   * 滚到图外面继续滚整页, 手感非常坏。
   *
   * 只有 addEventListener(..., { passive: false }) 才能真正拦住默认行为。
   * 代价是要自己管注册与清理, 以及 handler 里读不到最新的闭包变量 ——
   * 所以下面靠 ref 拿 view, 靠真正在变的东西触发重注册。
   */
  const viewRef = useRef(view);
  viewRef.current = view;

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      setView((v) => {
        const zoom = clamp(v.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), 0.25, 2.5);
        const k = zoom / v.zoom;
        return { zoom, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        setPanning({ x: e.clientX, y: e.clientY, vx: view.x, vy: view.y });
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
      if (e.button !== 0) return;
      const p = toGraph(e.clientX, e.clientY);

      const hit = hitPort(registry, graph, p, portTolerance / view.zoom);
      if (hit) {
        // 从输入口起手 = 反向拖: 抓着已有那条线的另一端继续拖 (UE5 的行为)
        if (hit.dir === "in") {
          const existing = graph.edges.find((x) => x.to.node === hit.ref.node && x.to.port === hit.ref.port);
          if (existing && onDisconnect) {
            onDisconnect(existing.id);
            setLink({ from: existing.from, dir: "out", cursor: p, verdict: null });
          } else {
            setLink({ from: hit.ref, dir: "in", cursor: p, verdict: null });
          }
        } else {
          setLink({ from: hit.ref, dir: "out", cursor: p, verdict: null });
        }
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }

      // 注释在节点**下面**, 所以先判节点。只有点在注释的标题条上才抓注释 ——
      // 点在注释空白处应该穿透过去起框选, 否则注释会挡住整片区域的操作。
      const cmt = hitCommentBar(graph.comments, p);
      if (cmt) {
        onSelect?.([]);
        setCommentDrag({ id: cmt.id, start: p, origin: { x: cmt.x, y: cmt.y } });
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }

      const node = hitNode(registry, graph, p);
      if (node) {
        const ids = selected?.has(node.id) && selected.size > 1 ? [...selected] : [node.id];
        onSelect?.(ids);
        const origin = new Map<string, { x: number; y: number }>();
        for (const id of ids) {
          const n = graph.nodes.find((x) => x.id === id);
          if (n) origin.set(id, { x: n.x, y: n.y });
        }
        setDrag({ ids, start: p, origin });
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }

      if (!e.shiftKey) onSelect?.([]);
      setMarquee({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [graph, registry, selected, toGraph, view.zoom, onSelect, onDisconnect, portTolerance]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const p = toGraph(e.clientX, e.clientY);

      if (panning) {
        setView((v) => ({ ...v, x: panning.vx + (e.clientX - panning.x), y: panning.vy + (e.clientY - panning.y) }));
        return;
      }
      if (drag) {
        const dx = p.x - drag.start.x;
        const dy = p.y - drag.start.y;
        onNodesMove?.(drag.ids.flatMap((id) => {
          const o = drag.origin.get(id);
          return o ? [{ id, x: o.x + dx, y: o.y + dy }] : [];
        }));
        return;
      }
      if (commentDrag) {
        const dx = p.x - commentDrag.start.x;
        const dy = p.y - commentDrag.start.y;
        onCommentMove?.(commentDrag.id, { dx, dy });
        return;
      }
      if (link) {
        const hover = hitPort(registry, graph, p, portTolerance / view.zoom);
        let verdict: LinkState["verdict"] = null;
        if (hover && hover.dir !== link.dir) {
          const from = link.dir === "out" ? link.from : hover.ref;
          const to = link.dir === "out" ? hover.ref : link.from;
          const r = canConnect(registry, graph, from, to);
          // 用 "reason" in r 而不是 !r.ok 做判别: 本仓 tsconfig 的 strict 是关的,
          // 而判别式窄化在 strictNullChecks 关闭时不生效 —— 写成 !r.ok 时
          // else 分支里 r 仍是联合, 取 .reason 会报 TS2339。实测踩到过一次。
          // "reason" in r 不依赖 strict 开关, 这条判据在所有配置下都成立。
          verdict = "reason" in r ? { ok: false, reason: r.reason } : { ok: true, replaces: r.replaces };
        }
        setLink({ ...link, cursor: p, verdict });
        return;
      }
      if (marquee) setMarquee({ ...marquee, x1: p.x, y1: p.y });
    },
    [panning, drag, link, marquee, commentDrag, toGraph, graph, registry, view.zoom, onNodesMove, portTolerance, onCommentMove]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const p = toGraph(e.clientX, e.clientY);

      if (commentDrag) {
        const dx = p.x - commentDrag.start.x;
        const dy = p.y - commentDrag.start.y;
        onCommentMove?.(commentDrag.id, { dx, dy });
        return;
      }
      if (link) {
        const hover = hitPort(registry, graph, p, portTolerance / view.zoom);
        if (hover && hover.dir !== link.dir) {
          const from = link.dir === "out" ? link.from : hover.ref;
          const to = link.dir === "out" ? hover.ref : link.from;
          if (from.node !== to.node) onConnect?.(from, to);
        } else if (!hover && onAddNode) {
          // 拖到空白处松手: 弹面板, 选中的节点自动落在这里。
          // 这是 ComfyUI 那个最好用的交互 —— 少一次"先加节点再找它再连线"。
          setPaletteAt(p);
        }
        setLink(null);
      }
      if (marquee) {
        const box = {
          x: Math.min(marquee.x0, marquee.x1),
          y: Math.min(marquee.y0, marquee.y1),
          w: Math.abs(marquee.x1 - marquee.x0),
          h: Math.abs(marquee.y1 - marquee.y0),
        };
        if (box.w > 3 || box.h > 3) {
          const ids = graph.nodes
            .filter((n) => rectsIntersect(box, { x: n.x, y: n.y, w: nodeWidth(registry, n), h: nodeHeight(registry, n) }))
            .map((n) => n.id);
          onSelect?.(ids);
        }
        setMarquee(null);
      }
      setDrag(null);
      setPanning(null);
      setCommentDrag(null);
    },
    [link, marquee, graph, registry, toGraph, view.zoom, onConnect, onAddNode, onSelect, portTolerance]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selected && selected.size > 0) {
          e.preventDefault();
          onRemoveNodes?.([...selected]);
        }
      }
      if (e.key === "Escape") {
        setLink(null);
        setMarquee(null);
        setPaletteAt(null);
        // 真全屏时浏览器自己处理 Esc; 回退的 fixed 覆盖层得自己退
        if (maximized) setMaximized(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, onRemoveNodes, maximized]);

  const edges = useMemo(
    () =>
      graph.edges.flatMap((e) => {
        const a = portPos(registry, graph, e.from, "out");
        const b = portPos(registry, graph, e.to, "in");
        if (!a || !b) return [];
        const bad = (validation?.byEdge.get(e.id) ?? []).some((i) => i.level === "error");
        return [{ id: e.id, a, b, bad, exec: e.kind === "exec" }];
      }),
    [graph, registry, validation]
  );

  const connectedInputs = useMemo(() => {
    const m: Record<string, Record<string, boolean>> = {};
    for (const e of graph.edges) (m[e.to.node] ??= {})[e.to.port] = true;
    return m;
  }, [graph]);

  /** 拖线预览。与已落地边用同一个 path 公式。 */
  const previewPath = useMemo(() => {
    if (!link) return null;
    const anchor = portPos(registry, graph, link.from, link.dir);
    if (!anchor) return null;
    const [a, b] = link.dir === "out" ? [anchor, link.cursor] : [link.cursor, anchor];
    const c = Math.max(CURVE_MIN, Math.abs(b.x - a.x) * 0.5);
    return `M ${a.x} ${a.y} C ${a.x + c} ${a.y}, ${b.x - c} ${b.y}, ${b.x} ${b.y}`;
  }, [link, graph, registry]);

  const fit = useCallback(() => {
    const box = hostRef.current?.getBoundingClientRect();
    const b = graphBounds(registry, graph);
    if (!box || b.w === 0 || b.h === 0) return;
    const pad = 48;
    const zoom = clamp(Math.min((box.width - pad * 2) / b.w, (box.height - pad * 2) / b.h), 0.25, 1.5);
    setView({
      zoom,
      x: (box.width - b.w * zoom) / 2 - b.x * zoom,
      y: (box.height - b.h * zoom) / 2 - b.y * zoom,
    });
  }, [graph, registry]);

  // 首屏自动适应, 免得图落在视口外看起来是空的
  const didFit = useRef(false);
  useLayoutEffect(() => {
    if (didFit.current || graph.nodes.length === 0) return;
    didFit.current = true;
    fit();
  }, [fit, graph.nodes.length]);

  /**
   * 进出全屏后重新适应。
   *
   * 不做这件事的话, 全屏后画布从 620px 变成 1080px, 但视口 transform 还是
   * 按旧尺寸算的 —— 图会挤在左上角一小块, 大片空白, 看起来像"全屏没生效"。
   * 退出时同理。等一帧再 fit, 让浏览器先完成尺寸变更。
   */
  useEffect(() => {
    const id = requestAnimationFrame(() => fit());
    return () => cancelAnimationFrame(id);
  }, [expanded, fit]);

  return (
    <div
      ref={hostRef}
      className={cn(
        "relative overflow-hidden border-border bg-background",
        expanded ? "h-screen w-screen" : "rounded-xl border",
        // 回退模式下要 fixed + 高 z, 否则会被页面其它浮层盖住
        maximized && "fixed inset-0 z-[var(--z-modal)]",
        className
      )}
      // 全屏时用 100dvh/100vw: 100% 在 fixed 容器里解析不到视口高度,
      // 会塌成 0; dvh 还能正确处理移动端地址栏伸缩。
      style={{
        height: expanded ? "100dvh" : height,
        width: expanded ? "100vw" : undefined,
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={(e) => {
        e.preventDefault();
        onOpenMenu?.(toGraph(e.clientX, e.clientY));
      }}
    >
      {/* 网格跟着视口走, 所以缩放平移时网格不漂 */}
      {showGrid && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in srgb, var(--border) 60%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--border) 60%, transparent) 1px, transparent 1px)",
            backgroundSize: `${24 * view.zoom}px ${24 * view.zoom}px`,
            backgroundPosition: `${view.x}px ${view.y}px`,
          }}
        />
      )}

      {/* 注释层: 在网格之上、连线之下 —— 它是背景分组, 压住线会挡住拓扑关系 */}
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`, width: 0, height: 0 }}
      >
        {(graph.comments ?? []).map((c) => (
          <div
            key={c.id}
            className="absolute"
            style={{ left: c.x, top: c.y, width: c.w, height: c.h }}
          >
            <div
              className={cn(
                "flex h-[22px] items-center gap-1 rounded-t-md border-b px-2",
                COMMENT_TONE[c.tone ?? "default"]
              )}
            >
              {editingComment === c.id ? (
                <input
                  autoFocus
                  defaultValue={c.title ?? ""}
                  className="min-w-0 flex-1 bg-transparent text-[11px] font-medium outline-none"
                  onBlur={(e) => {
                    onCommentChange?.(c.id, { title: e.target.value });
                    setEditingComment(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") setEditingComment(null);
                  }}
                />
              ) : (
                <span
                  className="min-w-0 flex-1 truncate text-[11px] font-medium"
                  onDoubleClick={() => setEditingComment(c.id)}
                >
                  {c.title || "注释"}
                </span>
              )}
            </div>
            {c.body ? (
              <div className="px-2 py-1 text-[11px] leading-snug opacity-80">{c.body}</div>
            ) : null}
          </div>
        ))}
      </div>

      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <g transform={`translate(${view.x} ${view.y}) scale(${view.zoom})`}>
          {edges.map((e) => {
            const c = Math.max(CURVE_MIN, Math.abs(e.b.x - e.a.x) * 0.5);
            return (
              <path
                key={e.id}
                d={`M ${e.a.x} ${e.a.y} C ${e.a.x + c} ${e.a.y}, ${e.b.x - c} ${e.b.y}, ${e.b.x} ${e.b.y}`}
                fill="none"
                strokeWidth={e.exec ? 1.5 : 1.25}
                className={cn(
                  e.bad ? "stroke-destructive" : e.exec ? "stroke-foreground/70" : "stroke-muted-foreground/70"
                )}
              />
            );
          })}
          {previewPath && (
            <path
              d={previewPath}
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              className={cn(
                link?.verdict == null
                  ? "stroke-muted-foreground"
                  : link.verdict.ok
                    ? "stroke-emerald-400"
                    : "stroke-destructive"
              )}
            />
          )}
          {marquee && (
            <rect
              x={Math.min(marquee.x0, marquee.x1)}
              y={Math.min(marquee.y0, marquee.y1)}
              width={Math.abs(marquee.x1 - marquee.x0)}
              height={Math.abs(marquee.y1 - marquee.y0)}
              className="fill-primary/10 stroke-primary/60"
              strokeWidth={1}
            />
          )}
        </g>
      </svg>

      {/* 节点层。一个 transform 容器, 节点用绝对定位 */}
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`, width: 0, height: 0 }}
      >
        {graph.nodes.map((n) => {
          const nv = validation?.byNode.get(n.id);
          const portErrors: Record<string, boolean> = {};
          for (const k of Object.keys(nv?.portErrors ?? {})) portErrors[k] = true;
          return (
            <div
              key={n.id}
              className="absolute"
              style={{ left: n.x, top: n.y, width: nodeWidth(registry, n) }}
              onDoubleClick={() => { if (n.subgraph) onEnterSubgraph?.(n.id, n.subgraph); }}
            >
              <BlueprintNodeCard
                registry={registry}
                node={n}
                selected={selected?.has(n.id)}
                connected={connectedInputs[n.id]}
                portErrors={portErrors}
                onParamChange={(k, v) => onNodeParamChange?.(n.id, k, v)}
              />
              {nv && !nv.ok && (
                <div className="mt-1 rounded border border-destructive/40 bg-destructive/10 px-1.5 py-0.5 text-[11px] text-destructive">
                  {nv.issues.find((i) => i.level === "error")?.message}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="absolute left-2 top-2 flex items-center gap-1">
        {toolbar ?? (
          <>
            <CanvasButton onClick={fit} title="缩放到适应">适应</CanvasButton>
            <CanvasButton onClick={() => setView({ x: 0, y: 0, zoom: 1 })} title="重置视图">1:1</CanvasButton>
            <span className="px-1 text-[11px] tabular-nums text-muted-foreground">{Math.round(view.zoom * 100)}%</span>
            {allowFullscreen && (
              <CanvasButton
                onClick={toggleFullscreen}
                title={expanded ? "退出全屏 (Esc)" : "全屏"}
              >
                {expanded ? "退出全屏" : "全屏"}
              </CanvasButton>
            )}
          </>
        )}
      </div>

      {link?.verdict?.ok && link.verdict.replaces && (
        <div className="pointer-events-none absolute bottom-2 left-2 rounded border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground">
          松手将替换原有连线
        </div>
      )}

      {link?.verdict && !link.verdict.ok && (
        <div className="pointer-events-none absolute bottom-2 left-2 rounded border border-destructive/40 bg-card px-2 py-1 text-[11px] text-destructive">
          {reasonText(link.verdict.reason)}
        </div>
      )}

      {paletteAt && (
        <div className="absolute right-2 top-2 z-[var(--z-panel)] w-56 overflow-hidden rounded-lg border border-border bg-card shadow-md">
          <div className="border-b border-border px-2.5 py-1.5 text-[11px] text-muted-foreground">连到新节点</div>
          <div className="max-h-64">
            <BlueprintPalette
              registry={registry}
              onPick={(type) => {
                onAddNode?.(type, paletteAt);
                setPaletteAt(null);
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => setPaletteAt(null)}
            className="w-full border-t border-border px-2.5 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
}

/** 注释标题条的命中区域 (只上沿 22px)。 */
function hitCommentBar(
  comments: readonly { id: string; x: number; y: number; w: number; h: number }[] | undefined,
  p: { x: number; y: number }
): { id: string; x: number; y: number } | undefined {
  if (!comments) return undefined;
  // 倒序: 后加的在上面
  for (let i = comments.length - 1; i >= 0; i--) {
    const c = comments[i];
    if (p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + COMMENT_BAR_H) {
      return { id: c.id, x: c.x, y: c.y };
    }
  }
  return undefined;
}

const COMMENT_BAR_H = 22;

/** 注释的语义色。只允许这四种 —— 放开任意颜色换肤时又会失效。 */
const COMMENT_TONE: Record<string, string> = {
  default: "border-border/60 bg-muted/40 text-muted-foreground",
  primary: "border-primary/40 bg-primary/10 text-primary",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
};

function CanvasButton({
  onClick, title, children,
}: { readonly onClick: () => void; readonly title?: string; readonly children: ReactNode }): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="rounded border border-border bg-card/80 px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
    >
      {children}
    </button>
  );
}

/** reason -> 人话。UI 靠 reason 而不是 message: message 是英文的。 */
function reasonText(reason?: string): string {
  switch (reason) {
    case "type-mismatch": return "类型不匹配";
    case "self-loop": return "不能连回自己";
    case "duplicate": return "已经连过了";
    case "occupied": return "该输入口已占用";
    case "direction": return "执行流与数据流不能互连";
    case "missing-port": return "端口不存在";
    default: return "不能这样连";
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export { EXEC_IN_PORT };
