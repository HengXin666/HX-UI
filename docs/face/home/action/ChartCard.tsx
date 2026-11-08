import { useLayoutEffect, useState, type JSX } from "react";
import { useLoopMs } from "../kit/use-loop";
import { ChartFigure } from "../shots/chart/ChartFigure";
import { CHART_END_MS } from "../shots/chart/shot-chart";

const DESIGN_W = 620;
const REST_MS = 1600;

/** 卡内版的镜 6: 同一个 ChartFigure, 进视口循环. 图按 620 宽排版, 缩到卡宽并竖直居中. */
export function ChartCard(): JSX.Element {
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0);
  const ms = useLoopMs(box, CHART_END_MS, REST_MS);
  useLayoutEffect(() => {
    if (!box) return;
    const read = (): void => setScale(box.clientWidth / DESIGN_W);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(box);
    return () => ro.disconnect();
  }, [box]);
  return (
    <div ref={setBox} className="absolute inset-0 flex items-center overflow-hidden">
      <div style={{ width: DESIGN_W, transform: `scale(${scale})`, transformOrigin: "0 50%" }} className="shrink-0">
        <ChartFigure ms={ms} className="rounded-none border-0 bg-transparent" />
      </div>
    </div>
  );
}
