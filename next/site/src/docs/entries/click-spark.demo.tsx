import { useState } from "react";
import { Bookmark, Heart, MessageSquare, Repeat2 } from "lucide-react";
import { ClickSpark, type ClickSparkProps } from "@/effects/click-spark";
import { cn } from "@/lib/utils";
import type { DemoProps } from "../types";
import { SPARK_COLORS } from "./click-spark";

function Action({ label, icon: Icon, count, on, onClick, tone }: { label: string; icon: typeof Heart; count?: number; on?: boolean; onClick?: () => void; tone?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <button
        type="button"
        aria-label={label}
        aria-pressed={on}
        onClick={onClick}
        className={cn("grid size-10 place-items-center rounded-xl border bg-muted/70 transition-[transform,background-color] duration-150 hover:bg-muted active:scale-90", on && tone)}
      >
        <Icon className={cn("size-[18px]", on && "fill-current")} />
      </button>
      {count != null ? <span className={cn("min-w-[3ch] font-mono text-[13px] tabular-nums", on ? "text-foreground" : "text-muted-foreground")}>{count}</span> : null}
    </span>
  );
}

export default function ClickSparkDemo({ values: v }: DemoProps) {
  const [liked, setLiked] = useState(true);
  const [saved, setSaved] = useState(false);
  const [rt, setRt] = useState(false);
  const props: ClickSparkProps = {
    sparkColor: SPARK_COLORS[String(v.color)].value,
    shape: v.shape as ClickSparkProps["shape"],
    easing: v.easing as ClickSparkProps["easing"],
    layer: v.layer as "front" | "back",
    sparkCount: Number(v.sparkCount),
    sparkSize: Number(v.sparkSize),
    sparkWidth: Number(v.sparkWidth),
    sparkRadius: Number(v.sparkRadius),
    duration: Number(v.duration),
    randomness: Number(v.randomness),
    gravity: Number(v.gravity),
    spread: Number(v.spread),
    direction: Number(v.direction),
    glow: Number(v.glow),
    ring: Boolean(v.ring),
  };
  if (v.demo === "area") {
    return (
      <ClickSpark {...props} className="grid h-full w-full cursor-crosshair select-none place-items-center">
        <p className="text-sm text-muted-foreground">在这块区域里随便点</p>
      </ClickSpark>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4 px-4">
      <ClickSpark {...props}><Action label="评论" icon={MessageSquare} count={12} /></ClickSpark>
      <ClickSpark {...props}><Action label="转发" icon={Repeat2} count={rt ? 5 : 4} on={rt} tone="text-emerald-500" onClick={() => setRt((x) => !x)} /></ClickSpark>
      <ClickSpark {...props}><Action label="喜欢" icon={Heart} count={liked ? 129 : 128} on={liked} tone="text-rose-500" onClick={() => setLiked((x) => !x)} /></ClickSpark>
      <ClickSpark {...props}><Action label="收藏" icon={Bookmark} on={saved} tone="text-amber-500" onClick={() => setSaved((x) => !x)} /></ClickSpark>
    </div>
  );
}
