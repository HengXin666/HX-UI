import * as React from "react";
import { AnimatePresence, m } from "motion/react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LogLine {
  id: string | number;
  time: string;
  level: "debug" | "info" | "warn" | "error";
  source?: string;
  message: string;
}

const LEVEL = {
  debug: "text-muted-foreground",
  info: "text-info",
  warn: "text-warning",
  error: "text-destructive",
} as const;

/**
 * 实时日志: 粘底但不锁死 (用户向上翻时不再自动滚), 可暂停, 新行淡入.
 * 只保留最近 max 行, 长时间运行不涨内存.
 */
export function LogStream({ lines, max = 300, height = 320, className }: { lines: LogLine[]; max?: number; height?: number; className?: string }) {
  const box = React.useRef<HTMLDivElement>(null);
  const [paused, setPaused] = React.useState(false);
  const [frozen, setFrozen] = React.useState<LogLine[]>([]);
  const stick = React.useRef(true);
  const shown = (paused ? frozen : lines).slice(-max);

  React.useEffect(() => {
    if (stick.current && box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [shown.length]);

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-[oklch(0.16_0.005_270)] text-[oklch(0.92_0_0)]", className)}>
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-white/60">
        <span className="font-mono">{shown.length} 行{paused && " · 已暂停"}</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1 text-white/70 hover:bg-white/10 hover:text-white"
          onClick={() => {
            setFrozen(lines);
            setPaused((p) => !p);
          }}
        >
          {paused ? <Play className="size-3" /> : <Pause className="size-3" />}
          {paused ? "继续" : "暂停"}
        </Button>
      </div>
      <div
        ref={box}
        style={{ height }}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
        }}
        className="overflow-y-auto px-3 py-2 font-mono text-[12.5px] leading-6"
        role="log"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {shown.map((l) => (
            <m.div key={l.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="flex gap-3 whitespace-pre-wrap">
              <span className="shrink-0 text-white/35">{l.time}</span>
              <span className={cn("w-11 shrink-0 uppercase", LEVEL[l.level])}>{l.level}</span>
              {l.source && <span className="shrink-0 text-white/50">[{l.source}]</span>}
              <span className="min-w-0">{l.message}</span>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
