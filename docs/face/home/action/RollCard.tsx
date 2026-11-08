import { useEffect, useState, type JSX } from "react";
import { NumberRoll } from "../../../../src/craft";
import { useNear } from "../kit/use-loop";
import { FACTS } from "../site-facts";

/** 每个数字停留的时长. */
const HOLD_MS = 2400;

const FIGURES = [
  { value: FACTS.pages, label: "页文档" },
  { value: FACTS.groups, label: "个分组" },
  { value: FACTS.blocks, label: "组区块" },
  { value: FACTS.templates, label: "套模板" },
  { value: FACTS.skins, label: "套皮肤" },
] as const;

/** NumberRoll: 逐位滚动, 位数不同时右对齐, 数字等宽不抖. 数字都是导航数据实算的. */
export function RollCard(): JSX.Element {
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const near = useNear(box);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!near) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % FIGURES.length), HOLD_MS);
    return () => window.clearInterval(timer);
  }, [near]);
  const figure = FIGURES[index];
  return (
    <div ref={setBox} className="absolute inset-0 grid place-items-center">
      <div className="text-center">
        <p className="m-0 text-[64px] font-medium leading-none tracking-tight text-heading tabular-nums">
          <NumberRoll value={near ? figure.value : 0} />
        </p>
        <p className="mt-3 text-[13px] text-muted-foreground">{figure.label}</p>
      </div>
    </div>
  );
}
