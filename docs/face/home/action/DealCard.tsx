import { useLayoutEffect, useRef, useState, type JSX } from "react";
import { WALL } from "../shots/deal/cells";
import { DEAL_END_MS, cardPose, type Vec } from "../shots/deal/shot-deal";
import { useLoopMs } from "../kit/use-loop";

/** 墙按这个尺寸排版, 再整体缩到图区; 镜头里的像素位移都在这个坐标系里. */
const DESIGN_W = 1160;
const DESIGN_H = 510;
const PILE_NUDGE: Vec = { x: 24, y: -24 };
const LAYER_Z = { slot: 1, air: 40, pile: 20 } as const;
const SHADOW_ALPHA = "14%";
/** 满板后停这么久再收牌重发. */
const REST_MS = 1800;

/** 卡内版的镜 3 组件墙: 同一条 cardPose, 进视口循环发牌. 每格是库里的真组件. */
export function DealCard(): JSX.Element {
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [slots, setSlots] = useState<readonly Vec[]>([]);
  const ms = useLoopMs(box, DEAL_END_MS, REST_MS);

  useLayoutEffect(() => {
    if (!box) return;
    const read = (): void => {
      setScale(box.clientWidth / DESIGN_W);
      const nodes = Array.from(grid.current?.children ?? []) as HTMLElement[];
      setSlots(nodes.map((node) => ({ x: node.offsetLeft, y: node.offsetTop })));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(box);
    return () => ro.disconnect();
  }, [box]);

  const anchor = slots[slots.length - 1] ?? { x: 0, y: 0 };
  const pile = { x: anchor.x + PILE_NUDGE.x, y: anchor.y + PILE_NUDGE.y };
  return (
    <div ref={setBox} className="absolute inset-0 overflow-hidden">
      <div
        ref={grid}
        inert
        className="grid grid-cols-4 grid-rows-2 gap-4 p-5"
        style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})`, transformOrigin: "0 0" }}
      >
        {WALL.map((cell, k) => {
          const slot = slots[k] ?? { x: 0, y: 0 };
          const pose = cardPose(k, ms, { x: pile.x - slot.x, y: pile.y - slot.y }, WALL.length);
          return (
            <div key={cell.id} className="relative min-h-0 rounded-xl border border-dashed border-border">
              <article
                className="absolute inset-0 flex flex-col overflow-hidden rounded-xl border border-border bg-card"
                style={{
                  transform: `translate3d(${pose.x}px, ${pose.y}px, 0) scale(${pose.scale})`,
                  boxShadow: `0 ${pose.shadow / 2}px ${pose.shadow}px color-mix(in oklab, var(--foreground) ${SHADOW_ALPHA}, transparent)`,
                  zIndex: LAYER_Z[pose.layer] + (pose.layer === "pile" ? WALL.length - k : 0),
                }}
              >
                <header className="border-b border-border px-3 py-2 font-mono text-[0.65rem] tracking-[0.12em] text-muted-foreground">{cell.name}</header>
                <div className="min-h-0 flex-1 overflow-hidden p-3">{cell.body()}</div>
              </article>
            </div>
          );
        })}
      </div>
    </div>
  );
}
