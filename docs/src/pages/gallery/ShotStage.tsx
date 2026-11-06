import type { JSX } from "react";
import { Shot, ShotLayer, ShotPlate, ShotSequence, SHOT_DEPTH, SHOT_DRIVE, SHOT_MOVE, SHOT_PACE } from "../../../../src/studio";

const MOVES = [
  { move: SHOT_MOVE.hold, name: "hold", text: "先站住. 信息落定之后留白, 不马上切走." },
  { move: SHOT_MOVE.dolly, name: "dolly", text: "慢推到主体. 开场只给这一下, 大约三秒." },
  { move: SHOT_MOVE.rise, name: "rise", text: "短距离落到版面里的真实位置." },
  { move: SHOT_MOVE.pan, name: "pan", text: "侧向入画, 最后停成正视, 字仍然可读." },
  { move: SHOT_MOVE.glide, name: "glide", text: "轻微侧角, 落幅回到正面. 不是手持抖动." },
] as const;

/** 镜头词汇. 进视口播一次; 滚动推近留给页面自己当滚动容器的时候. */
export function ShotStage(): JSX.Element {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-8 md:px-8">
      <ShotSequence pace={SHOT_PACE.deal} label="五种运镜" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {MOVES.map((item) => (
          <Shot key={item.name} move={item.move} className="h-full">
            <article className="flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-4">
              <span className="font-mono text-xs text-muted-foreground">{item.name}</span>
              <p className="text-sm leading-relaxed text-foreground">{item.text}</p>
            </article>
          </Shot>
        ))}
      </ShotSequence>
      <ShotPlate drive={SHOT_DRIVE.view} className="min-h-56 rounded-xl border border-border bg-surface-sunken" label="景深示例">
        <ShotLayer depth={SHOT_DEPTH.back}>
          <div className="absolute inset-6 rounded-lg border border-border" />
        </ShotLayer>
        <ShotLayer depth={SHOT_DEPTH.subject}>
          <div className="grid h-full place-items-center p-8">
            <p className="max-w-md text-center text-xl font-semibold tracking-tight">背景让一点, 字停在正中.</p>
          </div>
        </ShotLayer>
        <ShotLayer depth={SHOT_DEPTH.front}>
          <p className="absolute bottom-4 left-4 text-xs text-muted-foreground">front</p>
        </ShotLayer>
      </ShotPlate>
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        文档站的内容区自己滚动, 所以这里用进视口的弧线. 整页由窗口滚动时, 把 ShotPlate 的 drive 设为 scroll, 并在需要时传入滚动容器.
      </p>
    </div>
  );
}
