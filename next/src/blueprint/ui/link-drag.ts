import { canConnect, type ConnectResult } from "../connect";
import { findPin, getPorts } from "../ports";
import type { GraphOp } from "../ops";
import type { BlueprintGraph, PinRef } from "../types";
import type { MenuOrigin } from "./action-menu";
import type { BlueprintEditor } from "./editor";
import { pinPos, typeColor, wirePath } from "./geometry";
import { CONNECT_REASON, TYPE_LABEL } from "./labels";

/**
 * Dragging wires out of pins. Pure helpers used by the canvas gesture handler:
 * origins (the fixed ends), what is under the cursor, the verdict text, the live path, the commit ops.
 */

export interface LinkDrag {
  /** Fixed ends. One for a fresh wire; several when Ctrl+drag moves the links of a pin. */
  readonly origins: readonly MenuOrigin[];
  /** Wires being moved away (Ctrl+drag), removed on a successful drop. */
  readonly removing: readonly string[];
}

export interface LinkHover {
  readonly ref: PinRef;
  readonly verdicts: readonly ConnectResult[];
  readonly ok: boolean;
}

export const parsePinAttr = (v: string): { dir: "in" | "out"; pin: string } => {
  const i = v.indexOf(":");
  return { dir: v.slice(0, i) === "in" ? "in" : "out", pin: v.slice(i + 1) };
};

/** Start a drag from a pin. With `move` (Ctrl), the existing wires on the pin are picked up instead. */
export function startLink(ed: BlueprintEditor, ref: PinRef, dir: "in" | "out", move: boolean): LinkDrag | undefined {
  const g = ed.graph;
  const node = g.nodes.find((n) => n.id === ref.node);
  const pin = node && findPin(node, ref.pin, dir, ed.registry, g);
  if (!pin) return undefined;
  if (move) {
    const on = g.edges.filter((e) => (dir === "out" ? e.from.node === ref.node && e.from.pin === ref.pin : e.to.node === ref.node && e.to.pin === ref.pin));
    if (on.length) {
      const origins = on.flatMap((e) => {
        const other = dir === "out" ? e.to : e.from;
        const n = g.nodes.find((x) => x.id === other.node);
        const p = n && findPin(n, other.pin, dir === "out" ? "in" : "out", ed.registry, g);
        return p ? [{ ref: other, dir: p.direction, type: p.type }] : [];
      });
      return { origins, removing: on.map((e) => e.id) };
    }
  }
  return { origins: [{ ref, dir, type: pin.type }], removing: [] };
}

/** Graph without the wires being moved, so verdicts ignore them. */
const withoutMoving = (g: BlueprintGraph, drag: LinkDrag): BlueprintGraph =>
  drag.removing.length ? { ...g, edges: g.edges.filter((e) => !drag.removing.includes(e.id)) } : g;

/** Verdict for dropping on a pin, or on a node body (first pin that accepts, direct before autocast). */
export function hoverTarget(ed: BlueprintEditor, drag: LinkDrag, nodeId: string, pinAttr: string | undefined): LinkHover | undefined {
  const g = withoutMoving(ed.graph, drag);
  const check = (ref: PinRef) => drag.origins.map((o) => canConnect(g, o.ref, ref, ed.registry));
  if (pinAttr) {
    const { pin } = parsePinAttr(pinAttr);
    const ref = { node: nodeId, pin };
    const verdicts = check(ref);
    return { ref, verdicts, ok: verdicts.every((v) => v.ok) };
  }
  const node = g.nodes.find((n) => n.id === nodeId);
  if (!node || drag.origins.length === 0) return undefined;
  const want = drag.origins[0]!.dir === "out" ? "in" : "out";
  const ports = getPorts(node, ed.registry, g);
  const pins = (want === "in" ? ports.inputs : ports.outputs).filter((p) => !p.hidden).map((p) => p.id);
  let fallback: LinkHover | undefined;
  for (const conv of [false, true]) {
    for (const pin of pins) {
      const ref = { node: nodeId, pin };
      const verdicts = check(ref);
      const ok = verdicts.every((v) => v.ok && (conv || !v.conversion));
      if (ok) return { ref, verdicts, ok: true };
      fallback ??= { ref, verdicts, ok: false };
    }
  }
  return fallback;
}

/** Tooltip text next to the cursor: ✓ / ✗ and why. */
export function verdictText(ed: BlueprintEditor, h: LinkHover | undefined, overNode: boolean): { ok: boolean | undefined; text: string } {
  if (!h) return { ok: undefined, text: overNode ? "这个节点没有可连接的引脚" : "松开：选择要连接的节点" };
  const bad = h.verdicts.find((v) => !v.ok);
  if (bad && !bad.ok) {
    if (bad.reason === "type-mismatch") {
      const m = /:\s*(\S+)\s*->\s*(\S+)/.exec(bad.message);
      const t = (s: string | undefined) => (s ? TYPE_LABEL[s] ?? s : "?");
      return { ok: false, text: `${CONNECT_REASON["type-mismatch"]}：${t(m?.[1])} → ${t(m?.[2])}` };
    }
    return { ok: false, text: CONNECT_REASON[bad.reason] };
  }
  const v = h.verdicts[0];
  if (v?.ok && v.conversion) return { ok: true, text: `自动插入转换节点（${ed.registry.node(v.conversion)?.title ?? v.conversion}）` };
  if (h.verdicts.some((x) => x.ok && x.replaces.length)) return { ok: true, text: "替换现有连线" };
  return { ok: true, text: h.verdicts.length > 1 ? `移动 ${h.verdicts.length} 条连线` : "连接" };
}

/** Live wire path(s) from each origin to the cursor (or the snapped target pin). */
export function livePaths(ed: BlueprintEditor, drag: LinkDrag, cursor: { x: number; y: number }, h: LinkHover | undefined) {
  const g = ed.graph;
  return drag.origins.map((o) => {
    const n = g.nodes.find((x) => x.id === o.ref.node);
    const p0 = n ? pinPos(n, o.dir, o.ref.pin, ed.registry, g) : undefined;
    let end = cursor;
    if (h?.ok) {
      const tn = g.nodes.find((x) => x.id === h.ref.node);
      end = (tn && pinPos(tn, o.dir === "out" ? "in" : "out", h.ref.pin, ed.registry, g)) ?? cursor;
    }
    const a = p0 ?? cursor;
    const d = o.dir === "out" ? wirePath(a.x, a.y, end.x, end.y) : wirePath(end.x, end.y, a.x, a.y);
    const color = ed.registry.isExec(o.type) ? "var(--bp-exec)" : typeColor(ed.registry, o.type);
    return { d, color };
  });
}

/** Ops for a successful drop: remove moved wires, then connect every origin (conversions inserted). */
export function linkOps(drag: LinkDrag, target: PinRef): GraphOp[] {
  return [
    ...drag.removing.map((edge) => ({ op: "disconnect" as const, edge })),
    ...drag.origins.map((o) => (o.dir === "out" ? { op: "connect" as const, from: o.ref, to: target } : { op: "connect" as const, from: target, to: o.ref })),
  ];
}
