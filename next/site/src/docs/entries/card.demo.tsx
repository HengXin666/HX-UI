import { Activity, Gauge, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DemoProps } from "../types";

const ITEMS = [
  { icon: Gauge, title: "按需加载", text: "动画特性包空闲时再加载。" },
  { icon: ShieldCheck, title: "读屏友好", text: "每个组件都过 axe 检查。", featured: true },
  { icon: Activity, title: "只动 transform", text: "不触发布局，滚动不掉帧。" },
];

/** 特性卡片组. beam 只给中间那张, 它是用来标出推荐项的 */
export default function CardDemo({ values }: DemoProps) {
  const effect = values.effect as "none" | "spotlight" | "beam";
  const color = effect === "beam" ? String(values.beamColor) : String(values.spotColor);
  return (
    <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-3">
      {ITEMS.map(({ icon: Icon, title, text, featured }) => (
        <Card key={title} effect={effect === "beam" && !featured ? "none" : effect} effectColor={color} className="gap-4">
          <CardHeader>
            <Icon aria-hidden className="size-5 text-muted-foreground" />
            <CardTitle className="mt-4">{title}</CardTitle>
            <CardDescription>{text}</CardDescription>
          </CardHeader>
          {featured && effect === "beam" && <CardContent><span className="font-mono text-xs text-muted-foreground">推荐</span></CardContent>}
        </Card>
      ))}
    </div>
  );
}
