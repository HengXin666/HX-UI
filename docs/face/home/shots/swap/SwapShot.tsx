import { useLayoutEffect, useRef, useState, type JSX, type ReactNode } from "react";
import { SKIN, SKIN_ATTR } from "@hx/ui";
import { SegmentedThumb } from "../../../../../src/craft";
import { FieldPage, KilnPage } from "../../../../../src/studio";
import { STAGE_CLASS, Stage, Warm, useWide } from "../stage";
import { SWAP_END_MS, SWAP_PAGES, pageAt, pagePose, restMs, type SwapPage } from "./shot-swap";

/** 借来的整页按这个宽度排版, 再整体缩到画框宽. */
const DESIGN_W = 1280;
const SKIN_PICK = SKIN.emerald;

const OPTIONS: ReadonlyArray<{ value: SwapPage; label: string }> = [
  { value: SWAP_PAGES[0], label: "田野" },
  { value: SWAP_PAGES[1], label: "窑四号" },
  { value: SWAP_PAGES[2], label: "皮肤" },
];

const PAGES: Record<SwapPage, { readonly caption: string; readonly render: () => ReactNode }> = {
  field: { caption: "FieldPage / 默认皮肤", render: () => <FieldPage heading="h3" /> },
  kiln: { caption: "KilnPage / 默认皮肤", render: () => <KilnPage heading="h3" /> },
  skin: { caption: `FieldPage / ${SKIN_PICK}`, render: () => <div {...{ [SKIN_ATTR.skin]: SKIN_PICK }} className="bg-background text-foreground"><FieldPage heading="h3" /></div> },
};

/** 镜 4: 一个分段拇指切整页与皮肤. 进度驱动, 点击拇指等于把进度滚到那一档. */
export function SwapShot(): JSX.Element {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const wide = useWide();
  useLayoutEffect(() => {
    const read = (): void => setScale((frame.current?.clientWidth ?? DESIGN_W) / DESIGN_W);
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);
  return (
    <Stage id="4" total={SWAP_END_MS} label="整页切换" className="flex items-center py-8 md:py-10">
      {({ ms, seek }) => {
        const current = pageAt(ms);
        return (
          <div className={`${STAGE_CLASS.wrap} grid h-full min-h-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-6 md:grid-cols-[minmax(16rem,0.6fr)_minmax(0,1.4fr)] md:grid-rows-1 md:items-center md:gap-12`}>
            <div>
              <p className={STAGE_CLASS.kicker}>04 / 切换</p>
              <h2 className={STAGE_CLASS.title}>一个拇指, 换一整页.</h2>
              <p className={STAGE_CLASS.lede}>田野是一页产品官网, 窑四号是一页商品详情, 皮肤是同一页换一套令牌. 三页都是库里现成的整页.</p>
              <div className="mt-6">
                <SegmentedThumb
                  ariaLabel="整页与皮肤"
                  options={OPTIONS}
                  value={current}
                  onChange={(next) => seek(restMs(SWAP_PAGES.indexOf(next)))}
                />
              </div>
              <p data-shot-part="caption" className="mt-4 font-mono text-[0.65rem] tracking-[0.12em] text-muted-foreground">{PAGES[current].caption}</p>
            </div>
            <div ref={frame} className="relative h-full min-h-0 overflow-hidden rounded-xl border border-border bg-background md:h-[min(100%,40rem)]">
              {SWAP_PAGES.map((page, index) => {
                const pose = pagePose(index, ms);
                const move = wide ? `${pose.shift}px, 0` : `0, ${pose.shift}px`;
                return (
                  <Warm
                    key={page}
                    part={`page-${page}`}
                    width={DESIGN_W}
                    className="absolute left-0 top-0 origin-top-left"
                    style={{
                      opacity: pose.opacity,
                      visibility: pose.opacity > 0 ? "visible" : "hidden",
                      pointerEvents: page === current ? "auto" : "none",
                      transform: `translate3d(${move}, 0) scale(${scale})`,
                    }}
                  >
                    {PAGES[page].render()}
                  </Warm>
                );
              })}
            </div>
          </div>
        );
      }}
    </Stage>
  );
}
