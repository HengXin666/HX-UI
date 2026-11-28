import { TiltCard } from "@/effects/tilt-card";
import type { DemoProps } from "../types";

/** 一张银行卡: 渐变底 + 芯片 + 卡号, 纯 CSS 画, 不依赖图片 */
export default function TiltCardDemo({ values }: DemoProps) {
  return (
    <TiltCard max={Number(values.max)} scale={Number(values.scale)} glare={Boolean(values.glare)} className="rounded-2xl shadow-float">
      <div className="relative flex aspect-[1.586] w-80 flex-col justify-between overflow-hidden rounded-2xl bg-[linear-gradient(135deg,oklch(0.35_0.15_280),oklch(0.25_0.12_320)_55%,oklch(0.2_0.06_260))] p-6 text-white sm:w-96">
        <div aria-hidden className="absolute -top-16 -right-10 size-56 rounded-full bg-[oklch(0.7_0.2_330/0.35)] blur-3xl" />
        <div className="relative flex items-start justify-between">
          <span className="font-medium tracking-tight">HX Card</span>
          <span className="font-mono text-xs text-white/70">DEBIT</span>
        </div>
        <div aria-hidden className="relative h-9 w-12 rounded-md bg-[linear-gradient(135deg,oklch(0.85_0.1_85),oklch(0.65_0.1_75))]" />
        <div className="relative">
          <p className="font-mono text-lg tracking-[0.18em]">6222 •••• •••• 0921</p>
          <p className="mt-2 flex justify-between font-mono text-xs text-white/70"><span>LIN XIAO</span><span>11/29</span></p>
        </div>
      </div>
    </TiltCard>
  );
}
