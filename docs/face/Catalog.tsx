import { useState, type JSX } from "react";
import { BlurLine, DealRow, Follow } from "../../src/craft";
import { Aurora, Grain, GridDrift, ShaderWash } from "../../src/craft/effects/field";
import { PointerTrail, Spotlight, TiltCard, Wipe } from "../../src/craft/effects/pointer";
import { ParallaxBlock, ScrollFade, SharedScale, ShimmerBar } from "../../src/craft/effects/scroll";
import { CrossFade, SplitRise, StickySwap, TypeOn, UnderlineDraw } from "../../src/craft/effects/text";
import { AreaChart, BarChart, DonutChart, LineChart } from "../../src/craft/viz/series";
import { FlowDiagram, KpiCard, RadarChart, Timeline } from "../../src/craft/viz/more";
import { AxisShock, ProcessRail } from "../../src/craft";

const SAMPLE = [
  { label: "排队", value: 12 },
  { label: "制作", value: 28 },
  { label: "校对", value: 18 },
  { label: "落定", value: 36 },
];

const ENTRIES = [
  "blur", "split", "type", "underline", "cross", "sticky", "deal", "follow",
  "spot", "tilt", "trail", "wipe", "shader", "grid", "grain", "aurora",
  "parallax", "fade", "scale", "shimmer", "line", "area", "bar", "donut",
  "radar", "timeline", "flow", "kpi", "axis", "process",
] as const;

/**
 * 每个效果和图表一条. 滑杆改进度, 旁边是可复制的调用.
 */
export function Catalog({ id, onPick }: { readonly id: string; readonly onPick: (id: string) => void }): JSX.Element {
  const [progress, setProgress] = useState(0.6);
  const current = ENTRIES.includes(id as (typeof ENTRIES)[number]) ? id : "blur";
  const code = `<Effect id="${current}" progress={${progress.toFixed(2)}} />`;

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-5 py-8 md:grid-cols-[16rem_1fr]">
      <nav aria-label="效果目录" className="flex flex-col gap-1 text-sm">
        {ENTRIES.map((entry) => (
          <button key={entry} type="button" className="h-8 rounded-md px-2 text-left text-foreground hover:bg-accent/50" onClick={() => onPick(entry)}>
            {entry}
          </button>
        ))}
      </nav>
      <div>
        <label className="flex items-center gap-3 text-sm text-muted-foreground">
          进度
          <input type="range" min={0} max={1} step={0.01} value={progress} aria-label="进度" onChange={(event) => setProgress(Number(event.target.value))} />
        </label>
        <div className="mt-4 rounded-xl border border-border p-4">
          <Preview id={current} progress={progress} />
        </div>
        <pre className="mt-3 overflow-auto text-xs text-muted-foreground">{code}</pre>
      </div>
    </div>
  );
}

function Preview({ id, progress }: { readonly id: string; readonly progress: number }): JSX.Element {
  if (id === "split") return <SplitRise text="逐字升起" />;
  if (id === "type") return <TypeOn text="打到哪算哪" progress={progress} />;
  if (id === "underline") return <UnderlineDraw text="线跟着进度" progress={progress} />;
  if (id === "cross") return <CrossFade from="上一句" to="下一句" progress={progress} />;
  if (id === "sticky") return <StickySwap progress={progress} lines={["第一句", "第二句", "第三句"]} />;
  if (id === "deal") return <DealRow progress={progress} labels={["一", "二", "三"]} />;
  if (id === "follow") return <Follow className="inline-block rounded-lg border border-border px-3 py-2">跟着指针</Follow>;
  if (id === "spot") return <Spotlight label="聚光" />;
  if (id === "tilt") return <TiltCard label="倾斜" />;
  if (id === "trail") return <PointerTrail />;
  if (id === "wipe") return <Wipe progress={progress} label="擦除" />;
  if (id === "shader") return <ShaderWash />;
  if (id === "grid") return <GridDrift />;
  if (id === "grain") return <Grain />;
  if (id === "aurora") return <Aurora />;
  if (id === "parallax") return <ParallaxBlock progress={progress} label="视差" />;
  if (id === "fade") return <ScrollFade progress={progress} label="淡入" />;
  if (id === "scale") return <SharedScale progress={progress} label="缩放" />;
  if (id === "shimmer") return <ShimmerBar />;
  if (id === "line") return <LineChart points={SAMPLE} />;
  if (id === "area") return <AreaChart points={SAMPLE} />;
  if (id === "bar") return <BarChart points={SAMPLE} />;
  if (id === "donut") return <DonutChart points={SAMPLE} />;
  if (id === "radar") return <RadarChart points={SAMPLE} />;
  if (id === "timeline") return <Timeline points={SAMPLE} active={Math.round(progress * 3)} />;
  if (id === "flow") return <FlowDiagram points={SAMPLE} />;
  if (id === "kpi") return <KpiCard label="完成" value={String(Math.round(progress * 100))} hint="跟进度走" />;
  if (id === "axis") return <AxisShock value={40 + progress * 160} />;
  if (id === "process") return <ProcessRail index={Math.round(progress * 3)} />;
  return <BlurLine text="一句话, 三拍." />;
}
