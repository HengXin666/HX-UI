import { useLayoutEffect, useRef, useState, type JSX } from "react";
import { BUTTON_TYPE } from "@hx/ui";
import { STAGE_CLASS, Stage } from "../stage";
import { WALL } from "./cells";
import { DEAL_END_MS, cardPose, type Vec } from "./shot-deal";

/** 牌堆相对最后一个可见槽位的偏移: 叠在它右上方一点, 下压 48px 后仍在舞台里; 最后一张从这里落回自己的槽. */
const PILE_NUDGE: Vec = { x: 24, y: -24 };
const LAYER_Z = { slot: 1, air: 40, pile: 20 } as const;
const SHADOW_ALPHA = "14%";

/** 镜 3: 组件墙. 卡从牌堆发进真实网格槽位, 每格右上 ↗ 进文档. */
export function DealShot({ onGo }: { readonly onGo: (id: string) => void }): JSX.Element {
  const grid = useRef<HTMLDivElement>(null);
  const [slots, setSlots] = useState<ReadonlyArray<Vec | null>>([]);

  useLayoutEffect(() => {
    const read = (): void => {
      const nodes = Array.from(grid.current?.children ?? []) as HTMLElement[];
      setSlots(nodes.map((node) => (node.offsetParent ? { x: node.offsetLeft, y: node.offsetTop } : null)));
    };
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  const shown = slots.filter((slot): slot is Vec => slot !== null);
  const anchor = shown[shown.length - 1] ?? { x: 0, y: 0 };
  const pile = { x: anchor.x + PILE_NUDGE.x, y: anchor.y + PILE_NUDGE.y };

  return (
    <Stage id="3" total={DEAL_END_MS} label="组件墙" className="flex flex-col py-8 md:py-10">
      {({ ms }) => {
        let order = 0;
        return (
          <div className={`${STAGE_CLASS.wrap} flex min-h-0 flex-1 flex-col`}>
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
              <div>
                <p className={STAGE_CLASS.kicker}>03 / 组件</p>
                <h2 className={STAGE_CLASS.title}>拿来就能按的组件.</h2>
              </div>
              <p className={`${STAGE_CLASS.lede} hidden md:block`}>下面每一格都是库里的真组件, 不是截图. 右上角的 ↗ 进它的文档页.</p>
            </div>
            <div ref={grid} className="mt-6 grid min-h-0 flex-1 grid-cols-2 grid-rows-3 gap-3 md:mt-8 md:grid-cols-4 md:grid-rows-2 md:gap-4">
              {WALL.map((cell, index) => {
                const slot = slots[index];
                const k = slot ? order++ : 0;
                const pose = cardPose(k, ms, slot ? { x: pile.x - slot.x, y: pile.y - slot.y } : { x: 0, y: 0 }, shown.length || WALL.length);
                return (
                  <div key={cell.id} className={`relative min-h-0 rounded-xl border border-dashed border-border ${cell.wideOnly ? "hidden md:block" : ""}`}>
                    <article
                      data-shot-part={`card-${index}`}
                      className="absolute inset-0 flex flex-col overflow-hidden rounded-xl border border-border bg-card"
                      style={{
                        transform: `translate3d(${pose.x}px, ${pose.y}px, 0) scale(${pose.scale})`,
                        boxShadow: `0 ${pose.shadow / 2}px ${pose.shadow}px color-mix(in oklab, var(--foreground) ${SHADOW_ALPHA}, transparent)`,
                        zIndex: LAYER_Z[pose.layer] + (pose.layer === "pile" ? WALL.length - k : 0),
                      }}
                    >
                      <header className="flex items-center justify-between border-b border-border px-3 py-2">
                        <span className="font-mono text-[0.65rem] tracking-[0.12em] text-muted-foreground">{cell.name}</span>
                        <button
                          type={BUTTON_TYPE}
                          aria-label={`${cell.name} 文档`}
                          className="grid size-6 place-items-center rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          onClick={() => onGo(cell.id)}
                        >
                          ↗
                        </button>
                      </header>
                      <div className="min-h-0 flex-1 overflow-hidden p-3">{cell.body()}</div>
                    </article>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }}
    </Stage>
  );
}
