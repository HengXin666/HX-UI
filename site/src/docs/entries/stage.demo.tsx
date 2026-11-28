import { useRef } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Stage, StageScreen, type StageArrange, type StageBackground, type StageDevice, type StageHandle } from "@/stage/stage";
import type { MotionInput, ShotInput } from "@/stage/shots";
import type { DemoProps } from "../types";
import { CodeScreen, DashboardScreen, PhoneScreen } from "./stage-screens";

export default function StageDemo({ values: v, onEvent }: DemoProps) {
  const ref = useRef<StageHandle>(null);
  const n = (k: string) => Number(v[k]);
  const device = v.device as StageDevice;
  const screens =
    v.screen === "layers" ? [
      <StageScreen key="a" url="app.northwind.io"><DashboardScreen /></StageScreen>,
      <StageScreen key="b" device="window" url="stage.tsx" contentWidth={900}><CodeScreen /></StageScreen>,
      <StageScreen key="c" device="card" contentWidth={900}><PhoneScreen /></StageScreen>,
    ] : v.screen === "phone" || device === "phone" ? (
      <StageScreen contentWidth={430}><PhoneScreen /></StageScreen>
    ) : (
      <StageScreen url="app.northwind.io"><DashboardScreen /></StageScreen>
    );
  return (
    <div className="absolute inset-0">
      <Stage
        ref={ref}
        shot={v.shot as ShotInput}
        motion={v.motion as MotionInput}
        arrange={(v.screen === "layers" && v.arrange === "single" ? "layers" : v.arrange) as StageArrange}
        device={device}
        background={v.background as StageBackground}
        size={n("size")}
        shadow={n("shadow")}
        softness={n("softness")}
        reflection={n("reflection")}
        sheen={n("sheen")}
        dof={n("dof")}
        grain={n("grain")}
        vignette={n("vignette")}
        parallax={n("parallax")}
        transition={n("transition")}
        orbit={Boolean(v.orbit)}
        interactive={Boolean(v.interactive)}
        selectable={Boolean(v.selectable)}
        thickness={Number(v.thickness)}
        title={v.title ? String(v.title) : undefined}
        onMotionEnd={() => onEvent?.("运镜结束")}
        className="h-full w-full"
      >
        {screens}
      </Stage>
      <div className="absolute bottom-3 left-3 z-10 flex gap-1.5">
        <button type="button" aria-label="播放" onClick={() => ref.current?.play()} className="grid size-8 place-items-center rounded-lg border bg-background/70 text-muted-foreground backdrop-blur hover:text-foreground"><Play className="size-3.5" /></button>
        <button type="button" aria-label="暂停" onClick={() => ref.current?.pause()} className="grid size-8 place-items-center rounded-lg border bg-background/70 text-muted-foreground backdrop-blur hover:text-foreground"><Pause className="size-3.5" /></button>
        <button type="button" aria-label="从头" onClick={() => { ref.current?.seek(0); ref.current?.play(); }} className="grid size-8 place-items-center rounded-lg border bg-background/70 text-muted-foreground backdrop-blur hover:text-foreground"><RotateCcw className="size-3.5" /></button>
      </div>
      <p className="pointer-events-none absolute bottom-4 right-4 z-10 text-xs text-muted-foreground">空白处拖动转镜头 · 双击复位</p>
    </div>
  );
}
