import { Activity, Gauge, ShieldCheck } from "lucide-react";
import { SpotlightCard } from "@/effects/spotlight-card";
import type { DemoProps } from "../types";

const ITEMS = [
  { icon: Gauge, title: "按需加载", text: "动画特性包空闲时再加载。" },
  { icon: ShieldCheck, title: "读屏友好", text: "每个组件都过 axe 检查。" },
  { icon: Activity, title: "只动 transform", text: "不触发布局，滚动不掉帧。" },
];

export default function SpotlightCardDemo({ values }: DemoProps) {
  return (
    <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-3">
      {ITEMS.map(({ icon: Icon, title, text }) => (
        <SpotlightCard key={title} color={String(values.color)} size={Number(values.size)} className="p-5">
          <Icon className="size-5 text-muted-foreground" />
          <p className="mt-6 font-medium">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{text}</p>
        </SpotlightCard>
      ))}
    </div>
  );
}
