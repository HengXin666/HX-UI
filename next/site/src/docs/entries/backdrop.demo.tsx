import { Backdrop } from "@/effects/backdrop";
import type { DemoProps } from "../types";

export default function BackdropDemo({ values }: DemoProps) {
  return (
    <div className="relative grid h-[340px] w-full max-w-4xl place-items-center overflow-hidden rounded-xl border bg-background">
      <Backdrop variant={values.variant as "grid" | "dots" | "aurora" | "glow"} size={Number(values.size)} />
      <div className="relative text-center">
        <p className="font-mono text-xs tracking-wide text-muted-foreground">HX-UI 2</p>
        <p className="mt-3 text-4xl font-medium tracking-[-0.04em] sm:text-6xl">一屏一个主角</p>
      </div>
    </div>
  );
}
