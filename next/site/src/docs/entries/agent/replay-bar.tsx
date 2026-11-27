import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** 演示用的播放条: 暂停 / 继续 / 重放 + 进度 */
export function ReplayBar({ playing, onToggle, onRestart, progress, done, label }: { playing: boolean; onToggle: () => void; onRestart: () => void; progress: number; done: boolean; label?: string }) {
  return (
    <div className="flex items-center gap-2 border-b bg-background/80 px-3 py-2 backdrop-blur">
      <Button size="sm" variant="ghost" onClick={onToggle} disabled={done} aria-label={playing ? "暂停" : "继续"}>
        {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        {playing ? "暂停" : "继续"}
      </Button>
      <Button size="sm" variant="ghost" onClick={onRestart} aria-label="重放">
        <RotateCcw className="size-4" />
        重放
      </Button>
      <div className="relative ml-2 h-1 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-brand transition-transform duration-150" style={{ transform: `scaleX(${Math.min(1, progress)})` }} />
      </div>
      {label && <span className="text-xs text-muted-foreground tabular">{label}</span>}
    </div>
  );
}
