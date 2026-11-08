import type { JSX } from "react";
import { BUTTON_TYPE } from "@hx/ui";
import { STAGE_CLASS, Stage } from "../stage";
import { ChartFigure } from "./ChartFigure";
import { CHART_END_MS } from "./shot-chart";

/** 镜 6: 全页唯一一张图表. 尖峰冲出天花板, 停一拍, 坐标轴重标, 线不重画. */
export function ChartShot({ onGo }: { readonly onGo: (id: string) => void }): JSX.Element {
  return (
    <Stage id="6" total={CHART_END_MS} label="图表" className="flex items-center py-8 md:py-10">
      {({ ms }) => (
        <div className={`${STAGE_CLASS.wrap} grid w-full gap-8 md:grid-cols-[minmax(16rem,0.6fr)_minmax(0,1.4fr)] md:items-center md:gap-12`}>
          <div>
            <p className={STAGE_CLASS.kicker}>06 / 图表</p>
            <h2 className={STAGE_CLASS.title}>数字冲破天花板, 坐标轴跟上.</h2>
            <p className={STAGE_CLASS.lede}>新值越界时先按旧比例冲出画框, 停一拍让人看见轴坏了, 再把网格重标到新刻度. 线不重画.</p>
            <button type={BUTTON_TYPE} className="mt-6 text-sm text-foreground underline underline-offset-4 hover:text-muted-foreground" onClick={() => onGo("charts")}>
              看图表文档 ↗
            </button>
          </div>
          <ChartFigure ms={ms} />
        </div>
      )}
    </Stage>
  );
}
