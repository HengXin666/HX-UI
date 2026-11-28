import { CircleCheck, Info, OctagonAlert, TriangleAlert, Bell } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { DemoProps } from "../types";

type V = "default" | "info" | "success" | "warning" | "destructive";
const COPY: Record<V, { icon: React.ElementType; title: string; desc: string; action: string }> = {
  default: { icon: Bell, title: "周报已生成", desc: "第 47 周的对账周报可以下载了。", action: "下载" },
  info: { icon: Info, title: "11 月 30 日 02:00 维护", desc: "数据库升级，预计 20 分钟，期间只读。", action: "查看详情" },
  success: { icon: CircleCheck, title: "域名已验证", desc: "tally.so 的 DNS 记录已生效，HTTPS 证书正在签发。", action: "去配置" },
  warning: { icon: TriangleAlert, title: "本月用量已到 82%", desc: "按目前速度，预计 11 月 27 日超出套餐额度。", action: "升级套餐" },
  destructive: { icon: OctagonAlert, title: "付款失败", desc: "尾号 4242 的卡被拒，服务将在 3 天后暂停。", action: "更换付款方式" },
};

export default function AlertDemo({ values }: DemoProps) {
  const v = values.variant as V;
  const c = COPY[v];
  const Icon = c.icon;
  return (
    <div className="w-full max-w-lg">
      <Alert variant={v}>
        {values.icon ? <Icon /> : null}
        <AlertTitle>{c.title}</AlertTitle>
        <AlertDescription>{c.desc}</AlertDescription>
        {values.action ? (
          <AlertAction>
            <Button size="sm" variant={v === "destructive" ? "destructive" : "outline"}>{c.action}</Button>
          </AlertAction>
        ) : null}
      </Alert>
    </div>
  );
}
