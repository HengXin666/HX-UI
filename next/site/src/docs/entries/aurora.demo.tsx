import { Aurora } from "@/backgrounds/aurora";
import type { DemoProps } from "../types";
import { PALETTES } from "./_visual";

export default function AuroraDemo({ values: v }: DemoProps) {
  return (
    <Aurora
      colorStops={PALETTES[String(v.palette)].colors}
      amplitude={Number(v.amplitude)}
      blend={Number(v.blend)}
      height={Number(v.height)}
      speed={Number(v.speed)}
      scale={Number(v.scale)}
      glow={Number(v.glow)}
      brightness={Number(v.brightness)}
      layers={Number(v.layers)}
      direction={v.direction as "top" | "bottom"}
      mouseInteraction={Boolean(v.mouseInteraction)}
      intro={Boolean(v.intro)}
      opacity={Number(v.opacity)}
      lightMode={Boolean(v.lightMode)}
      className="absolute inset-0"
    >
      {v.title ? (
        <div className="grid h-full place-items-center px-6 text-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">HX-UI 2</p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.035em] sm:text-6xl">把光放进首屏</p>
          </div>
        </div>
      ) : null}
    </Aurora>
  );
}
