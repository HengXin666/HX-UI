/**
 * scene 族: SpringMesh 的多点抓取. 占槽规则, 各槽独立拉伸与回弹, 槽数上限, 打包, 指针跟踪.
 */
import { renderHook } from "@testing-library/react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { MESH } from "@src/surface/scene";
import { claimSlot, makeMeshSlots, packMeshSlots, slotSettled, stepMeshSlots, useMeshContacts, type MeshContact } from "@src/surface/scene/parts/mesh-grabs";
import { MESH_FRAGMENT } from "@src/surface/scene/parts/mesh-shader";

const tuning = { stiffness: 0.5, wobble: 0.6, stretch: 0.5, press: 0.5 };
const run = (slots: ReturnType<typeof makeMeshSlots>, frames: number, contacts: Map<number, MeshContact>) => {
  for (let i = 0; i < frames; i += 1) stepMeshSlots(slots, 1 / 60, contacts, tuning);
};

describe("SpringMesh 多点抓取", () => {
  it("形状外不占槽; 槽满后不再占; 上限 4", () => {
    const slots = makeMeshSlots();
    expect(slots).toHaveLength(MESH.maxGrabs);
    expect(claimSlot(slots, 1, false)).toBe(-1);
    expect([1, 2, 3, 4].map((id) => claimSlot(slots, id, true))).toEqual([0, 1, 2, 3]);
    expect(claimSlot(slots, 5, true)).toBe(-1);
  });
  it("两指各拉一处, 互不干扰; 抬起的那处回弹归零并空出, 另一处保持", () => {
    const slots = makeMeshSlots();
    const contacts = new Map<number, MeshContact>();
    contacts.set(7, { x: -0.2, y: 0, slot: claimSlot(slots, 7, true) });
    contacts.set(9, { x: 0.2, y: 0, slot: claimSlot(slots, 9, true) });
    run(slots, 2, contacts);
    Object.assign(contacts.get(7) as MeshContact, { x: -0.3 });
    Object.assign(contacts.get(9) as MeshContact, { y: 0.1 });
    run(slots, 10, contacts);
    expect(slots[0]?.state.dx).toBeCloseTo(-0.1, 5);
    expect(slots[0]?.state.dy).toBeCloseTo(0, 5);
    expect(slots[1]?.state.dy).toBeCloseTo(0.1, 5);
    contacts.delete(7);
    run(slots, 300, contacts);
    expect(slots[0]?.owner).toBeNull();
    expect(slotSettled(slots[0]!.state)).toBe(true);
    expect(slots[1]?.owner).toBe(9);
    expect(slots[1]?.state.dy).toBeCloseTo(0.1, 5);
    expect(claimSlot(slots, 11, true)).toBe(0);
  });
  it("打包每槽 (ax, ay, dx, dy) 与凹陷; 片元按槽循环叠加", () => {
    const slots = makeMeshSlots();
    Object.assign(slots[2]!.state, { ax: 0.1, ay: 0.2, dx: 0.3, dy: 0.4, dent: 0.5 });
    const { grabs, dents } = packMeshSlots(slots);
    expect(Array.from(grabs.slice(8, 12))).toEqual([0.1, 0.2, 0.3, 0.4].map((v) => Math.fround(v)));
    expect(dents).toEqual([0, 0, 0.5, 0]);
    expect(MESH_FRAGMENT).toContain("uniform vec4 u_grabs[4];");
    expect(MESH_FRAGMENT).toContain("dentSum += u_dents[i]");
  });
  it("指针跟踪: 落下换成短边坐标 (y 朝上) 并占槽, 移动更新, 抬起删除; 原处理器照常调用; disabled 不跟踪", () => {
    const slots = makeMeshSlots();
    const user = { onPointerDown: vi.fn(), onPointerUp: vi.fn() };
    const { result } = renderHook(() => useMeshContacts(slots, (x) => Math.abs(x) < 0.3, user, false));
    const capture = vi.fn();
    const target = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 200 }), setPointerCapture: capture };
    const ev = (pointerId: number, clientX: number, clientY: number) => ({ pointerId, clientX, clientY, currentTarget: target }) as unknown as ReactPointerEvent<HTMLDivElement>;
    const { contacts, handlers } = result.current;
    handlers.onPointerDown(ev(1, 220, 50));
    expect(contacts.get(1)).toEqual({ x: 0.1, y: 0.25, slot: 0 });
    expect(capture).toHaveBeenCalledWith(1);
    handlers.onPointerDown(ev(2, 390, 100));
    expect(contacts.get(2)?.slot).toBe(-1);
    handlers.onPointerMove(ev(1, 240, 100));
    expect(contacts.get(1)?.x).toBeCloseTo(0.2, 9);
    expect(contacts.get(1)?.y).toBeCloseTo(0, 9);
    handlers.onPointerUp(ev(1, 240, 100));
    expect(contacts.has(1)).toBe(false);
    expect(user.onPointerDown).toHaveBeenCalledTimes(2);
    expect(user.onPointerUp).toHaveBeenCalledTimes(1);
    const off = renderHook(() => useMeshContacts(makeMeshSlots(), () => true, {}, true));
    off.result.current.handlers.onPointerDown(ev(3, 200, 100));
    expect(off.result.current.contacts.size).toBe(0);
  });
});
