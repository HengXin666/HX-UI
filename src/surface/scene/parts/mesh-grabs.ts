// 行为规格参照 docs/research/catalog/animations.md 的 ElasticMesh 条目 (多点抓取), 实现为 HX 自有.
/**
 * SpringMesh 的多点抓取: 每个按下的指针 (多指, 笔, 鼠标) 落在形状框内时各占一个抓取槽, 槽数上限 MESH.maxGrabs.
 * 每槽是一份独立的 MeshState (抓取点, 拉伸弹簧, 凹陷弹簧), 按 stepMesh 推进; 指针抬起后该槽回弹, 回弹中仍参与变形, 静下来才可再被占.
 * 坐标以宿主短边为单位, 原点在中心, y 朝上.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-scene.md
 */
import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { MESH } from "../tokens";
import { makeMesh, stepMesh, type MeshState, type MeshTuning } from "./mesh";

export interface MeshContact {
  x: number;
  y: number;
  /** 占的槽, -1 为落在形状外或槽满, 不抓. */
  slot: number;
}

export interface MeshSlot {
  state: MeshState;
  /** 占着它的指针 id, null 为空闲 (可能还在回弹). */
  owner: number | null;
}

export function makeMeshSlots(n: number = MESH.maxGrabs): MeshSlot[] {
  return Array.from({ length: n }, () => ({ state: makeMesh(), owner: null }));
}

/** 槽是否静下来 (拉伸与凹陷都回到近 0). */
export function slotSettled(s: MeshState): boolean {
  return Math.hypot(s.dx, s.dy) < 1e-3 && Math.hypot(s.vx, s.vy) < 1e-2 && Math.abs(s.dent) < 1e-3 && Math.abs(s.dentV) < 1e-2;
}

/** 新指针落下: 在形状内就占一个空槽 (优先已静下来的, 其次回弹幅度最小的). 返回槽号, 不抓返回 -1. */
export function claimSlot(slots: MeshSlot[], id: number, within: boolean): number {
  if (!within) return -1;
  let best = -1;
  let bestScore = Infinity;
  slots.forEach((slot, i) => {
    if (slot.owner !== null) return;
    const score = slotSettled(slot.state) ? -1 : Math.hypot(slot.state.dx, slot.state.dy) + Math.abs(slot.state.dent);
    if (score < bestScore) {
      best = i;
      bestScore = score;
    }
  });
  const slot = slots[best];
  if (slot) slot.owner = id;
  return best;
}

/** 推进全部槽一帧: 占着的槽按住在它指针处, 指针已走的槽松手回弹. */
export function stepMeshSlots(slots: MeshSlot[], dt: number, contacts: ReadonlyMap<number, MeshContact>, t: MeshTuning): MeshSlot[] {
  for (const slot of slots) {
    const c = slot.owner === null ? undefined : contacts.get(slot.owner);
    if (!c) slot.owner = null;
    stepMesh(slot.state, dt, c ? { x: c.x, y: c.y, down: true, within: true } : { x: slot.state.ax, y: slot.state.ay, down: false, within: false }, t);
  }
  return slots;
}

/** 打包给片元: 每槽 (ax, ay, dx, dy) 与凹陷. */
export function packMeshSlots(slots: readonly MeshSlot[]): { grabs: Float32Array; dents: [number, number, number, number] } {
  const grabs = new Float32Array(MESH.maxGrabs * 4);
  const dents: [number, number, number, number] = [0, 0, 0, 0];
  slots.slice(0, MESH.maxGrabs).forEach(({ state: s }, i) => {
    grabs.set([s.ax, s.ay, s.dx, s.dy], i * 4);
    dents[i] = s.dent;
  });
  return { grabs, dents };
}

type Handler = ((event: ReactPointerEvent<HTMLDivElement>) => void) | undefined;

export interface MeshPointerHandlers {
  readonly onPointerDown?: Handler;
  readonly onPointerMove?: Handler;
  readonly onPointerUp?: Handler;
  readonly onPointerCancel?: Handler;
}

/**
 * 宿主上的指针跟踪: 记下每个按下指针的短边坐标; 落下时用 hit(x, y) 判断是否在形状框内并占槽. 已传入的同名处理器照常调用.
 * 减弱动效或 disabled 时不跟踪.
 */
export function useMeshContacts(slots: MeshSlot[], hit: (x: number, y: number) => boolean, user: MeshPointerHandlers, disabled: boolean) {
  const contacts = useRef(new Map<number, MeshContact>());
  const locate = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const short = Math.max(1, Math.min(r.width, r.height));
    return { x: (e.clientX - r.left - r.width / 2) / short, y: -(e.clientY - r.top - r.height / 2) / short };
  };
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    user.onPointerDown?.(e);
    if (disabled) return;
    const at = locate(e);
    const slot = claimSlot(slots, e.pointerId, hit(at.x, at.y));
    contacts.current.set(e.pointerId, { ...at, slot });
    if (slot >= 0) e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    user.onPointerMove?.(e);
    const c = contacts.current.get(e.pointerId);
    if (c) Object.assign(c, locate(e));
  };
  const end = (key: "onPointerUp" | "onPointerCancel") => (e: ReactPointerEvent<HTMLDivElement>) => {
    user[key]?.(e);
    contacts.current.delete(e.pointerId);
  };
  return { contacts: contacts.current, handlers: { onPointerDown, onPointerMove, onPointerUp: end("onPointerUp"), onPointerCancel: end("onPointerCancel") } };
}
