import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { DemoProps } from "../types";

/** 真实场景: 项目设置页底部的危险区 */
export default function DialogDemo({ values }: DemoProps) {
  const destructive = values.tone === "destructive";
  return (
    <div className="w-full max-w-md rounded-2xl border bg-background/85 p-5 shadow-float backdrop-blur">
      <p className="font-medium">{destructive ? "删除项目" : "转移项目"}</p>
      <p className="mt-1 text-sm text-muted-foreground">{destructive ? "38 个看板和全部历史数据会一起删除，无法恢复。" : "把项目转给另一个团队，成员权限会重置。"}</p>
      <div className="mt-4 flex justify-end">
        <ConfirmDialog
          trigger={<Button variant={destructive ? "destructive" : "outline"}>{destructive && <Trash2 />}{destructive ? "删除项目" : "转移项目"}</Button>}
          title={destructive ? "删除 tally-web？" : "转移 tally-web？"}
          description={destructive ? "项目下的 38 个看板会一起删除，无法恢复。" : "转移后，你会失去这个项目的管理员权限。"}
          tone={destructive ? "destructive" : "default"}
          confirmLabel={destructive ? "删除" : "转移"}
          confirmText={values.confirmText ? "tally-web" : undefined}
          onConfirm={() => new Promise((ok, no) => setTimeout(() => {
            if (values.result === "error") no(new Error("网络中断，项目没有删除。请重试。"));
            else { ok(null); toast.success(destructive ? "已删除 tally-web" : "已转移 tally-web"); }
          }, Number(values.latency)))}
        />
      </div>
    </div>
  );
}
