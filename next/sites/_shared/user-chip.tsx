import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function UserChip() {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-2.5">
      <Avatar className="size-8"><AvatarFallback className="bg-brand-soft text-brand">衡</AvatarFallback></Avatar>
      <div className="min-w-0 text-sm">
        <div className="truncate font-medium">HengXin</div>
        <div className="truncate text-xs text-muted-foreground">平台工程 · 管理员</div>
      </div>
    </div>
  );
}
