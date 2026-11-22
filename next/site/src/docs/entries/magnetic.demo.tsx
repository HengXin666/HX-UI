import { ArrowRight } from "lucide-react";
import { Magnetic } from "@/effects/magnetic";
import type { DemoProps } from "../types";

export default function MagneticDemo({ values }: DemoProps) {
  const s = Number(values.strength);
  return (
    <div className="flex flex-col items-center gap-10">
      <p className="text-sm text-muted-foreground">把指针移到按钮附近</p>
      <div className="flex flex-wrap items-center justify-center gap-6">
        <Magnetic strength={s}>
          <button type="button" className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background">开始使用 <ArrowRight className="size-4" /></button>
        </Magnetic>
        <Magnetic strength={s * 1.6}>
          <button type="button" aria-label="下一页" className="grid size-12 place-items-center rounded-full border"><ArrowRight className="size-5" /></button>
        </Magnetic>
      </div>
    </div>
  );
}
