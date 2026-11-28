import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { DemoProps } from "../types";

export function fireToast(values: DemoProps["values"]) {
  const description = values.description ? "tally-web · main · 2026-11-22 17:20" : undefined;
  const duration = Number(values.duration) * 1000;
  const action = values.action ? { label: "撤销", onClick: () => toast("已撤销") } : undefined;
  switch (values.type) {
    case "error": return toast.error("部署失败", { description, duration, action });
    case "warning": return toast.warning("用量已到 80%", { description, duration, action });
    case "info": return toast.info("有新版本可用", { description, duration, action });
    case "promise":
      return toast.promise(new Promise((ok) => setTimeout(ok, 1600)), { loading: "正在部署…", success: "部署完成", error: "部署失败", description, duration });
    default: return toast.success("已归档 3 个项目", { description, duration, action });
  }
}

/** 真实场景: 操作后的轻提示. 它不打断用户, 几秒后自己消失 */
export default function ToastDemo({ values }: DemoProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={() => fireToast(values)}>弹出提示</Button>
      <div className="flex flex-wrap justify-center gap-2">
        {[["success", "成功"], ["error", "失败"], ["warning", "警告"], ["info", "信息"], ["promise", "异步"]].map(([t, l]) => (
          <Button key={t} size="sm" variant="outline" onClick={() => fireToast({ ...values, type: t })}>{l}</Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">提示出现在页面右下角。</p>
    </div>
  );
}
