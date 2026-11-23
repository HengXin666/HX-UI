import { Particles, type ParticleShape } from "@/backgrounds/particles";
import { useTheme } from "@/hooks/use-theme";
import type { DemoProps } from "../types";
import { PARTICLE_PALETTES } from "./particles";

export default function ParticlesDemo({ values: v }: DemoProps) {
  const { resolved } = useTheme();
  const n = (k: string) => Number(v[k]);
  const b = (k: string) => Boolean(v[k]);
  return (
    <Particles
      particleColors={PARTICLE_PALETTES[String(v.palette)].colors}
      shape={v.shape as ParticleShape}
      drift={v.drift as "none"}
      hoverEffect={v.hoverEffect as "parallax"}
      particleCount={n("particleCount")}
      particleSpread={n("particleSpread")}
      particleBaseSize={n("particleBaseSize")}
      sizeRandomness={n("sizeRandomness")}
      speed={n("speed")}
      glow={n("glow")}
      twinkle={n("twinkle")}
      depthOfField={n("depthOfField")}
      driftSpeed={n("driftSpeed")}
      connectionDistance={n("connectionDistance")}
      particleHoverFactor={n("particleHoverFactor")}
      hoverRadius={n("hoverRadius")}
      cameraDistance={n("cameraDistance")}
      variation={n("variation")}
      opacity={n("opacity")}
      connections={b("connections")}
      moveParticlesOnHover={b("moveParticlesOnHover")}
      clickBurst={b("clickBurst")}
      softParticles={b("softParticles")}
      disableRotation={b("disableRotation")}
      intro={b("intro")}
      lightMode={b("lightMode") || resolved === "light"}
      className="absolute inset-0"
    />
  );
}
