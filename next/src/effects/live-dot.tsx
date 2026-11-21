import { cn } from "@/lib/utils";

const TONE = {
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
  muted: "bg-muted-foreground",
} as const;

/** 状态点: live 时外圈脉冲. 用于运维面板 / 在线状态. */
export function LiveDot({ tone = "success", live = true, className }: { tone?: keyof typeof TONE; live?: boolean; className?: string }) {
  return (
    <span className={cn("relative inline-flex size-2", className)}>
      {live && <span className={cn("absolute inset-0 animate-pulse-ring rounded-full", TONE[tone])} />}
      <span className={cn("relative inline-flex size-2 rounded-full", TONE[tone])} />
    </span>
  );
}
