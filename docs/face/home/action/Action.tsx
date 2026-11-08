import type { JSX } from "react";
import { Tile } from "../kit/Tile";
import { TYPE, WRAP } from "../kit/layout";
import { ChartCard } from "./ChartCard";
import { CraneCard } from "./CraneCard";
import { DealCard } from "./DealCard";
import { RollCard } from "./RollCard";
import { SwapCard } from "./SwapCard";

const TOP_H = 320;
const LOW_H = 210;

/**
 * See them in action: 上排两张大卡, 下排三张 (739:524 与 416:525:310). 卡里都是真组件,
 * 发牌, 整页拉升, 图表重标, 分段切换四镜原样进卡, 进视口循环.
 */
export function Action({ onGo }: { readonly onGo: (id: string) => void }): JSX.Element {
  return (
    <section aria-labelledby="action-title" className={`${WRAP} pt-[76px]`}>
        <h2 id="action-title" className={TYPE.h2}>看它们动起来</h2>
        <div className="mt-[37px] grid gap-[13px] md:grid-cols-[739fr_524fr]">
          <Tile art={<DealCard />} artHeight={TOP_H} title="组件墙发牌" tag="组件" onOpen={() => onGo("dialog")} />
          <Tile art={<ChartCard />} artHeight={TOP_H} title="坐标轴重标" tag="图表" onOpen={() => onGo("charts")} />
        </div>
        <div className="mt-[18px] grid gap-[13px] md:grid-cols-[416fr_525fr_310fr]">
          <Tile art={<CraneCard />} artHeight={LOW_H} title="整页拉升" tag="整页" onOpen={() => onGo("page")} />
          <Tile art={<SwapCard />} artHeight={LOW_H} title="分段切换" tag="皮肤" onOpen={() => onGo("skins")} />
          <Tile art={<RollCard />} artHeight={LOW_H} title="数字滚动" tag="动效" onOpen={() => onGo("motion")} />
        </div>
    </section>
  );
}
