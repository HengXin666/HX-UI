import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type Simulation, type SimulationLinkDatum, type SimulationNodeDatum } from "d3-force";
import { Maximize2, Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

export interface GraphNode {
  id: string;
  label?: string;
  /** 分组, 决定颜色和图例 */
  group?: string;
  /** 权重, 决定圆的大小; 不给就按连接数 */
  value?: number;
}
export interface GraphLink {
  source: string;
  target: string;
  /** 权重, 决定线宽 */
  value?: number;
}

export interface ForceGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  height?: number;
  /** 分组顺序 (颜色按这个顺序取 chart-1..5); 不给按出现顺序 */
  groups?: string[];
  /** 连线的目标长度 */
  linkDistance?: number;
  /** 节点之间的斥力, 越负越散 */
  charge?: number;
  /** auto: 只写大节点和悬停的一圈; all; none */
  labels?: "auto" | "all" | "none";
  /** 有向图: 连线带箭头 */
  directed?: boolean;
  /** 图例可点击隐藏分组 */
  legend?: boolean;
  format?: (v: number) => string;
  valueLabel?: string;
  onSelect?: (id: string | null) => void;
  ariaLabel?: string;
  className?: string;
}

type Status = "enter" | "live" | "exit";
interface SimNode extends SimulationNodeDatum { id: string; r: number }
interface SimLink extends SimulationLinkDatum<SimNode> { key: string; value: number }
interface RNode { id: string; label: string; group: string; value?: number; status: Status; gen: number }
interface RLink { key: string; source: string; target: string; value: number; status: Status; gen: number }

const EXIT_MS = 220;
const linkKey = (l: GraphLink) => `${l.source}→${l.target}`;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * 力导向图: 服务调用拓扑, 用户关系, 知识图谱.
 * 增删节点时旧节点保持原位, 新节点从相邻节点处长出来, 删掉的淡出; 拖动节点, 滚轮缩放, 拖空白处平移;
 * 键盘方向键在节点间跳, Enter 选中, Esc 取消, +/- 缩放, 0 复位. 减弱动效时布局一次算完, 只做淡入淡出.
 */
export function ForceGraph({
  nodes, links, height = 420, groups: groupOrder, linkDistance = 56, charge = -180, labels = "auto", directed = false,
  legend = true, format = (v) => v.toLocaleString("zh-CN"), valueLabel = "权重", onSelect, ariaLabel = "关系图", className,
}: ForceGraphProps) {
  const reduced = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const box = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const viewRef = useRef<SVGGElement>(null);
  const [width, setWidth] = useState(640);
  // 首帧 state 里的宽度可能还是默认值, 量的时候直接读容器
  const W = () => box.current?.clientWidth || width;

  // 图例隐藏的分组也走同一套增删动画
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const groups = useMemo(() => groupOrder ?? [...new Set(nodes.map((n) => n.group ?? "默认"))], [groupOrder, nodes]);
  const color = useCallback((g: string) => `var(--chart-${(Math.max(0, groups.indexOf(g)) % 5) + 1})`, [groups]);

  const visible = useMemo(() => {
    const ns = nodes.filter((n) => !hidden.has(n.group ?? "默认"));
    const ids = new Set(ns.map((n) => n.id));
    return { nodes: ns, links: links.filter((l) => ids.has(l.source) && ids.has(l.target) && l.source !== l.target) };
  }, [nodes, links, hidden]);

  // 连接数 + 半径
  const degree = useMemo(() => {
    const d = new Map<string, number>();
    for (const l of visible.links) { d.set(l.source, (d.get(l.source) ?? 0) + 1); d.set(l.target, (d.get(l.target) ?? 0) + 1); }
    return d;
  }, [visible]);
  const maxValue = useMemo(() => Math.max(1, ...visible.nodes.map((n) => n.value ?? 0)), [visible]);
  const maxLink = useMemo(() => Math.max(1, ...visible.links.map((l) => l.value ?? 1)), [visible]);
  const radius = useCallback((n: { id: string; value?: number }) =>
    n.value != null ? 4 + Math.sqrt(n.value / maxValue) * 14 : 5 + Math.min(10, degree.get(n.id) ?? 0) * 1.1, [degree, maxValue]);

  // ---- 渲染列表: 当前 + 正在退场的 ----
  const [shown, setShown] = useState<{ nodes: RNode[]; links: RLink[] }>({ nodes: [], links: [] });
  const shownRef = useRef(shown);
  const [live, setLive] = useState("");
  const first = useRef(true);

  // ---- 模拟 ----
  const sim = useRef<Simulation<SimNode, SimLink> | null>(null);
  const pos = useRef(new Map<string, SimNode>());
  const nodeEls = useRef(new Map<string, SVGGElement>());
  const linkEls = useRef(new Map<string, { el: SVGLineElement; s: string; t: string }>());
  const view = useRef({ k: 1, x: 0, y: 0 });
  const touched = useRef(false);
  const visibleRef = useRef(true);

  const applyView = useCallback((animate: boolean) => {
    const g = viewRef.current; if (!g) return;
    const { k, x, y } = view.current;
    g.style.transition = animate && !reduced ? "transform 420ms cubic-bezier(0.22,1,0.36,1)" : "none";
    g.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
  }, [reduced]);

  const paint = useCallback(() => {
    for (const [id, el] of nodeEls.current) { const n = pos.current.get(id); if (n) el.setAttribute("transform", `translate(${n.x ?? 0},${n.y ?? 0})`); }
    for (const { el, s, t } of linkEls.current.values()) {
      const a = pos.current.get(s), b = pos.current.get(t); if (!a || !b) continue;
      let x2 = b.x ?? 0, y2 = b.y ?? 0;
      if (directed) {
        const dx = x2 - (a.x ?? 0), dy = y2 - (a.y ?? 0), d = Math.hypot(dx, dy) || 1, cut = b.r + 3;
        x2 -= (dx / d) * cut; y2 -= (dy / d) * cut;
      }
      el.setAttribute("x1", String(a.x ?? 0)); el.setAttribute("y1", String(a.y ?? 0));
      el.setAttribute("x2", String(x2)); el.setAttribute("y2", String(y2));
    }
    if (++ticks.current % 4 === 0 || sim.current?.alpha() === 0 || ticks.current < 2) declutter.current?.();
    if (!touched.current && !reduced) follow.current?.();
    tipFollow.current?.();
  }, [directed, reduced]);
  // 用户没动过视角时, 镜头每帧缓缓贴合节点范围 (不跳)
  const follow = useRef<(() => void) | null>(null);
  const ticks = useRef(0);
  const labelEls = useRef(new Map<string, SVGTextElement>());
  // 标签避让: 按优先级放, 和已放的标签或别的节点重叠就藏起来
  const declutter = useRef<(() => void) | null>(null);

  const target = () => {
    const ns = [...pos.current.values()].filter((n) => shownIds.current.has(n.id));
    if (!ns.length) return null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const n of ns) { x0 = Math.min(x0, (n.x ?? 0) - n.r); y0 = Math.min(y0, (n.y ?? 0) - n.r); x1 = Math.max(x1, (n.x ?? 0) + n.r); y1 = Math.max(y1, (n.y ?? 0) + n.r + 16); }
    const pad = 28, width = W();
    const k = clamp(Math.min((width - pad * 2) / Math.max(1, x1 - x0), (height - pad * 2 - 20) / Math.max(1, y1 - y0)), 0.3, 1.6);
    return { k, x: width / 2 - ((x0 + x1) / 2) * k, y: (height - 20) / 2 - ((y0 + y1) / 2) * k };
  };
  const fit = useCallback((animate: boolean) => {
    const t = target(); if (!t) return;
    view.current = t;
    applyView(animate);
  }, [width, height, applyView]); // eslint-disable-line react-hooks/exhaustive-deps
  const shownIds = useRef(new Set<string>());
  follow.current = () => {
    const t = target(); if (!t) return;
    const v = view.current, a = 0.12;
    view.current = { k: v.k + (t.k - v.k) * a, x: v.x + (t.x - v.x) * a, y: v.y + (t.y - v.y) * a };
    applyView(false);
  };

  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el); return () => ro.disconnect();
  }, []);

  // 建一次模拟
  useEffect(() => {
    const s = forceSimulation<SimNode, SimLink>([]).alphaDecay(0.035).velocityDecay(0.35).stop();
    s.on("tick", () => paint());
    s.on("end", () => { if (!touched.current) fit(true); });
    sim.current = s;
    return () => { s.stop(); s.on("tick", null).on("end", null); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // tick / end 回调随 paint / fit 更新
  useEffect(() => {
    const s = sim.current; if (!s) return;
    s.on("tick", () => paint());
    s.on("end", () => { if (!touched.current) fit(true); });
  }, [paint, fit]);

  // 力的参数
  useEffect(() => {
    const s = sim.current; if (!s) return;
    s.force("charge", forceManyBody<SimNode>().strength(charge).distanceMax(400))
      .force("x", forceX<SimNode>(W() / 2).strength(0.07))
      .force("y", forceY<SimNode>(height / 2).strength(0.09))
      .force("collide", forceCollide<SimNode>((d) => d.r + 3));
    const lf = s.force("link") as ReturnType<typeof forceLink<SimNode, SimLink>> | undefined;
    if (lf) lf.distance((l) => linkDistance + ((l.source as SimNode).r + (l.target as SimNode).r) * 0.6);
    if (first.current) return;
    if (!touched.current) fit(true);
    settle(0.3);
  }, [charge, linkDistance, width, height]); // eslint-disable-line react-hooks/exhaustive-deps

  const settle = (alpha: number) => {
    const s = sim.current; if (!s) return;
    if (reduced) {
      // 一次算完, 只画结果
      s.alpha(alpha).stop();
      for (let i = 0; i < 300 && s.alpha() > s.alphaMin(); i++) s.tick();
      paint(); if (!touched.current) fit(false);
    } else if (visibleRef.current) s.alpha(alpha).restart();
    else s.alpha(alpha);
  };

  // 数据变化: 对比出新增 / 保留 / 退场
  useEffect(() => {
    const s = sim.current; if (!s) return;
    const nextIds = new Set(visible.nodes.map((n) => n.id));
    const added: string[] = [], removed: string[] = [];
    {
      const prev = shownRef.current;
      const prevMap = new Map(prev.nodes.map((n) => [n.id, n]));
      const ns: RNode[] = visible.nodes.map((n) => {
        const p = prevMap.get(n.id);
        const status: Status = p && p.status !== "exit" ? "live" : "enter";
        if (status === "enter" && !first.current) added.push(n.label ?? n.id);
        return { id: n.id, label: n.label ?? n.id, group: n.group ?? "默认", value: n.value, status, gen: p ? (p.status === "exit" ? p.gen + 1 : p.gen) : 0 };
      });
      for (const p of prev.nodes) if (!nextIds.has(p.id)) { if (p.status !== "exit") removed.push(p.label); ns.push({ ...p, status: "exit" }); }
      const nextKeys = new Set(visible.links.map(linkKey));
      const prevL = new Map(prev.links.map((l) => [l.key, l]));
      const ls: RLink[] = visible.links.map((l) => {
        const k = linkKey(l), p = prevL.get(k);
        return { key: k, source: l.source, target: l.target, value: l.value ?? 1, status: p && p.status !== "exit" ? "live" : "enter", gen: p ? (p.status === "exit" ? p.gen + 1 : p.gen) : 0 };
      });
      for (const p of prev.links) if (!nextKeys.has(p.key)) ls.push({ ...p, status: "exit" });
      shownRef.current = { nodes: ns, links: ls };
      setShown(shownRef.current);
    }
    shownIds.current = nextIds;

    // 模拟节点: 保留旧位置, 新节点放在已在场的邻居旁边
    const cx = W() / 2, cy = height / 2;
    const simNodes: SimNode[] = visible.nodes.map((n) => {
      let p = pos.current.get(n.id);
      if (!p) {
        const nb = visible.links.find((l) => (l.source === n.id && pos.current.has(l.target)) || (l.target === n.id && pos.current.has(l.source)));
        const anchor = nb ? pos.current.get(nb.source === n.id ? nb.target : nb.source) : undefined;
        const a = Math.random() * Math.PI * 2;
        p = { id: n.id, r: radius(n), x: (anchor?.x ?? cx) + Math.cos(a) * 12, y: (anchor?.y ?? cy) + Math.sin(a) * 12 };
        pos.current.set(n.id, p);
      }
      p.r = radius(n);
      return p;
    });
    const simLinks: SimLink[] = visible.links.map((l) => ({ key: linkKey(l), source: l.source, target: l.target, value: l.value ?? 1 }));
    s.nodes(simNodes);
    s.force("link", forceLink<SimNode, SimLink>(simLinks).id((d) => d.id)
      .distance((l) => linkDistance + ((l.source as SimNode).r + (l.target as SimNode).r) * 0.6)
      .strength((l) => 0.5 / Math.min(degree.get((l.source as SimNode).id) ?? 1, degree.get((l.target as SimNode).id) ?? 1) + 0.08));

    if (first.current) {
      first.current = false;
      // 首屏: 先在后台算出大致布局再显示, 免得一打开满屏乱飞
      s.alpha(1); for (let i = 0; i < 120; i++) s.tick();
      paint(); fit(false);
      settle(0.25);
    } else {
      settle(added.length || removed.length ? 0.5 : 0.25);
      const msg = [added.length && `新增 ${added.slice(0, 3).join("、")}${added.length > 3 ? ` 等 ${added.length} 个` : ""}`, removed.length && `移除 ${removed.slice(0, 3).join("、")}${removed.length > 3 ? ` 等 ${removed.length} 个` : ""}`].filter(Boolean).join("，");
      if (msg) setLive(msg);
    }
    const t = window.setTimeout(() => {
      const prev = shownRef.current;
      shownRef.current = { nodes: prev.nodes.filter((n) => n.status !== "exit"), links: prev.links.filter((l) => l.status !== "exit") };
      setShown(shownRef.current);
      for (const id of [...pos.current.keys()]) if (!nextIds.has(id)) pos.current.delete(id);
    }, EXIT_MS + 40);
    return () => window.clearTimeout(t);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // 半径变了 (权重更新) 也要更新碰撞
  useEffect(() => { for (const n of visible.nodes) { const p = pos.current.get(n.id); if (p) p.r = radius(n); } }, [radius, visible]);

  // 不在视口里就停
  useEffect(() => {
    const el = box.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      visibleRef.current = e.isIntersecting;
      const s = sim.current; if (!s || reduced) return;
      if (e.isIntersecting && s.alpha() > s.alphaMin()) s.restart(); else if (!e.isIntersecting) s.stop();
    });
    io.observe(el); return () => io.disconnect();
  }, [reduced]);

  // ---- 交互 ----
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [legendHover, setLegendHover] = useState<string | null>(null);
  const active = hover ?? focusId ?? selected;
  const neighbors = useMemo(() => {
    if (!active) return null;
    const set = new Set([active]);
    for (const l of visible.links) { if (l.source === active) set.add(l.target); if (l.target === active) set.add(l.source); }
    return set;
  }, [active, visible]);

  const toSim = (clientX: number, clientY: number) => {
    const r = svgRef.current!.getBoundingClientRect(), v = view.current;
    return { x: (clientX - r.left - v.x) / v.k, y: (clientY - r.top - v.y) / v.k };
  };
  const zoomAt = (f: number, sx = width / 2, sy = height / 2, animate = false) => {
    const v = view.current, k = clamp(v.k * f, 0.3, 4);
    view.current = { k, x: sx - ((sx - v.x) / v.k) * k, y: sy - ((sy - v.y) / v.k) * k };
    touched.current = true; applyView(animate);
  };
  const reset = () => { touched.current = false; fit(true); };

  useEffect(() => {
    const el = svgRef.current; if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(e.deltaY > 0 ? 1 / 1.12 : 1.12, e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  const drag = useRef<{ mode: "node" | "pan"; id?: string; sx: number; sy: number; vx: number; vy: number; moved: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const id = (e.target as Element).closest<SVGGElement>("[data-node]")?.dataset.node;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = { mode: id ? "node" : "pan", id, sx: e.clientX, sy: e.clientY, vx: view.current.x, vy: view.current.y, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current; if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 4) return;
    d.moved = true;
    if (d.mode === "pan") {
      view.current = { ...view.current, x: d.vx + e.clientX - d.sx, y: d.vy + e.clientY - d.sy };
      touched.current = true; applyView(false);
    } else if (d.id) {
      const n = pos.current.get(d.id); if (!n) return;
      const p = toSim(e.clientX, e.clientY);
      n.fx = p.x; n.fy = p.y; touched.current = true;
      if (reduced) { n.x = p.x; n.y = p.y; paint(); }
      else sim.current?.alphaTarget(0.25).restart();
    }
  };
  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current; drag.current = null; if (!d) return;
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    if (d.mode === "node" && d.id) {
      const n = pos.current.get(d.id);
      if (n) { n.fx = null; n.fy = null; }
      if (!reduced) sim.current?.alphaTarget(0);
      if (!d.moved) choose(d.id);
    } else if (!d.moved) choose(null);
  };
  const choose = (id: string | null) => {
    const next = id && id === selected ? null : id;
    setSelected(next); onSelect?.(next);
  };

  // 键盘: 方向键找那个方向最近的节点
  const order = useMemo(() => [...visible.nodes].sort((a, b) => radius(b) - radius(a)), [visible, radius]);
  const tabId = focusId && shownIds.current.has(focusId) ? focusId : selected ?? order[0]?.id;
  const ensureVisible = (id: string) => {
    const n = pos.current.get(id); if (!n) return;
    const v = view.current, sx = (n.x ?? 0) * v.k + v.x, sy = (n.y ?? 0) * v.k + v.y, m = 30;
    if (sx < m || sx > width - m || sy < m || sy > height - m) {
      view.current = { ...v, x: width / 2 - (n.x ?? 0) * v.k, y: height / 2 - (n.y ?? 0) * v.k };
      touched.current = true; applyView(true);
    }
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const cur = tabId ? pos.current.get(tabId) : undefined;
    const dirs: Record<string, [number, number]> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (dirs[e.key] && cur) {
      e.preventDefault();
      const [dx, dy] = dirs[e.key];
      let best: string | null = null, score = Infinity;
      for (const n of visible.nodes) {
        if (n.id === cur.id) continue;
        const p = pos.current.get(n.id); if (!p) continue;
        const vx = (p.x ?? 0) - (cur.x ?? 0), vy = (p.y ?? 0) - (cur.y ?? 0);
        const along = vx * dx + vy * dy; if (along <= 1) continue;
        const sc = along + Math.abs(vx * dy - vy * dx) * 2;
        if (sc < score) { score = sc; best = n.id; }
      }
      if (best) { setFocusId(best); nodeEls.current.get(best)?.focus(); ensureVisible(best); }
    } else if ((e.key === "Enter" || e.key === " ") && tabId) { e.preventDefault(); choose(tabId); }
    else if (e.key === "Escape") { setSelected(null); onSelect?.(null); }
    else if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomAt(1.25, undefined, undefined, true); }
    else if (e.key === "-" || e.key === "_") { e.preventDefault(); zoomAt(0.8, undefined, undefined, true); }
    else if (e.key === "0" || e.key === "Home") { e.preventDefault(); reset(); }
  };

  // ---- 提示框跟着节点走 ----
  const tipRef = useRef<HTMLDivElement>(null);
  const tipFollow = useRef<(() => void) | null>(null);
  tipFollow.current = () => {
    const el = tipRef.current, n = active ? pos.current.get(active) : undefined; if (!el || !n) return;
    const v = view.current, sx = (n.x ?? 0) * v.k + v.x, sy = (n.y ?? 0) * v.k + v.y - n.r * v.k - 10;
    const w = el.offsetWidth;
    el.style.transform = `translate(${clamp(sx - w / 2, 4, width - w - 4)}px, ${sy - el.offsetHeight < 4 ? sy + n.r * v.k * 2 + 20 : sy - el.offsetHeight}px)`;
  };
  useLayoutEffect(() => { tipFollow.current?.(); });

  declutter.current = () => {
    const placed: [number, number, number, number][] = [];
    const circles = [...shownIds.current].map((id) => pos.current.get(id)).filter(Boolean) as SimNode[];
    const prio = [...labelEls.current.keys()].sort((a, b) => (neighbors?.has(b) ? 1 : 0) - (neighbors?.has(a) ? 1 : 0) || (b === active ? 1 : 0) - (a === active ? 1 : 0) || (pos.current.get(b)?.r ?? 0) - (pos.current.get(a)?.r ?? 0));
    for (const id of prio) {
      const el = labelEls.current.get(id), n = pos.current.get(id); if (!el || !n) continue;
      const w = (el.textContent?.length ?? 0) * 6.2 + 4, x = (n.x ?? 0) - w / 2, y = (n.y ?? 0) + n.r + 2;
      const box: [number, number, number, number] = [x, y, x + w, y + 13];
      const hit = placed.some((b) => b[0] < box[2] && b[2] > box[0] && b[1] < box[3] && b[3] > box[1])
        || circles.some((c) => c.id !== id && Math.hypot(clamp(c.x ?? 0, box[0], box[2]) - (c.x ?? 0), clamp(c.y ?? 0, box[1], box[3]) - (c.y ?? 0)) < c.r - 1);
      const pinned = id === active;
      el.style.opacity = hit && !pinned ? "0" : "";
      if (!hit || pinned) placed.push(box);
    }
  };
  useLayoutEffect(() => { declutter.current?.(); });

  const activeNode = active ? visible.nodes.find((n) => n.id === active) : undefined;
  const activeNbrs = activeNode ? [...(neighbors ?? [])].filter((id) => id !== active).map((id) => visible.nodes.find((n) => n.id === id)?.label ?? id) : [];
  const labelSet = useMemo(() => {
    if (labels === "none") return new Set<string>();
    if (labels === "all") return new Set(visible.nodes.map((n) => n.id));
    return new Set(order.slice(0, Math.min(10, Math.ceil(order.length / 3))).map((n) => n.id));
  }, [labels, visible, order]);

  const dimNode = (n: RNode) => (neighbors ? !neighbors.has(n.id) : legendHover ? n.group !== legendHover : false);
  const linkOn = (l: RLink) => (active ? l.source === active || l.target === active : legendHover ? false : null);
  const groupOf = (id: string) => visible.nodes.find((n) => n.id === id)?.group ?? "默认";

  return (
    <div className={cn("w-full", className)}>
      <div ref={box} className="relative w-full overflow-hidden rounded-xl border bg-background/40" style={{ height }}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          role="group"
          aria-roledescription="关系图"
          aria-label={`${ariaLabel}，${visible.nodes.length} 个节点，${visible.links.length} 条连线。方向键在节点间移动，Enter 选中，加减号缩放，0 复位`}
          className={cn("block touch-none select-none outline-none", drag.current?.mode === "pan" ? "cursor-grabbing" : "cursor-grab")}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={(e) => { if (!(e.target as Element).closest("[data-node]")) reset(); }}
          onKeyDown={onKeyDown}
        >
          {directed && (
            <defs>
              <marker id={`${uid}-arr`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill="var(--muted-foreground)" />
              </marker>
              <marker id={`${uid}-arr-on`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill="var(--foreground)" />
              </marker>
            </defs>
          )}
          <g ref={viewRef} style={{ transformOrigin: "0 0" }}>
            <g>
              {shown.links.map((l) => {
                const on = linkOn(l);
                return (
                  <line
                    key={`${l.key}#${l.gen}`}
                    ref={(el) => {
                      if (el) { linkEls.current.set(l.key, { el, s: l.source, t: l.target }); paintOne(el, l.source, l.target); }
                      else linkEls.current.delete(l.key);
                    }}
                    stroke={on ? color(groupOf(l.source)) : "var(--muted-foreground)"}
                    strokeWidth={0.8 + Math.sqrt(l.value / maxLink) * 2.6}
                    strokeLinecap="round"
                    markerEnd={directed ? `url(#${uid}-arr${on ? "-on" : ""})` : undefined}
                    className={cn("hx-fg-link", l.status === "enter" && "hx-fg-link-enter", l.status === "exit" && "hx-fg-link-exit")}
                    style={{ opacity: l.status === "exit" ? 0 : on === true ? 0.9 : on === false ? 0.06 : 0.32 }}
                  />
                );
              })}
            </g>
            <g>
              {shown.nodes.map((n) => {
                const p = pos.current.get(n.id);
                const r = n.status === "exit" ? p?.r ?? 6 : radius(n);
                const sel = n.id === selected;
                const showLabel = labelSet.has(n.id) || (neighbors?.has(n.id) ?? false) || sel;
                const deg = degree.get(n.id) ?? 0;
                return (
                  <g
                    key={`${n.id}#${n.gen}`}
                    data-node={n.id}
                    ref={(el) => {
                      if (el) { nodeEls.current.set(n.id, el); const q = pos.current.get(n.id); if (q) el.setAttribute("transform", `translate(${q.x ?? 0},${q.y ?? 0})`); }
                      else nodeEls.current.delete(n.id);
                    }}
                    tabIndex={n.status !== "exit" && n.id === tabId ? 0 : -1}
                    role="button"
                    aria-pressed={sel}
                    aria-hidden={n.status === "exit" || undefined}
                    aria-label={`${n.label}，${n.group}${n.value != null ? `，${valueLabel} ${format(n.value)}` : ""}，${deg} 条连线`}
                    onPointerEnter={() => setHover(n.id)}
                    onPointerLeave={() => setHover((h) => (h === n.id ? null : h))}
                    onFocus={() => { setFocusId(n.id); ensureVisible(n.id); }}
                    onBlur={() => setFocusId((f) => (f === n.id ? null : f))}
                    className="cursor-pointer outline-none [&:focus-visible_.hx-fg-ring]:opacity-100"
                  >
                    <g
                      className={cn("hx-fg-node", n.status === "enter" && "hx-fg-node-enter", n.status === "exit" && "hx-fg-node-exit")}
                      style={{ opacity: n.status === "exit" ? 0 : dimNode(n) ? 0.18 : 1 }}
                    >
                      <circle className="hx-fg-ring opacity-0 transition-opacity duration-150" style={{ r: r + 5 } as React.CSSProperties} r={r + 5} fill="none" stroke="var(--ring)" strokeWidth={2} />
                      <circle
                        r={r}
                        style={{ r, transition: "r 220ms cubic-bezier(0.22,1,0.36,1)" } as React.CSSProperties}
                        fill={color(n.group)}
                        stroke={sel ? "var(--foreground)" : "var(--background)"}
                        strokeWidth={sel ? 2.5 : 1.5}
                      />
                      {showLabel && (
                        <text ref={(el) => { if (el) labelEls.current.set(n.id, el); else labelEls.current.delete(n.id); }} y={r + 12} textAnchor="middle" fontSize={11} className="hx-fg-label pointer-events-none fill-foreground transition-opacity duration-150" stroke="var(--background)" strokeWidth={3} paintOrder="stroke" strokeLinejoin="round">
                          {n.label}
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}
            </g>
          </g>
        </svg>

        {/* 悬停 / 聚焦提示 */}
        <div
          ref={tipRef}
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-0 left-0 z-10 min-w-36 max-w-60 rounded-lg border bg-popover/95 px-3 py-2 text-xs text-popover-foreground shadow-float backdrop-blur transition-opacity duration-150",
            activeNode && !drag.current?.moved ? "opacity-100" : "opacity-0",
          )}
        >
          {activeNode && (
            <>
              <p className="flex items-center gap-1.5 font-medium"><span className="size-2 rounded-full" style={{ background: color(activeNode.group ?? "默认") }} />{activeNode.label ?? activeNode.id}</p>
              <p className="mt-1 flex justify-between gap-4 text-muted-foreground"><span>{activeNode.group ?? "默认"}</span><span className="font-mono tabular-nums">{degree.get(activeNode.id) ?? 0} 条连线</span></p>
              {activeNode.value != null && <p className="flex justify-between gap-4 text-muted-foreground"><span>{valueLabel}</span><span className="font-mono text-foreground tabular-nums">{format(activeNode.value)}</span></p>}
              {activeNbrs.length > 0 && <p className="mt-1 truncate text-muted-foreground">相连：{activeNbrs.slice(0, 4).join("、")}{activeNbrs.length > 4 ? ` 等 ${activeNbrs.length} 个` : ""}</p>}
            </>
          )}
        </div>

        {/* 缩放工具 */}
        <div className="absolute top-2 right-2 flex items-center gap-0.5 rounded-lg border bg-background/80 p-0.5 backdrop-blur">
          {[
            { label: "放大", icon: Plus, on: () => zoomAt(1.25, undefined, undefined, true) },
            { label: "缩小", icon: Minus, on: () => zoomAt(0.8, undefined, undefined, true) },
            { label: "适应画布", icon: Maximize2, on: reset },
          ].map(({ label, icon: I, on }) => (
            <button key={label} type="button" onClick={on} aria-label={label} title={label}
              className="grid size-7 place-items-center rounded-md text-muted-foreground transition-[color,background-color,transform] duration-150 hover:bg-accent hover:text-foreground active:scale-90">
              <I className="size-3.5" aria-hidden />
            </button>
          ))}
        </div>
        <p className="pointer-events-none absolute bottom-2 left-3 text-[11px] text-muted-foreground max-sm:hidden">拖动节点 · 拖空白处平移 · 滚轮缩放 · 双击复位</p>
      </div>

      {legend && groups.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="分组，点击隐藏或显示">
          {groups.map((g) => {
            const off = hidden.has(g);
            const count = nodes.filter((n) => (n.group ?? "默认") === g).length;
            return (
              <button
                key={g}
                type="button"
                aria-pressed={!off}
                onClick={() => setHidden((h) => { const n = new Set(h); if (n.has(g)) n.delete(g); else n.add(g); return n; })}
                onPointerEnter={() => setLegendHover(off ? null : g)}
                onPointerLeave={() => setLegendHover(null)}
                onFocus={() => setLegendHover(off ? null : g)}
                onBlur={() => setLegendHover(null)}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs transition-[opacity,background-color,color] duration-150 hover:bg-accent",
                  off ? "text-muted-foreground opacity-60" : "text-foreground",
                )}
              >
                <span className={cn("size-2 rounded-full transition-transform duration-200", off && "scale-50")} style={{ background: color(g) }} />
                {g}<span className="font-mono text-muted-foreground tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      <p className="sr-only" aria-live="polite">{live}</p>
      <table className="sr-only">
        <caption>{ariaLabel}的连线</caption>
        <thead><tr><th scope="col">起点</th><th scope="col">终点</th><th scope="col">{valueLabel}</th></tr></thead>
        <tbody>
          {visible.links.slice(0, 200).map((l) => (
            <tr key={linkKey(l)}><td>{visible.nodes.find((n) => n.id === l.source)?.label ?? l.source}</td><td>{visible.nodes.find((n) => n.id === l.target)?.label ?? l.target}</td><td>{format(l.value ?? 1)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  function paintOne(el: SVGLineElement, s: string, t: string) {
    const a = pos.current.get(s), b = pos.current.get(t); if (!a || !b) return;
    el.setAttribute("x1", String(a.x ?? 0)); el.setAttribute("y1", String(a.y ?? 0));
    el.setAttribute("x2", String(b.x ?? 0)); el.setAttribute("y2", String(b.y ?? 0));
  }
}
