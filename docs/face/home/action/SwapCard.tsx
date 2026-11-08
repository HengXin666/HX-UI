import { useState, type JSX, type ReactNode } from "react";
import { SKIN, SKIN_ATTR } from "@hx/ui";
import { SegmentedThumb } from "../../../../src/craft";
import { FieldPage, KilnPage } from "../../../../src/studio";
import { PagePreview } from "../kit/Tile";
import { useLoopMs } from "../kit/use-loop";
import { SWAP_END_MS, SWAP_PAGES, pageAt, pagePose, restMs, type SwapPage } from "../shots/swap/shot-swap";

const SKIN_PICK = SKIN.emerald;
const REST_MS = 1200;
const OPTIONS: ReadonlyArray<{ value: SwapPage; label: string }> = [
  { value: SWAP_PAGES[0], label: "田野" },
  { value: SWAP_PAGES[1], label: "窑四号" },
  { value: SWAP_PAGES[2], label: "皮肤" },
];
const PAGES: Record<SwapPage, () => ReactNode> = {
  field: () => <FieldPage heading="h3" />,
  kiln: () => <KilnPage heading="h3" />,
  skin: () => <div {...{ [SKIN_ATTR.skin]: SKIN_PICK }} className="bg-background text-foreground"><FieldPage heading="h3" /></div>,
};

/**
 * 卡内版的镜 4: 分段拇指切整页与皮肤. 进视口循环走 pagePose; 点拇指就停在那一档 (等于把镜头拨到它的停稳点).
 */
export function SwapCard(): JSX.Element {
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const loop = useLoopMs(box, SWAP_END_MS, REST_MS);
  const ms = pinned === null ? loop : restMs(pinned);
  const current = pageAt(ms);
  return (
    <div ref={setBox} className="absolute inset-0">
      {SWAP_PAGES.map((page, index) => {
        const pose = pagePose(index, ms);
        return (
          <div
            key={page}
            className="absolute inset-0"
            style={{ opacity: pose.opacity, visibility: pose.opacity > 0 ? "visible" : "hidden", transform: `translate3d(${pose.shift}px, 0, 0)` }}
          >
            <PagePreview>{PAGES[page]()}</PagePreview>
          </div>
        );
      })}
      <div className="absolute bottom-2 left-1/2 origin-bottom -translate-x-1/2 scale-[0.8] rounded-xl border border-border bg-card/90 p-1 backdrop-blur">
        <SegmentedThumb ariaLabel="整页与皮肤" options={OPTIONS} value={current} onChange={(next) => setPinned(SWAP_PAGES.indexOf(next))} />
      </div>
    </div>
  );
}
