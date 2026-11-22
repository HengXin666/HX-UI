import * as React from "react";
import { FileText, FileImage, FileArchive } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { DemoProps } from "../types";

const FILES = [
  { name: "合同-2026Q4.pdf", size: "2.4 MB", icon: FileText, speed: 9 },
  { name: "商品主图.png", size: "8.1 MB", icon: FileImage, speed: 4 },
  { name: "历史订单.zip", size: "64 MB", icon: FileArchive, speed: 1.5 },
];

/** 真实场景: 上传列表 */
export default function ProgressDemo({ values }: DemoProps) {
  const [p, setP] = React.useState([62, 28, 6]);
  React.useEffect(() => {
    if (values.indeterminate) return;
    const t = setInterval(() => setP((old) => old.map((v, i) => (v >= 100 ? 100 : Math.min(100, Math.round(v + FILES[i].speed))))), 600);
    return () => clearInterval(t);
  }, [values.indeterminate]);
  const size = values.size as "sm" | "default" | "lg";
  return (
    <div className="w-full max-w-md rounded-2xl border bg-background/85 p-5 shadow-float backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="font-medium">上传文件</p>
        <button type="button" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setP([0, 0, 0])}>重新开始</button>
      </div>
      <ul className="mt-4 grid gap-4">
        {FILES.map((f, i) => {
          const done = p[i] >= 100;
          const tone = done ? "success" : (values.tone as "default");
          return (
            <li key={f.name} className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
              <f.icon aria-hidden className="row-span-2 mt-0.5 size-5 text-muted-foreground" />
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span id={`up-${i}`} className="truncate">{f.name}</span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{values.indeterminate ? "处理中" : done ? "完成" : `${Math.round(p[i])}% · ${f.size}`}</span>
              </div>
              <Progress value={values.indeterminate ? null : p[i]} size={size} tone={tone} aria-labelledby={`up-${i}`} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
